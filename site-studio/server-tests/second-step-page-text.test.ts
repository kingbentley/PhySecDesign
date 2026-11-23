import { describe, expect, it } from "vitest";
import { CODE_FIELD_MAX_LENGTH } from "../shared/twoStep";
import { SECOND_STEP_FIELD_MESSAGES, checkSecondStepCode } from "../src/admin/secondStepRules.js";

// The sign-in page's second-step field check (story 1.5, spec 8, standing rule 6): the code or
// recovery code is checked with shared/twoStep.ts's normalisers before it is sent, and the
// normalised value is what goes out. The page module imports shared/, so it is tested here, as
// invitation-page-text.test.ts does. The flows run in browser-tests/second-step.spec.mjs. Every
// code here is made up for the test.

describe("the second step's field check", () => {
  it("words each field's message as wording.md does", () => {
    expect(SECOND_STEP_FIELD_MESSAGES).toEqual({
      code: "Enter the 6 digits from your authenticator app.",
      recovery: "Enter a recovery code: 16 letters and digits.",
    });
  });

  it("accepts six digits with spaces ignored and answers the normalised code (CAP-13)", () => {
    expect(checkSecondStepCode("code", "123456")).toEqual({ code: "123456" });
    expect(checkSecondStepCode("code", "123 456")).toEqual({ code: "123456" });
    expect(checkSecondStepCode("code", " 12 34 56 ")).toEqual({ code: "123456" });
    expect(" 12 34 56 ".length).toBeLessThanOrEqual(CODE_FIELD_MAX_LENGTH);
  });

  it("refuses anything else as a code, with the code field's message", () => {
    for (const value of ["", "12345", "1234567", "12a456", "１２３４５６", "123-456", undefined]) {
      expect(checkSecondStepCode("code", value as string)).toEqual({ error: SECOND_STEP_FIELD_MESSAGES.code });
    }
  });

  it("accepts a recovery code in any case, with spaces and hyphens, and answers it normalised", () => {
    expect(checkSecondStepCode("recovery", "abcd-efgh-jkmn-pqrs")).toEqual({ code: "abcdefghjkmnpqrs" });
    expect(checkSecondStepCode("recovery", "ABCD-EFGH-JKMN-PQRS")).toEqual({ code: "abcdefghjkmnpqrs" });
    expect(checkSecondStepCode("recovery", " abcd efgh  jkmn pqrs ")).toEqual({ code: "abcdefghjkmnpqrs" });
    // A long paste with many spaces is sent normalised, inside the server's 64-character bound.
    const padded = `  ${"abcd".split("").join("   ")}   efgh - jkmn - pqrs${" ".repeat(60)}`;
    expect(padded.length).toBeGreaterThan(64);
    expect(checkSecondStepCode("recovery", padded)).toEqual({ code: "abcdefghjkmnpqrs" });
  });

  it("refuses anything else as a recovery code, with the recovery field's message", () => {
    // 15 characters, 17 characters, and letters outside Crockford's base32 (i, l, o, u).
    for (const value of ["", "abcd-efgh-jkmn-pqr", "abcd-efgh-jkmn-pqrst", "abcd-efgh-ijkl-mnop", "uuuu-uuuu-uuuu-uuuu", "123456"]) {
      expect(checkSecondStepCode("recovery", value)).toEqual({ error: SECOND_STEP_FIELD_MESSAGES.recovery });
    }
  });

  it("never puts what was typed in a message", () => {
    for (const [method, value] of [["code", "98765"], ["recovery", "zzzz-zzzz-zzzz-zzz"]] as const) {
      const checked = checkSecondStepCode(method, value);
      expect(JSON.stringify(checked).includes(value)).toBe(false);
    }
  });
});
