import { isServerPath } from "../shared/routes";
import { handleApi } from "./api/router";
import { serveAsset } from "./assets";
import type { Env } from "./env";
import { refusalResponse } from "./http";

// The one server build (AD-1, AD-16). The same bundle runs on Cloudflare and, self-hosted, under
// workerd. Declared routes answer /api/v1/, /mcp and /.well-known/; everything else is the app.

export { Installation } from "./installation/Installation";
export { ProjectRoom } from "./project-room/ProjectRoom";

const REVIEWS_PREFIX = "/api/reviews";

function isUnknownServerPath(path: string): boolean {
  return path === "/api" || path.startsWith("/api/") || path.startsWith("/mcp/") || path === "/.well-known";
}

export async function handleRequest(request: Request, env: Env): Promise<Response> {
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
