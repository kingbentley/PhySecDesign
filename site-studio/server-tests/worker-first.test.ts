import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import wranglerText from "../deploy/cloudflare/wrangler.jsonc?raw";
import type { Env } from "../server/env";
import { handleRequest } from "../server/index";

// Story 1.2, D-1: on Cloudflare every request reaches the Worker first, so a plain HTTP request
// for a page is redirected too, and the Worker serves the app's files through ASSETS.

describe("Worker first", () => {
  it("routes every Cloudflare request through the Worker", () => {
    const config = JSON.parse(
      wranglerText
        .split(/\r?\n/)
        .filter((line) => !line.trim().startsWith("//"))
        .join("\n"),
    ) as { assets: { run_worker_first: unknown } };
    expect(config.assets.run_worker_first).toBe(true);
  });

  it("serves a script without an extension, as the development server sends, but still no listing", async () => {
    const fakeEnv = {
      ...env,
      ASSETS: {
        fetch: async (input: Request | string) => {
          const path = new URL(typeof input === "string" ? input : input.url).pathname;
          if (path === "/@vite/client") return new Response("export {}", { headers: { "content-type": "text/javascript" } });
          if (path === "/assets") return Response.json([{ name: "app.js", type: "file" }]);
          return new Response("missing", { status: 404 });
        },
      },
    } as unknown as Env;
    const script = await handleRequest(new Request("https://survey.acme.test/@vite/client"), fakeEnv);
    expect(script.status).toBe(200);
    expect(await script.text()).toBe("export {}");
    const listing = await handleRequest(new Request("https://survey.acme.test/assets"), fakeEnv);
    expect(listing.status).toBe(404);
  });
});
