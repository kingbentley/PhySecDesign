#!/usr/bin/env node
// The Cloudflare deploy command (story 1.2, CAP-1, and story 1.5, CAP-11; run by
// `npm run deploy:cloudflare` after the build). Every run first says to run one deploy at a time
// for a Worker (two at once can each generate a deployment key).
//
// The deployment key (story 1.5, D-17, D-18): an operator's key may be supplied in the
// SITE_SURVEY_DEPLOYMENT_KEY environment variable; it is checked for its form (43 base64url
// characters, 32 bytes) before anything is deployed. After the deploy the command checks that
// Wrangler reported the Worker's name and lists the Worker's secrets:
// - DEPLOYMENT_KEY in the list: it is never replaced or deleted. With no key supplied the command
//   says it kept the Worker's key. With a key supplied (not used) it asks the public key-state
//   route once it answers: nothing stored goes on; a stored fingerprint waits for a settled answer
//   (below) on whether the Worker's key matches it: a match goes on; a mismatch changes nothing
//   and exits 1 with the manual delete command; no settled answer in time exits 1.
// - not in the list: it asks the key-state route whether the installation holds encrypted values
//   (a stored fingerprint).
//   - nothing stored: a supplied key is put; otherwise a key of 32 random bytes is generated,
//     printed once with the instruction to keep a copy, and only then put. A failed put says the
//     printed key may or may not have been stored.
//   - a fingerprint stored: only a supplied key is put (the operator's claim that it is the
//     original), then the command waits for a settled answer on whether it matches. A match goes
//     on; a mismatch deletes the key this run put (the only key the command ever deletes), so that
//     a rerun with the original finds none; no settled answer in time leaves it and exits 1. With
//     no key supplied the command stops and generates nothing.
//   A failed put of a supplied key says it may or may not have been stored, and exits 1.
// A settled answer: for some time after a deploy or a secret put, copies of the Worker still on
// the earlier version answer too, so a match or mismatch counts only when every readable reply
// over a continuous 60 seconds (at least 21 replies) gives the same one, within 180 seconds; any
// other reply restarts the 60 seconds. The command says first that this takes at least a minute.
// A listing that fails, or a key state that cannot be read, stops the command with nothing
// generated or put. The key goes to Wrangler only on its standard input, a supplied key is never
// printed, and SITE_SURVEY_DEPLOYMENT_KEY is removed from the environment of every Wrangler child.
// The Worker passes the key to the installation object on each call (D-22), so nothing waits for
// objects to restart.
//
// Then the set-up code: it asks the installation's public set-up state route whether set-up is
// open (CA-52):
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
// and it is printed once, on this command's own output. The printed order is the one-deploy-at-a-
// time line, Wrangler's deploy output, the key lines, then the set-up lines.
//
// Options: --url <https address> (for a custom domain) asks that address. Without it the command
// asks only the workers.dev address Wrangler reports (review round 4). Its host must be one Wrangler reported for this deploy (an https target,
// a custom domain or a route pattern without a wildcard, compared exactly without regard to case);
// otherwise the command stops after the deploy with nothing listed, put or deleted and no set-up
// code (pull request 13, review round 1). --name <worker> deploys under that Worker name instead of the one in the
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

/**
 * For a minute or so after a deploy, some copies of the Worker still run with the earlier code
 * and set-up answers that a new code was issued (D-7), so the command says to wait.
 */
export const SETTLE_NOTICE = "Wait about a minute before using it: until every copy of the Worker has the new code, set-up answers that a new code was issued.";

/** The Worker secret that holds the deployment key (story 1.5, D-14). */
export const DEPLOYMENT_KEY_SECRET = "DEPLOYMENT_KEY";
/** The environment variable an operator supplies a key in (D-17). */
export const DEPLOYMENT_KEY_ENV = "SITE_SURVEY_DEPLOYMENT_KEY";
export const DEPLOYMENT_KEY_BYTES = 32;
export const DEPLOYMENT_KEY_STATE_PATH = "/api/v1/deployment-key/state";
const DEPLOYMENT_KEY_PATTERN = /^[A-Za-z0-9_-]{43}$/;

