import { describe, expect, it } from "vitest";
import { REFUSALS } from "../shared/refusal";
import { checkInput } from "../shared/routes";
import {
  base32Decode,
  base32Encode,
  CODE_FIELD_MAX_LENGTH,
  formatRecoveryCode,
  normaliseCode,
  normaliseRecoveryCode,
  otpauthUri,
  PENDING_SIGNIN_TTL_MS,
  RECOVERY_CODE_ALPHABET,
  RECOVERY_CODE_COUNT,
  RECOVERY_CODE_FIELD_MAX_LENGTH,
  RECOVERY_CODE_LENGTH,
  secondStepInput,
  TOTP_DIGITS,
  TOTP_SECRET_BYTES,
  TOTP_STEP_SECONDS,
  TOTP_WINDOW,
  TWO_STEP_SETUP_TTL_MS,
  twoStepConfirmInput,
  twoStepPasswordInput,
  twoStepRecoveryCodesInput,
} from "../shared/twoStep";
import { candidateSteps, matchingStep, stepAt, totpAt } from "../server/auth/totp";

// The shared two-step rules and the TOTP code (story 1.5, spec 1: CAP-5's rules, the formats of
// CAP-2, D-6, D-7, D-9). Secrets are generated at run time; the only fixed values are RFC 6238's
// and RFC 4648's published test vectors.

const encoder = new TextEncoder();

function randomSecret(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(TOTP_SECRET_BYTES));
}

describe("two-step constants", () => {
  it("are the ruled values", () => {
    expect({
      TOTP_DIGITS,
      TOTP_STEP_SECONDS,
      TOTP_WINDOW,
      TOTP_SECRET_BYTES,
      RECOVERY_CODE_COUNT,
      RECOVERY_CODE_LENGTH,
      PENDING_SIGNIN_TTL_MS,
      TWO_STEP_SETUP_TTL_MS,
      CODE_FIELD_MAX_LENGTH,
      RECOVERY_CODE_FIELD_MAX_LENGTH,
      RECOVERY_CODE_ALPHABET,
    }).toEqual({
      RECOVERY_CODE_FIELD_MAX_LENGTH: 64,
      RECOVERY_CODE_ALPHABET: "0123456789abcdefghjkmnpqrstvwxyz",
      TOTP_DIGITS: 6,
      TOTP_STEP_SECONDS: 30,
      TOTP_WINDOW: 1,
      TOTP_SECRET_BYTES: 20,
      RECOVERY_CODE_COUNT: 10,
      RECOVERY_CODE_LENGTH: 16,
      PENDING_SIGNIN_TTL_MS: 5 * 60_000,
      TWO_STEP_SETUP_TTL_MS: 10 * 60_000,
      CODE_FIELD_MAX_LENGTH: 12,
    });
  });
});

describe("two-step refusals", () => {
  it("carry wording.md's statuses and messages", () => {
    const codes = [
      "second_step_code_wrong",
      "second_step_recovery_code_wrong",
      "second_step_expired",
      "two_step_password_wrong",
      "two_step_code_wrong",
      "two_step_setup_expired",
      "two_step_already_on",
      "two_step_off",
      "deployment_key_missing",
      "deployment_key_mismatch",
    ] as const;
    expect(Object.fromEntries(codes.map((code) => [code, REFUSALS[code]]))).toEqual({
      second_step_code_wrong: {
        status: 401,
        message: "That code does not match or was already used. Wait for the next code in your authenticator app and try again.",
      },
      second_step_recovery_code_wrong: { status: 401, message: "That recovery code does not match, or it has already been used." },
      second_step_expired: { status: 401, message: "This sign-in has expired. Sign in again with your email and password." },
      two_step_password_wrong: { status: 403, message: "That password is not correct." },
      two_step_code_wrong: {
        status: 403,
        message: "That code does not match. Check that the app shows this installation and try the newest code.",
      },
      two_step_setup_expired: { status: 409, message: "This set-up has expired or was replaced. Start again." },
      two_step_already_on: { status: 409, message: "Two-step verification is already on for this account." },
      two_step_off: { status: 409, message: "Two-step verification is off for this account." },
      deployment_key_missing: {
        status: 503,
        message: "Two-step verification is not available on this installation yet: it has no deployment key. Ask an administrator.",
      },
      deployment_key_mismatch: {
        status: 503,
        message:
          "Two-step verification cannot be checked on this installation: its deployment key does not match the one its secrets were saved with. Ask an administrator to deploy it again with the original key.",
      },
    });
  });
});

