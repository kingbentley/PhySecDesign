#!/usr/bin/env node
// Story 1.5, spec 9: the deployed acceptance run on Cloudflare (D-19, D-20, D-17 as spec 6 built it).
// Run from Kevin's workstation, with Wrangler signed in to the "PhySec Site Studio" test account and
// only after Kevin's go-ahead for the run: `npm run build && node deploy/acceptance/two-step.mjs`.
//
// What it does, in the spec's order: checks the account (`wrangler whoami`) and that the Workers
// site-studio-test-15a, -15b and -15c do not exist, and stops before deploying anything otherwise;
// then checks 1, 9, 2, 3, 4, 5, 6, 7, 8, 13, 14 (with 11 and 12) and 10; then deletes all three
// Workers in a `finally` (also after a failure or an interruption) and checks each is gone.
//
// Secrets: the deployment key and the set-up code are read from the deploy command's output into
// memory only; the administrator's password, the phone-check password, every wrong key, the
// authenticator secrets, codes, recovery codes and cookies stay in memory. None is printed, written
// to a file, put in a record or passed on a command line: a key reaches a child only on standard
// input (`wrangler secret put`) or in SITE_SURVEY_DEPLOYMENT_KEY in the deploy command's environment.
// `wrangler tail` is read as JSON in memory, and only each event's outcome and exception names are
// kept. The record holds only what each check names (lengths, exit codes, yes/no, times, secret names).
//
// Every outside effect is passed in to `runAcceptance`, so the whole run can be tried against fakes
// (tests/acceptance-two-step.test.mjs). `main` builds the real effects.
import { spawn } from "node:child_process";
import { createHmac, randomBytes } from "node:crypto";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import {
  childEnvironment,
  DEPLOYMENT_KEY_ENV,
  DEPLOYMENT_KEY_SECRET,
  DEPLOYMENT_KEY_STATE_PATH,
  generateDeploymentKey,
  isDeploymentKey,
  KEY_LINES,
  parseKeyState,
  parseSecretList,
  waitForSettledKeyState,
  wranglerSpawn,
} from "../../scripts/deploy-cloudflare.mjs";

export const ACCOUNT_NAME = "PhySec Site Studio";
export const WORKERS = Object.freeze({ a: "site-studio-test-15a", b: "site-studio-test-15b", c: "site-studio-test-15c" });
export const WORKER_NAME_PATTERN = /^site-studio-test-15[abc]$/;
/** The order the checks run in (frozen block). Check 11 and 12 are recorded inside check 14. */
export const CHECK_ORDER = Object.freeze([1, 9, 2, 3, 4, 5, 6, 7, 8, 13, 14, 10]);

export const ADMIN = Object.freeze({ installationName: "Acceptance 15a", name: "Acceptance Administrator", email: "admin-15a@example.test" });
export const PHONE = Object.freeze({ name: "Phone Check", email: "phone-check@example.test" });

export const DEPLOY_TIMEOUT_MS = 10 * 60_000;
export const WRANGLER_TIMEOUT_MS = 3 * 60_000;
/** Check 11: `wrangler secret delete` with piped empty standard input must end within this. */
export const SECRET_DELETE_LIMIT_MS = 60_000;
export const REQUEST_TIMEOUT_MS = 15_000;
export const SETUP_RETRY_LIMIT_MS = 180_000;
export const START_RETRY_LIMIT_MS = 120_000;
export const RETRY_MS = 5_000;
export const TAIL_PROBE_MS = 2_000;
export const TAIL_PROBE_LIMIT_MS = 60_000;
/** After check 5, the tail is given this long for late events before it is stopped. */
export const TAIL_GRACE_MS = 10_000;
export const KEY_POLL_MS = 3_000;
export const KEY_POLL_WINDOW_MS = 180_000;
export const KEY_FINAL_WINDOW_MS = 60_000;
export const KEY_DIFFER_LIMIT_MS = 60_000;
/** Check 13: the fewest replies in the final 60 seconds for a final value to count as settled. */
export const KEY_FINAL_MIN_REPLIES = 10;
/** Check 2: how long to wait for the key-state route to answer `stored`, `matches`. */
export const KEY_STORED_LIMIT_MS = 60_000;
/** Check 7: how long to keep polling 15b after its deploy command has ended. */
export const FIRST_ANSWER_AFTER_DEPLOY_MS = 180_000;
/** Check 14 (d): the time from the "Checking" line to the command's exit. */
export const SETTLE_MIN_MS = 60_000;
export const SETTLE_MAX_MS = 180_000;
/** How long stopping the tail may wait for its child to close before the run goes on. */
export const TAIL_STOP_LIMIT_MS = 15_000;
export const CLEANUP_CONFIRM_TRIES = 3;
export const CLEANUP_CONFIRM_RETRY_MS = 10_000;
export const STEP_SECONDS = 30;
export const RECOVERY_CODES = 10;

const APP_HEADER = "x-site-survey-design";
const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** An error whose message is fixed text written in this file: never a body, an output or a secret. */
export class AcceptanceError extends Error {}
class Interrupted extends Error {}

/** The message to record for a thrown value: ours as written, anything else by its kind only. */
export function fixedMessage(error) {
  if (error instanceof AcceptanceError) return error.message;
  const kind = error && typeof error === "object" && typeof error.name === "string" && /^[A-Za-z]{1,40}$/.test(error.name) ? error.name : "value";
  return `unexpected ${kind}`;
}

export const yesNo = (value) => (value ? "yes" : "no");
export const iso = (ms) => new Date(ms).toISOString();

// ---------------------------------------------------------------------------------------------
// RFC 6238 (TOTP) and RFC 4226 (HOTP), written for this script on node:crypto.

/** RFC 4648 base32 (either case, spaces ignored, no padding) to bytes. */
export function base32Decode(text) {
  const clean = String(text).replace(/[\s=]/g, "").toUpperCase();
  let buffer = 0;
  let bits = 0;
  const bytes = [];
  for (const character of clean) {
    const value = BASE32.indexOf(character);
    if (value < 0) throw new AcceptanceError("An authenticator secret was not base32.");
    buffer = ((buffer << 5) | value) & 0xffff;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >>> bits) & 255);
    }
  }
  return Buffer.from(bytes);
}

/** Bytes to RFC 4648 base32, upper case, no padding. */
export function base32Encode(bytes) {
  let buffer = 0;
  let bits = 0;
  let text = "";
  for (const byte of bytes) {
    buffer = ((buffer << 8) | byte) & 0xffff;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      text += BASE32[(buffer >>> bits) & 31];
    }
  }
  if (bits > 0) text += BASE32[(buffer << (5 - bits)) & 31];
  return text;
}

/** RFC 4226 HOTP with HMAC-SHA-1: the last `digits` digits of the truncated value. */
export function hotp(keyBytes, counter, digits = 6) {
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", keyBytes).update(message).digest();
  const offset = digest[digest.length - 1] & 15;
  const binary = ((digest[offset] & 127) << 24) | (digest[offset + 1] << 16) | (digest[offset + 2] << 8) | digest[offset + 3];
  return String(binary % 10 ** digits).padStart(digits, "0");
}

/** The RFC 6238 time step of `ms` (Unix milliseconds): T0 = 0, X = 30 seconds. */
export function stepAt(ms) {
  return Math.floor(ms / 1000 / STEP_SECONDS);
}

/** The 6-digit code of `step` for a base32 authenticator secret. */
export function totpCode(secret, step) {
  return hotp(base32Decode(secret), step, 6);
}

// ---------------------------------------------------------------------------------------------
// The tail stream: `wrangler tail --format json` prints each event as JSON.stringify(event, null, 4).

/**
 * A stream parser for concatenated JSON objects with text between them: tracks brace depth outside
 * strings (knowing escapes), and hands each complete top-level object to `onValue`. Text outside
 * objects and objects that do not parse are dropped.
 */
export function createJsonObjectStream(onValue) {
  let depth = 0;
  let inString = false;
  let escaped = false;
  let current = "";
  let previous = "\n";
  const stream = {
    push(text) {
      for (const character of String(text)) {
        const afterNewline = previous === "\n";
        previous = character;
        if (depth === 0) {
          if (character === "{") {
            depth = 1;
            current = "{";
          }
          continue;
        }
        // Wrangler prints each event's top-level "{" at column 0, and a JSON string never holds a
        // raw newline: a "{" right after a newline, outside a string, starts a new candidate, so an
        // unclosed stray "{" in other text cannot swallow the events after it.
        if (character === "{" && afterNewline && !inString) {
          depth = 1;
          current = "{";
          escaped = false;
          continue;
        }
        current += character;
        if (inString) {
          if (escaped) escaped = false;
          else if (character === "\\") escaped = true;
          else if (character === '"') inString = false;
          continue;
        }
        if (character === '"') inString = true;
        else if (character === "{") depth += 1;
        else if (character === "}") {
          depth -= 1;
          if (depth === 0) {
            const complete = current;
            current = "";
            let value;
            try {
              value = JSON.parse(complete);
            } catch {
              // A stray "{" in other text began this: read it again from the next character, so
              // that events inside it are not lost.
              stream.push(complete.slice(1));
              continue;
            }
            onValue(value);
          }
        }
      }
    },
  };
  return stream;
}

/** What is kept of a tail event: its outcome and its exceptions' names, nothing else. */
export function tailOutcome(event) {
  const outcome = typeof event?.outcome === "string" && /^[A-Za-z_]{1,40}$/.test(event.outcome) ? event.outcome : "unreadable";
  const exceptions = Array.isArray(event?.exceptions)
    ? event.exceptions.map((exception) => (typeof exception?.name === "string" && /^[A-Za-z0-9_.]{1,60}$/.test(exception.name) ? exception.name : "unnamed"))
    : [];
  return { outcome, exceptions };
}

