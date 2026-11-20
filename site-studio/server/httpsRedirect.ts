import { refusalResponse } from "./http";

// HTTPS on Cloudflare (story 1.2, D-1 and D-8). Cloudflare marks a request that reached it over
// plain HTTP with an empty `request.cf.tlsVersion`, and one that arrived over TLS with the TLS
// version. Self-hosted, workerd supplies no `request.cf`, so behind the bundled web server the
// Worker neither redirects, refuses nor sends HSTS: the web server does that itself (AD-16). Kevin
// ruled on 2026-11-20 that this check does not breach standing rule 7. The local runtime marks
// requests as TLS, so local development is never redirected (its HSTS header arrives over plain
// HTTP to 127.0.0.1 or localhost, where browsers ignore it).
//
// - D-1: a page request over plain HTTP gets a 308 to the same address over HTTPS.
// - D-8: a request under /api/, /mcp or /.well-known/ over plain HTTP is refused (`https_required`),
//   never redirected, so a client that sent a body or a token over HTTP learns of it and nothing
//   is silently resent.
// - D-8: every response to a request Cloudflare marks as HTTPS carries
//   `Strict-Transport-Security: max-age=31536000`, without includeSubDomains or preload.

export const HSTS_HEADER = "strict-transport-security";
export const HSTS_VALUE = "max-age=31536000";

function cloudflareTlsVersion(request: Request): string | null {
  const cf = (request as { cf?: unknown }).cf;
  if (typeof cf !== "object" || cf === null) return null;
  const version = (cf as { tlsVersion?: unknown }).tlsVersion;
  return typeof version === "string" ? version : null;
}

/** True when Cloudflare's metadata marks the request as plain HTTP. */
function isCloudflarePlainHttp(request: Request): boolean {
  return cloudflareTlsVersion(request) === "";
}

/** True when Cloudflare's metadata marks the request as having arrived over TLS. */
export function isCloudflareHttps(request: Request): boolean {
  const version = cloudflareTlsVersion(request);
  return version !== null && version !== "";
}

/** Server address spaces that are refused, not redirected, over plain HTTP (D-8). */
function isRefusedOverHttp(path: string): boolean {
  return ["/api", "/mcp", "/.well-known"].some((space) => path === space || path.startsWith(space + "/"));
}

/**
 * For a request Cloudflare marks as plain HTTP: a refusal for a server address (D-8), else a 308
 * to the HTTPS address (D-1). Null for every other request.
 */
export function httpsRedirect(request: Request): Response | null {
  if (!isCloudflarePlainHttp(request)) return null;
  const url = new URL(request.url);
  // Already an https:// address: redirecting would only send the client to the same place.
  if (url.protocol !== "http:") return null;
  if (isRefusedOverHttp(url.pathname)) return refusalResponse("https_required");
  url.protocol = "https:";
  // 308 keeps the method and body.
  return new Response(null, { status: 308, headers: { location: url.href, "cache-control": "no-store" } });
}

/** Adds HSTS to the response when Cloudflare marks the request as HTTPS (D-8); otherwise returns it as is. */
export function withHsts(request: Request, response: Response): Response {
  // A WebSocket upgrade cannot be copied; its headers were already sent with the handshake.
  if (!isCloudflareHttps(request) || response.status === 101) return response;
  const copy = new Response(response.body, response);
  copy.headers.set(HSTS_HEADER, HSTS_VALUE);
  return copy;
}
