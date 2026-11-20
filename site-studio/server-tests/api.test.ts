import { env, exports } from "cloudflare:workers";
import { runInDurableObject } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ENTERED_TEXT_SOURCES, enteredText } from "../shared/enteredText";
import { DATA_FORMAT_VERSION, RELEASE } from "../shared/release";
import { REFUSALS, refusalBody } from "../shared/refusal";
import { checkInput, isServerPath, ROUTE_LIST, ROUTES, statusReply } from "../shared/routes";
import { HANDLERS } from "../server/api/handlers";
import { readInput } from "../server/api/router";
import type { Env } from "../server/env";
import { handleRequest } from "../server/index";

const ORIGIN = "https://site-studio.test";
// The Worker's own default export, run inside the same runtime as the tests.
const worker = (exports as unknown as { default: { fetch(request: Request): Promise<Response> } }).default;

function get(path: string, init?: RequestInit): Promise<Response> {
  return worker.fetch(new Request(ORIGIN + path, init));
}

async function refusalOf(response: Response) {
  const body = (await response.json()) as { error: { code: string; message: string; field?: string } };
  expect(Object.keys(body)).toEqual(["error"]);
  return body.error;
}

describe("GET /api/v1/status", () => {
  it("answers the release and the installation's data format and creation time", async () => {
    const response = await get("/api/v1/status");
    expect(response.status).toBe(200);
    const body = statusReply.parse(await response.json());
    expect(body.release).toBe(RELEASE);
    expect(body.installation.dataFormat).toBe(DATA_FORMAT_VERSION);
    expect(Number.isNaN(Date.parse(body.installation.createdAt))).toBe(false);
    const again = statusReply.parse(await (await get("/api/v1/status")).json());
    expect(again.installation.createdAt).toBe(body.installation.createdAt);
  });

  it("refuses with an explanation while the installation's data is newer than the build", async () => {
    const stub = env.INSTALLATION.get(env.INSTALLATION.idFromName("installation"));
    const setVersion = (version: number) =>
      runInDurableObject(stub, (_instance, state) => {
        state.storage.sql.exec("UPDATE _meta SET format_version = ? WHERE id = 1", version);
      });
    await get("/api/v1/status");
    await setVersion(DATA_FORMAT_VERSION + 1);
    try {
      const response = await get("/api/v1/status");
      expect(response.status).toBe(503);
      expect((await refusalOf(response)).code).toBe("data_newer_than_build");
    } finally {
      await setVersion(DATA_FORMAT_VERSION);
    }
  });

  it("answers 503 updating with Retry-After when the object keeps refusing for a version change", async () => {
    let calls = 0;
    const updatingNamespace = {
      idFromName: () => ({}),
      get: () => ({
        fetch: async () => {
          calls += 1;
          return Response.json({ error: { code: "updating", message: "x" } }, { status: 503 });
        },
      }),
    };
    const fakeEnv = { ...env, INSTALLATION: updatingNamespace } as unknown as Env;
    const response = await handleRequest(new Request(ORIGIN + "/api/v1/status"), fakeEnv);
    expect(calls).toBe(2);
    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toMatch(/^\d+$/);
    const error = await refusalOf(response);
    expect(error.code).toBe("updating");
    expect(error.message).toBe("Site Studio is updating, try again shortly.");
  });
});

