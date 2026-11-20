import { z } from "zod";
import { checkInput } from "../../shared/routes";
import { emailField, installationNameField, personNameField } from "../../shared/setup";
import {
  fromBase64,
  PASSWORD_HASH_ALGORITHM,
  SCRYPT_KEY_LENGTH,
  SCRYPT_N,
  SCRYPT_P,
  SCRYPT_R,
  SCRYPT_SALT_BYTES,
} from "../auth/password";
import { OperationRefusal } from "../objects/ObjectBase";

// Set-up storage in the installation object (story 1.2): users, the installation's settings, the
// current set-up code's fingerprint and the wrong-code counts. Tables are created if absent under
// data format 1; before the first release a changed shape re-creates test installations
// (standing rule 8). Accounts and the installation's name live only here, and no revision restore
// writes this object (standing rule 9, CAP-11).
//
// Wrong-code limits (CA-05, CA-43, CA-45, D-3):
// - Counts are raised before the code is checked: every attempt that is let through counts.
// - Per network address: after 5 counted attempts, the address waits 1 minute, doubling with each
//   further one up to 15 minutes. A count clears 15 minutes after its wait has ended, that is at
//   the last failure plus that count's wait plus 15 minutes (D-3 as amended on 2026-11-20), so
//   from the 9th failure on an address gets one attempt per 15 minutes until it stops for 30.
//   Attempts during a wait are refused and not counted.
// - Installation-wide: 100 counted attempts within a rolling 60 minutes refuse every attempt until
//   the oldest of them leaves the window. Refused attempts are not counted.
// - A new code fingerprint (a redeploy issued a fresh code) clears every count and every ticket.
//
// Rollout window (D-7, Kevin 2026-11-20): for minutes after a deploy, Worker copies with the old
// secret and copies with the new one run side by side (experiment R11). The object therefore
// remembers every fingerprint it has replaced. An attempt or a create carrying a replaced
// fingerprint is refused with `setup_code_replaced` and changes nothing: no count, no ticket. Only
// a fingerprint never seen before replaces the current one and resets counts and tickets, so
// alternating copies cannot reset the counts and the old code stops working at once. Known cost:
// after a Cloudflare rollback restores an older secret, set-up is refused until the next deploy
// issues a new code.
//
// Tickets: each counted attempt returns a one-time ticket, kept with the fingerprint it was issued
// under for 5 minutes. Creating the first administrator consumes one, so no create happens without
// a counted attempt before it.

export const ADDRESS_FREE_ATTEMPTS = 5;
export const FIRST_WAIT_MS = 60_000;
export const MAX_WAIT_MS = 15 * 60_000;
export const ADDRESS_CLEAR_MS = 15 * 60_000;
export const INSTALLATION_CAP = 100;
export const CAP_WINDOW_MS = 60 * 60_000;
export const TICKET_TTL_MS = 5 * 60_000;
const TICKET_BYTES = 32;

/** How long an address with this many counted failures must wait after its last one. */
export function addressWaitMs(failures: number): number {
  if (failures < ADDRESS_FREE_ATTEMPTS) return 0;
  return Math.min(FIRST_WAIT_MS * 2 ** (failures - ADDRESS_FREE_ATTEMPTS), MAX_WAIT_MS);
}

/** When an address's count clears: 15 minutes after its wait ends (D-3). */
export function addressClearsAt(lastFailureAt: number, failures: number): number {
  return lastFailureAt + addressWaitMs(failures) + ADDRESS_CLEAR_MS;
}

