// HTTP to HTTPS on Cloudflare (story 1.2, D-1). Cloudflare marks a request that reached it over
// plain HTTP with an empty `request.cf.tlsVersion`. Only then does the Worker redirect, to the same
// address over HTTPS. Self-hosted, workerd supplies no `request.cf`, so the Worker never redirects
// behind the bundled web server, which redirects itself (AD-16). Kevin ruled on 2026-11-20 that
// this check does not breach standing rule 7. The local runtime marks requests as TLS, so local
// development is never redirected.

/** A 308 to the HTTPS address when Cloudflare marks the request as plain HTTP, else null. */
export function httpsRedirect(request: Request): Response | null {
  const cf = (request as { cf?: unknown }).cf;
  if (typeof cf !== "object" || cf === null) return null;
  if ((cf as { tlsVersion?: unknown }).tlsVersion !== "") return null;
  const url = new URL(request.url);
  // Already an https:// address: redirecting would only send the client to the same place.
  if (url.protocol !== "http:") return null;
  url.protocol = "https:";
  // 308 keeps the method and body, so a form sent over HTTP is resent over HTTPS, not dropped.
  return new Response(null, { status: 308, headers: { location: url.href, "cache-control": "no-store" } });
}
