import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import type { Env } from "../server/env";
import { handleRequest } from "../server/index";
import { rawObjectCall } from "./helpers";
import { callObject } from "../server/objects/call";
import { isVersionStop, isVersionStopShown, VERSION_STOP_REASON } from "../server/objects/versionGuard";

// The retry rule of the object-call helper (story 1.2, D-2; deferred-work item 1): a call is sent
// again only after an error that carries the version-stop reason, which the object raises before
// any write. A bare reset (`durableObjectReset` without the reason) may follow a committed write,
// so only a call marked idempotent is sent again after one.

function fakeNamespace(answer: (attempt: number) => Promise<Response>) {
  let calls = 0;
  const namespace = {
    get: () => ({
      fetch: async () => {
        calls += 1;
        return answer(calls);
      },
    }),
  } as unknown as DurableObjectNamespace;
  return { namespace, calls: () => calls };
}

const id = {} as DurableObjectId;
const bareReset = () => Object.assign(new Error("Durable Object reset because its code was updated."), { durableObjectReset: true });
const shownStop = () => Object.assign(new Error(`${VERSION_STOP_REASON}: release 1 called by 2`), { durableObjectReset: true });

describe("telling a version stop from a reset", () => {
  it("shows a stop only when the error carries the reason", () => {
    expect(isVersionStopShown(shownStop())).toBe(true);
    expect(isVersionStopShown(bareReset())).toBe(false);
    expect(isVersionStopShown("site-studio:version-stop")).toBe(false);
    // The broader test still treats both as possible stops.
    expect(isVersionStop(bareReset())).toBe(true);
    expect(isVersionStop(shownStop())).toBe(true);
  });

  it("receives the reason from a real object stop in the local runtime (the deployed check is spec 4's)", async () => {
    const stub = env.INSTALLATION.get(env.INSTALLATION.idFromName("call-retry-real-stop"));
    await expect(rawObjectCall(stub, "setupState", "0.0.0-another-release")).rejects.toSatisfy(isVersionStopShown);
  });
});

describe("retrying object calls", () => {
  it("retries a write once after a shown version stop and returns the second answer", async () => {
    const fake = fakeNamespace(async (attempt) => {
      if (attempt === 1) throw shownStop();
      return Response.json({ value: { created: true } });
    });
    const result = await callObject(fake.namespace, id, "createFirstAdministrator", { any: 1 });
    expect(fake.calls()).toBe(2);
    expect(result).toEqual({ ok: true, value: { created: true } });
  });

  it("does not retry a write after a bare reset: the error reaches the caller", async () => {
    const fake = fakeNamespace(async () => {
      throw bareReset();
    });
    await expect(callObject(fake.namespace, id, "setupAttempt", { any: 1 })).rejects.toThrow("reset");
    expect(fake.calls()).toBe(1);
  });

  it("retries an idempotent read once after a bare reset, then answers updating", async () => {
    const fake = fakeNamespace(async () => {
      throw bareReset();
    });
    const result = await callObject(fake.namespace, id, "setupState", null, { idempotent: true });
    expect(fake.calls()).toBe(2);
    expect(result).toEqual({ ok: false, status: 503, body: { error: expect.objectContaining({ code: "updating" }) } });
  });

  it("retries a write after an updating refusal, which the object gives before writing", async () => {
    const fake = fakeNamespace(async (attempt) =>
      attempt === 1 ? Response.json({ error: { code: "updating", message: "x" } }, { status: 503 }) : Response.json({ value: 1 }),
    );
    expect(await callObject(fake.namespace, id, "setupAttempt", {})).toEqual({ ok: true, value: 1 });
    expect(fake.calls()).toBe(2);
  });

  it("never retries other errors, idempotent or not", async () => {
    for (const idempotent of [false, true]) {
      const fake = fakeNamespace(async () => {
        throw new Error("something else");
      });
      await expect(callObject(fake.namespace, id, "setupState", null, { idempotent })).rejects.toThrow("something else");
      expect(fake.calls()).toBe(1);
    }
  });
});

describe("the read routes", () => {
  it("send their object call again after a bare reset, because they only read", async () => {
    for (const [path, value] of [
      ["/api/v1/setup/state", { state: "open" }],
      ["/api/v1/status", { dataFormat: 1, createdAt: "2026-11-20T12:00:00.000Z" }],
    ] as const) {
      const fake = fakeNamespace(async (attempt) => {
        if (attempt === 1) throw bareReset();
        return Response.json({ value });
      });
      const target = { ...env, INSTALLATION: { ...fake.namespace, idFromName: () => id } } as unknown as Env;
      const response = await handleRequest(new Request("https://survey.acme.test" + path), target);
      expect(response.status, path).toBe(200);
      expect(fake.calls(), path).toBe(2);
    }
  });
});
