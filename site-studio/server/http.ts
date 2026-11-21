import {
  REFUSALS,
  refusalBody,
  SIGNIN_BUSY_RETRY_AFTER_SECONDS,
  UPDATING_RETRY_AFTER_SECONDS,
  type RefusalBody,
  type RefusalCode,
} from "../shared/refusal";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
};

/**
 * A JSON reply. `cookies` are whole `Set-Cookie` lines, each appended as its own header (story 1.3,
 * A-9, E-14): a reply can set a session cookie and a marker at once. Every JSON reply is `no-store`,
 * so one that sets or clears a cookie is never cached.
 */
export function jsonResponse(
  value: unknown,
  status = 200,
  headers: Record<string, string> = {},
  cookies: readonly string[] = [],
): Response {
  const all = new Headers({ ...JSON_HEADERS, ...headers });
  for (const cookie of cookies) all.append("set-cookie", cookie);
  return new Response(JSON.stringify(value), { status, headers: all });
}

/** A refusal as an HTTP response: `{ error: { code, message, field? } }`, never an entered value. */
export function refusalResponse(
  code: RefusalCode,
  options: { field?: string; headers?: Record<string, string> } = {},
): Response {
  return refusalBodyResponse(refusalBody(code, { field: options.field }), options.headers);
}

/** The fixed wait of a refusal that carries none in its body: `updating` and `signin_busy`. */
function fixedWait(code: RefusalCode): number | undefined {
  if (code === "updating") return UPDATING_RETRY_AFTER_SECONDS;
  if (code === "signin_busy") return SIGNIN_BUSY_RETRY_AFTER_SECONDS;
  return undefined;
}

/**
 * A refusal body as an HTTP response. A refusal that imposes a wait also carries it as
 * `Retry-After`: the body's `retryAfterSeconds`, or the fixed wait of an `updating` or
 * `signin_busy` refusal (D-5 amended).
 */
export function refusalBodyResponse(
  body: RefusalBody,
  headers: Record<string, string> = {},
  cookies: readonly string[] = [],
): Response {
  const wait = body.error.retryAfterSeconds ?? fixedWait(body.error.code);
  const extra = wait === undefined ? headers : { "retry-after": String(wait), ...headers };
  return jsonResponse(body, REFUSALS[body.error.code].status, extra, cookies);
}
