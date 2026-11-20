import { z } from "zod";
import { characterCount, EMAIL_MAX, normaliseEmail, normalisePassword } from "./setup";

// The sign-in rules (story 1.3), written once for the browser and the server (standing rule 6).
//
// Input (A-10, E-10): the email is at most 254 code points after `normaliseEmail` (trimmed and
// lower-cased, with no Unicode normalisation, D-15); the password is at most 1,024 UTF-16 units as
// typed, before NFKC, so every password set-up accepted (128 code points after NFKC) can sign in.
// Only a missing or empty field, or one over its bound, is refused (`invalid_input`, not counted);
// any other value takes the one-message path, so a password that breaks the set-up rules is simply
// wrong.
//
// Limits (D-2 as amended, CA-07, E-8):
// - Per entered email: after 5 failures in a row, attempts wait 1 minute × 2^(n−5), at most
//   15 minutes, after the last failure. The count clears 15 minutes after its wait ends or, below
//   5 failures, 24 hours after its last failure.
// - Per marker (D-2 amended): the email's rules, on the marker's own count.
// - Per known network address: failures are counted over a rolling 15 minutes; at 20 the address
//   waits 1 minute × 2^(n−20), at most 15 minutes, after the last failure, and once a wait has
//   started its failures stay counted until 15 minutes after that wait ends. An unknown address
//   has no limit (D-11).
// - Attempts during a wait are refused and not counted.

/** The most UTF-16 units a sign-in password may have as typed, before NFKC. */
export const SIGNIN_PASSWORD_MAX_UNITS = 1024;

export const EMAIL_FREE_FAILURES = 5;
export const MARKER_FREE_FAILURES = 5;
export const ADDRESS_FREE_FAILURES = 20;
export const FIRST_WAIT_MS = 60_000;
export const MAX_WAIT_MS = 15 * 60_000;
/** How long after its wait ends a count is kept. */
export const CLEAR_AFTER_WAIT_MS = 15 * 60_000;
/** How long an email's or a marker's count below its threshold is kept after its last failure. */
export const BELOW_THRESHOLD_CLEAR_MS = 24 * 60 * 60_000;
/** The rolling window an address's failures are counted over before a wait starts. */
export const ADDRESS_WINDOW_MS = 15 * 60_000;

/** A sign-in ticket's lifetime (D-5 amended). */
export const SIGNIN_TICKET_TTL_MS = 5 * 60_000;
/** A session lasts 30 days from sign-in (D-4); the cookie's `Max-Age` is the same. */
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
export const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_SECONDS * 1000;
/** The marker lasts 1 year and is renewed at each sign-in (D-3). */
export const MARKER_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;
export const MARKER_MAX_AGE_MS = MARKER_MAX_AGE_SECONDS * 1000;

/** The wait after the last failure for a count of `failures` with `free` failures before any wait. */
export function failureWaitMs(failures: number, free: number): number {
  if (failures < free) return 0;
  return Math.min(FIRST_WAIT_MS * 2 ** (failures - free), MAX_WAIT_MS);
}

export function emailWaitMs(failures: number): number {
  return failureWaitMs(failures, EMAIL_FREE_FAILURES);
}

export function markerWaitMs(failures: number): number {
  return failureWaitMs(failures, MARKER_FREE_FAILURES);
}

export function addressWaitMs(failures: number): number {
  return failureWaitMs(failures, ADDRESS_FREE_FAILURES);
}

/**
 * When an email's or a marker's count clears: 15 minutes after its wait ends, or, below the
 * threshold, 24 hours after the last failure (D-2 amended).
 */
export function countClearsAt(lastFailureAt: number, failures: number, free: number): number {
  if (failures < free) return lastFailureAt + BELOW_THRESHOLD_CLEAR_MS;
  return lastFailureAt + failureWaitMs(failures, free) + CLEAR_AFTER_WAIT_MS;
}

export function emailClearsAt(lastFailureAt: number, failures: number): number {
  return countClearsAt(lastFailureAt, failures, EMAIL_FREE_FAILURES);
}

export function markerClearsAt(lastFailureAt: number, failures: number): number {
  return countClearsAt(lastFailureAt, failures, MARKER_FREE_FAILURES);
}

/**
 * When an address's failures stop counting, given the failure just counted at `now` and the
 * address's count including it: 15 minutes later below the threshold (the rolling window), else
 * 15 minutes after the wait that count starts (D-2 amended).
 */
export function addressHeldUntil(now: number, failures: number): number {
  if (failures < ADDRESS_FREE_FAILURES) return now + ADDRESS_WINDOW_MS;
  return now + addressWaitMs(failures) + CLEAR_AFTER_WAIT_MS;
}

/** Whole seconds left of a wait ending at `waitEndsAt`, or 0 when it has ended. */
export function secondsLeft(waitEndsAt: number, now: number): number {
  return waitEndsAt > now ? Math.ceil((waitEndsAt - now) / 1000) : 0;
}

/** The sign-in email: present, at most 254 code points after `normaliseEmail` (D-15). */
export const signInEmailField = z
  .string()
  .transform(normaliseEmail)
  .refine((value) => {
    const count = characterCount(value);
    return count >= 1 && count <= EMAIL_MAX;
  });

/** The sign-in password: present, at most 1,024 UTF-16 units as typed; checked after NFKC. */
export const signInPasswordField = z.string().min(1).max(SIGNIN_PASSWORD_MAX_UNITS).transform(normalisePassword);

/** The sign-in request's input. A refusal names `email` or `password`, never a value. */
export const signInInput = z.object({ email: signInEmailField, password: signInPasswordField }).strict();

export type SignInInput = z.infer<typeof signInInput>;