/** A summary of tail outcomes for the record: counts by outcome and the exception names seen. */
export function summariseTail(outcomes) {
  const byOutcome = {};
  const names = new Set();
  for (const { outcome, exceptions } of outcomes) {
    byOutcome[outcome] = (byOutcome[outcome] ?? 0) + 1;
    for (const name of exceptions) names.add(name);
  }
  const platformError = outcomes.some(({ outcome, exceptions }) => outcome !== "ok" || exceptions.length > 0);
  // No events is not a clean result: nothing was observed.
  const seen = outcomes.length === 0 ? "not observed (no events)" : yesNo(platformError);
  return { events: outcomes.length, byOutcome, exceptionNames: [...names].sort(), platformErrorSeen: seen };
}

// ---------------------------------------------------------------------------------------------
// A small cookie jar per "browser", and the API client.

/** Keeps `name=value` from each Set-Cookie, drops a cookie on Max-Age=0, sends them back. */
export function createCookieJar() {
  const cookies = new Map();
  return {
    store(response) {
      const lines = typeof response?.headers?.getSetCookie === "function" ? response.headers.getSetCookie() : [];
      for (const line of lines) {
        const [pair, ...attributes] = String(line).split(";");
        const equals = pair.indexOf("=");
        if (equals <= 0) continue;
        const name = pair.slice(0, equals).trim();
        const value = pair.slice(equals + 1).trim();
        const cleared = attributes.some((attribute) => /^\s*max-age\s*=\s*0\s*$/i.test(attribute));
        if (cleared) cookies.delete(name);
        else cookies.set(name, value);
      }
    },
    header() {
      if (cookies.size === 0) return undefined;
      return [...cookies].map(([name, value]) => `${name}=${value}`).join("; ");
    },
    names() {
      return [...cookies.keys()];
    },
  };
}

/** The refusal code of a reply body, when it has one that looks like a code. */
export function refusalCode(body) {
  const code = body?.error?.code;
  return typeof code === "string" && /^[a-z_]{1,64}$/.test(code) ? code : null;
}

/**
 * One "browser" on an installation: its own cookie jar; every POST carries the app's origin, the
 * app's header and a JSON body; every request has a time limit. Answers `{ status, body, refusal }`
 * (status 0 when the request failed); never throws with a body's content.
 */
export function createBrowser({ fetchImpl, origin, timeoutMs = REQUEST_TIMEOUT_MS }) {
  const jar = createCookieJar();
  async function send(method, route, body) {
    const headers = { accept: "application/json" };
    const cookie = jar.header();
    if (cookie) headers.cookie = cookie;
    const init = { method, headers, signal: AbortSignal.timeout(timeoutMs) };
    if (method === "POST") {
      headers.origin = origin;
      headers[APP_HEADER] = "1";
      headers["content-type"] = "application/json";
      init.body = JSON.stringify(body ?? {});
    }
    let response;
    try {
      response = await fetchImpl(origin + route, init);
    } catch {
      return { status: 0, body: null, refusal: null };
    }
    jar.store(response);
    let parsed = null;
    try {
      parsed = await response.json();
    } catch {
      parsed = null;
    }
    return { status: response.status, body: parsed, refusal: refusalCode(parsed) };
  }
  return { jar, get: (route) => send("GET", route), post: (route, body) => send("POST", route, body) };
}

/** One read of the public key-state route: the exact state of a 200 reply, else null. */
export async function readKeyState(fetchImpl, origin, timeoutMs = REQUEST_TIMEOUT_MS) {
  try {
    const response = await fetchImpl(origin + DEPLOYMENT_KEY_STATE_PATH, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(timeoutMs) });
    if (response.status !== 200) {
      await response.body?.cancel?.();
      return { status: response.status, state: null };
    }
    let body = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    return { status: 200, state: parseKeyState(body) };
  } catch {
    return { status: 0, state: null };
  }
}

// ---------------------------------------------------------------------------------------------
// Reading Wrangler's and the deploy command's output.

/** The first text from a `[` that parses as a JSON array, or null. */
export function firstJsonArrayText(text) {
  if (typeof text !== "string") return null;
  for (let start = text.indexOf("["); start !== -1; start = text.indexOf("[", start + 1)) {
    for (let end = text.indexOf("]", start); end !== -1; end = text.indexOf("]", end + 1)) {
      const slice = text.slice(start, end + 1);
      try {
        if (Array.isArray(JSON.parse(slice))) return slice;
      } catch {
        // Not this end.
      }
    }
  }
  return null;
}

/**
 * Whether a `wrangler secret list` result says the Worker does not exist: a non-zero exit and
 * `Worker "<w>" not found.` in its output. Any other failure is not "not found".
 */
export function isNotFound(result, worker) {
  if (!result || result.code === 0 || result.timedOut) return false;
  const text = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  return text.includes(`Worker "${worker}" not found.`);
}

/** The secret names a `wrangler secret list` result holds, or null. */
export function listedNames(result) {
  if (!result || result.code !== 0 || result.timedOut) return null;
  return parseSecretList(result.stdout);
}

/** The account check: exactly one account, named ACCOUNT_NAME. Never records an email. */
export function checkAccount(result) {
  let parsed = null;
  if (result && result.code === 0) {
    const text = String(result.stdout ?? "");
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    try {
      parsed = start === -1 ? null : JSON.parse(text.slice(start, end + 1));
    } catch {
      parsed = null;
    }
  }
  const accounts = Array.isArray(parsed?.accounts) ? parsed.accounts : null;
  const named = accounts?.filter((account) => account?.name === ACCOUNT_NAME) ?? [];
  const ok = accounts !== null && accounts.length === 1 && named.length === 1 && typeof named[0].id === "string" && /^[0-9a-f]{32}$/i.test(named[0].id);
  const record = {
    whoamiExit: result?.code ?? null,
    readable: yesNo(accounts !== null),
    accounts: accounts?.length ?? 0,
    namedAccountPresent: yesNo(named.length === 1),
  };
  if (ok) Object.assign(record, { name: ACCOUNT_NAME, id: named[0].id });
  return { ok, id: ok ? named[0].id : null, record };
}

const KEY_LINE = /^\s*Deployment key: (\S+)\s*$/;
const SETUP_CODE_LINE = /^\s*Set-up code: (\S+)\s*$/;
const DEPLOYED_LINE = /^Deployed to (https:\/\/\S+?)\. /;

/**
 * Reads the deploy command's lines: takes the key and the set-up code into memory and counts their
 * lines, reads the address of the "Deployed to" line, and finds other lines by exact text (compared
 * with the deploy command's own KEY_LINES).
 */
export function readDeployLines(lines) {
  let key = null;
  let keyLines = 0;
  let setupCode = null;
  let setupCodeLines = 0;
  let address = null;
  for (const line of lines) {
    const keyMatch = KEY_LINE.exec(line.text);
    if (keyMatch) {
      keyLines += 1;
      if (keyLines === 1) key = keyMatch[1];
      continue;
    }
    const codeMatch = SETUP_CODE_LINE.exec(line.text);
    if (codeMatch) {
      setupCodeLines += 1;
      setupCode = codeMatch[1];
      continue;
    }
    const addressMatch = DEPLOYED_LINE.exec(line.text);
    if (addressMatch) address = addressMatch[1];
  }
  const find = (text, stream) => lines.find((line) => line.text.trimEnd() === text && (stream === undefined || line.stream === stream)) ?? null;
  return { key, keyLines, setupCode, setupCodeLines, address, find };
}

/** 15b's address from 15a's: the same workers.dev subdomain, the Worker name replaced. */
export function deriveWorkerAddress(address, worker) {
  let url;
  try {
    url = new URL(address);
  } catch {
    return null;
  }
  const labels = url.hostname.split(".");
  if (url.protocol !== "https:" || labels.length < 4 || labels.at(-2) !== "workers" || labels.at(-1) !== "dev") return null;
  labels[0] = worker;
  return `https://${labels.join(".")}`;
}

// ---------------------------------------------------------------------------------------------
// Each check's pass test: what was observed in, `{ pass, record }` out (the record fields only).

export function check1Pass({ exitCode, timedOut, keyLines, keyWellFormed, setupCodeLines, listed, address }) {
  const record = {
    exitCode,
    timedOut: yesNo(timedOut),
    deploymentKeyLines: keyLines,
    printedOnce: yesNo(keyLines === 1),
    keyWellFormed: yesNo(keyWellFormed),
    setupCodeLines,
    addressReported: yesNo(Boolean(address)),
    secretListed: yesNo(listed),
  };
  return { pass: exitCode === 0 && !timedOut && keyLines === 1 && keyWellFormed && setupCodeLines === 1 && Boolean(address) && listed, record };
}

export function check9Pass({ exitCode, stdout, stderr }) {
  const text = String(stdout ?? "");
  const trimmed = text.trim();
  let onlyArray = false;
  try {
    onlyArray = trimmed.startsWith("[") && Array.isArray(JSON.parse(trimmed));
  } catch {
    onlyArray = false;
  }
  const arrayText = onlyArray ? trimmed : firstJsonArrayText(text);
  const rest = arrayText === null ? trimmed : text.replace(arrayText, "").trim();
  const errText = String(stderr ?? "");
  const record = {
    exitCode,
    stdoutOnlyOneJsonArray: yesNo(onlyArray),
    otherStdoutBytes: Buffer.byteLength(rest),
    stderrWritten: yesNo(errText.length > 0),
    stderrLength: Buffer.byteLength(errText),
  };
  return { pass: exitCode === 0 && onlyArray, record };
}

export function check2Pass(observed) {
  const record = { ...observed };
  const pass =
    observed.setupStatus === 200 &&
    observed.signInStatus === 200 &&
    observed.startStatus === 200 &&
    observed.confirmStatus === 200 &&
    observed.recoveryCodes === RECOVERY_CODES &&
    observed.keyState === "stored/matches";
  return { pass, record };
}

/**
 * Whether any captured line, on either stream and in any form, holds one of `values` (the key, the
 * first set-up code). Answers only yes or no; the value is never recorded.
 */
export function valueInOutput(lines, values) {
  const wanted = values.filter((value) => typeof value === "string" && value.length > 0);
  return lines.some((line) => wanted.some((value) => String(line.text).includes(value)));
}

