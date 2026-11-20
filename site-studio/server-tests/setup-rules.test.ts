import { describe, expect, it } from "vitest";
import { checkInput } from "../shared/routes";
import {
  characterCount,
  EMAIL_MAX,
  emailField,
  installationNameField,
  normaliseName,
  normalisePassword,
  normaliseSetupCode,
  passwordEqualsEmail,
  passwordField,
  personNameField,
  setupInput,
} from "../shared/setup";

// The shared set-up input rules (CAP-5): CA-03, CA-04 and D-4, at their boundaries.

const VALID = {
  code: "a-set-up-code-of-twenty-plus",
  installationName: "Acme Security",
  name: "Dana Admin",
  email: "dana@example.com",
  password: "correct horse battery",
};

function check(overrides: Record<string, unknown>) {
  return checkInput(setupInput, { ...VALID, ...overrides });
}

function refusedField(overrides: Record<string, unknown>): string | undefined {
  const result = check(overrides);
  expect(result.ok).toBe(false);
  return result.ok ? undefined : result.field;
}

/** An email of exactly `length` characters. */
function emailOfLength(length: number): string {
  const domain = "@example.com";
  return "a".repeat(length - domain.length) + domain;
}

describe("set-up input: password (CA-03)", () => {
  it("accepts 12 and 128 characters and refuses 11 and 129, naming the password", () => {
    expect(check({ password: "p".repeat(12) }).ok).toBe(true);
    expect(check({ password: "p".repeat(128) }).ok).toBe(true);
    expect(refusedField({ password: "p".repeat(11) })).toBe("password");
    expect(refusedField({ password: "p".repeat(129) })).toBe("password");
  });

  it("has no composition rule: lower-case letters only, digits only and spaces are accepted", () => {
    for (const password of ["abcdefghijkl", "123456789012", "            "]) {
      expect(check({ password }).ok, JSON.stringify(password)).toBe(true);
    }
  });

  it("refuses a password equal to the email in any letter case, naming the password", () => {
    const email = "dana.long.address@example.com";
    expect(refusedField({ email, password: email })).toBe("password");
    expect(refusedField({ email, password: email.toUpperCase() })).toBe("password");
    expect(refusedField({ email: "  Dana.Long.Address@Example.COM ", password: "dana.long.address@EXAMPLE.com" })).toBe(
      "password",
    );
    expect(passwordEqualsEmail("DANA@example.com", "dana@EXAMPLE.com")).toBe(true);
    expect(passwordEqualsEmail("dana@example.com!", "dana@example.com")).toBe(false);
  });

  it("counts characters, not UTF-16 units, and keeps the password exactly as typed", () => {
    // Twelve emoji are 24 UTF-16 units but 12 characters.
    const emoji = "\u{1F512}".repeat(12);
    expect(characterCount(emoji)).toBe(12);
    expect(check({ password: emoji }).ok).toBe(true);
    expect(check({ password: "\u{1F512}".repeat(11) }).ok).toBe(false);
    const result = check({ password: "  spaced password  " });
    expect(result.ok && result.value.password).toBe("  spaced password  ");
  });
});

describe("set-up input: installation name (CA-04) and person's name (D-4)", () => {
  it("accepts 1 and 80 characters and refuses 0 and 81, naming the field", () => {
    for (const field of ["installationName", "name"] as const) {
      expect(check({ [field]: "x" }).ok, field).toBe(true);
      expect(check({ [field]: "x".repeat(80) }).ok, field).toBe(true);
      expect(refusedField({ [field]: "" })).toBe(field);
      expect(refusedField({ [field]: "x".repeat(81) })).toBe(field);
    }
  });

  it("trims surrounding spaces before measuring, so only spaces is refused", () => {
    expect(installationNameField.parse("  Acme  ")).toBe("Acme");
    expect(personNameField.parse(" Dana ")).toBe("Dana");
    expect(refusedField({ installationName: "   " })).toBe("installationName");
    expect(refusedField({ name: "\t \n" })).toBe("name");
    expect(check({ name: ` ${"x".repeat(80)} ` }).ok).toBe(true);
  });
});

