import { env } from "cloudflare:workers";
import { evictDurableObject, runInDurableObject } from "cloudflare:test";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { decryptValue, deriveEncryptionKey, parseDeploymentKey } from "../server/auth/deploymentKey";
import { makeMarker, markerCookieName, newMarkerId } from "../server/auth/marker";
import { toBase64 } from "../server/auth/password";
import { fromBase64Url, newSessionToken, sessionCookieName, sessionTokenHash, sha256Hex, toHex } from "../server/auth/session";
import { setupCodeFingerprint } from "../server/auth/setupCode";
import { matchingStep, stepAt, totpAt } from "../server/auth/totp";
import type { Installation } from "../server/installation/Installation";
import { SETTINGS_TABLE, USERS_TABLE } from "../server/installation/setupStore";
import { SESSIONS_TABLE, type SignInAttemptCounted, type SignInCompleted } from "../server/installation/signInStore";
import { invitationSecretHash, type InvitationCreated } from "../server/installation/invitationStore";
import {
  ACCOUNT_CHECK_TICKETS_TABLE,
  ACCOUNT_CHECK_TTL_MS,
  accountCheckInput,
  confirmTwoStepInput,
  RECOVERY_CODES_TABLE,
  renewRecoveryCodesInput,
  startTwoStepInput,
  turnOffTwoStepInput,
  TWO_STEP_PRUNE_BATCH,
  TWO_STEP_SETUPS_TABLE,
  TWO_STEP_TABLE,
  TWO_STEP_TABLES,
  twoStepStateInput,
  type AccountCheckCounted,
  type AccountCheckPurpose,
  type RecoveryCodesMade,
  type TwoStepStarted,
  type TwoStepState,
} from "../server/installation/twoStepStore";
import { callObject } from "../server/objects/call";
import { SESSION_MAX_AGE_MS } from "../shared/signin";
import { base32Decode, base32Encode, normaliseRecoveryCode, otpauthUri, TWO_STEP_SETUP_TTL_MS } from "../shared/twoStep";
import { tableExists } from "./helpers";
import { newDeploymentKey, TWO_STEP_OPERATIONS, twoStepFixtures } from "./two-step-fixtures";

// The installation object's two-step storage and account actions (story 1.5, spec 2): the I/O
// matrix's rows for the state read, the counted account check and its ticket, starting, confirming,
// turning off and fresh recovery codes, the key guard's refusals, the stored forms, the rows changed
// between decrypting and the deciding step, sessions kept, bounded pruning, the restart, and which
// operations change the two-step tables (CAP-1, CAP-2, CAP-6, CAP-7, CAP-10, CAP-12 storage). Every
// key, secret and code is made at run time; only RFC 6238's published secret is written here.

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const STEP = 30 * SECOND;
// A step boundary, so `T0 + n * STEP` is the start of a step.
const T0 = Date.UTC(2026, 10, 22, 12, 0, 0);
const ADDRESS = "198.51.100.7";
const EMAIL = "dana@acme.test";

function idFor(name: string) {
  return env.INSTALLATION.idFromName(`two-step-store:${name}`);
}

function stubFor(name: string) {
  return env.INSTALLATION.get(idFor(name));
}

function randomBase64(bytes: number) {
  return toBase64(crypto.getRandomValues(new Uint8Array(bytes)));
}

async function seedUser(name: string, email: string): Promise<{ id: string; salt: string; hash: string }> {
  const id = crypto.randomUUID();
  const salt = randomBase64(16);
  const hash = randomBase64(32);
  await runInDurableObject(stubFor(name), (_instance, state) => {
    state.storage.sql.exec(
      `INSERT INTO ${USERS_TABLE} (id, email, name, role, active, password_algorithm, password_n, password_r, password_p,
         password_key_length, password_salt, password_hash, created_at)
       VALUES (?, ?, 'Dana Admin', 'administrator', 1, 'scrypt', 131072, 8, 1, 32, ?, ?, ?)`,
      id,
      email,
      salt,
      hash,
      new Date(T0).toISOString(),
    );
    state.storage.sql.exec(
      `INSERT OR IGNORE INTO ${SETTINGS_TABLE} (id, installation_name, public_address, set_up_at) VALUES (1, 'Acme Security', 'https://survey.acme.test', ?)`,
      new Date(T0).toISOString(),
    );
  });
  return { id, salt, hash };
}

function identifierOf(name: string) {
  return runInDurableObject(stubFor(name), (instance: Installation) => instance.signIn.identifier());
}

/** Stores a session for the account straight in the sessions table and answers the browser's cookies. */
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

