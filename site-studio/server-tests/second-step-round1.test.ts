import { env } from "cloudflare:workers";
import { runInDurableObject } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { HASH_QUEUE_MAX_WAITING, hashPassword, hashQueue, toBase64, type PasswordHash } from "../server/auth/password";
import { newSessionToken, pendingCookieName, sessionCookieName, sessionTokenHash } from "../server/auth/session";
import { candidateSteps, stepAt, totpAt } from "../server/auth/totp";
import type { Installation } from "../server/installation/Installation";
import { SETTINGS_TABLE, USERS_TABLE } from "../server/installation/setupStore";
import { PENDING_TABLE, SESSIONS_TABLE, secondStepOperationInput, type SignInCompleted, type SignInCompletion } from "../server/installation/signInStore";
import { accountCheckInput, confirmTwoStepInput, startTwoStepInput } from "../server/installation/twoStepStore";
import { refusalBody } from "../shared/refusal";
import { normalisePassword } from "../shared/setup";
import { EMAIL_FREE_FAILURES, FIRST_WAIT_MS, SESSION_MAX_AGE_MS } from "../shared/signin";
import { base32Decode, PENDING_SIGNIN_TTL_MS } from "../shared/twoStep";
import {
  installationFor,
  jarFrom,
  post,
  refusalOf,
  SECOND_STEP_PATH,
  seedAccount,
  setCookiesOf,
  signedIn,
  signIn,
  turnedOnByRoutes,
  type Wrap,
} from "./signin-helpers";
import { codeOutside } from "./totp-codes";
import { newDeploymentKey } from "./two-step-fixtures";

// Story 1.5, CodeRabbit review of pull request 13, round 1 (S1 to S3): a sign-in refused as busy
// discards the pending sign-in it presents (D-3); the second step's deciding step reads a fresh
// clock, so a pending token that expires while the cryptography runs is expired there, and counts
// raised out of order never move a failure's time backward (D-4). Every key, secret, code and token
// is made at run time.

const SECOND = 1000;
const STEP = 30 * SECOND;
const T0 = Date.UTC(2026, 10, 22, 12, 0, 0);
const EMAIL = "dana@acme.test";

function stubFor(name: string) {
  return env.INSTALLATION.get(env.INSTALLATION.idFromName(`second-step-round1:${name}`));
}

type Outcome<T> = { ok: true; value: T } | { ok: false; code: string; retryAfterSeconds?: number };

async function refusedOr<T>(run: () => Promise<T> | T): Promise<Outcome<T>> {
  try {
    return { ok: true, value: await run() };
  } catch (error) {
    const refusal = error as { code?: string; retryAfterSeconds?: number };
    if (!refusal.code) throw error;
    return refusal.retryAfterSeconds === undefined ? { ok: false, code: refusal.code } : { ok: false, code: refusal.code, retryAfterSeconds: refusal.retryAfterSeconds };
  }
}

function inObject<T>(name: string, run: (instance: Installation) => Promise<T> | T): Promise<Outcome<T>> {
  return runInDurableObject(stubFor(name), (instance: Installation) => refusedOr(() => run(instance)));
}

function valueOf<T>(outcome: Outcome<T>): T {
  if (!outcome.ok) throw new Error(`refused: ${outcome.code}`);
  return outcome.value;
}

async function seedUser(name: string): Promise<string> {
  const id = crypto.randomUUID();
  const random = (bytes: number) => toBase64(crypto.getRandomValues(new Uint8Array(bytes)));
  await runInDurableObject(stubFor(name), (_instance, state) => {
    state.storage.sql.exec(
      `INSERT INTO ${USERS_TABLE} (id, email, name, role, active, password_algorithm, password_n, password_r, password_p,
         password_key_length, password_salt, password_hash, created_at)
       VALUES (?, ?, 'Dana Admin', 'administrator', 1, 'scrypt', 131072, 8, 1, 32, ?, ?, ?)`,
      id,
      EMAIL,
      random(16),
      random(32),
      new Date(T0).toISOString(),
    );
    state.storage.sql.exec(
      `INSERT OR IGNORE INTO ${SETTINGS_TABLE} (id, installation_name, public_address, set_up_at) VALUES (1, 'Acme Security', 'https://survey.acme.test', ?)`,
      new Date(T0).toISOString(),
    );
  });
  return id;
}

