// My account's and the invitation page's talk with the server about two-step verification
// (story 1.5, spec 7; CAP-1, CAP-2, CAP-7, CAP-8; D-1, D-10, D-11, D-12, D-21), each reply mapped
// to what the page shows by a pure function, and the page's own rules: the key in groups of four,
// the authenticator entry's name and the recovery-codes file. No message here ever repeats what was
// typed; the secret, the URI and the codes are only returned to the caller, which keeps them in
// component state (never in storage, the address bar or a log).
//
// Imported only by the lazily loaded My account dialog, the set-up view and the invitation page,
// so the prototype's bundle does not carry it. It imports shared/twoStep.ts, so it is tested in
// server-tests/two-step-page-text.test.ts, not under `node --test`.
import { REFUSALS } from '../../shared/refusal.ts';
import { SIGNIN_PASSWORD_MAX_UNITS } from '../../shared/signin.ts';
import { RECOVERY_CODE_COUNT, formatRecoveryCode, normaliseRecoveryCode } from '../../shared/twoStep.ts';
import { NO_ANSWER, appHeaders, postJson } from '../admin/postJson.js';
import { SIGN_IN_MESSAGES, waitMessage } from '../admin/signInClient.js';
import { expiryWording } from '../admin/invitationRules.js';

export const TWO_STEP_STATE_URL = '/api/v1/account/two-step';
const START_URL = '/api/v1/account/two-step/start';
const CONFIRM_URL = '/api/v1/account/two-step/confirm';
const TURN_OFF_URL = '/api/v1/account/two-step/turn-off';
const RECOVERY_CODES_URL = '/api/v1/account/two-step/recovery-codes';

/** How long each request may take before it counts as no answer. Password checks include a slow hash. */
export const STATE_TIMEOUT_MS = 10000;
export const PASSWORD_TIMEOUT_MS = 30000;
export const CONFIRM_TIMEOUT_MS = 15000;

/** The download's file name (D-21). */
export const RECOVERY_CODES_FILE_NAME = 'site-survey-design-recovery-codes.txt';

/**
 * The page's wording (D-21, `wording.md`). The field checks reuse existing text: the password's is
 * the sign-in page's, the code's is the second step's field check (S-26).
 */
export const TWO_STEP_MESSAGES = {
  noKey: REFUSALS.deployment_key_missing.message,
  mismatch: REFUSALS.deployment_key_mismatch.message,
  recoveryStillWorks: 'You can still sign in with a recovery code.',
  loadFailed: 'Two-step verification could not be loaded. Check the connection and try again.',
  turnedOff: 'Two-step verification is off.',
  copyCodesFailed: 'The codes could not be copied. Select them and copy them, or download them.',
  copyKeyFailed: 'The key could not be copied. Select it and copy it.',
  passwordField: `Enter your password, of at most ${SIGNIN_PASSWORD_MAX_UNITS} characters.`,
  codeField: 'Enter the 6 digits from your authenticator app.',
};

const isObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

function refusalOf(body) {
  return isObject(body?.error) ? body.error : {};
}

/** The key as shown: groups of four separated by spaces (D-6). */
export function groupedKey(secret) {
  return (secret.match(/.{1,4}/gu) ?? []).join(' ');
}

/** The authenticator entry's name as the app shows it (D-7): any ":" in either part becomes a space. */
export function entryName(installationName, email) {
  return `${installationName.replace(/:/gu, ' ')}:${email.replace(/:/gu, ' ')}`;
}

/** The set-up's sentence naming the entry (D-21). */
export function entryNameLine(installationName, email) {
  return `Choose a time-based key. The entry will be named ${entryName(installationName, email)}.`;
}

/** The QR image's accessible name (D-21). */
export function qrLabel(installationName) {
  return `QR code to add ${installationName} to your authenticator app`;
}

/** The count line (D-21). */
export function recoveryCodesLeftLine(count) {
  return count === 0
    ? 'No recovery codes left. Make a fresh set so you can still sign in if you lose your phone.'
    : `Recovery codes left: ${count} of ${RECOVERY_CODE_COUNT}`;
}

/** A recovery code as shown: four groups of four joined by hyphens (D-9). */
export function shownRecoveryCode(code) {
  const normalised = normaliseRecoveryCode(code);
  return normalised === null ? code : formatRecoveryCode(normalised);
}

/**
 * The recovery-codes file (D-21's "Download file"): LF line ends, `Made:` in local time as story
 * 1.4's expiry. `timeZone` is for tests; the page leaves it to the browser.
 */
