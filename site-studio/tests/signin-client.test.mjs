// The sign-in page's refusal mapping and wait wording (story 1.3, CAP-2, CAP-7, D-8, A-19), and
// the start-up reads that tell "no server" apart from "cannot be checked" (D-7 amended and amended
// again).
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { REFUSALS } from "../shared/refusal.ts";
import {
  SIGN_IN_MESSAGES,
  createSecondStepRun,
  requestSignOut,
  secondStepOutcome,
  signInOutcome,
  signOutConfirmed,
  submitSecondStep,
  submitSignIn,
  waitMessage,
} from "../src/admin/signInClient.js";
import { waitWording } from "../src/admin/waitWording.js";
import { isSessionReply, readSession, readSetupState } from "../src/admin/setupState.js";

const refusal = (code, extra = {}) => ({ error: { code, message: REFUSALS[code]?.message ?? "x", ...extra } });

describe("sign-in refusals", () => {
  test("a success with the declared reply signs in with the name", () => {
    assert.deepEqual(signInOutcome(200, { name: "Robin Example" }), { kind: "signedIn", name: "Robin Example" });
    assert.equal(signInOutcome(200, { name: "Robin", token: "x" }).kind, "refused");
    assert.equal(signInOutcome(200, null).kind, "refused");
  });

  test("a failed sign-in shows the server's one message, whatever the email", () => {
    const outcome = signInOutcome(401, refusal("signin_failed"));
    assert.deepEqual(outcome, { kind: "refused", message: "That email and password do not match." });
    assert.equal(SIGN_IN_MESSAGES.failed, "That email and password do not match.");
    assert.equal(signInOutcome(401, { error: { code: "signin_failed" } }).message, "That email and password do not match.");
    assert.doesNotMatch(outcome.message, /no account|not found|unknown/i);
  });

  test("a wait is composed from the refusal's seconds, or the Retry-After header", () => {
    assert.equal(signInOutcome(429, refusal("signin_wait", { retryAfterSeconds: 60 })).message, "Too many attempts. Wait 1 minute before trying again.");
    assert.equal(signInOutcome(429, refusal("signin_wait", { retryAfterSeconds: 150 })).message, "Too many attempts. Wait 2 minutes 30 seconds before trying again.");
    assert.equal(signInOutcome(429, refusal("signin_wait"), "45").message, "Too many attempts. Wait 45 seconds before trying again.");
    assert.equal(signInOutcome(429, refusal("signin_wait")).message, "Too many attempts. Wait a few minutes before trying again.");
    assert.equal(waitMessage(900), "Too many attempts. Wait 15 minutes before trying again.");
  });

  test("an invalid field is named for the page to word; other refusals have their own messages", () => {
    assert.deepEqual(signInOutcome(400, refusal("invalid_input", { field: "email" })), { kind: "field", field: "email" });
    assert.deepEqual(signInOutcome(400, refusal("invalid_input", { field: "password" })), { kind: "field", field: "password" });
    assert.equal(signInOutcome(400, refusal("invalid_input", { field: "other" })).message, SIGN_IN_MESSAGES.invalid_input);
    assert.equal(signInOutcome(503, refusal("signin_busy")).message, SIGN_IN_MESSAGES.busy);
    // The set-up page uses the same words (server-tests/setup-client.test.ts).
    assert.equal(SIGN_IN_MESSAGES.busy, "Site Survey Design is busy. Try again in a moment.");
    assert.equal(signInOutcome(403, refusal("origin_refused")).message, SIGN_IN_MESSAGES.origin_refused);
    assert.equal(signInOutcome(503, refusal("updating")).message, SIGN_IN_MESSAGES.updating);
    assert.equal(signInOutcome(405, refusal("method_not_allowed")).message, SIGN_IN_MESSAGES.not_found);
    assert.equal(signInOutcome(500, refusal("internal_error")).message, SIGN_IN_MESSAGES.other);
    assert.equal(signInOutcome(502, null).message, SIGN_IN_MESSAGES.other);
  });

  test("sign-out counts only a confirmed reply (E-6)", () => {
    assert.equal(signOutConfirmed(200, { signedIn: false }), true);
    assert.equal(signOutConfirmed(500, null), false);
    assert.equal(signOutConfirmed(200, null), false);
    assert.equal(signOutConfirmed(403, refusal("origin_refused")), false);
  });
});