describe("refusals", () => {
  it("refuses input that fails the route's schema without repeating the value or an unknown key", async () => {
    const response = await get("/api/v1/status?password=hunter2-secret");
    expect(response.status).toBe(400);
    const text = await response.text();
    expect(text).not.toContain("hunter2-secret");
    expect(text).not.toContain("password");
    const error = JSON.parse(text).error;
    expect(error).toEqual({ code: "invalid_input", message: REFUSALS.invalid_input.message });
  });

  it("never echoes a secret-looking unknown key anywhere in the reply", async () => {
    const response = await get("/api/v1/status?sk_live_abc123");
    expect(response.status).toBe(400);
    const headers = [...response.headers.entries()].flat().join(" ");
    const text = await response.text();
    expect(text).not.toContain("sk_live_abc123");
    expect(headers).not.toContain("sk_live_abc123");
    expect(JSON.parse(text).error.field).toBeUndefined();
  });

  it("names nested fields in a body schema and never echoes the value", () => {
    const schema = z.object({ device: z.object({ name: z.string().min(1), height: z.number() }).strict() }).strict();
    expect(checkInput(schema, { device: { name: "Camera", height: "sekret-value" } })).toEqual({
      ok: false,
      field: "device.height",
    });
    // An unknown key is never named: the parent field is, or nothing at the top level.
    expect(checkInput(schema, { device: { name: "Camera", height: 3, extra: 1 } })).toEqual({
      ok: false,
      field: "device",
    });
    expect(checkInput(schema, { device: { name: "Camera", height: 3 }, sk_live_abc123: 1 })).toEqual({ ok: false });
    expect(checkInput(schema, { device: { name: "Camera", height: 3 } })).toEqual({
      ok: true,
      value: { device: { name: "Camera", height: 3 } },
    });
  });

  it("refuses an undeclared API address with not_found", async () => {
    for (const path of [
      "/api/v1/nope",
      "/api/other",
      "/api",
      "/mcp",
      "/mcp/anything",
      "/.well-known",
      "/.well-known/anything",
    ]) {
      const response = await get(path);
      expect(response.status, path).toBe(404);
      expect((await refusalOf(response)).code).toBe("not_found");
    }
  });

  it("reads a JSON body only with the right type, a valid length, within the cap and well formed", async () => {
    const url = new URL(ORIGIN + "/api/v1/example");
    const post = { method: "POST" as const };
    const fakeRequest = (headers: Record<string, string>, body: string) =>
      ({ headers: new Headers(headers), text: async () => body }) as unknown as Request;
    const json = { "content-type": "application/json" };

    expect(await readInput(fakeRequest(json, '{"a":1}'), url, post)).toEqual({ ok: true, value: { a: 1 } });
    expect(await readInput(fakeRequest({ "content-type": "text/plain" }, '{"a":1}'), url, post)).toEqual({ ok: false });
    expect(await readInput(fakeRequest({ ...json, "content-length": "abc" }, '{"a":1}'), url, post)).toEqual({ ok: false });
    expect(await readInput(fakeRequest({ ...json, "content-length": "-1" }, '{"a":1}'), url, post)).toEqual({ ok: false });
    expect(await readInput(fakeRequest({ ...json, "content-length": "64" }, '{"a":1}'), url, post, 16)).toEqual({ ok: false });
    // The cap counts bytes, not characters: 8 characters of 3 bytes each exceed 16 bytes.
    expect(await readInput(fakeRequest(json, '"' + "€".repeat(8) + '"'), url, post, 16)).toEqual({ ok: false });
    expect(await readInput(fakeRequest(json, "{not json"), url, post)).toEqual({ ok: false });
  });

  it("refuses a declared address with the wrong method", async () => {
    const response = await get("/api/v1/status", { method: "POST", body: "{}", headers: { "content-type": "application/json" } });
    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("GET");
    expect((await refusalOf(response)).code).toBe("method_not_allowed");
  });

  it("refuses review links on the deployed Worker with not_available", async () => {
    for (const path of ["/api/reviews/0123456789abcdef0123456789abcdef", "/api/reviews"]) {
      const response = await get(path, { method: "GET" });
      expect(response.status).toBe(404);
      const error = await refusalOf(response);
      expect(error.code).toBe("not_available");
      expect(error.message.length).toBeGreaterThan(0);
    }
  });

  it("gives every reason code a status and wording, and never names a value as a field", () => {
    for (const [code, refusal] of Object.entries(REFUSALS)) {
      expect(refusal.status, code).toBeGreaterThanOrEqual(400);
      expect(refusal.message.length, code).toBeGreaterThan(0);
    }
    expect(refusalBody("invalid_input", { field: "name" }).error.field).toBe("name");
    expect(refusalBody("invalid_input", { field: "my secret value" }).error.field).toBeUndefined();
  });
});

