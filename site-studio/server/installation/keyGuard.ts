import { z } from "zod";
import { deploymentKeyFingerprint, deriveEncryptionKey, decryptValue, encryptValue, parseDeploymentKey } from "../auth/deploymentKey";
import { OperationRefusal } from "../objects/ObjectBase";

// The deployment-key guard in the installation object (story 1.5, D-15, D-18, D-22, CA-52).
//
// The Worker reads `DEPLOYMENT_KEY` from its own `env` and passes it, when it is a non-empty
// string, in the input of each operation that encrypts, decrypts or reports the key's state. The
// object never reads it from its `env`, never stores or logs it, and keeps in memory only the
// AES-GCM key derived from it, keyed by its fingerprint, for the life of the object.
//
// The `deployment_key` table holds one row: the fingerprint of the key the first encrypted value
// was saved with. Every encrypted read and write passes `keyStatus`:
// - `none`: no usable key given, nothing stored. Encrypting is refused `deployment_key_missing`.
// - `ready`: a usable key, and its fingerprint is the stored one or none is stored.
// - `missing`: a fingerprint is stored and no usable key was given.
// - `mismatch`: a fingerprint is stored and another key was given.
// `missing` and `mismatch` refuse encrypting and decrypting with `deployment_key_mismatch`. A key
// that does not parse counts as no key (finding 30).
//
// The fingerprint is stored by the synchronous step of the first encryption, with the value: the
// caller makes the ciphertext first, then, in its own synchronous step, calls `commit()` before it
// writes the value. `commit()` re-reads the row, so of two first encryptions under different keys
// the first stores its fingerprint and the second is refused (finding 18).
//
// The first time after the object starts that the status is `missing` or `mismatch`, one JSON log
// line says so, without key material (wording.md, "Runtime log").

export const DEPLOYMENT_KEY_TABLE = "deployment_key";
/**
 * The Worker's key as an operation receives it: optional, a string of any length or `null`.
 * Anything that does not parse counts as no key (finding 30), never as invalid input.
 */
export const deploymentKeyField = z.string().nullable().optional();
export const deploymentKeyStateInput = z.object({ deploymentKey: deploymentKeyField }).strict();

export type KeyStatus = "none" | "ready" | "missing" | "mismatch";

/** The public key-state read (D-18 as ruled): never the fingerprint or anything derived from the key. */
export interface DeploymentKeyState {
  fingerprint: "none" | "stored";
  key: "none" | "present" | "matches" | "mismatch";
}

/** A value encrypted under the given key, not yet stored. */
export interface PendingEncryption {
  /** `v1.<IV>.<ciphertext>`, to be written by the caller after `commit()`. */
  value: string;
  /**
   * The synchronous step: stores the key's fingerprint if none is stored, or refuses
   * `deployment_key_mismatch` if another one is now stored. Call it inside the step that writes the value.
   */
  commit(): void;
}

interface GivenKey {
  fingerprint: string;
  key: CryptoKey;
}

