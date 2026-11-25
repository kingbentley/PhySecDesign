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
 * replaceable only so a test can stall it. `signal`, when given, abandons the request: it is
 * aborted (a reply whose headers have not arrived is then dropped by the browser, its cookies
 * included) and the call resolves to `NO_ANSWER`. `onResponse(response)` is called as soon as the
 * reply's headers have arrived, before its body is read (pull request 13, review round 2).
 */
export async function postJson(fetcher, url, body, { timeoutMs, loadHeaders = appHeaders, signal, onResponse }) {
  const controller = new AbortController();
  let timer;
  let stopAbandon = () => {};
  const deadline = new Promise((resolve) => {
    timer = setTimeout(() => {
      controller.abort();
      resolve(NO_ANSWER);
    }, timeoutMs);
    if (signal) {
      const abandon = () => {
        controller.abort();
        resolve(NO_ANSWER);
      };
      if (signal.aborted) abandon();
      else {
        signal.addEventListener('abort', abandon, { once: true });
        stopAbandon = () => signal.removeEventListener('abort', abandon);
      }
    }
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
    onResponse?.(response);
    const read = await readBody(response);
    // Abandoned while the body was read: the reply is not acted on.
    if (controller.signal.aborted) return NO_ANSWER;
    return { status: response.status, body: read, retryAfter: response.headers?.get?.('retry-after') ?? null };
  })().catch(() => NO_ANSWER);
  try {
    return await Promise.race([attempt, deadline]);
  } finally {
    clearTimeout(timer);
    stopAbandon();
  }
}