/** Whether two secret-name lists hold the same names. */
export function sameNames(before, after) {
  if (!Array.isArray(before) || !Array.isArray(after)) return false;
  return JSON.stringify([...before].sort()) === JSON.stringify([...after].sort());
}

export function check3Pass({ exitCode, timedOut, keyLines, keptLine, listed, listUnchanged, keyValueInOutput }) {
  const record = {
    exitCode,
    timedOut: yesNo(timedOut),
    deploymentKeyLines: keyLines,
    keyValueInOutput: yesNo(keyValueInOutput),
    keptLine: yesNo(keptLine),
    secretStillListed: yesNo(listed),
    listUnchanged: yesNo(listUnchanged),
  };
  return { pass: exitCode === 0 && !timedOut && keyLines === 0 && !keyValueInOutput && keptLine && listed && listUnchanged, record };
}

export function check4Pass({ signInStatus, secondStep, secondStepStatus, signedIn, refusal }) {
  const record = { signInStatus, askedForSecondStep: yesNo(secondStep), secondStepStatus, signedIn: yesNo(signedIn), refusal: refusal ?? null };
  return { pass: signInStatus === 200 && secondStep && secondStepStatus === 200 && signedIn, record };
}

export function check5Pass({ firstStatus, firstSignedIn, secondStatus, secondRefusal, signInStatuses }) {
  const record = { firstUseStatus: firstStatus, firstUseSignedIn: yesNo(firstSignedIn), secondUseStatus: secondStatus, secondUseRefusal: secondRefusal ?? null, passwordSteps: signInStatuses };
  const pass = firstStatus === 200 && firstSignedIn && secondStatus === 401 && secondRefusal === "second_step_recovery_code_wrong";
  return { pass, record };
}

export function check6Pass({ exitCode, timedOut, keyLines, suppliedLine, listed, keyValueInOutput }) {
  const record = { exitCode, timedOut: yesNo(timedOut), deploymentKeyLines: keyLines, keyValueInOutput: yesNo(keyValueInOutput), suppliedLine: yesNo(suppliedLine), secretListed: yesNo(listed) };
  return { pass: exitCode === 0 && !timedOut && keyLines === 0 && !keyValueInOutput && suppliedLine && listed, record };
}

/** Check 7 is a record (finding 12): it passes once recorded. */
export function check7Pass({ firstAnswerMs, derivedAddress, derivedMatchesReported, tail }) {
  const record = {
    firstKeyState200AfterStartMs: firstAnswerMs,
    timeIncludesBuild: "yes",
    addressDerived: yesNo(derivedAddress),
    derivedEqualsReported: derivedMatchesReported === null ? "not known" : yesNo(derivedMatchesReported),
    tailConnected: tail.connected,
    tailProbes: tail.probes ?? 0,
    tailLastProbeStatus: tail.lastProbeStatus ?? null,
    tailRestarts: tail.restarts,
    tailExits: tail.exits ?? [],
    tailDuringChecks2to5: tail.summary,
  };
  return { pass: true, record };
}

export function check8Pass(answer) {
  return { pass: true, record: { ...answer } };
}

/**
 * Check 13's polls after one put returned: one request every KEY_POLL_MS from the put, sent while
 * at most KEY_POLL_WINDOW_MS have passed. Each reply is timed by when it completed, `atMs` from
 * the put (orchestrator ruling of 2026-11-24, Claude, accepted on Kevin's instruction: the frozen
 * block's "arrives" means completion; it replaces the builder's choice of the send time, which is
 * kept as `sentMs` for scheduling only). A request that fails or times out counts at the time it
 * ended. `read()` resolves to the reply's `key`, or null for an unreadable, failed or non-200 one.
 */
export async function pollAfterPut({ now, sleep, checkAbort = () => {}, read }) {
  const putReturned = now();
  const replies = [];
  for (let index = 0; index * KEY_POLL_MS <= KEY_POLL_WINDOW_MS; index += 1) {
    const due = putReturned + index * KEY_POLL_MS;
    if (now() < due) await sleep(due - now());
    checkAbort();
    const sentAt = now();
    if (sentAt - putReturned > KEY_POLL_WINDOW_MS) break;
    const key = await read();
    replies.push({ atMs: now() - putReturned, sentMs: sentAt - putReturned, key });
  }
  return replies;
}

/**
 * Check 13 for one put: the final value is the `key` of the replies in the last 60 seconds of the
 * 180-second poll (all readable and equal, else "not settled"); the time of the last reply that
 * differs from it (an unreadable, failed or non-200 reply differs), 0 when none; the count.
 * Builder's choice (recorded): a final value other than the one the put should give also fails.
 */
export function evaluatePutPolls(replies, expected) {
  const finalFrom = KEY_POLL_WINDOW_MS - KEY_FINAL_WINDOW_MS;
  // Only replies that arrived within the 180-second poll make up the final value: a reply arriving
  // later cannot supply the tenth reply or the agreement. It still counts as a differing reply
  // below, so a late arrival can only make the check stricter (orchestrator ruling of 2026-11-24 on
  // pull request 13's review round 2, Claude, accepted on Kevin's instruction).
  const last = replies.filter((reply) => reply.atMs >= finalFrom && reply.atMs <= KEY_POLL_WINDOW_MS);
  const values = new Set(last.map((reply) => reply.key ?? "unreadable"));
  const final = last.length >= KEY_FINAL_MIN_REPLIES && values.size === 1 && !values.has("unreadable") ? last[0].key : null;
  let lastDifferMs = 0;
  for (const reply of replies) if (reply.key !== final || final === null) lastDifferMs = Math.max(lastDifferMs, reply.atMs);
  if (final === null) lastDifferMs = replies.length ? Math.max(...replies.map((reply) => reply.atMs)) : 0;
  const settled = final !== null;
  const pass = settled && final === expected && lastDifferMs < KEY_DIFFER_LIMIT_MS;
  return { pass, record: { expected, final: settled ? final : "not settled", lastDifferingReplyMs: lastDifferMs, replies: replies.length, repliesInFinalWindow: last.length } };
}

export function check13Pass(puts) {
  return { pass: puts.length >= 4 && puts.every((put) => put.pass), record: { puts: puts.map((put) => put.record) } };
}

export function check11Pass({ exitCode, timedOut, absent }) {
  const record = { exitCode, endedWithinLimit: yesNo(!timedOut), absentFromNextList: yesNo(absent) };
  return { pass: exitCode === 0 && !timedOut && absent, record };
}

export function check12Pass({ afterGenerated, afterSupplied, afterRestored }) {
  const show = (value) => (value === null || value === undefined ? "not run" : yesNo(value));
  const record = { afterGeneratedKey: show(afterGenerated), afterSuppliedKey: show(afterSupplied), afterRestoredKey: show(afterRestored) };
  return { pass: afterGenerated === true && afterSupplied === true && afterRestored === true, record };
}

const settleTimeOk = (ms) => typeof ms === "number" && ms >= SETTLE_MIN_MS && ms <= SETTLE_MAX_MS;

export function check14aPass({ exitCode, timedOut, keyValueInOutput, checkingLine, notOriginalLine, absent, settleMs }) {
  const record = {
    exitCode,
    timedOut: yesNo(timedOut),
    keyValueInOutput: yesNo(keyValueInOutput),
    checkingLine: yesNo(checkingLine),
    notOriginalLine: yesNo(notOriginalLine),
    absentFromNextList: yesNo(absent),
    checkingToExitMs: settleMs,
  };
  return { pass: exitCode === 1 && !timedOut && !keyValueInOutput && checkingLine && notOriginalLine && absent, record };
}

export function check14bPass({ exitCode, timedOut, keyValueInOutput, checkingLine, suppliedLine, listed, signInStatus, secondStepStatus, signedIn, settleMs }) {
  const record = {
    exitCode,
    timedOut: yesNo(timedOut),
    keyValueInOutput: yesNo(keyValueInOutput),
    checkingLine: yesNo(checkingLine),
    suppliedLine: yesNo(suppliedLine),
    secretListed: yesNo(listed),
    signInStatus,
    secondStepStatus,
    signedInWithLaterCode: yesNo(signedIn),
    checkingToExitMs: settleMs,
  };
  return { pass: exitCode === 0 && !timedOut && !keyValueInOutput && checkingLine && suppliedLine && listed && signedIn, record };
}

export function check14cPass({ handPutExit, exitCode, timedOut, keyValueInOutput, checkingLine, manualDeleteLine, suppliedLine, listed, settledKey, settleMs }) {
  const record = {
    handPutExit,
    exitCode,
    timedOut: yesNo(timedOut),
    keyValueInOutput: yesNo(keyValueInOutput),
    checkingLine: yesNo(checkingLine),
    manualDeleteLineNamingWorker: yesNo(manualDeleteLine),
    suppliedLine: yesNo(suppliedLine),
    keyStillListed: yesNo(listed),
    keyStateSettledOn: settledKey ?? "not settled",
    checkingToExitMs: settleMs,
  };
  const pass = handPutExit === 0 && exitCode === 1 && !timedOut && !keyValueInOutput && checkingLine && manualDeleteLine && !suppliedLine && listed && settledKey === "mismatch";
  return { pass, record };
}

export function check14dPass({ a, b, c }) {
  const record = { aMs: a ?? null, bMs: b ?? null, cMs: c ?? null, rangeMs: [SETTLE_MIN_MS, SETTLE_MAX_MS] };
  return { pass: settleTimeOk(a) && settleTimeOk(b) && settleTimeOk(c), record };
}

/** Check 10: a non-zero exit for each, or "not shown" when no safe way gave one. */
export function check10Pass({ put, del }) {
  // A call ended at its time limit also exits non-zero; it shows nothing.
  const shown = (part) => typeof part.exitCode === "number" && part.exitCode !== 0 && !part.timedOut;
  const record = {
    put: { ...put, timedOut: yesNo(put.timedOut), outcome: shown(put) ? "non-zero exit" : "not shown" },
    delete: { ...del, timedOut: yesNo(del.timedOut), outcome: shown(del) ? "non-zero exit" : "not shown" },
  };
  return { pass: shown(put) && shown(del), acceptable: true, record };
}

