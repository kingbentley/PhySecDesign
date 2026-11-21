import { describe, expect, it } from "vitest";
import { checkInput } from "../shared/routes";
import { REFUSALS, SIGNIN_BUSY_RETRY_AFTER_SECONDS } from "../shared/refusal";
import { passwordField } from "../shared/setup";
import {
  ADDRESS_FREE_FAILURES,
  ADDRESS_WINDOW_MS,
  addressHeldUntil,
  addressWaitMs,
  BELOW_THRESHOLD_CLEAR_MS,
  CLEAR_AFTER_WAIT_MS,
  EMAIL_FREE_FAILURES,
  emailClearsAt,
  emailWaitMs,
  MARKER_FREE_FAILURES,
  MARKER_MAX_AGE_SECONDS,
  markerClearsAt,
  markerWaitMs,
  MAX_WAIT_MS,
  secondsLeft,
  SESSION_MAX_AGE_SECONDS,
  SIGNIN_PASSWORD_MAX_UNITS,
  SIGNIN_TICKET_TTL_MS,
  signInInput,
} from "../shared/signin";

// The shared sign-in rules (story 1.3, spec 1): the input's bounds (A-10, E-10, D-15), the limits
// and the wait and clearing functions (D-2 as amended, CA-07, E-8), and the three refusals.

const MINUTE = 60_000;
const T0 = Date.UTC(2026, 10, 20, 12, 0, 0);

function check(value: Record<string, unknown>) {
  return checkInput(signInInput, value);
}

describe("the sign-in input", () => {
  it("normalises the email (trim, lower case, no Unicode normalisation) and the password (NFKC)", () => {
    const result = check({ email: "  Dana@Acme.TEST ", password: "café password" });
    expect(result).toEqual({ ok: true, value: { email: "dana@acme.test", password: "café password" } });
    // D-15: an email is compared exactly; a decomposed accent is not composed.
    const decomposed = check({ email: "josé@acme.test", password: "x" });
    expect(decomposed.ok && decomposed.value.email).toBe("josé@acme.test");
  });

  it("accepts an email of 254 code points after trimming and refuses 255, naming only the field", () => {
    const local = "e".repeat(254 - "@acme.test".length);
    expect(check({ email: `  ${local}@acme.test  `, password: "x" }).ok).toBe(true);
    // Code points, not UTF-16 units: 254 emoji are 508 units and still fit.
    expect(check({ email: "\u{1F600}".repeat(254), password: "x" }).ok).toBe(true);
    const over = check({ email: `${local}e@acme.test`, password: "secret-value" });
    expect(over).toEqual({ ok: false, field: "email" });
    expect(JSON.stringify(over)).not.toContain("secret-value");
  });

  it("refuses only a missing or empty field; any other email takes the one-message path", () => {
    expect(check({ email: "", password: "x" })).toEqual({ ok: false, field: "email" });
    expect(check({ email: "   ", password: "x" })).toEqual({ ok: false, field: "email" });
    expect(check({ email: "dana@acme.test", password: "" })).toEqual({ ok: false, field: "password" });
    expect(check({ password: "x" })).toEqual({ ok: false, field: "email" });
    expect(check({ email: "dana@acme.test" })).toEqual({ ok: false, field: "password" });
    expect(check({ email: "dana@acme.test", password: "x", extra: 1 })).toEqual({ ok: false });
    // Not an email by set-up's light check, and a password set-up would refuse: both are accepted
    // here and simply fail to match.
    expect(check({ email: "not-an-email", password: "short" }).ok).toBe(true);
  });

  it("accepts a password of 1,024 UTF-16 units before normalisation and refuses 1,025", () => {
    expect(SIGNIN_PASSWORD_MAX_UNITS).toBe(1024);
    expect(check({ email: "dana@acme.test", password: "p".repeat(1024) }).ok).toBe(true);
    expect(check({ email: "dana@acme.test", password: "p".repeat(1025) })).toEqual({ ok: false, field: "password" });
  });

  it("accepts every password set-up accepts: 128 emoji, and decomposed Hangul that NFKC shrinks", () => {
    const emoji = "\u{1F600}".repeat(128); // 256 UTF-16 units
    const hangul = "가".repeat(128); // 256 units, 128 syllables after NFKC
    for (const password of [emoji, hangul]) {
      expect(passwordField.safeParse(password).success).toBe(true);
      const result = check({ email: "dana@acme.test", password });
      expect(result.ok).toBe(true);
      expect(result.ok && result.value.password).toBe(password.normalize("NFKC"));
    }
    // The longest password set-up accepts, decomposed as far as it goes, still fits.
    const longest = "각".repeat(128); // 384 units
    expect(passwordField.safeParse(longest).success).toBe(true);
    expect(check({ email: "dana@acme.test", password: longest }).ok).toBe(true);
  });
});

