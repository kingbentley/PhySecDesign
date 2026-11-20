import type { Env } from "./env";

// Serves the app's built files through the ASSETS binding with a fallback to index.html for app
// routes. On Cloudflare the assets service already does both; self-hosted, ASSETS is a plain
// disk service, which lists directories and sends every file as application/octet-stream, so
// "/" is mapped to index.html and missing content types are filled in from the extension.

const CONTENT_TYPES: Record<string, string> = {
  html: "text/html; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  mjs: "text/javascript; charset=utf-8",
  css: "text/css; charset=utf-8",
  json: "application/json; charset=utf-8",
  map: "application/json; charset=utf-8",
  txt: "text/plain; charset=utf-8",
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  ico: "image/x-icon",
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
  otf: "font/otf",
  wasm: "application/wasm",
  pdf: "application/pdf",
};

export async function serveAsset(request: Request, env: Env): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") return env.ASSETS.fetch(request);
  const url = new URL(request.url);
  let servedPath = url.pathname;

  let response: Response;
  if (servedPath.endsWith("/")) {
    response = await fetchPath(request, env, servedPath + "index.html");
    if (isRedirect(response)) response = await env.ASSETS.fetch(request);
    else servedPath += "index.html";
  } else {
    response = await env.ASSETS.fetch(request);
    // A path without an extension is a page or a directory; a disk service answers a directory
    // with a listing, which is never served. A script without an extension, as the local
    // development server sends for /@vite/client now that every request reaches the Worker first,
    // is not a listing.
    if (response.ok && !hasExtension(servedPath) && !isHtml(response) && !isScript(response)) {
      await response.body?.cancel();
      response = new Response("Not found", { status: 404 });
    }
  }

  const acceptsHtml = request.headers.get("accept")?.includes("text/html") ?? false;
  if (response.status === 404 && acceptsHtml) {
    response = await fetchPath(request, env, "/index.html");
    if (isRedirect(response)) response = await fetchPath(request, env, "/");
    servedPath = "/index.html";
  }
  return withContentType(response, servedPath);
}

function fetchPath(request: Request, env: Env, pathname: string): Promise<Response> {
  const url = new URL(request.url);
  url.pathname = pathname;
  url.search = "";
  return env.ASSETS.fetch(new Request(url, { method: request.method, headers: request.headers }));
}

function hasExtension(path: string): boolean {
  return path.slice(path.lastIndexOf("/") + 1).includes(".");
}

function isHtml(response: Response): boolean {
  return response.headers.get("content-type")?.startsWith("text/html") ?? false;
}

function isScript(response: Response): boolean {
  return response.headers.get("content-type")?.startsWith("text/javascript") ?? false;
}

function isRedirect(response: Response): boolean {
  return response.status >= 300 && response.status < 400;
}

function withContentType(response: Response, path: string): Response {
  if (!response.ok) return response;
  const current = response.headers.get("content-type");
  if (current && !current.startsWith("application/octet-stream")) return response;
  const extension = path.slice(path.lastIndexOf(".") + 1).toLowerCase();
  const type = CONTENT_TYPES[extension];
  if (!type) return response;
  const headers = new Headers(response.headers);
  headers.set("content-type", type);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
