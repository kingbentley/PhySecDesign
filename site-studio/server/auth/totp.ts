import { TOTP_DIGITS, TOTP_STEP_SECONDS, TOTP_WINDOW } from "../../shared/twoStep";

// Authenticator codes (story 1.5, CA-12, D-6): TOTP by RFC 6238 over HOTP (RFC 4226) with
// HMAC-SHA-1 through `crypto.subtle`, 6 digits, a 30-second step, and the codes of the step before
// and after the current one accepted. The secret and the codes never leave the installation
// object, and nothing here logs.
//
// Whether a matched step is later than the last one accepted for the account (D-6) is decided by
// the caller in its synchronous step, which re-reads that last step.

const MODULUS = 10 ** TOTP_DIGITS;

function importSecret(secret: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", secret, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
}

async function codeFor(key: CryptoKey, step: number): Promise<string> {
  const counter = new Uint8Array(8);
  const view = new DataView(counter.buffer);
  // Steps stay far below 2^53; split into the two 32-bit halves of the 8-byte big-endian counter.
  view.setUint32(0, Math.floor(step / 2 ** 32));
  view.setUint32(4, step >>> 0);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, counter));
  // Dynamic truncation (RFC 4226, section 5.3).
  const offset = mac[mac.length - 1]! & 0x0f;
  const binary =
    ((mac[offset]! & 0x7f) << 24) | ((mac[offset + 1]! & 0xff) << 16) | ((mac[offset + 2]! & 0xff) << 8) | (mac[offset + 3]! & 0xff);
  return String(binary % MODULUS).padStart(TOTP_DIGITS, "0");
}

/** The time step of `now` (milliseconds since the epoch). */
export function stepAt(now: number): number {
  return Math.floor(now / 1000 / TOTP_STEP_SECONDS);
}

/** The code for one time step of a secret (RFC 6238 with HMAC-SHA-1, 6 digits). */
export async function totpAt(secret: Uint8Array, step: number): Promise<string> {
  return codeFor(await importSecret(secret), step);
}

/** The steps whose codes are accepted at `now`: the current step −1, 0 and +1. */
export function candidateSteps(now: number): number[] {
  const current = stepAt(now);
  const steps: number[] = [];
  for (let offset = -TOTP_WINDOW; offset <= TOTP_WINDOW; offset += 1) steps.push(current + offset);
  return steps;
}

/** Compares two strings of equal length without stopping at the first difference. */
function sameText(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return difference === 0;
}

/**
 * The latest candidate step at `now` whose code equals `code` (already normalised), or null.
 * Every candidate is computed and compared, with no early exit.
 */
export async function matchingStep(secret: Uint8Array, code: string, now: number): Promise<number | null> {
  const key = await importSecret(secret);
  const steps = candidateSteps(now);
  const codes = await Promise.all(steps.map((step) => codeFor(key, step)));
  // Every comparison runs, whatever the earlier ones found; steps ascend, so the last match is the latest.
  let matched: number | null = null;
  for (let index = 0; index < steps.length; index += 1) {
    if (sameText(codes[index]!, code)) matched = steps[index]!;
  }
  return matched;
}