/** An account with a live session, signed in at T0. */
async function withAccount(name: string, email = EMAIL) {
  const user = await seedUser(name, email);
  return { ...user, cookies: await sessionFor(name, user.id) };
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

const state = (name: string, cookies: Record<string, string>, deploymentKey: string | null | undefined, now: number) =>
  inObject<TwoStepState>(name, (i) => i.twoStep.twoStepState(twoStepStateInput.parse({ cookies, deploymentKey }), now));

const check = (
  name: string,
  cookies: Record<string, string>,
  purpose: AccountCheckPurpose,
  deploymentKey: string | null | undefined,
  now: number,
  address = ADDRESS,
) => inObject<AccountCheckCounted>(name, (i) => i.twoStep.accountCheck(accountCheckInput.parse({ cookies, address, purpose, deploymentKey }), now));

const start = (name: string, cookies: Record<string, string>, ticket: string, outcome: "success" | "failure", deploymentKey: string | undefined, now: number) =>
  inObject<TwoStepStarted>(name, (i) => i.twoStep.startTwoStep(startTwoStepInput.parse({ cookies, ticket, outcome, deploymentKey }), now));

const confirm = (name: string, cookies: Record<string, string>, setupId: string, code: string, deploymentKey: string | undefined, now: number) =>
  inObject<RecoveryCodesMade>(name, (i) => i.twoStep.confirmTwoStep(confirmTwoStepInput.parse({ cookies, setupId, code, deploymentKey }), now));

const turnOff = (name: string, cookies: Record<string, string>, ticket: string, outcome: "success" | "failure", now: number) =>
  inObject(name, (i) => i.twoStep.turnOffTwoStep(turnOffTwoStepInput.parse({ cookies, ticket, outcome }), now));

const renew = (
  name: string,
  cookies: Record<string, string>,
  ticket: string,
  outcome: "success" | "failure",
  code: string,
  deploymentKey: string | undefined,
  now: number,
) => inObject<RecoveryCodesMade>(name, (i) => i.twoStep.renewRecoveryCodes(renewRecoveryCodesInput.parse({ cookies, ticket, outcome, code, deploymentKey }), now));

function valueOf<T>(outcome: Outcome<T>): T {
  if (!outcome.ok) throw new Error(`refused: ${outcome.code}`);
  return outcome.value;
}

async function ticketFor(name: string, cookies: Record<string, string>, purpose: AccountCheckPurpose, key: string | undefined, now: number, address = ADDRESS) {
  return valueOf(await check(name, cookies, purpose, key, now, address)).ticket;
}

/** Checks the password and starts a set-up at `now`. */
async function startedAt(name: string, cookies: Record<string, string>, key: string, now: number) {
  const value = valueOf(await start(name, cookies, await ticketFor(name, cookies, "turn_on", key, now), "success", key, now));
  return { ...value, secretBytes: base32Decode(value.secret)! };
}

/** Turns two-step verification on at `now` with the current code; answers the secret and the codes. */
async function turnedOnAt(name: string, cookies: Record<string, string>, key: string, now: number) {
  const started = await startedAt(name, cookies, key, now);
  const codes = valueOf(await confirm(name, cookies, started.setupId, await totpAt(started.secretBytes, stepAt(now)), key, now)).recoveryCodes;
  return { started, secret: started.secretBytes, codes };
}

const rowsOf = (name: string, table: string) =>
  runInDurableObject(stubFor(name), (_instance, s) => s.storage.sql.exec(`SELECT * FROM ${table} ORDER BY rowid`).toArray());

/** The two-step rows other than the tickets, as text, for "nothing written". */
const twoStepRows = async (name: string) =>
  JSON.stringify(await Promise.all([TWO_STEP_TABLE, TWO_STEP_SETUPS_TABLE, RECOVERY_CODES_TABLE].map((table) => rowsOf(name, table))));

const countsOf = (name: string) => runInDurableObject(stubFor(name), (instance: Installation) => instance.signIn.counts());

const emailFailures = async (name: string) => (await countsOf(name)).byEmail.reduce((sum, row) => sum + row.failures, 0);

/** A valid marker cookie made for `accountId`, as a sign-in would set it. */
function markerFor(name: string, accountId: string, now: number): Promise<Record<string, string>> {
  return runInDurableObject(stubFor(name), async (instance: Installation) => {
    const session = await instance.signIn.prepareSession();
    return { [markerCookieName(session.identifier)]: await makeMarker(session.markerKey, accountId, newMarkerId(), now) };
  });
}

async function sessionLive(name: string, cookies: Record<string, string>, now: number): Promise<boolean> {
  return runInDurableObject(stubFor(name), async (instance: Installation) => (await instance.signIn.sessionInfo(cookies, now)).signedIn);
}

describe("the two-step state read (D-12)", () => {
  it("answers off, no codes, available and the account's own email for a live session", async () => {
    const name = "state-off";
    const { cookies } = await withAccount(name);
    expect(await state(name, cookies, newDeploymentKey(), T0)).toEqual({
      ok: true,
      value: { enabled: false, recoveryCodesRemaining: 0, availability: "available", email: EMAIL },
    });
  });

  it("refuses not_signed_in, reading nothing, without a cookie or with a dead one, in every operation", async () => {
    const name = "no-session";
    await withAccount(name);
    const key = newDeploymentKey();
    const dead = { [sessionCookieName(await identifierOf(name))]: newSessionToken() };
    const before = await twoStepRows(name);
    for (const cookies of [{}, dead]) {
      expect(await state(name, cookies, key, T0)).toEqual({ ok: false, code: "not_signed_in" });
      expect(await check(name, cookies, "turn_on", key, T0)).toEqual({ ok: false, code: "not_signed_in" });
      expect(await start(name, cookies, "a".repeat(64), "success", key, T0)).toEqual({ ok: false, code: "not_signed_in" });
      expect(await confirm(name, cookies, "a".repeat(32), "123456", key, T0)).toEqual({ ok: false, code: "not_signed_in" });
      expect(await turnOff(name, cookies, "a".repeat(64), "success", T0)).toEqual({ ok: false, code: "not_signed_in" });
      expect(await renew(name, cookies, "a".repeat(64), "success", "123456", key, T0)).toEqual({ ok: false, code: "not_signed_in" });
    }
    expect(await countsOf(name)).toEqual({ byEmail: [], byMarker: [], byAddress: [], tickets: 0 });
    expect(await rowsOf(name, ACCOUNT_CHECK_TICKETS_TABLE)).toEqual([]);
    expect(await twoStepRows(name)).toBe(before);
    expect(before).toBe(JSON.stringify([[], [], []]));
  });

  it("counts a key that does not parse as no key, never as invalid input (D-22)", async () => {
    const name = "state-malformed-key";
    const { cookies } = await withAccount(name);
    for (const key of [undefined, null, "", "not-a-deployment-key", "x".repeat(5000)]) {
      expect(await state(name, cookies, key, T0)).toEqual({
        ok: true,
        value: { enabled: false, recoveryCodesRemaining: 0, availability: "no_key", email: EMAIL },
      });
    }
    expect(await check(name, cookies, "turn_on", "not-a-deployment-key", T0)).toEqual({ ok: false, code: "deployment_key_missing" });
  });
});

describe("keys of any length or null (D-22)", () => {
  it("never make startTwoStep, confirmTwoStep or renewRecoveryCodes answer invalid_input", async () => {
    const name = "malformed-key-operations";
    const user = await seedUser(name, EMAIL);
    // Through the object's own entry, which parses the input, on the live clock.
    const cookies = await sessionFor(name, user.id, Date.now());
    const call = (operation: string, input: unknown) => callObject(env.INSTALLATION, idFor(name), operation, input);
    for (const deploymentKey of [null, "", "x".repeat(5000)]) {
      const inputs: [string, unknown][] = [
        ["startTwoStep", { cookies, ticket: "a".repeat(64), outcome: "success", deploymentKey }],
        ["confirmTwoStep", { cookies, setupId: "a".repeat(32), code: "123456", deploymentKey }],
        ["renewRecoveryCodes", { cookies, ticket: "a".repeat(64), outcome: "success", code: "123456", deploymentKey }],
      ];
      for (const [operation, input] of inputs) {
        const result = await call(operation, input);
        expect(result.ok, operation).toBe(false);
        if (!result.ok) expect(result.body.error.code, `${operation} with a key of length ${deploymentKey?.length ?? "null"}`).not.toBe("invalid_input");
      }
    }
  });
});

describe("the account check (D-5)", () => {
  it("counts a turn-on check once for the email, the marker and the address, and answers the stored hash and a ticket", async () => {
    const name = "check-turn-on";
    const { id, cookies, salt, hash } = await withAccount(name);
    const markerCookie = await markerFor(name, id, T0);
    const checked = valueOf(await check(name, { ...cookies, ...markerCookie }, "turn_on", newDeploymentKey(), T0));
    expect(checked.ticket).toMatch(/^[0-9a-f]{64}$/);
    expect(checked.passwordHash).toEqual({ algorithm: "scrypt", n: 131_072, r: 8, p: 1, keyLength: 32, salt, hash });
    const counts = await countsOf(name);
    expect(counts.byEmail.map((row) => row.failures)).toEqual([1]);
    expect(counts.byMarker.map((row) => row.failures)).toEqual([1]);
    expect(counts.byAddress).toEqual([expect.objectContaining({ address: ADDRESS, at: T0 })]);
    const tickets = await rowsOf(name, ACCOUNT_CHECK_TICKETS_TABLE);
    expect(tickets).toEqual([
      expect.objectContaining({ ticket: checked.ticket, account_id: id, purpose: "turn_on", address_failure_id: expect.any(Number), expires_at: T0 + ACCOUNT_CHECK_TTL_MS }),
    ]);
  });

  it("ignores a valid marker made for another account", async () => {
    const name = "check-foreign-marker";
    const { cookies } = await withAccount(name);
    const other = await seedUser(name, "sam@acme.test");
    const foreign = await markerFor(name, other.id, T0);
    valueOf(await check(name, { ...cookies, ...foreign }, "turn_on", newDeploymentKey(), T0));
    const counts = await countsOf(name);
    expect(counts.byMarker).toEqual([]);
    expect(counts.byEmail.map((row) => row.failures)).toEqual([1]);
    expect((await rowsOf(name, ACCOUNT_CHECK_TICKETS_TABLE))[0]!.marker_id).toBeNull();
  });

  it("clears the marker count with the email and address counts when turning on and making fresh codes succeed", async () => {
    const name = "check-marker-cleared";
    const { id, cookies } = await withAccount(name);
    const withMarker = { ...cookies, ...(await markerFor(name, id, T0)) };
    const key = newDeploymentKey();

    const ticket = await ticketFor(name, withMarker, "turn_on", key, T0);
    expect((await countsOf(name)).byMarker.map((row) => row.failures)).toEqual([1]);
    const started = valueOf(await start(name, withMarker, ticket, "success", key, T0));
    expect(await countsOf(name)).toEqual({ byEmail: [], byMarker: [], byAddress: [], tickets: 0 });
    const secret = base32Decode(started.secret)!;
    valueOf(await confirm(name, withMarker, started.setupId, await totpAt(secret, stepAt(T0)), key, T0));

    const now = T0 + STEP;
    const fresh = await ticketFor(name, withMarker, "fresh_codes", key, now);
    expect((await countsOf(name)).byMarker.map((row) => row.failures)).toEqual([1]);
    valueOf(await renew(name, withMarker, fresh, "success", await totpAt(secret, stepAt(now)), key, now));
    expect(await countsOf(name)).toEqual({ byEmail: [], byMarker: [], byAddress: [], tickets: 0 });
  });

  it("refuses before counting: already on, off, and no usable key for turn on and fresh codes (finding 14)", async () => {
    const name = "check-refusals";
    const { cookies } = await withAccount(name);
    const key = newDeploymentKey();
    expect(await check(name, cookies, "turn_off", key, T0)).toEqual({ ok: false, code: "two_step_off" });
    expect(await check(name, cookies, "fresh_codes", key, T0)).toEqual({ ok: false, code: "two_step_off" });
    expect(await check(name, cookies, "turn_on", undefined, T0)).toEqual({ ok: false, code: "deployment_key_missing" });
    expect(await emailFailures(name)).toBe(0);

    await turnedOnAt(name, cookies, key, T0);
    const before = await countsOf(name);
    expect(await check(name, cookies, "turn_on", key, T0 + SECOND)).toEqual({ ok: false, code: "two_step_already_on" });
    expect(await check(name, cookies, "fresh_codes", newDeploymentKey(), T0 + SECOND)).toEqual({ ok: false, code: "deployment_key_mismatch" });
    expect(await check(name, cookies, "fresh_codes", undefined, T0 + SECOND)).toEqual({ ok: false, code: "deployment_key_mismatch" });
    expect(await countsOf(name)).toEqual(before);
  });

  it("refuses signin_wait with its seconds, counting nothing, while the email waits", async () => {
    const name = "check-wait";
    const { cookies } = await withAccount(name);
    const key = newDeploymentKey();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const ticket = await ticketFor(name, cookies, "turn_on", key, T0, "unknown");
      expect(await start(name, cookies, ticket, "failure", key, T0)).toEqual({ ok: false, code: "two_step_password_wrong" });
    }
    const before = await countsOf(name);
    expect(await check(name, cookies, "turn_on", key, T0 + SECOND, "unknown")).toEqual({ ok: false, code: "signin_wait", retryAfterSeconds: 59 });
    expect(await countsOf(name)).toEqual(before);
  });
});