/** An account with two-step verification on, turned on at T0 through a session made for the purpose. */
async function twoStepAccount(name: string) {
  const id = await seedUser(name);
  const key = newDeploymentKey();
  const token = newSessionToken();
  const tokenHash = await sessionTokenHash(token);
  const cookies = await runInDurableObject(stubFor(name), async (instance: Installation, state) => {
    state.storage.sql.exec(
      `INSERT INTO ${SESSIONS_TABLE} (token_hash, user_id, signed_in_at, last_used_at, expires_at) VALUES (?, ?, ?, ?, ?)`,
      tokenHash,
      id,
      T0,
      T0,
      T0 + SESSION_MAX_AGE_MS,
    );
    return { [sessionCookieName(instance.signIn.identifier())]: token };
  });
  const ticket = valueOf(await inObject(name, (i) => i.twoStep.accountCheck(accountCheckInput.parse({ cookies, address: "unknown", purpose: "turn_on", deploymentKey: key }), T0))).ticket;
  const started = valueOf(await inObject(name, (i) => i.twoStep.startTwoStep(startTwoStepInput.parse({ cookies, ticket, outcome: "success", deploymentKey: key }), T0)));
  const secret = base32Decode(started.secret)!;
  const code = await totpAt(secret, stepAt(T0));
  valueOf(await inObject(name, (i) => i.twoStep.confirmTwoStep(confirmTwoStepInput.parse({ cookies, setupId: started.setupId, code, deploymentKey: key }), T0)));
  return { id, key, secret };
}

/** The password step at `now` from the unknown address; answers the browser's pending cookie. */
async function pendingAt(name: string, now: number): Promise<Record<string, string>> {
  const value = valueOf(
    await inObject<SignInCompletion>(name, async (i) => {
      const attempt = await i.signIn.attempt({ email: EMAIL, address: "unknown", cookies: {} }, now);
      return i.signIn.complete(attempt.ticket, "success", now);
    }),
  );
  if (value.kind !== "pending") throw new Error("expected a pending sign-in");
  return { [pendingCookieName(value.identifier)]: value.pendingToken };
}

const countsOf = (name: string) => runInDurableObject(stubFor(name), (instance: Installation) => instance.signIn.counts());
const pendingCount = (name: string) => runInDurableObject(stubFor(name), (instance: Installation) => instance.signIn.pendingCount());
const sessionCount = (name: string) =>
  runInDurableObject(stubFor(name), (_instance, state) => state.storage.sql.exec<{ n: number }>(`SELECT COUNT(*) AS n FROM ${SESSIONS_TABLE}`).one().n);

/**
 * The second step with the request's time `now` and, as the third argument, the clock the deciding
 * step reads (CodeRabbit S2, S3).
 */
function secondStepAt(instance: Installation, cookies: Record<string, string>, code: string, key: string, now: number, clock: () => number) {
  const input = secondStepOperationInput.parse({ cookies, address: "unknown", method: "code", code, deploymentKey: key });
  return refusedOr<SignInCompleted>(() => instance.signIn.secondStep(input, now, clock));
}

describe("the pending token's expiry at the deciding step (CodeRabbit S3, CA-46)", () => {
  it("signs in when the deciding step reads 1 ms before the expiry, and is second_step_expired, counting nothing and writing no session, when it reads the expiry, though the request began before it", async () => {
    for (const [suffix, decideOffset, expected] of [
      ["before", -1, "signedIn"],
      ["at", 0, "second_step_expired"],
    ] as const) {
      const name = `expiry-${suffix}`;
      const { key, secret } = await twoStepAccount(name);
      const passwordAt = T0 + STEP;
      const cookies = await pendingAt(name, passwordAt);
      const expiry = passwordAt + PENDING_SIGNIN_TTL_MS;
      const entry = expiry - 10 * SECOND;
      const code = await totpAt(secret, stepAt(entry));
      const countsBefore = await countsOf(name);
      const sessionsBefore = await sessionCount(name);
      const outcome = await runInDurableObject(stubFor(name), (instance: Installation) => secondStepAt(instance, cookies, code, key, entry, () => expiry + decideOffset));
      if (expected === "signedIn") {
        expect(outcome.ok).toBe(true);
        expect(await sessionCount(name)).toBe(sessionsBefore + 1);
      } else {
        expect(outcome).toEqual({ ok: false, code: "second_step_expired" });
        expect(await sessionCount(name)).toBe(sessionsBefore);
        expect(await countsOf(name)).toEqual(countsBefore);
      }
      expect(await pendingCount(name)).toBe(0);
    }
  });
});

