import { env } from "cloudflare:workers";
import { evictDurableObject, runInDurableObject } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { markerCookieName } from "../server/auth/marker";
import { toBase64 } from "../server/auth/password";
import { newSessionToken, sessionCookieName, sessionTokenHash } from "../server/auth/session";
import { setupCodeFingerprint } from "../server/auth/setupCode";
import type { Installation } from "../server/installation/Installation";
import {
  ADDRESS_FAILURES_TABLE,
  EMAIL_FAILURES_TABLE,
  IDENTITY_TABLE,
  PRUNE_BATCH,
  SESSIONS_TABLE,
  SIGNIN_TABLES,
  TICKETS_TABLE,
  type SignInAttemptCounted,
  type SignInCompleted,
} from "../server/installation/signInStore";
import { SETTINGS_TABLE, USERS_TABLE } from "../server/installation/setupStore";
import { invitationSecretHash, type InvitationCreated } from "../server/installation/invitationStore";
import { callObject } from "../server/objects/call";
import type { ObjectBase } from "../server/objects/ObjectBase";
import { BELOW_THRESHOLD_CLEAR_MS, MARKER_MAX_AGE_MS, SESSION_MAX_AGE_MS, SIGNIN_TICKET_TTL_MS } from "../shared/signin";
import { tableExists } from "./helpers";
import { newDeploymentKey, TWO_STEP_OPERATIONS, twoStepFixtures } from "./two-step-fixtures";

// The installation object's sign-in storage (story 1.3, spec 1): the I/O matrix's store rows, the
// ticket binding and its expiry, the stand-in refusal, HMAC email keys, the marker count, clearing,
// the unknown address, bounded pruning, the identifier, the 30-day boundary, the read-only session
// read, and which operations touch the sessions table (CAP-3 storage, CAP-6, CAP-7, CAP-8, CAP-11).

const SECOND = 1000;
const MINUTE = 60_000;
const T0 = Date.UTC(2026, 10, 20, 12, 0, 0);
const ADDRESS = "198.51.100.1";

function stubFor(name: string) {
  return env.INSTALLATION.get(env.INSTALLATION.idFromName(name));
}

function idFor(name: string) {
  return env.INSTALLATION.idFromName(name);
}

function randomBase64(bytes: number) {
  return toBase64(crypto.getRandomValues(new Uint8Array(bytes)));
}

/** Adds an account straight to the users table, with a made-up hash (no check runs in these tests). */
async function seedUser(name: string, email: string, options: { userName?: string; active?: 0 | 1 } = {}): Promise<string> {
  const id = crypto.randomUUID();
  await runInDurableObject(stubFor(name), (_instance, state) => {
    state.storage.sql.exec(
      `INSERT INTO ${USERS_TABLE} (id, email, name, role, active, password_algorithm, password_n, password_r, password_p,
         password_key_length, password_salt, password_hash, created_at)
       VALUES (?, ?, ?, 'administrator', ?, 'scrypt', 131072, 8, 1, 32, ?, ?, ?)`,
      id,
      email,
      options.userName ?? "Dana Admin",
      options.active ?? 1,
      randomBase64(16),
      randomBase64(32),
      new Date(T0).toISOString(),
    );
  });
  return id;
}

async function seedSettings(name: string, installationName = "Acme Security", publicAddress = "https://survey.acme.test") {
  await runInDurableObject(stubFor(name), (_instance, state) => {
    state.storage.sql.exec(
      `INSERT INTO ${SETTINGS_TABLE} (id, installation_name, public_address, set_up_at) VALUES (1, ?, ?, ?)
       ON CONFLICT (id) DO UPDATE SET installation_name = excluded.installation_name, public_address = excluded.public_address`,
      installationName,
      publicAddress,
      new Date(T0).toISOString(),
    );
  });
}

type Attempt = { outcome: "counted"; value: SignInAttemptCounted } | { outcome: string; retryAfterSeconds?: number };

async function attemptAt(name: string, email: string, now: number, options: { address?: string; cookies?: Record<string, string> } = {}): Promise<Attempt> {
  return runInDurableObject(stubFor(name), async (instance: Installation) => {
    try {
      const value = await instance.signIn.attempt({ email, address: options.address ?? ADDRESS, cookies: options.cookies ?? {} }, now);
      return { outcome: "counted" as const, value };
    } catch (error) {
      const refusal = error as { code?: string; retryAfterSeconds?: number };
      return { outcome: refusal.code ?? String(error), retryAfterSeconds: refusal.retryAfterSeconds };
    }
  });
}

function ticketOf(attempt: Attempt): string {
  if (attempt.outcome !== "counted") throw new Error(`attempt refused: ${attempt.outcome}`);
  return (attempt as { value: SignInAttemptCounted }).value.ticket;
}

type Completion = { outcome: "signedIn"; value: SignInCompleted } | { outcome: string };

async function completeAt(name: string, ticket: string, outcome: "success" | "failure", now: number): Promise<Completion> {
  return runInDurableObject(stubFor(name), async (instance: Installation) => {
    try {
      return { outcome: "signedIn" as const, value: await instance.signIn.complete(ticket, outcome, now) };
    } catch (error) {
      return { outcome: (error as { code?: string }).code ?? String(error) };
    }
  });
}

function signedIn(completion: Completion): SignInCompleted {
  if (completion.outcome !== "signedIn") throw new Error(`completion refused: ${completion.outcome}`);
  return (completion as { value: SignInCompleted }).value;
}

/** Signs in at `now` and answers the completion and the browser's two cookies. */
async function signInAt(name: string, email: string, now: number, options: { address?: string; cookies?: Record<string, string> } = {}) {
  const done = signedIn(await completeAt(name, ticketOf(await attemptAt(name, email, now, options)), "success", now));
  return {
    done,
    cookies: { [sessionCookieName(done.identifier)]: done.sessionToken, [markerCookieName(done.identifier)]: done.marker },
  };
}

function countsOf(name: string) {
  return runInDurableObject(stubFor(name), (instance: Installation) => instance.signIn.counts());
}

function emailKeyOf(name: string, email: string) {
  return runInDurableObject(stubFor(name), (instance: Installation) => instance.signIn.emailKey(email));
}

function sessionsOf(name: string) {
  return runInDurableObject(stubFor(name), (_instance, state) => state.storage.sql.exec(`SELECT * FROM ${SESSIONS_TABLE} ORDER BY token_hash`).toArray());
}