describe("a wrong password for an account action (D-5)", () => {
  it("changes nothing and raises the email count by one, for turn on, turn off and fresh codes; five in a row put the email in a wait", async () => {
    const name = "wrong-password";
    const { cookies } = await withAccount(name);
    const key = newDeploymentKey();
    let now = T0;

    // Turn on, while off.
    let before = await twoStepRows(name);
    let ticket = await ticketFor(name, cookies, "turn_on", key, now, "unknown");
    expect(await start(name, cookies, ticket, "failure", key, now)).toEqual({ ok: false, code: "two_step_password_wrong" });
    expect(await twoStepRows(name)).toBe(before);
    expect(await emailFailures(name)).toBe(1);

    // Turning on succeeds and clears the count; then turn off and fresh codes, while on.
    const { secret } = await turnedOnAt(name, cookies, key, now);
    expect(await emailFailures(name)).toBe(0);
    now += 2 * STEP;
    before = await twoStepRows(name);
    ticket = await ticketFor(name, cookies, "turn_off", key, now, "unknown");
    expect(await turnOff(name, cookies, ticket, "failure", now)).toEqual({ ok: false, code: "two_step_password_wrong" });
    expect(await twoStepRows(name)).toBe(before);
    expect(await emailFailures(name)).toBe(1);

    ticket = await ticketFor(name, cookies, "fresh_codes", key, now, "unknown");
    expect(await renew(name, cookies, ticket, "failure", await totpAt(secret, stepAt(now)), key, now)).toEqual({
      ok: false,
      code: "two_step_password_wrong",
    });
    expect(await twoStepRows(name)).toBe(before);
    expect(await emailFailures(name)).toBe(2);

    // Three more make five in a row; the next check meets the wait.
    for (const purpose of ["turn_off", "fresh_codes", "turn_off"] as const) {
      ticket = await ticketFor(name, cookies, purpose, key, now, "unknown");
      const refused = purpose === "turn_off" ? await turnOff(name, cookies, ticket, "failure", now) : await renew(name, cookies, ticket, "failure", "000000", key, now);
      expect(refused).toEqual({ ok: false, code: "two_step_password_wrong" });
    }
    expect(await emailFailures(name)).toBe(5);
    expect(await check(name, cookies, "turn_off", key, now, "unknown")).toEqual({ ok: false, code: "signin_wait", retryAfterSeconds: 60 });
    expect(await twoStepRows(name)).toBe(before);
  });
});

