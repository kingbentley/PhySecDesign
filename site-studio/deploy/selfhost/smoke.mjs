#!/usr/bin/env node
// Self-hosted smoke test (story 1.1): start the built Worker bundle under workerd with Durable
// Object storage on disk, read the installation's createdAt (recorded when the installation
// object is first created), stop the process, start it again on the same storage, and check that
// the same value comes back. Also checks the release, the app's page and script, an API refusal
// and that a directory is never listed. Run `npm run build` first.
//
// Story 1.2: it also completes set-up with test data, so the bundle's scrypt hashing runs under
// workerd and proves `nodejs_compat` works self-hosted, and after the restart checks that set-up
// is closed. Self-hosted installations get their set-up code in story 2.21; here a random code for
// this run only is given to workerd through a temporary copy of the configuration (next to the
// original, so its `embed` path still resolves), deleted afterwards and never committed.
//
// Story 1.3: before the restart it signs in, and after it finds the same cookie still signed in
// (V-11); it fails one sign-in for an email with no account before the restart and four after,
// then finds the wait (V-17: these requests carry no address, so this is the email's count, D-11);
// it signs out and finds the old cookie no longer signed in; and it runs the password probe in
// deploy/probe/ under workerd against the committed fixture (D-6).
//
// Story 1.5 (D-16): workerd gets the deployment key from the DEPLOYMENT_KEY environment variable
// (config.capnp's fromEnvironment binding). A key is generated for this run and given only in the
// child's environment, never in a file or the output. Before the restart it turns two-step
// verification on through the API, signs in with the password and a code, and finds a recovery
// code accepted once and refused the second time; after the restart a code of a later step signs
// in. A start without the variable, on separate empty storage, finds two-step verification
// unavailable (`no_key`) and turning on refused `deployment_key_missing`. A restart on the first
// storage with a different key finds the key mismatched: a code refused `deployment_key_mismatch`,
// a recovery code still signing in, and workerd's output holding the mismatch log line once. Codes
// are computed by this file's own RFC 6238 helper, written independently of server/auth/totp.ts.
//
// Waits: a code is accepted only for a step later than the last accepted one, so a code expected to
// sign in may wait for the next 30-second step (nextCode prints how long). That can happen only for
// the confirm and the code sign-ins of the first start and the restart, never in the changed-key
// run, whose refused code never waits, so no wait sits between the mismatch line and its count.
// SMOKE_FORCE_CODE_WAIT=1 (off by default; read only here) makes the first accepted code take the
// latest step the installation accepts, so the next code must wait: it exercises the wait.
//
// Output: workerd's own output is held in memory, never echoed. On a failure only the event names
// of its JSON log lines are printed, except when workerd exits before it answers: then its stderr
// is printed too, without any line holding the set-up code or a key. That output comes before any
// request is handled, so it holds no code, cookie or token.
import { spawn } from "node:child_process";
import { createHmac, randomBytes } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as workerd from "workerd";
import { verifyFixtureUnderWorkerd } from "../probe/probe.mjs";

// The workerd package is CommonJS; its binary path is the `default` export of module.exports.
const workerdBinary = typeof workerd.default === "string" ? workerd.default : workerd.default.default;

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const baseConfig = path.join(here, "config.capnp");
const config = path.join(here, `.smoke-${process.pid}.capnp`);
const setupCode = randomBytes(18).toString("hex");
const bundle = path.join(root, "dist", "worker", "index.js");
const client = path.join(root, "dist", "client");
const { version } = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
const FETCH_TIMEOUT_MS = 2000;
// One scrypt hash (128 MiB, N = 131,072) can take a few seconds on a slow runner.
const SETUP_TIMEOUT_MS = 30_000;
// Test data for this run only.
const ADMIN_EMAIL = "smoke-admin@example.test";
const ADMIN_PASSWORD = randomBytes(12).toString("hex");
const UNKNOWN_EMAIL = "smoke-nobody@example.test";
const WRONG_PASSWORD = randomBytes(12).toString("hex");
/** The browser marker's cookie names start with this; the session cookie's do not (story 1.3, D-3). */
const MARKER_PREFIX = "__Host-ssd-m-";
/** The pending sign-in cookie's names start with this (story 1.5, D-2). */
const PENDING_PREFIX = "__Host-ssd-p-";
// The deployment keys for this run (story 1.5, D-14, D-16): 32 random bytes, base64url without
// padding. Given only in workerd's environment; never written to a file or printed.
const KEY_A = newDeploymentKey();
let KEY_B = newDeploymentKey();
while (KEY_B === KEY_A) KEY_B = newDeploymentKey();
/** The runtime log line of a mismatched key (story 1.5, wording.md "Runtime log"). */
const MISMATCH_LINE = JSON.stringify({ event: "deployment_key_mismatch", object: "installation" });
// TOTP as the installation uses it (CA-12): 6 digits, a 30-second step, one step either side.
const TOTP_STEP_MS = 30_000;
const TOTP_WINDOW = 1;
/** Exercises nextCode's wait (see the header); off unless the variable is exactly "1". */
const FORCE_CODE_WAIT = process.env.SMOKE_FORCE_CODE_WAIT === "1";