export const USERS_TABLE = "users";
export const SETTINGS_TABLE = "settings";

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS ${USERS_TABLE} (
     id TEXT PRIMARY KEY,
     email TEXT NOT NULL UNIQUE,
     name TEXT NOT NULL,
     role TEXT NOT NULL CHECK (role IN ('administrator', 'standard')),
     active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
     password_algorithm TEXT NOT NULL,
     password_n INTEGER NOT NULL,
     password_r INTEGER NOT NULL,
     password_p INTEGER NOT NULL,
     password_key_length INTEGER NOT NULL,
     password_salt TEXT NOT NULL,
     password_hash TEXT NOT NULL,
     created_at TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS ${SETTINGS_TABLE} (
     id INTEGER PRIMARY KEY CHECK (id = 1),
     installation_name TEXT NOT NULL,
     public_address TEXT NOT NULL,
     set_up_at TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS setup_code (
     id INTEGER PRIMARY KEY CHECK (id = 1),
     fingerprint TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS setup_code_replaced (
     fingerprint TEXT PRIMARY KEY,
     replaced_at INTEGER NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS setup_failures_by_address (
     address TEXT PRIMARY KEY,
     failures INTEGER NOT NULL,
     last_failure_at INTEGER NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS setup_failures (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     at INTEGER NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS setup_tickets (
     ticket TEXT PRIMARY KEY,
     fingerprint TEXT NOT NULL,
     expires_at INTEGER NOT NULL
   )`,
];

const fingerprintField = z.string().regex(/^[0-9a-f]{64}$/);
const addressField = z.string().min(1).max(100);
const base64Field = z.string().min(1).max(512).regex(/^[A-Za-z0-9+/]+={0,2}$/);
const ticketField = z.string().regex(/^[0-9a-f]{64}$/);

function decodedLength(text: string): number {
  try {
    return fromBase64(text).byteLength;
  } catch {
    return -1;
  }
}

/** An origin such as `https://survey.example.com`: what the installation records as its public address (CA-57). */
export const publicAddressField = z
  .string()
  .max(2048)
  .refine((value) => {
    try {
      const url = new URL(value);
      return (url.protocol === "https:" || url.protocol === "http:") && url.origin === value;
    } catch {
      return false;
    }
  });

export const setupAttemptInput = z.object({ address: addressField, fingerprint: fingerprintField }).strict();

export const createFirstAdministratorInput = z
  .object({
    fingerprint: fingerprintField,
    ticket: ticketField,
    installationName: installationNameField,
    publicAddress: publicAddressField,
    name: personNameField,
    email: emailField,
    passwordHash: z
      .object({
        // Pinned to the current parameters (AD-12, K19): anything else is a caller fault.
        algorithm: z.literal(PASSWORD_HASH_ALGORITHM),
        n: z.literal(SCRYPT_N),
        r: z.literal(SCRYPT_R),
        p: z.literal(SCRYPT_P),
        keyLength: z.literal(SCRYPT_KEY_LENGTH),
        salt: base64Field.refine((value) => decodedLength(value) === SCRYPT_SALT_BYTES),
        hash: base64Field.refine((value) => decodedLength(value) === SCRYPT_KEY_LENGTH),
      })
      .strict(),
  })
  .strict();

export type CreateFirstAdministratorInput = z.input<typeof createFirstAdministratorInput>;

/**
 * What a counted attempt returns: a one-time ticket for `createFirstAdministrator`. The ticket stays
 * inside the Worker's handling of that one request: never logged, never sent to the browser.
 */
export interface SetupAttemptCounted {
  counted: true;
  ticket: string;
}

export interface FirstAdministratorCreated {
  userId: string;
  installationName: string;
  email: string;
}

export interface SetupFailureCounts {
  fingerprint: string | null;
  byAddress: { address: string; failures: number; lastFailureAt: number }[];
  recent: number[];
}

/** Parses an operation's input or refuses it, naming the field at most. */
export function parseOperationInput<T>(schema: z.ZodType<T>, raw: unknown): T {
  const checked = checkInput(schema, raw);
  if (!checked.ok) throw new OperationRefusal("invalid_input", checked.field);
  return checked.value;
}

export class SetupStore {
  constructor(private readonly storage: DurableObjectStorage) {
    for (const statement of SCHEMA) storage.sql.exec(statement);
  }

  private get sql(): SqlStorage {
    return this.storage.sql;
  }

  hasUsers(): boolean {
    return this.sql.exec(`SELECT 1 FROM ${USERS_TABLE} LIMIT 1`).toArray().length > 0;
  }

  /** Set-up is open while no user exists. */
  isOpen(): boolean {
    return !this.hasUsers();
  }

  private storedFingerprint(): string | null {
    const rows = this.sql.exec<{ fingerprint: string }>("SELECT fingerprint FROM setup_code WHERE id = 1").toArray();
    return rows[0]?.fingerprint ?? null;
  }

  /** True when this fingerprint was the current one once and has since been replaced (D-7). */
  private isReplaced(fingerprint: string): boolean {
    return this.sql.exec("SELECT 1 FROM setup_code_replaced WHERE fingerprint = ?", fingerprint).toArray().length > 0;
  }

  /**
   * Makes `fingerprint` the current one if it is new, remembering the one it replaces; refuses a
   * replaced fingerprint with `setup_code_replaced`, changing nothing (D-7).
   */
  private acceptFingerprint(fingerprint: string, now: number): void {
    const current = this.storedFingerprint();
    if (current === fingerprint) return;
    if (this.isReplaced(fingerprint)) throw new OperationRefusal("setup_code_replaced");
    // A fresh code: every count starts again (CA-45), and tickets issued under the old code lapse.
    this.storage.transactionSync(() => {
      if (current !== null) {
        this.sql.exec(
          "INSERT INTO setup_code_replaced (fingerprint, replaced_at) VALUES (?, ?) ON CONFLICT (fingerprint) DO NOTHING",
          current,
          now,
        );
      }
      this.clearCounts();
      this.sql.exec("DELETE FROM setup_tickets");
      this.sql.exec(
        "INSERT INTO setup_code (id, fingerprint) VALUES (1, ?) ON CONFLICT (id) DO UPDATE SET fingerprint = excluded.fingerprint",
        fingerprint,
      );
    });
  }

  private clearCounts(): void {
    this.sql.exec("DELETE FROM setup_failures_by_address");
    this.sql.exec("DELETE FROM setup_failures");
  }

  /** Deletes address rows whose count has cleared (D-3): 15 minutes after their wait ended. */
  private deleteClearedAddresses(now: number): void {
    const rows = this.sql
      .exec<{ address: string; failures: number; last_failure_at: number }>(
        "SELECT address, failures, last_failure_at FROM setup_failures_by_address",
      )
      .toArray();
    for (const row of rows) {
      if (addressClearsAt(row.last_failure_at, row.failures) <= now) {
        this.sql.exec("DELETE FROM setup_failures_by_address WHERE address = ?", row.address);
      }
    }
  }

  private issueTicket(fingerprint: string, now: number): string {
    const bytes = crypto.getRandomValues(new Uint8Array(TICKET_BYTES));
    const ticket = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
    this.sql.exec("INSERT INTO setup_tickets (ticket, fingerprint, expires_at) VALUES (?, ?, ?)", ticket, fingerprint, now + TICKET_TTL_MS);
    return ticket;
  }

  /**
   * Raises the wrong-code counts for one attempt before its code is checked, or refuses it.
   * `fingerprint` is that of the configured code (the current secret), never of the entered code.
   * Refuses with `setup_closed` once a user exists, with `setup_code_replaced` when the fingerprint
   * is one a newer code replaced (D-7), and with `setup_wait` (carrying the seconds) while the
   * address or the installation must wait; a refused attempt is not counted. A counted
   * attempt returns a one-time ticket that `createFirstAdministrator` requires.
   */
  attempt(address: string, fingerprint: string, now: number): SetupAttemptCounted {
    if (this.hasUsers()) throw new OperationRefusal("setup_closed");

    this.acceptFingerprint(fingerprint, now);

    this.deleteClearedAddresses(now);
    this.sql.exec("DELETE FROM setup_tickets WHERE expires_at <= ?", now);
    this.sql.exec("DELETE FROM setup_failures WHERE at <= ?", now - CAP_WINDOW_MS);

    let waitMs = 0;
    const window = this.sql
      .exec<{ n: number; oldest: number | null }>("SELECT COUNT(*) AS n, MIN(at) AS oldest FROM setup_failures")
      .one();
    if (window.n >= INSTALLATION_CAP && window.oldest !== null) {
      // Refused until enough of the counted attempts leave the window to bring it under the cap.
      const release = this.sql
        .exec<{ at: number }>("SELECT at FROM setup_failures ORDER BY at ASC, id ASC LIMIT 1 OFFSET ?", window.n - INSTALLATION_CAP)
        .one();
      waitMs = Math.max(waitMs, release.at + CAP_WINDOW_MS - now);
    }
    const row = this.sql
      .exec<{ failures: number; last_failure_at: number }>(
        "SELECT failures, last_failure_at FROM setup_failures_by_address WHERE address = ?",
        address,
      )
      .toArray()[0];
    if (row) waitMs = Math.max(waitMs, row.last_failure_at + addressWaitMs(row.failures) - now);

    if (waitMs > 0) throw new OperationRefusal("setup_wait", undefined, Math.ceil(waitMs / 1000));

    this.sql.exec(
      `INSERT INTO setup_failures_by_address (address, failures, last_failure_at) VALUES (?, 1, ?)
       ON CONFLICT (address) DO UPDATE SET failures = failures + 1, last_failure_at = excluded.last_failure_at`,
      address,
      now,
    );
    this.sql.exec("INSERT INTO setup_failures (at) VALUES (?)", now);
    return { counted: true, ticket: this.issueTicket(fingerprint, now) };
  }

  /**
   * Creates the first administrator and records the installation's name and public address, in
   * one synchronous transaction: it confirms there is still no user, that the code fingerprint is
   * still the current one and that the ticket is one issued under it, unexpired and unused, then
   * consumes the ticket and writes. Success clears the wrong-code counts and every ticket.
   */
  createFirstAdministrator(input: z.output<typeof createFirstAdministratorInput>, now: number): FirstAdministratorCreated {
    return this.storage.transactionSync(() => {
      if (this.hasUsers()) throw new OperationRefusal("setup_closed");
      // A newer code replaced the one this request was accepted under, dropping its ticket (D-7).
      if (this.isReplaced(input.fingerprint)) throw new OperationRefusal("setup_code_replaced");
      if (this.storedFingerprint() !== input.fingerprint) throw new OperationRefusal("setup_code_wrong");
      const consumed = this.sql
        .exec("DELETE FROM setup_tickets WHERE ticket = ? AND fingerprint = ? AND expires_at > ? RETURNING ticket", input.ticket, input.fingerprint, now)
        .toArray();
      if (consumed.length !== 1) throw new OperationRefusal("setup_code_wrong");
      const userId = crypto.randomUUID();
      const at = new Date(now).toISOString();
      const hash = input.passwordHash;
      this.sql.exec(
        `INSERT INTO ${USERS_TABLE} (id, email, name, role, active, password_algorithm, password_n, password_r,
           password_p, password_key_length, password_salt, password_hash, created_at)
         VALUES (?, ?, ?, 'administrator', 1, ?, ?, ?, ?, ?, ?, ?, ?)`,
        userId,
        input.email,
        input.name,
        hash.algorithm,
        hash.n,
        hash.r,
        hash.p,
        hash.keyLength,
        hash.salt,
        hash.hash,
        at,
      );
      this.sql.exec(
        `INSERT INTO ${SETTINGS_TABLE} (id, installation_name, public_address, set_up_at) VALUES (1, ?, ?, ?)
         ON CONFLICT (id) DO UPDATE SET installation_name = excluded.installation_name,
           public_address = excluded.public_address, set_up_at = excluded.set_up_at`,
        input.installationName,
        input.publicAddress,
        at,
      );
      this.clearCounts();
      this.sql.exec("DELETE FROM setup_tickets");
      return { userId, installationName: input.installationName, email: input.email };
    });
  }

  /** The replaced fingerprints, oldest first, for tests and diagnostics (D-7). */
  replacedFingerprints(): string[] {
    return this.sql
      .exec<{ fingerprint: string }>("SELECT fingerprint FROM setup_code_replaced ORDER BY replaced_at ASC, fingerprint ASC")
      .toArray()
      .map((row) => row.fingerprint);
  }

  /** The stored counts, for tests and diagnostics. Holds no code, only its fingerprint. */
  counts(): SetupFailureCounts {
    return {
      fingerprint: this.storedFingerprint(),
      byAddress: this.sql
        .exec<{ address: string; failures: number; last_failure_at: number }>(
          "SELECT address, failures, last_failure_at FROM setup_failures_by_address ORDER BY address",
        )
        .toArray()
        .map((row) => ({ address: row.address, failures: row.failures, lastFailureAt: row.last_failure_at })),
      recent: this.sql
        .exec<{ at: number }>("SELECT at FROM setup_failures ORDER BY at ASC, id ASC")
        .toArray()
        .map((row) => row.at),
    };
  }
}