describe("the ticket (D-5)", () => {
  it("is refused two_step_password_wrong, writing nothing, for another purpose, another session, reuse, expiry and a changed hash", async () => {
    const name = "ticket-misuse";
    const { id, cookies } = await withAccount(name);
    const other = await sessionFor(name, id);
    const key = newDeploymentKey();
    const before = await twoStepRows(name);
    const wrong = { ok: false, code: "two_step_password_wrong" };

    // Another purpose: a turn-on ticket offered to turn off.
    let ticket = await ticketFor(name, cookies, "turn_on", key, T0);
    expect(await turnOff(name, cookies, ticket, "success", T0)).toEqual(wrong);
    // Another session of the same account.
    ticket = await ticketFor(name, cookies, "turn_on", key, T0);
    expect(await start(name, other, ticket, "success", key, T0)).toEqual(wrong);
    // Reused: the first completion consumes it whatever its outcome.
    ticket = await ticketFor(name, cookies, "turn_on", key, T0);
    expect(await start(name, cookies, ticket, "failure", key, T0)).toEqual(wrong);
    expect(await start(name, cookies, ticket, "success", key, T0)).toEqual(wrong);
    // Expired: 5 minutes after the check.
    ticket = await ticketFor(name, cookies, "turn_on", key, T0);
    expect(await start(name, cookies, ticket, "success", key, T0 + ACCOUNT_CHECK_TTL_MS)).toEqual(wrong);
    // The stored hash changed between the check and the completion.
    ticket = await ticketFor(name, cookies, "turn_on", key, T0);
    await runInDurableObject(stubFor(name), (_instance, s) => void s.storage.sql.exec(`UPDATE ${USERS_TABLE} SET password_hash = ? WHERE id = ?`, randomBase64(32), id));
    expect(await start(name, cookies, ticket, "success", key, T0)).toEqual(wrong);

    expect(await twoStepRows(name)).toBe(before);
    expect((await rowsOf(name, ACCOUNT_CHECK_TICKETS_TABLE)).length).toBe(0);
    // Five checks, each counted, none cleared.
    expect(await emailFailures(name)).toBe(5);
  });
});

describe("starting and confirming a set-up (D-10)", () => {
  it("starts with a set-up row and answers the identifier, a 32-character base32 secret, the URI, the installation's name and the email; counts cleared", async () => {
    const name = "start";
    const { id, cookies } = await withAccount(name);
    const key = newDeploymentKey();
    const ticket = await ticketFor(name, cookies, "turn_on", key, T0);
    const started = valueOf(await start(name, cookies, ticket, "success", key, T0));
    expect(Object.keys(started).sort()).toEqual(["email", "installationName", "otpauthUri", "secret", "setupId"]);
    expect(started.setupId).toMatch(/^[0-9a-f]{32}$/);
    expect(started.secret).toMatch(/^[A-Z2-7]{32}$/);
    expect(base32Decode(started.secret)).toHaveLength(20);
    expect(started.installationName).toBe("Acme Security");
    expect(started.email).toBe(EMAIL);
    expect(started.otpauthUri).toBe(otpauthUri({ secret: started.secret, installationName: "Acme Security", email: EMAIL }));
    const setups = await rowsOf(name, TWO_STEP_SETUPS_TABLE);
    expect(setups).toEqual([{ account_id: id, setup_id: started.setupId, secret_ciphertext: expect.stringMatching(/^v1\./), expires_at: T0 + TWO_STEP_SETUP_TTL_MS }]);
    expect(JSON.stringify(setups)).not.toContain(started.secret);
    expect(await countsOf(name)).toEqual({ byEmail: [], byMarker: [], byAddress: [], tickets: 0 });
    expect(await rowsOf(name, TWO_STEP_TABLE)).toEqual([]);
  });

  it("replaces an earlier set-up when started again, and refuses the earlier identifier two_step_setup_expired (finding 5)", async () => {
    const name = "start-again";
    const { cookies } = await withAccount(name);
    const key = newDeploymentKey();
    const first = await startedAt(name, cookies, key, T0);
    const second = await startedAt(name, cookies, key, T0 + SECOND);
    expect(second.setupId).not.toBe(first.setupId);
    expect((await rowsOf(name, TWO_STEP_SETUPS_TABLE)).map((row) => row.setup_id)).toEqual([second.setupId]);
    const earlierCode = await totpAt(first.secretBytes, stepAt(T0 + 2 * SECOND));
    expect(await confirm(name, cookies, first.setupId, earlierCode, key, T0 + 2 * SECOND)).toEqual({ ok: false, code: "two_step_setup_expired" });
    // The earlier secret's code with the current identifier is a wrong code; nothing is turned on.
    expect(await confirm(name, cookies, second.setupId, earlierCode, key, T0 + 2 * SECOND)).toEqual({ ok: false, code: "two_step_code_wrong" });
    expect(await rowsOf(name, TWO_STEP_TABLE)).toEqual([]);
  });

  it("confirms with the current code: the two_step row with the matched step, 10 code hashes, 10 codes answered", async () => {
    const name = "confirm";
    const { id, cookies } = await withAccount(name);
    const key = newDeploymentKey();
    const started = await startedAt(name, cookies, key, T0);
    const now = T0 + 5 * SECOND;
    const made = valueOf(await confirm(name, cookies, started.setupId, await totpAt(started.secretBytes, stepAt(now)), key, now));
    expect(made.recoveryCodes).toHaveLength(10);
    for (const code of made.recoveryCodes) expect(code).toMatch(/^[0-9a-hjkmnp-tv-z]{4}(-[0-9a-hjkmnp-tv-z]{4}){3}$/);
    expect(new Set(made.recoveryCodes).size).toBe(10);
    expect(await rowsOf(name, TWO_STEP_TABLE)).toEqual([{ account_id: id, secret_ciphertext: expect.stringMatching(/^v1\./), last_step: stepAt(now), turned_on_at: now }]);
    expect(await rowsOf(name, TWO_STEP_SETUPS_TABLE)).toEqual([]);
    expect((await rowsOf(name, RECOVERY_CODES_TABLE)).length).toBe(10);
    expect(await state(name, cookies, key, now)).toEqual({ ok: true, value: { enabled: true, recoveryCodesRemaining: 10, availability: "available", email: EMAIL } });
    // Confirming again, or starting while on, is refused.
    expect(await confirm(name, cookies, started.setupId, await totpAt(started.secretBytes, stepAt(now)), key, now)).toEqual({ ok: false, code: "two_step_already_on" });
  });

  it("refuses a wrong code two_step_code_wrong, keeping the set-up and counting nothing", async () => {
    const name = "confirm-wrong";
    const { cookies } = await withAccount(name);
    const key = newDeploymentKey();
    const started = await startedAt(name, cookies, key, T0);
    const setups = await rowsOf(name, TWO_STEP_SETUPS_TABLE);
    const right = await totpAt(started.secretBytes, stepAt(T0));
    const wrong = String((Number(right) + 1) % 1_000_000).padStart(6, "0");
    expect(await confirm(name, cookies, started.setupId, wrong, key, T0)).toEqual({ ok: false, code: "two_step_code_wrong" });
    // A code two steps away is outside the window.
    expect(await confirm(name, cookies, started.setupId, await totpAt(started.secretBytes, stepAt(T0) + 2), key, T0)).toEqual({ ok: false, code: "two_step_code_wrong" });
    expect(await rowsOf(name, TWO_STEP_SETUPS_TABLE)).toEqual(setups);
    expect(await countsOf(name)).toEqual({ byEmail: [], byMarker: [], byAddress: [], tickets: 0 });
    expect((await confirm(name, cookies, started.setupId, right, key, T0)).ok).toBe(true);
  });

  it("refuses a set-up at 10 minutes two_step_setup_expired, writing nothing", async () => {
    const name = "confirm-late";
    const { cookies } = await withAccount(name);
    const key = newDeploymentKey();
    const started = await startedAt(name, cookies, key, T0);
    const late = T0 + TWO_STEP_SETUP_TTL_MS;
    const before = await twoStepRows(name);
    expect(await confirm(name, cookies, started.setupId, await totpAt(started.secretBytes, stepAt(late)), key, late)).toEqual({ ok: false, code: "two_step_setup_expired" });
    expect(await twoStepRows(name)).toBe(before);
  });

  it("refuses two_step_setup_expired, writing nothing, when the set-up changed between decrypting and the deciding step (finding 18)", async () => {
    const name = "confirm-row-changed";
    const { id, cookies } = await withAccount(name);
    const key = newDeploymentKey();
    const started = await startedAt(name, cookies, key, T0);
    const code = await totpAt(started.secretBytes, stepAt(T0));
    const outcome = await runInDurableObject(stubFor(name), async (instance: Installation, s) => {
      const guard = instance.keyGuard;
      const original = guard.encrypt.bind(guard);
      // The confirm's re-encryption runs after its decryption and before its deciding step: the
      // set-up is replaced there, as starting again from another tab would.
      guard.encrypt = async (...args: Parameters<typeof original>) => {
        const pending = await original(...args);
        const replacement = await original(key, crypto.getRandomValues(new Uint8Array(20)), `two-step-setup:${id}`);
        s.storage.sql.exec(`UPDATE ${TWO_STEP_SETUPS_TABLE} SET secret_ciphertext = ? WHERE account_id = ?`, replacement.value, id);
        return pending;
      };
      try {
        return await refusedOr(() => instance.twoStep.confirmTwoStep(confirmTwoStepInput.parse({ cookies, setupId: started.setupId, code, deploymentKey: key }), T0));
      } finally {
        guard.encrypt = original;
      }
    });
    expect(outcome).toEqual({ ok: false, code: "two_step_setup_expired" });
    expect(await rowsOf(name, TWO_STEP_TABLE)).toEqual([]);
    expect(await rowsOf(name, RECOVERY_CODES_TABLE)).toEqual([]);
  });
});

