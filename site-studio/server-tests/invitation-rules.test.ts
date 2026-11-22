import { describe, expect, it } from "vitest";
import {
  acceptInput,
  INVITATION_SECRET_LENGTH,
  INVITATION_TTL_MS,
  invitationSecretField,
  inviteInput,
  isWellFormedInvitationSecret,
  passwordRules,
} from "../shared/invitation";
import { REFUSALS, refusalBody } from "../shared/refusal";
import { checkInput } from "../shared/routes";

// The invitation rules shared by the page and the server (story 1.4, spec 1, standing rule 6):
// the period, the secret's shape, the invite and accept inputs, the password rule list, and the
// four new refusals' wording (D-3, D-6, D-11).

const SECRET = "A".repeat(42) + "_";

describe("the invitation period and secret", () => {
  it("lasts 7 days and has 43 characters (CA-09, CA-55)", () => {
    expect(INVITATION_TTL_MS).toBe(7 * 24 * 60 * 60 * 1000);
    expect(INVITATION_SECRET_LENGTH).toBe(43);
  });

  it("is well formed only as 43 base64url characters", () => {
    expect(isWellFormedInvitationSecret(SECRET)).toBe(true);
    expect(isWellFormedInvitationSecret("-".repeat(43))).toBe(true);
    for (const value of ["", "A".repeat(42), "A".repeat(44), "A".repeat(42) + "=", "A".repeat(42) + "+", "A".repeat(42) + "/", "A".repeat(42) + " "]) {
      expect(isWellFormedInvitationSecret(value), JSON.stringify(value)).toBe(false);
    }
  });

  it("is accepted by the request schema from 1 to 256 characters, whatever its shape", () => {
    expect(invitationSecretField.safeParse("x").success).toBe(true);
    expect(invitationSecretField.safeParse("not base64url!").success).toBe(true);
    expect(invitationSecretField.safeParse("x".repeat(256)).success).toBe(true);
    expect(invitationSecretField.safeParse("").success).toBe(false);
    expect(invitationSecretField.safeParse("x".repeat(257)).success).toBe(false);
    expect(invitationSecretField.safeParse(43).success).toBe(false);
  });
});

describe("the invite input", () => {
  it("takes an email, a name and a role, normalising the email and the name", () => {
    expect(checkInput(inviteInput, { email: "  Sam@Acme.TEST ", name: "  Sam Person ", role: "standard" })).toEqual({
      ok: true,
      value: { email: "sam@acme.test", name: "Sam Person", role: "standard" },
    });
    expect(checkInput(inviteInput, { email: "sam@intranet", name: "Sam", role: "administrator" }).ok).toBe(true);
  });

  it("does not normalise the email's Unicode form (story 1.3's D-15)", () => {
    const nfc = "jos\u00e9@acme.test";
    const nfd = "jose\u0301@acme.test";
    expect(nfc).not.toBe(nfd);
    const value = (email: string) => {
      const checked = checkInput(inviteInput, { email, name: "José", role: "standard" });
      return checked.ok ? checked.value.email : null;
    };
    expect(value(nfc)).toBe(nfc);
    expect(value(nfd)).toBe(nfd);
    expect(value(nfc)).not.toBe(value(nfd));
  });

  it("names the field at fault and refuses extra fields", () => {
    const valid = { email: "sam@acme.test", name: "Sam", role: "standard" };
    const cases: [Record<string, unknown>, string | undefined][] = [
      [{ ...valid, email: "not an email" }, "email"],
      [{ ...valid, email: `${"a".repeat(250)}@acme.test` }, "email"],
      [{ ...valid, name: "   " }, "name"],
      [{ ...valid, name: "n".repeat(81) }, "name"],
      [{ ...valid, role: "owner" }, "role"],
      [{ email: "sam@acme.test", name: "Sam" }, "role"],
      [{ ...valid, inviterId: "someone" }, undefined],
    ];
    for (const [input, field] of cases) {
      const checked = checkInput(inviteInput, input);
      expect(checked.ok, JSON.stringify(input)).toBe(false);
      if (field !== undefined) expect(checked).toEqual({ ok: false, field });
    }
  });
});

