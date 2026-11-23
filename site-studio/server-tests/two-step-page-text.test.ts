import { describe, expect, it } from "vitest";
import { REFUSALS } from "../shared/refusal";
import { CODE_FIELD_MAX_LENGTH, normaliseCode } from "../shared/twoStep";
import {
  RECOVERY_CODES_FILE_NAME,
  TWO_STEP_MESSAGES,
  codesOutcome,
  confirmTwoStep,
  entryNameLine,
  freshRecoveryCodes,
  groupedKey,
  qrLabel,
  readTwoStepState,
  recoveryCodesFile,
  recoveryCodesLeftLine,
  refusalOutcome,
  startOutcome,
  startTwoStep,
  stateOutcome,
  turnOffOutcome,
  turnOffTwoStep,
} from "../src/account/twoStepClient.js";

// My account's and the offer's page rules (story 1.5, spec 7): the code normalising the page uses,
// the key's grouping, the entry's name, the recovery-codes file, and each reply mapped to what the
// page shows, with a stub fetcher in place of the server. The page modules import shared/, so they
// are tested here, as invitation-page-text.test.ts does. The flows run in
// browser-tests/two-step.spec.mjs. Every code and key here is made up for the test, never real.

const EMAIL = "sam.rivera@harbourside.example";
// Made-up values with the shapes the server answers.
const CODES = Array.from({ length: 10 }, (_, index) => `${"abcd".repeat(3)}${String(index).padStart(4, "0")}`.replace(/(.{4})(?=.)/gu, "$1-"));
const SETUP = {
  setupId: "0".repeat(32),
  secret: "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",
  otpauthUri: "otpauth://totp/Harbourside:sam?secret=ABCD",
  installationName: "Harbourside",
  email: EMAIL,
};

describe("the page's code field rules", () => {
  it("ignores spaces and accepts exactly six digits, within the field's 12 characters (CAP-13)", () => {
    expect(normaliseCode("123 456")).toBe("123456");
    expect(normaliseCode(" 12 34 56 ")).toBe("123456");
    expect(normaliseCode("12345")).toBeNull();
    expect(normaliseCode("1234567")).toBeNull();
    expect(normaliseCode("12a456")).toBeNull();
    expect(CODE_FIELD_MAX_LENGTH).toBe(12);
  });
});

describe("the set-up's wording (D-6, D-7, D-21)", () => {
  it("groups the key in fours", () => {
    expect(groupedKey("ABCDEFGHIJKLMNOPQRSTUVWXYZ234567")).toBe("ABCD EFGH IJKL MNOP QRST UVWX YZ23 4567");
    expect(groupedKey("ABCDEF")).toBe("ABCD EF");
  });

  it("names the entry as installation name and email, a colon in either becoming a space", () => {
    expect(entryNameLine("Harbourside Facilities", EMAIL)).toBe(
      `Choose a time-based key. The entry will be named Harbourside Facilities:${EMAIL}.`,
    );
    expect(entryNameLine("Site: North", "a:b@example.test")).toBe("Choose a time-based key. The entry will be named Site  North:a b@example.test.");
  });

  it("names the QR image and the count", () => {
    expect(qrLabel("Harbourside Facilities")).toBe("QR code to add Harbourside Facilities to your authenticator app");
    expect(recoveryCodesLeftLine(10)).toBe("Recovery codes left: 10 of 10");
    expect(recoveryCodesLeftLine(1)).toBe("Recovery codes left: 1 of 10");
    expect(recoveryCodesLeftLine(0)).toBe("No recovery codes left. Make a fresh set so you can still sign in if you lose your phone.");
  });

  it("reuses the refusal messages for the key states", () => {
    expect(TWO_STEP_MESSAGES.noKey).toBe(REFUSALS.deployment_key_missing.message);
    expect(TWO_STEP_MESSAGES.mismatch).toBe(REFUSALS.deployment_key_mismatch.message);
  });
});

