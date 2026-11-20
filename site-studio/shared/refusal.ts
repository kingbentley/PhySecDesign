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
} as const satisfies Record<string, { status: number; message: string }>;

export type RefusalCode = keyof typeof REFUSALS;

export interface RefusalBody {
  error: { code: RefusalCode; message: string; field?: string };
}

/** Seconds a caller should wait before resending after an `updating` refusal. */
export const UPDATING_RETRY_AFTER_SECONDS = 5;

const FIELD_NAME = /^[A-Za-z0-9_.\[\]-]{1,80}$/;

/** Builds a refusal body. A field is named only when it looks like a field name, never a value. */
export function refusalBody(code: RefusalCode, options: { field?: string; message?: string } = {}): RefusalBody {
  const error: RefusalBody["error"] = { code, message: options.message ?? REFUSALS[code].message };
  if (options.field !== undefined && FIELD_NAME.test(options.field)) error.field = options.field;
  return { error };
}

export function isRefusalCode(value: unknown): value is RefusalCode {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(REFUSALS, value);
}
