import { SESSION_MAX_AGE_SECONDS } from "../../shared/signin";
import { PENDING_SIGNIN_TTL_MS } from "../../shared/twoStep";

// Session tokens and the session cookie (story 1.3, D-1, D-4, E-15, NFR-5).
//
// A token is 32 random bytes, base64url. Only its SHA-256 (64 hex digits) is stored, in the
// installation object's sessions table; the token itself lives only in the browser's cookie and,
// for one request, in the Worker. Its cookie is named with the installation's random identifier,
// `__Host-ssd-<identifier>`, which the installation object creates once and keeps (D-1); no isolate
// keeps the identifier (A-18, E-12). `Secure` is always set, on every host and in local runs (D-10).

/** Every session and marker cookie name starts with this. The Worker passes such cookies on. */
export const COOKIE_PREFIX = "__Host-ssd-";
export const SESSION_TOKEN_BYTES = 32;
/** A 32-byte token as base64url without padding. */
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
/** An installation identifier: 32 lower-case hex digits (16 random bytes). */
export const IDENTIFIER_PATTERN = /^[0-9a-f]{32}$/;
/** A stored token hash: SHA-256 as 64 lower-case hex digits. */
export const TOKEN_HASH_PATTERN = /^[0-9a-f]{64}$/;

const encoder = new TextEncoder();

export function toHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** `count` random bytes as lower-case hex. */
export function randomHex(count: number): string {
  return toHex(crypto.getRandomValues(new Uint8Array(count)));
}

export function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function fromBase64Url(text: string): Uint8Array {
  const padded = text.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (text.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export async function sha256Hex(text: string): Promise<string> {
  return toHex(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(text))));
}

/** A new session token: 32 random bytes, base64url. */
export function newSessionToken(): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(SESSION_TOKEN_BYTES)));
}

/** True when a cookie value has the shape of a session token. Says nothing of whether it is known. */
export function isWellFormedToken(value: string): boolean {
  return TOKEN_PATTERN.test(value);
}

/** What the sessions table stores for a token: its SHA-256 as 64 hex digits. */
export function sessionTokenHash(token: string): Promise<string> {
  return sha256Hex(token);
}

export function sessionCookieName(identifier: string): string {
  return `${COOKIE_PREFIX}${identifier}`;
}

/** The pending sign-in cookie's name (story 1.5, D-2): `__Host-ssd-p-<identifier>`. */
export function pendingCookieName(identifier: string): string {
  return `${COOKIE_PREFIX}p-${identifier}`;
}

/** The pending cookie's lifetime in seconds: the pending sign-in's 5 minutes (CA-46). */
export const PENDING_MAX_AGE_SECONDS = PENDING_SIGNIN_TTL_MS / 1000;

/**
 * The pending sign-in cookie (story 1.5, D-2): the pending token, `HttpOnly`, `Secure`,
 * `SameSite=Strict`, `Path=/`, 5 minutes, no `Domain`. It is never a session.
 */
export function pendingCookieLine(identifier: string, token: string): string {
  return `${pendingCookieName(identifier)}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${PENDING_MAX_AGE_SECONDS}`;
}

/** Clears the pending sign-in cookie with the attributes it was set with. */
export function clearPendingCookieLine(identifier: string): string {
  return `${pendingCookieName(identifier)}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}

/** The session cookie: `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, 30 days, no `Domain`. */
export function sessionCookieLine(identifier: string, token: string): string {
  return `${sessionCookieName(identifier)}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}`;
}

/** Clears the session cookie with the full attributes it was set with (E-15). */
export function clearSessionCookieLine(identifier: string): string {
  return `${sessionCookieName(identifier)}=; Max-Age=0; Path=/; Secure; HttpOnly; SameSite=Lax`;
}

/** The most cookies passed to the installation object from one request. */
export const MAX_PASSED_COOKIES = 64;
export const MAX_COOKIE_NAME = 100;
export const MAX_COOKIE_VALUE = 512;
/**
 * A session, marker or pending cookie name: the prefix, `m-` for a marker or `p-` for a pending
 * sign-in (story 1.5, D-2), and an identifier.
 */
const PASSED_COOKIE_NAME = new RegExp(`^${COOKIE_PREFIX}(?:m-|p-)?${IDENTIFIER_PATTERN.source.slice(1, -1)}$`);

/**
 * The session, marker and pending cookies of a `Cookie` header, the last 64, for the installation
 * object, which uses the ones named with its own identifier.
 */
export function prefixedCookies(header: string | null): Record<string, string> {
  if (!header) return {};
  const matches: [string, string][] = [];
  const seen = new Set<string>();
  for (const part of header.split(";")) {
    const equals = part.indexOf("=");
    if (equals === -1) continue;
    const name = part.slice(0, equals).trim();
    // The first occurrence of a repeated name wins.
    if (!PASSED_COOKIE_NAME.test(name) || seen.has(name)) continue;
    const value = part.slice(equals + 1).trim();
    if (value.length > MAX_COOKIE_VALUE) continue;
    seen.add(name);
    matches.push([name, value]);
  }
  // Browsers send older cookies first, so the last ones are kept: stale cookies of re-created
  // installations cannot push out this installation's live session and marker.
  return Object.fromEntries(matches.slice(-MAX_PASSED_COOKIES));
}