/** Cleanup: every name deleted and confirmed gone. */
export function cleanupPass(workers) {
  return { pass: workers.every((worker) => worker.confirmedGone === "yes"), record: { workers } };
}

/** The exit code: 0 only when every check meets its pass column (10 may say "not shown"; 7, 8 recorded). */
export function exitCodeFor(record) {
  if (record.stopped) return 1;
  if (!record.cleanup?.pass) return 1;
  for (const number of [1, 2, 3, 4, 5, 6, 9, 11, 12, 13, 14]) if (!record.checks[number]?.pass) return 1;
  if (!record.checks[7] || !record.checks[8]) return 1;
  // A check 7 or 8 that threw recorded nothing.
  if (record.checks[7].record?.error || record.checks[8].record?.error) return 1;
  if (!(record.checks[10]?.pass || record.checks[10]?.acceptable)) return 1;
  return 0;
}

/** One printed line for a check's outcome: never anything but its record fields. */
export function formatCheckLine(label, entry) {
  const outcome = entry.pass ? "pass" : entry.acceptable ? "recorded (not shown allowed)" : "FAIL";
  return `Check ${label} at ${entry.at}: ${outcome} ${JSON.stringify(entry.record)}`;
}

// ---------------------------------------------------------------------------------------------
// The run.

/**
 * The whole acceptance run with every outside effect injected:
 * - `deployCommand(worker, { key, accountId })` runs `npm run deploy:cloudflare -- --name <worker>`
 *   and resolves to `{ code, timedOut, lines: [{ stream: "out" | "err", text, at }], startedAt, endedAt }`;
 * - `wrangler(args, { input, timeoutMs, accountId, cleanup })` resolves to `{ code, timedOut, stdout, stderr }`;
 * - `startTail(worker, { accountId, onText })` starts `wrangler tail --format json` and resolves to
 *   `{ stop(), restarts() }`;
 * - `fetch`, `now`, `sleep`, `isTTY`, `ask(question)`, `askHidden(question)`, `print(line)`,
 *   `generateKey()` (wrong keys), `generatePassword()`.
 * Resolves to the record (with `exitCode`).
 */
