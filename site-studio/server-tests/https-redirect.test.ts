import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import type { Env } from "../server/env";
import { handleRequest } from "../server/index";
import { httpsRedirect } from "../server/httpsRedirect";

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
  it("redirects a request Cloudflare marks as plain HTTP to the same address over HTTPS", async () => {
    for (const path of ["/", "/api/v1/setup/state", "/floors/2?x=1"]) {
      const response = await handleRequest(withCf("http://survey.acme.test" + path, { tlsVersion: "" }), env as unknown as Env);
      expect(response.status, path).toBe(308);
      expect(response.headers.get("location")).toBe("https://survey.acme.test" + path);
    }
    const post = httpsRedirect(withCf("http://survey.acme.test:8080/api/v1/setup", { tlsVersion: "" }, { method: "POST", body: "{}" }));
    expect(post?.status).toBe(308);
    expect(post?.headers.get("location")).toBe("https://survey.acme.test:8080/api/v1/setup");
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
