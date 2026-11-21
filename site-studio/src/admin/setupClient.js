// The set-up page's talk with the server (story 1.2, S-25) and its field checks. The checks use
// the same rules the server applies (shared/setup.ts, standing rule 6), so a request the page
// sends is refused by the server only for a reason the page cannot know (a wrong code, a wait).
// No message here ever repeats what was typed (AD-22).
import {
  EMAIL_MAX,
  INSTALLATION_NAME_MAX,
  PASSWORD_MAX,
  PASSWORD_MIN,
  PERSON_NAME_MAX,
  emailField,
  installationNameField,
  normalisePassword,
  normaliseSetupCode,
  passwordEqualsEmail,
  passwordField,
  personNameField,
  setupCodeField,
} from '../../shared/setup.ts';
import { APP_HEADER, APP_HEADER_VALUE } from '../../shared/routes.ts';
import { waitWording } from './waitWording.js';

const SETUP_URL = '/api/v1/setup';

/** The fields in page order: the order a refusal's focus follows. */
export const SETUP_FIELDS = ['code', 'installationName', 'name', 'email', 'password', 'passwordAgain'];

export const FIELD_MESSAGES = {
  code: 'Enter the set-up code from the end of the deployment. Letter case, spaces and dashes do not matter.',
  installationName: `Enter a name of 1 to ${INSTALLATION_NAME_MAX} characters.`,
  name: `Enter your name, 1 to ${PERSON_NAME_MAX} characters.`,
  email: `Enter an email address, such as name@example.com, of at most ${EMAIL_MAX} characters.`,
  password: `Use ${PASSWORD_MIN} to ${PASSWORD_MAX} characters.`,
  passwordIsEmail: 'The password must not be the same as your email.',
  passwordServer: `Use ${PASSWORD_MIN} to ${PASSWORD_MAX} characters, not the same as your email.`,
  passwordAgain: 'The two passwords do not match.',
};

export const FIELD_HINTS = {
  code: 'Shown once at the end of the Cloudflare deployment. It proves you are the person who installed Site Survey Design.',
  installationName: `Usually your organisation's name. 1 to ${INSTALLATION_NAME_MAX} characters.`,
  password: `${PASSWORD_MIN} to ${PASSWORD_MAX} characters, and not your email. There are no other rules.`,
};

/**
 * Checks the entered values against the set-up rules. Returns `{ errors, input }`: `errors` maps a
 * field to its message (empty when every field passes), `input` is the request body to send.
 */
export function checkSetupFields(values) {
  const errors = {};
  // The server compares codes the same way: spaces and dashes removed, upper case.
  const code = normaliseSetupCode(values.code);
  if (!setupCodeField.safeParse(code).success) errors.code = FIELD_MESSAGES.code;
  if (!installationNameField.safeParse(values.installationName).success) {
    errors.installationName = FIELD_MESSAGES.installationName;
  }
  if (!personNameField.safeParse(values.name).success) errors.name = FIELD_MESSAGES.name;
  if (!emailField.safeParse(values.email).success) errors.email = FIELD_MESSAGES.email;
  // Measured after NFKC, as the server measures it (D-9).
  if (!passwordField.safeParse(values.password).success) errors.password = FIELD_MESSAGES.password;
  else if (passwordEqualsEmail(values.password, values.email)) errors.password = FIELD_MESSAGES.passwordIsEmail;
  // Checked whatever the password's own fault, so one submit names both problems.
  if (normalisePassword(values.passwordAgain) !== normalisePassword(values.password)) {
    errors.passwordAgain = FIELD_MESSAGES.passwordAgain;
  }
  const input = {
    code,
    installationName: values.installationName,
    name: values.name,
    email: values.email,
    password: values.password,
  };
  return { errors, input };
}

// Moved to its own module for the sign-in page (story 1.3); still exported from here.
export { waitWording };

