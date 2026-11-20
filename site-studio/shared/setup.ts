import { z } from "zod";

// The set-up input rules (story 1.2), written once for the browser and the server (standing
// rule 6). CA-03: a password has 12 to 128 characters and does not equal the account's email,
// with no other composition rule. CA-04: an installation's name has 1 to 80 characters. D-4: a
// person's name has 1 to 80 characters; the email passes a light format check, has at most 254
// characters and is stored lower-cased; "not equal to the email" ignores letter case.
//
// Lengths count characters as people see them in the simplest sense, Unicode code points, so an
// emoji counts once. Names and the email are trimmed of surrounding spaces before they are
// measured and stored; a password is taken exactly as typed.

export const INSTALLATION_NAME_MAX = 80;
export const PERSON_NAME_MAX = 80;
export const EMAIL_MAX = 254;
export const PASSWORD_MIN = 12;
export const PASSWORD_MAX = 128;
/** An upper bound on the set-up code a request may carry, so no field is unbounded. */
export const SETUP_CODE_INPUT_MAX = 256;

/** The number of Unicode code points in a string. */
export function characterCount(value: string): number {
  let count = 0;
  for (const _ of value) count += 1;
  return count;
}

function trimmedText(max: number) {
  return z
    .string()
    .transform((value) => value.trim())
    .refine((value) => {
      const count = characterCount(value);
      return count >= 1 && count <= max;
    });
}

/** An installation's name: 1 to 80 characters after trimming (CA-04). */
export const installationNameField = trimmedText(INSTALLATION_NAME_MAX);

/** A person's name: 1 to 80 characters after trimming (D-4). */
export const personNameField = trimmedText(PERSON_NAME_MAX);

// Light check: one "@" with something on each side, no spaces or control characters, and a domain
// that neither starts nor ends with a dot. A dot in the domain is not required, so an intranet
// address such as "admin@intranet" is accepted.
const LIGHT_EMAIL = /^[^\s@\p{Cc}]+@[^\s@\p{Cc}.][^\s@\p{Cc}]*$/u;

export function normaliseEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isLightlyValidEmail(normalised: string): boolean {
  return characterCount(normalised) <= EMAIL_MAX && LIGHT_EMAIL.test(normalised) && !normalised.endsWith(".");
}

/** An email address: trimmed, lower-cased, at most 254 characters, light format check (D-4). */
export const emailField = z.string().transform(normaliseEmail).refine(isLightlyValidEmail);

/** A password's own rule: 12 to 128 characters, nothing else (CA-03). */
export const passwordField = z.string().refine((value) => {
  const count = characterCount(value);
  return count >= PASSWORD_MIN && count <= PASSWORD_MAX;
});

/** True when the password equals the email, ignoring letter case (CA-03, D-4). */
export function passwordEqualsEmail(password: string, email: string): boolean {
  return password.toLowerCase() === normaliseEmail(email);
}

/** The set-up code as sent: present and bounded. Its value is checked by the server, never here. */
export const setupCodeField = z.string().min(1).max(SETUP_CODE_INPUT_MAX);

/**
 * The set-up request's input. A refusal names the first field at fault: `code`, `installationName`,
 * `name`, `email` or `password` (a password equal to the email names `password`).
 */
export const setupInput = z
  .object({
    code: setupCodeField,
    installationName: installationNameField,
    name: personNameField,
    email: emailField,
    password: passwordField,
  })
  .strict()
  .superRefine((value, context) => {
    if (passwordEqualsEmail(value.password, value.email)) {
      context.addIssue({ code: "custom", path: ["password"], message: "The password must not equal the email." });
    }
  });

export type SetupInput = z.infer<typeof setupInput>;

/** Whether set-up is open: the only thing the public state route will reveal (CA-52). */
export const SETUP_STATES = ["open", "closed"] as const;
export type SetupState = (typeof SETUP_STATES)[number];
