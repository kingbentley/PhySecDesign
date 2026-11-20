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
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as workerd from "workerd";

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
    return status;
  });
  console.log(`first start: release ${first.release}, createdAt ${first.installation.createdAt}, set-up completed`);

  const second = await withServer(base, port, async () => {
    const status = await readStatus(base);
    const state = await readSetupState(base);
    if (state !== "closed") fail(`After the restart set-up is ${state}, not closed: the administrator did not persist.`);
    return status;
  });
  console.log(`after restart: createdAt ${second.installation.createdAt}, set-up closed`);

  if (second.installation.createdAt !== first.installation.createdAt) {
    fail("The installation's createdAt changed across the restart: storage did not persist.");
  }
  if (second.installation.dataFormat !== first.installation.dataFormat) fail("The data format changed across the restart.");
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
      email: "smoke-admin@example.test",
      password: randomBytes(12).toString("hex"),
    }),
    signal: AbortSignal.timeout(SETUP_TIMEOUT_MS),
  });
  const body = await response.json().catch(() => null);
  if (response.status !== 200 || body?.installationName !== "Smoke Test Installation" || body?.email !== "smoke-admin@example.test") {
    // The reply never holds the code or the password, so it is safe to print.
    fail(`POST /api/v1/setup answered ${response.status}: ${JSON.stringify(body)}`);
  }
  if ((await readSetupState(base)) !== "closed") fail("Set-up is still open after it completed.");
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
