// The sign-in page's and the account menu's talk with the server (story 1.3, S-26). The one
// failure message is the server's own refusal (CAP-2); the wait is composed here from the
// refusal's seconds with `waitWording` (D-8, A-19), the same for every email. No message here ever
// repeats what was typed or says whether an email has an account (AD-22, FR-67).
//
// This module imports only files Node can load as they are, so `tests/signin-client.test.mjs` runs
// it under `node --test`; the app's header comes from shared/routes.ts when a request is sent
// (`postJson.js`, whose one deadline covers that load and the request).
import { REFUSALS } from '../../shared/refusal.ts';
import { NO_ANSWER, appHeaders, postJson } from './postJson.js';
import { readSession } from './setupState.js';
import { waitWording } from './waitWording.js';

const SIGN_IN_URL = '/api/v1/session/sign-in';
const SECOND_STEP_URL = '/api/v1/session/second-step';
const SIGN_OUT_URL = '/api/v1/session/sign-out';

/** The fields in page order: the order a refusal's focus follows. */
export const SIGN_IN_FIELDS = ['email', 'password'];

export const SIGN_IN_MESSAGES = {
  failed: REFUSALS.signin_failed.message,
  busy: 'Site Survey Design is busy. Try again in a moment.',
  origin_refused: "Sign-in must be sent from this installation's own page. Open the sign-in page from its address and try again.",
  updating: 'Site Survey Design is updating. Try again in a moment.',
  https_required: "Sign-in must be sent over HTTPS. Open this installation's https:// address and sign in from there.",
  data_newer_than_build:
    'This installation holds data from a newer release of Site Survey Design than the one running here. Install that release or a newer one, then open this page again.',
  update_not_completed:
    'An update of this installation was not completed, so sign-in cannot run. Complete the update, then open this page again.',
  not_found: "This server does not offer sign-in at this address. Check that you opened this installation's own address.",
  invalid_input: 'Some of the details were not accepted. Check each field and try again.',
  network: 'The server could not be reached. Check the connection and try again.',
  other: 'Sign-in could not be completed. Try again.',
};

/** D-8's sentence, composed on the page from the refusal's seconds (A-19). */
export function waitMessage(seconds) {
  return `Too many attempts. Wait ${waitWording(seconds)} before trying again.`;
}

/** A wait's seconds: the refusal's own, else the `Retry-After` header, else unknown. */
function waitSeconds(error, retryAfter) {
  if (Number.isFinite(error.retryAfterSeconds)) return error.retryAfterSeconds;
  return retryAfter === null || retryAfter === undefined ? undefined : Number(retryAfter);
}

/** The refusal's own message, or `shared/refusal.ts`'s for its code when the reply has none. */
function refusalMessage(error, code) {
  return typeof error.message === 'string' && error.message ? error.message : REFUSALS[code].message;
}

/**
 * Maps a sign-in reply to what the page shows. `body` is the parsed JSON or `null`;
 * `retryAfter` is the `Retry-After` header or `null`. Returns one of
 * `{ kind: 'signedIn', name }`, `{ kind: 'secondStep' }` (story 1.5, D-12: the account has two-step
 * verification on, and the page asks for a code), `{ kind: 'field', field }` (the page words the
 * field's message) or `{ kind: 'refused', message }`.
 */
