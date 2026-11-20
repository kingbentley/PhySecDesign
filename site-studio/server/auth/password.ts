import { scrypt } from "node:crypto";

// Password hashing (AD-12, K19, NFR-5): salted scrypt with N = 131,072, r = 8, p = 1 and a 32-byte
// result, through the runtime's Node.js-compatible crypto (`nodejs_compat` on both hosts). The
// parameters are stored beside the hash so that they can be strengthened later.
//
// Memory: scrypt needs 128 · N · r bytes, 128 MiB here, above Node's default limit of 32 MiB, so
// `maxmem` is raised. 256 MiB is a ceiling, not an allocation; it is the value experiment R9 used
// on both hosts. A Worker has 128 MB of memory, so the set-up flow hashes only after the set-up
// code is accepted (at most one hash per accepted attempt); two hashes at once on Cloudflare are
// checked in story 1.2's deployed acceptance (spec 4).

export const PASSWORD_HASH_ALGORITHM = "scrypt";
export const SCRYPT_N = 131_072;
export const SCRYPT_R = 8;
export const SCRYPT_P = 1;
export const SCRYPT_KEY_LENGTH = 32;
export const SCRYPT_SALT_BYTES = 16;
export const SCRYPT_MAXMEM = 256 * 1024 * 1024;

/** A stored password hash with its parameters. `salt` and `hash` are base64. */
export interface PasswordHash {
  algorithm: typeof PASSWORD_HASH_ALGORITHM;
  n: number;
  r: number;
  p: number;
  keyLength: number;
  salt: string;
  hash: string;
}

export function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function fromBase64(text: string): Uint8Array {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function derive(password: string, salt: Uint8Array, n: number, r: number, p: number, keyLength: number): Promise<Uint8Array> {
  const passwordBytes = new TextEncoder().encode(password);
  return new Promise((resolve, reject) => {
    scrypt(passwordBytes, salt, keyLength, { N: n, r, p, maxmem: SCRYPT_MAXMEM }, (error, key) => {
      if (error) reject(error);
      else resolve(new Uint8Array(key));
    });
  });
}

/** A hash made with the current parameters: what the installation object accepts at set-up. */
export interface CurrentPasswordHash extends PasswordHash {
  n: typeof SCRYPT_N;
  r: typeof SCRYPT_R;
  p: typeof SCRYPT_P;
  keyLength: typeof SCRYPT_KEY_LENGTH;
}

/** Hashes a password with a fresh random salt and the current parameters. */
export async function hashPassword(password: string): Promise<CurrentPasswordHash> {
  const salt = crypto.getRandomValues(new Uint8Array(SCRYPT_SALT_BYTES));
  const key = await derive(password, salt, SCRYPT_N, SCRYPT_R, SCRYPT_P, SCRYPT_KEY_LENGTH);
  return {
    algorithm: PASSWORD_HASH_ALGORITHM,
    n: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    keyLength: SCRYPT_KEY_LENGTH,
    salt: toBase64(salt),
    hash: toBase64(key),
  };
}

/** Constant-time equality of two byte strings; unequal lengths are simply unequal. */
export function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) return false;
  return crypto.subtle.timingSafeEqual(a, b);
}

/** Checks a password against a stored hash, using the parameters stored with it. */
export async function verifyPassword(password: string, stored: PasswordHash): Promise<boolean> {
  if (stored.algorithm !== PASSWORD_HASH_ALGORITHM) return false;
  const expected = fromBase64(stored.hash);
  const key = await derive(password, fromBase64(stored.salt), stored.n, stored.r, stored.p, stored.keyLength);
  return bytesEqual(key, expected);
}
