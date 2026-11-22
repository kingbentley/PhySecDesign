import { env } from "cloudflare:workers";
import { runInDurableObject } from "cloudflare:test";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { makeMarker, markerCookieName, newMarkerId } from "../server/auth/marker";
import { toBase64 } from "../server/auth/password";
import { newSessionToken, pendingCookieName, sessionCookieName, sessionTokenHash, sha256Hex } from "../server/auth/session";
import { stepAt, totpAt } from "../server/auth/totp";
import type { Installation } from "../server/installation/Installation";
import { SETTINGS_TABLE, USERS_TABLE } from "../server/installation/setupStore";
import {
  PENDING_TABLE,
  SESSIONS_TABLE,
  secondStepOperationInput,
  type SignInCompleted,
  type SignInCompletion,
  type SignInPending,
} from "../server/installation/signInStore";
import {
  accountCheckInput,
  confirmTwoStepInput,
  RECOVERY_CODES_TABLE,
  startTwoStepInput,
  turnOffTwoStepInput,
  TWO_STEP_TABLE,
  type AccountCheckPurpose,
} from "../server/installation/twoStepStore";
import { callObject } from "../server/objects/call";
import { emailWaitMs, markerWaitMs, secondsLeft, SESSION_MAX_AGE_MS } from "../shared/signin";
import { base32Decode, normaliseRecoveryCode, PENDING_SIGNIN_TTL_MS } from "../shared/twoStep";
import { newDeploymentKey } from "./two-step-fixtures";

// The second sign-in step in the installation object (story 1.5, spec 3): the pending row written
// by a correct password for an account with two-step verification on, the second step with a code
// or a recovery code under story 1.3's counts and waits, the pending row's expiry and discarding,
// the re-checks of the deciding step, and two second steps at once (CAP-3, CAP-4, CAP-5, CAP-6).
// Every key, secret, code and token is made at run time.

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const STEP = 30 * SECOND;
// A step boundary, so `T0 + n * STEP` is the start of a step.
const T0 = Date.UTC(2026, 10, 22, 12, 0, 0);
const S0 = stepAt(T0);
const ADDRESS = "198.51.100.7";
const EMAIL = "dana@acme.test";

function idFor(name: string) {
  return env.INSTALLATION.idFromName(`second-step-store:${name}`);
}

function stubFor(name: string) {
  return env.INSTALLATION.get(idFor(name));
}

