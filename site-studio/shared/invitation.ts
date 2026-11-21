import { z } from "zod";
import {
  characterCount,
  emailField,
  normalisePassword,
  PASSWORD_MAX,
  PASSWORD_MIN,
  passwordEqualsEmail,
  passwordField,
  personNameField,
} from "./setup";

// The invitation rules (story 1.4), written once for the browser and the server (standing rule 6).
//
// An invitation lasts 7 days from its issue (CA-09). Its secret is 32 random bytes, base64url
// without padding: 43 characters (CA-55). The server keeps only the secret's SHA-256. The secret a
// request carries is accepted at any length from 1 to 256 characters; one that is not 43 base64url
// characters is answered "this link no longer works", like any other unusable link (D-3), so a
// truncated copy gets the page's message rather than "not valid".
//
// The invited email is compared as `normaliseEmail` gives it (trimmed, lower case, no Unicode
// normalisation; story 1.3's D-15), and the name passes `personNameField`. The password follows
// story 1.2's two rules, which `passwordRules` lists for the invitation page.

/** An invitation lasts 7 days from its issue (CA-09). */
export const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** The secret's length: 32 bytes as base64url without padding. */
export const INVITATION_SECRET_LENGTH = 43;
/** The most characters a request's secret may have before it is refused as not valid. */
export const INVITATION_SECRET_INPUT_MAX = 256;

export const INVITATION_ROLES = ["administrator", "standard"] as const;
export type InvitationRole = (typeof INVITATION_ROLES)[number];

const SECRET_PATTERN = new RegExp(`^[A-Za-z0-9_-]{${INVITATION_SECRET_LENGTH}}$`);

/** True when a secret has the shape of one the server issues. Says nothing of whether it is live. */
export function isWellFormedInvitationSecret(value: string): boolean {
  return SECRET_PATTERN.test(value);
}

/** The invite request's input: email, name and role. A refusal names the field at fault. */
export const inviteInput = z
  .object({
    email: emailField,
    name: personNameField,
    role: z.enum(INVITATION_ROLES),
  })
  .strict();

export type InviteInput = z.infer<typeof inviteInput>;

/** The secret as a request carries it: present and bounded; its shape is checked separately. */
export const invitationSecretField = z.string().min(1).max(INVITATION_SECRET_INPUT_MAX);

/**
 * The accept request's input. The password's equality with the invitation's email is checked once
 * the invitation is read, since the email is not part of the request.
 */
export const acceptInput = z
  .object({
    secret: invitationSecretField,
    name: personNameField,
    password: passwordField,
  })
  .strict();

export type AcceptInput = z.infer<typeof acceptInput>;

export type PasswordRuleId = "length" | "notEmail";

export interface PasswordRule {
  id: PasswordRuleId;
  /** The rule as the page lists it (D-11). */
  label: string;
  met: boolean;
}

/**
 * Story 1.2's two password rules for the given password and email, each with whether it is met,
 * for the invitation page's live list. With an empty password neither rule is met.
 */
export function passwordRules(password: string, email: string): PasswordRule[] {
  const count = characterCount(normalisePassword(password));
  const present = password.length > 0;
  return [
    { id: "length", label: `${PASSWORD_MIN} to ${PASSWORD_MAX} characters`, met: count >= PASSWORD_MIN && count <= PASSWORD_MAX },
    { id: "notEmail", label: "Not the same as your email", met: present && !passwordEqualsEmail(password, email) },
  ];
}
