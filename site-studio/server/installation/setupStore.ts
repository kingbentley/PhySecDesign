import { z } from "zod";
import { checkInput } from "../../shared/routes";
import { emailField, installationNameField, personNameField } from "../../shared/setup";
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
//   further one up to 15 minutes. A count clears 15 minutes after its last failure. Attempts
//   during a wait are refused and not counted.
// - Installation-wide: 100 counted attempts within a rolling 60 minutes refuse every attempt until
//   the oldest of them leaves the window. Refused attempts are not counted.
// - A new code fingerprint (a redeploy issued a fresh code) clears every count.

export const ADDRESS_FREE_ATTEMPTS = 5;
export const FIRST_WAIT_MS = 60_000;
export const MAX_WAIT_MS = 15 * 60_000;
export const ADDRESS_CLEAR_MS = 15 * 60_000;
export const INSTALLATION_CAP = 100;
export const CAP_WINDOW_MS = 60 * 60_000;

/** How long an address with this many counted failures must wait after its last one. */
export function addressWaitMs(failures: number): number {
  if (failures < ADDRESS_FREE_ATTEMPTS) return 0;
  return Math.min(FIRST_WAIT_MS * 2 ** (failures - ADDRESS_FREE_ATTEMPTS), MAX_WAIT_MS);
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
  `CREATE TABLE IF NOT EXISTS setup_failures_by_address (
     address TEXT PRIMARY KEY,
     failures INTEGER NOT NULL,
     last_failure_at INTEGER NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS setup_failures (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     at INTEGER NOT NULL
   )`,
];

const fingerprintField = z.string().regex(/^[0-9a-f]{64}$/);
const addressField = z.string().min(1).max(100);
const base64Field = z.string().min(1).max(512).regex(/^[A-Za-z0-9+/]+={0,2}$/);
const positiveInt = z.number().int().positive();

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
    installationName: installationNameField,
    publicAddress: publicAddressField,
    name: personNameField,
    email: emailField,
    passwordHash: z
      .object({
        algorithm: z.literal("scrypt"),
        n: positiveInt,
        r: positiveInt,
        p: positiveInt,
        keyLength: positiveInt,
        salt: base64Field,
        hash: base64Field,
      })
      .strict(),
  })
  .strict();

export type CreateFirstAdministratorInput = z.input<typeof createFirstAdministratorInput>;

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

  private clearCounts(): void {
    this.sql.exec("DELETE FROM setup_failures_by_address");
    this.sql.exec("DELETE FROM setup_failures");
  }

  /**
   * Raises the wrong-code counts for one attempt before its code is checked, or refuses it.
   * `fingerprint` is that of the configured code (the current secret), never of the entered code.
   * Refuses with `setup_closed` once a user exists, and with `setup_wait` (carrying the seconds)
   * while the address or the installation must wait; a refused attempt is not counted.
   */
  attempt(address: string, fingerprint: string, now: number): void {
    if (this.hasUsers()) throw new OperationRefusal("setup_closed");

    if (this.storedFingerprint() !== fingerprint) {
      // A fresh code: every count starts again (CA-45).
      this.clearCounts();
      this.sql.exec(
        "INSERT INTO setup_code (id, fingerprint) VALUES (1, ?) ON CONFLICT (id) DO UPDATE SET fingerprint = excluded.fingerprint",
        fingerprint,
      );
    }

    this.sql.exec("DELETE FROM setup_failures_by_address WHERE last_failure_at <= ?", now - ADDRESS_CLEAR_MS);
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
  }

  /**
   * Creates the first administrator and records the installation's name and public address, in
   * one synchronous transaction: it confirms there is still no user and that the code fingerprint
   * is still the current one, then writes. Success clears the wrong-code counts.
   */
  createFirstAdministrator(input: z.output<typeof createFirstAdministratorInput>, now: number): FirstAdministratorCreated {
    return this.storage.transactionSync(() => {
      if (this.hasUsers()) throw new OperationRefusal("setup_closed");
      if (this.storedFingerprint() !== input.fingerprint) throw new OperationRefusal("setup_code_wrong");
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
      return { userId, installationName: input.installationName, email: input.email };
    });
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