describe("second-step failures decided out of order (CodeRabbit S2, D-4)", () => {
  it("raise the email count at the deciding step's time, so a later-started failure decided first never leaves the count's time moving backward and the wait ends when it should", async () => {
    const name = "out-of-order";
    const { key, secret } = await twoStepAccount(name);
    const passwordAt = T0 + STEP;
    // Two pending sign-ins (2 failures) and one wrong password (3): the next two wrong codes are the
    // fourth and the fifth (the first wait, EMAIL_FREE_FAILURES).
    const first = await pendingAt(name, passwordAt);
    const second = await pendingAt(name, passwordAt);
    valueOf(
      await inObject(name, async (i) => {
        const attempt = await i.signIn.attempt({ email: EMAIL, address: "unknown", cookies: {} }, passwordAt);
        return refusedOr(() => i.signIn.complete(attempt.ticket, "failure", passwordAt));
      }),
    );
    expect((await countsOf(name)).byEmail.map((row) => row.failures)).toEqual([EMAIL_FREE_FAILURES - 2]);

    const t1 = passwordAt + 10 * SECOND; // A's request time
    const t2 = passwordAt + 20 * SECOND; // B's request time
    const t3 = passwordAt + 21 * SECOND; // when A decides
    // None of the codes the window holds at any time either request is checked or decided at
    // (wrongCodeAt for each of t1, t2 and t3 at once).
    const wrong = await codeOutside(secret, [...new Set([t1, t2, t3].flatMap((at) => candidateSteps(at)))]);
    let clockNow = t1;
    const clock = () => clockNow;

    const [a, b] = await runInDurableObject(stubFor(name), async (instance: Installation) => {
      const store = instance.twoStep;
      const original = store.decryptSecret.bind(store);
      let arrived!: () => void;
      const aArrived = new Promise<void>((resolve) => (arrived = resolve));
      let release!: () => void;
      const aReleased = new Promise<void>((resolve) => (release = resolve));
      let calls = 0;
      // A's decryption waits until B has decided; B's runs straight through.
      store.decryptSecret = async (...args: Parameters<typeof original>) => {
        const plaintext = await original(...args);
        calls += 1;
        if (calls === 1) {
          arrived();
          await aReleased;
        }
        return plaintext;
      };
      try {
        const aRun = secondStepAt(instance, first, wrong, key, t1, clock);
        await aArrived;
        clockNow = t2;
        const bOutcome = await secondStepAt(instance, second, wrong, key, t2, clock);
        clockNow = t3;
        release();
        return [await aRun, bOutcome];
      } finally {
        store.decryptSecret = original;
      }
    });

    expect(b).toEqual({ ok: false, code: "second_step_code_wrong" });
    expect(a).toEqual({ ok: false, code: "signin_wait", retryAfterSeconds: FIRST_WAIT_MS / SECOND });
    const [row] = (await countsOf(name)).byEmail;
    expect(row!.failures).toBe(EMAIL_FREE_FAILURES);
    expect(row!.lastFailureAt).toBeGreaterThanOrEqual(t2);
    expect(row!.lastFailureAt).toBe(t3);

    // A minute after A's request time, but before a minute after A's decision, the wait still holds.
    const probe = t1 + FIRST_WAIT_MS + 1;
    expect(probe).toBeLessThan(t3 + FIRST_WAIT_MS);
    const attempt = await inObject(name, (i) => i.signIn.attempt({ email: EMAIL, address: "unknown", cookies: {} }, probe));
    expect(attempt).toMatchObject({ ok: false, code: "signin_wait" });
  });
});

