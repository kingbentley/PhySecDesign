#!/usr/bin/env node
// The Cloudflare deploy command (story 1.2, CAP-1; run by `npm run deploy:cloudflare` after the
// build). It deploys the built Worker, then asks the installation's public set-up state route
// whether set-up is open (CA-52):
// - open: it generates a random set-up code, supplies it to the Worker as the secret SETUP_CODE
//   and prints it once (CA-01). A new code makes the earlier one stop working and resets the
//   wrong-code counts (CA-02, CA-45).
// - closed: it prints no code and supplies none, so set-up stays closed.
//
// Deploy first, then ask: on a first deploy there is no address to ask until Wrangler reports it.
// `wrangler secret put` deploys a new version with the secret at once; until then the new code
// runs with the earlier code (or none, which refuses set-up), which is harmless.
//
// The code goes to Wrangler only on its standard input. It is never written to a file or logged,
// and it is printed once, on this command's own output.
//
// Options: --url <https address> asks that address instead of the first one Wrangler reports
// (for a custom domain). --name <worker> deploys under that Worker name instead of the one in the
// configuration (for a test installation); the secret goes to whatever name Wrangler reports.
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** 32 symbols with no 0/O or 1/I look-alikes; 32 divides 256, so `byte & 31` has no bias. */
export const SETUP_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
/** 24 symbols of 5 bits each: 120 bits, above the 20 characters CA-01 requires. */
export const SETUP_CODE_LENGTH = 24;
export const SETUP_CODE_SECRET = "SETUP_CODE";
export const SETUP_STATE_PATH = "/api/v1/setup/state";
/** How long to keep asking a newly deployed Worker before giving up. */
export const STATE_TIMEOUT_MS = 120_000;
export const STATE_RETRY_MS = 3_000;
/** How long one request to the state route may take. */
export const STATE_REQUEST_TIMEOUT_MS = 10_000;

/** A set-up code from a cryptographic random source. */
export function generateSetupCode(random = randomBytes) {
  const bytes = random(SETUP_CODE_LENGTH);
  let code = "";
  for (const byte of bytes) code += SETUP_CODE_ALPHABET[byte & 31];
  return code;
}

/** The state from a set-up state reply, or null unless the reply is exactly `{ state: "open" | "closed" }`. */
export function parseSetupState(body) {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return null;
  const keys = Object.keys(body);
  if (keys.length !== 1 || keys[0] !== "state") return null;
  return body.state === "open" || body.state === "closed" ? body.state : null;
}

/** The address to ask: the --url option, else the first HTTPS address Wrangler deployed to. */
export function chooseAddress(targets, override) {
  const candidate = override ?? (targets ?? []).find((target) => typeof target === "string" && target.startsWith("https://"));
  if (!candidate) return null;
  let url;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }
  return url.protocol === "https:" ? url.origin : null;
}

/** Reads Wrangler's output file (one JSON object per line) for the deploy entry. */
export function readDeployOutput(text) {
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    if (entry?.type === "deploy") return { workerName: entry.worker_name ?? null, targets: entry.targets ?? [] };
  }
  return null;
}

/**
 * Asks the state route until it answers `open` or `closed`, or the time runs out. A Worker that
 * was just deployed for the first time can take a while to become reachable.
 */
export async function waitForSetupState(address, { fetchImpl = fetch, sleep = delay, timeoutMs = STATE_TIMEOUT_MS, retryMs = STATE_RETRY_MS, now = Date.now } = {}) {
  const deadline = now() + timeoutMs;
  for (;;) {
    try {
      const response = await fetchImpl(address + SETUP_STATE_PATH, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(STATE_REQUEST_TIMEOUT_MS),
      });
      if (response.status === 200) {
        const state = parseSetupState(await response.json());
        if (state) return state;
      } else {
        await response.body?.cancel();
      }
    } catch {
      // Not reachable yet.
    }
    if (now() >= deadline) return null;
    await sleep(retryMs);
  }
}