function identifierOf(name: string) {
  return runInDurableObject(stubFor(name), (instance: Installation) => instance.signIn.identifier());
}

function sessionInfoAt(name: string, cookies: Record<string, string>, now: number) {
  return runInDurableObject(stubFor(name), (instance: Installation) => instance.signIn.sessionInfo(cookies, now));
}

/** Fails the given email `count` times at `now`, each with its ticket completed as a failure. */
async function failTimes(name: string, email: string, count: number, now: number, options: { address?: string; cookies?: Record<string, string> } = {}) {
  for (let index = 0; index < count; index += 1) {
    const attempt = await attemptAt(name, email, now, options);
    expect(attempt.outcome, `failure ${index + 1}`).toBe("counted");
    expect((await completeAt(name, ticketOf(attempt), "failure", now)).outcome).toBe("signin_failed");
  }
}

describe("the tables and the identifier", () => {
  it("are created with the object; the identifier survives a restart and a change of public address (D-1, V-11)", async () => {
    const name = "signin-identity";
    const tables = await runInDurableObject(stubFor(name), (_instance, state) => SIGNIN_TABLES.map((table) => tableExists(state.storage.sql, table)));
    expect(tables.every(Boolean)).toBe(true);
    const identifier = await identifierOf(name);
    expect(identifier).toMatch(/^[0-9a-f]{32}$/);

    await seedSettings(name, "Acme Security", "https://survey.acme.test");
    await seedSettings(name, "Acme Security", "https://new-address.acme.test");
    expect(await identifierOf(name)).toBe(identifier);

    const before = await runInDurableObject(stubFor(name), (instance: ObjectBase) => instance.startId);
    await evictDurableObject(stubFor(name));
    expect(await runInDurableObject(stubFor(name), (instance: ObjectBase) => instance.startId)).not.toBe(before);
    expect(await identifierOf(name)).toBe(identifier);
    const identityRows = await runInDurableObject(stubFor(name), (_instance, state) => state.storage.sql.exec(`SELECT * FROM ${IDENTITY_TABLE}`).toArray());
    expect(identityRows).toHaveLength(1);

    // Another installation has another identifier.
    expect(await identifierOf("signin-identity-other")).not.toBe(identifier);
  });
});

describe("an attempt", () => {
  it("for a known email under the limits is counted for the email and the address and answers the stored hash and a bound ticket", async () => {
    const name = "attempt-known";
    const userId = await seedUser(name, "dana@acme.test");
    const presented = newSessionToken();
    const identifier = await identifierOf(name);
    const attempt = await attemptAt(name, "  Dana@ACME.test ", T0, { cookies: { [sessionCookieName(identifier)]: presented } });
    expect(attempt.outcome).toBe("counted");
    const value = (attempt as { value: SignInAttemptCounted }).value;
    const stored = await runInDurableObject(stubFor(name), (_instance, state) =>
      state.storage.sql.exec<{ password_salt: string; password_hash: string }>(`SELECT password_salt, password_hash FROM ${USERS_TABLE}`).one(),
    );
    expect(value).toEqual({
      identifier,
      ticket: expect.stringMatching(/^[0-9a-f]{64}$/),
      standIn: false,
      passwordHash: { algorithm: "scrypt", n: 131_072, r: 8, p: 1, keyLength: 32, salt: stored.password_salt, hash: stored.password_hash },
    });

    const emailKey = await emailKeyOf(name, "dana@acme.test");
    const counts = await countsOf(name);
    expect(counts.byEmail).toEqual([{ emailKey, failures: 1, lastFailureAt: T0, clearsAt: T0 + BELOW_THRESHOLD_CLEAR_MS }]);
    expect(counts.byAddress).toEqual([{ address: ADDRESS, at: T0, clearsAt: T0 + 15 * MINUTE }]);

    // The ticket is bound inside the object to the account, the email key, the address row, the
    // stored hash's identity and the presented session's hash.
    const ticketRow = await runInDurableObject(stubFor(name), (_instance, state) => state.storage.sql.exec(`SELECT * FROM ${TICKETS_TABLE}`).one());
    expect(ticketRow).toEqual({
      ticket: value.ticket,
      user_id: userId,
      email_key: emailKey,
      address_failure_id: expect.any(Number),
      marker_id: null,
      hash_identity: `${stored.password_salt}.${stored.password_hash}`,
      presented_session_hash: await sessionTokenHash(presented),
      expires_at: T0 + SIGNIN_TICKET_TTL_MS,
    });
  });

  it("for an unknown or inactive email is counted the same and answers the stand-in signal in the same shape", async () => {
    const name = "attempt-unknown";
    await seedUser(name, "dana@acme.test");
    await seedUser(name, "gone@acme.test", { active: 0 });
    const known = await attemptAt(name, "dana@acme.test", T0);
    for (const email of ["nobody@acme.test", "gone@acme.test"]) {
      const attempt = await attemptAt(name, email, T0);
      expect(attempt.outcome).toBe("counted");
      const value = (attempt as { value: SignInAttemptCounted }).value;
      expect(value).toEqual({ identifier: expect.any(String), ticket: expect.stringMatching(/^[0-9a-f]{64}$/), standIn: true, passwordHash: null });
      expect(Object.keys(value).sort()).toEqual(Object.keys((known as { value: SignInAttemptCounted }).value).sort());
    }
    const counts = await countsOf(name);
    expect(counts.byEmail.map((row) => row.failures)).toEqual([1, 1, 1]);
    expect(counts.byAddress).toHaveLength(3);
    const standInTickets = await runInDurableObject(stubFor(name), (_instance, state) =>
      state.storage.sql.exec(`SELECT COUNT(*) AS n FROM ${TICKETS_TABLE} WHERE user_id IS NULL AND hash_identity IS NULL`).one(),
    );
    expect(standInTickets.n).toBe(2);
  });

  it("keys an email's count by HMAC-SHA-256 under the object's key, never the email or its plain hash (A-13)", async () => {
    const name = "attempt-hmac";
    await attemptAt(name, "Someone@Acme.test", T0);
    const key = await emailKeyOf(name, "someone@acme.test");
    expect(key).toMatch(/^[0-9a-f]{64}$/);
    expect(await emailKeyOf(name, "  SOMEONE@acme.TEST")).toBe(key);
    const plain = [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode("someone@acme.test")))]
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
    expect(key).not.toBe(plain);
    // Another installation's key gives another value for the same email.
    expect(await emailKeyOf("attempt-hmac-other", "someone@acme.test")).not.toBe(key);
    const everything = await runInDurableObject(stubFor(name), (_instance, state) =>
      JSON.stringify(SIGNIN_TABLES.map((table) => state.storage.sql.exec(`SELECT * FROM ${table}`).toArray())),
    );
    expect(everything.toLowerCase()).not.toContain("someone");
  });

  it("while set-up is open takes the stand-in path", async () => {
    const attempt = await attemptAt("attempt-setup-open", "dana@acme.test", T0);
    expect(attempt.outcome === "counted" && (attempt as { value: SignInAttemptCounted }).value.standIn).toBe(true);
  });
});

