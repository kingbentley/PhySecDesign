import { runInDurableObject } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { normalisePassword } from "../shared/setup";
import { hashPassword, type PasswordHash } from "../server/auth/password";
import type { Installation } from "../server/installation/Installation";
import { SESSIONS_TABLE } from "../server/installation/signInStore";
import { installationFor, readSession, refusalOf, seedAccount, signedIn, signIn, signOut, type Wrap } from "./signin-helpers";

// Retrying the sign-in routes' object calls (story 1.2's D-2 as amended, V-16, E-6). Counting an
// attempt and completing it write, so after a bare reset (`durableObjectReset` without the
// version-stop reason) neither is sent again and the error reaches the client. The session read
// writes nothing and ending a session is safe to repeat, so each is sent once more after a bare reset.

const PASSWORD = "correct horse battery staple";
const EMAIL = "dana@acme.test";
let hash: PasswordHash;

beforeAll(async () => {
  hash = await hashPassword(normalisePassword(PASSWORD));
});

const bareReset = () => Object.assign(new Error("Durable Object reset because its code was updated."), { durableObjectReset: true });

/** Fails the first call to `operation` as a bare reset would, after the object answered (a committed write). */
function resetOnce(operation: string): Wrap {
  let done = false;
  return async (name, _init, send) => {
    const response = await send();
    if (name !== operation || done) return response;
    done = true;
    await response.arrayBuffer();
    throw bareReset();
  };
}

async function quietly<T>(work: () => Promise<T>): Promise<T> {
  const log = console.error;
  console.error = () => {};
  try {
    return await work();
  } finally {
    console.error = log;
  }
}

describe("a bare reset", { timeout: 60_000 }, () => {
  for (const operation of ["signInAttempt", "completeSignIn"]) {
    it(`on ${operation} is not retried: one call, and the error reaches the client`, async () => {
      const installed = installationFor(`retry-${operation}`, resetOnce(operation));
      await seedAccount(installed.stub, { email: EMAIL, hash });
      const response = await quietly(() => signIn(installed.env, EMAIL, PASSWORD));
      expect(response.status).toBe(500);
      expect((await refusalOf(response, [EMAIL, PASSWORD])).code).toBe("internal_error");
      expect(response.headers.getSetCookie()).toEqual([]);
      expect(installed.calls.get(operation)).toBe(1);
      expect(installed.calls.get("signInAttempt")).toBe(1);
    });
  }

  it("on the session read is retried once and the read answers", async () => {
    const installed = installationFor("retry-session", resetOnce("sessionInfo"));
    await seedAccount(installed.stub, { email: EMAIL, hash });
    const cookies = await signedIn(installed.env, EMAIL, PASSWORD);
    const response = await readSession(installed.env, { cookies });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ signedIn: true });
    expect(installed.calls.get("sessionInfo")).toBe(2);
  });

  it("on ending a session is retried once and the sign-out succeeds", async () => {
    const installed = installationFor("retry-end-session", resetOnce("endSession"));
    await seedAccount(installed.stub, { email: EMAIL, hash });
    const cookies = await signedIn(installed.env, EMAIL, PASSWORD);
    const response = await signOut(installed.env, { cookies });
    expect(response.status).toBe(200);
    expect(response.headers.getSetCookie()).toHaveLength(1);
    expect(installed.calls.get("endSession")).toBe(2);
    const sessions = await runInDurableObject(installed.stub, (_instance: Installation, state) => state.storage.sql.exec(`SELECT * FROM ${SESSIONS_TABLE}`).toArray());
    expect(sessions).toEqual([]);
  });
});