function randomBase64(bytes: number) {
  return toBase64(crypto.getRandomValues(new Uint8Array(bytes)));
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

const identifierOf = (name: string) => runInDurableObject(stubFor(name), (instance: Installation) => instance.signIn.identifier());

async function seedUser(name: string, email = EMAIL): Promise<string> {
  const id = crypto.randomUUID();
  await runInDurableObject(stubFor(name), (_instance, state) => {
    state.storage.sql.exec(
      `INSERT INTO ${USERS_TABLE} (id, email, name, role, active, password_algorithm, password_n, password_r, password_p,
         password_key_length, password_salt, password_hash, created_at)
       VALUES (?, ?, 'Dana Admin', 'administrator', 1, 'scrypt', 131072, 8, 1, 32, ?, ?, ?)`,
      id,
      email,
      randomBase64(16),
      randomBase64(32),
      new Date(T0).toISOString(),
    );
    state.storage.sql.exec(
      `INSERT OR IGNORE INTO ${SETTINGS_TABLE} (id, installation_name, public_address, set_up_at) VALUES (1, 'Acme Security', 'https://survey.acme.test', ?)`,
      new Date(T0).toISOString(),
    );
  });
  return id;
}

/** Stores a session for the account straight in the sessions table and answers the browser's session cookie. */
async function sessionFor(name: string, userId: string, signedInAt = T0): Promise<Record<string, string>> {
  const token = newSessionToken();
  const tokenHash = await sessionTokenHash(token);
  await runInDurableObject(stubFor(name), (_instance, state) => {
    state.storage.sql.exec(
      `INSERT INTO ${SESSIONS_TABLE} (token_hash, user_id, signed_in_at, last_used_at, expires_at) VALUES (?, ?, ?, ?, ?)`,
      tokenHash,
      userId,
      signedInAt,
      signedInAt,
      signedInAt + SESSION_MAX_AGE_MS,
    );
  });
  return { [sessionCookieName(await identifierOf(name))]: token };
}

const accountCheck = (name: string, cookies: Record<string, string>, purpose: AccountCheckPurpose, key: string, now: number) =>
  inObject(name, (i) => i.twoStep.accountCheck(accountCheckInput.parse({ cookies, address: "unknown", purpose, deploymentKey: key }), now));

/**
 * Turns two-step verification on for the account at `now` (last accepted step = `stepAt(now)`),
 * through a session made for the purpose; answers the secret and the recovery codes.
 */
async function turnedOn(name: string, userId: string, key: string, now = T0) {
  const cookies = await sessionFor(name, userId, now);
  const ticket = valueOf(await accountCheck(name, cookies, "turn_on", key, now)).ticket;
  const started = valueOf(await inObject(name, (i) => i.twoStep.startTwoStep(startTwoStepInput.parse({ cookies, ticket, outcome: "success", deploymentKey: key }), now)));
  const secret = base32Decode(started.secret)!;
  const code = await totpAt(secret, stepAt(now));
  const made = valueOf(await inObject(name, (i) => i.twoStep.confirmTwoStep(confirmTwoStepInput.parse({ cookies, setupId: started.setupId, code, deploymentKey: key }), now)));
  return { secret, codes: made.recoveryCodes, cookies };
}

/** An account with two-step verification on, turned on at `now`. */
async function twoStepAccount(name: string, email = EMAIL, now = T0, key = newDeploymentKey()) {
  const id = await seedUser(name, email);
  return { id, key, email, ...(await turnedOn(name, id, key, now)) };
}

/** The password step: a counted attempt completed as a success at `now`. */
function passwordStep(name: string, email: string, now: number, options: { address?: string; cookies?: Record<string, string> } = {}) {
  return inObject<SignInCompletion>(name, async (i) => {
    const attempt = await i.signIn.attempt({ email, address: options.address ?? ADDRESS, cookies: options.cookies ?? {} }, now);
    return i.signIn.complete(attempt.ticket, "success", now);
  });
}

/** The password step for a two-step account; answers the pending answer and the browser's pending cookie. */
async function pendingAt(name: string, email: string, now: number, options: { address?: string; cookies?: Record<string, string> } = {}) {
  const value = valueOf(await passwordStep(name, email, now, options));
  if (value.kind !== "pending") throw new Error("expected a pending sign-in");
  return { pending: value, cookies: { [pendingCookieName(value.identifier)]: value.pendingToken } };
}

function secondStep(
  name: string,
  input: { cookies: Record<string, string>; method: "code" | "recovery"; code: string; key?: string | undefined; address?: string },
  now: number,
) {
  return inObject<SignInCompleted>(name, (i) =>
    i.signIn.secondStep(
      secondStepOperationInput.parse({ cookies: input.cookies, address: input.address ?? ADDRESS, method: input.method, code: input.code, deploymentKey: input.key }),
      now,
    ),
  );
}

const rowsOf = (name: string, table: string) =>
  runInDurableObject(stubFor(name), (_instance, s) => s.storage.sql.exec(`SELECT * FROM ${table} ORDER BY rowid`).toArray());
const countsOf = (name: string) => runInDurableObject(stubFor(name), (instance: Installation) => instance.signIn.counts());
const emailFailures = async (name: string) => (await countsOf(name)).byEmail.reduce((sum, row) => sum + row.failures, 0);
const pendingCount = (name: string) => runInDurableObject(stubFor(name), (instance: Installation) => instance.signIn.pendingCount());
const sessionHashes = async (name: string) => (await rowsOf(name, SESSIONS_TABLE)).map((row) => String(row.token_hash));
const lastStep = async (name: string, userId: string) => (await rowsOf(name, TWO_STEP_TABLE)).find((row) => row.account_id === userId)!.last_step;

/** A code of the six digits that is not `code`. */
const otherThan = (code: string) => String((Number(code) + 1) % 1_000_000).padStart(6, "0");

async function sessionLive(name: string, cookies: Record<string, string>, now: number): Promise<boolean> {
  return runInDurableObject(stubFor(name), async (instance: Installation) => (await instance.signIn.sessionInfo(cookies, now)).signedIn);
}

function markerFor(name: string, accountId: string, now: number): Promise<Record<string, string>> {
  return runInDurableObject(stubFor(name), async (instance: Installation) => {
    const session = await instance.signIn.prepareSession();
    return { [markerCookieName(session.identifier)]: await makeMarker(session.markerKey, accountId, newMarkerId(), now) };
  });
}

/** Fails the email `count` times at `now` from `address`, each ticket completed as a failure. */
async function failPasswords(name: string, email: string, count: number, now: number, address: string) {
  for (let index = 0; index < count; index += 1) {
    await inObject(name, async (i) => {
      const attempt = await i.signIn.attempt({ email, address, cookies: {} }, now);
      return i.signIn.complete(attempt.ticket, "failure", now);
    });
  }
}

describe("the password step (CAP-3, CA-46)", () => {
  it("signs in at once for an account with two-step verification off, as in story 1.3", async () => {
    const name = "off";
    await seedUser(name);
    const value = valueOf(await passwordStep(name, EMAIL, T0));
    expect(value.kind).toBe("signedIn");
    expect((value as SignInCompleted).sessionToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(await pendingCount(name)).toBe(0);
    expect(await rowsOf(name, SESSIONS_TABLE)).toHaveLength(1);
  });

  it("for a two-step account writes one pending row holding only the token's 64-hex hash, no session, and clears no count (criterion 4)", async () => {
    const name = "pending";
    const { id } = await twoStepAccount(name);
    const presented = await sessionFor(name, id, T0);
    const sessionsBefore = await sessionHashes(name);
    const now = T0 + SECOND;
    const value = valueOf(await passwordStep(name, EMAIL, now, { cookies: presented }));
    expect(value).toEqual({ kind: "pending", identifier: await identifierOf(name), pendingToken: expect.stringMatching(/^[A-Za-z0-9_-]{43}$/) });
    const { pendingToken } = value as SignInPending;
    const rows = await rowsOf(name, PENDING_TABLE);
    expect(rows).toEqual([
      {
        token_hash: await sessionTokenHash(pendingToken),
        user_id: id,
        email_key: expect.stringMatching(/^[0-9a-f]{64}$/),
        address_failure_id: expect.any(Number),
        marker_id: null,
        hash_identity: expect.any(String),
        presented_session_hash: await sessionTokenHash(Object.values(presented)[0]!),
        expires_at: now + PENDING_SIGNIN_TTL_MS,
      },
    ]);
    expect(rows[0]!.token_hash).toMatch(/^[0-9a-f]{64}$/);
    for (const column of Object.values(rows[0]!)) expect(column).not.toBe(pendingToken);
    expect(JSON.stringify(rows)).not.toContain(pendingToken);
    // No session written, none ended; the attempt's counts stay raised.
    expect(await sessionHashes(name)).toEqual(sessionsBefore);
    const counts = await countsOf(name);
    expect(counts.byEmail.map((row) => row.failures)).toEqual([1]);
    expect(counts.byAddress).toHaveLength(1);
    expect(counts.tickets).toBe(0);
  });

  it("writes the pending row with no key given; a code under another key or none is refused deployment_key_mismatch, uncounted, the row kept; a recovery code then signs in (D-15)", async () => {
    const name = "pending-mismatch";
    const { codes } = await twoStepAccount(name);
    const { cookies } = await pendingAt(name, EMAIL, T0 + SECOND);
    expect(await pendingCount(name)).toBe(1);
    const before = await countsOf(name);
    // A code under K′ is refused, not counted, the row kept.
    const code = "123456";
    expect(await secondStep(name, { cookies, method: "code", code, key: newDeploymentKey() }, T0 + SECOND)).toEqual({ ok: false, code: "deployment_key_mismatch" });
    expect(await secondStep(name, { cookies, method: "code", code, key: undefined }, T0 + SECOND)).toEqual({ ok: false, code: "deployment_key_mismatch" });
    expect(await countsOf(name)).toEqual(before);
    expect(await pendingCount(name)).toBe(1);
    // A recovery code needs no key.
    expect((await secondStep(name, { cookies, method: "recovery", code: codes[0]!, key: newDeploymentKey() }, T0 + SECOND)).ok).toBe(true);
  });
});

describe("a correct code (criterion 5, CA-47)", () => {
  it("starts a session, deletes the pending row, sets the last step, clears the counts and ends the sessions presented at the password step and now", async () => {
    const name = "code-right";
    const { id, key, secret } = await twoStepAccount(name);
    const atPassword = await sessionFor(name, id, T0);
    const atSecond = await sessionFor(name, id, T0);
    const now = T0 + STEP;
    const { cookies } = await pendingAt(name, EMAIL, now, { cookies: atPassword });
    // A failure from the same address for another email stays counted.
    await failPasswords(name, "someone@acme.test", 1, now, ADDRESS);
    const code = await totpAt(secret, stepAt(now));
    const done = valueOf(await secondStep(name, { cookies: { ...cookies, ...atSecond }, method: "code", code, key }, now));
    expect(done).toEqual({
      kind: "signedIn",
      identifier: await identifierOf(name),
      sessionToken: expect.stringMatching(/^[A-Za-z0-9_-]{43}$/),
      marker: expect.any(String),
      account: { id, name: "Dana Admin" },
      signedInAt: new Date(now).toISOString(),
    });
    expect(await pendingCount(name)).toBe(0);
    expect(await lastStep(name, id)).toBe(stepAt(now));
    const counts = await countsOf(name);
    expect(counts.byEmail).toHaveLength(1); // someone@'s only
    expect(counts.byAddress).toHaveLength(1);
    expect(counts.byMarker).toEqual([]);
    expect(await sessionLive(name, atPassword, now)).toBe(false);
    expect(await sessionLive(name, atSecond, now)).toBe(false);
    expect(await sessionLive(name, { [sessionCookieName(done.identifier)]: done.sessionToken }, now)).toBe(true);
    // The pending token is spent.
    expect(await secondStep(name, { cookies, method: "code", code, key }, now)).toEqual({ ok: false, code: "second_step_expired" });
  });

  it("accepts the code of the step before and of the step after the current one (CA-12)", async () => {
    const before = "code-step-before";
    const a = await twoStepAccount(before);
    const later = T0 + 2 * STEP;
    const { cookies: first } = await pendingAt(before, EMAIL, later);
    expect((await secondStep(before, { cookies: first, method: "code", code: await totpAt(a.secret, S0 + 1), key: a.key }, later)).ok).toBe(true);

    const after = "code-step-after";
    const b = await twoStepAccount(after);
    const { cookies: second } = await pendingAt(after, EMAIL, T0 + STEP);
    expect((await secondStep(after, { cookies: second, method: "code", code: await totpAt(b.secret, S0 + 2), key: b.key }, T0 + STEP)).ok).toBe(true);
    expect(await lastStep(after, b.id)).toBe(S0 + 2);
  });
});

describe("a reused code (criterion 14, D-6)", () => {
  it("is refused second_step_code_wrong and counted in a new pending sign-in, in the same step and the next one", async () => {
    const name = "code-reused";
    const { key, secret } = await twoStepAccount(name);
    const now = T0 + STEP;
    const code = await totpAt(secret, stepAt(now));
    const { cookies } = await pendingAt(name, EMAIL, now);
    valueOf(await secondStep(name, { cookies, method: "code", code, key }, now));

    for (const at of [now + SECOND, now + STEP]) {
      const again = await pendingAt(name, EMAIL, at, { address: "unknown" });
      const before = await emailFailures(name);
      expect(await secondStep(name, { cookies: again.cookies, method: "code", code, key, address: "unknown" }, at)).toEqual({ ok: false, code: "second_step_code_wrong" });
      expect(await emailFailures(name)).toBe(before + 1);
      expect(await rowsOf(name, SESSIONS_TABLE)).toHaveLength(2); // the turn-on's and the one sign-in
    }
  });
});

describe("two second steps at once (criterion 14, finding 9)", () => {
  async function liveAccount(name: string) {
    const now = Date.now();
    const id = await seedUser(name);
    const key = newDeploymentKey();
    const on = await turnedOn(name, id, key, now);
    const first = await pendingAt(name, EMAIL, now, { address: "unknown" });
    const second = await pendingAt(name, EMAIL, now, { address: "unknown" });
    return { id, key, ...on, first, second };
  }

  const send = (name: string, cookies: Record<string, string>, method: "code" | "recovery", code: string, key: string) =>
    callObject(env.INSTALLATION, idFor(name), "secondStep", { cookies, address: "unknown", method, code, deploymentKey: key });

  it("sign in exactly once with one code sent with two pending tokens; the other is refused second_step_code_wrong", async () => {
    const name = "at-once-code";
    const { key, secret, first, second } = await liveAccount(name);
    const sessionsBefore = (await rowsOf(name, SESSIONS_TABLE)).length;
    // A step later than the one the turn-on accepted, still within the window.
    const code = await totpAt(secret, stepAt(Date.now()) + 1);
    const results = await Promise.all([send(name, first.cookies, "code", code, key), send(name, second.cookies, "code", code, key)]);
    expect(results.filter((result) => result.ok)).toHaveLength(1);
    expect(results.filter((result) => !result.ok).map((result) => (result.ok ? "" : result.body.error.code))).toEqual(["second_step_code_wrong"]);
    expect((await rowsOf(name, SESSIONS_TABLE)).length).toBe(sessionsBefore + 1);
  });

  it("sign in exactly once with one code when both have decrypted before either decides, so the last step is read in the deciding step (D-6)", async () => {
    const name = "at-once-interleaved";
    const { key, secret } = await twoStepAccount(name);
    const now = T0 + STEP;
    const first = await pendingAt(name, EMAIL, now, { address: "unknown" });
    const second = await pendingAt(name, EMAIL, now, { address: "unknown" });
    const code = await totpAt(secret, stepAt(now));
    const sessionsBefore = (await rowsOf(name, SESSIONS_TABLE)).length;
    const outcomes = await runInDurableObject(stubFor(name), async (instance: Installation) => {
      const store = instance.twoStep;
      const original = store.decryptSecret.bind(store);
      // Each decryption waits until both second steps have decrypted, so neither decides first.
      let arrived = 0;
      let release: () => void = () => {};
      const bothArrived = new Promise<void>((resolve) => (release = resolve));
      store.decryptSecret = async (...args: Parameters<typeof original>) => {
        const plaintext = await original(...args);
        arrived += 1;
        if (arrived === 2) release();
        await bothArrived;
        return plaintext;
      };
      const run = (cookies: Record<string, string>) =>
        refusedOr(() => instance.signIn.secondStep(secondStepOperationInput.parse({ cookies, address: "unknown", method: "code", code, deploymentKey: key }), now));
      try {
        return await Promise.all([run(first.cookies), run(second.cookies)]);
      } finally {
        store.decryptSecret = original;
      }
    });
    expect(outcomes.filter((outcome) => outcome.ok)).toHaveLength(1);
    expect(outcomes.filter((outcome) => !outcome.ok)).toEqual([{ ok: false, code: "second_step_code_wrong" }]);
    expect((await rowsOf(name, SESSIONS_TABLE)).length).toBe(sessionsBefore + 1);
  });

  it("sign in exactly once with one recovery code sent with two pending tokens; its row is deleted once", async () => {
    const name = "at-once-recovery";
    const { key, codes, first, second } = await liveAccount(name);
    const sessionsBefore = (await rowsOf(name, SESSIONS_TABLE)).length;
    const results = await Promise.all([send(name, first.cookies, "recovery", codes[0]!, key), send(name, second.cookies, "recovery", codes[0]!, key)]);
    expect(results.filter((result) => result.ok)).toHaveLength(1);
    expect(results.filter((result) => !result.ok).map((result) => (result.ok ? "" : result.body.error.code))).toEqual(["second_step_recovery_code_wrong"]);
    expect((await rowsOf(name, SESSIONS_TABLE)).length).toBe(sessionsBefore + 1);
    expect(await rowsOf(name, RECOVERY_CODES_TABLE)).toHaveLength(9);
  });
});

describe("recovery codes (criterion 6)", () => {
  it("sign in with an unused code in any case and with spaces, deleting that code's row; the same code is then refused and counted", async () => {
    const name = "recovery";
    const { id, codes } = await twoStepAccount(name);
    const { cookies } = await pendingAt(name, EMAIL, T0 + SECOND);
    const entered = ` ${codes[3]!.toUpperCase().replace(/-/g, " ")} `;
    const usedHash = await sha256Hex(normaliseRecoveryCode(codes[3]!)!);
    // Through the operation's own schema, as the Worker passes it.
    const done = valueOf(await secondStep(name, { cookies, method: "recovery", code: entered }, T0 + SECOND));
    expect(done.account.id).toBe(id);
    const rows = await rowsOf(name, RECOVERY_CODES_TABLE);
    expect(rows).toHaveLength(9);
    expect(rows.map((row) => row.code_hash)).not.toContain(usedHash);
    expect(await pendingCount(name)).toBe(0);

    const again = await pendingAt(name, EMAIL, T0 + 2 * SECOND);
    const before = await emailFailures(name);
    expect(await secondStep(name, { cookies: again.cookies, method: "recovery", code: codes[3]! }, T0 + 2 * SECOND)).toEqual({
      ok: false,
      code: "second_step_recovery_code_wrong",
    });
    expect(await emailFailures(name)).toBe(before + 1);
    expect(await rowsOf(name, RECOVERY_CODES_TABLE)).toHaveLength(9);
    // A value that does not normalise counts as wrong.
    expect(await secondStep(name, { cookies: again.cookies, method: "recovery", code: "not a code" }, T0 + 2 * SECOND)).toEqual({
      ok: false,
      code: "second_step_recovery_code_wrong",
    });
  });

  it("when right ends the sessions presented at the password step and now, clears the email and marker counts, and leaves the last accepted step unchanged", async () => {
    const name = "recovery-clears";
    const { id, codes } = await twoStepAccount(name);
    const marker = await markerFor(name, id, T0);
    const atPassword = await sessionFor(name, id, T0);
    const atSecond = await sessionFor(name, id, T0);
    const now = T0 + STEP;
    const { cookies } = await pendingAt(name, EMAIL, now, { cookies: { ...atPassword, ...marker } });
    expect(await secondStep(name, { cookies, method: "recovery", code: "0000-0000-0000-0000" }, now)).toEqual({ ok: false, code: "second_step_recovery_code_wrong" });
    let counts = await countsOf(name);
    expect(counts.byEmail.map((row) => row.failures)).toEqual([2]);
    expect(counts.byMarker.map((row) => row.failures)).toEqual([2]);

    const done = valueOf(await secondStep(name, { cookies: { ...cookies, ...atSecond }, method: "recovery", code: codes[0]! }, now));
    expect(await sessionLive(name, atPassword, now)).toBe(false);
    expect(await sessionLive(name, atSecond, now)).toBe(false);
    expect(await sessionLive(name, { [sessionCookieName(done.identifier)]: done.sessionToken }, now)).toBe(true);
    counts = await countsOf(name);
    expect(counts.byEmail).toEqual([]);
    expect(counts.byMarker).toEqual([]);
    // The password attempt's own address row is removed; the wrong recovery code's row stays.
    expect(counts.byAddress).toHaveLength(1);
    expect(await lastStep(name, id)).toBe(S0);
    expect(await pendingCount(name)).toBe(0);
  });
});

describe("secrets in logs (standing rule 14)", () => {
  const METHODS = ["log", "info", "warn", "error", "debug"] as const;
  let lines: string[] = [];
  let saved: ((...args: unknown[]) => void)[] = [];
  beforeEach(() => {
    lines = [];
    saved = METHODS.map((method) => console[method]);
    for (const method of METHODS) console[method] = (...args: unknown[]) => void lines.push(args.map((arg) => (typeof arg === "string" ? arg : JSON.stringify(arg))).join(" "));
  });
  afterEach(() => METHODS.forEach((method, index) => (console[method] = saved[index]!)));

  it("write no pending token, code, recovery code or key across a pending completion and second steps ending wrong, in a wait, expired, mismatched and signed in", async () => {
    const name = "no-logs";
    const { key, secret, codes } = await twoStepAccount(name);
    const otherKey = newDeploymentKey();
    const now = T0 + STEP;
    const right = await totpAt(secret, stepAt(now));
    const wrong = otherThan(right);
    const tokens: string[] = [];
    const pending = async (at: number) => {
      const made = await pendingAt(name, EMAIL, at, { address: "unknown" });
      tokens.push(made.pending.pendingToken);
      return made.cookies;
    };

    // Wrong, then a key mismatch, then signed in with a code.
    let cookies = await pending(now);
    expect(await secondStep(name, { cookies, method: "code", code: wrong, key, address: "unknown" }, now)).toMatchObject({ ok: false, code: "second_step_code_wrong" });
    expect(await secondStep(name, { cookies, method: "code", code: right, key: otherKey, address: "unknown" }, now)).toMatchObject({ ok: false, code: "deployment_key_mismatch" });
    expect((await secondStep(name, { cookies, method: "code", code: right, key, address: "unknown" }, now)).ok).toBe(true);
    // Expired: the spent token again.
    expect(await secondStep(name, { cookies, method: "recovery", code: codes[1]!, address: "unknown" }, now)).toMatchObject({ ok: false, code: "second_step_expired" });
    // Signed in with a recovery code.
    cookies = await pending(now + SECOND);
    expect((await secondStep(name, { cookies, method: "recovery", code: codes[0]!, address: "unknown" }, now + SECOND)).ok).toBe(true);
    // A wait: four wrong recovery codes after the password.
    cookies = await pending(now + 2 * SECOND);
    let last: Outcome<SignInCompleted> | null = null;
    for (let index = 0; index < 4; index += 1) last = await secondStep(name, { cookies, method: "recovery", code: codes[0]!, address: "unknown" }, now + 2 * SECOND);
    expect(last).toMatchObject({ ok: false, code: "signin_wait" });

    const forbidden = [key, otherKey, right, wrong, ...tokens, ...codes, ...codes.map((code) => normaliseRecoveryCode(code)!)];
    for (const line of lines) for (const value of forbidden) expect(line.includes(value)).toBe(false);
  });
});

describe("wrong codes and the shared limit (criterion 15, CA-15, D-4)", () => {
  it("raise the email and known address counts as wrong passwords; the fourth after the password starts the wait, deletes the pending row and answers signin_wait (finding 3)", async () => {
    const name = "wrong-codes";
    const { key, secret } = await twoStepAccount(name);
    const now = T0 + STEP;
    const { cookies } = await pendingAt(name, EMAIL, now);
    const wrong = otherThan(await totpAt(secret, stepAt(now)));
    for (let index = 0; index < 3; index += 1) {
      expect(await secondStep(name, { cookies, method: "code", code: wrong, key }, now)).toEqual({ ok: false, code: "second_step_code_wrong" });
      expect(await pendingCount(name)).toBe(1);
    }
    expect(await emailFailures(name)).toBe(4);
    expect((await countsOf(name)).byAddress).toHaveLength(4);
    expect(await secondStep(name, { cookies, method: "code", code: wrong, key }, now)).toEqual({ ok: false, code: "signin_wait", retryAfterSeconds: 60 });
    expect(await pendingCount(name)).toBe(0);
    expect(await emailFailures(name)).toBe(5);
    expect((await countsOf(name)).byAddress).toHaveLength(5);
    // The same wait as for a wrong password: the next password attempt meets it.
    expect(await passwordStep(name, EMAIL, now + SECOND)).toEqual({ ok: false, code: "signin_wait", retryAfterSeconds: 59 });
  });

  it("mixes wrong codes and wrong recovery codes in one count, and a correct code clears it as a sign-in does", async () => {
    const name = "wrong-then-right";
    const { key, secret } = await twoStepAccount(name);
    const now = T0 + STEP;
    const { cookies } = await pendingAt(name, EMAIL, now);
    const right = await totpAt(secret, stepAt(now));
    expect(await secondStep(name, { cookies, method: "code", code: otherThan(right), key }, now)).toEqual({ ok: false, code: "second_step_code_wrong" });
    expect(await secondStep(name, { cookies, method: "recovery", code: "0000-0000-0000-0000" }, now)).toEqual({ ok: false, code: "second_step_recovery_code_wrong" });
    expect(await emailFailures(name)).toBe(3);
    valueOf(await secondStep(name, { cookies, method: "code", code: right, key }, now));
    const counts = await countsOf(name);
    expect(counts.byEmail).toEqual([]);
    // The password attempt's own address row is removed; the wrong codes' rows stay, as other failures do.
    expect(counts.byAddress).toHaveLength(2);
  });

  it("meet a wait from other attempts: the pending row is deleted and the answer is signin_wait", async () => {
    const name = "wait-elsewhere";
    const { key, secret } = await twoStepAccount(name);
    const now = T0 + STEP;
    const { cookies } = await pendingAt(name, EMAIL, now);
    await failPasswords(name, EMAIL, 4, now, "203.0.113.9");
    expect(await secondStep(name, { cookies, method: "code", code: await totpAt(secret, stepAt(now)), key }, now + SECOND)).toEqual({
      ok: false,
      code: "signin_wait",
      retryAfterSeconds: 59,
    });
    expect(await pendingCount(name)).toBe(0);
    expect(await lastStep(name, (await rowsOf(name, TWO_STEP_TABLE))[0]!.account_id as string)).toBe(S0);
  });

  it("meet the request's known address at its threshold: the pending row is deleted (finding 4)", async () => {
    const name = "address-threshold";
    const { key, secret } = await twoStepAccount(name);
    const now = T0 + STEP;
    const { cookies } = await pendingAt(name, EMAIL, now, { address: "unknown" });
    for (let index = 0; index < 20; index += 1) await failPasswords(name, `person${index}@acme.test`, 1, now, "203.0.113.20");
    expect(await secondStep(name, { cookies, method: "code", code: await totpAt(secret, stepAt(now)), key, address: "203.0.113.20" }, now + SECOND)).toEqual({
      ok: false,
      code: "signin_wait",
      retryAfterSeconds: 59,
    });
    expect(await pendingCount(name)).toBe(0);
  });

  it("from the unknown address raise no address count and meet no address wait (story 1.3's D-11)", async () => {
    const name = "unknown-address";
    const { key, secret } = await twoStepAccount(name);
    const now = T0 + STEP;
    const { cookies } = await pendingAt(name, EMAIL, now, { address: "unknown" });
    for (let index = 0; index < 25; index += 1) await failPasswords(name, `person${index}@acme.test`, 1, now, "unknown");
    const right = await totpAt(secret, stepAt(now));
    expect(await secondStep(name, { cookies, method: "code", code: otherThan(right), key, address: "unknown" }, now)).toEqual({ ok: false, code: "second_step_code_wrong" });
    expect((await countsOf(name)).byAddress).toEqual([]);
    expect((await secondStep(name, { cookies, method: "code", code: right, key, address: "unknown" }, now)).ok).toBe(true);
  });
});

describe("the marker (D-4, finding 36)", () => {
  it("is counted with the email by wrong codes, skips the email's wait, and once in its own wait is treated as absent so the email's wait applies", async () => {
    const name = "marker";
    const { id, key, secret } = await twoStepAccount(name);
    const marker = await markerFor(name, id, T0);
    const now = T0 + STEP;
    // Someone else locks the email; the owner's browser holds the marker.
    await failPasswords(name, EMAIL, 5, now, "203.0.113.66");
    const { cookies } = await pendingAt(name, EMAIL, now, { address: "unknown", cookies: marker });
    expect((await countsOf(name)).byMarker.map((row) => row.failures)).toEqual([1]);
    const wrong = otherThan(await totpAt(secret, stepAt(now)));
    for (let index = 0; index < 3; index += 1) {
      expect(await secondStep(name, { cookies, method: "code", code: wrong, key, address: "unknown" }, now)).toEqual({ ok: false, code: "second_step_code_wrong" });
    }
    let counts = await countsOf(name);
    expect(counts.byMarker.map((row) => row.failures)).toEqual([4]);
    expect(counts.byEmail.map((row) => row.failures)).toEqual([9]);
    // The fifth marker failure puts the marker in its own wait: the email's wait applies, for the
    // email's ten failures, which differs from the marker's own wait for five.
    const emailWait = secondsLeft(now + emailWaitMs(10), now);
    expect(emailWait).not.toBe(secondsLeft(now + markerWaitMs(5), now));
    expect(await secondStep(name, { cookies, method: "code", code: wrong, key, address: "unknown" }, now)).toEqual({
      ok: false,
      code: "signin_wait",
      retryAfterSeconds: emailWait,
    });
    expect(await pendingCount(name)).toBe(0);
    counts = await countsOf(name);
    expect(counts.byMarker.map((row) => row.failures)).toEqual([5]);
  });

  it("is cleared with the email count by a correct code", async () => {
    const name = "marker-cleared";
    const { id, key, secret } = await twoStepAccount(name);
    const marker = await markerFor(name, id, T0);
    const now = T0 + STEP;
    const { cookies } = await pendingAt(name, EMAIL, now, { address: "unknown", cookies: marker });
    const right = await totpAt(secret, stepAt(now));
    expect(await secondStep(name, { cookies, method: "code", code: otherThan(right), key, address: "unknown" }, now)).toEqual({ ok: false, code: "second_step_code_wrong" });
    expect((await countsOf(name)).byMarker.map((row) => row.failures)).toEqual([2]);
    const done = valueOf(await secondStep(name, { cookies, method: "code", code: right, key, address: "unknown" }, now));
    expect(await countsOf(name)).toEqual({ byEmail: [], byMarker: [], byAddress: [], tickets: 0 });
    // The marker keeps its identifier.
    expect(done.marker.split(".")[2]).toBe(Object.values(marker)[0]!.split(".")[2]);
  });
});

describe("the pending row's expiry (criterion 25, CA-46)", () => {
  it("is live at 5 minutes less 1 ms and second_step_expired at 5 minutes, when the row is pruned", async () => {
    const live = "expiry-live";
    const a = await twoStepAccount(live);
    const t = T0 + STEP;
    const first = await pendingAt(live, EMAIL, t);
    const justBefore = t + PENDING_SIGNIN_TTL_MS - 1;
    expect((await secondStep(live, { cookies: first.cookies, method: "code", code: await totpAt(a.secret, stepAt(justBefore)), key: a.key }, justBefore)).ok).toBe(true);

    const late = "expiry-late";
    const b = await twoStepAccount(late);
    const second = await pendingAt(late, EMAIL, t);
    const at = t + PENDING_SIGNIN_TTL_MS;
    const before = await countsOf(late);
    expect(await secondStep(late, { cookies: second.cookies, method: "code", code: await totpAt(b.secret, stepAt(at)), key: b.key }, at)).toEqual({ ok: false, code: "second_step_expired" });
    expect(await pendingCount(late)).toBe(0);
    expect(await countsOf(late)).toEqual(before);
  });

  it("is pruned by a later attempt once expired", async () => {
    const name = "expiry-pruned";
    await twoStepAccount(name);
    await pendingAt(name, EMAIL, T0 + STEP);
    expect(await pendingCount(name)).toBe(1);
    await inObject(name, (i) => i.signIn.attempt({ email: "someone@acme.test", address: "unknown", cookies: {} }, T0 + STEP + PENDING_SIGNIN_TTL_MS));
    expect(await pendingCount(name)).toBe(0);
  });
});

describe("cookies that are not a live pending sign-in (criterion 18)", () => {
  it("are refused second_step_expired, counting nothing: none, another installation's name, a session token, a malformed value", async () => {
    const name = "no-cookie";
    const { id, key, secret } = await twoStepAccount(name);
    const { pending } = await pendingAt(name, EMAIL, T0 + STEP);
    const session = await sessionFor(name, id, T0);
    const code = await totpAt(secret, stepAt(T0 + STEP));
    const before = await countsOf(name);
    const cases: Record<string, string>[] = [
      {},
      { [pendingCookieName("f".repeat(32))]: pending.pendingToken },
      { [pendingCookieName(pending.identifier)]: Object.values(session)[0]! },
      { [pendingCookieName(pending.identifier)]: "not a token" },
      // The pending token under the session cookie's name.
      { [sessionCookieName(pending.identifier)]: pending.pendingToken },
    ];
    for (const cookies of cases) {
      expect(await secondStep(name, { cookies, method: "code", code, key }, T0 + STEP), JSON.stringify(Object.keys(cookies))).toEqual({ ok: false, code: "second_step_expired" });
    }
    expect(await countsOf(name)).toEqual(before);
    expect(await pendingCount(name)).toBe(1);
  });

  it("presented as the session cookie, the pending token signs nothing in and is flagged for clearing", async () => {
    const name = "pending-as-session";
    await twoStepAccount(name);
    const { pending } = await pendingAt(name, EMAIL, T0 + STEP);
    const info = await runInDurableObject(stubFor(name), (instance: Installation) =>
      instance.signIn.sessionInfo({ [sessionCookieName(pending.identifier)]: pending.pendingToken }, T0 + STEP),
    );
    expect(info).toMatchObject({ signedIn: false, clearSession: true });
  });
});

describe("a new sign-in attempt (D-3, finding 23)", () => {
  it("deletes the pending row of the pending cookie it presents, also when it is refused with a wait", async () => {
    const name = "new-attempt";
    const { key, secret } = await twoStepAccount(name);
    const now = T0 + STEP;
    const first = await pendingAt(name, EMAIL, now, { address: "unknown" });
    await inObject(name, (i) => i.signIn.attempt({ email: EMAIL, address: "unknown", cookies: first.cookies }, now));
    expect(await pendingCount(name)).toBe(0);
    expect(await secondStep(name, { cookies: first.cookies, method: "code", code: await totpAt(secret, stepAt(now)), key }, now)).toEqual({ ok: false, code: "second_step_expired" });

    const second = await pendingAt(name, EMAIL, now, { address: "unknown" });
    await failPasswords(name, EMAIL, 5, now, "203.0.113.5");
    expect(await inObject(name, (i) => i.signIn.attempt({ email: EMAIL, address: "unknown", cookies: second.cookies }, now + SECOND))).toMatchObject({
      ok: false,
      code: "signin_wait",
    });
    expect(await pendingCount(name)).toBe(0);
  });
});

describe("a newer pending sign-in in the browser (finding 33)", () => {
  it("is the one checked: another account's code is refused second_step_code_wrong against it", async () => {
    const name = "newer-pending";
    const x = await twoStepAccount(name, "xena@acme.test");
    await twoStepAccount(name, "yann@acme.test", T0, x.key);
    const now = T0 + STEP;
    await pendingAt(name, "xena@acme.test", now);
    // Tab B's password step replaces the browser's pending cookie with Y's.
    const tabB = await pendingAt(name, "yann@acme.test", now);
    expect(await secondStep(name, { cookies: tabB.cookies, method: "code", code: await totpAt(x.secret, stepAt(now)), key: x.key }, now)).toEqual({
      ok: false,
      code: "second_step_code_wrong",
    });
  });
});

describe("rows changed between the steps (finding 18, E-22)", () => {
  it("refuse second_step_expired when the account was made inactive or its hash replaced", async () => {
    for (const [label, change] of [
      ["inactive", `UPDATE ${USERS_TABLE} SET active = 0`],
      ["hash", `UPDATE ${USERS_TABLE} SET password_hash = '${randomBase64(32)}'`],
    ] as const) {
      const name = `account-changed-${label}`;
      const { key, secret } = await twoStepAccount(name);
      const now = T0 + STEP;
      const { cookies } = await pendingAt(name, EMAIL, now);
      await runInDurableObject(stubFor(name), (_instance, s) => void s.storage.sql.exec(change));
      expect(await secondStep(name, { cookies, method: "code", code: await totpAt(secret, stepAt(now)), key }, now)).toEqual({ ok: false, code: "second_step_expired" });
      expect(await pendingCount(name)).toBe(0);
      expect(await rowsOf(name, SESSIONS_TABLE)).toHaveLength(1); // the turn-on's only
    }
  });

  it("refuse second_step_expired, counting nothing, when two-step was turned off between the password step and a recovery code (orchestrator ruling)", async () => {
    const name = "turned-off-recovery";
    const { key, codes, cookies: accountCookies } = await twoStepAccount(name);
    const now = T0 + STEP;
    const { cookies } = await pendingAt(name, EMAIL, now);
    const off = valueOf(await accountCheck(name, accountCookies, "turn_off", key, now));
    valueOf(await inObject(name, (i) => i.twoStep.turnOffTwoStep(turnOffTwoStepInput.parse({ cookies: accountCookies, ticket: off.ticket, outcome: "success" }), now)));
    const before = await countsOf(name);
    expect(await secondStep(name, { cookies, method: "recovery", code: codes[0]! }, now)).toEqual({ ok: false, code: "second_step_expired" });
    expect(await pendingCount(name)).toBe(0);
    expect(await countsOf(name)).toEqual(before);
    expect(await rowsOf(name, SESSIONS_TABLE)).toHaveLength(1); // the account's own session only
  });

  it("refuse second_step_expired when two-step was turned off and on again between decrypting and the deciding step", async () => {
    const name = "secret-changed";
    const { id, key, secret, cookies: accountCookies } = await twoStepAccount(name);
    const now = T0 + STEP;
    const { cookies } = await pendingAt(name, EMAIL, now);
    const code = await totpAt(secret, stepAt(now));
    const outcome = await runInDurableObject(stubFor(name), async (instance: Installation) => {
      const store = instance.twoStep;
      const original = store.decryptSecret.bind(store);
      store.decryptSecret = async (...args: Parameters<typeof original>) => {
        const plaintext = await original(...args);
        // Turned off and on again by the account's own session while this call awaited.
        store.decryptSecret = original;
        const off = await store.accountCheck(accountCheckInput.parse({ cookies: accountCookies, address: "unknown", purpose: "turn_off", deploymentKey: key }), now);
        await store.turnOffTwoStep(turnOffTwoStepInput.parse({ cookies: accountCookies, ticket: off.ticket, outcome: "success" }), now);
        const on = await store.accountCheck(accountCheckInput.parse({ cookies: accountCookies, address: "unknown", purpose: "turn_on", deploymentKey: key }), now);
        const started = await store.startTwoStep(startTwoStepInput.parse({ cookies: accountCookies, ticket: on.ticket, outcome: "success", deploymentKey: key }), now);
        const fresh = base32Decode(started.secret)!;
        await store.confirmTwoStep(confirmTwoStepInput.parse({ cookies: accountCookies, setupId: started.setupId, code: await totpAt(fresh, S0), deploymentKey: key }), now);
        return plaintext;
      };
      try {
        return await refusedOr(() => instance.signIn.secondStep(secondStepOperationInput.parse({ cookies, address: ADDRESS, method: "code", code, deploymentKey: key }), now));
      } finally {
        store.decryptSecret = original;
      }
    });
    expect(outcome).toEqual({ ok: false, code: "second_step_expired" });
    expect(await pendingCount(name)).toBe(0);
    expect(await lastStep(name, id)).toBe(S0);
  });
});
