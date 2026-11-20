// The set-up state check the app makes when it starts (story 1.2). Kept apart from the set-up
// page's code so that the prototype's bundle does not carry the page or its rules.

/** The set-up page's address. */
export const SETUP_PATH = '/setup';
const STATE_URL = '/api/v1/setup/state';

/** Asks whether set-up is open. Resolves to "open", "closed" or "unknown" (no answer, or not this server). */
export async function readSetupState(fetcher = fetch) {
  try {
    const response = await fetcher(STATE_URL, { headers: { accept: 'application/json' }, cache: 'no-store' });
    if (!response.ok) return 'unknown';
    const body = await response.json();
    return body?.state === 'open' || body?.state === 'closed' ? body.state : 'unknown';
  } catch {
    return 'unknown';
  }
}