/** The deploy command's key lines, word for word from story 1.5's `wording.md` (D-21). */
export const KEY_LINES = Object.freeze({
  oneAtATime: "Run one deploy at a time for a Worker: two at once can each generate a deployment key, and the one printed may not be the one kept.",
  generated: (key) => `  Deployment key: ${key}`,
  keepCopy: "This key protects the two-step verification secrets this installation stores. It is shown only this once. Keep a copy outside the Cloudflare account, for example in your organisation's password manager. To deploy this installation to a new Worker, or to recover it, supply the key in the SITE_SURVEY_DEPLOYMENT_KEY environment variable.",
  kept: "The Worker already has a deployment key, so none was generated.",
  supplied: "The deployment key from SITE_SURVEY_DEPLOYMENT_KEY was supplied to the Worker. No key was generated.",
  notUsed: "The Worker already has a deployment key; the key in SITE_SURVEY_DEPLOYMENT_KEY was not used.",
  malformed: "SITE_SURVEY_DEPLOYMENT_KEY does not hold a deployment key: it must be 43 letters, digits, - or _. Nothing was deployed.",
  encryptedNoKey: "This installation already holds secrets saved with a deployment key, but the Worker has none. Supply the original key in SITE_SURVEY_DEPLOYMENT_KEY and run the command again. No key was generated.",
  listingFailed: "The Worker's secrets could not be listed, so no deployment key was generated or supplied. Run the command again.",
  putFailed: "The key above may or may not have been stored. Keep it, and run the command again with it in SITE_SURVEY_DEPLOYMENT_KEY.",
  stateUnreadable: (address) => `${address}${DEPLOYMENT_KEY_STATE_PATH} did not say whether this installation holds encrypted values, so no deployment key was generated or supplied. Run the command again.`,
  notOriginal: "The key in SITE_SURVEY_DEPLOYMENT_KEY is not the one this installation's secrets were saved with, so it was removed from the Worker again. Supply the original key and run the command again.",
  notRemoved: (worker) => `The key in SITE_SURVEY_DEPLOYMENT_KEY is not the one this installation's secrets were saved with, and it could not be removed from the Worker again. Remove it with \`wrangler secret delete DEPLOYMENT_KEY --name ${worker}\`, then run this command again with the original key in SITE_SURVEY_DEPLOYMENT_KEY.`,
  notConfirmed: "The Worker did not say whether the key in SITE_SURVEY_DEPLOYMENT_KEY matches the secrets this installation holds. Run the command again with the same key.",
  workerKeyNotOriginal: (worker) => `The Worker already has a deployment key, and it is not the one this installation's secrets were saved with. Nothing was changed. If you have the original key, remove the Worker's key with \`wrangler secret delete DEPLOYMENT_KEY --name ${worker}\`, then run this command again with the original in SITE_SURVEY_DEPLOYMENT_KEY.`,
  workerKeyNotConfirmed: "The Worker did not say whether its deployment key matches the secrets this installation holds. Nothing was changed. Run the command again.",
  suppliedPutFailed: "The key from SITE_SURVEY_DEPLOYMENT_KEY may or may not have been stored. Run the command again with the same key.",
  checking: "Checking the deployment key with this installation. This takes at least a minute.",
  urlNotReported: (address, worker) => `${address} is not an address Wrangler reported for the Worker ${worker}, so no deployment key was checked, generated or supplied. Run again with one of the Worker's own addresses in --url.`,
});

/** A host name: dot-separated labels of letters, digits and hyphens, no wildcard. */
const HOST_PATTERN = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;

/**
 * The hosts Wrangler reported for this deploy, lower-cased (pull request 13, review round 1;
 * orchestrator ruling of 2026-11-24): an `https://` target's host, a custom domain's host
 * (`app.example.com (custom domain…)`) and a route pattern's host (`app.example.com/* (zone …)`).
 * A pattern whose host holds a wildcard gives none, and so do the other targets (schedules,
 * queues, "…and N more routes").
 */
