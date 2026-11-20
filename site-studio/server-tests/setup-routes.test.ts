import { env } from "cloudflare:workers";
import { runInDurableObject } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { REFUSALS } from "../shared/refusal";
import { APP_HEADER, APP_HEADER_VALUE, ROUTES, setupReply, setupStateReply } from "../shared/routes";
import type { Env } from "../server/env";
import { handleRequest } from "../server/index";
import type { Installation } from "../server/installation/Installation";
import { SETTINGS_TABLE, USERS_TABLE } from "../server/installation/setupStore";

// The set-up state and set-up routes (story 1.2: CAP-2, CAP-4, the route half of CAP-7, CAP-8).
// Each test gets its own installation object through a namespace that prefixes the fixed name,
// and its own random set-up code; no real code is ever written here.

const ORIGIN = "https://survey.acme.test";

function randomCode(): string {
  return [...crypto.getRandomValues(new Uint8Array(18))].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

interface Installed {
  env: Env;
  stub: DurableObjectStub<Installation>;
  /** Calls to each object operation, by name. */
  calls: Map<string, number>;
}

/** An environment whose installation object belongs to this test alone. */
function installation(name: string, code: string | undefined, wrap?: (operation: string, send: () => Promise<Response>) => Promise<Response>): Installed {
  const calls = new Map<string, number>();
  const scoped = (objectName: string) => env.INSTALLATION.idFromName(`setup-routes:${name}:${objectName}`);
  const namespace = {
    idFromName: scoped,
    get: (id: DurableObjectId) => {
      const real = env.INSTALLATION.get(id);
      return {
        fetch: (input: string, init?: RequestInit) => {
          const operation = new URL(input).pathname.slice(1);
          calls.set(operation, (calls.get(operation) ?? 0) + 1);
          const send = () => real.fetch(input, init);
          return wrap ? wrap(operation, send) : send();
        },
      };
    },
  };
  const scopedEnv = { ...env, INSTALLATION: namespace, SETUP_CODE: code } as unknown as Env;
  return { env: scopedEnv, stub: env.INSTALLATION.get(scoped("installation")), calls };
}

function validInput(code: string, overrides: Record<string, unknown> = {}) {
  return {
    code,
    installationName: "Acme Security",
    name: "Dana Admin",
    email: "Dana@Acme.test",
    password: "correct horse battery",
    ...overrides,
  };
}

function postSetup(
  target: Env,
  body: unknown,
  options: { origin?: string | null; header?: string | null; address?: string; url?: string } = {},
): Promise<Response> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  const origin = options.origin === undefined ? ORIGIN : options.origin;
  const header = options.header === undefined ? APP_HEADER_VALUE : options.header;
  if (origin !== null) headers.origin = origin;
  if (header !== null) headers[APP_HEADER] = header;
  if (options.address) headers["cf-connecting-ip"] = options.address;
  const url = (options.url ?? ORIGIN) + "/api/v1/setup";
  return handleRequest(new Request(url, { method: "POST", headers, body: JSON.stringify(body) }), target);
}

async function stateOf(target: Env): Promise<unknown> {
  const response = await handleRequest(new Request(ORIGIN + "/api/v1/setup/state"), target);
  expect(response.status).toBe(200);
  return response.json();
}

/** The refusal's error, after checking that neither its text nor its headers carry an entered value. */
async function refusalOf(response: Response, entered: string[]) {
  const text = await response.text();
  const headers = [...response.headers.entries()].flat().join(" ");
  for (const value of entered) {
    expect(text).not.toContain(value);
    expect(headers).not.toContain(value);
  }
  const body = JSON.parse(text) as { error: { code: string; message: string; field?: string; retryAfterSeconds?: number } };
  expect(Object.keys(body)).toEqual(["error"]);
  return body.error;
}

function readStored(stub: DurableObjectStub<Installation>) {
  return runInDurableObject(stub, (instance: Installation, state) => ({
    users: state.storage.sql.exec<{ email: string; name: string; role: string }>(`SELECT email, name, role FROM ${USERS_TABLE}`).toArray(),
    settings: state.storage.sql
      .exec<{ installation_name: string; public_address: string }>(`SELECT installation_name, public_address FROM ${SETTINGS_TABLE}`)
      .toArray(),
    counts: instance.setup.counts(),
  }));
}

describe("GET /api/v1/setup/state", () => {
  it("answers only open or closed: the reply schema and the reply have no other field", async () => {
    expect(Object.keys(setupStateReply.shape)).toEqual(["state"]);
    expect(setupStateReply.safeParse({ state: "open", users: 0 }).success).toBe(false);
    expect(setupStateReply.safeParse({ state: "maybe" }).success).toBe(false);
    expect(ROUTES.setupState.method).toBe("GET");
    expect(ROUTES.setupState.appOriginOnly).toBeUndefined();

    const { env: target } = installation("state-shape", randomCode());
    expect(await stateOf(target)).toEqual({ state: "open" });
  });
});

