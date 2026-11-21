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