class SmokeFailure extends Error {}
/** workerd exited before it answered: its start-up output may say why. */
class EarlyExit extends SmokeFailure {}

/** The values the public key state may answer (D-18): only these are ever printed from it. */
const KEY_STATE_FINGERPRINTS = ["none", "stored"];
const KEY_STATE_KEYS = ["none", "present", "matches", "mismatch"];

/** The last time step accepted for the administrator's account: a code must be of a later one (D-6). */
let lastStep = null;
let storage = null;
let bareStorage = null;

// Run only as a script (Windows paths compared without case); importing it (the unit tests import
// keyStateReply) starts nothing.
const invoked = process.argv[1] ? path.resolve(process.argv[1]) : "";
const self = fileURLToPath(import.meta.url);
if (process.platform === "win32" ? invoked.toLowerCase() === self.toLowerCase() : invoked === self) await main();

async function main() {
  try {
    for (const file of [bundle, path.join(client, "index.html")]) {
      if (!existsSync(file)) fail(`Missing ${path.relative(root, file)}. Run npm run build first.`);
    }
    // RFC 6238's SHA-1 test vectors, to six digits: T = 59 s (step 1), from the raw secret and from its
    // base32 form, and T = 20000000000 s (step 666666666): the helpers below are correct.
    const rfcSecret = Buffer.from("12345678901234567890", "ascii");
    if (
      totpCode(rfcSecret, 1) !== "287082" ||
      totpCode(base32Bytes("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ"), 1) !== "287082" ||
      totpCode(rfcSecret, 666666666) !== "353130"
    ) {
      fail("The smoke suite's RFC 6238 helper fails its test vectors.");
    }
    storage = mkdtempSync(path.join(tmpdir(), "site-studio-smoke-"));
    writeSmokeConfig();
    const port = await freePort();
    const base = `http://127.0.0.1:${port}`;

    const first = await withServer({ base, port, storage, key: KEY_A }, async () => {
      const status = await readStatus(base);
      if (status.release !== version) fail(`The release is ${status.release}, not package.json's ${version}.`);
      await checkPage(base);
      await checkRefusal(base);
      await checkNoListing(base);
      await completeSetup(base);
      const cookies = await signIn(base);
      await expectSession(base, cookies, true);
      await failSignIn(base, 1);
      // Two-step verification (story 1.5, CAP-1, CAP-3, CAP-5, CAP-10).
      await expectKeyState(base, { fingerprint: "none", key: "present" });
      const twoStep = await turnOnTwoStep(base, cookies);
      await expectKeyState(base, { fingerprint: "stored", key: "matches" });
      const withCode = await completeSecondStep(base, await pendingSignIn(base), "code", await nextCode(twoStep.secret, true));
      await expectSession(base, withCode, true);
      const withRecovery = await completeSecondStep(base, await pendingSignIn(base), "recovery", twoStep.recoveryCodes[0]);
      await expectSession(base, withRecovery, true);
      await refusedSecondStep(base, await pendingSignIn(base), "recovery", twoStep.recoveryCodes[0], 401, "second_step_recovery_code_wrong");
      await expectTwoStepState(base, cookies, { enabled: true, availability: "available", recoveryCodesRemaining: 9 });
      return { status, cookies, twoStep };
    });
    expectNoKeyEvents(first.output, "the first start");
    console.log(`first start: release ${first.value.status.release}, createdAt ${first.value.status.installation.createdAt}, set-up completed, signed in`);
    console.log("first start: two-step verification turned on, signed in with a code, a recovery code accepted once and refused the second time");

    const second = await withServer({ base, port, storage, key: KEY_A }, async () => {
      const status = await readStatus(base);
      const state = await readSetupState(base);
      if (state !== "closed") fail(`After the restart set-up is ${state}, not closed: the administrator did not persist.`);
      // The same cookie is still signed in: the identifier and the session survived (V-11).
      await expectSession(base, first.value.cookies, true);
      // Two-step verification survived the restart: a code of a later step signs in (CAP-3, CAP-5).
      await expectKeyState(base, { fingerprint: "stored", key: "matches" });
      // The code is taken after the password step, which can take seconds (scrypt): a code taken
      // before it could be of a step the installation no longer accepts when it arrives.
      const pending = await pendingSignIn(base);
      let laterCode = await nextCode(first.value.twoStep.secret, true);
      let laterStep = lastStep;
      const withCode = await completeSecondStep(base, pending, "code", laterCode);
      await expectSession(base, withCode, true);
      // A code works once (CAP-5): the same code on a new pending sign-in is refused. The refusal is
      // evidence only while that code's step is still accepted when it is sent: if the password step
      // took it past the window, a fresh code signs in on that pending sign-in instead and the replay
      // is tried again with the fresh code (pull request 13, review round 2).
      for (let attempt = 1; ; attempt += 1) {
        const replayPending = await pendingSignIn(base);
        if (codeStillAccepted(laterStep, Date.now())) {
          await refusedSecondStep(base, replayPending, "code", laterCode, 401, "second_step_code_wrong");
          break;
        }
        if (attempt === 3) fail("The replay check could not be made inside the code's window three times.");
        laterCode = await nextCode(first.value.twoStep.secret, true);
        laterStep = lastStep;
        await expectSession(base, await completeSecondStep(base, replayPending, "code", laterCode), true);
      }
      // One failure before the restart and four after reach the wait (V-17).
      await failSignIn(base, 4);
      await expectWait(base);
      await signOut(base, first.value.cookies);
      await expectSession(base, first.value.cookies, false);
      return status;
    });
    expectNoKeyEvents(second.output, "the restart");
    console.log(`after restart: createdAt ${second.value.installation.createdAt}, set-up closed, still signed in, counts kept, signed out`);
    console.log("after restart: signed in with the password and a code of a later step, the same code refused the second time");

    const probe = await verifyFixtureUnderWorkerd();
    console.log(`password probe under workerd: fixture ${probe.fixture ? "verified" : "refused"}, wrong password ${probe.wrongPassword ? "verified" : "refused"}`);

    // No variable, on separate empty storage (finding 6, finding 31): the unset binding is null.
    bareStorage = mkdtempSync(path.join(tmpdir(), "site-studio-smoke-"));
    const third = await withServer({ base, port, storage: bareStorage, key: null }, async () => {
      await expectKeyState(base, { fingerprint: "none", key: "none" }, "Without a deployment key on empty storage");
      await completeSetup(base);
      const cookies = await signIn(base);
      await expectTwoStepState(base, cookies, { enabled: false, availability: "no_key" });
      await refusedStart(base, cookies, 503, "deployment_key_missing");
    });
    expectNoKeyEvents(third.output, "the start without a key");
    console.log("start without a key: two-step verification not available (no_key), turning on refused deployment_key_missing");

    // The first storage with a different key (criterion 23, finding 31).
    const fourth = await withServer({ base, port, storage, key: KEY_B }, async () => {
      const status = await readStatus(base);
      await expectKeyState(base, { fingerprint: "stored", key: "mismatch" }, "With a changed deployment key");
      const pending = await pendingSignIn(base);
      const refused = await refusedSecondStep(base, pending, "code", await nextCode(first.value.twoStep.secret, false), 503, "deployment_key_mismatch");
      if (refused.headers.getSetCookie().length !== 0) fail("A code refused deployment_key_mismatch changed the pending sign-in cookie; it must be kept.");
      const withRecovery = await completeSecondStep(base, pending, "recovery", first.value.twoStep.recoveryCodes[1]);
      await expectSession(base, withRecovery, true);
      await expectTwoStepState(base, withRecovery, { enabled: true, availability: "key_mismatch", recoveryCodesRemaining: 8 });
      return status;
    });
    const mismatchLines = countLines(fourth.output, MISMATCH_LINE);
    if (mismatchLines !== 1) fail(`With a changed key workerd's output held the deployment_key_mismatch log line ${mismatchLines} times, not once.`);
    const keyEvents = eventNames(fourth.output).filter((name) => name.startsWith("deployment_key_"));
    if (keyEvents.join() !== "deployment_key_mismatch") fail(`With a changed key workerd logged ${keyEvents.join(", ") || "no deployment-key event"}, not deployment_key_mismatch alone.`);
    console.log("restart with a changed key: key mismatch reported, a code refused deployment_key_mismatch, a recovery code signed in, the log line written once");

    const createdAt = first.value.status.installation.createdAt;
    const dataFormat = first.value.status.installation.dataFormat;

    if (second.value.installation.createdAt !== createdAt || fourth.value.installation.createdAt !== createdAt) {
      fail("The installation's createdAt changed across the restart: storage did not persist.");
    }
    if (second.value.installation.dataFormat !== dataFormat || fourth.value.installation.dataFormat !== dataFormat) fail("The data format changed across the restart.");
    console.log("Self-hosted smoke test passed: the value saved on first start was read back after a restart.");
  } catch (error) {
    console.error(`Self-hosted smoke test failed: ${error instanceof SmokeFailure ? error.message : error?.stack ?? error}`);
    process.exitCode = 1;
  } finally {
    if (storage) rmSync(storage, { recursive: true, force: true });
    if (bareStorage) rmSync(bareStorage, { recursive: true, force: true });
    rmSync(config, { force: true });
  }
}

