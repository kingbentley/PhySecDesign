import { env } from "cloudflare:workers";
import { evictDurableObject, runInDurableObject } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { markerCookieName } from "../server/auth/marker";
import { toBase64 } from "../server/auth/password";
import { newSessionToken, sessionCookieName, sessionTokenHash, sha256Hex } from "../server/auth/session";
import { setupCodeFingerprint } from "../server/auth/setupCode";
import type { Installation } from "../server/installation/Installation";
import {
  acceptInvitationInput,
  createInvitationInput,
  INVITATION_PRUNE_BATCH,
  INVITATIONS_TABLE,
  invitationSecretHash,
  type InvitationAccepted,
  type InvitationCreated,
} from "../server/installation/invitationStore";
import { SETTINGS_TABLE, USERS_TABLE } from "../server/installation/setupStore";
import { SESSIONS_TABLE, type SignInAttemptCounted, type SignInCompleted } from "../server/installation/signInStore";
import { callObject } from "../server/objects/call";
import { INVITATION_TTL_MS } from "../shared/invitation";
import { SESSION_MAX_AGE_MS } from "../shared/signin";
import { tableExists } from "./helpers";

// The installation object's invitation storage (story 1.4, spec 1): the I/O matrix's rows for
// creating, reading and accepting invitations, the 7-day boundary, replacement, single use under
// concurrent accepts, bounded pruning, the restart, the session read's role, and which operations
// change the invitations table and insert into users (CAP-1, CAP-2, CAP-5 to CAP-9 storage).

const SECOND = 1000;
const DAY = 24 * 60 * 60 * SECOND;
const T0 = Date.UTC(2026, 10, 21, 12, 0, 0);
const ADMIN_EMAIL = "dana@acme.test";

function idFor(name: string) {
  return env.INSTALLATION.idFromName(`invitation-store:${name}`);
}

function stubFor(name: string) {
  return env.INSTALLATION.get(idFor(name));
}

function randomBase64(bytes: number) {
  return toBase64(crypto.getRandomValues(new Uint8Array(bytes)));
}

function madeUpHash() {
  return { algorithm: "scrypt", n: 131_072, r: 8, p: 1, keyLength: 32, salt: randomBase64(16), hash: randomBase64(32) } as const;
}

