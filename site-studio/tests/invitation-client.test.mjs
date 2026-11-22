// The invite panel's and the invitation page's outcome mapping (story 1.4, CAP-1, CAP-3, CAP-5,
// CAP-7; review finding 7). The page's flows run in browser-tests/invitation.spec.mjs.
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { REFUSALS } from "../shared/refusal.ts";
import { INVITATION_MESSAGES, acceptOutcome, inviteOutcome, readOutcome } from "../src/admin/invitationClient.js";

const refusal = (code, extra = {}) => ({ error: { code, message: REFUSALS[code]?.message ?? "x", ...extra } });
const LINK = `https://ssd.example/invite#${"A".repeat(43)}`;
const INVITATION = { inviterName: "Robin Example", installationName: "Harbourside", email: "sam@harbourside.example", name: "Sam", role: "standard" };

describe("invite", () => {
  test("a success with the declared reply gives the link and expiry", () => {
    assert.deepEqual(inviteOutcome(200, { link: LINK, expiresAt: "2026-11-28T22:00:00.000Z" }),
      { kind: "invited", link: LINK, expiresAt: "2026-11-28T22:00:00.000Z" });
    assert.equal(inviteOutcome(200, { link: "https://ssd.example/invite#short", expiresAt: "2026-11-28T22:00:00.000Z" }).kind, "refused");
    assert.equal(inviteOutcome(200, { link: LINK, expiresAt: "soon" }).kind, "refused");
    assert.equal(inviteOutcome(200, null).kind, "refused");
  });

  test("an email with an account is shown by the Email field, with D-11's words", () => {
    assert.deepEqual(inviteOutcome(409, refusal("invitation_email_taken", { field: "email" })),
      { kind: "field", field: "email", message: "That email already has an account." });
  });

  test("an invalid field is named for the panel to word; not signed in shows the sign-in page", () => {
    assert.deepEqual(inviteOutcome(400, refusal("invalid_input", { field: "name" })), { kind: "field", field: "name", message: null });
    assert.deepEqual(inviteOutcome(400, refusal("invalid_input", { field: "x" })), { kind: "refused", message: INVITATION_MESSAGES.invalidInput });
    assert.deepEqual(inviteOutcome(401, refusal("not_signed_in")), { kind: "signedOut" });
  });

  test("refusals that name no field show their server message; failures to answer the network message", () => {
    assert.equal(inviteOutcome(403, refusal("administrator_only")).message, "Only an administrator can do this.");
    assert.equal(inviteOutcome(500, refusal("internal_error")).message, REFUSALS.internal_error.message);
    assert.equal(inviteOutcome(503, refusal("updating")).message, "Site Survey Design is updating. Try again in a moment.");
    assert.equal(inviteOutcome(502, null).message, "The server could not be reached. Check the connection and try again.");
  });

});

describe("invitation read", () => {
  test("a live invitation gives the five fields, and anything else of a success cannot be checked", () => {
    assert.deepEqual(readOutcome(200, { ...INVITATION, extra: 1 }), { kind: "invitation", invitation: INVITATION });
    assert.deepEqual(readOutcome(200, { ...INVITATION, role: "owner" }), { kind: "unknown" });
    assert.deepEqual(readOutcome(200, null), { kind: "unknown" });
  });

  test("an unusable link, or a secret the schema refuses, no longer works (D-3)", () => {
    assert.deepEqual(readOutcome(410, refusal("invitation_unusable")), { kind: "unusable" });
    assert.deepEqual(readOutcome(400, refusal("invalid_input", { field: "secret" })), { kind: "unusable" });
  });

  test("an update in progress is told apart from a read that cannot be checked (Kevin, 2026-11-21)", () => {
    assert.deepEqual(readOutcome(503, refusal("updating")), { kind: "updating" });
  });

  test("a 5xx or a refusal of another kind cannot be checked", () => {
    assert.deepEqual(readOutcome(500, ""), { kind: "unknown" });
    assert.deepEqual(readOutcome(403, refusal("origin_refused")), { kind: "unknown" });
  });
});

// The requests themselves (the secret in the JSON body only, the app's header, no answer, a
// timeout) are tested in server-tests/invitation-page-text.test.ts, where shared/routes.ts, which
// the client loads for the app's header, can be imported.

describe("accept", () => {
  test("a success gives the name; a success of another shape may not have set the password", () => {
    assert.deepEqual(acceptOutcome(200, { name: "Sam" }), { kind: "accepted", name: "Sam" });
    assert.deepEqual(acceptOutcome(200, null), { kind: "failed" });
  });

  test("an unusable link, a full queue and named fields have their own outcomes", () => {
    assert.deepEqual(acceptOutcome(410, refusal("invitation_unusable")), { kind: "unusable" });
    assert.deepEqual(acceptOutcome(503, refusal("signin_busy")), { kind: "busy" });
    assert.deepEqual(acceptOutcome(400, refusal("invalid_input", { field: "password" })), { kind: "field", field: "password" });
    assert.deepEqual(acceptOutcome(400, refusal("invalid_input", { field: "name" })), { kind: "field", field: "name" });
  });

  test("any other failure says the password may have been set (review finding 7)", () => {
    for (const [status, body] of [[500, refusal("internal_error")], [503, refusal("updating")], [403, refusal("origin_refused")], [400, refusal("invalid_input", { field: "secret" })], [502, null]]) {
      assert.deepEqual(acceptOutcome(status, body), { kind: "failed" }, `${status} ${body?.error?.code}`);
    }
    assert.equal(INVITATION_MESSAGES.acceptFailed,
      "Your password may not have been set. Try again; if the link then no longer works, try signing in with your email and this password.");
  });

  test("no message repeats an entered value", () => {
    const typed = "sam.typed@harbourside.example";
    for (const outcome of [inviteOutcome(409, refusal("invitation_email_taken", { field: "email" })), inviteOutcome(500, refusal("internal_error"))]) {
      assert.equal(JSON.stringify(outcome).includes(typed), false);
    }
    for (const message of Object.values(INVITATION_MESSAGES)) assert.equal(message.includes(typed), false);
  });
});