export function recoveryCodesFile({ installationName, email, made, codes, timeZone }) {
  const lines = [
    'Site Survey Design recovery codes',
    `Installation: ${installationName}`,
    `Account: ${email}`,
    `Made: ${expiryWording(made, timeZone)}`,
    '',
    'Each code works once.',
    '',
    ...codes.map(shownRecoveryCode),
  ];
  return `${lines.join('\n')}\n`;
}

/** True when `body` is the state read's declared reply (`twoStepStateReply`). */
function isStateReply(body) {
  return isObject(body)
    && typeof body.enabled === 'boolean'
    && Number.isInteger(body.recoveryCodesRemaining)
    && body.recoveryCodesRemaining >= 0 && body.recoveryCodesRemaining <= RECOVERY_CODE_COUNT
    && ['available', 'no_key', 'key_mismatch'].includes(body.availability)
    && typeof body.email === 'string';
}

/**
 * Maps the state read's reply to what the dialog shows. Returns one of
 * `{ kind: 'state', state: { enabled, recoveryCodesRemaining, availability, email } }`,
 * `{ kind: 'signedOut' }` (`not_signed_in`) or `{ kind: 'failed' }` ("could not be loaded").
 */
export function stateOutcome(status, body) {
  if (status >= 200 && status < 300) {
    if (!isStateReply(body)) return { kind: 'failed' };
    const { enabled, recoveryCodesRemaining, availability, email } = body;
    return { kind: 'state', state: { enabled, recoveryCodesRemaining, availability, email } };
  }
  if (refusalOf(body).code === 'not_signed_in') return { kind: 'signedOut' };
  return { kind: 'failed' };
}

/** True when `codes` is a set of recovery codes as the server answers them. */
function isCodeSet(codes) {
  return Array.isArray(codes) && codes.length === RECOVERY_CODE_COUNT
    && codes.every((code) => typeof code === 'string' && normaliseRecoveryCode(code) !== null);
}

/**
 * Maps a refusal of one of the account actions to what the page shows. Returns one of
 * `{ kind: 'signedOut' }`, `{ kind: 'field', field }` (`password` or `code`),
 * `{ kind: 'expired', message }` (`two_step_setup_expired`: back to the start) or
 * `{ kind: 'refused', message }` (shown in the alert).
 * @param {number} status
 * @param {unknown} body
 * @param {string | null} [retryAfter]
 */
export function refusalOutcome(status, body, retryAfter = null) {
  const error = refusalOf(body);
  switch (error.code) {
    case 'not_signed_in':
      return { kind: 'signedOut' };
    case 'invalid_input':
      if (error.field === 'password' || error.field === 'code') return { kind: 'field', field: error.field };
      return { kind: 'refused', message: SIGN_IN_MESSAGES.invalid_input };
    case 'two_step_setup_expired':
      return { kind: 'expired', message: REFUSALS.two_step_setup_expired.message };
    case 'signin_wait': {
      const seconds = Number.isFinite(error.retryAfterSeconds)
        ? error.retryAfterSeconds
        : retryAfter === null || retryAfter === undefined ? undefined : Number(retryAfter);
      return { kind: 'refused', message: waitMessage(seconds) };
    }
    case 'signin_busy':
      return { kind: 'refused', message: SIGN_IN_MESSAGES.busy };
    case 'updating':
      return { kind: 'refused', message: SIGN_IN_MESSAGES.updating };
    default:
      if (typeof error.code === 'string' && Object.prototype.hasOwnProperty.call(REFUSALS, error.code)) {
        return { kind: 'refused', message: REFUSALS[error.code].message };
      }
      return { kind: 'refused', message: SIGN_IN_MESSAGES.network };
  }
}

/**
 * Maps the start reply. Success is
 * `{ kind: 'started', setup: { setupId, secret, otpauthUri, installationName, email } }`;
 * otherwise as `refusalOutcome`.
 */
export function startOutcome(status, body, retryAfter = null) {
  if (status >= 200 && status < 300) {
    if (isObject(body) && ['setupId', 'secret', 'otpauthUri', 'installationName', 'email'].every((key) => typeof body[key] === 'string')
      && /^[0-9a-f]{32}$/.test(body.setupId) && /^[A-Z2-7]+$/.test(body.secret) && body.otpauthUri.startsWith('otpauth://totp/')) {
      const { setupId, secret, otpauthUri, installationName, email } = body;
      return { kind: 'started', setup: { setupId, secret, otpauthUri, installationName, email } };
    }
    return { kind: 'refused', message: SIGN_IN_MESSAGES.network };
  }
  return refusalOutcome(status, body, retryAfter);
}