/**
 * The whole command, with every outside effect passed in so that it can be tested:
 * `deploy()` resolves to `{ workerName, targets }`; `askState(address)` to "open", "closed" or
 * null; `putSecret(workerName, name, value)` supplies a secret; `print` writes a line.
 * Resolves to the exit code.
 */
export async function runDeploy({ deploy, askState, putSecret, print, printError, generate = generateSetupCode, url }) {
  const deployed = await deploy();
  const address = chooseAddress(deployed?.targets, url);
  if (!address) {
    printError("The deployment reported no https:// address. Run again with --url <https address>.");
    return 1;
  }
  const state = await askState(address);
  if (state === null) {
    printError(`${address}${SETUP_STATE_PATH} did not say whether set-up is open. No set-up code was issued. Run the command again.`);
    return 1;
  }
  if (state === "closed") {
    print(`Deployed to ${address}. Set-up is already complete, so no set-up code was issued.`);
    return 0;
  }
  if (!deployed?.workerName) {
    printError("The deployment did not report the Worker's name, so no set-up code was issued.");
    return 1;
  }
  const code = generate();
  await putSecret(deployed.workerName, SETUP_CODE_SECRET, code);
  print(`Deployed to ${address}. Set-up is open.`);
  print("");
  print(`  Set-up code: ${code}`);
  print("");
  print(`Open ${address} and enter this code to create the first administrator. It is shown only`);
  print("this once. Deploying again before set-up is complete issues a new code and the old one stops working.");
  return 0;
}

/**
 * Reads the command's options. Resolves to `{ url, name }` (each undefined when not given), or to
 * `{ error }` when an option is given without a value or an option is unknown.
 */
export function parseDeployArgs(argv) {
  const options = { url: undefined, name: undefined };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    const key = flag === "--url" ? "url" : flag === "--name" ? "name" : null;
    if (!key) return { error: `Unknown option ${flag}. Use --url <https address> or --name <worker>.` };
    const value = argv[index + 1];
    if (value === undefined || value.startsWith("--") || value.trim() === "") return { error: `${flag} needs a value.` };
    options[key] = value;
    index += 1;
  }
  return options;
}

/** Wrangler's deploy arguments, with the Worker name when one was given. */
export function wranglerDeployArgs(name) {
  return name === undefined ? ["deploy"] : ["deploy", "--name", name];
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runWrangler(root, args, { env = process.env, input } = {}) {
  const binary = path.join(root, "node_modules", ".bin", process.platform === "win32" ? "wrangler.cmd" : "wrangler");
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, {
      cwd: root,
      env,
      stdio: [input === undefined ? "inherit" : "pipe", "inherit", "inherit"],
      shell: process.platform === "win32",
    });
    child.once("error", reject);
    child.once("exit", (code) => (code === 0 ? resolve() : reject(new Error(`wrangler ${args[0]} exited with ${code}.`))));
    if (input !== undefined) child.stdin.end(input);
  });
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const options = parseDeployArgs(process.argv.slice(2));
  if (options.error) {
    console.error(options.error);
    process.exitCode = 1;
    return;
  }
  const { url, name } = options;
  const outputDir = mkdtempSync(path.join(tmpdir(), "site-survey-deploy-"));
  try {
    process.exitCode = await runDeploy({
      url,
      deploy: async () => {
        const outputFile = path.join(outputDir, "wrangler-output.json");
        await runWrangler(root, wranglerDeployArgs(name), { env: { ...process.env, WRANGLER_OUTPUT_FILE_PATH: outputFile } });
        return readDeployOutput(readFileSync(outputFile, "utf8"));
      },
      askState: (address) => waitForSetupState(address),
      putSecret: (workerName, name, value) => runWrangler(root, ["secret", "put", name, "--name", workerName], { input: value }),
      print: (line) => console.log(line),
      printError: (line) => console.error(line),
    });
  } catch (error) {
    console.error(`Deploy failed: ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  } finally {
    rmSync(outputDir, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