describe("set-up input: email (D-4)", () => {
  it("stores the email trimmed and lower-cased", () => {
    const result = check({ email: "  Dana.Admin@Example.COM " });
    expect(result.ok && result.value.email).toBe("dana.admin@example.com");
  });

  it("accepts 254 characters and refuses 255", () => {
    expect(emailOfLength(EMAIL_MAX)).toHaveLength(254);
    expect(check({ email: emailOfLength(254) }).ok).toBe(true);
    expect(refusedField({ email: emailOfLength(255) })).toBe("email");
  });

  it("passes a light format check", () => {
    for (const email of ["a@b", "admin@intranet", "first.last+tag@sub.example.co.uk"]) {
      expect(emailField.safeParse(email).success, email).toBe(true);
    }
    for (const email of ["", "dana", "@example.com", "dana@", "da na@example.com", "dana@@example.com", "a@b@c", "dana@.example", "dana@example.", "dana\u0000@example.com"]) {
      expect(emailField.safeParse(email).success, JSON.stringify(email)).toBe(false);
    }
    expect(refusedField({ email: "not-an-email" })).toBe("email");
  });
});

describe("set-up input: code and shape", () => {
  it("refuses a missing or empty code, naming the code", () => {
    const { code: _code, ...withoutCode } = VALID;
    const missing = checkInput(setupInput, withoutCode);
    expect(missing).toEqual({ ok: false, field: "code" });
    expect(refusedField({ code: "" })).toBe("code");
  });

  it("refuses unknown fields without naming them, and accepts the valid input", () => {
    const unknown = checkInput(setupInput, { ...VALID, role: "administrator" });
    expect(unknown.ok).toBe(false);
    expect(unknown.ok ? undefined : unknown.field).toBeUndefined();
    expect(check({}).ok).toBe(true);
  });

  it("never carries an entered value in a refusal", () => {
    const secret = "my-secret-password-equal@example.com";
    const result = check({ email: secret, password: secret });
    expect(JSON.stringify(result)).not.toContain(secret);
  });
});

describe("Unicode normalisation (D-9)", () => {
  it("measures a password after NFKC: decomposed accents count once, compatibility forms fold", () => {
    // Eleven letters, each "e" plus a combining accent: 22 code points as typed, 11 after NFKC.
    const elevenAccented = "e\u0301".repeat(11);
    expect(characterCount(elevenAccented)).toBe(22);
    expect(characterCount(normalisePassword(elevenAccented))).toBe(11);
    expect(passwordField.safeParse(elevenAccented).success).toBe(false);
    expect(passwordField.safeParse("e\u0301".repeat(12)).success).toBe(true);
    // 128 composed characters pass; 128 decomposed ones are the same password.
    expect(passwordField.safeParse("\u00e9".repeat(128)).success).toBe(true);
    expect(passwordField.safeParse("e\u0301".repeat(128)).success).toBe(true);
    expect(passwordField.safeParse("\u00e9".repeat(129)).success).toBe(false);
    // NFKC folds a ligature and full-width letters.
    expect(normalisePassword("\ufb01\uff21")).toBe("fiA");
  });

  it("gives the same password, as parsed for hashing, for composed and decomposed spellings", () => {
    const composed = check({ password: "caf\u00e9 cr\u00e8me br\u00fbl\u00e9e" });
    const decomposed = check({ password: "caf\u00e9 cr\u00e8me br\u00fbl\u00e9e".normalize("NFD") });
    expect(composed.ok && decomposed.ok).toBe(true);
    if (composed.ok && decomposed.ok) expect(decomposed.value.password).toBe(composed.value.password);
  });

  it("compares the password with the email after NFKC", () => {
    expect(passwordEqualsEmail("\uff44\uff41\uff4e\uff41@example.com", "dana@example.com")).toBe(true);
  });

  it("stores names in NFC and measures them after NFC", () => {
    expect(normaliseName("  Zoe\u0301 ")).toBe("Zo\u00e9");
    const eighty = "e\u0301".repeat(80);
    expect(installationNameField.safeParse(eighty)).toMatchObject({ success: true, data: "\u00e9".repeat(80) });
    expect(personNameField.safeParse(eighty)).toMatchObject({ success: true, data: "\u00e9".repeat(80) });
    expect(personNameField.safeParse("e\u0301".repeat(81)).success).toBe(false);
  });

  it("normalises a set-up code: no spaces or dashes, upper case", () => {
    expect(normaliseSetupCode(" ab-cd ef\u2014gh ")).toBe("ABCDEFGH");
  });
});