describe("the limits", () => {
  it("are 5 per email, 5 per marker and 20 per known address, waiting 1 to 15 minutes", () => {
    expect([EMAIL_FREE_FAILURES, MARKER_FREE_FAILURES, ADDRESS_FREE_FAILURES]).toEqual([5, 5, 20]);
    expect(MAX_WAIT_MS).toBe(15 * MINUTE);
    expect(SIGNIN_TICKET_TTL_MS).toBe(5 * MINUTE);
    expect(SESSION_MAX_AGE_SECONDS).toBe(2_592_000);
    expect(MARKER_MAX_AGE_SECONDS).toBe(31_536_000);
  });

  it("make an email or a marker wait 1 minute × 2^(n−5) after 5 failures, at most 15 minutes", () => {
    const expected = [0, 1, 2, 4, 8, 15, 15, 15].map((m) => m * MINUTE);
    expect([4, 5, 6, 7, 8, 9, 10, 40].map(emailWaitMs)).toEqual(expected);
    expect([4, 5, 6, 7, 8, 9, 10, 40].map(markerWaitMs)).toEqual(expected);
  });

  it("make an address wait 1 minute × 2^(n−20) from 20 failures, at most 15 minutes", () => {
    expect([19, 20, 21, 22, 23, 24, 25, 60].map(addressWaitMs)).toEqual([0, 1, 2, 4, 8, 15, 15, 15].map((m) => m * MINUTE));
  });

  it("clear an email's count 15 minutes after its wait, or 24 hours after the last failure below 5", () => {
    expect(BELOW_THRESHOLD_CLEAR_MS).toBe(24 * 60 * MINUTE);
    expect(CLEAR_AFTER_WAIT_MS).toBe(15 * MINUTE);
    expect(emailClearsAt(T0, 1)).toBe(T0 + 24 * 60 * MINUTE);
    expect(emailClearsAt(T0, 4)).toBe(T0 + 24 * 60 * MINUTE);
    expect(emailClearsAt(T0, 5)).toBe(T0 + MINUTE + 15 * MINUTE);
    expect(emailClearsAt(T0, 6)).toBe(T0 + 2 * MINUTE + 15 * MINUTE);
    expect(emailClearsAt(T0, 12)).toBe(T0 + 15 * MINUTE + 15 * MINUTE);
    expect(markerClearsAt(T0, 4)).toBe(emailClearsAt(T0, 4));
    expect(markerClearsAt(T0, 7)).toBe(emailClearsAt(T0, 7));
  });

  it("hold an address's failure for the rolling 15 minutes, or until 15 minutes after its wait", () => {
    expect(ADDRESS_WINDOW_MS).toBe(15 * MINUTE);
    expect(addressHeldUntil(T0, 1)).toBe(T0 + 15 * MINUTE);
    expect(addressHeldUntil(T0, 19)).toBe(T0 + 15 * MINUTE);
    expect(addressHeldUntil(T0, 20)).toBe(T0 + MINUTE + 15 * MINUTE);
    expect(addressHeldUntil(T0, 21)).toBe(T0 + 2 * MINUTE + 15 * MINUTE);
    expect(addressHeldUntil(T0, 30)).toBe(T0 + 30 * MINUTE);
  });

  it("state a wait in whole seconds, rounding up", () => {
    expect(secondsLeft(T0 + 60_000, T0)).toBe(60);
    expect(secondsLeft(T0 + 1, T0)).toBe(1);
    expect(secondsLeft(T0, T0)).toBe(0);
    expect(secondsLeft(T0 - 5, T0)).toBe(0);
  });
});

describe("the sign-in refusals", () => {
  it("carry one fixed message each, the same for every email (A-19, D-5 amended)", () => {
    expect(REFUSALS.signin_failed).toEqual({ status: 401, message: "That email and password do not match." });
    expect(REFUSALS.signin_wait).toEqual({ status: 429, message: "Too many attempts. Wait before trying again." });
    expect(REFUSALS.signin_busy).toEqual({ status: 503, message: "Site Survey Design is busy. Try again shortly." });
    expect(SIGNIN_BUSY_RETRY_AFTER_SECONDS).toBe(5);
  });
});
