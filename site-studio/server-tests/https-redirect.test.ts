import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import type { Env } from "../server/env";
import { handleRequest } from "../server/index";
import { httpsRedirect, HSTS_VALUE } from "../server/httpsRedirect";
import { REFUSALS } from "../shared/refusal";

// HTTP to HTTPS (story 1.2, CAP-9, D-1): the Worker redirects only when Cloudflare's request
// metadata marks the request as plain HTTP (an empty `cf.tlsVersion`). Self-hosted, workerd gives
// no `cf`, so nothing is redirected there. The local runtime (Miniflare) gives every request a
// stand-in `cf` with `tlsVersion: "TLSv1.3"`, so local development is not redirected either.

function withCf(url: string, cf: Record<string, unknown> | undefined, init: RequestInit = {}): Request {
  const request = new Request(url, init);
  if (cf === undefined) return request;
  Object.defineProperty(request, "cf", { value: cf });
  return request;
}

describe("HTTPS redirect", () => {
  it("redirects a page request Cloudflare marks as plain HTTP to the same address over HTTPS", async () => {
    for (const path of ["/", "/setup", "/floors/2?x=1", "/apiary", "/mcpx"]) {
      const response = await handleRequest(withCf("http://survey.acme.test" + path, { tlsVersion: "" }), env as unknown as Env);
      expect(response.status, path).toBe(308);
      expect(response.headers.get("location")).toBe("https://survey.acme.test" + path);
      expect(response.headers.get("strict-transport-security"), path).toBeNull();
    }
  });

  it("refuses, never redirects, a server request Cloudflare marks as plain HTTP (D-8)", async () => {
    for (const [path, method] of [
      ["/api/v1/setup/state", "GET"],
      ["/api/v1/setup", "POST"],
      ["/api", "GET"],
      ["/api/reviews/abc", "GET"],
      ["/mcp", "POST"],
      ["/.well-known/oauth-authorization-server", "GET"],
    ] as const) {
      const init: RequestInit = method === "POST" ? { method, body: "{}", headers: { "content-type": "application/json" } } : { method };
      const response = await handleRequest(withCf("http://survey.acme.test:8080" + path, { tlsVersion: "" }, init), env as unknown as Env);
      expect(response.status, path).toBe(403);
      expect(response.headers.get("location"), path).toBeNull();
      expect(await response.json()).toEqual({ error: { code: "https_required", message: REFUSALS.https_required.message } });
    }
    expect(REFUSALS.https_required.message).toMatch(/HTTPS/);
  });

  it("sends HSTS for one year on every answer to a request Cloudflare marks as HTTPS, and never otherwise (D-8)", async () => {
    for (const path of ["/", "/setup", "/api/v1/setup/state", "/api/v1/nothing-here"]) {
      const response = await handleRequest(withCf("https://survey.acme.test" + path, { tlsVersion: "TLSv1.3" }), env as unknown as Env);
      expect(response.headers.get("strict-transport-security"), path).toBe("max-age=31536000");
      await response.arrayBuffer();
    }
    expect(HSTS_VALUE).not.toMatch(/includeSubDomains|preload/i);
    // Self-hosted: no Cloudflare metadata, no HSTS (the bundled web server decides).
    for (const url of ["http://127.0.0.1:8787/api/v1/setup/state", "https://survey.acme.test/"]) {
      const response = await handleRequest(withCf(url, undefined), env as unknown as Env);
      expect(response.headers.get("strict-transport-security"), url).toBeNull();
      await response.arrayBuffer();
    }
    // Metadata without a TLS version is not HTTPS either.
    const unknown = await handleRequest(withCf("https://survey.acme.test/api/v1/setup/state", { tlsVersion: undefined }), env as unknown as Env);
    expect(unknown.headers.get("strict-transport-security")).toBeNull();
  });

  it("does not redirect a TLS request, or one with no Cloudflare metadata (self-hosted)", async () => {
    expect(httpsRedirect(withCf("https://survey.acme.test/", { tlsVersion: "TLSv1.3" }))).toBeNull();
    // An https:// address is never redirected to itself, whatever the metadata says.
    expect(httpsRedirect(withCf("https://survey.acme.test/", { tlsVersion: "" }))).toBeNull();
    // Behind the self-hosted web server the Worker sees plain http:// with no cf: never redirected.
    expect(httpsRedirect(withCf("http://127.0.0.1:8787/", undefined))).toBeNull();
    expect(httpsRedirect(withCf("http://127.0.0.1:8787/", { tlsVersion: undefined }))).toBeNull();
    const response = await handleRequest(withCf("http://127.0.0.1:8787/api/v1/setup/state", undefined), env as unknown as Env);
    expect(response.status).toBe(200);
  });
});