describe("TOTP", () => {
  it("gives the last 6 digits of RFC 6238's SHA-1 test vectors", async () => {
    // RFC 6238, appendix B: the SHA-1 seed and the published 8-digit values.
    const seed = encoder.encode("12345678901234567890");
    const vectors: [number, string][] = [
      [59, "94287082"],
      [1111111109, "07081804"],
      [1111111111, "14050471"],
      [1234567890, "89005924"],
      [2000000000, "69279037"],
      [20000000000, "65353130"],
    ];
    for (const [seconds, published] of vectors) {
      expect(await totpAt(seed, stepAt(seconds * 1000)), String(seconds)).toBe(published.slice(-6));
    }
  });

  it("accepts the codes of steps −1, 0 and +1 around now and refuses −2 and +2", async () => {
    const now = Date.now();
    const current = stepAt(now);
    expect(candidateSteps(now)).toEqual([current - 1, current, current + 1]);
    // A secret whose five codes differ, so a coincidence between steps cannot blur the window.
    let secret: Uint8Array;
    let codes: string[];
    do {
      secret = randomSecret();
      codes = await Promise.all([-2, -1, 0, 1, 2].map((offset) => totpAt(secret, current + offset)));
    } while (new Set(codes).size !== codes.length);
    const results = await Promise.all(codes.map((code) => matchingStep(secret, code, now)));
    expect(results).toEqual([null, current - 1, current, current + 1, null]);
  });

  it("uses the injected time, not the clock", async () => {
    const secret = randomSecret();
    const then = Date.UTC(2030, 0, 1, 12, 0, 0);
    const code = await totpAt(secret, stepAt(then));
    expect(await matchingStep(secret, code, then)).toBe(stepAt(then));
    expect(await matchingStep(secret, code, then + 10 * TOTP_STEP_SECONDS * 1000)).toBeNull();
    expect(code).toMatch(/^[0-9]{6}$/);
  });
});

describe("code entry", () => {
  it("ignores spaces and accepts exactly six ASCII digits", () => {
    expect(normaliseCode("123 456")).toBe("123456");
    expect(normaliseCode(" 123456 ")).toBe("123456");
    for (const value of ["12345", "1234567", "12a456", "１２３４５６", "", "      "]) {
      expect(normaliseCode(value), value).toBeNull();
    }
  });
});

describe("recovery-code entry", () => {
  it("ignores case, spaces and hyphens and accepts exactly 16 of Crockford's base32", () => {
    expect(normaliseRecoveryCode("ABCD-efgh jkmn-pqrs")).toBe("abcdefghjkmnpqrs");
    for (const value of ["abcd-efgh-jkmn-pqr", "abcd-efgh-jkmn-pqrst", "abcd-efgh-jkmn-pqro", "abcd-efgh-jkmn-pqrl", "abcd-efgh-jkmn-pqri", "abcd-efgh-jkmn-pqru"]) {
      expect(normaliseRecoveryCode(value), value).toBeNull();
    }
  });

  it("shows a code as four groups of four joined by hyphens, which normalise back", () => {
    const formatted = formatRecoveryCode("abcdefghjkmnpqrs");
    expect(formatted).toBe("abcd-efgh-jkmn-pqrs");
    expect(normaliseRecoveryCode(formatted)).toBe("abcdefghjkmnpqrs");
  });
});

describe("base32", () => {
  it("round-trips 20 random bytes as 32 characters without padding", () => {
    const bytes = randomSecret();
    const text = base32Encode(bytes);
    expect(text).toHaveLength(32);
    expect(text).not.toContain("=");
    expect(text).toMatch(/^[A-Z2-7]+$/);
    expect(base32Decode(text)).toEqual(bytes);
    expect(base32Decode(text.toLowerCase())).toEqual(bytes);
  });

  it("matches RFC 4648's test vectors without padding and refuses what is not base32", () => {
    const vectors: [string, string][] = [
      ["", ""],
      ["f", "MY"],
      ["fo", "MZXQ"],
      ["foo", "MZXW6"],
      ["foob", "MZXW6YQ"],
      ["fooba", "MZXW6YTB"],
      ["foobar", "MZXW6YTBOI"],
    ];
    for (const [plain, encoded] of vectors) {
      expect(base32Encode(encoder.encode(plain)), plain).toBe(encoded);
      expect(base32Decode(encoded), encoded).toEqual(encoder.encode(plain));
    }
    for (const value of ["MZXW6===", "MZ1W", "M", "MZX", "MZ", "Mı", "Mſ", "MZXW6YTBıı"]) expect(base32Decode(value), value).toBeNull();
  });
});