describe("the email's count (D-2 as amended)", () => {
  it("makes an email wait after 5 failures in a row, doubling to 15 minutes; refused attempts are not counted", async () => {
    const name = "email-wait";
    await seedUser(name, "dana@acme.test");
    await failTimes(name, "dana@acme.test", 5, T0);
    let now = T0;
    for (const waitMinutes of [1, 2, 4, 8, 15, 15]) {
      const during = await attemptAt(name, "dana@acme.test", now + 1000, { address: `203.0.113.${waitMinutes}` });
      expect(during).toEqual({ outcome: "signin_wait", retryAfterSeconds: waitMinutes * 60 - 1 });
      now += waitMinutes * MINUTE;
      await failTimes(name, "dana@acme.test", 1, now);
    }
    expect((await countsOf(name)).byEmail[0]!.failures).toBe(11);
  });

  it("applies the same wait to an email with no account", async () => {
    const name = "email-wait-unknown";
    await seedUser(name, "dana@acme.test");
    await failTimes(name, "dana@acme.test", 5, T0);
    await failTimes(name, "nobody@acme.test", 5, T0, { address: "203.0.113.9" });
    expect(await attemptAt(name, "dana@acme.test", T0 + 10 * SECOND)).toEqual(await attemptAt(name, "nobody@acme.test", T0 + 10 * SECOND));
    expect((await attemptAt(name, "nobody@acme.test", T0 + 10 * SECOND)).outcome).toBe("signin_wait");
  });

  it("clears 15 minutes after its wait ended", async () => {
    const name = "email-cleared-after-wait";
    await failTimes(name, "dana@acme.test", 5, T0);
    // The wait ended at T0 + 1 minute; just before 15 minutes later the count is still held.
    await failTimes(name, "dana@acme.test", 1, T0 + MINUTE + 15 * MINUTE - 1);
    expect((await countsOf(name)).byEmail[0]!.failures).toBe(6);
    const last = T0 + 16 * MINUTE - 1;
    // Six failures wait 2 minutes; 15 minutes after that the count starts again.
    await failTimes(name, "dana@acme.test", 1, last + 2 * MINUTE + 15 * MINUTE);
    expect((await countsOf(name)).byEmail[0]!.failures).toBe(1);
  });

  it("below 5 clears 24 hours after its last failure, and otherwise keeps counting (E-8)", async () => {
    const cleared = "email-cleared-below";
    await failTimes(cleared, "dana@acme.test", 4, T0);
    await failTimes(cleared, "dana@acme.test", 1, T0 + 24 * 60 * MINUTE);
    expect((await countsOf(cleared)).byEmail[0]!.failures).toBe(1);

    const kept = "email-kept-below";
    await failTimes(kept, "dana@acme.test", 4, T0);
    await failTimes(kept, "dana@acme.test", 1, T0 + 15 * MINUTE);
    expect((await countsOf(kept)).byEmail[0]!.failures).toBe(5);
    expect((await attemptAt(kept, "dana@acme.test", T0 + 15 * MINUTE + SECOND)).outcome).toBe("signin_wait");
    // Just under 24 hours is still held.
    const held = "email-held-below";
    await failTimes(held, "dana@acme.test", 4, T0);
    await failTimes(held, "dana@acme.test", 1, T0 + 24 * 60 * MINUTE - 1);
    expect((await countsOf(held)).byEmail[0]!.failures).toBe(5);
  });
});

describe("the address's count (D-2 as amended, D-11)", () => {
  it("makes a known address wait at 20 failures within 15 minutes, whatever the emails; refused attempts are not counted", async () => {
    const name = "address-wait";
    for (let index = 0; index < 20; index += 1) await failTimes(name, `person${index}@acme.test`, 1, T0 + index * SECOND);
    const last = T0 + 19 * SECOND;
    expect(await attemptAt(name, "fresh@acme.test", last + 10 * SECOND)).toEqual({ outcome: "signin_wait", retryAfterSeconds: 50 });
    expect((await countsOf(name)).byAddress).toHaveLength(20);
    // Another address is not held.
    expect((await attemptAt(name, "fresh@acme.test", last + 10 * SECOND, { address: "198.51.100.2" })).outcome).toBe("counted");
    // After the wait, the 21st is counted and the next wait is 2 minutes.
    await failTimes(name, "fresh2@acme.test", 1, last + MINUTE);
    expect(await attemptAt(name, "fresh3@acme.test", last + MINUTE + SECOND)).toEqual({ outcome: "signin_wait", retryAfterSeconds: 119 });
  });

  it("counts over a rolling 15 minutes below 20", async () => {
    const name = "address-rolling";
    for (let index = 0; index < 19; index += 1) await failTimes(name, `person${index}@acme.test`, 1, T0);
    // At 15 minutes the 19 have left the window: this is the first again, and no wait follows.
    await failTimes(name, "late@acme.test", 1, T0 + 15 * MINUTE);
    expect(await attemptAt(name, "late2@acme.test", T0 + 15 * MINUTE + SECOND)).toMatchObject({ outcome: "counted" });
  });

  it("keeps a waiting address's failures counted until 15 minutes after its wait ends", async () => {
    const name = "address-kept";
    for (let index = 0; index < 20; index += 1) await failTimes(name, `person${index}@acme.test`, 1, T0);
    expect(await attemptAt(name, "x@acme.test", T0 + 30 * SECOND)).toEqual({ outcome: "signin_wait", retryAfterSeconds: 30 });
    // 15.5 minutes on, the failures are older than the window but held: this is the 21st.
    const at = T0 + 15 * MINUTE + 30 * SECOND;
    await failTimes(name, "y@acme.test", 1, at);
    expect(await attemptAt(name, "z@acme.test", at + SECOND)).toEqual({ outcome: "signin_wait", retryAfterSeconds: 119 });
    // 21 failures wait 2 minutes, so all 21 are held until 17 minutes after the 21st: just before
    // then, one more is counted as the 22nd and starts a 4-minute wait.
    await failTimes(name, "z@acme.test", 1, at + 17 * MINUTE - SECOND);
    expect(await attemptAt(name, "w@acme.test", at + 17 * MINUTE)).toEqual({ outcome: "signin_wait", retryAfterSeconds: 4 * 60 - 1 });
  });

  it("has no count and no wait for an unknown address; the email counts hold alone (D-11, A-7, E-2)", async () => {
    const name = "address-unknown";
    for (let index = 0; index < 25; index += 1) await failTimes(name, `person${index}@acme.test`, 1, T0, { address: "unknown" });
    expect((await countsOf(name)).byAddress).toEqual([]);
    expect((await attemptAt(name, "another@acme.test", T0 + SECOND, { address: "unknown" })).outcome).toBe("counted");
    await failTimes(name, "target@acme.test", 5, T0, { address: "unknown" });
    expect((await attemptAt(name, "target@acme.test", T0 + SECOND, { address: "unknown" })).outcome).toBe("signin_wait");
  });

  it("lets a marker holder sign in after 25 failures from the unknown address over different emails", async () => {
    const name = "address-unknown-marker";
    await seedUser(name, "dana@acme.test");
    const { cookies } = await signInAt(name, "dana@acme.test", T0, { address: "unknown" });
    for (let index = 0; index < 25; index += 1) await failTimes(name, `person${index}@acme.test`, 1, T0 + SECOND, { address: "unknown" });
    await failTimes(name, "dana@acme.test", 5, T0 + SECOND, { address: "unknown" });
    const attempt = await attemptAt(name, "dana@acme.test", T0 + 2 * SECOND, { address: "unknown", cookies });
    expect((await completeAt(name, ticketOf(attempt), "success", T0 + 2 * SECOND)).outcome).toBe("signedIn");
  });
});

