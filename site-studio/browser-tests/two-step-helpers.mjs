// Helpers for the two-step verification browser tests (story 1.5, spec 7, finding 15). Kept out of
// any *.spec.mjs file, which Playwright would register as tests. The codes are computed here by an
// RFC 6238 implementation of the tests' own on Node's `crypto`, written independently of shared/
// and the server, from the key the page shows or, for "turn on through the API", from the start
// reply. Nothing here prints or writes a key, a code or a password.
import { createHmac } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";

const APP = { "x-site-survey-design": "1" };
const STEP_SECONDS = 30;
const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** RFC 4648 base32 (either case, spaces ignored, no padding) to bytes. */
export function base32Bytes(text) {
  const clean = text.replace(/\s/g, "").toUpperCase();
  let buffer = 0;
  let bits = 0;
  const bytes = [];
  for (const character of clean) {
    const value = BASE32.indexOf(character);
    if (value < 0) throw new Error("The key is not base32.");
    buffer = (buffer << 5) | value;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >>> bits) & 255);
    }
    buffer &= (1 << bits) - 1;
  }
  return Buffer.from(bytes);
}

/** The time step of `ms` (Unix milliseconds): RFC 6238 with T0 = 0 and X = 30 seconds. */
export function stepAt(ms = Date.now()) {
  return Math.floor(ms / 1000 / STEP_SECONDS);
}

/** The 6-digit code of time step `step` for the base32 `key` (RFC 4226 over RFC 6238, HMAC-SHA-1). */
export function codeForStep(key, step) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const digest = createHmac("sha1", base32Bytes(key)).update(counter).digest();
  const offset = digest[digest.length - 1] & 15;
  const binary = ((digest[offset] & 127) << 24) | (digest[offset + 1] << 16) | (digest[offset + 2] << 8) | digest[offset + 3];
  return String(binary % 1_000_000).padStart(6, "0");
}

/** The current code and its step for `key`. */
export function currentCode(key) {
  const step = stepAt();
  return { step, code: codeForStep(key, step) };
}

/**
 * Waits until the time step is later than `step` (a code accepted at `step` is refused again in
 * the same window, D-6), then answers the current code and its step. At most 30 seconds.
 */
export async function nextCode(key, step) {
  while (stepAt() <= step) await sleep(250);
  return currentCode(key);
}

/** A code that is never valid around now: the one of a step an hour away, unless it happens to match. */
export function wrongCode(key) {
  const now = stepAt();
  const near = new Set([now - 1, now, now + 1].map((step) => codeForStep(key, step)));
  for (let offset = 120; ; offset += 1) {
    const code = codeForStep(key, now + offset);
    if (!near.has(code)) return code;
  }
}

/**
 * Turns two-step verification on through the API for the session `request` holds (a browser
 * context's request shares its cookies). Answers `{ secret, otpauthUri, recoveryCodes, step }`;
 * `step` is the time step of the code that confirmed it.
 */
export async function turnOnThroughApi(request, origin, password) {
  const headers = { origin, ...APP };
  const start = await request.post(`${origin}/api/v1/account/two-step/start`, { headers, data: { password } });
  if (start.status() !== 200) throw new Error(`Starting the set-up through the API answered ${start.status()}.`);
  const { setupId, secret, otpauthUri } = await start.json();
  const { step, code } = currentCode(secret);
  const confirm = await request.post(`${origin}/api/v1/account/two-step/confirm`, { headers, data: { setupId, code } });
  if (confirm.status() !== 200) throw new Error(`Confirming the set-up through the API answered ${confirm.status()}.`);
  const { recoveryCodes } = await confirm.json();
  return { secret, otpauthUri, recoveryCodes, step };
}

/**
 * Signs in with the password and then a recovery code, from a new request context with no cookies
 * (another browser). Answers the second step's status and parsed body; the context is disposed.
 */
export async function signInWithRecoveryCode(playwright, origin, { email, password }, recoveryCode) {
  const api = await playwright.request.newContext({ ignoreHTTPSErrors: true });
  try {
    const headers = { origin, ...APP };
    const first = await api.post(`${origin}/api/v1/session/sign-in`, { headers, data: { email, password } });
    if (first.status() !== 200) throw new Error(`Signing in through the API answered ${first.status()}.`);
    const reply = await first.json();
    if (reply.secondStep !== true) throw new Error("Signing in through the API did not ask for a second step.");
    const second = await api.post(`${origin}/api/v1/session/second-step`, { headers, data: { method: "recovery", code: recoveryCode } });
    let body = null;
    try { body = await second.json(); } catch { body = null; }
    return { status: second.status(), body };
  } finally {
    await api.dispose();
  }
}

/** Signs in with the password alone from a new request context; answers the status and parsed body. */
export async function signInWithPassword(playwright, origin, { email, password }) {
  const api = await playwright.request.newContext({ ignoreHTTPSErrors: true });
  try {
    const reply = await api.post(`${origin}/api/v1/session/sign-in`, { headers: { origin, ...APP }, data: { email, password } });
    let body = null;
    try { body = await reply.json(); } catch { body = null; }
    return { status: reply.status(), body };
  } finally {
    await api.dispose();
  }
}