export async function runAcceptance(effects, { signal } = {}) {
  const fx = {
    generateKey: generateDeploymentKey,
    generatePassword: () => randomBytes(24).toString("base64url"),
    ...effects,
  };
  const { now, sleep, print } = fx;
  const record = { startedAt: iso(now()), account: null, safety: null, stopped: null, error: null, checks: {}, cleanup: null, exitCode: 1 };
  const checkAbort = () => {
    if (signal?.aborted) throw new Interrupted("interrupted");
  };
  const note = (label, result) => {
    const entry = { pass: Boolean(result.pass), record: result.record, at: iso(now()) };
    if (result.acceptable !== undefined) entry.acceptable = result.acceptable;
    record.checks[label] = entry;
    print(formatCheckLine(label, entry));
    return entry;
  };
  const attempt = async (label, run) => {
    checkAbort();
    try {
      const result = await run();
      // A check that ended because of an interrupt is recorded as interrupted, not as failed.
      checkAbort();
      return note(label, result);
    } catch (error) {
      if (error instanceof Interrupted || signal?.aborted) throw new Interrupted("interrupted");
      return note(label, { pass: false, record: { error: fixedMessage(error) } });
    }
  };
  const notRun = (label, reason) => note(label, { pass: false, record: { notRun: reason } });

  // Safety (finding 13), before anything is deployed. Nothing is deleted when it stops here.
  const who = await fx.wrangler(["whoami", "--json"], { accountId: null });
  const account = checkAccount(who);
  record.account = account.record;
  print(`Run started at ${record.startedAt}. Account check: ${account.ok ? "pass" : "FAIL"} ${JSON.stringify(account.record)}`);
  if (!account.ok) {
    record.stopped = "wrong account: nothing deployed";
    print(`Stopped: the signed-in Wrangler account is not only "${ACCOUNT_NAME}". Nothing was deployed.`);
    return finish();
  }
  const accountId = account.id;
  const wrangler = (args, options = {}) => fx.wrangler(args, { ...options, accountId });
  const listWorker = async (worker) => {
    const result = await wrangler(["secret", "list", "--name", worker, "--format", "json"]);
    return { result, names: listedNames(result), notFound: isNotFound(result, worker) };
  };
  const safety = [];
  for (const worker of [WORKERS.a, WORKERS.b, WORKERS.c]) {
    const listing = await listWorker(worker);
    safety.push({ worker, notFound: yesNo(listing.notFound), exitCode: listing.result.code });
  }
  record.safety = safety;
  const safe = safety.every((entry) => entry.notFound === "yes");
  print(`Safety listing at ${iso(now())}: ${safe ? "pass" : "FAIL"} ${JSON.stringify(safety)}`);
  if (!safe) {
    record.stopped = "leftover Worker or listing failed: nothing deployed";
    print("Stopped: a test Worker name is already in use, or its listing failed. Nothing was deployed.");
    return finish();
  }

  const state = {
    password: fx.generatePassword(),
    key: null,
    setupCode: null,
    addressA: null,
    addressB: null,
    recoveryCodes: [],
    lastStep: new Map(),
    check2: false,
    tail: null,
    tailOutcomes: [],
    tailConnected: "no",
    tailFrom: 0,
    tailSummary: null,
    check12: { afterGenerated: null, afterSupplied: null, afterRestored: null },
  };

  const browser = () => createBrowser({ fetchImpl: fx.fetch, origin: state.addressA });
  // Whether a deploy after the first printed check 1's key or set-up code, or a key it was given
  // (`extra`, such as check 14 (a)'s wrong key), in any form (yes/no only).
  const leaked = (deployed, ...extra) => valueInOutput(deployed.lines, [state.key, state.setupCode, ...extra]);
  // Whether the cookie jar `page` holds is signed in: the session read answers `signedIn: true`. A
  // 200 that names the person is not enough; the reply must also have set a working session.
  const sessionHolds = async (page) => {
    const read = await page.get("/api/v1/session");
    return read.status === 200 && read.body?.signedIn === true;
  };
  const waitForLaterStep = async (account) => {
    const last = state.lastStep.get(account) ?? -1;
    while (stepAt(now()) <= last) {
      const nextAt = (last + 1) * STEP_SECONDS * 1000;
      await sleep(Math.max(250, nextAt - now() + 250));
    }
    return stepAt(now());
  };
  // Signs the administrator in with the password and a code of a later step than any accepted.
  const signInWithCode = async (account, secret, password) => {
    const page = browser();
    const first = await page.post("/api/v1/session/sign-in", { email: account, password });
    const secondStep = first.status === 200 && first.body?.secondStep === true;
    if (!secondStep) return { page, signInStatus: first.status, secondStep, secondStepStatus: null, signedIn: false, refusal: first.refusal };
    const step = await waitForLaterStep(account);
    const second = await page.post("/api/v1/session/second-step", { method: "code", code: totpCode(secret, step) });
    // A 200 means the installation took the code's step, whatever the session read says (D-6).
    if (second.status === 200) state.lastStep.set(account, step);
    const signedIn = second.status === 200 && typeof second.body?.name === "string" && (await sessionHolds(page));
    return { page, signInStatus: first.status, secondStep, secondStepStatus: second.status, signedIn, refusal: second.refusal };
  };
  // Turns two-step verification on for the session `page` holds; answers the secret and codes.
  const turnOn = async (page, account, password) => {
    const startedAt = now();
    let start;
    let startRetries = 0;
    for (;;) {
      start = await page.post("/api/v1/account/two-step/start", { password });
      if (start.status === 200 || start.refusal !== "deployment_key_missing" || now() - startedAt >= START_RETRY_LIMIT_MS) break;
      startRetries += 1;
      await sleep(RETRY_MS);
    }
    const out = { startStatus: start.status, startRefusal: start.refusal, startRetries, confirmStatus: null, confirmRefusal: null, recoveryCodes: 0 };
    const secret = typeof start.body?.secret === "string" ? start.body.secret : null;
    const setupId = typeof start.body?.setupId === "string" ? start.body.setupId : null;
    if (start.status !== 200 || !secret || !setupId) return { out, secret: null, codes: [] };
    const step = stepAt(now());
    const confirm = await page.post("/api/v1/account/two-step/confirm", { setupId, code: totpCode(secret, step) });
    const codes = Array.isArray(confirm.body?.recoveryCodes) ? confirm.body.recoveryCodes.filter((code) => typeof code === "string") : [];
    Object.assign(out, { confirmStatus: confirm.status, confirmRefusal: confirm.refusal, recoveryCodes: codes.length });
    if (confirm.status === 200) state.lastStep.set(account, step);
    return { out, secret: confirm.status === 200 ? secret : null, codes };
  };
  const stopTail = async () => {
    if (!state.tail) return;
    const tail = state.tail;
    state.tail = null;
    try {
      await tail.stop();
    } catch {
      // Stopping a tail that already ended.
    }
    try {
      state.tailRestarts = typeof tail.restarts === "function" ? tail.restarts() : 0;
      state.tailExits = typeof tail.exits === "function" ? tail.exits() : [];
    } catch {
      state.tailRestarts = 0;
      state.tailExits = [];
    }
  };

  try {
    await runChecks();
  } catch (error) {
    if (error instanceof Interrupted) {
      record.stopped = record.stopped ?? "interrupted";
      print("Interrupted: cleaning up.");
    } else {
      record.error = fixedMessage(error);
      record.stopped = record.stopped ?? "unexpected error";
      print(`The run met an unexpected error (${record.error}); cleaning up.`);
    }
  } finally {
    await stopTail();
    await cleanup();
  }
  return finish();

  function finish() {
    record.finishedAt = iso(now());
    record.exitCode = exitCodeFor(record);
    // The whole record as one line: it holds nothing secret (the dry-run tests assert it).
    print(`Record: ${JSON.stringify(record)}`);
    return record;
  }

  async function cleanup() {
    const workers = [];
    for (const worker of [WORKERS.a, WORKERS.b, WORKERS.c]) {
      const entry = { worker, deleteExit: null, confirmedGone: "no" };
      try {
        const deleted = await wrangler(["delete", "--name", worker, "--force"], { cleanup: true });
        entry.deleteExit = deleted.code;
      } catch {
        entry.deleteExit = "failed to run";
      }
      for (let tryNumber = 1; tryNumber <= CLEANUP_CONFIRM_TRIES; tryNumber += 1) {
        try {
          const listing = await wrangler(["secret", "list", "--name", worker, "--format", "json"], { cleanup: true });
          if (isNotFound(listing, worker)) {
            entry.confirmedGone = "yes";
            break;
          }
        } catch {
          // Counted as not confirmed.
        }
        // The cleanup's own wait is not ended by an interrupt.
        if (tryNumber < CLEANUP_CONFIRM_TRIES) await (fx.cleanupSleep ?? sleep)(CLEANUP_CONFIRM_RETRY_MS).catch(() => {});
      }
      workers.push(entry);
    }
    const result = cleanupPass(workers);
    record.cleanup = { pass: result.pass, record: result.record, at: iso(now()) };
    print(`Cleanup at ${record.cleanup.at}: ${result.pass ? "every Worker deleted and confirmed gone" : "NOT CONFIRMED: check the account by hand"} ${JSON.stringify(result.record)}`);
  }

  async function runChecks() {
    // Check 1: first deploy of 15a.
    const c1 = await attempt(1, async () => {
      const deployed = await fx.deployCommand(WORKERS.a, { key: null, accountId });
      const out = readDeployLines(deployed.lines);
      state.key = out.key;
      state.setupCode = out.setupCode;
      state.addressA = out.address;
      const listing = await listWorker(WORKERS.a);
      const listed = Boolean(listing.names?.includes(DEPLOYMENT_KEY_SECRET));
      state.check12.afterGenerated = listed;
      state.namesAfterCheck1 = listing.names;
      return check1Pass({
        exitCode: deployed.code,
        timedOut: deployed.timedOut,
        keyLines: out.keyLines,
        keyWellFormed: isDeploymentKey(out.key),
        setupCodeLines: out.setupCodeLines,
        listed,
        address: out.address,
      });
    });
    if (!c1.pass) {
      record.stopped = "check 1 failed";
      return;
    }

    // Check 9: the secret list's output.
    await attempt(9, async () => {
      const result = await wrangler(["secret", "list", "--name", WORKERS.a, "--format", "json"]);
      return check9Pass({ exitCode: result.code, stdout: result.stdout, stderr: result.stderr });
    });

    // The tail, confirmed with a probe, recording from check 2 to the end of check 5.
    checkAbort();
    try {
      const stream = createJsonObjectStream((event) => state.tailOutcomes.push(tailOutcome(event)));
      state.tail = await fx.startTail(WORKERS.a, { accountId, onText: (text) => stream.push(text) });
      const probeStart = now();
      const page = browser();
      while (state.tailOutcomes.length === 0 && now() - probeStart < TAIL_PROBE_LIMIT_MS) {
        const probe = await page.get("/api/v1/status");
        state.tailProbes = (state.tailProbes ?? 0) + 1;
        state.tailLastProbeStatus = probe.status;
        if (state.tailOutcomes.length > 0) break;
        await sleep(TAIL_PROBE_MS);
      }
      state.tailConnected = yesNo(state.tailOutcomes.length > 0);
    } catch (error) {
      if (signal?.aborted) throw new Interrupted("interrupted");
      state.tailConnected = "no (could not start)";
    }
    state.tailFrom = state.tailOutcomes.length;

    // Check 2: set-up, sign-in, two-step on through the API, key state.
    await attempt(2, async () => {
      const page = browser();
      const setupStarted = now();
      let setup;
      let setupRetries = 0;
      for (;;) {
        setup = await page.post("/api/v1/setup", {
          code: state.setupCode,
          installationName: ADMIN.installationName,
          name: ADMIN.name,
          email: ADMIN.email,
          password: state.password,
        });
        const retry = setup.refusal === "setup_code_not_configured" || setup.refusal === "setup_code_replaced";
        if (setup.status === 200 || !retry || now() - setupStarted >= SETUP_RETRY_LIMIT_MS) break;
        setupRetries += 1;
        await sleep(RETRY_MS);
      }
      const observed = { setupStatus: setup.status, setupRefusal: setup.refusal, setupRetries, signInStatus: null, startStatus: null, confirmStatus: null, recoveryCodes: 0, keyState: null };
      if (setup.status !== 200) return check2Pass(observed);
      const signIn = await page.post("/api/v1/session/sign-in", { email: ADMIN.email, password: state.password });
      observed.signInStatus = signIn.status;
      observed.signInRefusal = signIn.refusal;
      if (signIn.status !== 200 || typeof signIn.body?.name !== "string") return check2Pass(observed);
      state.adminPage = page;
      const on = await turnOn(page, ADMIN.email, state.password);
      Object.assign(observed, on.out);
      state.secret = on.secret;
      state.recoveryCodes = on.codes;
      if (!on.secret) return check2Pass(observed);
      const keyStarted = now();
      let replies = 0;
      let last = null;
      for (;;) {
        const read = await readKeyState(fx.fetch, state.addressA);
        replies += 1;
        last = read.state ? `${read.state.fingerprint}/${read.state.key}` : `unreadable (${read.status})`;
        if (last === "stored/matches" || now() - keyStarted >= KEY_STORED_LIMIT_MS) break;
        await sleep(KEY_POLL_MS);
      }
      Object.assign(observed, { keyState: last, keyStateReplies: replies });
      const result = check2Pass(observed);
      state.check2 = result.pass;
      return result;
    });

    // Check 3: redeploy 15a with no key supplied.
    const c3 = await attempt(3, async () => {
      const deployed = await fx.deployCommand(WORKERS.a, { key: null, accountId });
      const out = readDeployLines(deployed.lines);
      checkAbort();
      const listing = await listWorker(WORKERS.a);
      return check3Pass({
        exitCode: deployed.code,
        timedOut: deployed.timedOut,
        keyLines: out.keyLines,
        keyValueInOutput: leaked(deployed),
        keptLine: Boolean(out.find(KEY_LINES.kept, "out")),
        listed: Boolean(listing.names?.includes(DEPLOYMENT_KEY_SECRET)),
        listUnchanged: sameNames(state.namesAfterCheck1, listing.names),
      });
    });
    if (!c3.pass) {
      record.stopped = "check 3 failed";
      return;
    }

    // Check 4: after the redeploy, the password asks for the second step and a fresh code signs in.
    if (!state.check2) notRun(4, "needs check 2");
    else {
      const c4 = await attempt(4, async () => check4Pass(await signInWithCode(ADMIN.email, state.secret, state.password)));
      if (!c4.pass) {
        record.stopped = "check 4 failed";
        return;
      }
    }

    // Check 5: a recovery code signs in once and is refused the second time.
    if (!state.check2 || state.recoveryCodes.length === 0) notRun(5, "needs check 2");
    else {
      await attempt(5, async () => {
        const code = state.recoveryCodes[0];
        const firstPage = browser();
        const firstPassword = await firstPage.post("/api/v1/session/sign-in", { email: ADMIN.email, password: state.password });
        const first = firstPassword.body?.secondStep === true ? await firstPage.post("/api/v1/session/second-step", { method: "recovery", code }) : { status: null, body: null, refusal: firstPassword.refusal };
        const firstSignedIn = first.status === 200 && typeof first.body?.name === "string" && (await sessionHolds(firstPage));
        // The replay starts from its own cookie jar.
        const secondPage = browser();
        const secondPassword = await secondPage.post("/api/v1/session/sign-in", { email: ADMIN.email, password: state.password });
        const second = secondPassword.body?.secondStep === true ? await secondPage.post("/api/v1/session/second-step", { method: "recovery", code }) : { status: null, body: null, refusal: secondPassword.refusal };
        return check5Pass({
          firstStatus: first.status,
          firstSignedIn,
          secondStatus: second.status,
          secondRefusal: second.refusal,
          signInStatuses: [firstPassword.status, secondPassword.status],
        });
      });
    }

    // The tail's part ends with check 5.
    checkAbort();
    if (state.tail) await sleep(TAIL_GRACE_MS);
    await stopTail();
    state.tailSummary = summariseTail(state.tailOutcomes.slice(state.tailFrom));

    // Checks 6 and 7: 15b deployed with 15a's key; when its key-state route first answers 200.
    checkAbort();
    state.addressB = deriveWorkerAddress(state.addressA, WORKERS.b);
    let firstAnswerMs = null;
    let deployResult = null;
    let out6 = null;
    const c6 = await attempt(6, async () => {
      checkAbort();
      const started = now();
      let deployEnded = null;
      const deploying = Promise.resolve()
        .then(() => fx.deployCommand(WORKERS.b, { key: state.key, accountId }))
        .finally(() => {
          deployEnded = now();
        });
      const polling = (async () => {
        if (!state.addressB) return;
        for (;;) {
          if (signal?.aborted) return;
          const read = await readKeyState(fx.fetch, state.addressB);
          if (read.status === 200) {
            // When the 200 reply arrived, not when its request was sent.
            firstAnswerMs = now() - started;
            return;
          }
          if (deployEnded !== null && now() - deployEnded >= FIRST_ANSWER_AFTER_DEPLOY_MS) return;
          if (now() - started >= DEPLOY_TIMEOUT_MS + FIRST_ANSWER_AFTER_DEPLOY_MS) return;
          if (signal?.aborted) return;
          await sleep(KEY_POLL_MS);
        }
      })().catch(() => {
        // An interrupt ends the poll's sleep; the deploy's own result decides what follows.
      });
      try {
        deployResult = await deploying;
      } finally {
        await polling;
      }
      out6 = readDeployLines(deployResult.lines);
      checkAbort();
      const listing = await listWorker(WORKERS.b);
      const listed = Boolean(listing.names?.includes(DEPLOYMENT_KEY_SECRET));
      state.check12.afterSupplied = listed;
      return check6Pass({
        exitCode: deployResult.code,
        timedOut: deployResult.timedOut,
        keyLines: out6.keyLines,
        keyValueInOutput: leaked(deployResult),
        suppliedLine: Boolean(out6.find(KEY_LINES.supplied, "out")),
        listed,
      });
    });
    void c6;
    await attempt(7, async () =>
      check7Pass({
        firstAnswerMs,
        derivedAddress: Boolean(state.addressB),
        derivedMatchesReported: out6?.address && state.addressB ? out6.address === state.addressB : null,
        tail: {
          connected: state.tailConnected,
          probes: state.tailProbes ?? 0,
          lastProbeStatus: state.tailLastProbeStatus ?? null,
          restarts: state.tailRestarts ?? 0,
          exits: state.tailExits ?? [],
          summary: state.tailSummary,
        },
      }),
    );

    // Check 8: the optional phone check (D-20 as amended).
    await attempt(8, async () => check8Pass(await phoneCheck()));

    // Check 13: how long key-state replies differ after a secret put. Checks 13, 14, 11 and 12 need
    // the stored fingerprint of check 2; without it they are recorded as not run and check 10 runs.
    if (!state.check2 || !state.key) {
      notRun(13, "needs check 2");
      notRun(14, "needs check 2");
      notRun(11, "needs check 2");
      note(12, check12Pass(state.check12));
      await runCheck10();
      return;
    }
    const c13 = await attempt(13, async () => {
      const puts = [];
      const plan = [
        { key: wrongKey(), expected: "mismatch" },
        { key: state.key, expected: "matches" },
        { key: wrongKey(), expected: "mismatch" },
        { key: state.key, expected: "matches" },
      ];
      for (const put of plan) {
        checkAbort();
        const result = await wrangler(["secret", "put", DEPLOYMENT_KEY_SECRET, "--name", WORKERS.a], { input: put.key });
        if (result.code !== 0) {
          puts.push({ pass: false, record: { expected: put.expected, putExit: result.code, timedOut: yesNo(result.timedOut) } });
          continue;
        }
        const replies = await pollAfterPut({
          now,
          sleep,
          checkAbort,
          read: async () => {
            const read = await readKeyState(fx.fetch, state.addressA);
            return read.state ? read.state.key : null;
          },
        });
        const evaluated = evaluatePutPolls(replies, put.expected);
        puts.push({ pass: evaluated.pass, record: { ...evaluated.record, putExit: 0 } });
      }
      return check13Pass(puts);
    });
    if (!c13.pass) {
      record.stopped = "check 13 failed: check 14 and check 10 skipped, for the orchestrator";
      print("Check 13 did not meet its pass column: check 14 and check 10 are skipped; cleaning up and stopping for the orchestrator.");
      return;
    }

    // Check 14 (with 11 and 12): the deploy command's restore paths on 15a.
    const times = { a: null, b: null, c: null };
    const parts = {};
    const settleMsOf = (deployed, out) => {
      const checking = out.find(KEY_LINES.checking, "out");
      return checking && typeof deployed.endedAt === "number" ? deployed.endedAt - checking.at : null;
    };
    await attempt(14, async () => {
      // (a) check 11: the Worker's key deleted with piped empty standard input, to stand for a lost key.
      const deletion = await wrangler(["secret", "delete", DEPLOYMENT_KEY_SECRET, "--name", WORKERS.a], { input: "", timeoutMs: SECRET_DELETE_LIMIT_MS });
      checkAbort();
      const afterDelete = await listWorker(WORKERS.a);
      note(11, check11Pass({ exitCode: deletion.code, timedOut: deletion.timedOut, absent: Array.isArray(afterDelete.names) && !afterDelete.names.includes(DEPLOYMENT_KEY_SECRET) }));
      checkAbort();
      const suppliedWrongKey = wrongKey();
      const deployedA = await fx.deployCommand(WORKERS.a, { key: suppliedWrongKey, accountId });
      const outA = readDeployLines(deployedA.lines);
      checkAbort();
      const listA = await listWorker(WORKERS.a);
      times.a = settleMsOf(deployedA, outA);
      parts.a = check14aPass({
        exitCode: deployedA.code,
        timedOut: deployedA.timedOut,
        keyValueInOutput: leaked(deployedA, suppliedWrongKey),
        checkingLine: Boolean(outA.find(KEY_LINES.checking, "out")),
        notOriginalLine: Boolean(outA.find(KEY_LINES.notOriginal, "err")),
        absent: Array.isArray(listA.names) && !listA.names.includes(DEPLOYMENT_KEY_SECRET),
        settleMs: times.a,
      });

      // (b) the original key supplied.
      checkAbort();
      const deployedB = await fx.deployCommand(WORKERS.a, { key: state.key, accountId });
      const outB = readDeployLines(deployedB.lines);
      checkAbort();
      const listB = await listWorker(WORKERS.a);
      const listedB = Boolean(listB.names?.includes(DEPLOYMENT_KEY_SECRET));
      state.check12.afterRestored = listedB;
      times.b = settleMsOf(deployedB, outB);
      checkAbort();
      const signIn = deployedB.code === 0 ? await signInWithCode(ADMIN.email, state.secret, state.password) : { signInStatus: null, secondStepStatus: null, signedIn: false };
      parts.b = check14bPass({
        exitCode: deployedB.code,
        timedOut: deployedB.timedOut,
        keyValueInOutput: leaked(deployedB),
        checkingLine: Boolean(outB.find(KEY_LINES.checking, "out")),
        suppliedLine: Boolean(outB.find(KEY_LINES.supplied, "out")),
        listed: listedB,
        signInStatus: signIn.signInStatus,
        secondStepStatus: signIn.secondStepStatus,
        signedIn: signIn.signedIn,
        settleMs: times.b,
      });

      // (c) a wrong key put in the Worker by hand, then the original supplied.
      checkAbort();
      const handPut = await wrangler(["secret", "put", DEPLOYMENT_KEY_SECRET, "--name", WORKERS.a], { input: wrongKey() });
      checkAbort();
      const deployedC = await fx.deployCommand(WORKERS.a, { key: state.key, accountId });
      const outC = readDeployLines(deployedC.lines);
      checkAbort();
      const listC = await listWorker(WORKERS.a);
      times.c = settleMsOf(deployedC, outC);
      checkAbort();
      const settled = await waitForSettledKeyState(state.addressA, { fetchImpl: fx.fetch, sleep, now });
      parts.c = check14cPass({
        handPutExit: handPut.code,
        exitCode: deployedC.code,
        timedOut: deployedC.timedOut,
        keyValueInOutput: leaked(deployedC),
        checkingLine: Boolean(outC.find(KEY_LINES.checking, "out")),
        manualDeleteLine: Boolean(outC.find(KEY_LINES.workerKeyNotOriginal(WORKERS.a), "err")),
        suppliedLine: Boolean(outC.find(KEY_LINES.supplied)),
        listed: Boolean(listC.names?.includes(DEPLOYMENT_KEY_SECRET)),
        settledKey: settled?.key ?? null,
        settleMs: times.c,
      });

      // (d) the settle times.
      parts.d = check14dPass(times);
      return {
        pass: parts.a.pass && parts.b.pass && parts.c.pass && parts.d.pass,
        record: { a: { pass: parts.a.pass, ...parts.a.record }, b: { pass: parts.b.pass, ...parts.b.record }, c: { pass: parts.c.pass, ...parts.c.record }, d: { pass: parts.d.pass, ...parts.d.record } },
      };
    });
    if (!record.checks[11]) notRun(11, "check 14 did not reach it");
    note(12, check12Pass(state.check12));
    await runCheck10();
  }

  // Check 10: a failed put and a failed delete exit non-zero.
  async function runCheck10() {
    await attempt(10, async () => {
      const throwaway = randomBytes(16).toString("hex");
      const put = { way: "invalid name on 15a" };
      const invalid = await wrangler(["secret", "put", "ACCEPTANCE INVALID NAME", "--name", WORKERS.a], { input: throwaway });
      put.invalidNameExit = invalid.code;
      put.exitCode = invalid.code;
      put.timedOut = Boolean(invalid.timedOut);
      let cExists = null;
      if (invalid.code === 0) {
        put.way = "absent Worker 15c (fallback)";
        const fallback = await wrangler(["secret", "put", "ACCEPTANCE_FALLBACK_SECRET", "--name", WORKERS.c], { input: throwaway });
        put.fallbackExit = fallback.code;
        put.exitCode = fallback.code;
        put.timedOut = Boolean(fallback.timedOut);
        const listing = await listWorker(WORKERS.c);
        cExists = !listing.notFound;
        put.worker15cNowExists = yesNo(cExists);
      }
      const del = { way: "absent secret on 15a" };
      const absent = await wrangler(["secret", "delete", "ACCEPTANCE_ABSENT_SECRET", "--name", WORKERS.a], { input: "" });
      del.absentSecretExit = absent.code;
      del.exitCode = absent.code;
      del.timedOut = Boolean(absent.timedOut);
      if (absent.code === 0) {
        if (cExists === null) cExists = !(await listWorker(WORKERS.c)).notFound;
        if (cExists) {
          del.way = "no safe way (15c exists)";
          del.exitCode = null;
        } else {
          del.way = "absent Worker 15c (fallback)";
          const fallback = await wrangler(["secret", "delete", "ACCEPTANCE_ABSENT_SECRET", "--name", WORKERS.c], { input: "" });
          del.fallbackExit = fallback.code;
          del.exitCode = fallback.code;
          del.timedOut = Boolean(fallback.timedOut);
        }
      }
      return check10Pass({ put, del });
    });
  }

  function wrongKey() {
    for (;;) {
      const key = fx.generateKey();
      if (key !== state.key) return key;
    }
  }

  async function phoneCheck() {
    if (!fx.isTTY) return { phoneCheck: "declined for this run (no terminal)" };
    if (!state.check2) return { phoneCheck: "not offered (needs check 2)" };
    const take = String((await fx.ask("Take the optional phone check now? (y/N) ")) ?? "").trim().toLowerCase();
    if (take !== "y" && take !== "yes") return { phoneCheck: "declined" };
    let password = "";
    for (let tries = 0; tries < 3 && [...password].length < 12; tries += 1) {
      // Ctrl-C at a prompt signals the interrupt: stop asking.
      checkAbort();
      password = String((await fx.askHidden("Make up a throwaway password of at least 12 characters (not shown): ")) ?? "");
    }
    checkAbort();
    if ([...password].length < 12) return { phoneCheck: "declined (no usable password)" };
    let admin = state.adminPage;
    let invite = await admin.post("/api/v1/invitations", { email: PHONE.email, name: PHONE.name, role: "standard" });
    if (invite.status === 401) {
      const again = await signInWithCode(ADMIN.email, state.secret, state.password);
      admin = again.page;
      invite = await admin.post("/api/v1/invitations", { email: PHONE.email, name: PHONE.name, role: "standard" });
    }
    let secret = null;
    try {
      secret = invite.status === 200 && typeof invite.body?.link === "string" ? new URL(invite.body.link).hash.slice(1) : null;
    } catch {
      secret = null;
    }
    if (!secret) return { phoneCheck: "not completed", inviteStatus: invite.status, inviteRefusal: invite.refusal };
    const person = browser();
    const accept = await person.post("/api/v1/invitations/accept", { secret, name: PHONE.name, password });
    if (accept.status !== 200) return { phoneCheck: "not completed", acceptStatus: accept.status, acceptRefusal: accept.refusal };
    const on = await turnOn(person, PHONE.email, password);
    if (!on.secret) return { phoneCheck: "not completed", ...on.out };
    password = "";
    print(`On your iPhone, open ${state.addressA}, sign in as ${PHONE.email} with the password you just typed, and look at the second step's code field.`);
    const keypad = String((await fx.ask("Did the numeric keypad come up? (y/n) ")) ?? "").trim().toLowerCase();
    const autofill = String((await fx.ask("Was a code autofill suggestion shown? (y/n) ")) ?? "").trim().toLowerCase();
    return {
      phoneCheck: "taken",
      account: PHONE.email,
      numericKeypadShown: keypad.startsWith("y") ? "yes" : "no",
      codeAutofillSuggestionShown: autofill.startsWith("y") ? "yes" : "no",
    };
  }
}

