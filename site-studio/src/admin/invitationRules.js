// The invite panel's and the invitation page's field checks, the page's live rule list and the
// expiry's wording (story 1.4, CAP-1, CAP-4, D-11). The checks use the rules the server applies
// (shared/invitation.ts and shared/setup.ts, standing rule 6), so a request is refused by the
// server only for a reason the page cannot know. No message repeats what was typed (AD-22).
//
// Imported only by the lazily loaded panel and page, so the prototype's bundle does not carry the
// rules; tested in server-tests/invitation-page-text.test.ts (review finding 8).
import { inviteInput, passwordRules } from '../../shared/invitation.ts';
import { EMAIL_MAX, PASSWORD_MAX, PASSWORD_MIN, PERSON_NAME_MAX, normalisePassword, personNameField } from '../../shared/setup.ts';

export const INVITE_FIELD_MESSAGES = {
  email: `Enter an email address, such as name@example.com, of at most ${EMAIL_MAX} characters.`,
  name: `Enter the person's name, 1 to ${PERSON_NAME_MAX} characters.`,
  role: 'Choose Standard user or Administrator.',
};

export const ACCEPT_FIELD_MESSAGES = {
  name: `Enter your name, 1 to ${PERSON_NAME_MAX} characters.`,
  password: `Use ${PASSWORD_MIN} to ${PASSWORD_MAX} characters.`,
  passwordIsEmail: 'The password must not be the same as your email.',
  passwordServer: `Use ${PASSWORD_MIN} to ${PASSWORD_MAX} characters, not the same as your email.`,
  passwordAgain: 'The two passwords do not match.',
};

/** The state of a rule as the list says it in text (standing rule 3: not colour alone). */
export const RULE_STATE_TEXT = { met: 'Met', notMet: 'Not yet met' };

/**
 * The page's rule list for the typed password and the invitation's email: each item's id, its
 * label (D-11), whether it is met and its state in text. With an empty password neither is met.
 */
export function ruleItems(password, email) {
  return passwordRules(password, email).map((rule) => ({
    ...rule,
    state: rule.met ? RULE_STATE_TEXT.met : RULE_STATE_TEXT.notMet,
  }));
}

/**
 * Checks the invite panel's values (`{ email, name, role }`) with `inviteInput`. Returns
 * `{ errors, input }`: `errors` maps each field at fault to its message.
 */
export function checkInviteFields(values) {
  const input = { email: values.email, name: values.name, role: values.role };
  const parsed = inviteInput.safeParse(input);
  const errors = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === 'string' && INVITE_FIELD_MESSAGES[field]) errors[field] = INVITE_FIELD_MESSAGES[field];
    }
  }
  return { errors, input };
}

/**
 * Checks the invitation page's values (`{ name, password, passwordAgain }`) against the
 * invitation's email. A password that breaks a listed rule cannot be sent (criterion 5).
 */
export function checkAcceptFields(values, email) {
  const errors = {};
  if (!personNameField.safeParse(values.name).success) errors.name = ACCEPT_FIELD_MESSAGES.name;
  const [length, notEmail] = passwordRules(values.password, email);
  if (!length.met) errors.password = ACCEPT_FIELD_MESSAGES.password;
  else if (!notEmail.met) errors.password = ACCEPT_FIELD_MESSAGES.passwordIsEmail;
  // Checked whatever the password's own fault, so one submit names both problems.
  if (normalisePassword(values.passwordAgain) !== normalisePassword(values.password)) {
    errors.passwordAgain = ACCEPT_FIELD_MESSAGES.passwordAgain;
  }
  return errors;
}

/**
 * The expiry in the browser's local time, as "28 November 2026, 22:00" (D-11 as amended, review
 * finding 24). `timeZone` is for tests; the page leaves it to the browser.
 */
export function expiryWording(expiresAt, timeZone) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone,
  }).formatToParts(new Date(expiresAt));
  const part = (type) => parts.find((item) => item.type === type)?.value ?? '';
  return `${part('day')} ${part('month')} ${part('year')}, ${part('hour')}:${part('minute')}`;
}

/** The result's sentence (D-11). */
export function expirySentence(expiresAt, timeZone) {
  return `This link works once and expires on ${expiryWording(expiresAt, timeZone)}. Anyone who has it can create this account, so pass it on privately.`;
}

/** The page's line saying who invited the person and as what (D-11). */
export function invitedAsLine(inviterName, role) {
  return `${inviterName} invited you as ${role === 'administrator' ? 'an administrator' : 'a standard user'}.`;
}

/** What the page says when the browser is signed in already (D-4 as amended, review finding 20). */
export function signedInNotice(name) {
  return `You are signed in as ${name}. Setting this password signs you out.`;
}
