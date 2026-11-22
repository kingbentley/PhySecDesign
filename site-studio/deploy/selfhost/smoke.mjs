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
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
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

class SmokeFailure extends Error {}

let storage = null;
try {
  for (const file of [bundle, path.join(client, "index.html")]) {
    if (!existsSync(file)) fail(`Missing ${path.relative(root, file)}. Run npm run build first.`);
  }
  storage = mkdtempSync(path.join(tmpdir(), "site-studio-smoke-"));
  writeSmokeConfig();
  const port = await freePort();
  const base = `http://127.0.0.1:${port}`;

  const first = await withServer(base, port, async () => {
    const status = await readStatus(base);
    if (status.release !== version) fail(`The release is ${status.release}, not package.json's ${version}.`);
    await checkPage(base);
    await checkRefusal(base);
    await checkNoListing(base);
    await completeSetup(base);
    const cookies = await signIn(base);
    await expectSession(base, cookies, true);
    await failSignIn(base, 1);
    return { status, cookies };
  });
  console.log(`first start: release ${first.status.release}, createdAt ${first.status.installation.createdAt}, set-up completed, signed in`);

  const second = await withServer(base, port, async () => {
    const status = await readStatus(base);
    const state = await readSetupState(base);
    if (state !== "closed") fail(`After the restart set-up is ${state}, not closed: the administrator did not persist.`);
    // The same cookie is still signed in: the identifier and the session survived (V-11).
    await expectSession(base, first.cookies, true);
    // One failure before the restart and four after reach the wait (V-17).
    await failSignIn(base, 4);
    await expectWait(base);
    await signOut(base, first.cookies);
    await expectSession(base, first.cookies, false);
    return status;
  });
  console.log(`after restart: createdAt ${second.installation.createdAt}, set-up closed, still signed in, counts kept, signed out`);

  const probe = await verifyFixtureUnderWorkerd();
  console.log(`password probe under workerd: fixture ${probe.fixture ? "verified" : "refused"}, wrong password ${probe.wrongPassword ? "verified" : "refused"}`);

  const createdAt = first.status.installation.createdAt;
  const dataFormat = first.status.installation.dataFormat;

  if (second.installation.createdAt !== createdAt) {
    fail("The installation's createdAt changed across the restart: storage did not persist.");
  }
  if (second.installation.dataFormat !== dataFormat) fail("The data format changed across the restart.");
  console.log("Self-hosted smoke test passed: the value saved on first start was read back after a restart.");
} catch (error) {
  console.error(`Self-hosted smoke test failed: ${error instanceof SmokeFailure ? error.message : error?.stack ?? error}`);
  process.exitCode = 1;
} finally {
  if (storage) rmSync(storage, { recursive: true, force: true });
  rmSync(config, { force: true });
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

async function withServer(base, port, work) {
  const child = spawn(
    workerdBinary,
    [
      "serve",
      config,
      "--directory-path",
      `do-storage=${storage}`,
      "--directory-path",
      `assets=${client}`,
      "--socket-addr",
      `http=127.0.0.1:${port}`,
    ],
    { cwd: root, stdio: ["ignore", "inherit", "inherit"] },
  );
  let exited = false;
  const exit = new Promise((resolve) => {
    child.once("exit", (code) => {
      exited = true;
      resolve(code);
    });
    child.once("error", () => {
      exited = true;
      resolve(null);
    });
  });
  try {
    await waitUntilAnswering(base, () => exited);
    return await work();
  } finally {
    if (!exited) child.kill("SIGTERM");
    await Promise.race([exit, delay(5000).then(() => { if (!exited) child.kill("SIGKILL"); })]);
    await exit;
  }
}

async function waitUntilAnswering(base, hasExited) {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if (hasExited()) fail("workerd exited before it answered.");
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