describe("POST /api/v1/setup", () => {
  it("creates exactly one administrator, confirms name and email, records the public address and closes set-up", async () => {
    const code = randomCode();
    const { env: target, stub } = installation("complete", code);
    const response = await postSetup(target, validInput(code, { installationName: "  Acme Security  " }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(setupReply.parse(body)).toEqual({ installationName: "Acme Security", email: "dana@acme.test" });
    expect(Object.keys(body as object).sort()).toEqual(["email", "installationName"]);

    const stored = await readStored(stub);
    expect(stored.users).toEqual([{ email: "dana@acme.test", name: "Dana Admin", role: "administrator" }]);
    expect(stored.settings).toEqual([{ installation_name: "Acme Security", public_address: ORIGIN }]);
    expect(await stateOf(target)).toEqual({ state: "closed" });
  });

  it("records the origin the page was opened on, including a port", async () => {
    const code = randomCode();
    const { env: target, stub } = installation("address-port", code);
    const origin = "http://127.0.0.1:8787";
    const response = await postSetup(target, validInput(code), { origin, url: origin });
    expect(response.status).toBe(200);
    expect((await readStored(stub)).settings[0]?.public_address).toBe(origin);
  });

  it("refuses set-up once a user exists, and the code no longer works", async () => {
    const code = randomCode();
    const { env: target, stub } = installation("closed", code);
    expect((await postSetup(target, validInput(code))).status).toBe(200);

    const again = validInput(code, { email: "mallory@acme.test", name: "Mallory", password: "another long password" });
    const response = await postSetup(target, again);
    expect(response.status).toBe(409);
    const error = await refusalOf(response, [code, "mallory@acme.test", "Mallory", "another long password"]);
    expect(error.code).toBe("setup_closed");
    expect((await readStored(stub)).users).toHaveLength(1);
    expect(await stateOf(target)).toEqual({ state: "closed" });
  });

  it("refuses a wrong code and counts it, then imposes the wait with Retry-After", async () => {
    const code = randomCode();
    const { env: target, stub } = installation("wrong", code);
    const wrong = validInput("not-the-code-" + randomCode());
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const response = await postSetup(target, wrong, { address: "198.51.100.7" });
      expect(response.status).toBe(403);
      expect(response.headers.get("retry-after")).toBeNull();
      const error = await refusalOf(response, [wrong.code, wrong.password, "dana@acme.test", "Dana Admin"]);
      expect(error).toEqual({ code: "setup_code_wrong", message: REFUSALS.setup_code_wrong.message });
    }
    expect((await readStored(stub)).counts.byAddress).toEqual([
      expect.objectContaining({ address: "198.51.100.7", failures: 5 }),
    ]);

    // The sixth attempt waits, even with the right code, and is not counted.
    const waiting = await postSetup(target, validInput(code), { address: "198.51.100.7" });
    expect(waiting.status).toBe(429);
    const error = await refusalOf(waiting, [code, "correct horse battery"]);
    expect(error.code).toBe("setup_wait");
    expect(error.message).toMatch(/deploy again/i);
    expect(error.retryAfterSeconds).toBe(60);
    expect(waiting.headers.get("retry-after")).toBe("60");
    const stored = await readStored(stub);
    expect(stored.counts.byAddress[0]?.failures).toBe(5);
    expect(stored.users).toEqual([]);

    // Another address is not held by this one's wait.
    expect((await postSetup(target, validInput(code), { address: "203.0.113.9" })).status).toBe(200);
  });

  it("refuses a missing code by schema, naming the field, without counting it", async () => {
    const code = randomCode();
    const { env: target, stub } = installation("missing", code);
    for (const body of [validInput(code, { code: undefined }), validInput(code, { code: "" })]) {
      const response = await postSetup(target, body);
      expect(response.status).toBe(400);
      const error = await refusalOf(response, [code, "correct horse battery"]);
      expect(error).toEqual({ code: "invalid_input", message: REFUSALS.invalid_input.message, field: "code" });
    }
    const badPassword = await postSetup(target, validInput(code, { password: "Dana@Acme.test" }));
    const error = await refusalOf(badPassword, [code, "Dana@Acme.test", "dana@acme.test"]);
    expect(error.field).toBe("password");
    expect((await readStored(stub)).counts).toEqual({ fingerprint: null, byAddress: [], recent: [] });
  });

  it("refuses set-up while no code is configured, and says closed once a user exists", async () => {
    const code = randomCode();
    const { env: unset, stub } = installation("not-configured", undefined);
    const response = await postSetup(unset, validInput(code));
    expect(response.status).toBe(503);
    expect((await refusalOf(response, [code])).code).toBe("setup_code_not_configured");
    const { env: empty } = installation("not-configured", "");
    expect((await refusalOf(await postSetup(empty, validInput(code)), [code])).code).toBe("setup_code_not_configured");
    expect((await readStored(stub)).counts.byAddress).toEqual([]);

    const { env: configured } = installation("not-configured", code);
    expect((await postSetup(configured, validInput(code))).status).toBe(200);
    expect((await refusalOf(await postSetup(unset, validInput(code)), [code])).code).toBe("setup_closed");
  });

  it("refuses the earlier code once a new code is configured, and the new code resets the counts", async () => {
    const first = randomCode();
    const second = randomCode();
    const { env: before, stub } = installation("new-code", first);
    for (let attempt = 0; attempt < 3; attempt += 1) await postSetup(before, validInput("wrong-" + randomCode()), { address: "198.51.100.8" });
    expect((await readStored(stub)).counts.byAddress[0]?.failures).toBe(3);

    const { env: after } = installation("new-code", second);
    const old = await postSetup(after, validInput(first), { address: "198.51.100.8" });
    expect(old.status).toBe(403);
    expect((await refusalOf(old, [first, second])).code).toBe("setup_code_wrong");
    // The new fingerprint cleared the three earlier failures; only the old-code attempt counts.
    expect((await readStored(stub)).counts.byAddress[0]?.failures).toBe(1);
    expect((await postSetup(after, validInput(second), { address: "198.51.100.8" })).status).toBe(200);
  });

  it("counts IPv6 addresses by their /64", async () => {
    const code = randomCode();
    const { env: target, stub } = installation("ipv6", code);
    const wrong = validInput("wrong-" + randomCode());
    await postSetup(target, wrong, { address: "2001:db8:aa:bb::1" });
    await postSetup(target, wrong, { address: "2001:0db8:00aa:00bb:ffff:1:2:3" });
    await postSetup(target, wrong, { address: "2001:db8:aa:bc::1" });
    await postSetup(target, wrong, { address: "::ffff:192.0.2.10" });
    const { byAddress } = (await readStored(stub)).counts;
    expect(byAddress.map(({ address, failures }) => ({ address, failures }))).toEqual([
      { address: "192.0.2.10", failures: 1 },
      { address: "2001:db8:aa:bb::/64", failures: 2 },
      { address: "2001:db8:aa:bc::/64", failures: 1 },
    ]);
  });

  it("creates one administrator from two correct requests sent at the same moment", async () => {
    const code = randomCode();
    const { env: target, stub } = installation("simultaneous", code);
    const responses = await Promise.all([
      postSetup(target, validInput(code, { email: "first@acme.test" }), { address: "198.51.100.20" }),
      postSetup(target, validInput(code, { email: "second@acme.test" }), { address: "198.51.100.21" }),
    ]);
    const statuses = responses.map((response) => response.status).sort();
    expect(statuses).toEqual([200, 409]);
    const refused = responses.find((response) => response.status === 409)!;
    expect((await refusalOf(refused, [code, "correct horse battery"])).code).toBe("setup_closed");
    expect((await readStored(stub)).users).toHaveLength(1);
  });

  it("refuses requests from another origin or without the app's header, before anything is counted", async () => {
    const code = randomCode();
    const { env: target, stub, calls } = installation("origin", code);
    const cases: Parameters<typeof postSetup>[2][] = [
      { origin: null },
      { origin: "https://evil.example" },
      { origin: "http://survey.acme.test" },
      { origin: ORIGIN + ":8443" },
      { origin: "null" },
      { header: null },
      { header: "0" },
      { origin: null, header: null },
    ];
    for (const options of cases) {
      const response = await postSetup(target, validInput(code), options);
      expect(response.status, JSON.stringify(options)).toBe(403);
      const error = await refusalOf(response, [code, "correct horse battery", "dana@acme.test"]);
      expect(error).toEqual({ code: "origin_refused", message: REFUSALS.origin_refused.message });
    }
    expect(calls.size).toBe(0);
    expect((await readStored(stub)).users).toEqual([]);
    expect(await stateOf(target)).toEqual({ state: "open" });
  });

  it("does not retry a create whose object reset without the version-stop reason (D-2)", async () => {
    const code = randomCode();
    // The create commits, then the call fails as a bare reset would: it must not be sent again.
    const { env: target, stub, calls } = installation("reset-after-write", code, async (operation, send) => {
      const response = await send();
      if (operation !== "createFirstAdministrator") return response;
      await response.arrayBuffer();
      throw Object.assign(new Error("Durable Object reset because its code was updated."), { durableObjectReset: true });
    });
    const log = console.error;
    console.error = () => {};
    let response: Response;
    try {
      response = await postSetup(target, validInput(code));
    } finally {
      console.error = log;
    }
    expect(response.status).toBe(500);
    expect((await refusalOf(response, [code, "correct horse battery"])).code).toBe("internal_error");
    expect(calls.get("createFirstAdministrator")).toBe(1);
    expect(calls.get("setupAttempt")).toBe(1);
    expect((await readStored(stub)).users).toHaveLength(1);
  });
});
