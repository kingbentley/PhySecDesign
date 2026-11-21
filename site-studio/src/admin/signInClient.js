// The sign-in page's and the account menu's talk with the server (story 1.3, S-26). The one
// failure message is the server's own refusal (CAP-2); the wait is composed here from the
// refusal's seconds with `waitWording` (D-8, A-19), the same for every email. No message here ever
// repeats what was typed or says whether an email has an account (AD-22, FR-67).
//
// This module imports only files Node can load as they are, so `tests/signin-client.test.mjs` runs
// it under `node --test`; the app's header comes from shared/routes.ts when a request is sent.
import { REFUSALS } from '../../shared/refusal.ts';
import { waitWording } from './waitWording.js';

const SIGN_IN_URL = '/api/v1/session/sign-in';
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

/**
 * Maps a sign-in reply to what the page shows. `body` is the parsed JSON or `null`;
 * `retryAfter` is the `Retry-After` header or `null`. Returns one of
 * `{ kind: 'signedIn', name }`, `{ kind: 'field', field }` (the page words the field's message)
 * or `{ kind: 'refused', message }`.
 */
export function signInOutcome(status, body, retryAfter = null) {
  if (status >= 200 && status < 300) {
    const keys = body && typeof body === 'object' ? Object.keys(body) : [];
    if (keys.length === 1 && typeof body.name === 'string') return { kind: 'signedIn', name: body.name };
    return { kind: 'refused', message: SIGN_IN_MESSAGES.other };
  }
  const error = body?.error ?? {};
  switch (error.code) {
    case 'signin_failed':
      // The server's own words: one message for every email, account and fault (CAP-2).
      return { kind: 'refused', message: typeof error.message === 'string' && error.message ? error.message : SIGN_IN_MESSAGES.failed };
    case 'signin_wait': {
      const seconds = Number.isFinite(error.retryAfterSeconds)
        ? error.retryAfterSeconds
        : retryAfter === null || retryAfter === undefined ? undefined : Number(retryAfter);
      return { kind: 'refused', message: waitMessage(seconds) };
    }
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

/** True only when the sign-out reply confirms the caller is no longer signed in (E-6). */
export function signOutConfirmed(status, body) {
  return status >= 200 && status < 300 && body?.signedIn === false;
}

async function appHeaders() {
  const { APP_HEADER, APP_HEADER_VALUE } = await import('../../shared/routes.ts');
  return { 'content-type': 'application/json', accept: 'application/json', [APP_HEADER]: APP_HEADER_VALUE };
}

async function readBody(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/** Sends the sign-in request; resolves as `signInOutcome` does, or refused when unreachable. */
export async function submitSignIn(input, fetcher = fetch) {
  let response;
  try {
    response = await fetcher(SIGN_IN_URL, {
      method: 'POST',
      headers: await appHeaders(),
      body: JSON.stringify(input),
      credentials: 'same-origin',
      cache: 'no-store',
    });
  } catch {
    return { kind: 'refused', message: SIGN_IN_MESSAGES.network };
  }
  return signInOutcome(response.status, await readBody(response), response.headers.get('retry-after'));
}

/** Sends the sign-out request; resolves to true only when the server confirmed it. */
export async function requestSignOut(fetcher = fetch) {
  try {
    const response = await fetcher(SIGN_OUT_URL, {
      method: 'POST',
      headers: await appHeaders(),
      body: '{}',
      credentials: 'same-origin',
      cache: 'no-store',
    });
    return signOutConfirmed(response.status, await readBody(response));
  } catch {
    return false;
  }
}