describe("the second step (story 1.5, spec 8, D-12, D-13)", () => {
  test("a sign-in reply of exactly { secondStep: true } asks for the second step; nothing else does", () => {
    assert.deepEqual(signInOutcome(200, { secondStep: true }), { kind: "secondStep" });
    assert.equal(signInOutcome(200, { secondStep: false }).kind, "refused");
    assert.equal(signInOutcome(200, { secondStep: "true" }).kind, "refused");
    assert.equal(signInOutcome(200, { secondStep: true, name: "Robin" }).kind, "refused");
    assert.equal(signInOutcome(200, { secondStep: true, token: "x" }).kind, "refused");
    assert.equal(signInOutcome(401, { secondStep: true }).kind, "refused");
  });

  test("a correct code signs in with the name, as a sign-in does", () => {
    assert.deepEqual(secondStepOutcome(200, { name: "Robin Example" }), { kind: "signedIn", name: "Robin Example" });
    assert.deepEqual(secondStepOutcome(200, { name: "Robin", token: "x" }), { kind: "refused", message: SIGN_IN_MESSAGES.other });
    assert.deepEqual(secondStepOutcome(200, { secondStep: true }), { kind: "refused", message: SIGN_IN_MESSAGES.other });
    assert.deepEqual(secondStepOutcome(200, null), { kind: "refused", message: SIGN_IN_MESSAGES.other });
  });

  test("a wrong code and a wrong recovery code stay on the second step with the server's message", () => {
    assert.deepEqual(secondStepOutcome(401, refusal("second_step_code_wrong")),
      { kind: "refused", message: "That code does not match or was already used. Wait for the next code in your authenticator app and try again." });
    assert.deepEqual(secondStepOutcome(401, refusal("second_step_recovery_code_wrong")),
      { kind: "refused", message: "That recovery code does not match, or it has already been used." });
    // Without a message in the reply, shared/refusal.ts's.
    assert.equal(secondStepOutcome(401, { error: { code: "second_step_code_wrong" } }).message, REFUSALS.second_step_code_wrong.message);
    assert.equal(secondStepOutcome(401, { error: { code: "second_step_recovery_code_wrong" } }).message, REFUSALS.second_step_recovery_code_wrong.message);
  });

  test("an expired pending sign-in and a wait return to the password form, the wait composed as story 1.3 does", () => {
    assert.deepEqual(secondStepOutcome(401, refusal("second_step_expired")),
      { kind: "restart", message: "This sign-in has expired. Sign in again with your email and password." });
    assert.equal(secondStepOutcome(401, { error: { code: "second_step_expired" } }).message, REFUSALS.second_step_expired.message);
    assert.deepEqual(secondStepOutcome(429, refusal("signin_wait", { retryAfterSeconds: 60 })),
      { kind: "restart", message: "Too many attempts. Wait 1 minute before trying again." });
    assert.equal(secondStepOutcome(429, refusal("signin_wait"), "150").message, "Too many attempts. Wait 2 minutes 30 seconds before trying again.");
    assert.equal(secondStepOutcome(429, refusal("signin_wait")).message, "Too many attempts. Wait a few minutes before trying again.");
  });

  test("a deployment key mismatch is its own kind with its message (finding 26)", () => {
    assert.deepEqual(secondStepOutcome(503, refusal("deployment_key_mismatch")),
      { kind: "keyMismatch", message: REFUSALS.deployment_key_mismatch.message });
    assert.equal(secondStepOutcome(503, { error: { code: "deployment_key_mismatch" } }).message, REFUSALS.deployment_key_mismatch.message);
  });

  test("an invalid code is named for the page to word; other codes are worded as the first step words them", () => {
    assert.deepEqual(secondStepOutcome(400, refusal("invalid_input", { field: "code" })), { kind: "field", field: "code" });
    assert.deepEqual(secondStepOutcome(400, refusal("invalid_input", { field: "method" })), { kind: "refused", message: SIGN_IN_MESSAGES.invalid_input });
    assert.deepEqual(secondStepOutcome(400, refusal("invalid_input", { field: "email" })), { kind: "refused", message: SIGN_IN_MESSAGES.invalid_input });
    assert.deepEqual(secondStepOutcome(400, refusal("invalid_input")), { kind: "refused", message: SIGN_IN_MESSAGES.invalid_input });
    assert.deepEqual(secondStepOutcome(503, refusal("signin_busy")), { kind: "refused", message: SIGN_IN_MESSAGES.busy });
    assert.deepEqual(secondStepOutcome(403, refusal("origin_refused")), { kind: "refused", message: SIGN_IN_MESSAGES.origin_refused });
    assert.deepEqual(secondStepOutcome(503, refusal("updating")), { kind: "refused", message: SIGN_IN_MESSAGES.updating });
    assert.deepEqual(secondStepOutcome(403, refusal("https_required")), { kind: "refused", message: SIGN_IN_MESSAGES.https_required });
    assert.deepEqual(secondStepOutcome(404, refusal("not_found")), { kind: "refused", message: SIGN_IN_MESSAGES.not_found });
    assert.deepEqual(secondStepOutcome(405, refusal("method_not_allowed")), { kind: "refused", message: SIGN_IN_MESSAGES.not_found });
    assert.deepEqual(secondStepOutcome(500, refusal("internal_error")), { kind: "refused", message: SIGN_IN_MESSAGES.other });
    assert.deepEqual(secondStepOutcome(502, null), { kind: "refused", message: SIGN_IN_MESSAGES.other });
  });

  test("the request posts only the method and the code to the second-step route, with the app's headers and a deadline", async () => {
    const headers = { "content-type": "application/json", accept: "application/json", "x-site-survey-design": "1" };
    const sent = [];
    const fetcher = async (url, init) => {
      sent.push({ url, init });
      return new Response(JSON.stringify({ name: "Robin Example" }), { status: 200, headers: { "content-type": "application/json" } });
    };
    const loaded = { loadHeaders: async () => headers };
    assert.deepEqual(await submitSecondStep({ method: "code", code: "123456", extra: "x" }, fetcher, loaded), { kind: "signedIn", name: "Robin Example" });
    assert.equal(sent[0].url, "/api/v1/session/second-step");
    assert.equal(sent[0].init.method, "POST");
    assert.deepEqual(sent[0].init.headers, headers);
    assert.deepEqual(JSON.parse(sent[0].init.body), { method: "code", code: "123456" });
    const wait = async () => new Response(JSON.stringify({ error: { code: "signin_wait", message: "x" } }), { status: 429, headers: { "retry-after": "60" } });
    assert.deepEqual(await submitSecondStep({ method: "recovery", code: "x" }, wait, loaded), { kind: "restart", message: "Too many attempts. Wait 1 minute before trying again." });
    const never = (_url, init) => new Promise((_resolve, reject) => init.signal?.addEventListener("abort", () => reject(new Error("aborted"))));
    assert.deepEqual(await submitSecondStep({ method: "code", code: "123456" }, never, { timeoutMs: 20, ...loaded }), { kind: "refused", message: SIGN_IN_MESSAGES.network });
  });
});

