import { describe, expect, it } from "vitest";
import { checkSetupFields, FIELD_MESSAGES, submitSetup, waitWording } from "../src/admin/setupClient.js";
import { isSetupPath, readSetupState, STATE_TIMEOUT_MS } from "../src/admin/setupState.js";

// The set-up page's own logic (story 1.2, spec 5): wording, refusal handling and the state check,
// with a stub fetcher in place of the server. The page's flows run in browser-tests/.

type Reply = { status: number; body?: unknown; headers?: Record<string, string> };

function stubFetcher(reply: Reply) {
  const sent: { url: string; init: RequestInit }[] = [];
  const fetcher = (async (url: string, init: RequestInit) => {
    sent.push({ url, init });
    return new Response(reply.body === undefined ? null : JSON.stringify(reply.body), {
      status: reply.status,
      headers: { "content-type": "application/json", ...(reply.headers ?? {}) },
    });
  }) as unknown as typeof fetch;
  return { fetcher, sent };
}

const INPUT = { code: "K7QM2XVB9TSR4NLPWZ8HJ3CD", installationName: "Acme", name: "Dana", email: "dana@acme.test", password: "correct horse battery" };

describe("waitWording", () => {
  it("states seconds, whole minutes, and minutes with seconds", () => {
    expect(waitWording(1)).toBe("1 second");
    expect(waitWording(45)).toBe("45 seconds");
    expect(waitWording(60)).toBe("1 minute");
    expect(waitWording(90)).toBe("1 minute 30 seconds");
    expect(waitWording(240)).toBe("4 minutes");
    expect(waitWording(900)).toBe("15 minutes");
  });

  it("says a few minutes when the wait is missing, zero or not a number, never 1 second", () => {
    for (const missing of [undefined, null, 0, -5, Number.NaN, "soon"]) expect(waitWording(missing)).toBe("a few minutes");
  });
});

describe("submitSetup", () => {
  it("states the wait from the body's retryAfterSeconds", async () => {
    const { fetcher } = stubFetcher({ status: 429, body: { error: { code: "setup_wait", message: "x", retryAfterSeconds: 120 } } });
    const result = await submitSetup(INPUT, fetcher);
    expect(result).toMatchObject({ kind: "refused", focus: "code" });
    expect(result.message).toMatch(/Wait 2 minutes before trying again/);
    expect(result.message).toMatch(/deploy again to get a fresh set-up code/);
  });

  it("falls back to the Retry-After header, and to a few minutes when there is neither", async () => {
    const header = stubFetcher({ status: 429, body: { error: { code: "setup_wait", message: "x" } }, headers: { "retry-after": "45" } });
    expect((await submitSetup(INPUT, header.fetcher)).message).toMatch(/Wait 45 seconds before trying again/);
    const neither = stubFetcher({ status: 429, body: { error: { code: "setup_wait", message: "x" } } });
    expect((await submitSetup(INPUT, neither.fetcher)).message).toMatch(/Wait a few minutes before trying again/);
  });

  it("says the server is updating, as a general refusal", async () => {
    const { fetcher } = stubFetcher({ status: 503, body: { error: { code: "updating", message: "x" } } });
    expect(await submitSetup(INPUT, fetcher)).toEqual({ kind: "refused", message: "Site Survey Design is updating. Try again in a moment.", focus: null });
  });

  it("says the server is busy when the password hash queue is full (story 1.3, D-5 amended)", async () => {
    const { fetcher } = stubFetcher({ status: 503, body: { error: { code: "signin_busy", message: "x" } }, headers: { "retry-after": "5" } });
    // The same words as the sign-in page's busy message (tests/signin-client.test.mjs pins those).
    expect(await submitSetup(INPUT, fetcher)).toEqual({ kind: "refused", message: "Site Survey Design is busy. Try again in a moment.", focus: null });
  });

  it("puts a server refusal of the password on the password field", async () => {
    const { fetcher } = stubFetcher({ status: 400, body: { error: { code: "invalid_input", message: "x", field: "password" } } });
    expect(await submitSetup(INPUT, fetcher)).toEqual({ kind: "field", field: "password", message: FIELD_MESSAGES.passwordServer });
  });

  it("explains a replaced code (D-7) on the code field and an HTTP request (D-8) in the alert", async () => {
    const replaced = stubFetcher({ status: 409, body: { error: { code: "setup_code_replaced", message: "x" } } });
    const result = await submitSetup(INPUT, replaced.fetcher);
    expect(result).toMatchObject({ kind: "refused", focus: "code" });
    expect(result.message).toMatch(/new set-up code was issued/i);
    const plain = stubFetcher({ status: 403, body: { error: { code: "https_required", message: "x" } } });
    expect((await submitSetup(INPUT, plain.fetcher)).message).toMatch(/HTTPS/);
  });

  it("does not tell the installer to try again for refusals that trying again cannot fix", async () => {
    for (const [code, status] of [
      ["data_newer_than_build", 503],
      ["update_not_completed", 503],
      ["not_found", 404],
      ["method_not_allowed", 405],
      ["https_required", 403],
    ] as const) {
      const { fetcher } = stubFetcher({ status, body: { error: { code, message: "x" } } });
      const result = await submitSetup(INPUT, fetcher);
      expect(result.kind, code).toBe("refused");
      expect(result.message, code).not.toMatch(/try again/i);
    }
  });

  it("sends the app's header and the code exactly as the field check left it", async () => {
    const { fetcher, sent } = stubFetcher({ status: 200, body: { installationName: "Acme", email: "dana@acme.test" } });
    expect(await submitSetup(INPUT, fetcher)).toEqual({ kind: "done", installationName: "Acme", email: "dana@acme.test" });
    expect(sent[0]?.url).toBe("/api/v1/setup");
    expect((sent[0]?.init.headers as Record<string, string>)["x-site-survey-design"]).toBe("1");
  });
});

