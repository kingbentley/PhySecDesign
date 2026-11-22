import assert from "node:assert/strict";
import { test } from "node:test";
import { NO_ANSWER, postJson } from "../src/admin/postJson.js";

const URL = "/api/v1/invitations/read";
const BODY = JSON.stringify({ secret: "A".repeat(43) });
const HEADERS = { "content-type": "application/json", accept: "application/json", "x-site-survey-design": "1" };
const loadHeaders = async () => HEADERS;

test("a JSON POST sends same-origin credentials and preserves the reply status and retry hint", async (t) => {
  const fetcher = t.mock.fn(async () => new Response('{"error":{"code":"signin_busy"}}', {
    status: 503, headers: { "retry-after": "5" },
  }));
  assert.deepEqual(await postJson(fetcher, URL, BODY, { timeoutMs: 1000, loadHeaders }), {
    status: 503, body: { error: { code: "signin_busy" } }, retryAfter: "5",
  });
  assert.equal(fetcher.mock.callCount(), 1);
  const [url, { method, body, headers, credentials, cache }] = fetcher.mock.calls[0].arguments;
  assert.deepEqual({ url, method, body, headers, credentials, cache }, {
    url: URL, method: "POST", body: BODY, headers: HEADERS, credentials: "same-origin", cache: "no-store",
  });
});

test("a non-JSON reply preserves its HTTP status so callers can distinguish it from no answer", async () => {
  const fetcher = async () => new Response("<h1>Bad gateway</h1>", { status: 502 });
  assert.deepEqual(await postJson(fetcher, URL, BODY, { timeoutMs: 1000, loadHeaders }), {
    status: 502, body: null, retryAfter: null,
  });
});

test("the deadline also aborts a request whose headers arrived but whose body stalled", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const reading = Promise.withResolvers();
  const pendingBody = Promise.withResolvers();
  let signal;
  const fetcher = async (_url, init) => {
    signal = init.signal;
    return {
      status: 200,
      json() {
        reading.resolve();
        return pendingBody.promise;
      },
    };
  };
  const result = postJson(fetcher, URL, BODY, { timeoutMs: 20, loadHeaders });
  await reading.promise;
  assert.equal(signal.aborted, false);

  t.mock.timers.tick(20);

  assert.equal(await result, NO_ANSWER);
  assert.equal(signal.aborted, true);
  pendingBody.resolve({ inviterName: "Late reply" });
});