describe("the marker (D-2 amended, D-3, CA-44, E-1, V-1)", () => {
  async function lockedWithMarker(name: string) {
    await seedUser(name, "dana@acme.test");
    const { cookies, done } = await signInAt(name, "dana@acme.test", T0, { address: "192.0.2.50" });
    // Someone else locks the email from their own address.
    await failTimes(name, "dana@acme.test", 5, T0 + MINUTE, { address: "203.0.113.66" });
    expect((await attemptAt(name, "dana@acme.test", T0 + MINUTE + SECOND, { address: "192.0.2.50" })).outcome).toBe("signin_wait");
    return { cookies, done };
  }

  it("skips the email's wait but not its count: the attempt is counted for email, marker and known address", async () => {
    const name = "marker-skips-wait";
    const { cookies, done } = await lockedWithMarker(name);
    const attempt = await attemptAt(name, "dana@acme.test", T0 + MINUTE + SECOND, { address: "192.0.2.50", cookies });
    expect(attempt.outcome).toBe("counted");
    const counts = await countsOf(name);
    expect(counts.byEmail[0]!.failures).toBe(6);
    expect(counts.byMarker).toEqual([expect.objectContaining({ failures: 1 })]);
    expect(counts.byAddress.filter((row) => row.address === "192.0.2.50")).toHaveLength(1);
    // CA-44: the owner signs in with the correct password from the browser holding the marker.
    const completed = signedIn(await completeAt(name, ticketOf(attempt), "success", T0 + MINUTE + SECOND));
    expect(completed.account).toEqual(done.account);
    expect((await countsOf(name)).byEmail).toEqual([]);
  });

  it("raises the email count when the email is not waiting (E-1)", async () => {
    const name = "marker-raises-email";
    await seedUser(name, "dana@acme.test");
    const { cookies } = await signInAt(name, "dana@acme.test", T0);
    await failTimes(name, "dana@acme.test", 1, T0 + SECOND, { cookies });
    const counts = await countsOf(name);
    expect(counts.byEmail).toEqual([expect.objectContaining({ failures: 1 })]);
    expect(counts.byMarker).toEqual([expect.objectContaining({ failures: 1 })]);
  });

  it("has its own count: after 5 marker failures it is treated as absent and the email's wait applies", async () => {
    const name = "marker-exhausted";
    await seedUser(name, "dana@acme.test");
    const { cookies } = await signInAt(name, "dana@acme.test", T0);
    await failTimes(name, "dana@acme.test", 5, T0 + SECOND, { cookies });
    const counts = await countsOf(name);
    expect(counts.byEmail[0]!.failures).toBe(5);
    expect(counts.byMarker[0]!.failures).toBe(5);
    expect(await attemptAt(name, "dana@acme.test", T0 + 2 * SECOND, { cookies })).toEqual({ outcome: "signin_wait", retryAfterSeconds: 59 });
    // Not counted, for the marker or the email.
    const after = await countsOf(name);
    expect([after.byEmail[0]!.failures, after.byMarker[0]!.failures]).toEqual([5, 5]);
  });

  it("counts as no marker when expired, for another account or badly signed", async () => {
    const name = "marker-invalid";
    const { cookies } = await lockedWithMarker(name);
    await seedUser(name, "other@acme.test", { userName: "Other Person" });
    const identifier = await identifierOf(name);
    const markerName = markerCookieName(identifier);
    const value = cookies[markerName]!;

    // For another account: a marker for Dana does not help with Other's locked email.
    await failTimes(name, "other@acme.test", 5, T0 + MINUTE, { address: "203.0.113.67" });
    expect((await attemptAt(name, "other@acme.test", T0 + MINUTE + SECOND, { address: "192.0.2.50", cookies })).outcome).toBe("signin_wait");

    // Badly signed.
    const at = value.lastIndexOf(".") + 1;
    const tampered = value.slice(0, at) + (value[at] === "A" ? "B" : "A") + value.slice(at + 1);
    expect((await attemptAt(name, "dana@acme.test", T0 + MINUTE + SECOND, { address: "192.0.2.50", cookies: { [markerName]: tampered } })).outcome).toBe(
      "signin_wait",
    );

    // Expired: a year after the sign-in, with the email locked again then.
    const later = T0 + MARKER_MAX_AGE_MS;
    await failTimes(name, "dana@acme.test", 5, later, { address: "203.0.113.68" });
    expect((await attemptAt(name, "dana@acme.test", later + SECOND, { address: "192.0.2.50", cookies })).outcome).toBe("signin_wait");
    // A second earlier would have been valid.
    const fresh = "marker-not-yet-expired";
    const { cookies: freshCookies } = await lockedWithMarker(fresh);
    await failTimes(fresh, "dana@acme.test", 5, later - 2 * SECOND, { address: "203.0.113.68" });
    expect((await attemptAt(fresh, "dana@acme.test", later - SECOND, { address: "192.0.2.50", cookies: freshCookies })).outcome).toBe("counted");
  });

  it("is renewed at each sign-in with a later expiry", async () => {
    const name = "marker-renewed";
    await seedUser(name, "dana@acme.test");
    const first = await signInAt(name, "dana@acme.test", T0);
    const second = await signInAt(name, "dana@acme.test", T0 + MINUTE, { cookies: first.cookies });
    const expiry = (marker: string) => Number(marker.split(".")[3]);
    expect(expiry(second.done.marker)).toBe(expiry(first.done.marker) + MINUTE);
    // The marker identifier is kept when the browser already held a valid one.
    expect(second.done.marker.split(".")[2]).toBe(first.done.marker.split(".")[2]);
  });
});

