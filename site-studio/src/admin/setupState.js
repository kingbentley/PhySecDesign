// The set-up state and session reads the app makes when it starts (stories 1.2 and 1.3). Kept apart
// from the set-up and sign-in pages' code, with no imports, so that the prototype's bundle does not
// carry the pages or their rules.
//
// Each read tells "no server" apart from "cannot be checked" (story 1.3, D-7 amended and amended
// again). Only the set-up state read, the first one, can find no server: a 404 (whatever its body)
// or a reply that is not JSON means there is no server here (as in the Sites package), and the
// prototype opens. A network failure, no answer within 5 seconds, a 5xx, a JSON reply with any
// other failure status (the server's refusal envelope or not), or JSON that is not the declared
// reply means a server is there but could not say, and the app shows a page with Try again. The session
// read is made only once the set-up state has answered, so a server is known to be there: any reply
// to it that is not the declared one cannot be checked (fail closed, story 1.3 code review).
// Extra fields in a reply are ignored, so a later field does not hide the sign-in page.

/** The set-up page's address. */
export const SETUP_PATH = '/setup';
const STATE_URL = '/api/v1/setup/state';
const SESSION_URL = '/api/v1/session';
/** How long the app waits for a read before treating it as "cannot be checked". */
export const STATE_TIMEOUT_MS = 5000;

/** True for the set-up address, with or without a trailing slash. */
export function isSetupPath(pathname) {
  return pathname === SETUP_PATH || pathname === `${SETUP_PATH}/`;
}

const NO_SERVER = Symbol('no server');
const CANNOT_CHECK = Symbol('cannot check');

/**
 * Fetches a JSON read and returns its body, `NO_SERVER` or `CANNOT_CHECK`. A 404 (whatever its
 * body) or a reply that is not JSON is no server. A failure to answer, a 5xx, a refusal envelope
 * (`{ error: { code } }`), or JSON with any other failure status cannot be checked: something
 * answered in JSON, so the app fails closed.
 */
async function readJson(fetcher, url, signal) {
  let response;
  try {
    response = await fetcher(url, { headers: { accept: 'application/json' }, cache: 'no-store', credentials: 'same-origin', signal });
  } catch {
    return CANNOT_CHECK;
  }
  if (response.status >= 500) return CANNOT_CHECK;
  if (response.status === 404) return NO_SERVER;
  let body;
  try {
    body = await response.json();
  } catch (error) {
    // A body that is not JSON (an HTML page, an empty reply) is not this server; a connection
    // dropped or aborted while reading is a failure to answer. WebKit reports a body that is not
    // JSON as a DOMException named "SyntaxError", not a SyntaxError instance, so the name decides.
    return signal?.aborted || error?.name !== 'SyntaxError' ? CANNOT_CHECK : NO_SERVER;
  }
  // JSON came back, so something answered: a refusal envelope, or any other failure status (a 4xx
  // other than 404, for example a gateway's `403 {"message":"Forbidden"}`), cannot be checked.
  if (typeof body?.error?.code === 'string' || !response.ok) return CANNOT_CHECK;
  return body;
}

/** Runs `read` with an abort signal, resolving to `CANNOT_CHECK` if it has not answered in time. */
function withTimeout(read, timeoutMs) {
  const controller = new AbortController();
  let timer;
  const timedOut = new Promise((resolve) => {
    timer = setTimeout(() => {
      controller.abort();
      resolve(CANNOT_CHECK);
    }, timeoutMs);
  });
  return Promise.race([read(controller.signal), timedOut]).finally(() => clearTimeout(timer));
}

/**
 * Asks whether set-up is open. Resolves to "open" or "closed"; "none" where there is no server
 * (a 404 or a reply that is not JSON); "unknown" when a server could not say (a network failure,
 * no answer within `timeoutMs`, a 5xx, a refusal envelope, or JSON without an `open` or `closed`
 * state), so a server that never answers cannot leave the app blank.
 */
export async function readSetupState(fetcher = fetch, { timeoutMs = STATE_TIMEOUT_MS } = {}) {
  const body = await withTimeout((signal) => readJson(fetcher, STATE_URL, signal), timeoutMs);
  if (body === CANNOT_CHECK) return 'unknown';
  if (body === NO_SERVER) return 'none';
  if (body && typeof body === 'object' && !Array.isArray(body) && (body.state === 'open' || body.state === 'closed')) return body.state;
  // JSON that is not the declared reply still comes from a server: fail closed.
  return 'unknown';
}

/**
 * True when `body` is the session read's declared reply (`sessionReply` in shared/routes.ts, kept
 * free of imports here so the prototype's bundle stays small): `{ signedIn: false, installationName }`
 * or `{ signedIn: true, name, accountId, role, installationName }` (story 1.4, D-5). A signed-in
 * reply without a string `accountId` and a `role` of `administrator` or `standard` is not the
 * declared reply, so it cannot be checked (fail closed; review finding 2). Other fields are
 * ignored, so a field a later story adds does not make the read fail.
 */
export function isSessionReply(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
  const name = body.installationName;
  if (!(name === null || typeof name === 'string')) return false;
  if (body.signedIn === false) return true;
  if (body.signedIn === true) {
    return typeof body.name === 'string'
      && typeof body.accountId === 'string'
      && (body.role === 'administrator' || body.role === 'standard');
  }
  return false;
}

/**
 * Reads the session (story 1.3). Resolves to one of:
 * `{ kind: 'signedIn', name, accountId, role, installationName }`, `{ kind: 'signedOut', installationName }`, or
 * `{ kind: 'unknown' }` when the server could not say (the "Sign-in cannot be checked" page). It is
 * read only after the set-up state has answered, so a server is there: a 404, a reply that is not
 * JSON or not the declared reply is `unknown` too, never "no server" (fail closed). The session
 * cookie itself is never readable here: it is `HttpOnly`.
 */
export async function readSession(fetcher = fetch, { timeoutMs = STATE_TIMEOUT_MS } = {}) {
  const body = await withTimeout((signal) => readJson(fetcher, SESSION_URL, signal), timeoutMs);
  if (body === CANNOT_CHECK || body === NO_SERVER || !isSessionReply(body)) return { kind: 'unknown' };
  return body.signedIn
    ? { kind: 'signedIn', name: body.name, accountId: body.accountId, role: body.role, installationName: body.installationName }
    : { kind: 'signedOut', installationName: body.installationName };
}