export function signInOutcome(status, body, retryAfter = null) {
  if (status >= 200 && status < 300) {
    const keys = body && typeof body === 'object' ? Object.keys(body) : [];
    if (keys.length === 1 && typeof body.name === 'string') return { kind: 'signedIn', name: body.name };
    if (keys.length === 1 && body.secondStep === true) return { kind: 'secondStep' };
    return { kind: 'refused', message: SIGN_IN_MESSAGES.other };
  }
  const error = body?.error ?? {};
  switch (error.code) {
    case 'signin_failed':
      // The server's own words: one message for every email, account and fault (CAP-2).
      return { kind: 'refused', message: typeof error.message === 'string' && error.message ? error.message : SIGN_IN_MESSAGES.failed };
    case 'signin_wait':
      return { kind: 'refused', message: waitMessage(waitSeconds(error, retryAfter)) };
    case 'signin_busy':
      return { kind: 'refused', message: SIGN_IN_MESSAGES.busy };
    case 'invalid_input':
      if (SIGN_IN_FIELDS.includes(error.field)) return { kind: 'field', field: error.field };
      return { kind: 'refused', message: SIGN_IN_MESSAGES.invalid_input };
    case 'origin_refused':
    case 'updating':
    case 'https_required':
    case 'data_newer_than_build':
    case 'update_not_completed':
    case 'not_found':
      return { kind: 'refused', message: SIGN_IN_MESSAGES[error.code] };
    case 'method_not_allowed':
    case 'not_available':
      return { kind: 'refused', message: SIGN_IN_MESSAGES.not_found };
    default:
      return { kind: 'refused', message: SIGN_IN_MESSAGES.other };
  }
}

/**
 * Maps a second-step reply (story 1.5, D-13) to what the page shows, as `signInOutcome` does.
 * Returns one of
 * - `{ kind: 'signedIn', name }`: the code was right, a session is set;
 * - `{ kind: 'refused', message }`: a wrong or used code or recovery code, or any other failure;
 *   the page stays on the second step and keeps the field's value;
 * - `{ kind: 'restart', message }`: the pending sign-in has ended (`second_step_expired`, or a wait
 *   began, `signin_wait`); the page returns to the password form with the message;
 * - `{ kind: 'keyMismatch', message }`: codes cannot be checked on this installation; the page
 *   offers the recovery code (finding 26);
 * - `{ kind: 'field', field: 'code' }`: the server did not accept the field's form.
 * No message holds what was typed.
 */
export function secondStepOutcome(status, body, retryAfter = null) {
  if (status >= 200 && status < 300) {
    const keys = body && typeof body === 'object' ? Object.keys(body) : [];
    if (keys.length === 1 && typeof body.name === 'string') return { kind: 'signedIn', name: body.name };
    return { kind: 'refused', message: SIGN_IN_MESSAGES.other };
  }
  const error = body?.error ?? {};
  switch (error.code) {
    case 'second_step_code_wrong':
    case 'second_step_recovery_code_wrong':
      return { kind: 'refused', message: refusalMessage(error, error.code) };
    case 'second_step_expired':
      return { kind: 'restart', message: refusalMessage(error, error.code) };
    case 'signin_wait':
      return { kind: 'restart', message: waitMessage(waitSeconds(error, retryAfter)) };
    case 'deployment_key_mismatch':
      return { kind: 'keyMismatch', message: refusalMessage(error, error.code) };
    case 'invalid_input':
      if (error.field === 'code') return { kind: 'field', field: 'code' };
      return { kind: 'refused', message: SIGN_IN_MESSAGES.invalid_input };
    default:
      // Every other code and a reply of no known shape, worded as for the first step.
      return signInOutcome(status, body, retryAfter);
  }
}

/**
 * Sends the second step `{ method: 'code' | 'recovery', code }` (the code already normalised by the
 * page); resolves as `secondStepOutcome` does, or refused with the network message when there is no
 * answer within the deadline.
 */
export async function submitSecondStep(input, fetcher = fetch, { timeoutMs = SIGN_IN_TIMEOUT_MS, loadHeaders = appHeaders, signal, onResponse } = {}) {
  const reply = await postJson(fetcher, SECOND_STEP_URL, JSON.stringify({ method: input.method, code: input.code }), { timeoutMs, loadHeaders, signal, onResponse });
  if (reply === NO_ANSWER) return { kind: 'refused', message: SIGN_IN_MESSAGES.network };
  return secondStepOutcome(reply.status, reply.body, reply.retryAfter);
}

/** True only when the sign-out reply confirms the caller is no longer signed in (E-6). */
export function signOutConfirmed(status, body) {
  return status >= 200 && status < 300 && body?.signedIn === false;
}