// ---------------------------------------------------------------------------------------------
// The real effects, for `main`. Each is a factory taking `spawnImpl` so that tests can check what
// would be started without starting anything.

function assertWorkerName(worker) {
  if (!WORKER_NAME_PATTERN.test(String(worker))) throw new AcceptanceError("A Worker name outside site-studio-test-15a, -15b and -15c was refused.");
}

/** Every `--name` value in Wrangler arguments must be one of the three test Workers. */
export function assertWranglerArgs(args) {
  for (let index = 0; index < args.length; index += 1) if (args[index] === "--name") assertWorkerName(args[index + 1]);
}

/** Splits a stream into lines (LF or CRLF), each with the time its end arrived. */
export function createLineCollector(stream, lines, now) {
  let pending = "";
  return {
    push(chunk) {
      pending += Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk);
      let index;
      while ((index = pending.indexOf("\n")) !== -1) {
        const text = pending.slice(0, index).replace(/\r$/, "");
        pending = pending.slice(index + 1);
        lines.push({ stream, text, at: now() });
      }
    },
    end() {
      if (pending.length > 0) lines.push({ stream, text: pending.replace(/\r$/, ""), at: now() });
      pending = "";
    },
  };
}

/**
 * Ends a child. On Windows (where the run is made) `taskkill /T /F` ends the whole tree. Elsewhere
 * a child started as its own process group (`group`, the deploy: `detached`) has the group signalled
 * with SIGKILL, which ends the whole tree, also after the shell leading it has exited (npm and
 * Wrangler can still hold its pipes); when that fails, the direct child gets SIGKILL. Any other
 * child (the tail, Wrangler calls) gets SIGKILL itself, its own children may live on, and once it
 * has exited nothing is signalled: its former process id may belong to another process by then
 * (pull request 13, review rounds 2 and 3).
 */
