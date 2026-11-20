import { beforeAll, describe, expect, it } from "vitest";
import { normalisePassword } from "../shared/setup";
import { hashPassword, type PasswordHash } from "../server/auth/password";
import { installationFor, seedAccount, signIn, type Installed } from "./signin-helpers";

// Timing parity of refusals (story 1.3, CAP-6, CA-58, A-21, V-2): a wrong password for an email
// with an account and any password for an email without one take the same steps, one counted
// attempt, one queued scrypt check (the stand-in for an unknown email) and one completion, so their
// medians stay within 100 ms. Each median must be at least 150 ms, which shows that the clock in
// the test sees the hash. The attempts are interleaved after a warm-up; each has its own
// `CF-Connecting-IP` and no account takes 5 failures, so no wait applies. 44 hashes of about
// 0.3 to 0.5 s, so the file has its own timeout. It can run beside other server-test files that
// hash; interleaving makes that load fall on both kinds alike.

const PASSWORD = "correct horse battery staple";
const WRONG = "not the right password at all";
const ROUNDS = 20;
const ACCOUNTS = 6;
let hash: PasswordHash;

beforeAll(async () => {
  hash = await hashPassword(normalisePassword(PASSWORD));
});

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = sorted.length / 2;
  return sorted.length % 2 === 0 ? (sorted[middle - 1]! + sorted[middle]!) / 2 : sorted[Math.floor(middle)]!;
}

let address = 0;
async function timedRefusal(installed: Installed, email: string, password: string): Promise<number> {
  address += 1;
  const started = Date.now();
  const response = await signIn(installed.env, email, password, { address: `198.51.${Math.floor(address / 250)}.${address % 250}` });
  const elapsed = Date.now() - started;
  expect(response.status, email).toBe(401);
  await response.arrayBuffer();
  return elapsed;
}

describe("refusal timing (CAP-6)", () => {
  it("keeps known-email and unknown-email medians within 100 ms, each at least 150 ms", { timeout: 240_000 }, async () => {
    const installed = installationFor("signin-timing");
    for (let index = 0; index < ACCOUNTS; index += 1) await seedAccount(installed.stub, { email: `person${index}@acme.test`, hash });

    // Warm-up, on the sixth account and two unknown emails.
    for (let index = 0; index < 2; index += 1) {
      await timedRefusal(installed, `person${ACCOUNTS - 1}@acme.test`, WRONG);
      await timedRefusal(installed, `warm-up-${index}@acme.test`, PASSWORD);
    }

    const known: number[] = [];
    const unknown: number[] = [];
    for (let round = 0; round < ROUNDS; round += 1) {
      // Four wrong passwords per account at most, so no email reaches its wait.
      const knownEmail = `person${round % (ACCOUNTS - 1)}@acme.test`;
      const unknownEmail = `nobody-${round}@acme.test`;
      if (round % 2 === 0) {
        known.push(await timedRefusal(installed, knownEmail, WRONG));
        unknown.push(await timedRefusal(installed, unknownEmail, PASSWORD));
      } else {
        unknown.push(await timedRefusal(installed, unknownEmail, PASSWORD));
        known.push(await timedRefusal(installed, knownEmail, WRONG));
      }
    }

    const [knownMedian, unknownMedian] = [median(known), median(unknown)];
    console.log(JSON.stringify({ event: "signin_timing", knownMedian, unknownMedian }));
    expect(knownMedian).toBeGreaterThanOrEqual(150);
    expect(unknownMedian).toBeGreaterThanOrEqual(150);
    expect(Math.abs(knownMedian - unknownMedian)).toBeLessThanOrEqual(100);
  });
});