/**
 * How a key-state reply is described in a failure: its status, and its two values only when the
 * body is exactly `{ fingerprint, key }` with values D-18 allows; otherwise "an invalid reply", so
 * that nothing else a reply may hold (such as a key) is ever printed.
 */
export function keyStateReply(status, body) {
  const fields = body && typeof body === "object" && !Array.isArray(body) ? Object.keys(body).sort().join() : "";
  const valid = fields === "fingerprint,key" && KEY_STATE_FINGERPRINTS.includes(body.fingerprint) && KEY_STATE_KEYS.includes(body.key);
  return valid ? `${status} with fingerprint ${body.fingerprint} and key ${body.key}` : `${status} with an invalid reply`;
}

function newDeploymentKey() {
  return randomBytes(32).toString("base64url");
}

/** RFC 4648 base32 (upper or lower case, no padding) to bytes. */
function base32Bytes(text) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bytes = [];
  let buffer = 0;
  let bits = 0;
  for (const character of text.toUpperCase()) {
    const value = alphabet.indexOf(character);
    if (value < 0) fail("The authenticator secret in the start reply is not base32.");
    buffer = ((buffer << 5) | value) & 0xffff;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >>> bits) & 0xff);
    }
  }
  return Buffer.from(bytes);
}

/** RFC 6238 TOTP with HMAC-SHA-1 and six digits, for a time step (RFC 4226's dynamic truncation). */
function totpCode(secret, step) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const mac = createHmac("sha1", secret).update(counter).digest();
  const offset = mac[mac.length - 1] & 0x0f;
  return String((mac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).padStart(6, "0");
}