describe("the recovery-codes file (D-21)", () => {
  it("is the wording's text with LF line ends, the local time as story 1.4's expiry, and the codes as shown", () => {
    const text = recoveryCodesFile({
      installationName: "Harbourside Facilities",
      email: EMAIL,
      made: new Date("2026-11-28T22:00:00.000Z"),
      codes: CODES,
      timeZone: "UTC",
    });
    expect(RECOVERY_CODES_FILE_NAME).toBe("site-survey-design-recovery-codes.txt");
    expect(text).toBe(
      [
        "Site Survey Design recovery codes",
        "Installation: Harbourside Facilities",
        `Account: ${EMAIL}`,
        "Made: 28 November 2026, 22:00",
        "",
        "Each code works once.",
        "",
        ...CODES,
        "",
      ].join("\n"),
    );
    expect(text).not.toContain("\r");
  });

  it("states the time in the zone given and shows codes in four groups whatever their spelling", () => {
    const text = recoveryCodesFile({
      installationName: "H",
      email: EMAIL,
      made: new Date("2026-11-28T22:00:00.000Z"),
      codes: CODES.map((code) => code.replace(/-/gu, "").toUpperCase()),
      timeZone: "Europe/Paris",
    });
    expect(text).toContain("Made: 28 November 2026, 23:00\n");
    for (const code of CODES) expect(text).toContain(`\n${code}`);
  });
});

describe("the replies as the page shows them", () => {
  it("reads the state, and treats a reply that is not the declared one as could not be loaded", () => {
    const state = { enabled: true, recoveryCodesRemaining: 9, availability: "available", email: EMAIL };
    expect(stateOutcome(200, state)).toEqual({ kind: "state", state });
    expect(stateOutcome(200, { ...state, availability: "maybe" })).toEqual({ kind: "failed" });
    expect(stateOutcome(200, { ...state, recoveryCodesRemaining: 11 })).toEqual({ kind: "failed" });
    expect(stateOutcome(401, { error: { code: "not_signed_in", message: REFUSALS.not_signed_in.message } })).toEqual({ kind: "signedOut" });
    expect(stateOutcome(500, null)).toEqual({ kind: "failed" });
  });

  it("maps the start reply and its refusals", () => {
    expect(startOutcome(200, SETUP)).toEqual({ kind: "started", setup: SETUP });
    expect(startOutcome(200, { ...SETUP, setupId: "x" }).kind).toBe("refused");
    const wrong = { error: { code: "two_step_password_wrong", message: REFUSALS.two_step_password_wrong.message } };
    expect(startOutcome(403, wrong)).toEqual({ kind: "refused", message: "That password is not correct." });
    expect(startOutcome(409, { error: { code: "two_step_already_on", message: "" } })).toEqual({
      kind: "refused", message: REFUSALS.two_step_already_on.message,
    });
    expect(startOutcome(503, { error: { code: "deployment_key_missing", message: "" } }).kind).toBe("refused");
    expect(startOutcome(400, { error: { code: "invalid_input", message: "", field: "password" } })).toEqual({ kind: "field", field: "password" });
  });

  it("composes the wait and uses the sign-in page's busy, updating and network wording", () => {
    expect(refusalOutcome(429, { error: { code: "signin_wait", message: "", retryAfterSeconds: 60 } })).toEqual({
      kind: "refused", message: "Too many attempts. Wait 1 minute before trying again.",
    });
    expect(refusalOutcome(429, { error: { code: "signin_wait", message: "" } }, "90").message).toBe(
      "Too many attempts. Wait 1 minute 30 seconds before trying again.",
    );
    expect(refusalOutcome(503, { error: { code: "signin_busy", message: "" } }).message).toBe("Site Survey Design is busy. Try again in a moment.");
    expect(refusalOutcome(503, { error: { code: "updating", message: "" } }).message).toBe("Site Survey Design is updating. Try again in a moment.");
    expect(refusalOutcome(502, null).message).toBe("The server could not be reached. Check the connection and try again.");
  });

  it("maps confirm, fresh codes and turning off", () => {
    expect(codesOutcome(200, { recoveryCodes: CODES })).toEqual({ kind: "codes", codes: CODES });
    expect(codesOutcome(200, { recoveryCodes: CODES.slice(1) }).kind).toBe("refused");
    expect(codesOutcome(409, { error: { code: "two_step_setup_expired", message: "" } })).toEqual({
      kind: "expired", message: "This set-up has expired or was replaced. Start again.",
    });
    expect(codesOutcome(403, { error: { code: "two_step_code_wrong", message: "" } })).toEqual({
      kind: "refused", message: REFUSALS.two_step_code_wrong.message,
    });
    expect(codesOutcome(400, { error: { code: "invalid_input", message: "", field: "code" } })).toEqual({ kind: "field", field: "code" });
    expect(turnOffOutcome(200, { enabled: false })).toEqual({ kind: "off" });
    expect(turnOffOutcome(403, { error: { code: "two_step_password_wrong", message: "" } }).message).toBe("That password is not correct.");
  });
});