describe("completing an attempt", () => {
  it("when correct removes its own attempt from the address count, clears the email and marker counts, ends the presented session and stores the new one", async () => {
    const name = "complete-correct";
    const userId = await seedUser(name, "dana@acme.test");
    const first = await signInAt(name, "dana@acme.test", T0);
    // Other failures from the same address, and failures for this email with the marker.
    await failTimes(name, "someone@acme.test", 2, T0 + SECOND);
    await failTimes(name, "dana@acme.test", 2, T0 + SECOND, { cookies: first.cookies });
    const now = T0 + 2 * SECOND;
    const attempt = await attemptAt(name, "dana@acme.test", now, { cookies: first.cookies });
    const before = await countsOf(name);
    expect(before.byAddress).toHaveLength(5);
    const done = signedIn(await completeAt(name, ticketOf(attempt), "success", now));
    expect(done).toEqual({
      identifier: await identifierOf(name),
      sessionToken: expect.stringMatching(/^[A-Za-z0-9_-]{43}$/),
      marker: expect.any(String),
      account: { id: userId, name: "Dana Admin" },
      signedInAt: new Date(now).toISOString(),
    });
    const after = await countsOf(name);
    const someoneKey = await emailKeyOf(name, "someone@acme.test");
    expect(after.byEmail.map((row) => row.emailKey)).toEqual([someoneKey]);
    expect(after.byMarker).toEqual([]);
    expect(after.byAddress).toHaveLength(4);
    expect(after.byAddress.some((row) => row.at === now)).toBe(false);
    expect(after.tickets).toBe(0);

    // The presented session ended; only the new one is stored, by hash, last use = sign-in.
    const sessions = await sessionsOf(name);
    expect(sessions).toEqual([
      { token_hash: await sessionTokenHash(done.sessionToken), user_id: userId, signed_in_at: now, last_used_at: now, expires_at: now + SESSION_MAX_AGE_MS },
    ]);
    expect((await sessionInfoAt(name, first.cookies, now + SECOND)).signedIn).toBe(false);
  });

  it("with a stand-in ticket is refused whatever the outcome, with no session and the counts kept (A-1, E-4)", async () => {
    const name = "complete-stand-in";
    const attempt = await attemptAt(name, "nobody@acme.test", T0);
    expect(await completeAt(name, ticketOf(attempt), "success", T0)).toEqual({ outcome: "signin_failed" });
    expect(await sessionsOf(name)).toEqual([]);
    const counts = await countsOf(name);
    expect(counts.byEmail[0]!.failures).toBe(1);
    expect(counts.byAddress).toHaveLength(1);
  });

  it("is refused when the account was made inactive or its hash replaced between the two calls (E-22)", async () => {
    const changes: [string, string][] = [
      ["inactive", `UPDATE ${USERS_TABLE} SET active = 0`],
      ["salt", `UPDATE ${USERS_TABLE} SET password_salt = '${randomBase64(16)}'`],
      // A rehash that kept the salt is still a replaced hash.
      ["hash", `UPDATE ${USERS_TABLE} SET password_hash = '${randomBase64(32)}'`],
    ];
    for (const [label, change] of changes) {
      const name = `complete-changed-${label}`;
      await seedUser(name, "dana@acme.test");
      const attempt = await attemptAt(name, "dana@acme.test", T0);
      await runInDurableObject(stubFor(name), (_instance, state) => void state.storage.sql.exec(change));
      expect(await completeAt(name, ticketOf(attempt), "success", T0 + SECOND)).toEqual({ outcome: "signin_failed" });
      expect(await sessionsOf(name)).toEqual([]);
      expect((await countsOf(name)).byEmail[0]!.failures).toBe(1);
    }
  });

  it("when wrong leaves the counts raised and stores no session", async () => {
    const name = "complete-wrong";
    await seedUser(name, "dana@acme.test");
    const attempt = await attemptAt(name, "dana@acme.test", T0);
    expect(await completeAt(name, ticketOf(attempt), "failure", T0)).toEqual({ outcome: "signin_failed" });
    expect(await sessionsOf(name)).toEqual([]);
    const counts = await countsOf(name);
    expect([counts.byEmail[0]!.failures, counts.byAddress.length, counts.tickets]).toEqual([1, 1, 0]);
  });

  it("with a missing, reused or expired ticket is refused and writes nothing (D-5 amended)", async () => {
    const name = "complete-bad-ticket";
    await seedUser(name, "dana@acme.test");
    // Sessions and counts. A ticket the bounded pruning removes once expired is not a write of the
    // completion.
    const snapshot = async () => {
      const { tickets: _tickets, ...counts } = await countsOf(name);
      return { sessions: await sessionsOf(name), counts };
    };

    const unknownTicket = "a".repeat(64);
    let before = await snapshot();
    expect(await completeAt(name, unknownTicket, "success", T0)).toEqual({ outcome: "signin_failed" });
    expect(await snapshot()).toEqual(before);

    const used = ticketOf(await attemptAt(name, "dana@acme.test", T0));
    expect((await completeAt(name, used, "success", T0)).outcome).toBe("signedIn");
    before = await snapshot();
    expect(await completeAt(name, used, "success", T0 + SECOND)).toEqual({ outcome: "signin_failed" });
    expect(await snapshot()).toEqual(before);

    const late = ticketOf(await attemptAt(name, "dana@acme.test", T0 + 2 * SECOND));
    before = await snapshot();
    expect(await completeAt(name, late, "success", T0 + 2 * SECOND + SIGNIN_TICKET_TTL_MS)).toEqual({ outcome: "signin_failed" });
    expect(await snapshot()).toEqual(before);

    const inTime = ticketOf(await attemptAt(name, "dana@acme.test", T0 + 3 * SECOND));
    expect((await completeAt(name, inTime, "success", T0 + 3 * SECOND + SIGNIN_TICKET_TTL_MS - 1)).outcome).toBe("signedIn");
  });
});