function stepAt(ms) {
  return Math.floor(ms / TOTP_STEP_MS);
}

/**
 * Whether a code of `step` is still inside the accepted window at `now`, with two seconds to spare
 * for the request to arrive (as `nextCode` allows): a replay of an expired code would be refused
 * whether or not the server prevents replay, so it proves nothing (pull request 13, review round 2).
 * The bound holds above too: a code ahead of the window (the host clock moved back) is refused as
 * out of window with the same refusal as a replay (review round 3). The upper side has no margin:
 * the smoke test and the installation read one host clock, and `nextCode` takes a code one step
 * ahead right after a step begins, which a margin would refuse on every retry (review layer).
 */
export function codeStillAccepted(step, now) {
  return step !== null && step >= stepAt(now + 2000) - TOTP_WINDOW && step <= stepAt(now) + TOTP_WINDOW;
}

/**
 * A code of the earliest step the installation accepts now that is later than the last accepted
 * one (D-6). A code of the step before the current one is taken only with two seconds to spare
 * before the step changes; when the next allowed step is beyond the window, it waits for the next
 * step to begin and says how long it waited. `accept` records the step as used (a code expected to
 * sign in). A code expected to be refused is of the current step, without waiting and leaving the
 * last step unchanged: a wait of up to 30 s can let workerd evict the idle installation object,
 * whose restart would log the key-mismatch line a second time.
 */
async function nextCode(secretText, accept) {
  const secret = base32Bytes(secretText);
  if (!accept) return totpCode(secret, stepAt(Date.now()));
  for (;;) {
    const now = Date.now();
    const current = stepAt(now);
    const lowest = stepAt(now + 2000) - TOTP_WINDOW;
    const first = FORCE_CODE_WAIT ? current + TOTP_WINDOW : lowest;
    const step = lastStep === null ? first : Math.max(lastStep + 1, lowest);
    if (step <= current + TOTP_WINDOW) {
      lastStep = step;
      return totpCode(secret, step);
    }
    const wait = (current + 1) * TOTP_STEP_MS - now + 50;
    await delay(wait);
    console.log(`waited ${(wait / 1000).toFixed(1)} s for the next authenticator step`);
  }
}

/** A refusal's status and code only: never a reply body that may hold a secret or a code. */
async function refusalOf(response) {
  const body = await response.json().catch(() => null);
  return `${response.status} ${body?.error?.code ?? "(no refusal code)"}`;
}

/** Reads the public key state (D-18) and compares it with the expected one. */
async function expectKeyState(base, expected, context = "The deployment-key state") {
  const response = await get(base + "/api/v1/deployment-key/state");
  const body = await response.json().catch(() => null);
  const keys = Object.keys(body ?? {}).sort().join();
  if (response.status !== 200 || keys !== "fingerprint,key" || body.fingerprint !== expected.fingerprint || body.key !== expected.key) {
    fail(`${context}: GET /api/v1/deployment-key/state answered ${keyStateReply(response.status, body)}, not ${expected.fingerprint} and ${expected.key}.`);
  }
}

/** Reads the signed-in account's two-step state and compares the fields given. */
async function expectTwoStepState(base, cookies, expected) {
  const response = await get(base + "/api/v1/account/two-step", { headers: { cookie: cookieHeader(cookies) } });
  const body = await response.json().catch(() => null);
  if (response.status !== 200) fail(`GET /api/v1/account/two-step answered ${response.status} ${body?.error?.code}.`);
  for (const [field, value] of Object.entries(expected)) {
    if (body?.[field] !== value) fail(`The two-step state's ${field} is ${body?.[field]}, not ${value}.`);
  }
}

