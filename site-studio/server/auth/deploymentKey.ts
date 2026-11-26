import { fromBase64Url, toBase64Url, toHex } from "./session";

// The deployment key and the cipher (story 1.5, D-14, AD-17).
//
// The key is 32 random bytes, base64url without padding (43 characters), in the Worker secret
// `DEPLOYMENT_KEY`. Anything else, an empty string or `null` included, is no key (finding 30).
// HKDF-SHA-256 with an empty salt derives from it, under two different infos, the AES-256-GCM key
// that encrypts stored secrets and a 32-byte fingerprint (64 hex digits) that the installation
// object stores with its first encrypted value (D-15). The fingerprint reveals nothing usable about
// the key. Values are stored as `v1.<base64url IV>.<base64url ciphertext>`, with a random 12-byte IV
// and associated data naming the record, so a ciphertext cannot be moved to another record.
//
// Nothing here logs, and no function answers the key or its bytes.

export const DEPLOYMENT_KEY_BYTES = 32;
const KEY_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const ENCRYPTION_INFO = "site-survey-design/encryption/v1";
const FINGERPRINT_INFO = "site-survey-design/fingerprint/v1";
const FINGERPRINT_BITS = 256;
const IV_BYTES = 12;
const VALUE_PREFIX = "v1";
const BASE64URL = /^[A-Za-z0-9_-]+$/;

const encoder = new TextEncoder();

/**
 * The key's bytes when `value` is a deployment key, else null: 43 base64url characters decoding
 * to 32 bytes, spelled the one way base64url spells them.
 */
export function parseDeploymentKey(value: unknown): Uint8Array | null {
  if (typeof value !== "string" || !KEY_PATTERN.test(value)) return null;
  let bytes: Uint8Array;
  try {
    bytes = fromBase64Url(value);
  } catch {
    return null;
  }
  if (bytes.byteLength !== DEPLOYMENT_KEY_BYTES || toBase64Url(bytes) !== value) return null;
  return bytes;
}

function hkdf(info: string) {
  return { name: "HKDF", hash: "SHA-256", salt: new Uint8Array(0), info: encoder.encode(info) } as const;
}

function importBase(keyBytes: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", keyBytes, "HKDF", false, ["deriveKey", "deriveBits"]);
}

/** The key's fingerprint: HKDF-SHA-256 with info `site-survey-design/fingerprint/v1`, 32 bytes as 64 hex digits. */
export async function deploymentKeyFingerprint(keyBytes: Uint8Array): Promise<string> {
  const bits = await crypto.subtle.deriveBits(hkdf(FINGERPRINT_INFO), await importBase(keyBytes), FINGERPRINT_BITS);
  return toHex(new Uint8Array(bits));
}

/** The AES-256-GCM key: HKDF-SHA-256 with info `site-survey-design/encryption/v1`, not extractable. */
export async function deriveEncryptionKey(keyBytes: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(hkdf(ENCRYPTION_INFO), await importBase(keyBytes), { name: "AES-GCM", length: 256 }, false, [
    "encrypt",
    "decrypt",
  ]);
}

/** Encrypts `plaintext` under `key` with `associatedData`, as `v1.<base64url IV>.<base64url ciphertext>`. */
export async function encryptValue(key: CryptoKey, plaintext: Uint8Array, associatedData: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: encoder.encode(associatedData) }, key, plaintext);
  return `${VALUE_PREFIX}.${toBase64Url(iv)}.${toBase64Url(new Uint8Array(ciphertext))}`;
}

/**
 * Decrypts a stored value, or answers null when it is refused: another prefix or shape, a bad tag,
 * another key or other associated data.
 */
export async function decryptValue(key: CryptoKey, value: string, associatedData: string): Promise<Uint8Array | null> {
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [prefix, ivText, ciphertextText] = parts as [string, string, string];
  if (prefix !== VALUE_PREFIX || !BASE64URL.test(ivText) || !BASE64URL.test(ciphertextText)) return null;
  let iv: Uint8Array;
  let ciphertext: Uint8Array;
  try {
    iv = fromBase64Url(ivText);
    ciphertext = fromBase64Url(ciphertextText);
  } catch {
    return null;
  }
  if (iv.byteLength !== IV_BYTES) return null;
  try {
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv, additionalData: encoder.encode(associatedData) }, key, ciphertext);
    return new Uint8Array(plaintext);
  } catch {
    return null;
  }
}