const GENERAL = {
  setup_code_wrong: 'That set-up code is not correct. Check the code from the deployment output and try again.',
  setup_code_not_configured:
    'Set-up is not available yet: no set-up code has been issued for this installation. Deploy again to get one.',
  origin_refused: "Set-up must be sent from this installation's own page. Open the set-up page from its address and try again.",
  updating: 'Site Survey Design is updating. Try again in a moment.',
  // Story 1.3, D-5 amended: the password hash queue is full; the same message as at sign-in.
  signin_busy: 'Site Survey Design is busy. Try again shortly.',
  // D-7: the request reached a copy of the server that still has the earlier code.
  setup_code_replaced: 'A new set-up code was issued moments ago. Wait about a minute, then try again with the newest code.',
  // D-8: only over HTTPS.
  https_required: "Set-up must be sent over HTTPS. Open this installation's https:// address and set up from there.",
  // Not fixed by trying again.
  data_newer_than_build:
    'This installation holds data from a newer release of Site Survey Design than the one running here. Install that release or a newer one, then open this page again.',
  update_not_completed:
    "An update of this installation was not completed, so set-up cannot run. Complete the update, then open this page again.",
  not_found: "This server does not offer set-up at this address. Check that you opened this installation's own address.",
  invalid_input: 'Some of the details were not accepted. Check each field and try again.',
  network: 'The server could not be reached. Check the connection and try again.',
  other: 'Set-up could not be completed. Try again.',
};

/**
 * Sends the set-up request. Resolves to one of:
 * `{ kind: 'done', installationName, email }`, `{ kind: 'closed' }`,
 * `{ kind: 'field', field, message }` or `{ kind: 'refused', message, focus }`.
 */
export async function submitSetup(input, fetcher = fetch) {
  let response;
  try {
    response = await fetcher(SETUP_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json', [APP_HEADER]: APP_HEADER_VALUE },
      body: JSON.stringify(input),
      credentials: 'same-origin',
    });
  } catch {
    return { kind: 'refused', message: GENERAL.network, focus: null };
  }
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (response.ok) {
    if (typeof body?.installationName === 'string' && typeof body?.email === 'string') {
      return { kind: 'done', installationName: body.installationName, email: body.email };
    }
    return { kind: 'refused', message: GENERAL.other, focus: null };
  }
  const error = body?.error ?? {};
  switch (error.code) {
    case 'setup_closed':
      return { kind: 'closed' };
    case 'setup_code_wrong':
      return { kind: 'refused', message: GENERAL.setup_code_wrong, focus: 'code' };
    case 'setup_code_replaced':
      return { kind: 'refused', message: GENERAL.setup_code_replaced, focus: 'code' };
    case 'setup_wait': {
      const header = response.headers.get('retry-after');
      const seconds = Number.isFinite(error.retryAfterSeconds) ? error.retryAfterSeconds : header === null ? undefined : Number(header);
      return {
        kind: 'refused',
        message: `Too many wrong set-up codes. Wait ${waitWording(seconds)} before trying again, or deploy again to get a fresh set-up code, which starts the count again.`,
        focus: 'code',
      };
    }
    case 'invalid_input': {
      const field = error.field;
      if (field === 'password') return { kind: 'field', field, message: FIELD_MESSAGES.passwordServer };
      if (SETUP_FIELDS.includes(field)) return { kind: 'field', field, message: FIELD_MESSAGES[field] };
      return { kind: 'refused', message: GENERAL.invalid_input, focus: null };
    }
    case 'setup_code_not_configured':
    case 'origin_refused':
    case 'updating':
    case 'signin_busy':
    case 'https_required':
    case 'data_newer_than_build':
    case 'update_not_completed':
    case 'not_found':
      return { kind: 'refused', message: GENERAL[error.code], focus: null };
    case 'method_not_allowed':
    case 'not_available':
      return { kind: 'refused', message: GENERAL.not_found, focus: null };
    default:
      return { kind: 'refused', message: GENERAL.other, focus: null };
  }
}
