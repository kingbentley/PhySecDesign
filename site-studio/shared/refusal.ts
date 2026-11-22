// Every refusal the server sends: a reason code, its HTTP status and its wording (AD-22).
// A refusal never repeats a value the caller entered; at most it names the field.

export const REFUSALS = {
  invalid_input: { status: 400, message: "The request is not valid." },
  not_found: { status: 404, message: "There is nothing at this address." },
  method_not_allowed: { status: 405, message: "This address does not accept that method." },
  not_available: {
    status: 404,
    message: "Review links are not available on this server yet. They work only in the local development server.",
  },
  updating: { status: 503, message: "Site Survey Design is updating, try again shortly." },
  data_newer_than_build: {
    status: 503,
    message:
      "This data was written by a newer release of Site Survey Design than the one running here. Install that release or a newer one to use it.",
  },
  update_not_completed: {
    status: 503,
    message: "An update was not completed: this data is from an earlier release and has not been converted yet.",
  },
  internal_error: { status: 500, message: "Something went wrong on the server. Try again." },
  // Set-up (story 1.2).
  setup_closed: { status: 409, message: "Set-up is already complete: this installation has an administrator." },
  setup_code_wrong: { status: 403, message: "That set-up code is not correct." },
  setup_wait: {
    status: 429,
    message:
      "Too many wrong set-up codes. Wait before trying again, or deploy again to get a fresh set-up code, which starts the count again.",
  },
  setup_code_not_configured: {
    status: 503,
    message: "Set-up is not available yet: no set-up code has been issued for this installation.",
  },
  origin_refused: { status: 403, message: "This request must come from Site Survey Design's own page." },
  // D-7: a Worker copy still running with a replaced code's secret (the minutes after a deploy).
  setup_code_replaced: { status: 409, message: "A new set-up code was issued. Try again in a minute." },
  // D-8: a server request that reached Cloudflare over plain HTTP is refused, never redirected.
  https_required: { status: 403, message: "This address must be reached over HTTPS: use https:// instead of http://." },
  // Sign-in (story 1.3). One message for a wrong email, a wrong password, an inactive account and
  // every ticket fault (CAP-2, D-5 amended). The wait and the busy refusal are the same for every
  // email; the page composes the wait's duration itself (A-19, D-8).
  signin_failed: { status: 401, message: "That email and password do not match." },
  signin_wait: { status: 429, message: "Too many attempts. Wait before trying again." },
  signin_busy: { status: 503, message: "Site Survey Design is busy. Try again shortly." },
  // Invitations (story 1.4, D-3, D-6, D-11). One refusal for a link that is used, replaced,
  // expired, unknown or malformed. `not_signed_in` and `administrator_only` are a stop-gap that
  // story 1.8's route classes replace.
  invitation_email_taken: { status: 409, message: "That email already has an account." },
  invitation_unusable: {
    status: 410,
    message:
      "This invitation link no longer works. It may have been used, replaced by a newer invitation, or expired. Ask an administrator for a new one.",
  },
  not_signed_in: { status: 401, message: "Sign in to do this." },
  administrator_only: { status: 403, message: "Only an administrator can do this." },
  // Two-step verification (story 1.5, D-13, D-21). A wrong or reused code is one message, a wrong
  // or used recovery code another, and a missing, expired or foreign pending sign-in a third.
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
  // The deployment key (story 1.5, D-14, D-15): no key and nothing encrypted, or a key that does
  // not match the fingerprint stored with the first encrypted value (or none once one is stored).
  deployment_key_missing: {
    status: 503,
    message: "Two-step verification is not available on this installation yet: it has no deployment key. Ask an administrator.",
  },
  deployment_key_mismatch: {
    status: 503,
    message:
      "Two-step verification cannot be checked on this installation: its deployment key does not match the one its secrets were saved with. Ask an administrator to deploy it again with the original key.",
  },
} as const satisfies Record<string, { status: number; message: string }>;

export type RefusalCode = keyof typeof REFUSALS;

export interface RefusalBody {
  error: {
    code: RefusalCode;
    message: string;
    field?: string;
    /** Whole seconds to wait before trying again, for refusals that impose a wait. Never an entered value. */
    retryAfterSeconds?: number;
  };
}

/** Seconds a caller should wait before resending after an `updating` refusal. */
export const UPDATING_RETRY_AFTER_SECONDS = 5;

/** Seconds a caller should wait before resending after a `signin_busy` refusal (D-5 amended). */
export const SIGNIN_BUSY_RETRY_AFTER_SECONDS = 5;

const FIELD_NAME = /^[A-Za-z0-9_.\[\]-]{1,80}$/;

/** Builds a refusal body. A field is named only when it looks like a field name, never a value. */
export function refusalBody(
  code: RefusalCode,
  options: { field?: string; message?: string; retryAfterSeconds?: number } = {},
): RefusalBody {
  const error: RefusalBody["error"] = { code, message: options.message ?? REFUSALS[code].message };
  if (options.field !== undefined && FIELD_NAME.test(options.field)) error.field = options.field;
  const wait = options.retryAfterSeconds;
  if (typeof wait === "number" && Number.isFinite(wait) && wait > 0) error.retryAfterSeconds = Math.ceil(wait);
  return { error };
}

export function isRefusalCode(value: unknown): value is RefusalCode {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(REFUSALS, value);
}
