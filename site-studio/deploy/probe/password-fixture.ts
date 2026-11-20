import type { PasswordHash } from "../../server/auth/password";

// The known-answer password fixture (story 1.3, D-6, CAP-13). Made once by the probe in this folder
// under the self-hosted runtime and committed; verified by `server-tests/password-fixture.test.ts`,
// by the self-hosted smoke test through the probe under workerd, and on Cloudflare by the same probe
// deployed to the test account (spec 4). The password is test data, never a real one, and the
// stand-in hash of sign-in is never this fixture (A-1).

export const FIXTURE_PASSWORD = "Site Survey Design known-answer fixture, story 1.3";
export const FIXTURE_WRONG_PASSWORD = "Site Survey Design known-answer fixture, story 1.4";

export const PASSWORD_FIXTURE: {
  origin: string;
  host: string;
  madeAt: string;
  hash: PasswordHash | null;
} = {
  origin: "Made by `node deploy/probe/probe.mjs make`: the probe built by Wrangler 4.164.0 and served by workerd 1.20261117.1 (the self-hosted runtime), with compatibility date 2026-11-01 and nodejs_compat.",
  host: "Self-hosted runtime (workerd) on the development workstation (Windows 11, x64), run locally.",
  madeAt: "2026-11-20",
  hash: {
    algorithm: "scrypt",
    n: 131072,
    r: 8,
    p: 1,
    keyLength: 32,
    salt: "sibckTc5tUMtfOxrxhkUbg==",
    hash: "mvTENNN6L+o05ZdB+dWMM/P18LQdksYGCiV9nGDvDqo=",
  },
};
