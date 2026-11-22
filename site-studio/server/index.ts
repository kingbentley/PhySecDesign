import { isServerPath } from "../shared/routes";
import { handleApi } from "./api/router";
import { serveAsset } from "./assets";
import type { Env } from "./env";
import { refusalResponse } from "./http";
import { httpsRedirect, withHsts } from "./httpsRedirect";

// The one server build (AD-1, AD-16). The same bundle runs on Cloudflare and, self-hosted, under
// workerd. Declared routes answer /api/v1/, /mcp and /.well-known/; everything else is the app.

export { Installation } from "./installation/Installation";
export { ProjectRoom } from "./project-room/ProjectRoom";

const REVIEWS_PREFIX = "/api/reviews";

function isUnknownServerPath(path: string): boolean {
  return path === "/api" || path.startsWith("/api/") || path.startsWith("/mcp/") || path === "/.well-known";
}

/** The invitation page's paths, which carry `Referrer-Policy: no-referrer` (story 1.4, D-2). */
const INVITE_PAGE_PATHS: ReadonlySet<string> = new Set(["/invite", "/invite/"]);

export async function handleRequest(request: Request, env: Env): Promise<Response> {
  const path = new URL(request.url).pathname;
  // Plain HTTP that reached Cloudflare: pages go to HTTPS (D-1), server addresses are refused
  // (D-8), before anything else.
  const redirect = httpsRedirect(request);
  if (redirect) return withInvitePagePolicy(path, redirect);
  // Every answer to a request Cloudflare marks as HTTPS carries HSTS (D-8).
  return withInvitePagePolicy(path, withHsts(request, await route(request, env)));
}

/**
 * Adds `Referrer-Policy: no-referrer` to every response for the invitation page's paths, by path,
 * whichever asset branch answered and on both hosts (D-2, D-12 as amended): Cloudflare's assets
 * service answers `index.html` directly, a disk service only after a 404. No other page changes.
 */
function withInvitePagePolicy(path: string, response: Response): Response {
  // A WebSocket upgrade cannot be copied (as in withHsts).
  if (!INVITE_PAGE_PATHS.has(path) || response.status === 101) return response;
  const headers = new Headers(response.headers);
  headers.set("referrer-policy", "no-referrer");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

async function route(request: Request, env: Env): Promise<Response> {
  const path = new URL(request.url).pathname;
  try {
    // Review links stay in the local Vite development server for now (decision 2026-11-19).
    if (path === REVIEWS_PREFIX || path.startsWith(REVIEWS_PREFIX + "/")) return refusalResponse("not_available");
    if (isServerPath(path)) return await handleApi(request, env);
    // Never turn an unknown server address into the app's page.
    if (isUnknownServerPath(path)) return refusalResponse("not_found");
    return await serveAsset(request, env);
  } catch (error) {
    console.error(
      JSON.stringify({ event: "request_failed", path, error: error instanceof Error ? error.message : "unknown" }),
    );
    return refusalResponse("internal_error");
  }
}

export default {
  fetch: (request, env) => handleRequest(request, env),
} satisfies ExportedHandler<Env>;
