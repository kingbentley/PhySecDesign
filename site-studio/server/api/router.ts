import { checkInput, routesForPath, type RouteDeclaration } from "../../shared/routes";
import type { Env } from "../env";
import { jsonResponse, refusalBodyResponse, refusalResponse } from "../http";
import { HANDLERS, type HandlerResult } from "./handlers";

// Answers every request under /api/v1/, /mcp and /.well-known/ through the route declarations:
// find the declaration, check the input against its schema, run the handler, check the reply.

const MAX_BODY_BYTES = 1024 * 1024;

export async function handleApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const candidates = routesForPath(url.pathname);
  if (candidates.length === 0) return refusalResponse("not_found");
  const route = candidates.find((candidate) => candidate.method === request.method);
  if (!route) {
    return refusalResponse("method_not_allowed", { headers: { allow: candidates.map((c) => c.method).join(", ") } });
  }

  const raw = await readInput(request, url, route);
  if (!raw.ok) return refusalResponse("invalid_input");
  const input = checkInput(route.input, raw.value);
  if (!input.ok) return refusalResponse("invalid_input", { field: input.field });

  const handler = HANDLERS[route.id as keyof typeof HANDLERS] as
    | ((input: unknown, env: Env) => Promise<HandlerResult<unknown>>)
    | undefined;
  if (!handler) return refusalResponse("not_found");
  const result = await handler(input.value, env);
  if (!result.ok) return refusalBodyResponse(result.body);

  const reply = route.reply.safeParse(result.value);
  if (!reply.success) {
    console.error(JSON.stringify({ event: "reply_schema_mismatch", route: route.id }));
    return refusalResponse("internal_error");
  }
  return jsonResponse(reply.data);
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