/** Holds the isolate's hash queue full (one running, all waiting places taken) until released. */
function fillHashQueue() {
  let release!: () => void;
  const running = new Promise<void>((resolve) => (release = resolve));
  const tasks = [hashQueue.run(() => running)];
  for (let index = 0; index < HASH_QUEUE_MAX_WAITING; index += 1) tasks.push(hashQueue.run(async () => undefined));
  return async () => {
    release();
    await Promise.all(tasks);
  };
}

describe("a sign-in refused as busy with a pending cookie presented (CodeRabbit S1, D-3)", { timeout: 120_000 }, () => {
  const PASSWORD = "correct horse battery staple";
  let hash: PasswordHash;
  beforeAll(async () => {
    hash = await hashPassword(normalisePassword(PASSWORD));
  });

  it("discards the pending sign-in it presents, counting nothing: the same cookie's second step is then second_step_expired", async () => {
    const installed = installationFor("second-step-round1:busy-discards");
    await seedAccount(installed.stub, { email: EMAIL, hash });
    const session = await signedIn(installed.env, EMAIL, PASSWORD);
    const on = await turnedOnByRoutes(installed.env, session, PASSWORD);
    const identifier = await runInDurableObject(installed.stub, (instance: Installation) => instance.signIn.identifier());

    const signedInPending = await signIn(installed.env, EMAIL, PASSWORD);
    expect(await signedInPending.json()).toEqual({ secondStep: true });
    const jar = jarFrom(signedInPending);
    expect(jar[pendingCookieName(identifier)]).toBeDefined();
    const pendingRows = () => runInDurableObject(installed.stub, (instance: Installation) => instance.signIn.pendingCount());
    expect(await pendingRows()).toBe(1);
    const countsBefore = await runInDurableObject(installed.stub, (instance: Installation) => instance.signIn.counts());

    installed.calls.clear();
    const release = fillHashQueue();
    let busy: Response;
    try {
      expect(hashQueue.hasRoom()).toBe(false);
      busy = await signIn(installed.env, EMAIL, PASSWORD, { cookies: jar });
    } finally {
      await release();
    }
    expect(busy.status).toBe(503);
    expect((await refusalOf(busy, [PASSWORD, ...Object.values(jar)])).code).toBe("signin_busy");
    expect(setCookiesOf(busy).map((cookie) => [cookie.name, cookie.value])).toEqual([[pendingCookieName(identifier), ""]]);
    expect(installed.calls.get("signInAttempt")).toBeUndefined();
    expect(await runInDurableObject(installed.stub, (instance: Installation) => instance.signIn.counts())).toEqual(countsBefore);
    expect(await pendingRows()).toBe(0);

    // A second step already in flight with the same cookie can no longer complete.
    const late = await post(installed.env, SECOND_STEP_PATH, { method: "recovery", code: on.recoveryCodes[0]! }, { cookies: jar });
    expect(late.status).toBe(401);
    expect((await refusalOf(late, [on.recoveryCodes[0]!])).code).toBe("second_step_expired");
  });
});

describe("the deciding clock through the installation object's operation (round 1 review, item 2)", () => {
  it("is the real clock: a pending token that expires while the code's cryptography runs is second_step_expired, not signed in", async () => {
    const name = "operation-clock";
    const { key, secret } = await twoStepAccount(name);
    const entry = Date.now();
    const cookies = await pendingAt(name, entry);
    const code = await totpAt(secret, stepAt(entry));
    const sessionsBefore = await sessionCount(name);
    const outcome = await runInDurableObject(stubFor(name), async (instance: Installation) => {
      const store = instance.twoStep;
      const original = store.decryptSecret.bind(store);
      const realNow = Date.now;
      // While the secret is decrypted, the clock moves past the pending token's expiry. The request's
      // time was read before, so only a clock read at the deciding step can see it.
      store.decryptSecret = async (...args: Parameters<typeof original>) => {
        const plaintext = await original(...args);
        const later = realNow() + PENDING_SIGNIN_TTL_MS + 60 * SECOND;
        Date.now = () => later;
        return plaintext;
      };
      try {
        return await refusedOr(() =>
          instance.ops.get("secondStep")!.run({ cookies, address: "unknown", method: "code", code, deploymentKey: key }) as Promise<SignInCompleted>,
        );
      } finally {
        Date.now = realNow;
        store.decryptSecret = original;
      }
    });
    expect(outcome).toEqual({ ok: false, code: "second_step_expired" });
    expect(await sessionCount(name)).toBe(sessionsBefore);
    expect(await pendingCount(name)).toBe(0);
  });
});