describe("attempts sent at once (CA-43, A-6)", () => {
  async function sendAtOnce(name: string, cookies: Record<string, string>) {
    const results = await Promise.all(
      Array.from({ length: 25 }, () =>
        callObject(env.INSTALLATION, idFor(name), "signInAttempt", { email: "dana@acme.test", address: "unknown", cookies }),
      ),
    );
    return {
      tickets: results.filter((result) => result.ok).length,
      waits: results.filter((result) => !result.ok && result.body.error.code === "signin_wait").length,
    };
  }

  it("give 5 tickets and 20 waits for one email with no marker", async () => {
    const name = "at-once";
    await seedUser(name, "dana@acme.test");
    expect(await sendAtOnce(name, {})).toEqual({ tickets: 5, waits: 20 });
  });

  it("give 5 tickets and 20 waits when they carry a valid marker", async () => {
    const name = "at-once-marker";
    await seedUser(name, "dana@acme.test");
    const { cookies } = await signInAt(name, "dana@acme.test", Date.now() - MINUTE, { address: "unknown" });
    delete cookies[Object.keys(cookies).find((cookie) => !cookie.includes("-m-"))!];
    expect(await sendAtOnce(name, cookies)).toEqual({ tickets: 5, waits: 20 });
    const counts = await countsOf(name);
    expect([counts.byEmail[0]!.failures, counts.byMarker[0]!.failures]).toEqual([5, 5]);
  });

  it("answer the wait with the fixed message and the seconds, never the email", async () => {
    const name = "at-once-refusal";
    for (let index = 0; index < 5; index += 1) {
      await callObject(env.INSTALLATION, idFor(name), "signInAttempt", { email: "Secret.Person@acme.test", address: "unknown", cookies: {} });
    }
    const refused = await callObject(env.INSTALLATION, idFor(name), "signInAttempt", { email: "Secret.Person@acme.test", address: "unknown", cookies: {} });
    expect(refused.ok).toBe(false);
    if (!refused.ok) {
      expect(refused.status).toBe(429);
      expect(refused.body).toEqual({ error: { code: "signin_wait", message: "Too many attempts. Wait before trying again.", retryAfterSeconds: expect.any(Number) } });
      expect(JSON.stringify(refused.body).toLowerCase()).not.toContain("secret.person");
    }
  });
});

describe("a restart", () => {
  it("leaves counts, waits and the identifier unchanged", async () => {
    const name = "signin-restart";
    await failTimes(name, "dana@acme.test", 1, T0);
    const identifier = await identifierOf(name);
    const before = await countsOf(name);
    await evictDurableObject(stubFor(name));
    expect(await countsOf(name)).toEqual(before);
    expect(await identifierOf(name)).toBe(identifier);
    await failTimes(name, "dana@acme.test", 4, T0 + SECOND);
    expect((await attemptAt(name, "dana@acme.test", T0 + 2 * SECOND)).outcome).toBe("signin_wait");
  });
});

describe("pruning (A-14, E-17)", () => {
  async function seedEmailRows(name: string, count: number, clearsAt: number) {
    await runInDurableObject(stubFor(name), (_instance, state) => {
      for (let index = 0; index < count; index += 1) {
        state.storage.sql.exec(
          `INSERT INTO ${EMAIL_FAILURES_TABLE} (email_key, failures, last_failure_at, clears_at) VALUES (?, 1, ?, ?)`,
          index.toString(16).padStart(64, "0"),
          T0 - MINUTE,
          clearsAt,
        );
      }
    });
  }

  function workOf(name: string) {
    return runInDurableObject(stubFor(name), (instance: Installation) => instance.signIn.lastWork());
  }

  it("leaves one attempt's work unchanged with 1,000 distinct live email rows", async () => {
    await seedEmailRows("prune-few", 10, T0 + 60 * MINUTE);
    await seedEmailRows("prune-many", 1000, T0 + 60 * MINUTE);
    for (const name of ["prune-few", "prune-many"]) await seedUser(name, "dana@acme.test");
    await attemptAt("prune-few", "dana@acme.test", T0);
    await attemptAt("prune-many", "dana@acme.test", T0);
    const [few, many] = [await workOf("prune-few"), await workOf("prune-many")];
    expect(many).toEqual(few);
    expect(many.rowsRead).toBeGreaterThan(0);
    expect(many.rowsRead).toBeLessThan(50);
  });

  it("deletes expired rows in bounded steps during attempts and completions", async () => {
    const name = "prune-expired";
    await seedEmailRows(name, 1000, T0 - 1);
    await attemptAt(name, "dana@acme.test", T0);
    expect((await countsOf(name)).byEmail).toHaveLength(1000 - PRUNE_BATCH + 1);
    expect((await workOf(name)).rowsWritten).toBeLessThan(PRUNE_BATCH * 5);
    const ticket = ticketOf(await attemptAt(name, "dana@acme.test", T0 + SECOND, { address: "198.51.100.77" }));
    await completeAt(name, ticket, "failure", T0 + SECOND);
    expect((await countsOf(name)).byEmail).toHaveLength(1000 - 3 * PRUNE_BATCH + 1);
  });

  it("removes expired sessions, tickets and failure rows of every kind", async () => {
    const name = "prune-kinds";
    await seedUser(name, "dana@acme.test");
    const { cookies } = await signInAt(name, "dana@acme.test", T0);
    await failTimes(name, "dana@acme.test", 1, T0 + SECOND, { cookies });
    await attemptAt(name, "dana@acme.test", T0 + 2 * SECOND, { address: "198.51.100.2" }); // a ticket left unused
    const later = T0 + SESSION_MAX_AGE_MS + BELOW_THRESHOLD_CLEAR_MS;
    await attemptAt(name, "someone@acme.test", later, { address: "198.51.100.9" });
    const counts = await countsOf(name);
    expect(counts.byEmail).toHaveLength(1);
    expect(counts.byMarker).toEqual([]);
    expect(counts.byAddress.map((row) => row.address)).toEqual(["198.51.100.9"]);
    expect(counts.tickets).toBe(1);
    expect(await sessionsOf(name)).toEqual([]);
  });
});