type Sent = { url: string; init: RequestInit };

function stub(status: number, body: unknown) {
  const sent: Sent[] = [];
  const fetcher = (async (url: string, init: RequestInit) => {
    sent.push({ url, init });
    return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
  }) as unknown as typeof fetch;
  return { fetcher, sent };
}

const unreachable = (async () => { throw new TypeError("network"); }) as unknown as typeof fetch;
const never = ((_url: string, init: RequestInit) =>
  new Promise((_resolve, reject) => init.signal?.addEventListener("abort", () => reject(new Error("aborted"))))) as unknown as typeof fetch;

describe("the client's requests", () => {
  it("reads the state with GET and sends each action as JSON to its route with the app's header", async () => {
    const read = stub(200, { enabled: false, recoveryCodesRemaining: 0, availability: "available", email: EMAIL });
    expect((await readTwoStepState(read.fetcher)).kind).toBe("state");
    expect(read.sent[0]!.url).toBe("/api/v1/account/two-step");
    expect(read.sent[0]!.init.method ?? "GET").toBe("GET");
    const calls: [string, (fetcher: typeof fetch) => Promise<unknown>, unknown][] = [
      ["/api/v1/account/two-step/start", (fetcher) => startTwoStep({ password: "a password" }, fetcher), SETUP],
      ["/api/v1/account/two-step/confirm", (fetcher) => confirmTwoStep({ setupId: SETUP.setupId, code: "123456" }, fetcher), { recoveryCodes: CODES }],
      ["/api/v1/account/two-step/turn-off", (fetcher) => turnOffTwoStep({ password: "a password" }, fetcher), { enabled: false }],
      ["/api/v1/account/two-step/recovery-codes", (fetcher) => freshRecoveryCodes({ password: "a password", code: "123456" }, fetcher), { recoveryCodes: CODES }],
    ];
    for (const [url, call, body] of calls) {
      const { fetcher, sent } = stub(200, body);
      await call(fetcher);
      expect(sent[0]!.url).toBe(url);
      expect(sent[0]!.init.method).toBe("POST");
      expect((sent[0]!.init.headers as Record<string, string>)["x-site-survey-design"]).toBe("1");
    }
  });

  it("treats no answer and a timeout as could not be loaded, or the network message", async () => {
    expect(await readTwoStepState(unreachable)).toEqual({ kind: "failed" });
    expect(await readTwoStepState(never, { timeoutMs: 20 })).toEqual({ kind: "failed" });
    const network = "The server could not be reached. Check the connection and try again.";
    expect(((await startTwoStep({ password: "p" }, unreachable)) as { message: string }).message).toBe(network);
    expect(((await confirmTwoStep({ setupId: SETUP.setupId, code: "123456" }, never, { timeoutMs: 20 })) as { message: string }).message).toBe(network);
  });
});