describe("discardPending in the store (round 1 review, item 4)", () => {
  it("deletes only this installation's presented pending row, leaving another browser's row and a cookie under another identifier alone", async () => {
    const name = "discard-store";
    await twoStepAccount(name);
    const mine = await pendingAt(name, T0 + STEP);
    const other = await pendingAt(name, T0 + STEP);
    const hashes = () =>
      runInDurableObject(stubFor(name), (_instance, state) =>
        state.storage.sql.exec<{ token_hash: string }>(`SELECT token_hash FROM ${PENDING_TABLE} ORDER BY token_hash`).toArray().map((row) => row.token_hash),
      );
    const otherHash = await sessionTokenHash(Object.values(other)[0]!);
    expect(await hashes()).toHaveLength(2);
    // The other browser's token, presented under another installation's identifier, is not this installation's.
    const foreign = { [pendingCookieName("f".repeat(32))]: Object.values(other)[0]! };
    const identifier = await runInDurableObject(stubFor(name), (instance: Installation) => instance.signIn.identifier());
    const answer = await runInDurableObject(stubFor(name), (instance: Installation) => instance.signIn.discardPending({ ...mine, ...foreign }));
    expect(answer).toEqual({ identifier });
    expect(await hashes()).toEqual([otherHash]);
    // Presenting nothing of this installation's discards nothing.
    await runInDurableObject(stubFor(name), (instance: Installation) => instance.signIn.discardPending(foreign));
    expect(await hashes()).toEqual([otherHash]);
  });
});

describe("a busy sign-in whose discard fails (round 1 review, item 1)", { timeout: 120_000 }, () => {
  const PASSWORD = "correct horse battery staple";
  let hash: PasswordHash;
  beforeAll(async () => {
    hash = await hashPassword(normalisePassword(PASSWORD));
  });

  for (const [how, failure] of [
    ["refused", () => Promise.resolve(Response.json(refusalBody("updating"), { status: 503 }))],
    ["throwing", () => Promise.reject(new Error("test: the object was reset"))],
  ] as const) {
    it(`still answers 503 signin_busy with the line clearing this installation's pending cookie when discardPending is ${how}`, async () => {
      const wrap: Wrap = (operation, _init, send) => (operation === "discardPending" ? failure() : send());
      const installed = installationFor(`second-step-round1:busy-discard-${how}`, wrap);
      await seedAccount(installed.stub, { email: EMAIL, hash });
      const identifier = await runInDurableObject(installed.stub, (instance: Installation) => instance.signIn.identifier());
      const jar = { [pendingCookieName(identifier)]: newSessionToken(), [pendingCookieName("d".repeat(32))]: newSessionToken() };
      installed.calls.clear();
      const release = fillHashQueue();
      let busy: Response;
      try {
        expect(hashQueue.hasRoom()).toBe(false);
        busy = await signIn(installed.env, EMAIL, PASSWORD, { cookies: jar });
      } finally {
        await release();
      }
      expect(busy.status).toBe(503);
      expect(busy.headers.get("retry-after")).toBe("5");
      expect((await refusalOf(busy, [PASSWORD, ...Object.values(jar)])).code).toBe("signin_busy");
      expect(setCookiesOf(busy).map((cookie) => [cookie.name, cookie.value])).toEqual([[pendingCookieName(identifier), ""]]);
      expect(installed.calls.get("discardPending")).toBeGreaterThan(0);
      expect(installed.calls.get("signInAttempt")).toBeUndefined();
    });
  }
});
