#!/usr/bin/env node
// Runs the password probe under workerd, the self-hosted runtime (story 1.3, D-6, A-22, V-3).
//
//   node deploy/probe/probe.mjs verify   checks the committed fixture and a wrong password
//   node deploy/probe/probe.mjs make     prints a new fixture hash (used once, to make the fixture)
//
// It first checks that the probe's compatibility date and flags equal the app's, then builds the
// probe with Wrangler (`wrangler deploy --dry-run --outdir`, which uploads nothing) into a temporary
// folder, serves it with workerd on a free local port, calls it and stops it. The self-hosted smoke
// test runs `verify` through `runProbe`. Nothing here is part of the app's build.
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as workerd from "workerd";

const workerdBinary = typeof workerd.default === "string" ? workerd.default : workerd.default.default;
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const wranglerBin = path.join(root, "node_modules", "wrangler", "bin", "wrangler.js");
// One scrypt hash (128 MiB) can take a few seconds on a slow runner.
const CALL_TIMEOUT_MS = 30_000;

export class ProbeFailure extends Error {}

/** The compatibility date and flags of a wrangler.jsonc, read without a JSONC parser. */
function compatibilityOf(file) {
  const text = readFileSync(file, "utf8");
  const date = text.match(/"compatibility_date"\s*:\s*"([^"]+)"/)?.[1];
  const flags = text.match(/"compatibility_flags"\s*:\s*\[([^\]]*)\]/)?.[1];
  if (!date || flags === undefined) throw new ProbeFailure(`${path.relative(root, file)} has no compatibility date or flags.`);
  return { date, flags: [...flags.matchAll(/"([^"]+)"/g)].map((match) => match[1]).sort() };
}

/** Checks that the probe uses the app's compatibility date and flags, and answers them. */
export function checkCompatibility() {
  const app = compatibilityOf(path.join(root, "deploy", "cloudflare", "wrangler.jsonc"));
  const probe = compatibilityOf(path.join(here, "wrangler.jsonc"));
  if (app.date !== probe.date || app.flags.join() !== probe.flags.join()) {
    throw new ProbeFailure(
      `The probe's compatibility (${probe.date}, ${probe.flags.join(" ")}) differs from the app's (${app.date}, ${app.flags.join(" ")}).`,
    );
  }
  return app;
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: ["ignore", "pipe", "pipe"], ...options });
    let output = "";
    child.stdout.on("data", (chunk) => (output += chunk));
    child.stderr.on("data", (chunk) => (output += chunk));
    child.once("error", reject);
    child.once("exit", (code) => (code === 0 ? resolve(output) : reject(new ProbeFailure(`${path.basename(args[0] ?? command)} exited with ${code}:\n${output}`))));
  });
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Builds the probe, serves it under workerd and answers the JSON of `GET /<mode>`. */
export async function runProbe(mode) {
  if (mode !== "make" && mode !== "verify") throw new ProbeFailure(`Unknown probe mode ${mode}.`);
  const compatibility = checkCompatibility();
  const out = mkdtempSync(path.join(tmpdir(), "site-studio-probe-"));
  let child = null;
  try {
    await run(process.execPath, [wranglerBin, "deploy", "--dry-run", "--outdir", out, "--config", path.join(here, "wrangler.jsonc")], {
      env: { ...process.env, WRANGLER_SEND_METRICS: "false" },
    });
    const port = await freePort();
    const config = path.join(out, "probe.capnp");
    writeFileSync(
      config,
      [
        'using Workerd = import "/workerd/workerd.capnp";',
        "const config :Workerd.Config = (",
        '  services = [(name = "main", worker = .probe)],',
        `  sockets = [(name = "http", address = "127.0.0.1:${port}", http = (), service = "main")],`,
        ");",
        "const probe :Workerd.Worker = (",
        '  modules = [(name = "index.js", esModule = embed "index.js")],',
        `  compatibilityDate = "${compatibility.date}",`,
        `  compatibilityFlags = [${compatibility.flags.map((flag) => `"${flag}"`).join(", ")}],`,
        ");",
        "",
      ].join("\n"),
    );
    child = spawn(workerdBinary, ["serve", config], { cwd: out, stdio: ["ignore", "inherit", "inherit"] });
    let exited = false;
    child.once("exit", () => (exited = true));
    child.once("error", () => (exited = true));

    const base = `http://127.0.0.1:${port}`;
    const deadline = Date.now() + 20_000;
    for (;;) {
      if (exited) throw new ProbeFailure("workerd exited before the probe answered.");
      try {
        const ready = await fetch(base + "/ready", { signal: AbortSignal.timeout(1000) });
        await ready.arrayBuffer();
        break;
      } catch {
        if (Date.now() > deadline) throw new ProbeFailure("The probe did not answer within 20 seconds.");
        await delay(100);
      }
    }
    const response = await fetch(`${base}/${mode}`, { signal: AbortSignal.timeout(CALL_TIMEOUT_MS) });
    const body = await response.json().catch(() => null);
    if (!response.ok || body === null) throw new ProbeFailure(`GET /${mode} answered ${response.status}: ${JSON.stringify(body)}`);
    return body;
  } finally {
    if (child && child.exitCode === null) {
      const exit = new Promise((resolve) => child.once("exit", resolve));
      child.kill("SIGTERM");
      await Promise.race([exit, delay(5000).then(() => child.kill("SIGKILL"))]);
    }
    rmSync(out, { recursive: true, force: true });
  }
}

/** Verifies the committed fixture under workerd: the right password verifies, a wrong one fails. */
export async function verifyFixtureUnderWorkerd() {
  const result = await runProbe("verify");
  if (result.fixture !== true) throw new ProbeFailure("Under workerd the committed password fixture did not verify.");
  if (result.wrongPassword !== false) throw new ProbeFailure("Under workerd a wrong password verified against the fixture.");
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2] ?? "verify";
  try {
    const result = mode === "verify" ? await verifyFixtureUnderWorkerd() : await runProbe(mode);
    console.log(JSON.stringify({ ...result, workerd: workerd.version ?? null }, null, 2));
  } catch (error) {
    console.error(`Password probe failed: ${error instanceof ProbeFailure ? error.message : error?.stack ?? error}`);
    process.exitCode = 1;
  }
}