describe("the session read (D-4 as amended, V-18)", () => {
  it("answers the account, its name and the sign-in time for the cookie named with this identifier", async () => {
    const name = "session-read";
    const userId = await seedUser(name, "dana@acme.test");
    await seedSettings(name);
    const { cookies } = await signInAt(name, "dana@acme.test", T0);
    const identifier = await identifierOf(name);
    expect(await sessionInfoAt(name, cookies, T0 + SECOND)).toEqual({
      identifier,
      signedIn: true,
      account: { id: userId, name: "Dana Admin" },
      role: "administrator",
      signedInAt: new Date(T0).toISOString(),
      installationName: "Acme Security",
    });
  });

  it("is signed in just before 30 days after sign-in and not at 30 days", async () => {
    const name = "session-30-days";
    await seedUser(name, "dana@acme.test");
    const { cookies } = await signInAt(name, "dana@acme.test", T0);
    expect((await sessionInfoAt(name, cookies, T0 + SESSION_MAX_AGE_MS - 1)).signedIn).toBe(true);
    expect(await sessionInfoAt(name, cookies, T0 + SESSION_MAX_AGE_MS)).toMatchObject({ signedIn: false, clearSession: true });
  });

  it("is not signed in for a cookie that is ended, unknown, foreign or malformed, and flags its own dead cookie for clearing", async () => {
    const name = "session-not-signed-in";
    await seedUser(name, "dana@acme.test");
    await seedSettings(name);
    const identifier = await identifierOf(name);
    const own = sessionCookieName(identifier);
    const { cookies, done } = await signInAt(name, "dana@acme.test", T0);
    await runInDurableObject(stubFor(name), (instance: Installation) => instance.signIn.endSession(cookies));
    const cases: [Record<string, string>, boolean][] = [
      [{ [own]: done.sessionToken }, true], // ended
      [{ [own]: newSessionToken() }, true], // unknown
      [{ [own]: "not a token" }, true], // malformed
      [{ [own]: "" }, true],
      [{ [sessionCookieName("f".repeat(32))]: done.sessionToken }, false], // another installation's name
      [{}, false],
    ];
    for (const [presented, clearSession] of cases) {
      expect(await sessionInfoAt(name, presented, T0 + SECOND), JSON.stringify(presented)).toEqual({
        identifier,
        signedIn: false,
        installationName: "Acme Security",
        clearSession,
      });
    }
  });

  it("is not signed in once the account is inactive", async () => {
    const name = "session-inactive";
    await seedUser(name, "dana@acme.test");
    const { cookies } = await signInAt(name, "dana@acme.test", T0);
    await runInDurableObject(stubFor(name), (_instance, state) => void state.storage.sql.exec(`UPDATE ${USERS_TABLE} SET active = 0`));
    expect((await sessionInfoAt(name, cookies, T0 + SECOND)).signedIn).toBe(false);
  });

  it("writes nothing: last use, expired rows and every table stay as they were", async () => {
    const name = "session-read-only";
    await seedUser(name, "dana@acme.test");
    const { cookies } = await signInAt(name, "dana@acme.test", T0);
    await failTimes(name, "dana@acme.test", 1, T0 + SECOND);
    const everything = () =>
      runInDurableObject(stubFor(name), (_instance, state) =>
        SIGNIN_TABLES.map((table) => state.storage.sql.exec(`SELECT * FROM ${table} ORDER BY 1`).toArray()),
      );
    const before = await everything();
    // Long after everything expired: the read still deletes nothing.
    await sessionInfoAt(name, cookies, T0 + MINUTE);
    await sessionInfoAt(name, cookies, T0 + 2 * SESSION_MAX_AGE_MS);
    expect(await everything()).toEqual(before);
  });

  it("while set-up is open reports no installation name (E-11)", async () => {
    expect(await sessionInfoAt("session-setup-open", {}, T0)).toMatchObject({ signedIn: false, installationName: null });
  });
});

describe("ending a session (D-13)", () => {
  it("removes the row, and ending one already gone, or none, also succeeds", async () => {
    const name = "end-session";
    await seedUser(name, "dana@acme.test");
    const { cookies, done } = await signInAt(name, "dana@acme.test", T0);
    const end = (presented: Record<string, string>) => callObject(env.INSTALLATION, idFor(name), "endSession", { cookies: presented });
    expect(await end(cookies)).toEqual({ ok: true, value: { identifier: done.identifier, ended: true } });
    expect(await sessionsOf(name)).toEqual([]);
    expect(await end(cookies)).toEqual({ ok: true, value: { identifier: done.identifier, ended: false } });
    expect(await end({})).toEqual({ ok: true, value: { identifier: done.identifier, ended: false } });
    expect(await runInDurableObject(stubFor(name), (instance: Installation) => instance.signIn.endSessionByHash("0".repeat(64)))).toBe(false);
  });
});

