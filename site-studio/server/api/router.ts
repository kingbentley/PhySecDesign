import { APP_HEADER, APP_HEADER_VALUE, checkInput, routesForPath, type RouteDeclaration } from "../../shared/routes";
import { prefixedCookies } from "../auth/session";
import type { Env } from "../env";
import { jsonResponse, refusalBodyResponse, refusalResponse } from "../http";
import { HANDLERS, type HandlerResult, type RequestContext } from "./handlers";

// Answers every request under /api/v1/, /mcp and /.well-known/ through the route declarations:
// find the declaration, check the origin rule where it applies, check the input against its
// schema, run the handler, check the reply, append the cookies the handler set.

const MAX_BODY_BYTES = 1024 * 1024;

export async function handleApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const candidates = routesForPath(url.pathname);
  if (candidates.length === 0) return refusalResponse("not_found");
  const route = candidates.find((candidate) => candidate.method === request.method);
  if (!route) {
    return refusalResponse("method_not_allowed", { headers: { allow: candidates.map((c) => c.method).join(", ") } });
  }

  // Before the body is read: another site's page cannot drive this request (standing rule 13).
  if (route.appOriginOnly && !isFromAppOrigin(request, url)) return refusalResponse("origin_refused");

  const raw = await readInput(request, url, route);
  if (!raw.ok) return refusalResponse("invalid_input");
  const input = checkInput(route.input, raw.value);
  if (!input.ok) return refusalResponse("invalid_input", { field: input.field });

  const handler = HANDLERS[route.id as keyof typeof HANDLERS] as
    | ((input: unknown, env: Env, context: RequestContext) => Promise<HandlerResult<unknown>>)
    | undefined;
  if (!handler) return refusalResponse("not_found");
  const result = await handler(input.value, env, requestContext(request, url, route));
  // Each cookie the handler set or cleared is its own Set-Cookie header (A-9, E-14).
  const cookies = result.cookies ?? [];
  if (!result.ok) return refusalBodyResponse(result.body, {}, cookies);

  const reply = route.reply.safeParse(result.value);
  if (!reply.success) {
    console.error(JSON.stringify({ event: "reply_schema_mismatch", route: route.id }));
    return refusalResponse("internal_error");
  }
  return jsonResponse(reply.data, 200, {}, cookies);
}

/**
 * What a handler knows beyond its input. The `Cookie` header is parsed once, and only a route
 * declared as reading the session cookie gets the session and marker cookies (V-12): every one
 * whose name has the session prefix, for the installation object to pick its own (A-18).
 */
export function requestContext(request: Request, url: URL, route: Pick<RouteDeclaration, "readsSessionCookie">): RequestContext {
  return { request, url, cookies: route.readsSessionCookie ? prefixedCookies(request.headers.get("cookie")) : {} };
}

/**
 * True when a request comes from the app's own page: its `Origin` equals the origin of the
 * address it was sent to, and it carries the app's header. A browser sends `Origin` on every
 * cross-origin request and on same-origin POSTs, and another site cannot add the header without
 * a CORS preflight, which the server never grants.
 */
export function isFromAppOrigin(request: Request, url: URL): boolean {
  const origin = request.headers.get("origin");
  return origin !== null && origin === url.origin && request.headers.get(APP_HEADER) === APP_HEADER_VALUE;
}

export async function readInput(
  request: Request,
  url: URL,
  route: Pick<RouteDeclaration, "method">,
  maxBodyBytes: number = MAX_BODY_BYTES,
): Promise<{ ok: true; value: unknown } | { ok: false }> {
  if (route.method === "GET" || route.method === "DELETE") {
    return { ok: true, value: Object.fromEntries(url.searchParams) };
  }
  const type = request.headers.get("content-type") ?? "";
  if (!type.toLowerCase().startsWith("application/json")) return { ok: false };
  const length = request.headers.get("content-length");
  if (length !== null) {
    const declared = Number(length);
    if (length.trim() === "" || !Number.isFinite(declared) || declared < 0 || declared > maxBodyBytes) return { ok: false };
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBodyBytes) return { ok: false };
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}