interface Resolved {
  given: GivenKey | null;
  /** A non-empty string was given that is not a deployment key. */
  malformed: boolean;
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS ${DEPLOYMENT_KEY_TABLE} (
     id INTEGER PRIMARY KEY CHECK (id = 1),
     fingerprint TEXT NOT NULL,
     stored_at INTEGER NOT NULL
   )`,
];

export class KeyGuard {
  /** The derived AES-GCM key of the last key given, keyed by its fingerprint. Never the key itself. */
  private cached: GivenKey | null = null;
  /** Whether this start of the object has written its one log line. */
  private logged = false;

  constructor(private readonly storage: DurableObjectStorage) {
    for (const statement of SCHEMA) storage.sql.exec(statement);
  }

  /** The stored fingerprint, or null before the first encrypted value. */
  storedFingerprint(): string | null {
    return (
      this.storage.sql.exec<{ fingerprint: string }>(`SELECT fingerprint FROM ${DEPLOYMENT_KEY_TABLE} WHERE id = 1`).toArray()[0]
        ?.fingerprint ?? null
    );
  }

  /** Derives the fingerprint and the AES-GCM key of a given value; no storage. */
  private async resolve(deploymentKey: string | null | undefined): Promise<Resolved> {
    const bytes = parseDeploymentKey(deploymentKey);
    if (!bytes) return { given: null, malformed: typeof deploymentKey === "string" && deploymentKey.length > 0 };
    const fingerprint = await deploymentKeyFingerprint(bytes);
    const given = this.cached?.fingerprint === fingerprint ? this.cached : { fingerprint, key: await deriveEncryptionKey(bytes) };
    this.cached = given;
    return { given, malformed: false };
  }

  /** Synchronous: the status of a resolved key against the stored fingerprint, logging the first fault. */
  private classify(resolved: Resolved): KeyStatus {
    const stored = this.storedFingerprint();
    let status: KeyStatus;
    if (stored === null) status = resolved.given ? "ready" : "none";
    else if (!resolved.given) status = "missing";
    else status = resolved.given.fingerprint === stored ? "ready" : "mismatch";
    if (status === "missing" || status === "mismatch") this.logOnce(status, resolved.malformed);
    return status;
  }

  private logOnce(status: "missing" | "mismatch", malformed: boolean): void {
    if (this.logged) return;
    this.logged = true;
    const line: Record<string, string> = { event: `deployment_key_${status}`, object: "installation" };
    if (malformed) line.reason = "malformed";
    console.log(JSON.stringify(line));
  }

  /** The key's status for an operation given `deploymentKey`. Writes nothing. */
  async keyStatus(deploymentKey: string | null | undefined): Promise<KeyStatus> {
    return this.classify(await this.resolve(deploymentKey));
  }

  /** The public key-state read (D-18 as ruled). Writes nothing. */
  async state(deploymentKey: string | null | undefined): Promise<DeploymentKeyState> {
    const resolved = await this.resolve(deploymentKey);
    const status = this.classify(resolved);
    const stored = this.storedFingerprint() !== null;
    if (!resolved.given) return { fingerprint: stored ? "stored" : "none", key: "none" };
    if (!stored) return { fingerprint: "none", key: "present" };
    return { fingerprint: "stored", key: status === "ready" ? "matches" : "mismatch" };
  }

  /** Refuses unless the status lets a value be encrypted or decrypted. */
  private require(status: KeyStatus): void {
    if (status === "none") throw new OperationRefusal("deployment_key_missing");
    if (status !== "ready") throw new OperationRefusal("deployment_key_mismatch");
  }

  /**
   * Encrypts `plaintext` with `associatedData` under the given key. Refuses `deployment_key_missing`
   * (no key, nothing stored) or `deployment_key_mismatch` (missing or other key once one is stored).
   * The caller stores the value only after calling `commit()` in its synchronous step.
   */
  async encrypt(deploymentKey: string | null | undefined, plaintext: Uint8Array, associatedData: string): Promise<PendingEncryption> {
    const resolved = await this.resolve(deploymentKey);
    this.require(this.classify(resolved));
    const given = resolved.given!;
    const value = await encryptValue(given.key, plaintext, associatedData);
    return {
      value,
      commit: () => {
        const stored = this.storedFingerprint();
        if (stored === null) {
          this.storage.sql.exec(
            `INSERT INTO ${DEPLOYMENT_KEY_TABLE} (id, fingerprint, stored_at) VALUES (1, ?, ?)`,
            given.fingerprint,
            Date.now(),
          );
        } else if (stored !== given.fingerprint) {
          this.logOnce("mismatch", false);
          throw new OperationRefusal("deployment_key_mismatch");
        }
      },
    };
  }

  /**
   * Decrypts a stored value under the given key. Refuses as `encrypt` does; answers null when the
   * value itself is refused (another prefix, a bad tag or other associated data).
   */
  async decrypt(deploymentKey: string | null | undefined, value: string, associatedData: string): Promise<Uint8Array | null> {
    const resolved = await this.resolve(deploymentKey);
    this.require(this.classify(resolved));
    return decryptValue(resolved.given!.key, value, associatedData);
  }
}
