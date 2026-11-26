import { z } from "zod";
import {
  base32Encode,
  codeField,
  formatRecoveryCode,
  otpauthUri,
  RECOVERY_CODE_ALPHABET,
  RECOVERY_CODE_COUNT,
  RECOVERY_CODE_LENGTH,
  setupIdField,
  TOTP_SECRET_BYTES,
  TWO_STEP_SETUP_TTL_MS,
} from "../../shared/twoStep";
import { SIGNIN_TICKET_TTL_MS } from "../../shared/signin";
import { PASSWORD_HASH_ALGORITHM, type PasswordHash } from "../auth/password";
import { randomHex, sha256Hex } from "../auth/session";
import { matchingStep } from "../auth/totp";
import { OperationRefusal } from "../objects/ObjectBase";
import { deploymentKeyField, type KeyGuard, type KeyStatus, type PendingEncryption } from "./keyGuard";
import { SETTINGS_TABLE, USERS_TABLE } from "./setupStore";
import { cookiesField, hashIdentity, type SignInStore, type TwoStepAccess } from "./signInStore";

// Two-step storage in the installation object (story 1.5, spec 2: D-5, D-6, D-9, D-10, D-12, D-15,
// D-22). Tables are created if absent under data format 1 (standing rule 8).
//
// - `two_step`: one row per account with two-step verification on: the authenticator secret as
//   `v1.` ciphertext under the deployment key with associated data `two-step:<account id>`, the last
//   accepted time step (D-6) and the time it was turned on.
// - `two_step_setups`: at most one unconfirmed set-up per account: a random set-up identifier (not
//   secret), the secret encrypted with associated data `two-step-setup:<account id>`, and an indexed
//   expiry 10 minutes after the start (D-10). Starting again replaces it.
// - `recovery_codes`: the SHA-256 of each normalised recovery code (D-9), never a code.
// - `account_check_tickets`: the counted password check of an account action (D-5). Like a sign-in
//   ticket it binds the account, the presented session's hash, the email key, the address failure
//   row, the counted marker and the stored hash's identity, plus the purpose; it lasts 5 minutes.
//
// Every operation identifies the account from this installation's session cookie as a live session
// (`liveSessionAccount`); none is `not_signed_in`. The deployment key arrives only in an operation's
// input (D-22) and only the key guard handles it.
//
// An account action (turn on, turn off, fresh codes) is two calls. `accountCheck` refuses before
// counting when the action cannot apply (already on, off, no usable key), then counts exactly as a
// sign-in attempt (SignInStore.countAttempt) and answers the stored hash and a ticket; the Worker
// checks the password through the hash queue and completes with the outcome. The completion
// consumes the ticket whatever the outcome; a ticket of another purpose, session or stored hash, or
// a failure, is `two_step_password_wrong` with the counts left raised. Counts clear only when the
// whole action succeeds.
//
// Each operation does its cryptography first (random bytes, encryption, decryption, candidate codes,
// code hashes), then one synchronous step that re-reads every row it decides on before writing
// (finding 18). Expired set-ups and tickets are pruned at most TWO_STEP_PRUNE_BATCH per table: by a
// successful check or confirm, in its deciding step (a refused one rolls its pruning back), and by
// every completion whatever its outcome, in the step that consumes the ticket. Nothing here logs;
// no refusal carries a value.

export const TWO_STEP_TABLE = "two_step";
export const TWO_STEP_SETUPS_TABLE = "two_step_setups";
export const RECOVERY_CODES_TABLE = "recovery_codes";
export const ACCOUNT_CHECK_TICKETS_TABLE = "account_check_tickets";
export const TWO_STEP_TABLES = [TWO_STEP_TABLE, TWO_STEP_SETUPS_TABLE, RECOVERY_CODES_TABLE, ACCOUNT_CHECK_TICKETS_TABLE] as const;