export function reportedHosts(targets) {
  const hosts = new Set();
  for (const target of targets ?? []) {
    if (typeof target !== "string") continue;
    let host;
    if (target.startsWith("https://")) {
      if (!isWholeHostTarget(target)) continue;
      host = new URL(target.trim().split(/\s/, 1)[0]).hostname;
    } else {
      // A custom domain is a bare host; a route counts only when it covers the whole host
      // (`host/*`), since the key-state route sits at the origin's root and a route limited to a
      // path (`host/survey/*`) leaves the rest of the host to something else (review layer, round 1).
      const pattern = target.trim().split(/\s/, 1)[0];
      const slash = pattern.indexOf("/");
      if (slash !== -1 && pattern.slice(slash) !== "/*") continue;
      host = slash === -1 ? pattern : pattern.slice(0, slash);
    }
    host = host.toLowerCase();
    // Refused, safely, as unreported: a wildcard, a trailing dot, a host written in Unicode (the
    // `--url` side is punycode), and routes Wrangler elides after its first nine.
    if (HOST_PATTERN.test(host)) hosts.add(host);
  }
  return hosts;
}

/**
 * Whether an `https://` target names the whole of its host: the workers.dev address as Wrangler
 * prints it (no path at all), or a route written with its scheme that covers the whole host (`/*`).
 * A route limited to a path, or to `/` alone, does not reach the key-state route (pull request 13,
 * review round 2). Anything after the pattern (a zone suffix) is ignored.
 */
