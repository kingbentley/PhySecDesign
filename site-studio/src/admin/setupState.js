// The set-up state check the app makes when it starts (story 1.2). Kept apart from the set-up
// page's code so that the prototype's bundle does not carry the page or its rules.

/** The set-up page's address. */
export const SETUP_PATH = '/setup';
const STATE_URL = '/api/v1/setup/state';
/** How long the app waits for the state before opening as if it were unknown. */
export const STATE_TIMEOUT_MS = 5000;

/** True for the set-up address, with or without a trailing slash. */
export function isSetupPath(pathname) {
  return pathname === SETUP_PATH || pathname === `${SETUP_PATH}/`;
}

async function askState(fetcher, signal) {
  try {
    const response = await fetcher(STATE_URL, { headers: { accept: 'application/json' }, cache: 'no-store', signal });
    if (!response.ok) return 'unknown';
    const body = await response.json();
    return body?.state === 'open' || body?.state === 'closed' ? body.state : 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Asks whether set-up is open. Resolves to "open", "closed" or "unknown" (no answer, not this
 * server, or no answer within `timeoutMs`), so a server that never answers cannot leave the app blank.
 */
export function readSetupState(fetcher = fetch, { timeoutMs = STATE_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  let timer;
  const timedOut = new Promise((resolve) => {
    timer = setTimeout(() => {
      controller.abort();
      resolve('unknown');
    }, timeoutMs);
  });
  return Promise.race([askState(fetcher, controller.signal), timedOut]).finally(() => clearTimeout(timer));
}