describe("an abandoned second step (pull request 13, review round 2)", () => {
  const loaded = { loadHeaders: async () => ({ "content-type": "application/json" }), timeoutMs: 60_000 };
  const input = { method: "code", code: "123456" };
  // A fetch that answers only when the test lets it, and fails as a browser does when aborted.
  function heldFetch() {
    const state = { signal: null };
    const fetcher = (_url, init) => new Promise((resolve, reject) => {
      state.signal = init.signal;
      state.answer = resolve;
      init.signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
    });
    return { state, fetcher };
  }

  test("abandoned before its headers arrive: the request is aborted, the page learns nothing, and no session needs ending", async () => {
    const { state, fetcher } = heldFetch();
    const run = createSecondStepRun(fetcher, loaded);
    const sent = run.send(input);
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(run.abandon(), false, "no success had arrived");
    assert.equal(state.signal.aborted, true, "the request was aborted");
    assert.deepEqual(await sent, { kind: "refused", message: SIGN_IN_MESSAGES.network });
  });

  test("abandoned after a success's headers arrived, while its body is still coming: abandon answers true, so the page ends that session", async () => {
    let releaseBody;
    const body = new ReadableStream({ start(controller) { releaseBody = () => { controller.enqueue(new TextEncoder().encode('{"name":"Ada"}')); controller.close(); }; } });
    let signal;
    const fetcher = async (_url, init) => { signal = init.signal; return new Response(body, { status: 200 }); };
    const run = createSecondStepRun(fetcher, loaded);
    const sent = run.send(input);
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(run.abandon(), true, "a success's headers had arrived");
    assert.equal(signal.aborted, true);
    releaseBody();
    assert.equal((await sent).kind, "refused", "the abandoned reply is not acted on");
  });

  test("a success whose body misses the time limit counts as a sign-in (the server set the session); an abandoned one does not", async () => {
    const stalled = () => new Response(new ReadableStream({ start() {} }), { status: 200 });
    const timedOut = await createSecondStepRun(async () => stalled(), { ...loaded, timeoutMs: 30 }).send(input);
    assert.deepEqual(timedOut, { kind: "signedIn", name: null });
    const abandonedRun = createSecondStepRun(async () => stalled(), { ...loaded, timeoutMs: 60_000 });
    const pending = abandonedRun.send(input);
    await new Promise((resolve) => setTimeout(resolve, 0));
    abandonedRun.abandon();
    assert.equal((await pending).kind, "refused");
  });

  test("a refusal's headers, or a request that has already settled, never call for a sign-out", async () => {
    const refusedRun = createSecondStepRun(async () => new Response(new ReadableStream({ start() {} }), { status: 401 }), loaded);
    const pending = refusedRun.send(input);
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(refusedRun.abandon(), false);
    await pending;
    const settledRun = createSecondStepRun(async () => Response.json({ name: "Ada" }), loaded);
    assert.equal((await settledRun.send(input)).kind, "signedIn");
    assert.equal(settledRun.abandon(), false);
  });
});