export function isWholeHostTarget(target) {
  if (typeof target !== "string" || !target.startsWith("https://")) return false;
  const pattern = target.trim().split(/\s/, 1)[0];
  const rest = pattern.slice("https://".length);
  const slash = rest.search(/[/?#]/);
  if (slash !== -1 && rest.slice(slash) !== "/*") return false;
  try {
    return HOST_PATTERN.test(new URL(pattern).hostname.toLowerCase());
  } catch {
    return false;
  }
}

/**
 * Whether the address as the operator wrote it names a port, including the default `:443`, which
 * the URL parser drops (pull request 13, review round 2): the port is read from the raw authority.
 * The spellings the URL parser accepts for `https` are covered: leading control characters and
 * spaces, and any run of `/` or `\` (none included) after the scheme.
 */
export function hasExplicitPort(raw) {
  const match = /^[a-z][a-z0-9+.-]*:[/\\]*([^/\\?#]*)/i.exec(String(raw ?? "").replace(/^[\u0000- ]+/, ""));
  if (!match) return false;
  const hostPort = match[1].slice(match[1].lastIndexOf("@") + 1);
  const port = hostPort.startsWith("[") ? hostPort.slice(hostPort.indexOf("]") + 1) : hostPort.slice(hostPort.indexOf(":") === -1 ? hostPort.length : hostPort.indexOf(":"));
  return port.startsWith(":");
}

/** Whether `address` (an `https://` origin) has a host Wrangler reported, compared exactly. */
export function isReportedAddress(address, targets) {
  let url;
  try {
    url = new URL(address);
  } catch {
    return false;
  }
  // An explicit port is not one Wrangler reported (its targets carry none), so it is refused.
  if (url.port !== "") return false;
  return reportedHosts(targets).has(url.hostname.toLowerCase());
}

/** How long the same `matches` or `mismatch` must come on every readable reply to count. */
export const KEY_SETTLE_MS = 60_000;
/** How long to wait for a settled answer before it is "not confirmed". */
export const KEY_SETTLE_TIMEOUT_MS = 180_000;
/**
 * The fewest replies in a settled run: one every STATE_RETRY_MS (3 seconds) over KEY_SETTLE_MS
 * (60 seconds), counting both ends, is 60 / 3 + 1 = 21. Slow requests that leave fewer replies in
 * the 60 seconds do not settle, so one reply followed by silence never counts.
 */
export const KEY_SETTLE_MIN_REPLIES = KEY_SETTLE_MS / STATE_RETRY_MS + 1;

/** A deployment key: 32 bytes from a cryptographic random source, base64url without padding. */
export function generateDeploymentKey(random = randomBytes) {
  return Buffer.from(random(DEPLOYMENT_KEY_BYTES)).toString("base64url");
}

/**
 * Whether a supplied value is a deployment key: 43 base64url characters that decode to 32 bytes
 * and encode back to the same text (as the server's `parseDeploymentKey` checks).
 */
export function isDeploymentKey(value) {
  if (typeof value !== "string" || !DEPLOYMENT_KEY_PATTERN.test(value)) return false;
  const bytes = Buffer.from(value, "base64url");
  return bytes.length === DEPLOYMENT_KEY_BYTES && bytes.toString("base64url") === value;
}

const KEY_STATE_FINGERPRINTS = new Set(["none", "stored"]);
const KEY_STATE_KEYS = new Set(["none", "present", "matches", "mismatch"]);

/**
 * The state from a key-state reply, or null unless the reply is exactly
 * `{ fingerprint: "none" | "stored", key: "none" | "present" | "matches" | "mismatch" }`.
 */
export function parseKeyState(body) {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return null;
  const keys = Object.keys(body).sort();
  if (keys.length !== 2 || keys[0] !== "fingerprint" || keys[1] !== "key") return null;
  if (!KEY_STATE_FINGERPRINTS.has(body.fingerprint) || !KEY_STATE_KEYS.has(body.key)) return null;
  return { fingerprint: body.fingerprint, key: body.key };
}

/**
 * The secret names from `wrangler secret list --format json` output: the first text from a `[`
 * that parses as a JSON array (so a `[WARNING]` line before it is skipped). Null when there is no
 * such array or an entry is not an object with a string `name`.
 */
export function parseSecretList(text) {
  if (typeof text !== "string") return null;
  for (let start = text.indexOf("["); start !== -1; start = text.indexOf("[", start + 1)) {
    for (let end = text.indexOf("]", start); end !== -1; end = text.indexOf("]", end + 1)) {
      let parsed;
      try {
        parsed = JSON.parse(text.slice(start, end + 1));
      } catch {
        continue;
      }
      if (!Array.isArray(parsed)) continue;
      const names = [];
      for (const entry of parsed) {
        if (typeof entry !== "object" || entry === null || Array.isArray(entry) || typeof entry.name !== "string") return null;
        names.push(entry.name);
      }
      return names;
    }
  }
  return null;
}

/**
 * A copy of an environment without SITE_SURVEY_DEPLOYMENT_KEY, matched without regard to case
 * (Windows environment names are case-insensitive), for every Wrangler child.
 */
export function childEnvironment(env) {
  const copy = {};
  for (const [name, value] of Object.entries(env ?? {})) {
    if (name.toUpperCase() !== DEPLOYMENT_KEY_ENV) copy[name] = value;
  }
  return copy;
}

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

/**
 * Whether an `https://` target names the whole of a workers.dev host (its parsed host, lower-cased,
 * ends in `.workers.dev`): the only kind of target the command reads without --url.
 */
export function isWorkersDevTarget(target) {
  if (!isWholeHostTarget(target)) return false;
  return new URL(target.trim().split(/\s/, 1)[0]).hostname.toLowerCase().endsWith(".workers.dev");
}

/** The address to ask: the --url option, else the workers.dev address Wrangler deployed to. */
export function chooseAddress(targets, override) {
  // Without --url, the first https target that names the whole of a workers.dev host (review
  // rounds 2 and 4): a route limited to a path would hand the key-state read to whatever serves the
  // rest of the host, and a custom domain or a `host/*` route is used only when the operator names
  // it in --url, so the default cannot widen if Wrangler's output changes (orchestrator ruling of
  // 2026-11-25).
  const candidate = override ?? (targets ?? []).find((target) => isWorkersDevTarget(target));
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
        // A redirect could hand the answer to another installation: it counts as no answer.
        redirect: "error",
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

/** Whether a key-state reply decides a key against the stored fingerprint: it matches or not. */
export function keyConfirmed(reply) {
  return reply?.fingerprint === "stored" && (reply.key === "matches" || reply.key === "mismatch");
}

/**
 * One request to the key-state route: the exact key state of a 200 reply, else null. Redirects are
 * refused (`redirect: "error"`) and so count as an unreadable reply: a redirect could hand the
 * question to another Worker, whose `mismatch` would decide this Worker's key (pull request 13,
 * review round 2; orchestrator ruling of 2026-11-24).
 */
async function fetchKeyState(address, fetchImpl) {
  try {
    const response = await fetchImpl(address + DEPLOYMENT_KEY_STATE_PATH, {
      headers: { accept: "application/json" },
      redirect: "error",
      signal: AbortSignal.timeout(STATE_REQUEST_TIMEOUT_MS),
    });
    if (response.status === 200) return parseKeyState(await response.json());
    await response.body?.cancel();
  } catch {
    // Not reachable yet.
  }
  return null;
}

/**
 * Asks the key-state route, as `waitForSetupState` asks the set-up state route, until it answers
 * an exact key state, or the time runs out (null).
 */
export async function waitForKeyState(address, { fetchImpl = fetch, sleep = delay, timeoutMs = STATE_TIMEOUT_MS, retryMs = STATE_RETRY_MS, now = Date.now } = {}) {
  const deadline = now() + timeoutMs;
  for (;;) {
    const state = await fetchKeyState(address, fetchImpl);
    if (state) return state;
    if (now() >= deadline) return null;
    await sleep(retryMs);
  }
}

/**
 * Asks the key-state route until it gives a settled answer: `{ fingerprint: "stored", key }` with
 * `key` "matches" or "mismatch", once the same one has come on every reply for at least `settleMs`
 * and on at least `minReplies` replies in a row. The run starts at the first such reply's time; any
 * other reply (the other value, `none`, `present`, `fingerprint: "none"`, an unreadable or non-200
 * reply, a failed request) ends it, and the next such reply starts a new one. Null at `timeoutMs`.
 * Copies of the Worker still on an earlier version answer too for a while, so one reply never decides.
 */
export async function waitForSettledKeyState(address, {
  fetchImpl = fetch,
  sleep = delay,
  now = Date.now,
  settleMs = KEY_SETTLE_MS,
  timeoutMs = KEY_SETTLE_TIMEOUT_MS,
  retryMs = STATE_RETRY_MS,
  minReplies = KEY_SETTLE_MIN_REPLIES,
} = {}) {
  const deadline = now() + timeoutMs;
  let run = null;
  for (;;) {
    const state = await fetchKeyState(address, fetchImpl);
    const at = now();
    // A reply that completes after the limit decides nothing, even one that would settle the run:
    // a settled answer must come within `timeoutMs` (pull request 13, review round 1).
    if (at > deadline) return null;
    if (keyConfirmed(state)) {
      if (run && run.key === state.key) run.replies += 1;
      else run = { key: state.key, since: at, replies: 1 };
      if (run.replies >= minReplies && at - run.since >= settleMs) return { fingerprint: "stored", key: run.key };
    } else {
      run = null;
    }
    // No request starts after the limit: its reply could not settle anyway (pull request 13,
    // review round 2).
    if (at + retryMs > deadline) return null;
    await sleep(retryMs);
    // A sleep can end late; the clock is read again so that no request starts after the limit
    // (pull request 13, review round 3).
    if (now() > deadline) return null;
  }
}

/**
 * The key-state steps `main` gives `runDeploy`, sharing one `fetchImpl`, `sleep` and `now`:
 * `askKeyState(address)` (the first exact reply, `waitForKeyState` with `ask`'s options) and
 * `settleKeyState(address)` (a settled answer, `waitForSettledKeyState` with `settle`'s options).
 */
export function createKeyStateActions({ fetchImpl = fetch, sleep = delay, now = Date.now, ask = {}, settle = {} } = {}) {
  return {
    askKeyState: (address) => waitForKeyState(address, { ...ask, fetchImpl, sleep, now }),
    settleKeyState: (address) => waitForSettledKeyState(address, { ...settle, fetchImpl, sleep, now }),
  };
}

/**
 * The deployment-key steps (D-17), after the deploy. Resolves to 0 to go on to the set-up code,
 * or to the exit code 1. The supplied key is never printed; a generated one is printed once,
 * before it is put. The only key ever deleted is a supplied key this run put that a settled answer
 * then reported as `mismatch`.
 */
async function supplyDeploymentKey({ workerName, address, supplied, listSecrets, askKeyState, settleKeyState, putSecret, deleteSecret, generateKey, print, printError }) {
  // A settled answer about the key against the stored fingerprint, or null when none came in time.
  const settle = async () => {
    print(KEY_LINES.checking);
    const settled = await settleKeyState(address);
    return keyConfirmed(settled) ? settled : null;
  };
  let names;
  try {
    names = await listSecrets(workerName);
  } catch {
    names = null;
  }
  if (!Array.isArray(names)) {
    printError(KEY_LINES.listingFailed);
    return 1;
  }
  if (names.includes(DEPLOYMENT_KEY_SECRET)) {
    // Never replaced or deleted. A supplied key is checked against the stored fingerprint.
    if (supplied === null) {
      print(KEY_LINES.kept);
      return 0;
    }
    const first = await askKeyState(address);
    const checked = first?.fingerprint === "stored" ? await settle() : first;
    if (!checked) {
      print(KEY_LINES.kept);
      printError(KEY_LINES.workerKeyNotConfirmed);
      return 1;
    }
    if (checked.fingerprint === "stored" && checked.key === "mismatch") {
      printError(KEY_LINES.workerKeyNotOriginal(workerName));
      return 1;
    }
    // Nothing stored to compare with, or a settled match.
    print(KEY_LINES.kept);
    print(KEY_LINES.notUsed);
    return 0;
  }
  const state = await askKeyState(address);
  if (!state) {
    printError(KEY_LINES.stateUnreadable(address));
    return 1;
  }
  const putSupplied = async () => {
    try {
      await putSecret(workerName, DEPLOYMENT_KEY_SECRET, supplied);
      return true;
    } catch {
      printError(KEY_LINES.suppliedPutFailed);
      return false;
    }
  };
  if (state.fingerprint === "none") {
    if (supplied !== null) {
      if (!(await putSupplied())) return 1;
      print(KEY_LINES.supplied);
      return 0;
    }
    const key = generateKey();
    print("");
    print(KEY_LINES.generated(key));
    print("");
    print(KEY_LINES.keepCopy);
    try {
      await putSecret(workerName, DEPLOYMENT_KEY_SECRET, key);
    } catch {
      printError(KEY_LINES.putFailed);
      return 1;
    }
    return 0;
  }
  if (supplied === null) {
    printError(KEY_LINES.encryptedNoKey);
    return 1;
  }
  // A fingerprint is stored: the supplied key is the operator's claim that it is the original.
  if (!(await putSupplied())) return 1;
  const confirmed = await settle();
  if (!confirmed) {
    // Not confirmed: the key stays, so that a rerun with the same key can confirm it.
    printError(KEY_LINES.notConfirmed);
    return 1;
  }
  if (confirmed.key === "mismatch") {
    // The key this run put is not the original: remove it, so that the rerun with the original
    // finds no key in the list.
    try {
      await deleteSecret(workerName, DEPLOYMENT_KEY_SECRET);
    } catch {
      printError(KEY_LINES.notRemoved(workerName));
      return 1;
    }
    printError(KEY_LINES.notOriginal);
    return 1;
  }
  print(KEY_LINES.supplied);
  return 0;
}

/**
 * The whole command, with every outside effect passed in so that it can be tested:
 * `deploy()` resolves to `{ workerName, targets }`; `listSecrets(workerName)` to the Worker's
 * secret names (or throws); `askKeyState(address)` to the first exact `{ fingerprint, key }` or
 * null; `settleKeyState(address)` to a settled `{ fingerprint: "stored", key }` or null;
 * `askState(address)` to "open", "closed" or null; `putSecret(workerName, name, value)` supplies
 * a secret; `deleteSecret(workerName, name)` removes one; `env` holds SITE_SURVEY_DEPLOYMENT_KEY
 * when an operator supplies a key; `generateKey()` makes a deployment key; `print` writes a line.
 * Resolves to the exit code.
 */
export async function runDeploy({
  deploy,
  listSecrets,
  askKeyState,
  settleKeyState,
  askState,
  putSecret,
  deleteSecret,
  print,
  printError,
  env = {},
  generate = generateSetupCode,
  generateKey = generateDeploymentKey,
  url,
}) {
  print(KEY_LINES.oneAtATime);
  const given = env?.[DEPLOYMENT_KEY_ENV];
  const supplied = given === undefined || given === "" ? null : given;
  if (supplied !== null && !isDeploymentKey(supplied)) {
    printError(KEY_LINES.malformed);
    return 1;
  }
  const deployed = await deploy();
  if (!deployed?.workerName) {
    printError("The deployment did not report the Worker's name, so no set-up code was issued.");
    return 1;
  }
  const address = chooseAddress(deployed?.targets, url);
  if (!address) {
    printError("The deployment reported no https:// address. Run again with --url <https address>.");
    return 1;
  }
  // The key state is read from the address while secrets go to the Worker Wrangler named, so an
  // address given with --url must be one Wrangler reported for this Worker, or a key could be
  // generated, put or deleted on the strength of another installation's state (pull request 13,
  // review round 1; orchestrator ruling of 2026-11-24). Nothing after this runs: no key step and
  // no set-up code.
  if (url !== undefined && (hasExplicitPort(url) || !isReportedAddress(address, deployed.targets))) {
    printError(KEY_LINES.urlNotReported(address, deployed.workerName));
    return 1;
  }
  const keyExit = await supplyDeploymentKey({
    workerName: deployed.workerName,
    address,
    supplied,
    listSecrets,
    askKeyState,
    settleKeyState,
    putSecret,
    deleteSecret,
    generateKey,
    print,
    printError,
  });
  if (keyExit !== 0) return keyExit;
  const state = await askState(address);
  if (state === null) {
    printError(`${address}${SETUP_STATE_PATH} did not say whether set-up is open. No set-up code was issued. Run the command again.`);
    return 1;
  }
  if (state === "closed") {
    print(`Deployed to ${address}. Set-up is already complete, so no set-up code was issued.`);
    return 0;
  }
  const code = generate();
  await putSecret(deployed.workerName, SETUP_CODE_SECRET, code);
  print(`Deployed to ${address}. Set-up is open.`);
  print("");
  print(`  Set-up code: ${code}`);
  print("");
  print(`Open ${address} and enter this code to create the first administrator. It is shown only`);
  print("this once. Deploying again before set-up is complete issues a new code and the old one stops working.");
  print(SETTLE_NOTICE);
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

/**
 * How Wrangler is started: this Node binary running Wrangler's own entry script, with every
 * argument passed as its own entry and no shell on any platform. On Windows this avoids
 * `wrangler.cmd`, which needs `cmd.exe`: there an unquoted repository path with spaces would split
 * and a Worker name containing `&` or `|` would run as a command.
 */
export function wranglerSpawn(root, args, { execPath = process.execPath } = {}) {
  return {
    command: execPath,
    args: [path.join(root, "node_modules", "wrangler", "bin", "wrangler.js"), ...args],
    options: { cwd: root, shell: false, windowsHide: true },
  };
}

/**
 * Starts Wrangler and resolves when it exits with 0 (to its standard output when `capture` is set,
 * else undefined). SITE_SURVEY_DEPLOYMENT_KEY is removed from every child's environment. `input`
 * goes to its standard input; with `capture` its standard output is collected while its standard
 * error still reaches the operator.
 */
export function runWrangler(root, args, { env = process.env, input, capture = false, spawnImpl = spawn } = {}) {
  const { command, args: spawnArgs, options } = wranglerSpawn(root, args);
  return new Promise((resolve, reject) => {
    const child = spawnImpl(command, spawnArgs, {
      ...options,
      env: childEnvironment(env),
      stdio: [input === undefined ? "inherit" : "pipe", capture ? "pipe" : "inherit", "inherit"],
    });
    const chunks = [];
    if (capture) child.stdout.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    child.once("error", reject);
    child.once("close", (code) => {
      if (code !== 0) {
        reject(new Error(`wrangler ${args[0]} exited with ${code}.`));
        return;
      }
      resolve(capture ? Buffer.concat(chunks).toString("utf8") : undefined);
    });
    if (input !== undefined) {
      // A child that exits before reading (EPIPE) must not crash the command: its exit code decides.
      child.stdin.on("error", () => {});
      child.stdin.end(input);
    }
  });
}

/**
 * The command's Wrangler steps for `main`: `deploy()` (under `name` when given, its output file in
 * `outputDir`), `listSecrets(workerName)` (the names, or throws), `putSecret(workerName, name,
 * value)` (the value on standard input only) and `deleteSecret(workerName, name)` (standard input
 * piped and ended, so Wrangler takes its non-interactive "yes" instead of asking).
 */
export function createWranglerActions(root, { name, outputDir, env = process.env, spawnImpl = spawn } = {}) {
  return {
    deploy: async () => {
      const outputFile = path.join(outputDir, "wrangler-output.json");
      await runWrangler(root, wranglerDeployArgs(name), { env: { ...env, WRANGLER_OUTPUT_FILE_PATH: outputFile }, spawnImpl });
      return readDeployOutput(readFileSync(outputFile, "utf8"));
    },
    listSecrets: async (workerName) => {
      const text = await runWrangler(root, ["secret", "list", "--name", workerName, "--format", "json"], { env, capture: true, spawnImpl });
      const names = parseSecretList(text);
      if (!names) throw new Error("wrangler secret list did not print a secret list.");
      return names;
    },
    putSecret: (workerName, secretName, value) => runWrangler(root, ["secret", "put", secretName, "--name", workerName], { env, input: value, spawnImpl }),
    deleteSecret: (workerName, secretName) => runWrangler(root, ["secret", "delete", secretName, "--name", workerName], { env, input: "", spawnImpl }),
  };
}

/**
 * The options `main` gives `runDeploy`: the Wrangler steps (`createWranglerActions`), the key-state
 * steps (`createKeyStateActions`), the set-up state poll, the operator's environment and console output.
 */
export function createMainOptions({ root, name, outputDir, url, env = process.env, spawnImpl = spawn, fetchImpl = fetch, sleep = delay, now = Date.now, print = (line) => console.log(line), printError = (line) => console.error(line) }) {
  const wrangler = createWranglerActions(root, { name, outputDir, env, spawnImpl });
  const keyState = createKeyStateActions({ fetchImpl, sleep, now });
  return {
    url,
    env,
    deploy: wrangler.deploy,
    listSecrets: wrangler.listSecrets,
    askKeyState: keyState.askKeyState,
    settleKeyState: keyState.settleKeyState,
    askState: (address) => waitForSetupState(address, { fetchImpl, sleep, now }),
    putSecret: wrangler.putSecret,
    deleteSecret: wrangler.deleteSecret,
    print,
    printError,
  };
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
    process.exitCode = await runDeploy(createMainOptions({ root, name, outputDir, url }));
  } catch (error) {
    console.error(`Deploy failed: ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  } finally {
    rmSync(outputDir, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
