// The self-hosted smoke suite's failure text for the key state (deploy/selfhost/smoke.mjs), without
// starting workerd: importing the suite starts nothing. Pull request 13's review, finding C6.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { describe, it } from "node:test";
import { parseKeyState } from "../scripts/deploy-cloudflare.mjs";
import { keyStateReply } from "../deploy/selfhost/smoke.mjs";

describe("deploy/selfhost/smoke.mjs key-state failure text", () => {
  it("shows a reply's values only when they are values D-18 allows; otherwise its status and invalid (C6)", () => {
    assert.equal(keyStateReply(200, { fingerprint: "stored", key: "mismatch" }), "200 with fingerprint stored and key mismatch");
    // A made-up stand-in for a key a faulty route might answer: it must never be printed.
    const leaked = randomBytes(32).toString("base64url");
    for (const body of [{ fingerprint: "stored", key: leaked }, { fingerprint: leaked, key: "matches" }, { fingerprint: "stored", key: "matches", extra: leaked }, { key: leaked }, leaked, [leaked], null]) {
      const text = keyStateReply(500, body);
      assert.ok(!text.includes(leaked), "a value the route should not answer was printed");
      assert.equal(text, "500 with an invalid reply");
    }
  });

  it("allows exactly the values the deploy command's parseKeyState allows", () => {
    for (const fingerprint of ["none", "stored", "None", "", "fingerprint"]) {
      for (const key of ["none", "present", "matches", "mismatch", "MATCHES", "unknown"]) {
        const valid = parseKeyState({ fingerprint, key }) !== null;
        assert.equal(keyStateReply(200, { fingerprint, key }) !== "200 with an invalid reply", valid, `${fingerprint}/${key}`);
      }
    }
  });
});
