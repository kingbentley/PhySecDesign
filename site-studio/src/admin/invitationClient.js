// The invite panel's and the invitation page's talk with the server (story 1.4, S-27, S-30):
// invite, read and accept, each mapped to what the panel or page shows. No message here ever
// repeats what was typed or the secret (AD-22, standing rule 14); the secret travels only in a
// JSON body (D-1).
//
// This module imports nothing from shared/ except refusal.ts, as signInClient.js does, so
// `tests/invitation-client.test.mjs` runs it under `node --test` (review finding 8); the app's
// header comes from shared/routes.ts when a request is sent (`postJson.js`).
import { REFUSALS } from '../../shared/refusal.ts';
import { NO_ANSWER, appHeaders, postJson } from './postJson.js';

const INVITE_URL = '/api/v1/invitations';
const READ_URL = '/api/v1/invitations/read';
const ACCEPT_URL = '/api/v1/invitations/accept';

/** How long each request may take before it counts as no answer. Accepting includes a slow hash. */
export const INVITE_TIMEOUT_MS = 15000;
export const READ_TIMEOUT_MS = 10000;
export const ACCEPT_TIMEOUT_MS = 30000;

/** The invite panel's fields, in page order. */
export const INVITE_FIELDS = ['email', 'name', 'role'];
/** The invitation page's fields, in page order: the order a refusal's focus follows. */
export const ACCEPT_FIELDS = ['name', 'password', 'passwordAgain'];

/** Wording outside D-11, reused from the sign-in and set-up pages where it exists (spec 3). */
export const INVITATION_MESSAGES = {
  emailTaken: REFUSALS.invitation_email_taken.message,
  unusable: REFUSALS.invitation_unusable.message,
  network: 'The server could not be reached. Check the connection and try again.',
  busy: 'Site Survey Design is busy. Try again in a moment.',
  updating: 'Site Survey Design is updating. Try again in a moment.',
  inviteOther: 'The invitation could not be created. Try again.',
  invalidInput: 'Some of the details were not accepted. Check each field and try again.',
  acceptFailed:
    'Your password may not have been set. Try again; if the link then no longer works, try signing in with your email and this password.',
  reopen: 'Open the invitation link again to continue.',
};

const isObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

function refusalOf(body) {
  return isObject(body?.error) ? body.error : {};
}

/**
 * Maps an invite reply to what the panel shows. Returns one of
 * `{ kind: 'invited', link, expiresAt }`, `{ kind: 'field', field, message }` (a refusal naming a
 * panel field), `{ kind: 'signedOut' }` (`not_signed_in`: the sign-in page shows), or
 * `{ kind: 'refused', message }` (shown above the panel's button).
 */
export function inviteOutcome(status, body) {
  if (status >= 200 && status < 300) {
    if (isObject(body) && typeof body.link === 'string' && /\/invite#[A-Za-z0-9_-]{43}$/.test(body.link)
      && typeof body.expiresAt === 'string' && !Number.isNaN(Date.parse(body.expiresAt))) {
      return { kind: 'invited', link: body.link, expiresAt: body.expiresAt };
    }
    return { kind: 'refused', message: INVITATION_MESSAGES.inviteOther };
  }
  const error = refusalOf(body);
  switch (error.code) {
    case 'invitation_email_taken':
      return { kind: 'field', field: 'email', message: INVITATION_MESSAGES.emailTaken };
    case 'invalid_input':
      if (INVITE_FIELDS.includes(error.field)) return { kind: 'field', field: error.field, message: null };
      return { kind: 'refused', message: INVITATION_MESSAGES.invalidInput };
    case 'not_signed_in':
      return { kind: 'signedOut' };
    case 'updating':
      return { kind: 'refused', message: INVITATION_MESSAGES.updating };
    default:
      // A refusal that names no field shows its server message; anything else is a failure.
      if (typeof error.code === 'string' && Object.prototype.hasOwnProperty.call(REFUSALS, error.code)) {
        return { kind: 'refused', message: REFUSALS[error.code].message };
      }
      return { kind: 'refused', message: status >= 500 ? INVITATION_MESSAGES.network : INVITATION_MESSAGES.inviteOther };
  }
}

