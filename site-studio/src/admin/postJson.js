// One JSON POST under one deadline, for the sign-in client and the invitation client (story 1.3,
// story 1.4; pull request 12). The deadline covers loading the app's header from shared/routes.ts
// as well as the request and its reply: a header load that stalls or fails gives no answer, and one
// that finishes after the deadline starts no request.
//
// No static imports, so `tests/` loads the clients that use it under `node --test`.

/** What `postJson` resolves to when there was no answer: a failure, or the deadline passed. */
export const NO_ANSWER = Symbol('no answer');

/** The app's request headers; shared/routes.ts is loaded only when a request is sent. */
export async function appHeaders() {
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

/**
 * Posts `body` (already a JSON string) to `url`. Resolves to `{ status, body, retryAfter }` (the
 * parsed reply or null, and the `Retry-After` header or null), or `NO_ANSWER`. `loadHeaders` is
 * replaceable only so a test can stall it.
 */
export async function postJson(fetcher, url, body, { timeoutMs, loadHeaders = appHeaders }) {
  const controller = new AbortController();
  let timer;
  const deadline = new Promise((resolve) => {
    timer = setTimeout(() => {
      controller.abort();
      resolve(NO_ANSWER);
    }, timeoutMs);
  });
  const attempt = (async () => {
    const headers = await loadHeaders();
    if (controller.signal.aborted) return NO_ANSWER;
    const response = await fetcher(url, {
      method: 'POST',
      headers,
      body,
      credentials: 'same-origin',
      cache: 'no-store',
      signal: controller.signal,
    });
    return { status: response.status, body: await readBody(response), retryAfter: response.headers?.get?.('retry-after') ?? null };
  })().catch(() => NO_ANSWER);
  try {
    return await Promise.race([attempt, deadline]);
  } finally {
    clearTimeout(timer);
  }
}
