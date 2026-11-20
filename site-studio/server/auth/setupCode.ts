import { bytesEqual } from "./password";

// The set-up code (story 1.2). The Worker entry compares the entered code with the current Worker
// secret, in constant time. The installation object never sees a code: it receives only the
// fingerprint (SHA-256, hex) of the CONFIGURED code, the current secret, never of the entered one,
// so a new code issued by a redeploy resets the wrong-code counts (CA-45) even while a running
// object still has the old secret (experiment R11). Passing the entered code's fingerprint would
// let every guess reset the counts.

const encoder = new TextEncoder();

async function sha256(text: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(text)));
}

/** The fingerprint the installation object keeps for a set-up code: SHA-256 as 64 hex digits. */
export async function setupCodeFingerprint(code: string): Promise<string> {
  return [...(await sha256(code))].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Compares an entered code with the configured one in constant time. Both are hashed first, so the
 * comparison takes the same time whatever their lengths. An empty configured code never matches.
 */
export async function setupCodesMatch(entered: string, configured: string): Promise<boolean> {
  if (configured.length === 0) return false;
  const [a, b] = await Promise.all([sha256(entered), sha256(configured)]);
  return bytesEqual(a, b);
}