/**
 * Maps an invitation read's reply to what the page shows. Returns one of
 * `{ kind: 'invitation', invitation }` (`{ inviterName, installationName, email, name, role }`),
 * `{ kind: 'unusable' }` (D-3), `{ kind: 'updating' }` (the update wording with Try again; Kevin,
 * 2026-11-21), or `{ kind: 'unknown' }` ("The invitation cannot be checked").
 */
export function readOutcome(status, body) {
  if (status >= 200 && status < 300) {
    if (isObject(body)
      && ['inviterName', 'installationName', 'email', 'name'].every((key) => typeof body[key] === 'string')
      && (body.role === 'administrator' || body.role === 'standard')) {
      const { inviterName, installationName, email, name, role } = body;
      return { kind: 'invitation', invitation: { inviterName, installationName, email, name, role } };
    }
    return { kind: 'unknown' };
  }
  const error = refusalOf(body);
  // A secret the input schema refuses (empty or over-long) is a link that does not work either.
  if (error.code === 'invitation_unusable' || (error.code === 'invalid_input' && error.field === 'secret')) return { kind: 'unusable' };
  // During an update the page says so rather than "check the connection" (Kevin, 2026-11-21).
  if (error.code === 'updating') return { kind: 'updating' };
  return { kind: 'unknown' };
}

/**
 * Maps an accept reply to what the page shows. Returns one of `{ kind: 'accepted', name }`,
 * `{ kind: 'unusable' }`, `{ kind: 'busy' }`, `{ kind: 'field', field }` (`name` or `password`),
 * or `{ kind: 'failed' }` (no answer, a timeout, `internal_error`, `updating`, or any other
 * refusal: the password may have been set; review finding 7).
 */
export function acceptOutcome(status, body) {
  if (status >= 200 && status < 300) {
    if (isObject(body) && typeof body.name === 'string') return { kind: 'accepted', name: body.name };
    return { kind: 'failed' };
  }
  const error = refusalOf(body);
  switch (error.code) {
    case 'invitation_unusable':
      return { kind: 'unusable' };
    case 'signin_busy':
      return { kind: 'busy' };
    case 'invalid_input':
      if (error.field === 'password' || error.field === 'name') return { kind: 'field', field: error.field };
      return { kind: 'failed' };
    default:
      return { kind: 'failed' };
  }
}

/**
 * Posts `input` as JSON under `postJson`'s one deadline, which covers loading the app's header as
 * well as the request (pull request 12, review round 1); resolves as `postJson` does.
 */
function post(fetcher, url, input, timeoutMs, loadHeaders) {
  return postJson(fetcher, url, JSON.stringify(input), { timeoutMs, loadHeaders });
}

/** Sends the invite request (`{ email, name, role }`); resolves as `inviteOutcome` does. */
export async function submitInvite(input, fetcher = fetch, { timeoutMs = INVITE_TIMEOUT_MS, loadHeaders = appHeaders } = {}) {
  const reply = await post(fetcher, INVITE_URL, input, timeoutMs, loadHeaders);
  if (reply === NO_ANSWER) return { kind: 'refused', message: INVITATION_MESSAGES.network };
  return inviteOutcome(reply.status, reply.body);
}

/** Reads the invitation for `secret`; resolves as `readOutcome` does. */
export async function readInvitation(secret, fetcher = fetch, { timeoutMs = READ_TIMEOUT_MS, loadHeaders = appHeaders } = {}) {
  const reply = await post(fetcher, READ_URL, { secret }, timeoutMs, loadHeaders);
  if (reply === NO_ANSWER) return { kind: 'unknown' };
  return readOutcome(reply.status, reply.body);
}

/** Sends the accept request (`{ secret, name, password }`); resolves as `acceptOutcome` does. */
export async function submitAccept(input, fetcher = fetch, { timeoutMs = ACCEPT_TIMEOUT_MS, loadHeaders = appHeaders } = {}) {
  const reply = await post(fetcher, ACCEPT_URL, input, timeoutMs, loadHeaders);
  if (reply === NO_ANSWER) return { kind: 'failed' };
  return acceptOutcome(reply.status, reply.body);
}
