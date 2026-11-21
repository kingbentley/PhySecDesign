// The set-up state and session reads the app makes when it starts (stories 1.2 and 1.3). Kept apart
// from the set-up and sign-in pages' code, with no imports, so that the prototype's bundle does not
// carry the pages or their rules.
//
// Each read tells "no server" apart from "cannot be checked" (story 1.3, D-7 amended and amended
// again): a 404, or a reply that is not the declared JSON, means there is no server here (as in the
// Sites package), and the prototype opens; a network failure, no answer within 5 seconds, a 5xx or
// an `updating` refusal means the server could not say, and the app shows a page with Try again.

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
 * Fetches a JSON read and returns its body, `NO_SERVER` or `CANNOT_CHECK`. A 404 or a reply that is
 * not JSON is no server; a failure to answer, a 5xx or an `updating` refusal cannot be checked.
 * Any other reply that is not a success is not this server's declared reply either: no server.
 */
async function readJson(fetcher, url, signal) {
  let response;
  try {
    response = await fetcher(url, { headers: { accept: 'application/json' }, cache: 'no-store', credentials: 'same-origin', signal });
  } catch {
    return CANNOT_CHECK;
  }
  if (response.status >= 500) return CANNOT_CHECK;
  let body;
  try {
    body = await response.json();
  } catch (error) {
    // A body that is not JSON (an HTML page, an empty reply) is not this server; a connection
    // dropped or aborted while reading is a failure to answer. WebKit reports a body that is not
    // JSON as a DOMException named "SyntaxError", not a SyntaxError instance, so the name decides.
    return signal?.aborted || error?.name !== 'SyntaxError' ? CANNOT_CHECK : NO_SERVER;
  }
  if (body?.error?.code === 'updating') return CANNOT_CHECK;
  if (!response.ok) return NO_SERVER;
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
 * (a 404 or a reply that is not the declared JSON); "unknown" when the server could not say (a
 * network failure, no answer within `timeoutMs`, a 5xx or `updating`), so a server that never
 * answers cannot leave the app blank.
 */
export async function readSetupState(fetcher = fetch, { timeoutMs = STATE_TIMEOUT_MS } = {}) {
  const body = await withTimeout((signal) => readJson(fetcher, STATE_URL, signal), timeoutMs);
  if (body === CANNOT_CHECK) return 'unknown';
  if (body === NO_SERVER) return 'none';
  const keys = body && typeof body === 'object' ? Object.keys(body) : [];
  if (keys.length === 1 && (body.state === 'open' || body.state === 'closed')) return body.state;
  return 'none';
}

/**
 * True when `body` is the session read's declared reply (`sessionReply` in shared/routes.ts, kept
 * free of imports here so the prototype's bundle stays small): `{ signedIn: false, installationName }`
 * or `{ signedIn: true, name, installationName }`, with no other keys.
 */
export function isSessionReply(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
  const name = body.installationName;
  if (!(name === null || typeof name === 'string')) return false;
  const keys = Object.keys(body).sort().join(',');
  if (body.signedIn === false) return keys === 'installationName,signedIn';
  if (body.signedIn === true) return typeof body.name === 'string' && keys === 'installationName,name,signedIn';
  return false;
}

/**
 * Reads the session (story 1.3). Resolves to one of:
 * `{ kind: 'signedIn', name, installationName }`, `{ kind: 'signedOut', installationName }`,
 * `{ kind: 'none' }` where there is no server (the prototype opens) or `{ kind: 'unknown' }` when
 * the server could not say (the "Sign-in cannot be checked" page). The session cookie itself is
 * never readable here: it is `HttpOnly`.
 */
export async function readSession(fetcher = fetch, { timeoutMs = STATE_TIMEOUT_MS } = {}) {
  const body = await withTimeout((signal) => readJson(fetcher, SESSION_URL, signal), timeoutMs);
  if (body === CANNOT_CHECK) return { kind: 'unknown' };
  if (body === NO_SERVER || !isSessionReply(body)) return { kind: 'none' };
  return body.signedIn
    ? { kind: 'signedIn', name: body.name, installationName: body.installationName }
    : { kind: 'signedOut', installationName: body.installationName };
}
