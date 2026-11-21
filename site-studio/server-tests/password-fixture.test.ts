import { describe, expect, it } from "vitest";
import { SCRYPT_KEY_LENGTH, SCRYPT_N, SCRYPT_P, SCRYPT_R, standInPasswordHash, verifyPassword } from "../server/auth/password";
import { FIXTURE_PASSWORD, FIXTURE_WRONG_PASSWORD, PASSWORD_FIXTURE } from "../deploy/probe/password-fixture";

// The known-answer fixture (story 1.3, D-6, CAP-13, V-3): a hash made once under the self-hosted
// runtime by `deploy/probe/`, verified here in Cloudflare's runtime through the app's own
// `verifyPassword`. The smoke test verifies it under workerd; spec 4 on Cloudflare.

describe("the password fixture", () => {
  it("records where it was made and uses the production parameters", () => {
    expect(PASSWORD_FIXTURE.origin).toMatch(/workerd/);
    expect(PASSWORD_FIXTURE.host).not.toBe("");
    expect(PASSWORD_FIXTURE.hash).toMatchObject({ algorithm: "scrypt", n: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, keyLength: SCRYPT_KEY_LENGTH });
  });

  it("verifies its password through verifyPassword, and a wrong password fails", async () => {
    const hash = PASSWORD_FIXTURE.hash!;
    expect(await verifyPassword(FIXTURE_PASSWORD, hash)).toBe(true);
    expect(await verifyPassword(FIXTURE_WRONG_PASSWORD, hash)).toBe(false);
  });

  it("is never the sign-in stand-in (A-1)", () => {
    expect(standInPasswordHash().salt).not.toBe(PASSWORD_FIXTURE.hash!.salt);
    expect(standInPasswordHash().hash).not.toBe(PASSWORD_FIXTURE.hash!.hash);
  });
});