export function killTree(child, { spawnImpl = spawn, platform = process.platform, killImpl = process.kill, group = false } = {}) {
  if (!child) return;
  // A child ended by a signal has `signalCode` set and `exitCode` null: it has exited too.
  const exited = (child.exitCode !== null && child.exitCode !== undefined) || (child.signalCode !== null && child.signalCode !== undefined);
  const ownGroup = group && platform !== "win32" && Boolean(child.pid);
  if (exited) {
    if (ownGroup) {
      try { killImpl(-child.pid, "SIGKILL"); } catch { /* gone */ }
    }
    return;
  }
  try {
    if (platform === "win32" && child.pid) spawnImpl("taskkill", ["/pid", String(child.pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" });
    else if (ownGroup) {
      try {
        killImpl(-child.pid, "SIGKILL");
      } catch {
        child.kill("SIGKILL");
      }
    } else child.kill("SIGKILL");
  } catch {
    // Already gone.
  }
}

/**
 * The deploy command: `npm run deploy:cloudflare -- --name <worker>` in `root`, one command string
 * with a shell (npm on Windows needs one; no separate arguments, DEP0190). Standard input ignored;
 * standard output and standard error piped and kept as lines with their arrival times. The child's
 * environment holds CLOUDFLARE_ACCOUNT_ID, and SITE_SURVEY_DEPLOYMENT_KEY only when a key is supplied.
 */
export function createDeployCommand({ root, env = process.env, spawnImpl = spawn, now = Date.now, platform = process.platform, timeoutMs = DEPLOY_TIMEOUT_MS, signal } = {}) {
  return (worker, { key = null, accountId } = {}) => {
    assertWorkerName(worker);
    const childEnv = { ...childEnvironment(env) };
    if (accountId) childEnv.CLOUDFLARE_ACCOUNT_ID = accountId;
    if (key !== null) childEnv[DEPLOYMENT_KEY_ENV] = key;
    // An abort listener added to an already-aborted signal never fires: start nothing.
    if (signal?.aborted) return Promise.resolve({ code: null, timedOut: false, lines: [], startedAt: now(), endedAt: now() });
    return new Promise((resolve) => {
      const lines = [];
      const startedAt = now();
      // Off Windows the deploy leads its own process group, so `killTree` can end npm and Wrangler
      // under the shell too (review round 2); on Windows `taskkill /T` ends the tree.
      const ownGroup = platform !== "win32";
      const child = spawnImpl(`npm run deploy:cloudflare -- --name ${worker}`, { cwd: root, shell: true, detached: ownGroup, env: childEnv, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
      const out = createLineCollector("out", lines, now);
      const err = createLineCollector("err", lines, now);
      child.stdout.on("data", (chunk) => out.push(chunk));
      child.stderr.on("data", (chunk) => err.push(chunk));
      let timedOut = false;
      let settled = false;
      const stop = () => {
        timedOut = true;
        killTree(child, { spawnImpl, platform, group: ownGroup });
      };
      const timer = setTimeout(stop, timeoutMs);
      const onAbort = () => killTree(child, { spawnImpl, platform, group: ownGroup });
      signal?.addEventListener("abort", onAbort, { once: true });
      const done = (code) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        signal?.removeEventListener("abort", onAbort);
        out.end();
        err.end();
        resolve({ code, timedOut, lines, startedAt, endedAt: now() });
      };
      child.once("error", () => done(null));
      child.once("close", (code) => done(code));
    });
  };
}

/**
 * Wrangler, through the deploy command's `wranglerSpawn` (this Node running Wrangler's entry
 * script, no shell): standard input always piped and ended (empty when there is no input), standard
 * output and standard error kept apart, a time limit, SITE_SURVEY_DEPLOYMENT_KEY never in its
 * environment, CLOUDFLARE_ACCOUNT_ID once known. A call marked `cleanup` is not ended by an interrupt.
 */
export function createWranglerRunner({ root, env = process.env, spawnImpl = spawn, platform = process.platform, signal } = {}) {
  return (args, { input = "", timeoutMs = WRANGLER_TIMEOUT_MS, accountId = null, cleanup = false } = {}) => {
    assertWranglerArgs(args);
    const spec = wranglerSpawn(root, args);
    const childEnv = { ...childEnvironment(env) };
    if (accountId) childEnv.CLOUDFLARE_ACCOUNT_ID = accountId;
    // After an interrupt only cleanup calls start; any other resolves at once without a child.
    if (signal?.aborted && !cleanup) return Promise.resolve({ code: null, timedOut: false, stdout: "", stderr: "" });
    return new Promise((resolve) => {
      const child = spawnImpl(spec.command, spec.args, { ...spec.options, env: childEnv, stdio: ["pipe", "pipe", "pipe"] });
      const stdout = [];
      const stderr = [];
      child.stdout.on("data", (chunk) => stdout.push(Buffer.from(chunk)));
      child.stderr.on("data", (chunk) => stderr.push(Buffer.from(chunk)));
      let timedOut = false;
      let settled = false;
      const timer = setTimeout(() => {
        timedOut = true;
        killTree(child, { spawnImpl, platform });
      }, timeoutMs);
      const onAbort = () => killTree(child, { spawnImpl, platform });
      if (!cleanup) signal?.addEventListener("abort", onAbort, { once: true });
      const done = (code) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        signal?.removeEventListener("abort", onAbort);
        resolve({ code, timedOut, stdout: Buffer.concat(stdout).toString("utf8"), stderr: Buffer.concat(stderr).toString("utf8") });
      };
      child.once("error", () => done(null));
      child.once("close", (code) => done(code));
      child.stdin.on("error", () => {});
      child.stdin.end(input);
    });
  };
}

/**
 * `wrangler tail <worker> --format json` (the pinned Wrangler 4.164.0 declares the Worker as the
 * positional `worker`, `cli.js` about line 352766, not `--name`), standard input ignored, standard
 * output handed to `onText` (parsed by the caller, kept in memory), standard error counted in bytes
 * and dropped. Restarted, up to three times, if it ends before `stop()` (for example across a
 * redeploy). `exits()` answers each child's exit code and standard error length, never its content.
 */
export function createTailStarter({
  root,
  env = process.env,
  spawnImpl = spawn,
  platform = process.platform,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  stopLimitMs = TAIL_STOP_LIMIT_MS,
} = {}) {
  return async (worker, { accountId = null, onText }) => {
    assertWorkerName(worker);
    const args = ["tail", worker, "--format", "json"];
    const spec = wranglerSpawn(root, args);
    const childEnv = { ...childEnvironment(env) };
    if (accountId) childEnv.CLOUDFLARE_ACCOUNT_ID = accountId;
    let stopped = false;
    let restarts = 0;
    let child = null;
    let closed = Promise.resolve();
    const exits = [];
    const start = () => {
      child = spawnImpl(spec.command, spec.args, { ...spec.options, env: childEnv, stdio: ["ignore", "pipe", "pipe"] });
      let stderrBytes = 0;
      child.stdout.on("data", (chunk) => onText(Buffer.from(chunk).toString("utf8")));
      child.stderr.on("data", (chunk) => {
        stderrBytes += Buffer.byteLength(chunk);
      });
      closed = new Promise((resolve) => {
        child.once("error", () => resolve("failed to start"));
        child.once("close", (code) => resolve(code));
      }).then(async (code) => {
        exits.push({ exitCode: code ?? null, stoppedByRun: yesNo(stopped), stderrBytes });
        if (stopped || restarts >= 3) return;
        restarts += 1;
        await sleep(2_000);
        if (!stopped) start();
      });
    };
    start();
    return {
      restarts: () => restarts,
      exits: () => exits.map((exit) => ({ ...exit })),
      async stop() {
        stopped = true;
        killTree(child, { spawnImpl, platform });
        // A child that never reports `close` must not hold up the cleanup after it. The timer is
        // not unref'd: it may be the only thing keeping Node running while this waits, and an
        // unref'd one would let the process exit here, before the cleanup that follows. It is
        // cleared as soon as the race ends.
        let timer;
        const limit = new Promise((resolve) => {
          timer = setTimeout(resolve, stopLimitMs);
        });
        await Promise.race([closed, limit]);
        clearTimeout(timer);
      },
    };
  };
}

/**
 * `fetch` over node:https (or http) with a new connection for every request (`agent: false`, no
 * keep-alive), so copies of the Worker are not hidden behind one connection. Resolves to a real
 * `Response`; rejects with fixed text only.
 */
export function createFreshConnectionFetch({ httpsModule = https, httpModule = http, timeoutMs = REQUEST_TIMEOUT_MS } = {}) {
  return (url, init = {}) =>
    new Promise((resolve, reject) => {
      let target;
      try {
        target = new URL(url);
      } catch {
        reject(new AcceptanceError("An address could not be read."));
        return;
      }
      const transport = target.protocol === "https:" ? httpsModule : target.protocol === "http:" ? httpModule : null;
      if (!transport) {
        reject(new AcceptanceError("Only http and https addresses are used."));
        return;
      }
      const body = init.body === undefined ? undefined : Buffer.from(String(init.body));
      const headers = { ...(init.headers ?? {}) };
      if (body) headers["content-length"] = String(body.length);
      const request = transport.request(target, { method: init.method ?? "GET", headers, agent: false }, (response) => {
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("error", () => reject(new AcceptanceError("A reply could not be read.")));
        response.on("end", () => {
          const replyHeaders = new Headers();
          for (let index = 0; index + 1 < response.rawHeaders.length; index += 2) {
            try {
              replyHeaders.append(response.rawHeaders[index], response.rawHeaders[index + 1]);
            } catch {
              // A header the Headers class refuses is not needed.
            }
          }
          const status = response.statusCode ?? 0;
          if (status < 200 || status > 599) {
            reject(new AcceptanceError("A reply had an unusable status."));
            return;
          }
          const nullBody = [204, 205, 304].includes(status);
          resolve(new Response(nullBody ? null : Buffer.concat(chunks), { status, headers: replyHeaders }));
        });
      });
      request.setTimeout(timeoutMs, () => request.destroy(new AcceptanceError("A request timed out.")));
      request.on("error", () => reject(new AcceptanceError("A request failed.")));
      if (init.signal) {
        if (init.signal.aborted) request.destroy(new AcceptanceError("A request was cancelled."));
        else init.signal.addEventListener("abort", () => request.destroy(new AcceptanceError("A request was cancelled.")), { once: true });
      }
      request.end(body);
    });
}

/**
 * A visible question on the terminal. It answers "" when the run's `signal` aborts (an interrupt
 * `main` received, which it does not raise again) or the input ends, settling once either way.
 */
export function createAsk({ input = process.stdin, output = process.stdout, onInterrupt = () => process.emit("SIGINT"), signal } = {}) {
  return (question) =>
    new Promise((resolve) => {
      // An input that has already ended or been destroyed emits no further `end` or `close`: answer
      // at once rather than wait for ever (pull request 13, review round 2).
      if (signal?.aborted || input.readableEnded || input.destroyed) {
        resolve("");
        return;
      }
      const reader = createInterface({ input, output, terminal: true });
      let answered = false;
      const settle = (answer) => {
        if (answered) return false;
        answered = true;
        signal?.removeEventListener("abort", onAbort);
        reader.close();
        resolve(answer);
        return true;
      };
      const onAbort = () => settle("");
      signal?.addEventListener("abort", onAbort, { once: true });
      // In terminal mode Ctrl-C reaches readline, not the process: pass it on, answer "".
      reader.on("SIGINT", () => {
        if (settle("")) onInterrupt();
      });
      // The input ended (end of file): nothing more can be typed.
      reader.on("close", () => settle(""));
      reader.question(question, (answer) => settle(answer));
    });
}

/**
 * A hidden question: raw mode, nothing echoed, the answer kept only in memory. Enter ends it,
 * backspace removes a character, Ctrl-C signals the interrupt and gives an empty answer. The run's
 * `signal` aborting, or the input ending, also gives an empty answer; it settles once, releases its
 * listeners and restores raw mode whichever way it ends.
 */
export function createAskHidden({ input = process.stdin, output = process.stdout, onInterrupt = () => process.emit("SIGINT"), signal } = {}) {
  return (question) =>
    new Promise((resolve) => {
      // As `createAsk`: an input that has already ended answers at once (review round 2).
      if (signal?.aborted || input.readableEnded || input.destroyed) {
        resolve("");
        return;
      }
      output.write(question);
      let answer = "";
      let done = false;
      const wasRaw = Boolean(input.isRaw);
      input.setRawMode?.(true);
      input.resume();
      const finish = (value) => {
        if (done) return;
        done = true;
        input.off("data", onData);
        input.off("end", onEnd);
        input.off("close", onEnd);
        signal?.removeEventListener("abort", onEnd);
        input.setRawMode?.(wasRaw);
        input.pause();
        output.write("\n");
        resolve(value);
      };
      const onEnd = () => finish("");
      const onData = (chunk) => {
        for (const character of Buffer.from(chunk).toString("utf8")) {
          if (character === "\r" || character === "\n") return finish(answer);
          if (character === "\u0003") {
            // Raw mode turns Ctrl-C into input: signal the interrupt, then answer "".
            onInterrupt();
            return finish("");
          }
          if (character === "\u007f" || character === "\b") answer = [...answer].slice(0, -1).join("");
          else if (character >= " ") answer += character;
        }
      };
      input.on("data", onData);
      input.on("end", onEnd);
      input.on("close", onEnd);
      signal?.addEventListener("abort", onEnd, { once: true });
    });
}

/** The real effects `main` gives `runAcceptance`. */
export function createRealEffects({ root, signal, env = process.env, spawnImpl = spawn, platform = process.platform, stdin = process.stdin, stdout = process.stdout, print = (line) => console.log(line) } = {}) {
  const now = Date.now;
  const sleep = (ms) =>
    new Promise((resolve, reject) => {
      if (signal?.aborted) {
        reject(new Interrupted("interrupted"));
        return;
      }
      const timer = setTimeout(() => {
        signal?.removeEventListener("abort", onAbort);
        resolve();
      }, ms);
      const onAbort = () => {
        clearTimeout(timer);
        reject(new Interrupted("interrupted"));
      };
      signal?.addEventListener("abort", onAbort, { once: true });
    });
  const plainSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  return {
    deployCommand: createDeployCommand({ root, env, spawnImpl, now, platform, signal }),
    wrangler: createWranglerRunner({ root, env, spawnImpl, platform, signal }),
    startTail: createTailStarter({ root, env, spawnImpl, platform, sleep: plainSleep }),
    fetch: createFreshConnectionFetch(),
    now,
    sleep,
    cleanupSleep: plainSleep,
    isTTY: Boolean(stdin.isTTY),
    // A first interrupt ends an open question too, so the run reaches the cleanup.
    ask: createAsk({ input: stdin, output: stdout, signal }),
    askHidden: createAskHidden({ input: stdin, output: stdout, signal }),
    print,
  };
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
  const controller = new AbortController();
  let interrupts = 0;
  const onSignal = () => {
    interrupts += 1;
    if (interrupts === 1) {
      console.log("Interrupt received: ending the current step, then deleting the test Workers.");
      controller.abort();
      return;
    }
    console.log("Interrupted again: cleanup did not finish. Delete site-studio-test-15a, -15b and -15c by hand and check they are gone.");
    process.exit(130);
  };
  process.on("SIGINT", onSignal);
  process.on("SIGTERM", onSignal);
  process.on("unhandledRejection", () => {
    console.error("An unhandled rejection occurred in the acceptance run.");
    process.exitCode = 1;
  });
  try {
    const record = await runAcceptance(createRealEffects({ root, signal: controller.signal }), { signal: controller.signal });
    console.log(`Run finished at ${record.finishedAt}: exit code ${record.exitCode}${record.stopped ? ` (stopped: ${record.stopped})` : ""}.`);
    process.exitCode = record.exitCode;
  } catch {
    console.error("The acceptance run failed before it could record its result. Check the account for site-studio-test-15a, -15b and -15c by hand.");
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
