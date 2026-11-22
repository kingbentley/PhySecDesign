import { z } from "zod";
import { normaliseEmail } from "../../shared/setup";
import {
  ADDRESS_FREE_FAILURES,
  addressHeldUntil,
  addressWaitMs,
  emailClearsAt,
  emailWaitMs,
  markerClearsAt,
  markerWaitMs,
  secondsLeft,
  SESSION_MAX_AGE_MS,
  signInEmailField,
  SIGNIN_TICKET_TTL_MS,
} from "../../shared/signin";
import { normaliseCode, normaliseRecoveryCode, PENDING_SIGNIN_TTL_MS, RECOVERY_CODE_FIELD_MAX_LENGTH } from "../../shared/twoStep";
import { HMAC_KEY_BYTES, hmacHex, importHmacKey, makeMarker, markerCookieName, newMarkerId, readMarker, type Marker } from "../auth/marker";
import { fromBase64, PASSWORD_HASH_ALGORITHM, toBase64, type PasswordHash } from "../auth/password";
import {
  isWellFormedToken,
  MAX_COOKIE_NAME,
  MAX_COOKIE_VALUE,
  MAX_PASSED_COOKIES,
  newSessionToken,
  pendingCookieName,
  randomHex,
  sessionCookieName,
  sessionTokenHash,
  sha256Hex,
  TOKEN_HASH_PATTERN,
} from "../auth/session";
import { matchingStep } from "../auth/totp";
import { UNKNOWN_ADDRESS } from "../api/clientAddress";
import { OperationRefusal } from "../objects/ObjectBase";
import { deploymentKeyField } from "./keyGuard";
import { SETTINGS_TABLE, USERS_TABLE } from "./setupStore";

// Sign-in storage in the installation object (story 1.3): sessions, the failure counts by email
// key, by known address and by marker, the one-time sign-in tickets, and the identity row holding
// the installation's identifier and the two HMAC keys. Tables are created if absent under data
// format 1 (standing rule 8). `users` and `settings` are read here, never changed.
//
// An attempt (CA-43, D-2 as amended, D-11):
// - The Worker asks `attempt` before checking any password. Cryptography that needs no storage
//   (the email key, the presented session's hash, the marker's signature) is done first; then one
//   synchronous step, with no await, reads the counts, refuses with a wait or raises every count,
//   and issues the ticket. Attempts sent at once are therefore counted one after another, so of 25
//   for one email, 5 get tickets and 20 the wait.
// - The email's count is keyed by HMAC-SHA-256 of the normalised email under a random key kept
//   here (A-13); an unknown email is counted exactly like a known one (CA-43).
// - A valid marker for the entered email's account skips the email's wait, not its count; it has
//   its own count with the email's rules, and while that count waits the marker is ignored.
// - A known address's failures are separate rows, so a success removes exactly its own attempt.
//   An unknown address raises no count and meets no wait (D-11).
// - The answer is the stored hash, or a stand-in signal for an unknown email or inactive account,
//   with the installation's identifier and the ticket, in the same shape either way.
//
// The ticket (A-1, E-22, D-5 amended) lasts 5 minutes and records inside the object the account
// (or none, for the stand-in), the email key, the address failure row (or none), the marker
// identifier if a valid one was presented, the stored hash's identity (its salt and value together)
// and the hash of the session the browser presented. Completion takes
// only the ticket and the outcome. Every fault (missing, reused, expired, stand-in, account changed
// or made inactive) is `signin_failed`, and only a correct completion writes a session.
//
// Sessions (D-4 as amended): the table holds the token's SHA-256, never the token, the sign-in time,
// the last use (set at sign-in only in this story) and the expiry, 30 days after sign-in. The
// session read writes nothing. Accepting an invitation (story 1.4, invitationStore.ts) starts a
// session through the same helpers as a completed sign-in.
//
// The second sign-in step (story 1.5, spec 3: D-3, D-4, D-6, D-13, D-15, CA-46, CA-47). For an
// active account with two-step verification on, a correct completion writes no session: in the
// step that consumes the ticket it writes a pending row carrying the ticket's bindings, keyed by the
// SHA-256 of a new 32-byte pending token, for 5 minutes, clears no count, and answers the token.
// `secondStep` then checks a code or a recovery code under the same counts and waits as a password
// (CA-15) and, when right, starts the session as a completed sign-in does. A sign-in attempt
// deletes the pending row of the pending cookie it presents, before its wait check (D-3). The
// two-step rows are reached through `TwoStepAccess`, which the two-step store implements and the
// installation object attaches, so this module imports nothing at run time from twoStepStore.ts.
//
// Pruning (A-14, E-17): every row kind has an indexed expiry or clearing time, and expired rows are
// deleted at most PRUNE_BATCH per table per call, during attempts, completions and second steps only.

export const SESSIONS_TABLE = "sessions";
export const EMAIL_FAILURES_TABLE = "signin_email_failures";
export const ADDRESS_FAILURES_TABLE = "signin_address_failures";
export const MARKER_FAILURES_TABLE = "signin_marker_failures";
export const TICKETS_TABLE = "signin_tickets";
export const IDENTITY_TABLE = "signin_identity";
/** Pending sign-ins between a correct password and the second step (story 1.5, CA-46). */
export const PENDING_TABLE = "signin_pending";
export const SIGNIN_TABLES = [
  SESSIONS_TABLE,
  EMAIL_FAILURES_TABLE,
  ADDRESS_FAILURES_TABLE,
  MARKER_FAILURES_TABLE,
  TICKETS_TABLE,
  IDENTITY_TABLE,
  PENDING_TABLE,
] as const;