describe("authenticator URI", () => {
  it("percent-encodes the label and issuer and carries D-7's parameters", () => {
    const secret = base32Encode(randomSecret());
    const uri = otpauthUri({ secret, installationName: "Acme & Co", email: "a+b@x.test" });
    expect(uri).toBe(
      `otpauth://totp/Acme%20%26%20Co:a%2Bb%40x.test?secret=${secret}&issuer=Acme%20%26%20Co&algorithm=SHA1&digits=6&period=30`,
    );
  });

  it("replaces every colon in the installation name or email, leaving one separator", () => {
    const secret = base32Encode(randomSecret());
    const uri = otpauthUri({ secret, installationName: "Site: North", email: "x:y@x.test" });
    const label = uri.slice("otpauth://totp/".length, uri.indexOf("?"));
    expect(label.split(":")).toHaveLength(2);
    expect(label).not.toMatch(/%3A/i);
    const [issuerPart, accountPart] = label.split(":") as [string, string];
    expect(decodeURIComponent(issuerPart)).toBe("Site  North");
    expect(decodeURIComponent(accountPart)).toBe("x y@x.test");
    const issuer = new URL(uri.replace("otpauth:", "https:")).searchParams.get("issuer");
    expect(issuer).toBe("Site  North");
    expect(uri.slice(uri.indexOf("?"))).not.toMatch(/:|%3A/i);
  });
});

describe("two-step inputs", () => {
  it("normalise codes and recovery codes and refuse what does not normalise, naming only the field", () => {
    expect(checkInput(secondStepInput, { method: "code", code: "123 456" })).toEqual({ ok: true, value: { method: "code", code: "123456" } });
    expect(checkInput(secondStepInput, { method: "recovery", code: "ABCD-efgh jkmn-pqrs" })).toEqual({
      ok: true,
      value: { method: "recovery", code: "abcdefghjkmnpqrs" },
    });
    expect(checkInput(secondStepInput, { method: "code", code: "12a456" })).toEqual({ ok: false, field: "code" });
    expect(checkInput(secondStepInput, { method: "code", code: "1 2 3 4 5 6 7" })).toEqual({ ok: false, field: "code" });
    expect(checkInput(secondStepInput, { method: "recovery", code: `${"abcd-".repeat(12)}efgh` })).toEqual({ ok: false, field: "code" });
    // The bounds as sent: 13 characters for a code, 65 for a recovery code, even when they would normalise.
    expect(checkInput(secondStepInput, { method: "code", code: `123456${" ".repeat(7)}` })).toEqual({ ok: false, field: "code" });
    const padded = `abcd-efgh-jkmn-pqrs${"-".repeat(65 - 19)}`;
    expect(padded).toHaveLength(65);
    expect(checkInput(secondStepInput, { method: "recovery", code: padded })).toEqual({ ok: false, field: "code" });
    expect(checkInput(secondStepInput, { method: "recovery", code: padded.slice(0, 64) }).ok).toBe(true);
    expect(checkInput(secondStepInput, { method: "other", code: "123456" })).toEqual({ ok: false, field: "method" });
  });

  it("take the password as sign-in does, and a set-up identifier of 32 hex digits", () => {
    const setupId = [...crypto.getRandomValues(new Uint8Array(16))].map((byte) => byte.toString(16).padStart(2, "0")).join("");
    expect(checkInput(twoStepConfirmInput, { setupId, code: "123456" })).toEqual({ ok: true, value: { setupId, code: "123456" } });
    expect(checkInput(twoStepConfirmInput, { setupId: setupId.toUpperCase(), code: "123456" })).toEqual({ ok: false, field: "setupId" });
    expect(checkInput(twoStepPasswordInput, { password: "" })).toEqual({ ok: false, field: "password" });
    expect(checkInput(twoStepPasswordInput, { password: "x".repeat(1025) })).toEqual({ ok: false, field: "password" });
    expect(checkInput(twoStepRecoveryCodesInput, { password: "p", code: "123 456" })).toEqual({ ok: true, value: { password: "p", code: "123456" } });
    expect(checkInput(twoStepPasswordInput, { password: "p", extra: 1 }).ok).toBe(false);
  });
});