describe("route declarations", () => {
  it("declares every route under the allowed addresses with input and reply schemas", () => {
    const ids = new Set<string>();
    const keys = new Set<string>();
    for (const route of ROUTE_LIST) {
      expect(isServerPath(route.path), route.id).toBe(true);
      expect(route.input).toBeInstanceOf(z.ZodType);
      expect(route.reply).toBeInstanceOf(z.ZodType);
      expect(route.summary.length).toBeGreaterThan(0);
      expect(ids.has(route.id)).toBe(false);
      expect(keys.has(route.method + " " + route.path)).toBe(false);
      ids.add(route.id);
      keys.add(route.method + " " + route.path);
    }
  });

  it("has one handler for each declaration and no handler without one", () => {
    expect(Object.keys(HANDLERS).sort()).toEqual(Object.keys(ROUTES).sort());
    for (const [key, route] of Object.entries(ROUTES)) expect(route.id).toBe(key);
  });

  it("offers the entered-text type with its sources and a reference", () => {
    expect(ENTERED_TEXT_SOURCES).toEqual(["member", "agent", "reviewer_link", "import", "file_name", "pdf_text"]);
    for (const source of ENTERED_TEXT_SOURCES) {
      expect(enteredText.safeParse({ value: "Lobby camera", source, ref: "ref-1" }).success).toBe(true);
    }
    expect(enteredText.safeParse({ value: "x", source: "email", ref: "ref-1" }).success).toBe(false);
    expect(enteredText.safeParse({ value: "x", source: "member" }).success).toBe(false);
  });
});

describe("the app's pages", () => {
  it("are served through ASSETS, not as API refusals", async () => {
    const seen: string[] = [];
    const fakeEnv = {
      ...env,
      ASSETS: {
        fetch: async (input: Request | string) => {
          const url = new URL(typeof input === "string" ? input : input.url);
          seen.push(url.pathname);
          // A disk service sends every file as application/octet-stream.
          if (url.pathname === "/index.html") {
            return new Response('<div id="root"></div>', { status: 200, headers: { "content-type": "application/octet-stream" } });
          }
          if (url.pathname === "/assets/app.js") return new Response("js", { status: 200, headers: { "content-type": "application/octet-stream" } });
          // A disk service lists a directory requested without a trailing slash.
          if (url.pathname === "/assets") return Response.json([{ name: "app.js", type: "file" }]);
          return new Response("missing", { status: 404 });
        },
      },
    } as unknown as Env;
    const page = await handleRequest(new Request(ORIGIN + "/", { headers: { accept: "text/html" } }), fakeEnv);
    expect(page.status).toBe(200);
    expect(page.headers.get("content-type")).toMatch(/^text\/html/);
    const route = await handleRequest(new Request(ORIGIN + "/floors/2", { headers: { accept: "text/html" } }), fakeEnv);
    expect(await route.text()).toContain("root");
    const script = await handleRequest(new Request(ORIGIN + "/assets/app.js"), fakeEnv);
    expect(script.headers.get("content-type")).toMatch(/^text\/javascript/);
    expect(seen).toEqual(["/index.html", "/floors/2", "/index.html", "/assets/app.js"]);

    const listing = await handleRequest(new Request(ORIGIN + "/assets"), fakeEnv);
    expect(listing.status).toBe(404);
    expect(await listing.text()).not.toContain("app.js");
    const listingAsPage = await handleRequest(new Request(ORIGIN + "/assets", { headers: { accept: "text/html" } }), fakeEnv);
    expect(listingAsPage.status).toBe(200);
    expect(await listingAsPage.text()).toContain("root");
  });
});