/** The most expired rows deleted from one table by one attempt or completion. */
export const PRUNE_BATCH = 20;
const TICKET_BYTES = 32;
const IDENTIFIER_BYTES = 16;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS ${IDENTITY_TABLE} (
     id INTEGER PRIMARY KEY CHECK (id = 1),
     installation_id TEXT NOT NULL,
     marker_key TEXT NOT NULL,
     email_key TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS ${SESSIONS_TABLE} (
     token_hash TEXT PRIMARY KEY,
     user_id TEXT NOT NULL,
     signed_in_at INTEGER NOT NULL,
     last_used_at INTEGER NOT NULL,
     expires_at INTEGER NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS sessions_expires_at ON ${SESSIONS_TABLE} (expires_at)`,
  `CREATE TABLE IF NOT EXISTS ${EMAIL_FAILURES_TABLE} (
     email_key TEXT PRIMARY KEY,
     failures INTEGER NOT NULL,
     last_failure_at INTEGER NOT NULL,
     clears_at INTEGER NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS signin_email_failures_clears_at ON ${EMAIL_FAILURES_TABLE} (clears_at)`,
  `CREATE TABLE IF NOT EXISTS ${MARKER_FAILURES_TABLE} (
     marker_id TEXT PRIMARY KEY,
     failures INTEGER NOT NULL,
     last_failure_at INTEGER NOT NULL,
     clears_at INTEGER NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS signin_marker_failures_clears_at ON ${MARKER_FAILURES_TABLE} (clears_at)`,
  `CREATE TABLE IF NOT EXISTS ${ADDRESS_FAILURES_TABLE} (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     address TEXT NOT NULL,
     at INTEGER NOT NULL,
     clears_at INTEGER NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS signin_address_failures_address ON ${ADDRESS_FAILURES_TABLE} (address, clears_at)`,
  `CREATE INDEX IF NOT EXISTS signin_address_failures_clears_at ON ${ADDRESS_FAILURES_TABLE} (clears_at)`,
  `CREATE TABLE IF NOT EXISTS ${TICKETS_TABLE} (
     ticket TEXT PRIMARY KEY,
     user_id TEXT,
     email_key TEXT NOT NULL,
     address_failure_id INTEGER,
     marker_id TEXT,
     hash_identity TEXT,
     presented_session_hash TEXT,
     expires_at INTEGER NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS signin_tickets_expires_at ON ${TICKETS_TABLE} (expires_at)`,
  `CREATE TABLE IF NOT EXISTS ${PENDING_TABLE} (
     token_hash TEXT PRIMARY KEY,
     user_id TEXT NOT NULL,
     email_key TEXT NOT NULL,
     address_failure_id INTEGER,
     marker_id TEXT,
     hash_identity TEXT NOT NULL,
     presented_session_hash TEXT,
     expires_at INTEGER NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS signin_pending_expires_at ON ${PENDING_TABLE} (expires_at)`,
];

const addressField = z.string().min(1).max(100);
/** The session and marker cookies the Worker passes on, bounded in number and size. */
export const cookiesField = z
  .record(z.string().min(1).max(MAX_COOKIE_NAME), z.string().max(MAX_COOKIE_VALUE))
  .refine((cookies) => Object.keys(cookies).length <= MAX_PASSED_COOKIES);

export const signInAttemptInput = z.object({ email: signInEmailField, address: addressField, cookies: cookiesField }).strict();
export const completeSignInInput = z
  .object({ ticket: z.string().regex(/^[0-9a-f]{64}$/), outcome: z.enum(["success", "failure"]) })
  .strict();
export const cookiesInput = z.object({ cookies: cookiesField }).strict();
/**
 * The second step as the Worker passes it (story 1.5): the request's cookies and address, the
 * method, the code as sent (the route's schema has refused a malformed one; here a value that does
 * not normalise counts as wrong) and the Worker's deployment key (D-22).
 */
export const secondStepOperationInput = z
  .object({
    cookies: cookiesField,
    address: addressField,
    method: z.enum(["code", "recovery"]),
    code: z.string().max(RECOVERY_CODE_FIELD_MAX_LENGTH),
    deploymentKey: deploymentKeyField,
  })
  .strict();

export type SignInAttemptInput = z.input<typeof signInAttemptInput>;
export type SecondStepOperationInput = z.output<typeof secondStepOperationInput>;

/**
 * What a counted attempt answers the Worker: the stored hash to check against, or `null` with
 * `standIn: true` for an unknown email or an inactive account, the identifier and the ticket. The
 * ticket and the hash stay inside the Worker's handling of that request.
 */
export interface SignInAttemptCounted {
  identifier: string;
  ticket: string;
  standIn: boolean;
  passwordHash: PasswordHash | null;
}

/**
 * What a correct completion, or a correct second step, answers the Worker, which sets the two
 * cookies from it (story 1.5 adds `kind`, telling it from a `SignInPending`).
 */
export interface SignInCompleted {
  kind: "signedIn";
  identifier: string;
  sessionToken: string;
  marker: string;
  account: { id: string; name: string };
  /** UTC, ISO 8601. */
  signedInAt: string;
}

/**
 * What a correct completion answers for an account with two-step verification on (story 1.5): no
 * session, only the pending token, which goes into its own cookie (D-2) and is never logged.
 */
export interface SignInPending {
  kind: "pending";
  identifier: string;
  pendingToken: string;
}

export type SignInCompletion = SignInCompleted | SignInPending;

/**
 * What the sign-in store needs of the two-step rows (story 1.5), implemented by the two-step store
 * and attached by the installation object, so this module imports nothing at run time from
 * twoStepStore.ts (which imports from here).
 */
export interface TwoStepAccess {
  /** Synchronous: the account's `two_step` row (its ciphertext and last accepted step), or null when off. */
  secretRow(accountId: string): { secretCiphertext: string; lastStep: number } | null;
  /**
   * Decrypts a `two_step` ciphertext under the key guard with associated data `two-step:<account id>`.
   * Refuses `deployment_key_missing` or `deployment_key_mismatch`; answers null when the value is refused.
   */
  decryptSecret(deploymentKey: string | null | undefined, ciphertext: string, accountId: string): Promise<Uint8Array | null>;
  /** Synchronous: sets the account's last accepted step (D-6). */
  setLastStep(accountId: string, step: number): void;
  /** Synchronous: deletes the account's recovery code with this hash; true when one was deleted. */
  useRecoveryCode(accountId: string, codeHash: string): boolean;
}

/** An installation role (story 1.2's `users.role`). */
export type AccountRole = "administrator" | "standard";

/** A new session's token and hash, made before the synchronous write that stores it. */
export interface PreparedSession {
  identifier: string;
  markerKey: CryptoKey;
  /** Goes only into the `Set-Cookie` line; never logged. */
  sessionToken: string;
  tokenHash: string;
}

/** The account a live session belongs to. */
export interface LiveSessionAccount {
  id: string;
  name: string;
  role: AccountRole;
  /** Milliseconds since the epoch. */
  signedInAt: number;
}

export type SessionInfo =
  | {
      identifier: string;
      signedIn: true;
      account: { id: string; name: string };
      /** The account's installation role (story 1.4, D-5). */
      role: AccountRole;
      /** UTC, ISO 8601. */
      signedInAt: string;
      installationName: string | null;
    }
  | {
      identifier: string;
      signedIn: false;
      installationName: string | null;
      /** True when this installation's session cookie was presented but names no live session. */
      clearSession: boolean;
    };

export interface SessionEnded {
  identifier: string;
  ended: boolean;
}

/** Rows read and written by the store's last attempt or completion, for the bounded-work test. */
export interface StoreWork {
  rowsRead: number;
  rowsWritten: number;
}

interface UserRow {
  id: string;
  name: string;
  active: number;
  password_algorithm: string;
  password_n: number;
  password_r: number;
  password_p: number;
  password_key_length: number;
  password_salt: string;
  password_hash: string;
}

interface CountRow {
  failures: number;
  last_failure_at: number;
  clears_at: number;
}

interface TicketRow {
  user_id: string | null;
  email_key: string;
  address_failure_id: number | null;
  marker_id: string | null;
  hash_identity: string | null;
  presented_session_hash: string | null;
}

interface PendingRow {
  user_id: string;
  email_key: string;
  address_failure_id: number | null;
  marker_id: string | null;
  hash_identity: string;
  presented_session_hash: string | null;
}

/** The counts that decide an attempt's wait, read in its synchronous step. */
interface CountState {
  emailRow: CountRow | null;
  markerRow: CountRow | null;
  /** The marker counted with the attempt: null when none was given or its own count waits. */
  usableMarker: string | null;
  known: boolean;
  address: { n: number; last: number | null };
  /** Whole seconds to wait; 0 when none applies. */
  wait: number;
}

/** A second step's refusal, decided in its synchronous step and raised after that step commits. */
type SecondStepRefusal = { code: "second_step_expired" | "second_step_code_wrong" | "second_step_recovery_code_wrong" } | { code: "signin_wait"; seconds: number };

/** The identity of a stored hash, kept in a ticket: its salt and its value together (E-22). */
export function hashIdentity(user: { password_salt: string; password_hash: string }): string {
  return `${user.password_salt}.${user.password_hash}`;
}

interface Keys {
  identifier: string;
  marker: CryptoKey;
  email: CryptoKey;
}

export class SignInStore {
  private keys: Promise<Keys> | null = null;
  private work: StoreWork = { rowsRead: 0, rowsWritten: 0 };
  /** The two-step rows, attached by the installation object after both stores exist (story 1.5). */
  private twoStep: TwoStepAccess | null = null;

  constructor(private readonly storage: DurableObjectStorage) {
    for (const statement of SCHEMA) storage.sql.exec(statement);
    // The identifier and the keys are made once, when the object is first created, and never
    // change: not on restart, not when the recorded public address changes (D-1, V-11).
    storage.sql.exec(
      `INSERT OR IGNORE INTO ${IDENTITY_TABLE} (id, installation_id, marker_key, email_key) VALUES (1, ?, ?, ?)`,
      randomHex(IDENTIFIER_BYTES),
      toBase64(crypto.getRandomValues(new Uint8Array(HMAC_KEY_BYTES))),
      toBase64(crypto.getRandomValues(new Uint8Array(HMAC_KEY_BYTES))),
    );
  }

  private get sql(): SqlStorage {
    return this.storage.sql;
  }

  /** Attaches the two-step rows (story 1.5). Until attached, no account has two-step verification on. */
  attachTwoStep(access: TwoStepAccess): void {
    this.twoStep = access;
  }

  /** Runs one statement, adding its rows read and written to the current operation's work. */
  private exec<T extends Record<string, SqlStorageValue>>(query: string, ...bindings: unknown[]): T[] {
    const cursor = this.sql.exec<T>(query, ...bindings);
    const rows = cursor.toArray();
    this.work.rowsRead += cursor.rowsRead;
    this.work.rowsWritten += cursor.rowsWritten;
    return rows;
  }

  /** The installation's identifier, in every cookie name (D-1). */
  identifier(): string {
    return this.sql.exec<{ installation_id: string }>(`SELECT installation_id FROM ${IDENTITY_TABLE} WHERE id = 1`).one().installation_id;
  }

  private loadKeys(): Promise<Keys> {
    this.keys ??= (async () => {
      const row = this.sql
        .exec<{ installation_id: string; marker_key: string; email_key: string }>(
          `SELECT installation_id, marker_key, email_key FROM ${IDENTITY_TABLE} WHERE id = 1`,
        )
        .one();
      const [marker, email] = await Promise.all([importHmacKey(fromBase64(row.marker_key)), importHmacKey(fromBase64(row.email_key))]);
      return { identifier: row.installation_id, marker, email };
    })().catch((error: unknown) => {
      // Not kept: a failed read or import is tried again by the next call, rather than failing
      // every sign-in, read and sign-out until the object is evicted (story 1.3 code review).
      this.keys = null;
      throw error;
    });
    return this.keys;
  }

  /** The key an email's failures are counted under: HMAC-SHA-256 of the normalised email (A-13). */
  async emailKey(email: string): Promise<string> {
    return hmacHex((await this.loadKeys()).email, normaliseEmail(email));
  }

  /** The work of the last attempt or completion. */
  lastWork(): StoreWork {
    return { ...this.work };
  }

  /** Deletes expired rows, at most PRUNE_BATCH per table (A-14). Attempts, completions and second steps only. */
  private prune(now: number): void {
    const batches: [string, string][] = [
      [SESSIONS_TABLE, "expires_at"],
      [TICKETS_TABLE, "expires_at"],
      [PENDING_TABLE, "expires_at"],
      [EMAIL_FAILURES_TABLE, "clears_at"],
      [MARKER_FAILURES_TABLE, "clears_at"],
      [ADDRESS_FAILURES_TABLE, "clears_at"],
    ];
    for (const [table, column] of batches) {
      this.exec(`DELETE FROM ${table} WHERE rowid IN (SELECT rowid FROM ${table} WHERE ${column} <= ? ORDER BY ${column} LIMIT ?)`, now, PRUNE_BATCH);
    }
  }

  private liveCount(table: string, keyColumn: string, key: string, now: number): CountRow | null {
    return this.exec<CountRow & Record<string, number>>(
      `SELECT failures, last_failure_at, clears_at FROM ${table} WHERE ${keyColumn} = ? AND clears_at > ?`,
      key,
      now,
    )[0] ?? null;
  }

  private raiseCount(table: string, keyColumn: string, key: string, current: CountRow | null, now: number, clearsAt: (last: number, n: number) => number): void {
    const failures = (current?.failures ?? 0) + 1;
    this.exec(
      `INSERT INTO ${table} (${keyColumn}, failures, last_failure_at, clears_at) VALUES (?, ?, ?, ?)
       ON CONFLICT (${keyColumn}) DO UPDATE SET failures = excluded.failures, last_failure_at = excluded.last_failure_at,
         clears_at = excluded.clears_at`,
      key,
      failures,
      now,
      clearsAt(now, failures),
    );
  }

  private findUser(email: string): UserRow | null {
    return (
      this.exec<UserRow & Record<string, SqlStorageValue>>(
        `SELECT id, name, active, password_algorithm, password_n, password_r, password_p, password_key_length, password_salt,
           password_hash FROM ${USERS_TABLE} WHERE email = ?`,
        email,
      )[0] ?? null
    );
  }

  // The counting of an attempt, callable for another kind of attempt (story 1.5, D-5): a two-step
  // account action counts its password check exactly as a sign-in attempt for the account's email
  // key, the browser's usable marker and a known address. The rules are story 1.3's, unchanged.

  /**
   * The storage-free inputs of counting for one email and the presented cookies: the email's key,
   * and the marker presented with this installation's identifier when it is valid at `now` (its
   * account is for the caller to compare).
   */
  async countingInputs(email: string, cookies: Record<string, string>, now: number): Promise<{ emailKey: string; marker: Marker | null }> {
    const keys = await this.loadKeys();
    const emailKey = await hmacHex(keys.email, normaliseEmail(email));
    const markerValue = cookies[markerCookieName(keys.identifier)];
    const marker = markerValue !== undefined ? await readMarker(keys.marker, markerValue, now) : null;
    return { emailKey, marker };
  }

  /**
   * Counts one attempt, or refuses it with `signin_wait` (not counted). Synchronous: call it inside
   * the caller's transaction, after its cryptography. `markerId` is the presented marker's
   * identifier when that marker belongs to the attempt's account, else null; a marker whose own
   * count waits is treated as absent. `address` is the request's address key, `unknown` when absent.
   * Answers the address failure row (null for an unknown address) and the marker that was counted.
   */
  countAttempt(input: { emailKey: string; markerId: string | null; address: string }, now: number): { addressFailureId: number | null; usableMarker: string | null } {
    const state = this.countState(input, now);
    if (state.wait > 0) throw new OperationRefusal("signin_wait", undefined, state.wait);
    return this.raiseCounts(input, state, now);
  }

  /**
   * Synchronous and read-only: the counts that decide an attempt for this email key, marker and
   * address at `now`, and the wait they impose. A marker whose own count waits is treated as
   * absent, so the email's wait applies (D-2 amended).
   */
  private countState(input: { emailKey: string; markerId: string | null; address: string }, now: number): CountState {
    const { emailKey, markerId } = input;
    const emailRow = this.liveCount(EMAIL_FAILURES_TABLE, "email_key", emailKey, now);
    const markerRow = markerId ? this.liveCount(MARKER_FAILURES_TABLE, "marker_id", markerId, now) : null;
    const markerWaitEnds = markerRow ? markerRow.last_failure_at + markerWaitMs(markerRow.failures) : 0;
    // A marker whose own count waits is treated as absent (D-2 amended).
    const usableMarker = markerId !== null && markerWaitEnds <= now ? markerId : null;
    const known = input.address !== UNKNOWN_ADDRESS;
    const address = known
      ? this.exec<{ n: number; last: number | null }>(
          `SELECT COUNT(*) AS n, MAX(at) AS last FROM ${ADDRESS_FAILURES_TABLE} WHERE address = ? AND clears_at > ?`,
          input.address,
          now,
        )[0]!
      : { n: 0, last: null };

    let waitEndsAt = 0;
    if (usableMarker === null && emailRow) waitEndsAt = Math.max(waitEndsAt, emailRow.last_failure_at + emailWaitMs(emailRow.failures));
    if (address.last !== null) waitEndsAt = Math.max(waitEndsAt, address.last + addressWaitMs(address.n));
    return { emailRow, markerRow, usableMarker, known, address, wait: secondsLeft(waitEndsAt, now) };
  }

  /** Synchronous: raises the email count, the usable marker's count and a known address's count by one failure at `now`. */
  private raiseCounts(input: { emailKey: string; address: string }, state: CountState, now: number): { addressFailureId: number | null; usableMarker: string | null } {
    const { emailKey } = input;
    const { emailRow, markerRow, usableMarker, known, address } = state;
    this.raiseCount(EMAIL_FAILURES_TABLE, "email_key", emailKey, emailRow, now, emailClearsAt);
    if (usableMarker !== null) this.raiseCount(MARKER_FAILURES_TABLE, "marker_id", usableMarker, markerRow, now, markerClearsAt);
    let addressFailureId: number | null = null;
    if (known) {
      const failures = address.n + 1;
      const heldUntil = addressHeldUntil(now, failures);
      addressFailureId = this.exec<{ id: number }>(
        `INSERT INTO ${ADDRESS_FAILURES_TABLE} (address, at, clears_at) VALUES (?, ?, ?) RETURNING id`,
        input.address,
        now,
        heldUntil,
      )[0]!.id;
      // Once a wait starts, every failure counted for the address is kept until 15 minutes after
      // that wait ends (D-2 amended).
      if (failures >= ADDRESS_FREE_FAILURES) {
        this.exec(
          `UPDATE ${ADDRESS_FAILURES_TABLE} SET clears_at = ? WHERE address = ? AND clears_at > ? AND clears_at < ?`,
          heldUntil,
          input.address,
          now,
          heldUntil,
        );
      }
    }
    return { addressFailureId, usableMarker };
  }

  /**
   * Clears what a successful attempt clears: its own address failure row, the email's count and the
   * marker's count. Synchronous: call it inside the transaction that decides the success.
   */
  clearCounts(counted: { emailKey: string; markerId: string | null; addressFailureId: number | null }): void {
    if (counted.addressFailureId !== null) this.exec(`DELETE FROM ${ADDRESS_FAILURES_TABLE} WHERE id = ?`, counted.addressFailureId);
    this.exec(`DELETE FROM ${EMAIL_FAILURES_TABLE} WHERE email_key = ?`, counted.emailKey);
    if (counted.markerId !== null) this.exec(`DELETE FROM ${MARKER_FAILURES_TABLE} WHERE marker_id = ?`, counted.markerId);
  }

  /**
   * Counts one sign-in attempt before its password is checked, or refuses it with `signin_wait`
   * (not counted). `email` is compared exactly after `normaliseEmail` (D-15); `address` is the
   * request's address key, `unknown` when absent (D-11); `cookies` are the request's cookies with
   * the session prefix, of which this object uses the two named with its identifier.
   */
  async attempt(input: { email: string; address: string; cookies: Record<string, string> }, now: number): Promise<SignInAttemptCounted> {
    this.work = { rowsRead: 0, rowsWritten: 0 };
    const email = normaliseEmail(input.email);
    // Work that needs no storage first, the same steps for every email.
    const keys = await this.loadKeys();
    const emailKey = await hmacHex(keys.email, email);
    const presented = input.cookies[sessionCookieName(keys.identifier)];
    const presentedSessionHash = presented !== undefined && isWellFormedToken(presented) ? await sessionTokenHash(presented) : null;
    const markerValue = input.cookies[markerCookieName(keys.identifier)];
    const marker = markerValue !== undefined ? await readMarker(keys.marker, markerValue, now) : null;
    const pendingHash = await this.presentedPendingHash(keys.identifier, input.cookies);

    // From here to the return there is no await: counting and the ticket are one step.
    this.prune(now);
    // A new attempt discards the pending sign-in this browser presents, before the wait check and
    // outside the counting transaction, so an attempt refused with a wait discards it too (D-3).
    if (pendingHash !== null) this.exec(`DELETE FROM ${PENDING_TABLE} WHERE token_hash = ?`, pendingHash);
    const user = this.findUser(email);
    const account = user && user.active === 1 ? user : null;
    const markerId = marker && account && marker.accountId === account.id ? marker.markerId : null;

    const ticket = randomHex(TICKET_BYTES);
    this.storage.transactionSync(() => {
      const counted = this.countAttempt({ emailKey, markerId, address: input.address }, now);
      this.exec(
        `INSERT INTO ${TICKETS_TABLE} (ticket, user_id, email_key, address_failure_id, marker_id, hash_identity,
           presented_session_hash, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ticket,
        account?.id ?? null,
        emailKey,
        counted.addressFailureId,
        counted.usableMarker,
        account ? hashIdentity(account) : null,
        presentedSessionHash,
        now + SIGNIN_TICKET_TTL_MS,
      );
    });

    return {
      identifier: keys.identifier,
      ticket,
      standIn: account === null,
      passwordHash: account
        ? {
            algorithm: account.password_algorithm as typeof PASSWORD_HASH_ALGORITHM,
            n: account.password_n,
            r: account.password_r,
            p: account.password_p,
            keyLength: account.password_key_length,
            salt: account.password_salt,
            hash: account.password_hash,
          }
        : null,
    };
  }

  /**
   * Completes a counted attempt with the Worker's outcome. The ticket is consumed whatever the
   * outcome. Only a correct check on a real account that is still active with the same stored hash
   * signs in: it removes this attempt from the address count, clears the email's and the marker's
   * counts, ends the session the browser presented, and stores the new session's hash with its
   * sign-in time and last use set to `now`. Anything else is `signin_failed`, with the counts left
   * raised.
   *
   * For an account with two-step verification on (story 1.5), a correct completion instead writes a
   * pending row with the ticket's bindings, expiring 5 minutes later (CA-46), clears no count,
   * writes no session and answers the pending token; only the token's hash is stored. The row is
   * written under a key mismatch too, so recovery codes still work (D-15).
   */
  async complete(ticket: string, outcome: "success" | "failure", now: number): Promise<SignInCompletion> {
    this.work = { rowsRead: 0, rowsWritten: 0 };
    const session = await this.prepareSession();
    const freshMarkerId = newMarkerId();
    const pendingToken = newSessionToken();
    const pendingHash = await sessionTokenHash(pendingToken);

    // From here to the end of the write there is no await: the ticket's consumption, the account
    // check and the session or pending row are one synchronous step (finding 22).
    this.prune(now);
    const row = this.storage.transactionSync(
      () =>
        this.exec<TicketRow & Record<string, SqlStorageValue>>(
          `DELETE FROM ${TICKETS_TABLE} WHERE ticket = ? AND expires_at > ?
           RETURNING user_id, email_key, address_failure_id, marker_id, hash_identity, presented_session_hash`,
          ticket,
          now,
        )[0] ?? null,
    );
    if (!row || outcome !== "success" || row.user_id === null) throw new OperationRefusal("signin_failed");
    const user = this.exec<{ id: string; name: string; active: number; password_salt: string; password_hash: string }>(
      `SELECT id, name, active, password_salt, password_hash FROM ${USERS_TABLE} WHERE id = ?`,
      row.user_id,
    )[0];
    // The account was made inactive, or its hash replaced, between the attempt and now (E-22).
    if (!user || user.active !== 1 || hashIdentity(user) !== row.hash_identity) throw new OperationRefusal("signin_failed");

    if (this.twoStep?.secretRow(user.id)) {
      this.storage.transactionSync(() => {
        this.exec(
          `INSERT INTO ${PENDING_TABLE} (token_hash, user_id, email_key, address_failure_id, marker_id, hash_identity,
             presented_session_hash, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          pendingHash,
          user.id,
          row.email_key,
          row.address_failure_id,
          row.marker_id,
          row.hash_identity,
          row.presented_session_hash,
          now + PENDING_SIGNIN_TTL_MS,
        );
      });
      return { kind: "pending", identifier: session.identifier, pendingToken };
    }

    const markerId = row.marker_id ?? freshMarkerId;
    this.storage.transactionSync(() => {
      this.clearCounts({ emailKey: row.email_key, markerId: row.marker_id, addressFailureId: row.address_failure_id });
      this.writeSession(user.id, row.presented_session_hash, session.tokenHash, now);
    });

    return {
      kind: "signedIn",
      identifier: session.identifier,
      sessionToken: session.sessionToken,
      marker: await this.sessionMarker(session, user.id, markerId, now),
      account: { id: user.id, name: user.name },
      signedInAt: new Date(now).toISOString(),
    };
  }

  /** The hash of the pending cookie named with this identifier, or null when none or a malformed one was presented. */
  private async presentedPendingHash(identifier: string, cookies: Record<string, string>): Promise<string | null> {
    const value = cookies[pendingCookieName(identifier)];
    return value !== undefined && isWellFormedToken(value) ? sessionTokenHash(value) : null;
  }

  /**
   * The second sign-in step (story 1.5): a code from the authenticator app or a recovery code for
   * the pending sign-in of the pending cookie the browser presents. A browser holds one pending
   * cookie, so the code is checked against the account of the newest pending sign-in there
   * (finding 33). `address` is the request's address key, counted and checked as `attempt` does.
   *
   * Cryptography first: the cookies' hashes, the new session, and for a code the account's
   * decrypted secret and the matching candidate step, for a recovery code its SHA-256. A code under
   * a key mismatch is refused `deployment_key_mismatch` there, nothing counted, the row kept (D-15).
   * Then one synchronous step:
   * 1. no live pending row, an inactive account or a replaced hash, no `two_step` row any more
   *    (either method; orchestrator ruling, 2026-11-22), or (for a code) a `two_step` row other
   *    than the one decrypted (finding 18): `second_step_expired`, the row deleted, nothing counted;
   * 2. a wait applies (the email's unless the row has a usable marker, and the address's): the row
   *    deleted, `signin_wait` (D-4);
   * 3. a code is right when its step is later than the last accepted step read in this step (D-6);
   *    a recovery code when `DELETE … RETURNING` removes the account's code with its hash;
   * 4. wrong: the email, usable marker and known address counts raised as for a wrong password; if
   *    they now impose a wait, the row deleted and `signin_wait` (finding 3); otherwise
   *    `second_step_code_wrong` or `second_step_recovery_code_wrong` (D-13);
   * 5. right: the row deleted, the last step set, the counts cleared as a sign-in clears them, the
   *    sessions presented at the password step and now ended, the new session written (CA-47); the
   *    answer is a completed sign-in's.
   */
  async secondStep(input: SecondStepOperationInput, now: number): Promise<SignInCompleted> {
    this.work = { rowsRead: 0, rowsWritten: 0 };
    const access = this.twoStep;
    if (!access) throw new Error("The two-step rows are not attached to the sign-in store.");
    // Cryptography and reads that decide nothing first.
    const keys = await this.loadKeys();
    const pendingHash = await this.presentedPendingHash(keys.identifier, input.cookies);
    const { tokenHash: presentedNow } = await this.presentedSession(input.cookies);
    const session = await this.prepareSession();
    const freshMarkerId = newMarkerId();
    const before = pendingHash !== null ? this.livePending(pendingHash, now) : null;

    let decrypted: string | null = null;
    let matched: number | null = null;
    let recoveryHash: string | null = null;
    if (before && input.method === "code") {
      const stored = access.secretRow(before.user_id);
      if (stored) {
        // A key refusal (deployment_key_mismatch) leaves here, before anything is counted or deleted.
        const secret = await access.decryptSecret(input.deploymentKey, stored.secretCiphertext, before.user_id);
        decrypted = stored.secretCiphertext;
        const code = normaliseCode(input.code);
        if (secret && code !== null) matched = await matchingStep(secret, code, now);
      }
    } else if (before) {
      const code = normaliseRecoveryCode(input.code);
      if (code !== null) recoveryHash = await sha256Hex(code);
    }

    // From here to the end of the write there is no await: every row decided on is read again.
    const decided = this.storage.transactionSync((): { refusal: SecondStepRefusal } | { userId: string; name: string; markerId: string } => {
      this.prune(now);
      const row = pendingHash !== null ? this.livePending(pendingHash, now) : null;
      const discard = () => {
        if (pendingHash !== null) this.exec(`DELETE FROM ${PENDING_TABLE} WHERE token_hash = ?`, pendingHash);
      };
      if (!row || !before || row.user_id !== before.user_id) {
        discard();
        return { refusal: { code: "second_step_expired" } };
      }
      const user = this.exec<{ id: string; name: string; active: number; password_salt: string; password_hash: string }>(
        `SELECT id, name, active, password_salt, password_hash FROM ${USERS_TABLE} WHERE id = ?`,
        row.user_id,
      )[0];
      // Two-step verification must still be on, for either method (orchestrator ruling, 2026-11-22).
      const current = access.secretRow(row.user_id);
      if (
        !user ||
        user.active !== 1 ||
        hashIdentity(user) !== row.hash_identity ||
        current === null ||
        (input.method === "code" && current.secretCiphertext !== decrypted)
      ) {
        discard();
        return { refusal: { code: "second_step_expired" } };
      }

      const counting = { emailKey: row.email_key, markerId: row.marker_id, address: input.address };
      const state = this.countState(counting, now);
      if (state.wait > 0) {
        discard();
        return { refusal: { code: "signin_wait", seconds: state.wait } };
      }

      const right =
        input.method === "code"
          ? matched !== null && matched > current.lastStep
          : recoveryHash !== null && access.useRecoveryCode(row.user_id, recoveryHash);
      if (!right) {
        this.raiseCounts(counting, state, now);
        const after = this.countState(counting, now);
        if (after.wait > 0) {
          discard();
          return { refusal: { code: "signin_wait", seconds: after.wait } };
        }
        return { refusal: { code: input.method === "code" ? "second_step_code_wrong" : "second_step_recovery_code_wrong" } };
      }

      discard();
      if (input.method === "code") access.setLastStep(row.user_id, matched!);
      this.clearCounts({ emailKey: row.email_key, markerId: row.marker_id, addressFailureId: row.address_failure_id });
      if (presentedNow !== null && presentedNow !== row.presented_session_hash) {
        this.exec(`DELETE FROM ${SESSIONS_TABLE} WHERE token_hash = ?`, presentedNow);
      }
      this.writeSession(row.user_id, row.presented_session_hash, session.tokenHash, now);
      return { userId: user.id, name: user.name, markerId: row.marker_id ?? freshMarkerId };
    });

    if ("refusal" in decided) {
      const { refusal } = decided;
      throw refusal.code === "signin_wait" ? new OperationRefusal("signin_wait", undefined, refusal.seconds) : new OperationRefusal(refusal.code);
    }
    return {
      kind: "signedIn",
      identifier: session.identifier,
      sessionToken: session.sessionToken,
      marker: await this.sessionMarker(session, decided.userId, decided.markerId, now),
      account: { id: decided.userId, name: decided.name },
      signedInAt: new Date(now).toISOString(),
    };
  }

  /** Synchronous and read-only: the live pending row under this token hash, or null. */
  private livePending(tokenHash: string, now: number): PendingRow | null {
    return (
      this.exec<PendingRow & Record<string, SqlStorageValue>>(
        `SELECT user_id, email_key, address_failure_id, marker_id, hash_identity, presented_session_hash FROM ${PENDING_TABLE}
           WHERE token_hash = ? AND expires_at > ?`,
        tokenHash,
        now,
      )[0] ?? null
    );
  }

  /** The number of pending sign-ins stored, for tests. */
  pendingCount(): number {
    return this.sql.exec<{ n: number }>(`SELECT COUNT(*) AS n FROM ${PENDING_TABLE}`).one().n;
  }

  // Starting a session, shared by a completed sign-in and an accepted invitation (story 1.4, D-4).
  // The cryptography comes before and after the caller's synchronous write: `prepareSession` makes
  // the token and its hash, `writeSession` (with no await, inside the caller's transaction) ends the
  // presented session and stores the new one, and `sessionMarker` signs the marker.

  /** A new session token and its hash, with the identifier and marker key, before any write. */
  async prepareSession(): Promise<PreparedSession> {
    const keys = await this.loadKeys();
    const sessionToken = newSessionToken();
    return { identifier: keys.identifier, markerKey: keys.marker, sessionToken, tokenHash: await sessionTokenHash(sessionToken) };
  }

  /**
   * Ends the presented session, if any, and stores the new session's hash with its sign-in time and
   * last use set to `now` and its expiry 30 days later. Synchronous: call it inside the transaction
   * that decides the account.
   */
  writeSession(userId: string, presentedSessionHash: string | null, tokenHash: string, now: number): void {
    if (presentedSessionHash !== null) this.exec(`DELETE FROM ${SESSIONS_TABLE} WHERE token_hash = ?`, presentedSessionHash);
    this.exec(
      `INSERT INTO ${SESSIONS_TABLE} (token_hash, user_id, signed_in_at, last_used_at, expires_at) VALUES (?, ?, ?, ?, ?)`,
      tokenHash,
      userId,
      now,
      now,
      now + SESSION_MAX_AGE_MS,
    );
  }

  /** The signed marker for the account just signed in (story 1.3's D-3). */
  sessionMarker(session: PreparedSession, userId: string, markerId: string, now: number): Promise<string> {
    return makeMarker(session.markerKey, userId, markerId, now);
  }

  /**
   * The hash of the session cookie named with this installation's identifier, or `null` when none
   * or a malformed one was presented; `presented` says whether that cookie was there at all. A
   * cookie named with another identifier is not this installation's and is ignored.
   */
  async presentedSession(cookies: Record<string, string>): Promise<{ identifier: string; presented: boolean; tokenHash: string | null }> {
    const keys = await this.loadKeys();
    const value = cookies[sessionCookieName(keys.identifier)];
    if (value === undefined) return { identifier: keys.identifier, presented: false, tokenHash: null };
    return { identifier: keys.identifier, presented: true, tokenHash: isWellFormedToken(value) ? await sessionTokenHash(value) : null };
  }

  /**
   * The account of a live session: one stored under this hash, before 30 days after its sign-in,
   * for an active account. Synchronous and read-only, so a caller can decide and write in one step.
   */
  liveSessionAccount(tokenHash: string | null, now: number): LiveSessionAccount | null {
    if (tokenHash === null) return null;
    const found = this.sql
      .exec<{ id: string; name: string; role: string; signed_in_at: number }>(
        `SELECT u.id AS id, u.name AS name, u.role AS role, s.signed_in_at AS signed_in_at FROM ${SESSIONS_TABLE} s
           JOIN ${USERS_TABLE} u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ? AND u.active = 1`,
        tokenHash,
        now,
      )
      .toArray()[0];
    if (!found) return null;
    return { id: found.id, name: found.name, role: found.role as AccountRole, signedInAt: found.signed_in_at };
  }

  /**
   * Reads the session named with this installation's identifier, writing nothing (D-4 amended):
   * no pruning, no last-use update. A session is live before 30 days after its sign-in, for an
   * active account. Anything else, including a cookie that is ended, unknown or malformed, is "not
   * signed in"; a presented but dead cookie is flagged for clearing. A cookie named with another
   * identifier is not this installation's and is left alone.
   */
  async sessionInfo(cookies: Record<string, string>, now: number): Promise<SessionInfo> {
    const { identifier, presented, tokenHash } = await this.presentedSession(cookies);
    const installationName =
      this.sql.exec<{ installation_name: string }>(`SELECT installation_name FROM ${SETTINGS_TABLE} WHERE id = 1`).toArray()[0]?.installation_name ?? null;
    if (!presented) return { identifier, signedIn: false, installationName, clearSession: false };
    const found = this.liveSessionAccount(tokenHash, now);
    if (found) {
      return {
        identifier,
        signedIn: true,
        account: { id: found.id, name: found.name },
        role: found.role,
        signedInAt: new Date(found.signedInAt).toISOString(),
        installationName,
      };
    }
    return { identifier, signedIn: false, installationName, clearSession: true };
  }

  /** Ends a session by its token hash; ending one already gone also succeeds (D-13). */
  endSessionByHash(tokenHash: string): boolean {
    if (!TOKEN_HASH_PATTERN.test(tokenHash)) return false;
    return this.sql.exec(`DELETE FROM ${SESSIONS_TABLE} WHERE token_hash = ? RETURNING token_hash`, tokenHash).toArray().length > 0;
  }

  /** Ends the session named with this installation's identifier, if any. Safe to repeat (E-6). */
  async endSession(cookies: Record<string, string>): Promise<SessionEnded> {
    const keys = await this.loadKeys();
    const presented = cookies[sessionCookieName(keys.identifier)];
    if (presented === undefined || !isWellFormedToken(presented)) return { identifier: keys.identifier, ended: false };
    return { identifier: keys.identifier, ended: this.endSessionByHash(await sessionTokenHash(presented)) };
  }

  /** The stored counts, for tests and diagnostics. Holds no email, only its key. */
  counts(): {
    byEmail: { emailKey: string; failures: number; lastFailureAt: number; clearsAt: number }[];
    byMarker: { markerId: string; failures: number; lastFailureAt: number; clearsAt: number }[];
    byAddress: { address: string; at: number; clearsAt: number }[];
    tickets: number;
  } {
    return {
      byEmail: this.sql
        .exec<{ email_key: string; failures: number; last_failure_at: number; clears_at: number }>(
          `SELECT email_key, failures, last_failure_at, clears_at FROM ${EMAIL_FAILURES_TABLE} ORDER BY email_key`,
        )
        .toArray()
        .map((row) => ({ emailKey: row.email_key, failures: row.failures, lastFailureAt: row.last_failure_at, clearsAt: row.clears_at })),
      byMarker: this.sql
        .exec<{ marker_id: string; failures: number; last_failure_at: number; clears_at: number }>(
          `SELECT marker_id, failures, last_failure_at, clears_at FROM ${MARKER_FAILURES_TABLE} ORDER BY marker_id`,
        )
        .toArray()
        .map((row) => ({ markerId: row.marker_id, failures: row.failures, lastFailureAt: row.last_failure_at, clearsAt: row.clears_at })),
      byAddress: this.sql
        .exec<{ address: string; at: number; clears_at: number }>(`SELECT address, at, clears_at FROM ${ADDRESS_FAILURES_TABLE} ORDER BY id`)
        .toArray()
        .map((row) => ({ address: row.address, at: row.at, clearsAt: row.clears_at })),
      tickets: this.sql.exec<{ n: number }>(`SELECT COUNT(*) AS n FROM ${TICKETS_TABLE}`).one().n,
    };
  }
}