describe("checkSetupFields", () => {
  const VALUES = { ...INPUT, passwordAgain: INPUT.password };

  it("sends the code upper-cased without spaces or dashes, as the server compares it", () => {
    const { errors, input } = checkSetupFields({ ...VALUES, code: "  k7qm-2xvb 9tsr-4nlp wz8h-j3cd " });
    expect(errors).toEqual({});
    expect(input.code).toBe("K7QM2XVB9TSR4NLPWZ8HJ3CD");
  });

  it("says the passwords do not match on the first submit, even when the password also breaks a rule", () => {
    const { errors } = checkSetupFields({ ...VALUES, password: "short", passwordAgain: "different" });
    expect(errors.password).toBe(FIELD_MESSAGES.password);
    expect(errors.passwordAgain).toBe(FIELD_MESSAGES.passwordAgain);
    const isEmail = checkSetupFields({ ...VALUES, password: "dana@acme.test", passwordAgain: "other" });
    expect(isEmail.errors.password).toBe(FIELD_MESSAGES.passwordIsEmail);
    expect(isEmail.errors.passwordAgain).toBe(FIELD_MESSAGES.passwordAgain);
  });

  it("measures the password after NFKC, as the server does (D-9), and matches either spelling", () => {
    const elevenAccented = "é".repeat(11);
    expect(checkSetupFields({ ...VALUES, password: elevenAccented, passwordAgain: elevenAccented }).errors.password).toBe(FIELD_MESSAGES.password);
    const composed = "café crème brûlée";
    expect(checkSetupFields({ ...VALUES, password: composed, passwordAgain: composed.normalize("NFD") }).errors).toEqual({});
  });
});

describe("readSetupState", () => {
  it("answers unknown when the server does not answer in time", async () => {
    let aborted = false;
    const never = ((_url: string, init: RequestInit) =>
      new Promise<Response>(() => {
        init.signal?.addEventListener("abort", () => { aborted = true; });
      })) as unknown as typeof fetch;
    const started = Date.now();
    expect(await readSetupState(never, { timeoutMs: 50 })).toBe("unknown");
    expect(Date.now() - started).toBeLessThan(2000);
    expect(aborted).toBe(true);
  });

  it("gives up after 5 seconds by default, and answers the state when the server answers", async () => {
    expect(STATE_TIMEOUT_MS).toBe(5000);
    const { fetcher } = stubFetcher({ status: 200, body: { state: "open" } });
    expect(await readSetupState(fetcher)).toBe("open");
    const failing = stubFetcher({ status: 500 });
    expect(await readSetupState(failing.fetcher)).toBe("unknown");
  });

  it("treats /setup and /setup/ as the set-up address", () => {
    expect(isSetupPath("/setup")).toBe(true);
    expect(isSetupPath("/setup/")).toBe(true);
    expect(isSetupPath("/setupx")).toBe(false);
    expect(isSetupPath("/")).toBe(false);
  });
});
