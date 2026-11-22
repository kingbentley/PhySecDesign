// The sign-in page's refusal mapping and wait wording (story 1.3, CAP-2, CAP-7, D-8, A-19), and
// the start-up reads that tell "no server" apart from "cannot be checked" (D-7 amended and amended
// again).
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { REFUSALS } from "../shared/refusal.ts";
import { SIGN_IN_MESSAGES, signInOutcome, signOutConfirmed, waitMessage } from "../src/admin/signInClient.js";
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