/** The most expired rows deleted from one table by one write. */
export const TWO_STEP_PRUNE_BATCH = 20;
/** How long an account check's ticket lasts: as a sign-in ticket, 5 minutes. */
export const ACCOUNT_CHECK_TTL_MS = SIGNIN_TICKET_TTL_MS;
const TICKET_BYTES = 32;
const SETUP_ID_BYTES = 16;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS ${TWO_STEP_TABLE} (
     account_id TEXT PRIMARY KEY,
     secret_ciphertext TEXT NOT NULL,
     last_step INTEGER NOT NULL,
     turned_on_at INTEGER NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS ${TWO_STEP_SETUPS_TABLE} (
     account_id TEXT PRIMARY KEY,
     setup_id TEXT NOT NULL,
     secret_ciphertext TEXT NOT NULL,
     expires_at INTEGER NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS two_step_setups_expires_at ON ${TWO_STEP_SETUPS_TABLE} (expires_at)`,
  `CREATE TABLE IF NOT EXISTS ${RECOVERY_CODES_TABLE} (
     code_hash TEXT PRIMARY KEY,
     account_id TEXT NOT NULL,
     made_at INTEGER NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS recovery_codes_account_id ON ${RECOVERY_CODES_TABLE} (account_id)`,
  `CREATE TABLE IF NOT EXISTS ${ACCOUNT_CHECK_TICKETS_TABLE} (
     ticket TEXT PRIMARY KEY,
     account_id TEXT NOT NULL,
     session_hash TEXT NOT NULL,
     email_key TEXT NOT NULL,
     address_failure_id INTEGER,
     marker_id TEXT,
     hash_identity TEXT NOT NULL,
     purpose TEXT NOT NULL CHECK (purpose IN ('turn_on', 'turn_off', 'fresh_codes')),
     expires_at INTEGER NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS account_check_tickets_expires_at ON ${ACCOUNT_CHECK_TICKETS_TABLE} (expires_at)`,
];

const addressField = z.string().min(1).max(100);
const ticketField = z.string().regex(/^[0-9a-f]{64}$/);
const outcomeField = z.enum(["success", "failure"]);
export const accountCheckPurposeField = z.enum(["turn_on", "turn_off", "fresh_codes"]);
export type AccountCheckPurpose = z.infer<typeof accountCheckPurposeField>;

export const twoStepStateInput = z.object({ cookies: cookiesField, deploymentKey: deploymentKeyField }).strict();
export const accountCheckInput = z
  .object({ cookies: cookiesField, address: addressField, purpose: accountCheckPurposeField, deploymentKey: deploymentKeyField })
  .strict();
export const startTwoStepInput = z
  .object({ cookies: cookiesField, ticket: ticketField, outcome: outcomeField, deploymentKey: deploymentKeyField })
  .strict();
export const confirmTwoStepInput = z
  .object({ cookies: cookiesField, setupId: setupIdField, code: codeField, deploymentKey: deploymentKeyField })
  .strict();
export const turnOffTwoStepInput = z.object({ cookies: cookiesField, ticket: ticketField, outcome: outcomeField }).strict();
export const renewRecoveryCodesInput = z
  .object({ cookies: cookiesField, ticket: ticketField, outcome: outcomeField, code: codeField, deploymentKey: deploymentKeyField })
  .strict();

export type TwoStepAvailability = "available" | "no_key" | "key_mismatch";

/** The signed-in account's two-step state (D-12). */
export interface TwoStepState {
  enabled: boolean;
  recoveryCodesRemaining: number;
  availability: TwoStepAvailability;
  email: string;
}

/** What a counted account check answers the Worker: the stored hash to check and the ticket. */
export interface AccountCheckCounted {
  ticket: string;
  passwordHash: PasswordHash;
}

/** What a started set-up answers (D-10, D-12): the only reply that holds the secret. */
export interface TwoStepStarted {
  setupId: string;
  /** RFC 4648 base32 without padding, 32 characters. Never logged. */
  secret: string;
  otpauthUri: string;
  installationName: string;
  email: string;
}

/** A new set of recovery codes, formatted, answered once (confirm and fresh codes). */
export interface RecoveryCodesMade {
  recoveryCodes: string[];
}

export interface TwoStepTurnedOff {
  enabled: false;
}

interface SessionAccountRow {
  id: string;
  email: string;
  password_algorithm: string;
  password_n: number;
  password_r: number;
  password_p: number;
  password_key_length: number;
  password_salt: string;
  password_hash: string;
}

interface TicketRow {
  account_id: string;
  session_hash: string;
  email_key: string;
  address_failure_id: number | null;
  marker_id: string | null;
  hash_identity: string;
  purpose: AccountCheckPurpose;
}

function availabilityOf(status: KeyStatus): TwoStepAvailability {
  if (status === "ready") return "available";
  if (status === "none") return "no_key";
  return "key_mismatch";
}

/** The refusal for a status that does not allow encrypting or decrypting, or null when it does. */
function keyRefusal(status: KeyStatus): OperationRefusal | null {
  if (status === "none") return new OperationRefusal("deployment_key_missing");
  if (status === "missing" || status === "mismatch") return new OperationRefusal("deployment_key_mismatch");
  return null;
}

/** A recovery code: 16 random characters of Crockford's base32 in lower case (80 bits, D-9). */
function newRecoveryCode(): string {
  // 256 is a multiple of 32, so the low five bits of each byte are uniform.
  const bytes = crypto.getRandomValues(new Uint8Array(RECOVERY_CODE_LENGTH));
  let code = "";
  for (const byte of bytes) code += RECOVERY_CODE_ALPHABET[byte & 31];
  return code;
}

/** The SHA-256 a recovery code is stored as: of the normalised code, 64 hex digits. */
export function recoveryCodeHash(normalisedCode: string): Promise<string> {
  return sha256Hex(normalisedCode);
}

/** A new set of recovery codes and their hashes, made before the synchronous step that stores them. */
async function newRecoveryCodeSet(): Promise<{ codes: string[]; hashes: string[] }> {
  const codes = new Set<string>();
  while (codes.size < RECOVERY_CODE_COUNT) codes.add(newRecoveryCode());
  const list = [...codes];
  return { codes: list, hashes: await Promise.all(list.map(recoveryCodeHash)) };
}

/** Catches a key refusal from the key guard so it can be raised after the ticket is consumed. */
async function keyAttempt<T>(run: () => Promise<T>): Promise<{ value: T } | { refusal: OperationRefusal }> {
  try {
    return { value: await run() };
  } catch (error) {
    if (error instanceof OperationRefusal && (error.code === "deployment_key_missing" || error.code === "deployment_key_mismatch")) {
      return { refusal: error };
    }
    throw error;
  }
}

export class TwoStepStore implements TwoStepAccess {
  constructor(
    private readonly storage: DurableObjectStorage,
    private readonly signIn: SignInStore,
    private readonly keyGuard: KeyGuard,
  ) {
    for (const statement of SCHEMA) storage.sql.exec(statement);
  }

  private get sql(): SqlStorage {
    return this.storage.sql;
  }

  /** Deletes expired set-ups and tickets, at most TWO_STEP_PRUNE_BATCH per table, oldest first. */
  private prune(now: number): void {
    for (const table of [TWO_STEP_SETUPS_TABLE, ACCOUNT_CHECK_TICKETS_TABLE]) {
      this.sql.exec(
        `DELETE FROM ${table} WHERE rowid IN (SELECT rowid FROM ${table} WHERE expires_at <= ? ORDER BY expires_at LIMIT ?)`,
        now,
        TWO_STEP_PRUNE_BATCH,
      );
    }
  }

  /** The live session's account with its email and stored hash, or null. Synchronous and read-only. */
  private sessionAccount(tokenHash: string | null, now: number): SessionAccountRow | null {
    const live = this.signIn.liveSessionAccount(tokenHash, now);
    if (!live) return null;
    return (
      this.sql
        .exec<SessionAccountRow & Record<string, SqlStorageValue>>(
          `SELECT id, email, password_algorithm, password_n, password_r, password_p, password_key_length, password_salt, password_hash
             FROM ${USERS_TABLE} WHERE id = ?`,
          live.id,
        )
        .toArray()[0] ?? null
    );
  }

  private twoStepRow(accountId: string): { secret_ciphertext: string; last_step: number } | null {
    return (
      this.sql
        .exec<{ secret_ciphertext: string; last_step: number }>(`SELECT secret_ciphertext, last_step FROM ${TWO_STEP_TABLE} WHERE account_id = ?`, accountId)
        .toArray()[0] ?? null
    );
  }

  // The sign-in store's access to these rows for the second sign-in step (story 1.5, spec 3).

  /** Synchronous: the account's `two_step` row, or null when two-step verification is off. */
  secretRow(accountId: string): { secretCiphertext: string; lastStep: number } | null {
    const row = this.twoStepRow(accountId);
    return row ? { secretCiphertext: row.secret_ciphertext, lastStep: row.last_step } : null;
  }

  /** Decrypts the account's `two_step` ciphertext under the key guard (associated data `two-step:<account id>`). */
  decryptSecret(deploymentKey: string | null | undefined, ciphertext: string, accountId: string): Promise<Uint8Array | null> {
    return this.keyGuard.decrypt(deploymentKey, ciphertext, `two-step:${accountId}`);
  }

  /** Synchronous: sets the account's last accepted step (D-6). */
  setLastStep(accountId: string, step: number): void {
    this.sql.exec(`UPDATE ${TWO_STEP_TABLE} SET last_step = ? WHERE account_id = ?`, step, accountId);
  }

  /** Synchronous: deletes the account's recovery code with this hash, once (`DELETE … RETURNING`). */
  useRecoveryCode(accountId: string, codeHash: string): boolean {
    return (
      this.sql.exec(`DELETE FROM ${RECOVERY_CODES_TABLE} WHERE code_hash = ? AND account_id = ? RETURNING code_hash`, codeHash, accountId).toArray()
        .length > 0
    );
  }

  private liveSetup(accountId: string, now: number): { setup_id: string; secret_ciphertext: string } | null {
    return (
      this.sql
        .exec<{ setup_id: string; secret_ciphertext: string }>(
          `SELECT setup_id, secret_ciphertext FROM ${TWO_STEP_SETUPS_TABLE} WHERE account_id = ? AND expires_at > ?`,
          accountId,
          now,
        )
        .toArray()[0] ?? null
    );
  }

  private recoveryCodesRemaining(accountId: string): number {
    return this.sql.exec<{ n: number }>(`SELECT COUNT(*) AS n FROM ${RECOVERY_CODES_TABLE} WHERE account_id = ?`, accountId).one().n;
  }

  private installationName(): string {
    const row = this.sql.exec<{ installation_name: string }>(`SELECT installation_name FROM ${SETTINGS_TABLE} WHERE id = 1`).toArray()[0];
    if (!row) throw new Error("The installation has an account but no settings row.");
    return row.installation_name;
  }

  /** Replaces the account's recovery codes with a new set of hashes. Synchronous. */
  private storeRecoveryCodes(accountId: string, hashes: string[], now: number): void {
    this.sql.exec(`DELETE FROM ${RECOVERY_CODES_TABLE} WHERE account_id = ?`, accountId);
    for (const hash of hashes) {
      this.sql.exec(`INSERT INTO ${RECOVERY_CODES_TABLE} (code_hash, account_id, made_at) VALUES (?, ?, ?)`, hash, accountId, now);
    }
  }

  /**
   * Consumes a ticket in its own synchronous step, so it is gone whatever follows, and prunes in
   * the same committed step, so a refused completion still prunes.
   */
  private consumeTicket(ticket: string, now: number): TicketRow | null {
    return this.storage.transactionSync(() => {
      this.prune(now);
      return (
        this.sql
          .exec<TicketRow & Record<string, SqlStorageValue>>(
            `DELETE FROM ${ACCOUNT_CHECK_TICKETS_TABLE} WHERE ticket = ? AND expires_at > ?
             RETURNING account_id, session_hash, email_key, address_failure_id, marker_id, hash_identity, purpose`,
            ticket,
            now,
          )
          .toArray()[0] ?? null
      );
    });
  }

  /**
   * Synchronous, inside the deciding step: the live session's account when the consumed ticket
   * matches the purpose, the same live session and the same stored hash, and the outcome is
   * success. No live session is `not_signed_in`; any other fault is `two_step_password_wrong`.
   */
  private checkedAccount(
    row: TicketRow | null,
    purpose: AccountCheckPurpose,
    outcome: "success" | "failure",
    tokenHash: string | null,
    now: number,
  ): SessionAccountRow {
    const account = this.sessionAccount(tokenHash, now);
    if (!account) throw new OperationRefusal("not_signed_in");
    if (
      !row ||
      outcome !== "success" ||
      row.purpose !== purpose ||
      row.session_hash !== tokenHash ||
      row.account_id !== account.id ||
      row.hash_identity !== hashIdentity(account)
    ) {
      throw new OperationRefusal("two_step_password_wrong");
    }
    return account;
  }

  private clearCounts(row: TicketRow): void {
    this.signIn.clearCounts({ emailKey: row.email_key, markerId: row.marker_id, addressFailureId: row.address_failure_id });
  }

  /** The signed-in account's two-step state (D-12). Writes nothing. */
  async twoStepState(input: z.output<typeof twoStepStateInput>, now: number): Promise<TwoStepState> {
    const { tokenHash } = await this.signIn.presentedSession(input.cookies);
    const status = await this.keyGuard.keyStatus(input.deploymentKey);
    const account = this.sessionAccount(tokenHash, now);
    if (!account) throw new OperationRefusal("not_signed_in");
    const enabled = this.twoStepRow(account.id) !== null;
    return {
      enabled,
      recoveryCodesRemaining: enabled ? this.recoveryCodesRemaining(account.id) : 0,
      availability: availabilityOf(status),
      email: account.email,
    };
  }

  /**
   * Counts the password check of an account action (D-5) and answers the stored hash and a ticket.
   * Refuses before counting: `not_signed_in`; `two_step_already_on` (turn on while on);
   * `two_step_off` (turn off or fresh codes while off); for turn on and fresh codes,
   * `deployment_key_missing` or `deployment_key_mismatch` (finding 14); then `signin_wait` while a
   * wait applies to the account's email, the browser's usable marker or the known address.
   */
  async accountCheck(input: z.output<typeof accountCheckInput>, now: number): Promise<AccountCheckCounted> {
    // Cryptography and reads that need no deciding first.
    const { tokenHash } = await this.signIn.presentedSession(input.cookies);
    const before = this.sessionAccount(tokenHash, now);
    if (!before || tokenHash === null) throw new OperationRefusal("not_signed_in");
    const status = input.purpose === "turn_off" ? null : await this.keyGuard.keyStatus(input.deploymentKey);
    const { emailKey, marker } = await this.signIn.countingInputs(before.email, input.cookies, now);
    const ticket = randomHex(TICKET_BYTES);

    // From here to the return there is no await: the checks, the counting and the ticket are one step.
    return this.storage.transactionSync(() => {
      this.prune(now);
      const account = this.sessionAccount(tokenHash, now);
      // The email key was computed for the email read before; a changed email is a changed account.
      if (!account || account.id !== before.id || account.email !== before.email) throw new OperationRefusal("not_signed_in");
      const on = this.twoStepRow(account.id) !== null;
      if (input.purpose === "turn_on" && on) throw new OperationRefusal("two_step_already_on");
      if (input.purpose !== "turn_on" && !on) throw new OperationRefusal("two_step_off");
      const refusal = status === null ? null : keyRefusal(status);
      if (refusal) throw refusal;

      const markerId = marker && marker.accountId === account.id ? marker.markerId : null;
      const counted = this.signIn.countAttempt({ emailKey, markerId, address: input.address }, now);
      this.sql.exec(
        `INSERT INTO ${ACCOUNT_CHECK_TICKETS_TABLE} (ticket, account_id, session_hash, email_key, address_failure_id, marker_id,
           hash_identity, purpose, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ticket,
        account.id,
        tokenHash,
        emailKey,
        counted.addressFailureId,
        counted.usableMarker,
        hashIdentity(account),
        input.purpose,
        now + ACCOUNT_CHECK_TTL_MS,
      );
      return {
        ticket,
        passwordHash: {
          algorithm: account.password_algorithm as typeof PASSWORD_HASH_ALGORITHM,
          n: account.password_n,
          r: account.password_r,
          p: account.password_p,
          keyLength: account.password_key_length,
          salt: account.password_salt,
          hash: account.password_hash,
        },
      };
    });
  }

  /**
   * Starts a set-up after a correct password (ticket purpose `turn_on`): a new 20-byte secret,
   * encrypted, under a new set-up identifier, replacing any earlier set-up, for 10 minutes (D-10).
   * Clears the counts. Answers the only reply that holds the secret.
   */
  async startTwoStep(input: z.output<typeof startTwoStepInput>, now: number): Promise<TwoStepStarted> {
    const { tokenHash } = await this.signIn.presentedSession(input.cookies);
    const before = this.sessionAccount(tokenHash, now);
    const secret = crypto.getRandomValues(new Uint8Array(TOTP_SECRET_BYTES));
    const setupId = randomHex(SETUP_ID_BYTES);
    // Encrypting is attempted only for a success from a live session; its refusal waits until the
    // ticket is consumed and checked, so a wrong password still reads as one.
    const encrypted: { value: PendingEncryption } | { refusal: OperationRefusal } | null =
      before && input.outcome === "success"
        ? await keyAttempt(() => this.keyGuard.encrypt(input.deploymentKey, secret, `two-step-setup:${before.id}`))
        : null;

    const row = this.consumeTicket(input.ticket, now);
    return this.storage.transactionSync(() => {
      const account = this.checkedAccount(row, "turn_on", input.outcome, tokenHash, now);
      if (!encrypted || !before || before.id !== account.id) throw new OperationRefusal("two_step_password_wrong");
      if (this.twoStepRow(account.id) !== null) throw new OperationRefusal("two_step_already_on");
      if ("refusal" in encrypted) throw encrypted.refusal;
      const installationName = this.installationName();
      encrypted.value.commit();
      this.sql.exec(`DELETE FROM ${TWO_STEP_SETUPS_TABLE} WHERE account_id = ?`, account.id);
      this.sql.exec(
        `INSERT INTO ${TWO_STEP_SETUPS_TABLE} (account_id, setup_id, secret_ciphertext, expires_at) VALUES (?, ?, ?, ?)`,
        account.id,
        setupId,
        encrypted.value.value,
        now + TWO_STEP_SETUP_TTL_MS,
      );
      this.clearCounts(row!);
      const text = base32Encode(secret);
      return {
        setupId,
        secret: text,
        otpauthUri: otpauthUri({ secret: text, installationName, email: account.email }),
        installationName,
        email: account.email,
      };
    });
  }

  /**
   * Confirms a live set-up with its identifier and a current code (not counted, D-5): turns
   * two-step verification on with the secret re-encrypted for the account and the matched step as
   * the last accepted one, and stores 10 new recovery codes' hashes (D-9). Answers the codes once.
   * Refuses `two_step_already_on`, `two_step_setup_expired` (expired, replaced or changed since it
   * was read), `two_step_code_wrong` (the set-up kept) or a key refusal.
   */
  async confirmTwoStep(input: z.output<typeof confirmTwoStepInput>, now: number): Promise<RecoveryCodesMade> {
    const { tokenHash } = await this.signIn.presentedSession(input.cookies);
    const before = this.sessionAccount(tokenHash, now);
    if (!before) throw new OperationRefusal("not_signed_in");
    if (this.twoStepRow(before.id) !== null) throw new OperationRefusal("two_step_already_on");
    const setup = this.liveSetup(before.id, now);
    if (!setup || setup.setup_id !== input.setupId) throw new OperationRefusal("two_step_setup_expired");

    const secret = await this.keyGuard.decrypt(input.deploymentKey, setup.secret_ciphertext, `two-step-setup:${before.id}`);
    if (!secret) throw new OperationRefusal("two_step_setup_expired");
    const matched = await matchingStep(secret, input.code, now);
    if (matched === null) throw new OperationRefusal("two_step_code_wrong");
    const encrypted = await this.keyGuard.encrypt(input.deploymentKey, secret, `two-step:${before.id}`);
    const { codes, hashes } = await newRecoveryCodeSet();

    // From here to the return there is no await: every row decided on is read again.
    return this.storage.transactionSync(() => {
      this.prune(now);
      const account = this.sessionAccount(tokenHash, now);
      if (!account || account.id !== before.id) throw new OperationRefusal("not_signed_in");
      if (this.twoStepRow(account.id) !== null) throw new OperationRefusal("two_step_already_on");
      const current = this.liveSetup(account.id, now);
      if (!current || current.setup_id !== input.setupId || current.secret_ciphertext !== setup.secret_ciphertext) {
        throw new OperationRefusal("two_step_setup_expired");
      }
      encrypted.commit();
      this.sql.exec(`DELETE FROM ${TWO_STEP_SETUPS_TABLE} WHERE account_id = ?`, account.id);
      this.sql.exec(
        `INSERT INTO ${TWO_STEP_TABLE} (account_id, secret_ciphertext, last_step, turned_on_at) VALUES (?, ?, ?, ?)`,
        account.id,
        encrypted.value,
        matched,
        now,
      );
      this.storeRecoveryCodes(account.id, hashes, now);
      return { recoveryCodes: codes.map(formatRecoveryCode) };
    });
  }

  /**
   * Turns two-step verification off after a correct password (ticket purpose `turn_off`): deletes
   * the secret, any set-up and every recovery code of the account, and clears the counts. Ends no
   * session (D-10). Needs no key, so it works under a key mismatch (D-15).
   */
  async turnOffTwoStep(input: z.output<typeof turnOffTwoStepInput>, now: number): Promise<TwoStepTurnedOff> {
    const { tokenHash } = await this.signIn.presentedSession(input.cookies);
    const row = this.consumeTicket(input.ticket, now);
    return this.storage.transactionSync(() => {
      const account = this.checkedAccount(row, "turn_off", input.outcome, tokenHash, now);
      if (this.twoStepRow(account.id) === null) throw new OperationRefusal("two_step_off");
      this.sql.exec(`DELETE FROM ${TWO_STEP_TABLE} WHERE account_id = ?`, account.id);
      this.sql.exec(`DELETE FROM ${TWO_STEP_SETUPS_TABLE} WHERE account_id = ?`, account.id);
      this.sql.exec(`DELETE FROM ${RECOVERY_CODES_TABLE} WHERE account_id = ?`, account.id);
      this.clearCounts(row!);
      return { enabled: false };
    });
  }

  /**
   * Makes fresh recovery codes after a correct password (ticket purpose `fresh_codes`) and a code
   * of a step later than the last accepted one (D-6): raises the last accepted step, replaces the
   * codes and clears the counts. A wrong or reused code is `two_step_code_wrong` with the counts
   * left raised; so is a `two_step` row changed since it was decrypted (finding 18).
   */
  async renewRecoveryCodes(input: z.output<typeof renewRecoveryCodesInput>, now: number): Promise<RecoveryCodesMade> {
    const { tokenHash } = await this.signIn.presentedSession(input.cookies);
    const before = this.sessionAccount(tokenHash, now);
    const stored = before ? this.twoStepRow(before.id) : null;
    let matched: number | null = null;
    let keyRefused: OperationRefusal | null = null;
    if (before && stored && input.outcome === "success") {
      const decrypted = await keyAttempt(() => this.keyGuard.decrypt(input.deploymentKey, stored.secret_ciphertext, `two-step:${before.id}`));
      if ("refusal" in decrypted) keyRefused = decrypted.refusal;
      else if (decrypted.value) matched = await matchingStep(decrypted.value, input.code, now);
    }
    const { codes, hashes } = await newRecoveryCodeSet();

    const row = this.consumeTicket(input.ticket, now);
    return this.storage.transactionSync(() => {
      const account = this.checkedAccount(row, "fresh_codes", input.outcome, tokenHash, now);
      if (!before || before.id !== account.id) throw new OperationRefusal("two_step_password_wrong");
      const current = this.twoStepRow(account.id);
      if (!current) throw new OperationRefusal("two_step_off");
      if (keyRefused) throw keyRefused;
      // The step is compared with the last accepted one as read now, and the row must be the one decrypted.
      if (!stored || current.secret_ciphertext !== stored.secret_ciphertext || matched === null || matched <= current.last_step) {
        throw new OperationRefusal("two_step_code_wrong");
      }
      this.sql.exec(`UPDATE ${TWO_STEP_TABLE} SET last_step = ? WHERE account_id = ?`, matched, account.id);
      this.storeRecoveryCodes(account.id, hashes, now);
      this.clearCounts(row!);
      return { recoveryCodes: codes.map(formatRecoveryCode) };
    });
  }
}