/**
 * Turns two-step verification on for the signed-in administrator: the password starts a set-up,
 * a code computed from its secret confirms it. Answers the secret and the recovery codes, which
 * stay in memory and are never printed.
 */
async function turnOnTwoStep(base, cookies) {
  await expectTwoStepState(base, cookies, { enabled: false, availability: "available" });
  const start = await fetch(base + "/api/v1/account/two-step/start", {
    method: "POST",
    headers: fromApp(base, cookies),
    body: JSON.stringify({ password: ADMIN_PASSWORD }),
    signal: AbortSignal.timeout(SETUP_TIMEOUT_MS),
  });
  if (start.status !== 200) fail(`POST /api/v1/account/two-step/start answered ${await refusalOf(start)}.`);
  const started = await start.json().catch(() => null);
  if (typeof started?.setupId !== "string" || typeof started?.secret !== "string") fail("The set-up start reply has no set-up identifier or secret.");

  const confirm = await fetch(base + "/api/v1/account/two-step/confirm", {
    method: "POST",
    headers: fromApp(base, cookies),
    body: JSON.stringify({ setupId: started.setupId, code: await nextCode(started.secret, true) }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (confirm.status !== 200) fail(`POST /api/v1/account/two-step/confirm answered ${await refusalOf(confirm)}.`);
  const confirmed = await confirm.json().catch(() => null);
  if (!Array.isArray(confirmed?.recoveryCodes) || confirmed.recoveryCodes.length !== 10) fail("The confirm reply did not hold 10 recovery codes.");
  await expectTwoStepState(base, cookies, { enabled: true, availability: "available", recoveryCodesRemaining: 10 });
  return { secret: started.secret, recoveryCodes: confirmed.recoveryCodes };
}

/** Turning on refused before anything is set up, with its status and code. */
async function refusedStart(base, cookies, status, code) {
  const response = await fetch(base + "/api/v1/account/two-step/start", {
    method: "POST",
    headers: fromApp(base, cookies),
    body: JSON.stringify({ password: ADMIN_PASSWORD }),
    signal: AbortSignal.timeout(SETUP_TIMEOUT_MS),
  });
  const body = await response.json().catch(() => null);
  if (response.status !== status || body?.error?.code !== code) {
    fail(`Turning on two-step verification answered ${response.status} ${body?.error?.code}, not ${status} ${code}.`);
  }
}

/**
 * Signs the administrator in with the password, for an account with two-step verification on: the
 * reply is `{ secondStep: true }` and sets only the pending sign-in cookie (criterion 3). Answers
 * that cookie as a jar.
 */
async function pendingSignIn(base) {
  const response = await fetch(base + "/api/v1/session/sign-in", {
    method: "POST",
    headers: fromApp(base),
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    signal: AbortSignal.timeout(SETUP_TIMEOUT_MS),
  });
  const body = await response.json().catch(() => null);
  if (response.status !== 200 || Object.keys(body ?? {}).join() !== "secondStep" || body.secondStep !== true) {
    fail(`A password sign-in for a two-step account answered ${response.status} ${body?.error?.code ?? "without { secondStep: true }"}.`);
  }
  const cookies = keptCookies(response);
  const names = Object.keys(cookies);
  if (names.length !== 1 || !names[0].startsWith(PENDING_PREFIX)) fail(`The password sign-in set ${names.length} cookies, not the pending sign-in cookie alone.`);
  return cookies;
}

function postSecondStep(base, pending, method, code) {
  return fetch(base + "/api/v1/session/second-step", {
    method: "POST",
    headers: fromApp(base, pending),
    body: JSON.stringify({ method, code }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
}

/** Completes the second step: a new session and the marker are set and the pending cookie cleared. */
async function completeSecondStep(base, pending, method, code) {
  const response = await postSecondStep(base, pending, method, code);
  if (response.status !== 200) fail(`The second step with a ${method === "code" ? "code" : "recovery code"} answered ${await refusalOf(response)}.`);
  const body = await response.json().catch(() => null);
  if (body?.name !== "Smoke Test Administrator") fail("The second step's reply did not name the administrator.");
  const cookies = keptCookies(response, pending);
  const names = Object.keys(cookies);
  if (names.length !== 2 || !names.some((name) => name.startsWith(MARKER_PREFIX)) || names.some((name) => name.startsWith(PENDING_PREFIX))) {
    fail("The second step did not set a session and a marker and clear the pending sign-in cookie.");
  }
  return cookies;
}

/** The second step refused with the given status and code. Answers the response (its body read). */
async function refusedSecondStep(base, pending, method, code, status, refusal) {
  const response = await postSecondStep(base, pending, method, code);
  const body = await response.json().catch(() => null);
  if (response.status !== status || body?.error?.code !== refusal) {
    fail(`The second step with a ${method === "code" ? "code" : "recovery code"} answered ${response.status} ${body?.error?.code}, not ${status} ${refusal}.`);
  }
  return response;
}

/** How many lines of workerd's output are exactly `line`. */
function countLines(output, line) {
  return output.split(/\r?\n/).filter((text) => text.trim() === line).length;
}

/** The `event` names of the lines of workerd's output that are JSON objects with one; nothing else. */
function eventNames(output) {
  const names = [];
  for (const text of output.split(/\r?\n/)) {
    try {
      const value = JSON.parse(text.trim());
      if (value && typeof value === "object" && typeof value.event === "string") names.push(value.event);
    } catch {
      // Not a JSON line: never printed.
    }
  }
  return names;
}

/** With the right key or none and nothing stored, no deployment-key event is logged. */
function expectNoKeyEvents(output, run) {
  const events = eventNames(output).filter((name) => name.startsWith("deployment_key_"));
  if (events.length !== 0) fail(`During ${run} workerd logged ${events.join(", ")}.`);
}

function writeSmokeConfig() {
  const text = readFileSync(baseConfig, "utf8");
  // The checkout may use CRLF line endings (Windows), so match the line however it ends.
  const marker = /^([ \t]*bindings = \[)(\r?\n)/m;
  if (!marker.test(text)) fail("deploy/selfhost/config.capnp has no bindings list to add the test set-up code to.");
  writeFileSync(config, text.replace(marker, (_, line, end) => `${line}${end}    (name = "SETUP_CODE", text = "${setupCode}"),${end}`), { mode: 0o600 });
}

async function readSetupState(base) {
  const response = await get(base + "/api/v1/setup/state");
  const body = await response.json();
  if (response.status !== 200 || Object.keys(body ?? {}).join() !== "state") {
    fail(`GET /api/v1/setup/state answered ${response.status}: ${JSON.stringify(body)}`);
  }
  return body.state;
}

// Completes set-up with test data: the request path hashes the password with scrypt through
// node:crypto, which needs nodejs_compat under workerd.
async function completeSetup(base) {
  if ((await readSetupState(base)) !== "open") fail("Set-up is not open on a new installation.");
  const response = await fetch(base + "/api/v1/setup", {
    method: "POST",
    headers: { "content-type": "application/json", origin: base, "x-site-survey-design": "1" },
    body: JSON.stringify({
      code: setupCode,
      installationName: "Smoke Test Installation",
      name: "Smoke Test Administrator",
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }),
    signal: AbortSignal.timeout(SETUP_TIMEOUT_MS),
  });
  const body = await response.json().catch(() => null);
  if (response.status !== 200 || body?.installationName !== "Smoke Test Installation" || body?.email !== ADMIN_EMAIL) {
    // The reply never holds the code or the password, so it is safe to print.
    fail(`POST /api/v1/setup answered ${response.status}: ${JSON.stringify(body)}`);
  }
  if ((await readSetupState(base)) !== "closed") fail("Set-up is still open after it completed.");
}

function fromApp(base, cookies = {}) {
  const headers = { "content-type": "application/json", origin: base, "x-site-survey-design": "1" };
  const cookie = cookieHeader(cookies);
  if (cookie) headers.cookie = cookie;
  return headers;
}

function cookieHeader(cookies) {
  return Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

/** The cookies a browser would keep: set ones by name, cleared ones (Max-Age=0) removed. */
function keptCookies(response, jar = {}) {
  const next = { ...jar };
  for (const line of response.headers.getSetCookie()) {
    const [pair] = line.split(";");
    const name = pair.slice(0, pair.indexOf("=")).trim();
    if (/;\s*max-age=0\b/i.test(line)) delete next[name];
    else next[name] = pair.slice(pair.indexOf("=") + 1).trim();
  }
  return next;
}

// Signs the administrator in: the reply sets the session cookie and the marker. Cookie values and
// the password are never printed.
async function signIn(base) {
  const response = await fetch(base + "/api/v1/session/sign-in", {
    method: "POST",
    headers: fromApp(base),
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    signal: AbortSignal.timeout(SETUP_TIMEOUT_MS),
  });
  const body = await response.json().catch(() => null);
  if (response.status !== 200 || body?.name !== "Smoke Test Administrator") fail(`POST /api/v1/session/sign-in answered ${response.status}: ${JSON.stringify(body)}`);
  const cookies = keptCookies(response);
  const names = Object.keys(cookies);
  if (names.length !== 2 || !names.some((name) => name.startsWith(MARKER_PREFIX))) fail(`The sign-in reply set ${names.length} cookies, not a session and a marker.`);
  return cookies;
}

async function expectSession(base, cookies, signedIn) {
  const response = await get(base + "/api/v1/session", { headers: { cookie: cookieHeader(cookies) } });
  const body = await response.json().catch(() => null);
  if (response.status !== 200 || body?.signedIn !== signedIn) {
    fail(`GET /api/v1/session answered ${response.status} with signedIn ${body?.signedIn}, expected ${signedIn}.`);
  }
  if (signedIn && body.name !== "Smoke Test Administrator") fail("The session read did not name the administrator.");
}

/** Fails `count` sign-ins for an email with no account; each must get the one refusal. */
async function failSignIn(base, count) {
  for (let index = 0; index < count; index += 1) {
    const response = await fetch(base + "/api/v1/session/sign-in", {
      method: "POST",
      headers: fromApp(base),
      body: JSON.stringify({ email: UNKNOWN_EMAIL, password: WRONG_PASSWORD }),
      signal: AbortSignal.timeout(SETUP_TIMEOUT_MS),
    });
    const body = await response.json().catch(() => null);
    if (response.status !== 401 || body?.error?.code !== "signin_failed") fail(`A wrong sign-in answered ${response.status}: ${body?.error?.code}`);
  }
}

async function expectWait(base) {
  const response = await fetch(base + "/api/v1/session/sign-in", {
    method: "POST",
    headers: fromApp(base),
    body: JSON.stringify({ email: UNKNOWN_EMAIL, password: WRONG_PASSWORD }),
    signal: AbortSignal.timeout(SETUP_TIMEOUT_MS),
  });
  const body = await response.json().catch(() => null);
  if (response.status !== 429 || body?.error?.code !== "signin_wait" || response.headers.get("retry-after") === null) {
    fail(`After five failures across the restart the sixth sign-in answered ${response.status}: ${body?.error?.code}; the counts did not persist.`);
  }
}

async function signOut(base, cookies) {
  const response = await fetch(base + "/api/v1/session/sign-out", {
    method: "POST",
    headers: fromApp(base, cookies),
    body: "{}",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  const body = await response.json().catch(() => null);
  if (response.status !== 200 || body?.signedIn !== false) fail(`POST /api/v1/session/sign-out answered ${response.status}: ${JSON.stringify(body)}`);
  // Exactly one Set-Cookie, clearing the session cookie (not the marker) with its full attributes.
  const sessionName = Object.keys(cookies).find((name) => !name.startsWith(MARKER_PREFIX));
  const cleared = response.headers.getSetCookie();
  // Cookie names are case-sensitive, so the name is compared exactly; only the attributes are not.
  const [pair, ...rest] = (cleared[0] ?? "").split(";").map((part) => part.trim());
  const attributes = rest.map((attribute) => attribute.toLowerCase());
  const clearing =
    cleared.length === 1 &&
    sessionName !== undefined &&
    pair === `${sessionName}=` &&
    ["max-age=0", "path=/", "secure", "httponly", "samesite=lax"].every((attribute) => attributes.includes(attribute));
  if (!clearing) fail("The sign-out reply did not clear the session cookie alone, with its full attributes.");
}

function get(url, init = {}) {
  return fetch(url, { ...init, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
}

async function readStatus(base) {
  const response = await get(base + "/api/v1/status");
  const body = await response.json();
  if (response.status !== 200 || typeof body?.installation?.createdAt !== "string") {
    fail(`GET /api/v1/status answered ${response.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

async function checkPage(base) {
  const page = await get(base + "/", { headers: { accept: "text/html" } });
  const html = await page.text();
  if (!page.ok || !html.includes('<div id="root">')) fail(`The app page did not load (${page.status}).`);
  if (!page.headers.get("content-type")?.startsWith("text/html")) fail("The app page has no HTML content type.");

  const script = [...html.matchAll(/<script\b[^>]*>/g)]
    .map((match) => match[0])
    .find((tag) => /\btype="module"/.test(tag) && /\bsrc="/.test(tag));
  const src = script?.match(/\bsrc="([^"]+)"/)?.[1];
  if (!src) fail("The app page has no module script.");
  const js = await get(new URL(src, base + "/").href);
  await js.arrayBuffer();
  if (js.status !== 200) fail(`The app script ${src} answered ${js.status}.`);
  if (!js.headers.get("content-type")?.startsWith("text/javascript")) {
    fail(`The app script ${src} has content type ${js.headers.get("content-type")}.`);
  }

  const deep = await get(base + "/some/app/route", { headers: { accept: "text/html" } });
  if (!deep.ok || !(await deep.text()).includes('<div id="root">')) fail("An app route did not fall back to the page.");
  if (page.headers.get("referrer-policy") !== null) fail("The app page carries a Referrer-Policy header; only /invite should.");

  // The invitation page (story 1.4, D-2): served with Referrer-Policy: no-referrer.
  for (const path of ["/invite", "/invite/"]) {
    const invite = await get(base + path, { headers: { accept: "text/html" } });
    if (!invite.ok || !(await invite.text()).includes('<div id="root">')) fail(`GET ${path} did not answer the app page (${invite.status}).`);
    if (invite.headers.get("referrer-policy") !== "no-referrer") {
      fail(`GET ${path} carries Referrer-Policy ${JSON.stringify(invite.headers.get("referrer-policy"))}, not no-referrer.`);
    }
  }
}

async function checkRefusal(base) {
  const response = await get(base + "/api/v1/nope");
  const body = await response.json().catch(() => null);
  if (response.status !== 404 || body?.error?.code !== "not_found" || typeof body.error.message !== "string") {
    fail(`GET /api/v1/nope answered ${response.status}: ${JSON.stringify(body)}`);
  }
}

async function checkNoListing(base) {
  const response = await get(base + "/assets");
  const text = await response.text();
  if (response.ok && !response.headers.get("content-type")?.startsWith("text/html")) {
    fail(`GET /assets answered ${response.status} with ${response.headers.get("content-type")}.`);
  }
  if (/"type"\s*:\s*"(file|directory)"/.test(text)) fail("GET /assets returned a directory listing.");
}

/**
 * workerd's environment: the caller's, without any DEPLOYMENT_KEY it may hold, plus `key` when one
 * is given. With `key` null the binding is unset, so it is `null` in the Worker (D-16, finding 6).
 */
function childEnvironment(key) {
  const env = {};
  for (const [name, value] of Object.entries(process.env)) {
    if (name.toUpperCase() !== "DEPLOYMENT_KEY") env[name] = value;
  }
  return key === null ? env : { ...env, DEPLOYMENT_KEY: key };
}

/**
 * Starts workerd on `storage` with `key` (or none) in its environment, runs `work`, and stops it.
 * Answers `{ value, output }`: what `work` answered and workerd's stdout and stderr together, held
 * in memory and never echoed. On a failure only the event names of its JSON log lines are printed,
 * except that an exit before answering prints its start-up errors (printStartupErrors).
 */
async function withServer({ base, port, storage: directory, key }, work) {
  const child = spawn(
    workerdBinary,
    [
      "serve",
      config,
      "--directory-path",
      `do-storage=${directory}`,
      "--directory-path",
      `assets=${client}`,
      "--socket-addr",
      `http=127.0.0.1:${port}`,
    ],
    { cwd: root, stdio: ["ignore", "pipe", "pipe"], env: childEnvironment(key) },
  );
  // Each stream kept apart, so a chunk of one never lands inside a line of the other.
  let stdout = "";
  let stderr = "";
  const output = () => `${stdout}\n${stderr}`;
  child.stdout.setEncoding("utf8").on("data", (chunk) => (stdout += chunk));
  child.stderr.setEncoding("utf8").on("data", (chunk) => (stderr += chunk));
  let exited = false;
  /** How workerd ended (its exit code or signal), for a failure message; never its output. */
  let ending = "";
  const exit = new Promise((resolve) => {
    // `close` comes after the output streams have ended, so the output is complete.
    child.once("close", (code, signal) => {
      exited = true;
      ending = signal ? `signal ${signal}` : `exit code ${code}`;
      resolve(code);
    });
    child.once("error", (error) => {
      exited = true;
      ending = `start error ${error?.code ?? "unknown"}`;
      resolve(null);
    });
  });
  let failure = null;
  try {
    await waitUntilAnswering(base, () => (exited ? ending : null));
    const value = await work();
    return { value, get output() { return output(); } };
  } catch (error) {
    failure = error;
    throw error;
  } finally {
    if (!exited) child.kill("SIGTERM");
    await Promise.race([exit, delay(5000).then(() => { if (!exited) child.kill("SIGKILL"); })]);
    await exit;
    if (failure instanceof EarlyExit) printStartupErrors(stderr);
    else if (failure) {
      const events = eventNames(output());
      console.error(`workerd's log events: ${events.length > 0 ? events.join(", ") : "none"}`);
    }
  }
}

/**
 * workerd's stderr when it exited before answering: written before any request was handled, so it
 * holds no code, cookie or token. A line holding the set-up code or a key is withheld all the same,
 * in case an error quotes the temporary configuration.
 */
function printStartupErrors(stderr) {
  const lines = stderr.split(/\r?\n/).filter((line) => line.trim() !== "");
  const secrets = [setupCode, KEY_A, KEY_B];
  const shown = lines.filter((line) => !secrets.some((secret) => line.includes(secret)));
  const withheld = lines.length - shown.length;
  console.error(`workerd's start-up errors (${shown.length} ${shown.length === 1 ? "line" : "lines"}${withheld > 0 ? `, ${withheld} withheld` : ""}):`);
  for (const line of shown) console.error(`  ${line}`);
}

/** `exitedHow` answers null while workerd runs, then how it ended. */
async function waitUntilAnswering(base, exitedHow) {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    const ended = exitedHow();
    if (ended !== null) throw new EarlyExit(`workerd exited before it answered (${ended}).`);
    try {
      const response = await get(base + "/api/v1/status");
      await response.arrayBuffer();
      return;
    } catch {
      await delay(100);
    }
  }
  fail("workerd did not answer within 20 seconds.");
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port: chosen } = server.address();
      server.close(() => resolve(chosen));
    });
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fail(message) {
  throw new SmokeFailure(message);
}