/**
 * How long each request may take, loading the app's header included, before it counts as no
 * answer. Signing in includes a deliberately slow hash, as accepting an invitation does.
 */
export const SIGN_IN_TIMEOUT_MS = 30000;
export const SIGN_OUT_TIMEOUT_MS = 15000;

/**
 * Sends the sign-in request; resolves as `signInOutcome` does, or refused with the network message
 * when there is no answer within the deadline (a stalled header load included).
 */
export async function submitSignIn(input, fetcher = fetch, { timeoutMs = SIGN_IN_TIMEOUT_MS, loadHeaders = appHeaders } = {}) {
  const reply = await postJson(fetcher, SIGN_IN_URL, JSON.stringify(input), { timeoutMs, loadHeaders });
  if (reply === NO_ANSWER) return { kind: 'refused', message: SIGN_IN_MESSAGES.network };
  return signInOutcome(reply.status, reply.body, reply.retryAfter);
}

/**
 * One second-step request that the page can abandon (pull request 13, review round 2; orchestrator
 * ruling of 2026-11-24): `send(input)` resolves to the outcomes `secondStepOutcome` gives, except
 * that a 200 whose body did not arrive is settled by a session read (see below); `abandon()` aborts
 * it, so a reply whose headers have not arrived is dropped by the browser with its cookies, and
 * answers true only when a success's headers had already arrived (the browser then holds the
 * session the server set, which the page must end). A request that has already settled is not
 * abandoned (false).
 */
export function createSecondStepRun(fetcher = fetch, { timeoutMs = SIGN_IN_TIMEOUT_MS, loadHeaders = appHeaders, sessionReader = readSession } = {}) {
  const controller = new AbortController();
  let status = null;
  let settled = false;
  async function send(input) {
    const reply = await postJson(fetcher, SECOND_STEP_URL, JSON.stringify({ method: input.method, code: input.code }), {
      timeoutMs,
      loadHeaders,
      signal: controller.signal,
      onResponse: (response) => { status = response.status; },
    });
    const bodyMissing = reply === NO_ANSWER ? status === 200 && !controller.signal.aborted : reply.status === 200 && reply.bodyUnreadable;
    if (reply !== NO_ANSWER && !bodyMissing) return secondStepOutcome(reply.status, reply.body, reply.retryAfter);
    if (!bodyMissing) return { kind: 'refused', message: SIGN_IN_MESSAGES.network };
    // A 200 whose body did not arrive (the time limit passed, or it was cut off): its headers may
    // have set the session, or may be an intermediary's. The session read tells: signed in is a
    // sign-in (the name from the session); signed out, or a read that fails, is the existing
    // refusal. A complete body of the wrong shape stays a refusal (pull request 13, review round 3;
    // orchestrator ruling of 2026-11-25). The read runs inside this run but takes no signal (it has
    // its own deadline): leaving the second step meanwhile discards its result, and the page signs
    // out as on any abandon.
    let session;
    try {
      session = await sessionReader(fetcher);
    } catch {
      session = { kind: 'unknown' };
    }
    if (controller.signal.aborted) return { kind: 'refused', message: SIGN_IN_MESSAGES.network };
    if (session.kind === 'signedIn') return { kind: 'signedIn', name: session.name };
    return { kind: 'refused', message: SIGN_IN_MESSAGES.other };
  }
  return {
    send: (input) => send(input).finally(() => { settled = true; }),
    abandon() {
      if (settled) return false;
      controller.abort();
      return status === 200;
    },
  };
}

/**
 * Sends the sign-out request; resolves to true only when the server confirmed it, and to false
 * when there is no answer within the deadline (the page then stays signed in and says so).
 */
export async function requestSignOut(fetcher = fetch, { timeoutMs = SIGN_OUT_TIMEOUT_MS, loadHeaders = appHeaders } = {}) {
  const reply = await postJson(fetcher, SIGN_OUT_URL, '{}', { timeoutMs, loadHeaders });
  if (reply === NO_ANSWER) return false;
  return signOutConfirmed(reply.status, reply.body);
}
