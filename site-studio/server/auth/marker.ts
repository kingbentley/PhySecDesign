import { MARKER_MAX_AGE_MS, MARKER_MAX_AGE_SECONDS } from "../../shared/signin";
import { COOKIE_PREFIX, fromBase64Url, randomHex, toBase64Url, toHex } from "./session";

// The browser marker (story 1.3, D-3, A-5, D-2 amended, V-1).
//
// After a successful sign-in the browser gets `__Host-ssd-m-<identifier>`, holding the account's
// identifier, a random marker identifier (the key of the marker's own failure count) and an expiry,
// signed with HMAC-SHA-256 under a random key kept in the installation object. It lasts 1 year, is
// renewed at each sign-in and kept on sign-out; a browser holds one per installation, for the
// account last signed in there. A valid marker for the entered email skips that email's wait but
// not its count. A marker that is expired, malformed, badly signed or for another account counts
// as no marker.
//
// The value is `v1.<account id>.<marker id>.<expiry ms>.<signature>`, the signature being base64url
// HMAC-SHA-256 of everything before its dot.

const VERSION = "v1";
const ACCOUNT_ID = /^[0-9a-f-]{36}$/;
const MARKER_ID = /^[0-9a-f]{32}$/;
const EXPIRY = /^[1-9][0-9]{0,15}$/;
const SIGNATURE = /^[A-Za-z0-9_-]{43}$/;
export const MARKER_ID_BYTES = 16;
/** The HMAC keys kept in the installation object: 32 random bytes each. */
export const HMAC_KEY_BYTES = 32;

const encoder = new TextEncoder();

export interface Marker {
  accountId: string;
  markerId: string;
  /** Milliseconds since the epoch. */
  expiresAt: number;
}

export function markerCookieName(identifier: string): string {
  return `${COOKIE_PREFIX}m-${identifier}`;
}

/** The marker cookie: `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, 1 year, no `Domain`. */
export function markerCookieLine(identifier: string, value: string): string {
  return `${markerCookieName(identifier)}=${value}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${MARKER_MAX_AGE_SECONDS}`;
}

export function newMarkerId(): string {
  return randomHex(MARKER_ID_BYTES);
}

export function importHmacKey(raw: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", raw, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function hmacHex(key: CryptoKey, text: string): Promise<string> {
  return toHex(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(text))));
}

/** Signs a marker valid for 1 year from `now`. */
export async function makeMarker(key: CryptoKey, accountId: string, markerId: string, now: number): Promise<string> {
  const body = `${VERSION}.${accountId}.${markerId}.${now + MARKER_MAX_AGE_MS}`;
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(body)));
  return `${body}.${toBase64Url(signature)}`;
}

/** Reads a marker, or answers null when it is malformed, badly signed or expired at `now`. */
export async function readMarker(key: CryptoKey, value: string, now: number): Promise<Marker | null> {
  const parts = value.split(".");
  if (parts.length !== 5) return null;
  const [version, accountId, markerId, expiry, signature] = parts as [string, string, string, string, string];
  if (version !== VERSION || !ACCOUNT_ID.test(accountId) || !MARKER_ID.test(markerId) || !EXPIRY.test(expiry) || !SIGNATURE.test(signature)) {
    return null;
  }
  let signatureBytes: Uint8Array;
  try {
    signatureBytes = fromBase64Url(signature);
  } catch {
    return null;
  }
  const body = `${version}.${accountId}.${markerId}.${expiry}`;
  // crypto.subtle.verify compares in constant time.
  const valid = await crypto.subtle.verify("HMAC", key, signatureBytes, encoder.encode(body));
  if (!valid) return null;
  const expiresAt = Number(expiry);
  if (!(expiresAt > now)) return null;
  return { accountId, markerId, expiresAt };
}