/** Maps a confirm or fresh-codes reply: `{ kind: 'codes', codes }`, or as `refusalOutcome`. */
export function codesOutcome(status, body, retryAfter = null) {
  if (status >= 200 && status < 300) {
    if (isObject(body) && isCodeSet(body.recoveryCodes)) return { kind: 'codes', codes: body.recoveryCodes.map(shownRecoveryCode) };
    return { kind: 'refused', message: SIGN_IN_MESSAGES.network };
  }
  return refusalOutcome(status, body, retryAfter);
}

/** Maps the turn-off reply: `{ kind: 'off' }`, or as `refusalOutcome`. */
export function turnOffOutcome(status, body, retryAfter = null) {
  if (status >= 200 && status < 300) {
    if (isObject(body) && body.enabled === false) return { kind: 'off' };
    return { kind: 'refused', message: SIGN_IN_MESSAGES.network };
  }
  return refusalOutcome(status, body, retryAfter);
}

const NO_ANSWER_OUTCOME = { kind: 'refused', message: SIGN_IN_MESSAGES.network };

/** One GET of a JSON read under one deadline; resolves to `{ status, body }` or `NO_ANSWER`. */
async function getJson(fetcher, url, timeoutMs) {
  const controller = new AbortController();
  let timer;
  const deadline = new Promise((resolve) => {
    timer = setTimeout(() => {
      controller.abort();
      resolve(NO_ANSWER);
    }, timeoutMs);
  });
  const attempt = (async () => {
    const response = await fetcher(url, {
      headers: { accept: 'application/json' },
      credentials: 'same-origin',
      cache: 'no-store',
      signal: controller.signal,
    });
    let body = null;
    try { body = await response.json(); } catch { body = null; }
    return { status: response.status, body };
  })().catch(() => NO_ANSWER);
  try {
    return await Promise.race([attempt, deadline]);
  } finally {
    clearTimeout(timer);
  }
}

/** Reads the signed-in account's two-step state; resolves as `stateOutcome` does. */
export async function readTwoStepState(fetcher = fetch, { timeoutMs = STATE_TIMEOUT_MS } = {}) {
  const reply = await getJson(fetcher, TWO_STEP_STATE_URL, timeoutMs);
  if (reply === NO_ANSWER) return { kind: 'failed' };
  return stateOutcome(reply.status, reply.body);
}

async function post(fetcher, url, input, timeoutMs, loadHeaders, outcome) {
  const reply = await postJson(fetcher, url, JSON.stringify(input), { timeoutMs, loadHeaders });
  if (reply === NO_ANSWER) return NO_ANSWER_OUTCOME;
  return outcome(reply.status, reply.body, reply.retryAfter);
}

/** Starts turning on with `{ password }`; resolves as `startOutcome` does. */
export function startTwoStep(input, fetcher = fetch, { timeoutMs = PASSWORD_TIMEOUT_MS, loadHeaders = appHeaders } = {}) {
  return post(fetcher, START_URL, input, timeoutMs, loadHeaders, startOutcome);
}

/** Confirms a set-up with `{ setupId, code }`; resolves as `codesOutcome` does. */
export function confirmTwoStep(input, fetcher = fetch, { timeoutMs = CONFIRM_TIMEOUT_MS, loadHeaders = appHeaders } = {}) {
  return post(fetcher, CONFIRM_URL, input, timeoutMs, loadHeaders, codesOutcome);
}

/** Turns off with `{ password }`; resolves as `turnOffOutcome` does. */
export function turnOffTwoStep(input, fetcher = fetch, { timeoutMs = PASSWORD_TIMEOUT_MS, loadHeaders = appHeaders } = {}) {
  return post(fetcher, TURN_OFF_URL, input, timeoutMs, loadHeaders, turnOffOutcome);
}

/** Makes fresh recovery codes with `{ password, code }`; resolves as `codesOutcome` does. */
export function freshRecoveryCodes(input, fetcher = fetch, { timeoutMs = PASSWORD_TIMEOUT_MS, loadHeaders = appHeaders } = {}) {
  return post(fetcher, RECOVERY_CODES_URL, input, timeoutMs, loadHeaders, codesOutcome);
}