describe("wait wording", () => {
  test("words minutes and seconds as set-up does", () => {
    assert.equal(waitWording(1), "1 second");
    assert.equal(waitWording(59.2), "1 minute");
    assert.equal(waitWording(61), "1 minute 1 second");
    assert.equal(waitWording(120), "2 minutes");
    assert.equal(waitWording(0), "a few minutes");
    assert.equal(waitWording(undefined), "a few minutes");
    assert.equal(waitWording("abc"), "a few minutes");
  });
});

function reply(status, body, contentType = "application/json") {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  return async () => new Response(text, { status, headers: { "content-type": contentType } });
}

describe("start-up reads", () => {
  test("the set-up state: open, closed, no server or cannot be checked", async () => {
    assert.equal(await readSetupState(reply(200, { state: "open" })), "open");
    assert.equal(await readSetupState(reply(200, { state: "closed" })), "closed");
    assert.equal(await readSetupState(reply(404, "")), "none");
    assert.equal(await readSetupState(reply(200, "<!doctype html>", "text/html")), "none");
    // JSON without the declared state still comes from a server: fail closed (CodeRabbit, PR 11).
    assert.equal(await readSetupState(reply(200, { state: "maybe" })), "unknown");
    assert.equal(await readSetupState(reply(200, {})), "unknown");
    // A field a later release adds does not hide the state (story 1.3 code review).
    assert.equal(await readSetupState(reply(200, { state: "open", users: 0 })), "open");
    assert.equal(await readSetupState(reply(404, refusal("not_found"))), "none");
    assert.equal(await readSetupState(reply(500, "")), "unknown");
    assert.equal(await readSetupState(reply(503, refusal("updating"))), "unknown");
    // Only a server answers in the refusal envelope: fail closed (story 1.3 code review).
    assert.equal(await readSetupState(reply(403, refusal("https_required"))), "unknown");
    assert.equal(await readSetupState(reply(401, refusal("not_signed_in"))), "unknown");
    assert.equal(await readSetupState(reply(429, refusal("signin_wait"))), "unknown");
    assert.equal(await readSetupState(reply(403, "<html>Forbidden</html>", "text/html")), "none");
    // JSON with a failure status other than 404, outside the refusal envelope: still something
    // answered, so it cannot be checked (CodeRabbit, PR 11).
    assert.equal(await readSetupState(reply(403, { message: "Forbidden" })), "unknown");
    assert.equal(await readSetupState(async () => { throw new TypeError("network"); }), "unknown");
    const never = (_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(new Error("aborted"))));
    assert.equal(await readSetupState(never, { timeoutMs: 20 }), "unknown");
  });

  test("the session: signed in, signed out, or cannot be checked, never no server (fail closed)", async () => {
    // Story 1.4 (D-5, CAP-9): the account's identifier and role are passed on.
    assert.deepEqual(await readSession(reply(200, { signedIn: true, name: "Robin", accountId: "acc-1", role: "administrator", installationName: "Harbourside" })),
      { kind: "signedIn", name: "Robin", accountId: "acc-1", role: "administrator", installationName: "Harbourside" });
    assert.deepEqual(await readSession(reply(200, { signedIn: true, name: "Sam", accountId: "acc-2", role: "standard", installationName: "Harbourside" })),
      { kind: "signedIn", name: "Sam", accountId: "acc-2", role: "standard", installationName: "Harbourside" });
    assert.deepEqual(await readSession(reply(200, { signedIn: false, installationName: "Harbourside" })),
      { kind: "signedOut", installationName: "Harbourside" });
    // A field a later story adds is ignored.
    assert.deepEqual(await readSession(reply(200, { signedIn: true, name: "Robin", accountId: "acc-1", role: "administrator", installationName: "Harbourside", team: "x" })),
      { kind: "signedIn", name: "Robin", accountId: "acc-1", role: "administrator", installationName: "Harbourside" });
    // A signed-in reply without the identifier or a known role cannot be checked (review finding 2).
    assert.deepEqual(await readSession(reply(200, { signedIn: true, name: "Robin", installationName: "Harbourside" })), { kind: "unknown" });
    assert.deepEqual(await readSession(reply(200, { signedIn: true, name: "Robin", accountId: "acc-1", installationName: "Harbourside" })), { kind: "unknown" });
    assert.deepEqual(await readSession(reply(200, { signedIn: true, name: "Robin", accountId: "acc-1", role: "owner", installationName: "Harbourside" })), { kind: "unknown" });
    // The session is read only after the set-up state answered, so a server is there: a 404, a page
    // that is not JSON, a reply of the wrong shape or a 4xx refusal cannot be checked.
    assert.deepEqual(await readSession(reply(404, refusal("not_found"))), { kind: "unknown" });
    assert.deepEqual(await readSession(reply(404, "")), { kind: "unknown" });
    assert.deepEqual(await readSession(reply(200, "<!doctype html>", "text/html")), { kind: "unknown" });
    assert.deepEqual(await readSession(reply(200, { signedIn: "yes" })), { kind: "unknown" });
    assert.deepEqual(await readSession(reply(403, refusal("origin_refused"))), { kind: "unknown" });
    assert.deepEqual(await readSession(reply(429, refusal("signin_wait"))), { kind: "unknown" });
    assert.deepEqual(await readSession(reply(403, { message: "Forbidden" })), { kind: "unknown" });
    assert.deepEqual(await readSession(reply(500, "")), { kind: "unknown" });
    assert.deepEqual(await readSession(reply(503, refusal("updating"))), { kind: "unknown" });
    assert.deepEqual(await readSession(async () => { throw new TypeError("network"); }), { kind: "unknown" });
    // A connection dropped while the body is read is a failure to answer, not "no server".
    const dropped = async () => new Response(new ReadableStream({ start(controller) { controller.error(new TypeError("dropped")); } }),
      { status: 200, headers: { "content-type": "application/json" } });
    assert.deepEqual(await readSession(dropped), { kind: "unknown" });
    assert.equal(await readSetupState(dropped), "unknown");
    const never = (_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(new Error("aborted"))));
    assert.deepEqual(await readSession(never, { timeoutMs: 20 }), { kind: "unknown" });
  });

  test("the declared session reply is accepted, with any extra field ignored", () => {
    assert.equal(isSessionReply({ signedIn: false, installationName: null }), true);
    assert.equal(isSessionReply({ signedIn: true, name: "Robin", accountId: "acc-1", role: "administrator", installationName: "Harbourside" }), true);
    assert.equal(isSessionReply({ signedIn: true, name: "Robin", accountId: "acc-1", role: "standard", installationName: null }), true);
    // Story 1.4 (review finding 2): signed in needs a string accountId and a known role.
    assert.equal(isSessionReply({ signedIn: true, name: "Robin", installationName: "Harbourside" }), false);
    assert.equal(isSessionReply({ signedIn: true, name: "Robin", accountId: 7, role: "standard", installationName: "Harbourside" }), false);
    assert.equal(isSessionReply({ signedIn: true, name: "Robin", accountId: "acc-1", role: "owner", installationName: "Harbourside" }), false);
    assert.equal(isSessionReply({ signedIn: true, name: "Robin", accountId: "acc-1", installationName: "Harbourside" }), false);
    assert.equal(isSessionReply({ signedIn: true, installationName: "Harbourside" }), false);
    assert.equal(isSessionReply({ signedIn: false, installationName: "x", role: "y" }), true);
    assert.equal(isSessionReply({ signedIn: false }), false);
    assert.equal(isSessionReply({ signedIn: "yes", installationName: null }), false);
    assert.equal(isSessionReply([]), false);
  });
});

