import { z } from "zod";
import { signInPasswordField } from "./signin";

// The two-step verification rules (story 1.5), written once for the browser and the server
// (standing rule 6).
//
// Codes (CA-12, D-6): TOTP by RFC 6238 with HMAC-SHA-1, a 20-byte secret, 6 digits and a 30-second
// step; the codes of the step before and after the current one are also accepted. The secret is
// shown as RFC 4648 base32 without padding. Entry ignores spaces; anything other than exactly six
// ASCII digits is not a code.
//
// Recovery codes (CA-11, D-9): 10 per set, each 16 characters of Crockford's base32 in lower case
// (80 bits), shown as four groups of four joined by hyphens. Entry ignores case, spaces and hyphens.
//
// The authenticator entry (D-7): issuer = the installation's name, label `‹installation name›:‹email›`.

export const TOTP_DIGITS = 6;
export const TOTP_STEP_SECONDS = 30;
/** Steps accepted on either side of the current one. */
export const TOTP_WINDOW = 1;
export const TOTP_SECRET_BYTES = 20;
export const RECOVERY_CODE_COUNT = 10;
export const RECOVERY_CODE_LENGTH = 16;
/** How long the state between the password and the second step lasts (CA-46). */
export const PENDING_SIGNIN_TTL_MS = 5 * 60_000;
/** How long an unconfirmed set-up lasts (D-10). */
export const TWO_STEP_SETUP_TTL_MS = 10 * 60_000;
/** The code fields' `maxlength` and the server's bound on a code as sent. */
export const CODE_FIELD_MAX_LENGTH = 12;
/** The server's bound on a recovery code as sent, before spaces and hyphens are removed. */
export const RECOVERY_CODE_FIELD_MAX_LENGTH = 64;

const CODE_PATTERN = /^[0-9]{6}$/;
/** Crockford's base32 in lower case: digits and letters without i, l, o and u. */
const RECOVERY_ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz";
const RECOVERY_PATTERN = new RegExp(`^[${RECOVERY_ALPHABET}]{${RECOVERY_CODE_LENGTH}}$`);
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** A code as entered: spaces removed, then exactly six ASCII digits, or null. */
export function normaliseCode(value: string): string | null {
  const code = value.replace(/\s/gu, "");
  return CODE_PATTERN.test(code) ? code : null;
}

/** A recovery code as entered: spaces and hyphens removed, lower case, then 16 of Crockford's base32, or null. */
export function normaliseRecoveryCode(value: string): string | null {
  const code = value.replace(/[\s-]/gu, "").toLowerCase();
  return RECOVERY_PATTERN.test(code) ? code : null;
}

/** A normalised recovery code as shown: four groups of four joined by hyphens. */
export function formatRecoveryCode(code: string): string {
  return code.match(/.{1,4}/gu)?.join("-") ?? "";
}

/** The recovery-code alphabet, for generating codes: Crockford's base32 in lower case. */
export const RECOVERY_CODE_ALPHABET = RECOVERY_ALPHABET;

/** RFC 4648 base32, upper case, without padding. */
export function base32Encode(bytes: Uint8Array): string {
  let output = "";
  let buffer = 0;
  let bits = 0;
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      output += BASE32_ALPHABET[(buffer >>> bits) & 31];
    }
    buffer &= (1 << bits) - 1;
  }
  if (bits > 0) output += BASE32_ALPHABET[(buffer << (5 - bits)) & 31];
  return output;
}

/** Decodes RFC 4648 base32 without padding (either case), or answers null when it is not such a value. */
export function base32Decode(text: string): Uint8Array | null {
  // Checked before upper-casing, which maps some non-ASCII letters (U+0131, U+017F) to I and S.
  if (!/^[A-Za-z2-7]*$/.test(text)) return null;
  const upper = text.toUpperCase();
  // A length that leaves 1, 3 or 6 characters in the last group of eight is never produced.
  if ([1, 3, 6].includes(upper.length % 8)) return null;
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const character of upper) {
    const value = BASE32_ALPHABET.indexOf(character);
    if (value === -1) return null;
    buffer = (buffer << 5) | value;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >>> bits) & 255);
    }
    buffer &= (1 << bits) - 1;
  }
  // Leftover bits must be zero, so each value has exactly one spelling.
  if (buffer !== 0) return null;
  return new Uint8Array(bytes);
}

/**
 * One part of the authenticator label. The label's issuer and account are separated by a colon,
 * encoded or not, so every colon in a part becomes a space before it is percent-encoded (D-7,
 * finding 24).
 */
function labelPart(value: string): string {
  return encodeURIComponent(value.replace(/:/gu, " "));
}

/**
 * The `otpauth://` URI an authenticator app reads (D-7): issuer = the installation's name, label
 * `‹installation name›:‹email›`, the secret in base32 without padding, SHA-1, 6 digits, 30 seconds.
 */
export function otpauthUri({ secret, installationName, email }: { secret: string; installationName: string; email: string }): string {
  const issuer = labelPart(installationName);
  const parameters = [
    `secret=${secret}`,
    `issuer=${issuer}`,
    "algorithm=SHA1",
    `digits=${TOTP_DIGITS}`,
    `period=${TOTP_STEP_SECONDS}`,
  ].join("&");
  return `otpauth://totp/${issuer}:${labelPart(email)}?${parameters}`;
}

/** A code as sent: at most 12 characters that normalise to six digits; the value is the normalised code. */
export const codeField = z
  .string()
  .max(CODE_FIELD_MAX_LENGTH)
  .refine((value) => normaliseCode(value) !== null)
  .transform((value) => normaliseCode(value) as string);

/** A recovery code as sent: at most 64 characters that normalise to one; the value is the normalised code. */
export const recoveryCodeField = z
  .string()
  .max(RECOVERY_CODE_FIELD_MAX_LENGTH)
  .refine((value) => normaliseRecoveryCode(value) !== null)
  .transform((value) => normaliseRecoveryCode(value) as string);

/** A set-up's identifier: 16 random bytes as lower-case hex (not secret). */
export const setupIdField = z.string().regex(/^[0-9a-f]{32}$/);

/** Turning on (start) and turning off: the password only (CA-13). */
export const twoStepPasswordInput = z.object({ password: signInPasswordField }).strict();

/** Confirming a set-up: its identifier and a current code from the app (D-10). */
export const twoStepConfirmInput = z.object({ setupId: setupIdField, code: codeField }).strict();

/** Making fresh recovery codes: the password and a current code (CA-13). */
export const twoStepRecoveryCodesInput = z.object({ password: signInPasswordField, code: codeField }).strict();

/** The second sign-in step: a code from the app or a recovery code, in the field `code`. */
export const secondStepInput = z.discriminatedUnion("method", [
  z.object({ method: z.literal("code"), code: codeField }).strict(),
  z.object({ method: z.literal("recovery"), code: recoveryCodeField }).strict(),
]);

export type SecondStepInput = z.infer<typeof secondStepInput>;