describe("the stored forms (criteria 10, 11, 24)", () => {
  it("keeps exactly 10 recovery-code rows of 64-hex SHA-256, none equal to a code", async () => {
    const name = "stored-codes";
    const { id, cookies } = await withAccount(name);
    const { codes } = await turnedOnAt(name, cookies, newDeploymentKey(), T0);
    const rows = await rowsOf(name, RECOVERY_CODES_TABLE);
    expect(rows).toHaveLength(10);
    const normalised = codes.map((code) => normaliseRecoveryCode(code)!);
    for (const row of rows) {
      expect(row).toEqual({ code_hash: expect.stringMatching(/^[0-9a-f]{64}$/), account_id: id, made_at: T0 });
      for (const value of Object.values(row)) {
        expect(codes).not.toContain(value);
        expect(normalised).not.toContain(value);
      }
    }
    expect(rows.map((row) => row.code_hash).sort()).toEqual((await Promise.all(normalised.map((code) => sha256Hex(code)))).sort());
    const text = JSON.stringify(rows);
    for (const code of [...codes, ...normalised]) expect(text).not.toContain(code);
  });

  it("keeps the secret as v1 ciphertext that decrypts under K with associated data two-step:<account id>, holds none of its bytes and is refused under K′", async () => {
    const name = "stored-secret";
    const { id, cookies } = await withAccount(name);
    const key = newDeploymentKey();
    const { secret } = await turnedOnAt(name, cookies, key, T0);
    const [row] = await rowsOf(name, TWO_STEP_TABLE);
    const value = String(row!.secret_ciphertext);
    expect(value).toMatch(/^v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    const keyK = await deriveEncryptionKey(parseDeploymentKey(key)!);
    expect(await decryptValue(keyK, value, `two-step:${id}`)).toEqual(secret);
    expect(await decryptValue(keyK, value, `two-step-setup:${id}`)).toBeNull();
    expect(await decryptValue(keyK, value, `two-step:${crypto.randomUUID()}`)).toBeNull();
    expect(await decryptValue(await deriveEncryptionKey(parseDeploymentKey(newDeploymentKey())!), value, `two-step:${id}`)).toBeNull();
    const [, iv, ciphertext] = value.split(".");
    for (const part of [fromBase64Url(iv!), fromBase64Url(ciphertext!)]) {
      for (let at = 0; at + secret.length <= part.length; at += 1) expect(part.slice(at, at + secret.length)).not.toEqual(secret);
    }
    const text = JSON.stringify(await Promise.all(TWO_STEP_TABLES.map((table) => rowsOf(name, table))));
    for (const form of [base32Encode(secret), toHex(secret), toBase64(secret)]) expect(text).not.toContain(form);
  });
});

describe("turning off (D-10, D-15)", () => {
  it("deletes the secret, any set-up and every recovery code of the account, and clears the counts", async () => {
    const name = "turn-off";
    const { id, cookies } = await withAccount(name);
    const other = await withAccount(name, "sam@acme.test");
    const key = newDeploymentKey();
    await turnedOnAt(name, cookies, key, T0);
    await turnedOnAt(name, other.cookies, key, T0);
    // A set-up row of the account, as a start from another tab would leave; turning off removes it.
    const accountId = id;
    await runInDurableObject(stubFor(name), (_instance, s) =>
      void s.storage.sql.exec(
        `INSERT INTO ${TWO_STEP_SETUPS_TABLE} (account_id, setup_id, secret_ciphertext, expires_at) VALUES (?, ?, 'v1.x.y', ?)`,
        accountId,
        "b".repeat(32),
        T0 + TWO_STEP_SETUP_TTL_MS,
      ),
    );
    expect(await rowsOf(name, TWO_STEP_SETUPS_TABLE)).toHaveLength(1);
    const ticket = await ticketFor(name, cookies, "turn_off", undefined, T0 + MINUTE);
    expect(await turnOff(name, cookies, ticket, "success", T0 + MINUTE)).toEqual({ ok: true, value: { enabled: false } });
    expect((await rowsOf(name, TWO_STEP_TABLE)).map((row) => row.account_id)).toEqual([other.id]);
    expect(await rowsOf(name, TWO_STEP_SETUPS_TABLE)).toEqual([]);
    expect((await rowsOf(name, RECOVERY_CODES_TABLE)).every((row) => row.account_id === other.id)).toBe(true);
    expect((await rowsOf(name, RECOVERY_CODES_TABLE)).length).toBe(10);
    expect(await countsOf(name)).toEqual({ byEmail: [], byMarker: [], byAddress: [], tickets: 0 });
    expect(await state(name, cookies, key, T0 + MINUTE)).toEqual({ ok: true, value: { enabled: false, recoveryCodesRemaining: 0, availability: "available", email: EMAIL } });
    // Off now: a second turn-off check is refused.
    expect(await check(name, cookies, "turn_off", key, T0 + MINUTE)).toEqual({ ok: false, code: "two_step_off" });
  });
});

describe("fresh recovery codes (D-5, D-6)", () => {
  it("replaces the codes, raises the last step and clears the counts with the password and a later code", async () => {
    const name = "fresh";
    const { cookies } = await withAccount(name);
    const key = newDeploymentKey();
    const { secret } = await turnedOnAt(name, cookies, key, T0);
    const oldHashes = (await rowsOf(name, RECOVERY_CODES_TABLE)).map((row) => row.code_hash);
    const now = T0 + STEP;
    const ticket = await ticketFor(name, cookies, "fresh_codes", key, now);
    const made = valueOf(await renew(name, cookies, ticket, "success", await totpAt(secret, stepAt(now)), key, now));
    expect(made.recoveryCodes).toHaveLength(10);
    const newRows = await rowsOf(name, RECOVERY_CODES_TABLE);
    expect(newRows).toHaveLength(10);
    expect(newRows.some((row) => oldHashes.includes(row.code_hash))).toBe(false);
    expect((await rowsOf(name, TWO_STEP_TABLE))[0]!.last_step).toBe(stepAt(now));
    expect(await countsOf(name)).toEqual({ byEmail: [], byMarker: [], byAddress: [], tickets: 0 });
  });

  it("refuses a wrong code after the right password two_step_code_wrong, keeping the old set, with the email count one higher (finding 19)", async () => {
    const name = "fresh-wrong-code";
    const { cookies } = await withAccount(name);
    const key = newDeploymentKey();
    const { secret } = await turnedOnAt(name, cookies, key, T0);
    const before = await twoStepRows(name);
    const now = T0 + STEP;
    const ticket = await ticketFor(name, cookies, "fresh_codes", key, now);
    const right = await totpAt(secret, stepAt(now));
    const wrong = String((Number(right) + 1) % 1_000_000).padStart(6, "0");
    expect(await renew(name, cookies, ticket, "success", wrong, key, now)).toEqual({ ok: false, code: "two_step_code_wrong" });
    expect(await twoStepRows(name)).toBe(before);
    expect(await emailFailures(name)).toBe(1);
    expect((await countsOf(name)).byAddress).toHaveLength(1);
  });

  it("refuses the code of the step already accepted two_step_code_wrong, keeping the old set and the counts", async () => {
    const name = "fresh-reused-code";
    const { cookies } = await withAccount(name);
    const key = newDeploymentKey();
    const { secret } = await turnedOnAt(name, cookies, key, T0);
    const before = await twoStepRows(name);
    // Still within the window of the accepted step, which is the last accepted one.
    const now = T0 + 10 * SECOND;
    const ticket = await ticketFor(name, cookies, "fresh_codes", key, now);
    expect(await renew(name, cookies, ticket, "success", await totpAt(secret, stepAt(T0)), key, now)).toEqual({ ok: false, code: "two_step_code_wrong" });
    // And the step before it, still in the window one step later.
    const later = T0 + STEP;
    const second = await ticketFor(name, cookies, "fresh_codes", key, later);
    expect(await renew(name, cookies, second, "success", await totpAt(secret, stepAt(T0)), key, later)).toEqual({ ok: false, code: "two_step_code_wrong" });
    expect(await twoStepRows(name)).toBe(before);
    expect(await emailFailures(name)).toBe(2);
  });

  it("refuses two_step_code_wrong, writing nothing, when two-step was turned off and on again between decrypting and the deciding step (finding 18)", async () => {
    const name = "fresh-row-changed";
    const { id, cookies } = await withAccount(name);
    const key = newDeploymentKey();
    const { secret } = await turnedOnAt(name, cookies, key, T0);
    const now = T0 + STEP;
    const ticket = await ticketFor(name, cookies, "fresh_codes", key, now);
    const code = await totpAt(secret, stepAt(now));
    const codesBefore = JSON.stringify(await rowsOf(name, RECOVERY_CODES_TABLE));
    const outcome = await runInDurableObject(stubFor(name), async (instance: Installation, s) => {
      const guard = instance.keyGuard;
      const original = guard.decrypt.bind(guard);
      const encrypt = guard.encrypt.bind(guard);
      guard.decrypt = async (...args: Parameters<typeof original>) => {
        const plaintext = await original(...args);
        // Off and on again with a new secret, while this call awaited.
        const replacement = await encrypt(key, crypto.getRandomValues(new Uint8Array(20)), `two-step:${id}`);
        s.storage.sql.exec(`DELETE FROM ${TWO_STEP_TABLE} WHERE account_id = ?`, id);
        s.storage.sql.exec(`INSERT INTO ${TWO_STEP_TABLE} (account_id, secret_ciphertext, last_step, turned_on_at) VALUES (?, ?, ?, ?)`, id, replacement.value, stepAt(T0), T0);
        return plaintext;
      };
      try {
        return await refusedOr(() =>
          instance.twoStep.renewRecoveryCodes(renewRecoveryCodesInput.parse({ cookies, ticket, outcome: "success", code, deploymentKey: key }), now),
        );
      } finally {
        guard.decrypt = original;
      }
    });
    expect(outcome).toEqual({ ok: false, code: "two_step_code_wrong" });
    expect(JSON.stringify(await rowsOf(name, RECOVERY_CODES_TABLE))).toBe(codesBefore);
    expect((await rowsOf(name, TWO_STEP_TABLE))[0]!.last_step).toBe(stepAt(T0));
    expect(await emailFailures(name)).toBe(1);
  });
});

describe("sessions (D-10, finding 39)", () => {
  it("keeps another session of the account live after turning on, fresh codes and turning off", async () => {
    const name = "sessions-kept";
    const { id, cookies } = await withAccount(name);
    const other = await sessionFor(name, id);
    const key = newDeploymentKey();
    const { secret } = await turnedOnAt(name, cookies, key, T0);
    expect(await sessionLive(name, other, T0)).toBe(true);
    const now = T0 + STEP;
    valueOf(await renew(name, cookies, await ticketFor(name, cookies, "fresh_codes", key, now), "success", await totpAt(secret, stepAt(now)), key, now));
    expect(await sessionLive(name, other, now)).toBe(true);
    valueOf(await turnOff(name, cookies, await ticketFor(name, cookies, "turn_off", key, now), "success", now));
    expect(await sessionLive(name, other, now)).toBe(true);
    expect(await sessionLive(name, cookies, now)).toBe(true);
  });
});

describe("a key mismatch (D-15, criterion 23)", () => {
  it("reports key_mismatch, refuses start and fresh codes before counting and confirm, and still turns off", async () => {
    const name = "key-mismatch";
    const first = await withAccount(name);
    const second = await withAccount(name, "sam@acme.test");
    const key = newDeploymentKey();
    const otherKey = newDeploymentKey();
    await turnedOnAt(name, first.cookies, key, T0);
    // The second account starts a set-up under K, then is given K′.
    const started = await startedAt(name, second.cookies, key, T0);
    const now = T0 + SECOND;

    expect(await state(name, first.cookies, otherKey, now)).toEqual({ ok: true, value: { enabled: true, recoveryCodesRemaining: 10, availability: "key_mismatch", email: EMAIL } });
    expect(await state(name, first.cookies, undefined, now)).toMatchObject({ ok: true, value: { availability: "key_mismatch" } });
    const counts = await countsOf(name);
    expect(await check(name, second.cookies, "turn_on", otherKey, now)).toEqual({ ok: false, code: "deployment_key_mismatch" });
    expect(await check(name, first.cookies, "fresh_codes", otherKey, now)).toEqual({ ok: false, code: "deployment_key_mismatch" });
    expect(await countsOf(name)).toEqual(counts);
    expect(await confirm(name, second.cookies, started.setupId, await totpAt(started.secretBytes, stepAt(now)), otherKey, now)).toEqual({
      ok: false,
      code: "deployment_key_mismatch",
    });
    expect(await rowsOf(name, TWO_STEP_SETUPS_TABLE)).toHaveLength(1);

    // Turning off needs no key.
    const ticket = await ticketFor(name, first.cookies, "turn_off", otherKey, now);
    expect(await turnOff(name, first.cookies, ticket, "success", now)).toEqual({ ok: true, value: { enabled: false } });
    expect(await rowsOf(name, TWO_STEP_TABLE)).toEqual([]);
  });
});

describe("a key refused at the completion (D-15)", () => {
  it("answers deployment_key_mismatch from startTwoStep and renewRecoveryCodes after the ticket is consumed, leaving the counts raised", async () => {
    const name = "key-refused-at-completion";
    const first = await withAccount(name);
    const second = await withAccount(name, "sam@acme.test");
    const key = newDeploymentKey();
    const { secret } = await turnedOnAt(name, first.cookies, key, T0);
    const now = T0 + STEP;

    // The checks pass under K; the completions are given K′ or no key.
    for (const given of [newDeploymentKey(), undefined]) {
      const before = await twoStepRows(name);
      const startTicket = await ticketFor(name, second.cookies, "turn_on", key, now, "unknown");
      const renewTicket = await ticketFor(name, first.cookies, "fresh_codes", key, now, "unknown");
      const counts = await countsOf(name);
      expect(counts.byEmail).toHaveLength(2);

      expect(await start(name, second.cookies, startTicket, "success", given, now)).toEqual({ ok: false, code: "deployment_key_mismatch" });
      expect(await renew(name, first.cookies, renewTicket, "success", await totpAt(secret, stepAt(now)), given, now)).toEqual({
        ok: false,
        code: "deployment_key_mismatch",
      });

      // Consumed: the same tickets with K are refused as used.
      expect(await start(name, second.cookies, startTicket, "success", key, now)).toEqual({ ok: false, code: "two_step_password_wrong" });
      expect(await renew(name, first.cookies, renewTicket, "success", await totpAt(secret, stepAt(now)), key, now)).toEqual({
        ok: false,
        code: "two_step_password_wrong",
      });
      expect(await rowsOf(name, ACCOUNT_CHECK_TICKETS_TABLE)).toEqual([]);
      expect(await countsOf(name)).toEqual(counts);
      expect(await twoStepRows(name)).toBe(before);
    }
  });
});

describe("pruning and the restart", () => {
  it("deletes at most 20 expired set-ups and tickets per write", async () => {
    const name = "prune";
    const { cookies } = await withAccount(name);
    const seedExpired = (prefix: string) =>
      runInDurableObject(stubFor(name), (_instance, s) => {
        for (let index = 0; index < TWO_STEP_PRUNE_BATCH + 5; index += 1) {
          s.storage.sql.exec(`INSERT INTO ${TWO_STEP_SETUPS_TABLE} (account_id, setup_id, secret_ciphertext, expires_at) VALUES (?, ?, 'v1.x.y', ?)`, `${prefix}-${index}`, "0".repeat(32), T0 - index - 1);
          s.storage.sql.exec(
            `INSERT INTO ${ACCOUNT_CHECK_TICKETS_TABLE} (ticket, account_id, session_hash, email_key, hash_identity, purpose, expires_at)
             VALUES (?, 'gone', 'h', 'k', 'i', 'turn_on', ?)`,
            `${prefix === "a" ? "a" : "b"}${index.toString(16).padStart(63, "0")}`,
            T0 - index - 1,
          );
        }
      });
    await seedExpired("a");
    const checked = valueOf(await check(name, cookies, "turn_on", newDeploymentKey(), T0));
    expect((await rowsOf(name, TWO_STEP_SETUPS_TABLE)).length).toBe(5);
    // Five expired tickets and the new one.
    expect((await rowsOf(name, ACCOUNT_CHECK_TICKETS_TABLE)).length).toBe(6);
    // The state read prunes nothing.
    await state(name, cookies, undefined, T0);
    expect((await rowsOf(name, TWO_STEP_SETUPS_TABLE)).length).toBe(5);

    // A refused completion (an unknown ticket) still prunes at most 20 of each.
    await seedExpired("b");
    expect(await start(name, cookies, "c".repeat(64), "success", undefined, T0)).toEqual({ ok: false, code: "two_step_password_wrong" });
    expect((await rowsOf(name, TWO_STEP_SETUPS_TABLE)).length).toBe(5 + 25 - TWO_STEP_PRUNE_BATCH);
    const tickets = (await rowsOf(name, ACCOUNT_CHECK_TICKETS_TABLE)).map((row) => row.ticket);
    expect(tickets).toHaveLength(5 + 25 - TWO_STEP_PRUNE_BATCH + 1);
    expect(tickets).toContain(checked.ticket);
  });

  it("keeps the state across a restart, and a later current code still makes a fresh set", async () => {
    const name = "restart";
    const { cookies } = await withAccount(name);
    const key = newDeploymentKey();
    const { secret } = await turnedOnAt(name, cookies, key, T0);
    const before = await state(name, cookies, key, T0);
    await evictDurableObject(stubFor(name));
    expect(await state(name, cookies, key, T0)).toEqual(before);
    const now = T0 + STEP;
    const made = await renew(name, cookies, await ticketFor(name, cookies, "fresh_codes", key, now), "success", await totpAt(secret, stepAt(now)), key, now);
    expect(made.ok).toBe(true);
  });
});

describe("matchingStep (spec 1's deferred item)", () => {
  it("answers the latest of the candidate steps whose codes match", { timeout: 120_000 }, async () => {
    // RFC 6238's published SHA-1 secret; two candidate steps sharing a code are found by search.
    const secret = new TextEncoder().encode("12345678901234567890");
    const { createHmac } = (await import("node:crypto")) as unknown as {
      createHmac(algorithm: string, key: Uint8Array): { update(data: Uint8Array): { digest(): Uint8Array } };
    };
    const code = (step: number) => {
      const counter = new Uint8Array(8);
      new DataView(counter.buffer).setUint32(4, step);
      const mac = createHmac("sha1", secret).update(counter).digest();
      const offset = mac[19]! & 0x0f;
      const binary = ((mac[offset]! & 0x7f) << 24) | (mac[offset + 1]! << 16) | (mac[offset + 2]! << 8) | mac[offset + 3]!;
      return String(binary % 1_000_000).padStart(6, "0");
    };
    // Independent of totp.ts: the RFC's vector for 59 seconds (step 1, last six digits).
    expect(code(1)).toBe("287082");
    let found: { first: number; latest: number } | null = null;
    const codes = [code(1000), code(1001)];
    for (let step = 1002; step < 20_000_000 && !found; step += 1) {
      codes.push(code(step));
      if (codes.length > 3) codes.shift();
      const [a, b, c] = codes.slice(-3) as [string, string, string];
      if (a === b) found = { first: step - 2, latest: step - 1 };
      else if (a === c) found = { first: step - 2, latest: step };
    }
    expect(found).not.toBeNull();
    const { first, latest } = found!;
    expect(await totpAt(secret, first)).toBe(await totpAt(secret, latest));
    // A moment whose candidates hold both steps: the earlier one's step when they are adjacent, else the one between.
    const current = latest - first === 1 ? first : first + 1;
    expect(await matchingStep(secret, code(first), current * STEP + 1)).toBe(latest);
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

  it("write no secret, code, recovery code, key, ticket or token across set-up, fresh codes, a mismatch and turning off", async () => {
    const name = "no-logs";
    const { cookies } = await withAccount(name);
    const key = newDeploymentKey();
    const { started, codes, secret } = await turnedOnAt(name, cookies, key, T0);
    const now = T0 + STEP;
    const ticket = await ticketFor(name, cookies, "fresh_codes", key, now);
    const fresh = valueOf(await renew(name, cookies, ticket, "success", await totpAt(secret, stepAt(now)), key, now)).recoveryCodes;
    const otherKey = newDeploymentKey();
    await state(name, cookies, otherKey, now);
    const offTicket = await ticketFor(name, cookies, "turn_off", otherKey, now);
    await turnOff(name, cookies, offTicket, "success", now);
    const forbidden = [key, otherKey, started.secret, toHex(secret), ticket, offTicket, ...Object.values(cookies), ...codes, ...fresh, await totpAt(secret, stepAt(now))];
    for (const line of lines) for (const value of forbidden) expect(line.includes(value)).toBe(false);
  });
});

describe("the installation object's operations (criterion 28, standing rule 9)", () => {
  it("change the two-step tables only in accountCheck, startTwoStep, confirmTwoStep, turnOffTwoStep, renewRecoveryCodes and the bounded pruning", async () => {
    const name = "operations";
    const fingerprint = await setupCodeFingerprint("a-two-step-sweep-code");
    const call = (operation: string, input: unknown) => callObject(env.INSTALLATION, idFor(name), operation, input);
    let done: SignInCompleted | null = null;
    const sessionCookies = () => (done ? { [sessionCookieName(done.identifier)]: done.sessionToken } : {});
    const passwordHash = () => ({ algorithm: "scrypt", n: 131_072, r: 8, p: 1, keyLength: 32, salt: randomBase64(16), hash: randomBase64(32) });
    const ticketOf = async (operation: string, input: unknown) => {
      const result = await call(operation, input);
      if (!result.ok) throw new Error(`${operation}: ${result.body.error.code}`);
      return (result.value as { ticket: string }).ticket;
    };
    const liveHash = async (email: string) => {
      const result = await call("createInvitation", { email, name: "Fixture Person", role: "standard", cookies: sessionCookies() });
      if (!result.ok) throw new Error(result.body.error.code);
      return invitationSecretHash((result.value as InvitationCreated).secret);
    };
    const twoStep = twoStepFixtures(call, sessionCookies, newDeploymentKey());

    // In an order that lets each fixture use what the earlier operations made; endSession last.
    const fixtures: [string, () => Promise<unknown>][] = [
      ["status", async () => null],
      ["setupState", async () => null],
      ["setupAttempt", async () => ({ address: "198.51.100.1", fingerprint })],
      [
        "createFirstAdministrator",
        async () => ({
          fingerprint,
          ticket: await ticketOf("setupAttempt", { address: "198.51.100.2", fingerprint }),
          installationName: "Acme Security",
          publicAddress: "https://survey.acme.test",
          name: "Dana Admin",
          email: EMAIL,
          passwordHash: passwordHash(),
        }),
      ],
      ["signInAttempt", async () => ({ email: EMAIL, address: "198.51.100.3", cookies: {} })],
      [
        "completeSignIn",
        async () => ({ ticket: (await call("signInAttempt", { email: EMAIL, address: "198.51.100.4", cookies: {} }).then((r) => (r.ok ? (r.value as SignInAttemptCounted).ticket : ""))), outcome: "success" }),
      ],
      ["sessionInfo", async () => ({ cookies: sessionCookies() })],
      ["createInvitation", async () => ({ email: "invited@acme.test", name: "Invited Person", role: "standard", cookies: sessionCookies() })],
      ["invitationInfo", async () => ({ secretHash: await liveHash("read@acme.test") })],
      ["deploymentKeyState", async () => ({})],
      ["acceptInvitation", async () => ({ secretHash: await liveHash("accept@acme.test"), name: "Accepting Person", passwordHash: passwordHash(), cookies: {} })],
      ...TWO_STEP_OPERATIONS.map((operation) => [operation, twoStep[operation]] as [string, () => Promise<unknown>]),
      ["endSession", async () => ({ cookies: sessionCookies() })],
    ];
    const operations = await runInDurableObject(stubFor(name), (instance: Installation) => [...instance.ops.keys()].sort());
    expect(fixtures.map(([operation]) => operation).sort()).toEqual(operations);

    const snapshot = async () => JSON.stringify(await Promise.all(TWO_STEP_TABLES.map((table) => rowsOf(name, table))));
    const changed: string[] = [];
    for (const [operation, fixture] of fixtures) {
      const input = await fixture();
      const before = await snapshot();
      const result = await call(operation, input);
      expect(result.ok, `${operation}: ${result.ok ? "" : result.body.error.code}`).toBe(true);
      if (operation === "completeSignIn" && result.ok) done = result.value as SignInCompleted;
      if ((await snapshot()) !== before) changed.push(operation);
    }
    expect(changed.sort()).toEqual(["accountCheck", "confirmTwoStep", "renewRecoveryCodes", "startTwoStep", "turnOffTwoStep"]);
    expect(operations.some((operation) => /restore|revision/i.test(operation))).toBe(false);

    // Two-step rows live only in the installation object: project rooms have none of the tables.
    const room = env.PROJECT_ROOM.get(env.PROJECT_ROOM.idFromName(name));
    const roomTables = await runInDurableObject(room as unknown as DurableObjectStub<Installation>, (_instance, s) =>
      TWO_STEP_TABLES.filter((table) => tableExists(s.storage.sql, table)),
    );
    expect(roomTables).toEqual([]);
  });
});