describe("the sign-in and sign-out requests (pull request 12)", () => {
  const input = { email: "robin@harbourside.example", password: "a long and correct sign-in passphrase" };
  const headers = { "content-type": "application/json", accept: "application/json", "x-site-survey-design": "1" };
  const replying = (status, body, extraHeaders = {}) => {
    const sent = [];
    const fetcher = async (url, init) => {
      sent.push({ url, init });
      return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...extraHeaders } });
    };
    return { fetcher, sent };
  };
  const never = (_url, init) => new Promise((_resolve, reject) => init.signal?.addEventListener("abort", () => reject(new Error("aborted"))));

  // shared/routes.ts uses imports only the bundler and workerd resolve, so here the header load is
  // a stand-in; server-tests/setup-client.test.ts sends the real header.
  const loaded = { loadHeaders: async () => headers };

  test("send the loaded headers and map the reply, the Retry-After header included", async () => {
    const signIn = replying(200, { name: "Robin Example" });
    assert.deepEqual(await submitSignIn(input, signIn.fetcher, loaded), { kind: "signedIn", name: "Robin Example" });
    assert.equal(signIn.sent[0].url, "/api/v1/session/sign-in");
    assert.equal(signIn.sent[0].init.method, "POST");
    assert.deepEqual(signIn.sent[0].init.headers, headers);
    assert.deepEqual(JSON.parse(signIn.sent[0].init.body), input);
    const wait = replying(429, { error: { code: "signin_wait", message: "x" } }, { "retry-after": "60" });
    assert.equal((await submitSignIn(input, wait.fetcher, loaded)).message, "Too many attempts. Wait 1 minute before trying again.");
    const signOut = replying(200, { signedIn: false });
    assert.equal(await requestSignOut(signOut.fetcher, loaded), true);
    assert.equal(signOut.sent[0].url, "/api/v1/session/sign-out");
    assert.equal(await requestSignOut(replying(200, { signedIn: true }).fetcher, loaded), false);
  });

  test("a request with no answer before the deadline is the network message, or an unconfirmed sign-out", async () => {
    assert.deepEqual(await submitSignIn(input, never, { timeoutMs: 20 }), { kind: "refused", message: SIGN_IN_MESSAGES.network });
    assert.equal(await requestSignOut(never, { timeoutMs: 20 }), false);
  });

  test("loading the app's header counts against the deadline: stalled, late or failed, no request is started", async () => {
    let requests = 0;
    const counted = async () => {
      requests += 1;
      return new Response(JSON.stringify({ name: "Robin Example" }), { status: 200 });
    };
    const stalled = () => new Promise(() => {});
    assert.deepEqual(await submitSignIn(input, counted, { timeoutMs: 20, loadHeaders: stalled }), { kind: "refused", message: SIGN_IN_MESSAGES.network });
    assert.equal(await requestSignOut(counted, { timeoutMs: 20, loadHeaders: stalled }), false);
    const late = [];
    const slow = () => {
      const loaded = new Promise((resolve) => setTimeout(() => resolve(headers), 60));
      late.push(loaded.then(() => new Promise((resolve) => setTimeout(resolve, 10))));
      return loaded;
    };
    assert.deepEqual(await submitSignIn(input, counted, { timeoutMs: 20, loadHeaders: slow }), { kind: "refused", message: SIGN_IN_MESSAGES.network });
    assert.equal(await requestSignOut(counted, { timeoutMs: 20, loadHeaders: slow }), false);
    const failing = () => Promise.reject(new Error("chunk failed"));
    assert.deepEqual(await submitSignIn(input, counted, { timeoutMs: 60_000, loadHeaders: failing }), { kind: "refused", message: SIGN_IN_MESSAGES.network });
    assert.equal(await requestSignOut(counted, { timeoutMs: 60_000, loadHeaders: failing }), false);
    await Promise.all(late);
    assert.equal(requests, 0);
    // In time, the request goes out as before.
    assert.deepEqual(await submitSignIn(input, counted, { timeoutMs: 1000, loadHeaders: async () => headers }), { kind: "signedIn", name: "Robin Example" });
    assert.equal(requests, 1);
  });
});
