import { REFUSALS, refusalBody, UPDATING_RETRY_AFTER_SECONDS, type RefusalBody, type RefusalCode } from "../shared/refusal";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
};

export function jsonResponse(value: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(value), { status, headers: { ...JSON_HEADERS, ...headers } });
}

/** A refusal as an HTTP response: `{ error: { code, message, field? } }`, never an entered value. */
export function refusalResponse(
  code: RefusalCode,
  options: { field?: string; headers?: Record<string, string> } = {},
): Response {
  return refusalBodyResponse(refusalBody(code, { field: options.field }), options.headers);
}

/**
 * A refusal body as an HTTP response. A refusal that imposes a wait also carries it as
 * `Retry-After`: the body's `retryAfterSeconds`, or the fixed wait of an `updating` refusal.
 */
export function refusalBodyResponse(body: RefusalBody, headers: Record<string, string> = {}): Response {
  const wait = body.error.retryAfterSeconds ?? (body.error.code === "updating" ? UPDATING_RETRY_AFTER_SECONDS : undefined);
  const extra = wait === undefined ? headers : { "retry-after": String(wait), ...headers };
  return jsonResponse(body, REFUSALS[body.error.code].status, extra);
}