describe("the sessions table (CAP-3, CAP-11, CA-47)", () => {
  it("holds a 64-hex token hash and no token after a completed sign-in", async () => {
    const name = "sessions-hash-only";
    await seedUser(name, "dana@acme.test");
    const { done } = await signInAt(name, "dana@acme.test", T0);
    const rows = await sessionsOf(name);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.token_hash).toMatch(/^[0-9a-f]{64}$/);
    const everything = await runInDurableObject(stubFor(name), (_instance, state) =>
      JSON.stringify(SIGNIN_TABLES.map((table) => state.storage.sql.exec(`SELECT * FROM ${table}`).toArray())),
    );
    expect(everything).not.toContain(done.sessionToken);
    expect(everything).not.toContain(done.marker);
  });

  it("gets a different token for each of two sign-ins", async () => {
    const name = "sessions-two-tokens";
    await seedUser(name, "dana@acme.test");
    const first = await signInAt(name, "dana@acme.test", T0);
    const second = await signInAt(name, "dana@acme.test", T0 + SECOND);
    expect(first.done.sessionToken).not.toBe(second.done.sessionToken);
    expect(await sessionsOf(name)).toHaveLength(2);
  });

  it("is changed only by completeSignIn, acceptInvitation, endSession and the bounded pruning; sessionInfo changes nothing", async () => {
    const name = "sessions-operations";
    const fingerprint = await setupCodeFingerprint("a-set-up-code-for-this-test");
    await seedUser(name, "dana@acme.test");
    await seedSettings(name);
    const live = await signInAt(name, "dana@acme.test", Date.now());
    const operations = await runInDurableObject(stubFor(name), (instance: Installation) => [...instance.ops.keys()].sort());
    expect(operations).toEqual([
      "acceptInvitation",
      "accountCheck",
      "completeSignIn",
      "confirmTwoStep",
      "createFirstAdministrator",
      "createInvitation",
      "deploymentKeyState",
      "endSession",
      "invitationInfo",
      "renewRecoveryCodes",
      "sessionInfo",
      "setupAttempt",
      "setupState",
      "signInAttempt",
      "startTwoStep",
      "status",
      "turnOffTwoStep",
      "twoStepState",
    ]);

    const call = (operation: string, input: unknown) => callObject(env.INSTALLATION, idFor(name), operation, input);
    const ticket = async () => {
      const attempt = await call("signInAttempt", { email: "dana@acme.test", address: "198.51.100.200", cookies: {} });
      if (!attempt.ok) throw new Error(attempt.body.error.code);
      return (attempt.value as SignInAttemptCounted).ticket;
    };
    const fixtures: Record<string, () => Promise<unknown>> = {
      status: async () => null,
      setupState: async () => null,
      setupAttempt: async () => ({ address: "198.51.100.201", fingerprint }),
      createFirstAdministrator: async () => ({ fingerprint, ticket: "b".repeat(64) }),
      signInAttempt: async () => ({ email: "dana@acme.test", address: "198.51.100.202", cookies: live.cookies }),
      sessionInfo: async () => ({ cookies: live.cookies }),
      completeSignIn: async () => ({ ticket: await ticket(), outcome: "success" }),
      endSession: async () => ({ cookies: live.cookies }),
      createInvitation: async () => ({ email: "invited@acme.test", name: "Invited Person", role: "standard", cookies: live.cookies }),
      invitationInfo: async () => ({ secretHash: "c".repeat(64) }),
      deploymentKeyState: async () => ({}),
      acceptInvitation: async () => {
        const created = await call("createInvitation", { email: "accepting@acme.test", name: "Accepting Person", role: "standard", cookies: live.cookies });
        if (!created.ok) throw new Error(created.body.error.code);
        const { secret } = created.value as InvitationCreated;
        const passwordHash = { algorithm: "scrypt", n: 131_072, r: 8, p: 1, keyLength: 32, salt: randomBase64(16), hash: randomBase64(32) };
        return { secretHash: await invitationSecretHash(secret), name: "Accepting Person", passwordHash, cookies: {} };
      },
      // Two-step verification (story 1.5, spec 2): none of these changes the sessions table (D-10).
      ...twoStepFixtures(call, () => live.cookies, newDeploymentKey()),
    };
    const changed: string[] = [];
    // The two-step operations in the order their fixtures need; endSession last, so the live session
    // is there for the others.
    const twoStepOperations: readonly string[] = TWO_STEP_OPERATIONS;
    const order = [...operations.filter((op) => op !== "endSession" && !twoStepOperations.includes(op)), ...TWO_STEP_OPERATIONS, "endSession"];
    expect([...order].sort()).toEqual(operations);
    for (const operation of order) {
      const input = await fixtures[operation]!();
      const before = await sessionsOf(name);
      const result = await call(operation, input);
      // Each two-step operation must succeed, so its success is what the sessions table is compared against.
      if (twoStepOperations.includes(operation)) expect(result.ok, `${operation}: ${result.ok ? "" : result.body.error.code}`).toBe(true);
      if (JSON.stringify(await sessionsOf(name)) !== JSON.stringify(before)) changed.push(operation);
    }
    expect(changed.sort()).toEqual(["acceptInvitation", "completeSignIn", "endSession"]);

    // The pruning: an attempt or a completion removes an expired session row; the read does not.
    const expiredHash = "e".repeat(64);
    await runInDurableObject(stubFor(name), (_instance, state) =>
      void state.storage.sql.exec(
        `INSERT INTO ${SESSIONS_TABLE} (token_hash, user_id, signed_in_at, last_used_at, expires_at) VALUES (?, 'x', 0, 0, ?)`,
        expiredHash,
        Date.now() - 1,
      ),
    );
    const hashes = async () => (await sessionsOf(name)).map((row) => row.token_hash);
    await call("sessionInfo", { cookies: live.cookies });
    expect(await hashes()).toContain(expiredHash);
    const beforeAttempt = (await hashes()).filter((hash) => hash !== expiredHash);
    await call("signInAttempt", { email: "dana@acme.test", address: "198.51.100.203", cookies: {} });
    expect(await hashes()).toEqual(beforeAttempt);

    // Sessions are only in the installation object: project rooms have no sessions table.
    const room = env.PROJECT_ROOM.get(env.PROJECT_ROOM.idFromName(name));
    const roomHasSessions = await runInDurableObject(room as unknown as DurableObjectStub<Installation>, (_instance, state) =>
      tableExists(state.storage.sql, SESSIONS_TABLE),
    );
    expect(roomHasSessions).toBe(false);
  });
});

describe("addresses and tickets kept in storage", () => {
  it("never hold an entered email, a token or a marker", async () => {
    const name = "storage-clean";
    await seedUser(name, "dana@acme.test");
    const { done, cookies } = await signInAt(name, "dana@acme.test", T0);
    await failTimes(name, "wrong.person@acme.test", 2, T0 + SECOND, { cookies });
    const text = await runInDurableObject(stubFor(name), (_instance, state) =>
      JSON.stringify([TICKETS_TABLE, ADDRESS_FAILURES_TABLE, EMAIL_FAILURES_TABLE, SESSIONS_TABLE].map((table) => state.storage.sql.exec(`SELECT * FROM ${table}`).toArray())),
    );
    expect(text).not.toContain("wrong.person");
    expect(text).not.toContain(done.sessionToken);
    expect(text).not.toContain(done.marker);
  });
});
