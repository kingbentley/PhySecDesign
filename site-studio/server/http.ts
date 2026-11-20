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

export function refusalBodyResponse(body: RefusalBody, headers: Record<string, string> = {}): Response {
  const extra = body.error.code === "updating" ? { "retry-after": String(UPDATING_RETRY_AFTER_SECONDS), ...headers } : headers;
  return jsonResponse(body, REFUSALS[body.error.code].status, extra);
}