async function seedUser(
  name: string,
  email: string,
  options: { userName?: string; role?: "administrator" | "standard"; active?: 0 | 1 } = {},
): Promise<string> {
  const id = crypto.randomUUID();
  await runInDurableObject(stubFor(name), (_instance, state) => {
    state.storage.sql.exec(
      `INSERT INTO ${USERS_TABLE} (id, email, name, role, active, password_algorithm, password_n, password_r, password_p,
         password_key_length, password_salt, password_hash, created_at)
       VALUES (?, ?, ?, ?, ?, 'scrypt', 131072, 8, 1, 32, ?, ?, ?)`,
      id,
      email,
      options.userName ?? "Dana Admin",
      options.role ?? "administrator",
      options.active ?? 1,
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

/** An installation with an administrator signed in. */
async function withAdministrator(name: string) {
  const adminId = await seedUser(name, ADMIN_EMAIL);
  const cookies = await sessionFor(name, adminId);
  return { adminId, cookies };
}

type Outcome<T> = { ok: true; value: T } | { ok: false; code: string; field?: string };

async function refusedOr<T>(run: () => Promise<T> | T): Promise<Outcome<T>> {
  try {
    return { ok: true, value: await run() };
  } catch (error) {
    const refusal = error as { code?: string; field?: string };
    if (!refusal.code) throw error;
    return refusal.field === undefined ? { ok: false, code: refusal.code } : { ok: false, code: refusal.code, field: refusal.field };
  }
}

function createAt(name: string, raw: { email: string; name?: string; role?: string; cookies: Record<string, string> }, now: number) {
  const input = createInvitationInput.parse({ name: "Sam Person", role: "standard", ...raw });
  return runInDurableObject(stubFor(name), (instance: Installation) => refusedOr(() => instance.invitations.createInvitation(input, now)));
}

async function created(name: string, raw: Parameters<typeof createAt>[1], now: number): Promise<InvitationCreated & { secretHash: string }> {
  const outcome = await createAt(name, raw, now);
  if (!outcome.ok) throw new Error(`create refused: ${outcome.code}`);
  return { ...outcome.value, secretHash: await invitationSecretHash(outcome.value.secret) };
}

function infoAt(name: string, secretHash: string, now: number) {
  return runInDurableObject(stubFor(name), (instance: Installation) => refusedOr(() => instance.invitations.invitationInfo(secretHash, now)));
}

function acceptAt(name: string, raw: { secretHash: string; name?: string; cookies?: Record<string, string> }, now: number, passwordHash = madeUpHash()) {
  const input = acceptInvitationInput.parse({ name: "Sam Person", cookies: {}, passwordHash, ...raw });
  return runInDurableObject(stubFor(name), (instance: Installation) => refusedOr(() => instance.invitations.acceptInvitation(input, now)));
}

function accepted(outcome: Outcome<InvitationAccepted>): InvitationAccepted {
  if (!outcome.ok) throw new Error(`accept refused: ${outcome.code}`);
  return outcome.value;
}

function invitationRows(name: string) {
  return runInDurableObject(stubFor(name), (_instance, state) => state.storage.sql.exec(`SELECT * FROM ${INVITATIONS_TABLE} ORDER BY email`).toArray());
}

function usersOf(name: string) {
  return runInDurableObject(stubFor(name), (_instance, state) => state.storage.sql.exec(`SELECT * FROM ${USERS_TABLE} ORDER BY email`).toArray());
}

function sessionsOf(name: string) {
  return runInDurableObject(stubFor(name), (_instance, state) => state.storage.sql.exec(`SELECT * FROM ${SESSIONS_TABLE} ORDER BY token_hash`).toArray());
}

/** Everything a refused call could have written. */
async function snapshot(name: string) {
  return { invitations: await invitationRows(name), users: await usersOf(name), sessions: await sessionsOf(name) };
}

function sessionInfoAt(name: string, cookies: Record<string, string>, now: number) {
  return runInDurableObject(stubFor(name), (instance: Installation) => instance.signIn.sessionInfo(cookies, now));
}

describe("the invitations table", () => {
  it("is created with the object, with an index on the expiry", async () => {
    const found = await runInDurableObject(stubFor("table"), (_instance, state) => ({
      table: tableExists(state.storage.sql, INVITATIONS_TABLE),
      index: state.storage.sql.exec("SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'invitations_expires_at'").toArray().length,
    }));
    expect(found).toEqual({ table: true, index: 1 });
  });
});

describe("creating an invitation", () => {
  it("for a signed-in administrator stores the secret's hash, email, name, role, inviter, issue and expiry, and answers the secret once", async () => {
    const name = "create";
    const { adminId, cookies } = await withAdministrator(name);
    const outcome = await createAt(name, { email: "  Sam@Acme.TEST ", name: " Sam Person ", role: "standard", cookies }, T0);
    expect(outcome.ok).toBe(true);
    const value = (outcome as { value: InvitationCreated }).value;
    expect(value).toEqual({
      secret: expect.stringMatching(/^[A-Za-z0-9_-]{43}$/),
      expiresAt: new Date(T0 + 7 * DAY).toISOString(),
      publicAddress: "https://survey.acme.test",
    });
    // 43 base64url characters are 32 bytes.
    const decoded = atob(value.secret.replace(/-/g, "+").replace(/_/g, "/") + "=");
    expect(decoded.length).toBe(32);

    const rows = await invitationRows(name);
    expect(rows).toEqual([
      {
        secret_hash: await sha256Hex(value.secret),
        email: "sam@acme.test",
        name: "Sam Person",
        role: "standard",
        inviter_id: adminId,
        issued_at: T0,
        expires_at: T0 + INVITATION_TTL_MS,
      },
    ]);
    expect(rows[0]!.secret_hash).toMatch(/^[0-9a-f]{64}$/);
    // No column holds the secret (criterion 7, CA-55).
    expect(Object.values(rows[0]!)).not.toContain(value.secret);
    expect(JSON.stringify(rows)).not.toContain(value.secret);
  });

  it("gives a different secret each time", async () => {
    const name = "create-distinct";
    const { cookies } = await withAdministrator(name);
    const first = await created(name, { email: "a@acme.test", cookies }, T0);
    const second = await created(name, { email: "b@acme.test", cookies }, T0);
    expect(first.secret).not.toBe(second.secret);
  });

  it("for an active standard account's live session is refused administrator_only and writes nothing (criterion 14)", async () => {
    const name = "create-standard";
    await seedUser(name, ADMIN_EMAIL);
    const standardId = await seedUser(name, "sam@acme.test", { userName: "Sam Standard", role: "standard" });
    const cookies = await sessionFor(name, standardId);
    const before = await snapshot(name);
    expect(await createAt(name, { email: "new@acme.test", cookies }, T0 + SECOND)).toEqual({ ok: false, code: "administrator_only" });
    expect(await snapshot(name)).toEqual(before);
  });

  it("for an inactive administrator's session is refused not_signed_in and writes nothing (review finding 9)", async () => {
    const name = "create-inactive";
    const { cookies } = await withAdministrator(name);
    await runInDurableObject(stubFor(name), (_instance, state) => void state.storage.sql.exec(`UPDATE ${USERS_TABLE} SET active = 0`));
    const before = await snapshot(name);
    expect(await createAt(name, { email: "new@acme.test", cookies }, T0 + SECOND)).toEqual({ ok: false, code: "not_signed_in" });
    expect(await snapshot(name)).toEqual(before);
  });

  it("with no live session is refused not_signed_in and writes nothing", async () => {
    const name = "create-no-session";
    const { adminId, cookies } = await withAdministrator(name);
    const identifier = await identifierOf(name);
    const own = sessionCookieName(identifier);
    const ended = await sessionFor(name, adminId);
    await runInDurableObject(stubFor(name), (instance: Installation) => instance.signIn.endSession(ended));
    const expired = await sessionFor(name, adminId, T0 - SESSION_MAX_AGE_MS);
    const cases: [string, Record<string, string>][] = [
      ["none", {}],
      ["ended", ended],
      ["expired", expired],
      ["unknown", { [own]: newSessionToken() }],
      ["malformed", { [own]: "not a token" }],
      ["foreign name", { [sessionCookieName("f".repeat(32))]: cookies[own]! }],
      ["marker only", { [markerCookieName(identifier)]: cookies[own]! }],
    ];
    const before = await snapshot(name);
    for (const [label, presented] of cases) {
      expect(await createAt(name, { email: "new@acme.test", cookies: presented }, T0 + SECOND), label).toEqual({ ok: false, code: "not_signed_in" });
    }
    expect(await snapshot(name)).toEqual(before);
    // The live session itself still works.
    expect((await createAt(name, { email: "new@acme.test", cookies }, T0 + SECOND)).ok).toBe(true);
  });

  it("for an email with an account, after trim and lower case, is refused invitation_email_taken naming the field, writing nothing (CA-10)", async () => {
    const name = "create-email-taken";
    const { cookies } = await withAdministrator(name);
    await seedUser(name, "gone@acme.test", { userName: "Gone Person", role: "standard", active: 0 });
    const before = await snapshot(name);
    for (const email of ["  DANA@acme.TEST ", ADMIN_EMAIL, "gone@acme.test"]) {
      expect(await createAt(name, { email, cookies }, T0 + SECOND), email).toEqual({ ok: false, code: "invitation_email_taken", field: "email" });
    }
    expect(await snapshot(name)).toEqual(before);

    // Through the object's call: the refusal names the field and never the email.
    const refused = await callObject(env.INSTALLATION, idFor(name), "createInvitation", { email: ADMIN_EMAIL, name: "Dana Again", role: "standard", cookies });
    expect(refused.ok ? null : { status: refused.status, body: refused.body }).toEqual({
      status: 409,
      body: { error: { code: "invitation_email_taken", message: "That email already has an account.", field: "email" } },
    });
    expect(JSON.stringify(refused)).not.toContain("dana@");
  });

  it("for an email differing from an account's only in Unicode form is created (story 1.3's D-15)", async () => {
    const name = "create-unicode";
    const { cookies } = await withAdministrator(name);
    const nfc = "jos\u00e9@acme.test";
    const nfd = "jose\u0301@acme.test";
    expect(nfc).not.toBe(nfd);
    await seedUser(name, nfc, { userName: "José", role: "standard" });
    const outcome = await createAt(name, { email: nfd, cookies }, T0 + SECOND);
    expect(outcome.ok).toBe(true);
    expect((await invitationRows(name)).map((row) => row.email)).toEqual([nfd]);
  });

  it("for an email with a pending invitation replaces it: the earlier hash is unusable, the new one live (criterion 13, CA-10)", async () => {
    const name = "create-replace";
    const { cookies } = await withAdministrator(name);
    const first = await created(name, { email: "sam@acme.test", name: "Sam First", cookies }, T0);
    const second = await created(name, { email: " SAM@acme.test", name: "Sam Second", role: "administrator", cookies }, T0 + SECOND);
    const rows = await invitationRows(name);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ secret_hash: second.secretHash, name: "Sam Second", role: "administrator", issued_at: T0 + SECOND });
    expect(await infoAt(name, first.secretHash, T0 + 2 * SECOND)).toEqual({ ok: false, code: "invitation_unusable" });
    expect((await infoAt(name, second.secretHash, T0 + 2 * SECOND)).ok).toBe(true);
    expect((await acceptAt(name, { secretHash: first.secretHash }, T0 + 2 * SECOND)).ok).toBe(false);
  });

  it("for an email whose earlier invitation expired and was not pruned is created (review finding 12)", async () => {
    const name = "create-after-expiry";
    const { cookies } = await withAdministrator(name);
    const first = await created(name, { email: "sam@acme.test", cookies }, T0);
    const later = T0 + 8 * DAY;
    // The expired row is still there: only creates and accepts prune.
    expect((await invitationRows(name)).map((row) => row.secret_hash)).toEqual([first.secretHash]);
    const second = await created(name, { email: "sam@acme.test", cookies: await sessionFor(name, (await usersOf(name))[0]!.id as string, later) }, later);
    expect((await invitationRows(name)).map((row) => row.secret_hash)).toEqual([second.secretHash]);
    expect((await infoAt(name, second.secretHash, later + SECOND)).ok).toBe(true);
  });
});

describe("reading an invitation", () => {
  it("answers the inviter's current name, the installation's name, the email, the suggested name and the role (D-10)", async () => {
    const name = "read";
    const { cookies } = await withAdministrator(name);
    const invitation = await created(name, { email: "sam@acme.test", name: "Sam Person", role: "administrator", cookies }, T0);
    expect(await infoAt(name, invitation.secretHash, T0 + SECOND)).toEqual({
      ok: true,
      value: { inviterName: "Dana Admin", installationName: "Acme Security", email: "sam@acme.test", name: "Sam Person", role: "administrator" },
    });
  });

  it("answers the inviter's changed name after a rename (D-10, review finding 16)", async () => {
    const name = "read-rename";
    const { adminId, cookies } = await withAdministrator(name);
    const invitation = await created(name, { email: "sam@acme.test", cookies }, T0);
    await runInDurableObject(stubFor(name), (_instance, state) => void state.storage.sql.exec(`UPDATE ${USERS_TABLE} SET name = 'Dana Renamed' WHERE id = ?`, adminId));
    expect(await infoAt(name, invitation.secretHash, T0 + SECOND)).toMatchObject({ ok: true, value: { inviterName: "Dana Renamed" } });
  });

  it("is live just before 7 days and unusable at and after 7 days (criterion 15, CA-09)", async () => {
    const name = "read-expiry";
    const { cookies } = await withAdministrator(name);
    const invitation = await created(name, { email: "sam@acme.test", cookies }, T0);
    expect((await infoAt(name, invitation.secretHash, T0 + 7 * DAY - 1)).ok).toBe(true);
    expect(await infoAt(name, invitation.secretHash, T0 + 7 * DAY)).toEqual({ ok: false, code: "invitation_unusable" });
    expect(await infoAt(name, invitation.secretHash, T0 + 8 * DAY)).toEqual({ ok: false, code: "invitation_unusable" });
    // Accepting follows the same boundary.
    const before = await snapshot(name);
    expect(await acceptAt(name, { secretHash: invitation.secretHash }, T0 + 7 * DAY)).toEqual({ ok: false, code: "invitation_unusable" });
    expect(await snapshot(name)).toEqual(before);
    expect((await acceptAt(name, { secretHash: invitation.secretHash }, T0 + 7 * DAY - 1)).ok).toBe(true);
  });

  it("is unusable for an unknown or used hash, and writes nothing, even long after everything expired", async () => {
    const name = "read-unusable";
    const { cookies } = await withAdministrator(name);
    const used = await created(name, { email: "used@acme.test", cookies }, T0);
    accepted(await acceptAt(name, { secretHash: used.secretHash }, T0 + SECOND));
    // An invitation that has expired by the last read below, which a read must not prune.
    await created(name, { email: "expired@acme.test", cookies }, T0);
    const before = await snapshot(name);
    for (const hash of ["0".repeat(64), used.secretHash, await sha256Hex("not a secret")]) {
      expect(await infoAt(name, hash, T0 + 2 * SECOND)).toEqual({ ok: false, code: "invitation_unusable" });
    }
    await infoAt(name, "0".repeat(64), T0 + 30 * DAY);
    expect(await snapshot(name)).toEqual(before);
  });

  it("refuses a hash that is not 64 hex digits as invalid input, through the object's call", async () => {
    const name = "read-invalid";
    for (const secretHash of ["", "A".repeat(64), "a".repeat(63), "the secret itself"]) {
      const result = await callObject(env.INSTALLATION, idFor(name), "invitationInfo", { secretHash });
      expect(result.ok ? null : result.body.error.code).toBe("invalid_input");
      expect(JSON.stringify(result)).not.toContain("the secret itself");
    }
  });
});

describe("accepting an invitation", () => {
  it("inserts the account with the invitation's email and role and the given name and hash, consumes the invitation and starts a session", async () => {
    const name = "accept";
    const { adminId, cookies } = await withAdministrator(name);
    const invitation = await created(name, { email: "sam@acme.test", name: "Sam Suggested", role: "standard", cookies }, T0);
    const passwordHash = madeUpHash();
    const now = T0 + DAY;
    const done = accepted(await acceptAt(name, { secretHash: invitation.secretHash, name: " Sam Chosen " }, now, passwordHash));
    const identifier = await identifierOf(name);
    expect(done).toEqual({
      identifier,
      sessionToken: expect.stringMatching(/^[A-Za-z0-9_-]{43}$/),
      marker: expect.any(String),
      account: { id: expect.stringMatching(/^[0-9a-f-]{36}$/), name: "Sam Chosen", role: "standard" },
      signedInAt: new Date(now).toISOString(),
    });

    const user = (await usersOf(name)).find((row) => row.email === "sam@acme.test");
    expect(user).toEqual({
      id: done.account.id,
      email: "sam@acme.test",
      name: "Sam Chosen",
      role: "standard",
      active: 1,
      password_algorithm: "scrypt",
      password_n: 131_072,
      password_r: 8,
      password_p: 1,
      password_key_length: 32,
      password_salt: passwordHash.salt,
      password_hash: passwordHash.hash,
      created_at: new Date(now).toISOString(),
    });
    expect(await invitationRows(name)).toEqual([]);

    // The new session is stored by hash, with sign-in and last use at now; the administrator's is untouched.
    const sessions = await sessionsOf(name);
    expect(sessions).toHaveLength(2);
    expect(sessions).toContainEqual({
      token_hash: await sessionTokenHash(done.sessionToken),
      user_id: done.account.id,
      signed_in_at: now,
      last_used_at: now,
      expires_at: now + SESSION_MAX_AGE_MS,
    });
    expect(JSON.stringify(sessions)).not.toContain(done.sessionToken);
    expect(sessions.some((row) => row.user_id === adminId)).toBe(true);

    // The marker is for the new account.
    expect(done.marker.split(".")[1]).toBe(done.account.id);

    // The session read answers the new account with its role (CAP-9).
    const newCookies = { [sessionCookieName(identifier)]: done.sessionToken };
    expect(await sessionInfoAt(name, newCookies, now + SECOND)).toEqual({
      identifier,
      signedIn: true,
      account: { id: done.account.id, name: "Sam Chosen" },
      role: "standard",
      signedInAt: new Date(now).toISOString(),
      installationName: "Acme Security",
    });
  });

  it("of an administrator invitation makes an administrator, whom the session read answers as one (review finding 14)", async () => {
    const name = "accept-administrator";
    const { cookies } = await withAdministrator(name);
    const invitation = await created(name, { email: "second.admin@acme.test", role: "administrator", cookies }, T0);
    const done = accepted(await acceptAt(name, { secretHash: invitation.secretHash }, T0 + SECOND));
    expect(done.account.role).toBe("administrator");
    expect((await usersOf(name)).find((row) => row.id === done.account.id)?.role).toBe("administrator");
    const info = await sessionInfoAt(name, { [sessionCookieName(done.identifier)]: done.sessionToken }, T0 + 2 * SECOND);
    expect(info).toMatchObject({ signedIn: true, role: "administrator" });
    // And the new administrator can invite in turn.
    expect((await createAt(name, { email: "third@acme.test", cookies: { [sessionCookieName(done.identifier)]: done.sessionToken } }, T0 + 2 * SECOND)).ok).toBe(true);
  });

  it("twice with the same hash is refused the second time and writes nothing (criterion 10)", async () => {
    const name = "accept-twice";
    const { cookies } = await withAdministrator(name);
    const invitation = await created(name, { email: "sam@acme.test", cookies }, T0);
    accepted(await acceptAt(name, { secretHash: invitation.secretHash }, T0 + SECOND));
    const before = await snapshot(name);
    expect(await acceptAt(name, { secretHash: invitation.secretHash, name: "Someone Else" }, T0 + 2 * SECOND)).toEqual({ ok: false, code: "invitation_unusable" });
    expect(await snapshot(name)).toEqual(before);
  });

  it("twice at once creates one account and one session; the other is refused (criterion 10)", async () => {
    const name = "accept-at-once";
    const { cookies } = await withAdministrator(name);
    const invitation = await created(name, { email: "sam@acme.test", cookies }, Date.now());
    const input = { secretHash: invitation.secretHash, name: "Sam Person", cookies: {} };
    const results = await Promise.all([
      callObject(env.INSTALLATION, idFor(name), "acceptInvitation", { ...input, passwordHash: madeUpHash() }),
      callObject(env.INSTALLATION, idFor(name), "acceptInvitation", { ...input, passwordHash: madeUpHash() }),
    ]);
    expect(results.filter((result) => result.ok)).toHaveLength(1);
    const refused = results.find((result) => !result.ok);
    expect(refused && !refused.ok ? { status: refused.status, code: refused.body.error.code } : null).toEqual({ status: 410, code: "invitation_unusable" });
    const users = (await usersOf(name)).filter((row) => row.email === "sam@acme.test");
    expect(users).toHaveLength(1);
    expect((await sessionsOf(name)).filter((row) => row.user_id === users[0]!.id)).toHaveLength(1);
    expect(await invitationRows(name)).toEqual([]);
  });

  it("while signed in as another account ends that session and starts one for the new account, with a fresh marker (D-4)", async () => {
    const name = "accept-signed-in";
    const { adminId, cookies } = await withAdministrator(name);
    const identifier = await identifierOf(name);
    const invitation = await created(name, { email: "sam@acme.test", cookies }, T0);
    // A validly signed marker for the administrator, so reusing its id would be visible.
    const presentedMarker = await runInDurableObject(stubFor(name), async (instance: Installation) =>
      instance.signIn.sessionMarker(await instance.signIn.prepareSession(), adminId, "a".repeat(32), T0),
    );
    const done = accepted(
      await acceptAt(name, { secretHash: invitation.secretHash, cookies: { ...cookies, [markerCookieName(identifier)]: presentedMarker } }, T0 + SECOND),
    );
    const sessions = await sessionsOf(name);
    expect(sessions.map((row) => row.user_id)).toEqual([done.account.id]);
    expect(await sessionInfoAt(name, cookies, T0 + 2 * SECOND)).toMatchObject({ signedIn: false, clearSession: true });
    expect(done.marker.split(".")[2]).not.toBe("a".repeat(32));
    expect(done.marker.split(".")[2]).toMatch(/^[0-9a-f]{32}$/);
  });

  it("leaves another installation's session alone", async () => {
    const name = "accept-foreign-session";
    const { cookies } = await withAdministrator(name);
    const invitation = await created(name, { email: "sam@acme.test", cookies }, T0);
    const own = sessionCookieName(await identifierOf(name));
    const foreign = { [sessionCookieName("f".repeat(32))]: cookies[own]! };
    accepted(await acceptAt(name, { secretHash: invitation.secretHash, cookies: foreign }, T0 + SECOND));
    expect((await sessionInfoAt(name, cookies, T0 + 2 * SECOND)).signedIn).toBe(true);
  });

  it("is refused invitation_email_taken when an account with the email appeared meanwhile, writing nothing", async () => {
    const name = "accept-email-taken";
    const { cookies } = await withAdministrator(name);
    const invitation = await created(name, { email: "sam@acme.test", cookies }, T0);
    expect((await infoAt(name, invitation.secretHash, T0 + SECOND)).ok).toBe(true);
    // A test-only insert between the read and the accept.
    await seedUser(name, "sam@acme.test", { userName: "Sam Elsewhere", role: "standard" });
    const before = await snapshot(name);
    expect(await acceptAt(name, { secretHash: invitation.secretHash }, T0 + 2 * SECOND)).toEqual({ ok: false, code: "invitation_email_taken", field: "email" });
    expect(await snapshot(name)).toEqual(before);
  });

  it("refuses a password hash with other scrypt parameters as invalid input (review finding 10)", async () => {
    const name = "accept-parameters";
    const { cookies } = await withAdministrator(name);
    const invitation = await created(name, { email: "sam@acme.test", cookies }, Date.now());
    const before = await snapshot(name);
    for (const [field, value] of [
      ["n", 16_384],
      ["algorithm", "pbkdf2"],
      ["salt", randomBase64(8)],
      ["hash", randomBase64(16)],
    ] as const) {
      const result = await callObject(env.INSTALLATION, idFor(name), "acceptInvitation", {
        secretHash: invitation.secretHash,
        name: "Sam Person",
        cookies: {},
        passwordHash: { ...madeUpHash(), [field]: value },
      });
      expect(result.ok ? null : result.body.error, field).toEqual(expect.objectContaining({ code: "invalid_input", field: `passwordHash.${field}` }));
    }
    expect(await snapshot(name)).toEqual(before);
  });
});

describe("pruning expired invitations (A-14)", () => {
  async function seedExpired(name: string, count: number, inviterId: string) {
    await runInDurableObject(stubFor(name), (_instance, state) => {
      for (let index = 0; index < count; index += 1) {
        state.storage.sql.exec(
          `INSERT INTO ${INVITATIONS_TABLE} (secret_hash, email, name, role, inviter_id, issued_at, expires_at) VALUES (?, ?, 'Old', 'standard', ?, ?, ?)`,
          index.toString(16).padStart(64, "0"),
          `old${index}@acme.test`,
          inviterId,
          T0 - 8 * DAY,
          T0 - DAY + index,
        );
      }
    });
  }

  const count = async (name: string) => (await invitationRows(name)).length;

  it("removes at most 20 expired rows per create or accept, and none per read", async () => {
    const name = "prune";
    const { adminId, cookies } = await withAdministrator(name);
    await seedExpired(name, 50, adminId);
    expect(await count(name)).toBe(50);

    await infoAt(name, "0".repeat(64), T0);
    expect(await count(name)).toBe(50);

    const invitation = await created(name, { email: "sam@acme.test", cookies }, T0);
    expect(await count(name)).toBe(50 - INVITATION_PRUNE_BATCH + 1);
    expect(INVITATION_PRUNE_BATCH).toBe(20);
    // The oldest expiries went first: the seeded rows left are indices 20 to 49, plus the new one.
    const seededHash = (index: number) => index.toString(16).padStart(64, "0");
    expect(new Set((await invitationRows(name)).map((row) => row.secret_hash))).toEqual(
      new Set([...Array.from({ length: 30 }, (_, offset) => seededHash(20 + offset)), invitation.secretHash]),
    );

    await infoAt(name, invitation.secretHash, T0 + SECOND);
    expect(await count(name)).toBe(50 - INVITATION_PRUNE_BATCH + 1);

    accepted(await acceptAt(name, { secretHash: invitation.secretHash }, T0 + SECOND));
    expect(await count(name)).toBe(50 - 2 * INVITATION_PRUNE_BATCH);

    // The live invitations are never pruned.
    const live = await created(name, { email: "pat@acme.test", cookies }, T0 + 2 * SECOND);
    expect(await count(name)).toBe(1);
    expect((await invitationRows(name)).map((row) => row.secret_hash)).toEqual([live.secretHash]);
  });

  it("is undone with a refused create", async () => {
    const name = "prune-refused";
    const { adminId } = await withAdministrator(name);
    await seedExpired(name, 30, adminId);
    expect(await createAt(name, { email: "sam@acme.test", cookies: {} }, T0)).toEqual({ ok: false, code: "not_signed_in" });
    expect(await count(name)).toBe(30);
  });
});

describe("a restart", () => {
  it("leaves an invitation live with the same expiry", async () => {
    const name = "restart";
    const { cookies } = await withAdministrator(name);
    const invitation = await created(name, { email: "sam@acme.test", cookies }, T0);
    const before = await invitationRows(name);
    await evictDurableObject(stubFor(name));
    expect(await invitationRows(name)).toEqual(before);
    expect((await infoAt(name, invitation.secretHash, T0 + 7 * DAY - 1)).ok).toBe(true);
    expect((await infoAt(name, invitation.secretHash, T0 + 7 * DAY)).ok).toBe(false);
  });
});

describe("the installation object's operations (criteria 8 and 16, standing rule 9)", () => {
  it("change the invitations table only in createInvitation and acceptInvitation, and insert into users only in createFirstAdministrator and acceptInvitation", async () => {
    const name = "operations";
    const fingerprint = await setupCodeFingerprint("an-invitation-sweep-code");
    const call = (operation: string, input: unknown) => callObject(env.INSTALLATION, idFor(name), operation, input);
    const results = new Map<string, Awaited<ReturnType<typeof call>>>();
    const value = <T>(operation: string): T => {
      const result = results.get(operation);
      if (!result?.ok) throw new Error(`${operation} did not succeed`);
      return result.value as T;
    };
    const sessionCookies = () => {
      const done = value<SignInCompleted>("completeSignIn");
      return { [sessionCookieName(done.identifier)]: done.sessionToken };
    };
    const ticketFor = async (operation: string, input: unknown) => {
      const result = await call(operation, input);
      if (!result.ok) throw new Error(`${operation}: ${result.body.error.code}`);
      return (result.value as { ticket: string }).ticket;
    };
    const liveHash = async (email: string) => {
      const result = await call("createInvitation", { email, name: "Fixture Person", role: "standard", cookies: sessionCookies() });
      if (!result.ok) throw new Error(result.body.error.code);
      return invitationSecretHash((result.value as InvitationCreated).secret);
    };

    // In an order that lets each fixture use what the earlier operations made; endSession last.
    const fixtures: [string, () => Promise<unknown>][] = [
      ["status", async () => null],
      ["setupState", async () => null],
      ["setupAttempt", async () => ({ address: "198.51.100.1", fingerprint })],
      [
        "createFirstAdministrator",
        async () => ({
          fingerprint,
          ticket: await ticketFor("setupAttempt", { address: "198.51.100.2", fingerprint }),
          installationName: "Acme Security",
          publicAddress: "https://survey.acme.test",
          name: "Dana Admin",
          email: ADMIN_EMAIL,
          passwordHash: madeUpHash(),
        }),
      ],
      ["signInAttempt", async () => ({ email: ADMIN_EMAIL, address: "198.51.100.3", cookies: {} })],
      [
        "completeSignIn",
        async () => ({ ticket: (await call("signInAttempt", { email: ADMIN_EMAIL, address: "198.51.100.4", cookies: {} }).then((r) => (r.ok ? (r.value as SignInAttemptCounted).ticket : ""))), outcome: "success" }),
      ],
      ["sessionInfo", async () => ({ cookies: sessionCookies() })],
      ["createInvitation", async () => ({ email: "invited@acme.test", name: "Invited Person", role: "standard", cookies: sessionCookies() })],
      ["invitationInfo", async () => ({ secretHash: await liveHash("read@acme.test") })],
      ["acceptInvitation", async () => ({ secretHash: await liveHash("accept@acme.test"), name: "Accepting Person", passwordHash: madeUpHash(), cookies: {} })],
      ["endSession", async () => ({ cookies: sessionCookies() })],
    ];
    const operations = await runInDurableObject(stubFor(name), (instance: Installation) => [...instance.ops.keys()].sort());
    expect(fixtures.map(([operation]) => operation).sort()).toEqual(operations);

    const changedInvitations: string[] = [];
    const insertedUsers: string[] = [];
    for (const [operation, fixture] of fixtures) {
      const input = await fixture();
      const before = { invitations: JSON.stringify(await invitationRows(name)), users: (await usersOf(name)).length };
      const result = await call(operation, input);
      expect(result.ok, `${operation}: ${result.ok ? "" : result.body.error.code}`).toBe(true);
      results.set(operation, result);
      if (JSON.stringify(await invitationRows(name)) !== before.invitations) changedInvitations.push(operation);
      if ((await usersOf(name)).length > before.users) insertedUsers.push(operation);
    }
    expect(changedInvitations.sort()).toEqual(["acceptInvitation", "createInvitation"]);
    expect(insertedUsers.sort()).toEqual(["acceptInvitation", "createFirstAdministrator"]);

    // Invitations are only in the installation object: project rooms have no invitations table.
    const room = env.PROJECT_ROOM.get(env.PROJECT_ROOM.idFromName(name));
    const roomHasInvitations = await runInDurableObject(room as unknown as DurableObjectStub<Installation>, (_instance, state) =>
      tableExists(state.storage.sql, INVITATIONS_TABLE),
    );
    expect(roomHasInvitations).toBe(false);
  });
});