describe("the accept input (review finding 10)", () => {
  it("takes the secret, a name and a password under story 1.2's rules", () => {
    expect(checkInput(acceptInput, { secret: SECRET, name: " Sam ", password: "a long enough password" })).toEqual({
      ok: true,
      value: { secret: SECRET, name: "Sam", password: "a long enough password" },
    });
  });

  it("names the field at fault", () => {
    const valid = { secret: SECRET, name: "Sam", password: "a long enough password" };
    const cases: [Record<string, unknown>, string][] = [
      [{ ...valid, secret: "" }, "secret"],
      [{ ...valid, secret: "x".repeat(257) }, "secret"],
      [{ ...valid, name: "" }, "name"],
      [{ ...valid, password: "short" }, "password"],
      [{ ...valid, password: "p".repeat(129) }, "password"],
    ];
    for (const [input, field] of cases) expect(checkInput(acceptInput, input), JSON.stringify(input)).toEqual({ ok: false, field });
    expect(checkInput(acceptInput, { ...valid, email: "sam@acme.test" }).ok).toBe(false);
  });
});

describe("the password rule list (CAP-4)", () => {
  const state = (password: string, email = "sam@acme.test") => passwordRules(password, email).map((rule) => [rule.id, rule.met]);

  it("lists the two rules with D-11's wording", () => {
    expect(passwordRules("", "sam@acme.test").map((rule) => [rule.id, rule.label])).toEqual([
      ["length", "12 to 128 characters"],
      ["notEmail", "Not the same as your email"],
    ]);
  });

  it("meets neither rule with an empty password (review finding 28)", () => {
    expect(state("")).toEqual([
      ["length", false],
      ["notEmail", false],
    ]);
  });

  it("follows the length rule after NFKC, in code points", () => {
    expect(state("a".repeat(11))[0]).toEqual(["length", false]);
    expect(state("a".repeat(12))[0]).toEqual(["length", true]);
    expect(state("a".repeat(128))[0]).toEqual(["length", true]);
    expect(state("a".repeat(129))[0]).toEqual(["length", false]);
    // Twelve emoji are twelve characters.
    expect(state("\u{1F600}".repeat(12))[0]).toEqual(["length", true]);
    // "ﬁ" becomes "fi" under NFKC: six of them are twelve characters.
    expect(state("ﬁ".repeat(6))[0]).toEqual(["length", true]);
  });

  it("follows the not-the-email rule ignoring case, and agrees with the server's check", () => {
    expect(state("sam@acme.test")[1]).toEqual(["notEmail", false]);
    expect(state("SAM@ACME.TEST")[1]).toEqual(["notEmail", false]);
    expect(state("sam@acme.test", "  Sam@Acme.test ")[1]).toEqual(["notEmail", false]);
    expect(state("sam@acme.test!")[1]).toEqual(["notEmail", true]);
    expect(state("x")[1]).toEqual(["notEmail", true]);
  });
});

describe("the invitation refusals (D-3, D-6, D-11)", () => {
  it("have their status and wording", () => {
    expect(REFUSALS.invitation_email_taken).toEqual({ status: 409, message: "That email already has an account." });
    expect(REFUSALS.invitation_unusable).toEqual({
      status: 410,
      message:
        "This invitation link no longer works. It may have been used, replaced by a newer invitation, or expired. Ask an administrator for a new one.",
    });
    expect(REFUSALS.not_signed_in).toEqual({ status: 401, message: "Sign in to do this." });
    expect(REFUSALS.administrator_only).toEqual({ status: 403, message: "Only an administrator can do this." });
  });

  it("name at most the field", () => {
    expect(refusalBody("invitation_email_taken", { field: "email" })).toEqual({
      error: { code: "invitation_email_taken", message: "That email already has an account.", field: "email" },
    });
  });
});
