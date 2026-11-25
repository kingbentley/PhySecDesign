// Story 1.5, spec 9: the deployed acceptance script (deploy/acceptance/two-step.mjs), tried against
// fakes only: a fake Wrangler world, the real deploy command's `runDeploy` bound to that world, a fake
// API and a fake tail, on a virtual clock. Nothing here starts Wrangler or reaches Cloudflare.
// Every key, password and code is generated at run time; none is written in this file.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { EventEmitter } from "node:events";
import { describe, it } from "node:test";
import {
  createKeyStateActions,
  DEPLOYMENT_KEY_ENV,
  DEPLOYMENT_KEY_SECRET,
  generateDeploymentKey,
  generateSetupCode,
  KEY_LINES,
  parseSecretList,
  runDeploy,
  waitForSetupState,
} from "../scripts/deploy-cloudflare.mjs";
import {
  ACCOUNT_NAME,
  base32Decode,
  base32Encode,
  check10Pass,
  check11Pass,
  check12Pass,
  check13Pass,
  check14aPass,
  check14bPass,
  check14cPass,
  check14dPass,
  check1Pass,
  check2Pass,
  check3Pass,
  check4Pass,
  check5Pass,
  check6Pass,
  check9Pass,
  checkAccount,
  cleanupPass,
  createCookieJar,
  createDeployCommand,
  killTree,
  createFreshConnectionFetch,
  createJsonObjectStream,
  createRealEffects,
  createTailStarter,
  createWranglerRunner,
  deriveWorkerAddress,
  evaluatePutPolls,
  exitCodeFor,
  fixedMessage,
  AcceptanceError,
  createAsk,
  createAskHidden,
  hotp,
  isNotFound,
  sameNames,
  valueInOutput,
  readDeployLines,
  runAcceptance,
  stepAt,
  summariseTail,
  tailOutcome,
  totpCode,
  WORKERS,
} from "../deploy/acceptance/two-step.mjs";
import { pollAfterPut } from "../deploy/acceptance/two-step.mjs";

const ACCOUNT_ID = "0123456789abcdef0123456789abcdef";
const SUB = "acceptance-sub";
const addressOf = (name) => `https://${name}.${SUB}.workers.dev`;
const randomHex = (bytes) => randomBytes(bytes).toString("hex");

/** What `promise` settles to within `ms` (real time), or "still pending": a hung prompt fails an assertion, not the run. */
async function settledWithin(promise, ms = 500) {
  let timer;
  const pending = new Promise((resolve) => {
    timer = setTimeout(() => resolve("still pending"), ms);
  });
  try {
    return await Promise.race([promise, pending]);
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------------------------
// A virtual clock: `sleep` registers a timer; when every task is waiting, the earliest one fires.

function virtualClock(start = Date.UTC(2026, 10, 24, 12, 0, 7)) {
  let time = start;
  let sequence = 0;
  let scheduled = false;
  const timers = [];
  const schedule = () => {
    if (scheduled || timers.length === 0) return;
    scheduled = true;
    setImmediate(pump);
  };
  function pump() {
    scheduled = false;
    if (timers.length === 0) return;
    timers.sort((left, right) => left.at - right.at || left.sequence - right.sequence);
    const next = timers.shift();
    if (next.at > time) time = next.at;
    next.resolve();
    schedule();
  }
  return {
    now: () => time,
    sleep: (ms) =>
      new Promise((resolve) => {
        timers.push({ at: time + Math.max(0, ms), sequence: sequence++, resolve });
        schedule();
      }),
  };
}

// ---------------------------------------------------------------------------------------------
// The fake world: Workers with secrets and an installation each, Wrangler, the API and the tail.

function fakeReply(status, body, cookies = []) {
  return {
    status,
    headers: { getSetCookie: () => [...cookies], get: () => null },
    json: async () => {
      if (body === undefined) throw new SyntaxError("not JSON");
      return structuredClone(body);
    },
    body: { cancel: async () => {} },
  };
}

function refusal(status, code) {
  return fakeReply(status, { error: { code, message: "A refusal." } });
}

function makeWorld({ accounts = [{ name: ACCOUNT_NAME, id: ACCOUNT_ID }], existing = [], quirks = {} } = {}) {
  const clock = virtualClock();
  const world = {
    clock,
    quirks,
    workers: new Map(),
    wranglerCalls: [],
    deploys: [],
    tails: new Set(),
    secrets: new Set(),
    // The authenticator codes the API was sent (6 digits, too short for `secrets`), for assertNoLeak.
    codes: new Set(),
    codeSignIns: 0,
    tailEventsSent: 0,
  };
  const track = (value) => {
    if (typeof value === "string" && value.length >= 8) world.secrets.add(value);
    return value;
  };
  const newWorker = (name) => ({ name, secrets: new Map(), previousKey: null, keyChangedAt: -Infinity, staleMs: 0, inst: newInstallation() });
  const newInstallation = () => ({ accounts: new Map(), fingerprintKey: null, sessions: new Map(), pendings: new Map(), invitations: new Map(), setupCalls: 0, startCalls: 0 });
  for (const name of existing) world.workers.set(name, newWorker(name));

  const setSecret = (worker, name, value, staleMs) => {
    if (name === DEPLOYMENT_KEY_SECRET) {
      worker.previousKey = worker.secrets.get(name) ?? null;
      worker.keyChangedAt = clock.now();
      worker.staleMs = staleMs;
    }
    worker.secrets.set(name, value);
  };
  const removeSecret = (worker, name, staleMs) => {
    if (name === DEPLOYMENT_KEY_SECRET) {
      worker.previousKey = worker.secrets.get(name) ?? null;
      worker.keyChangedAt = clock.now();
      worker.staleMs = staleMs;
    }
    worker.secrets.delete(name);
  };
  // The key a request sees: for a while after a change, copies still answer with the earlier one.
  const keyFor = (worker) => (clock.now() < worker.keyChangedAt + worker.staleMs ? worker.previousKey : worker.secrets.get(DEPLOYMENT_KEY_SECRET) ?? null);
  const keyState = (worker) => {
    const key = keyFor(worker);
    const usable = typeof key === "string" && key.length === 43;
    if (worker.inst.fingerprintKey === null) return { fingerprint: "none", key: usable ? "present" : "none" };
    if (!usable) return { fingerprint: "stored", key: "none" };
    return { fingerprint: "stored", key: key === worker.inst.fingerprintKey ? "matches" : "mismatch" };
  };

  world.wrangler = async (args, { input = "", accountId = null, internal = false } = {}) => {
    if (!internal) world.wranglerCalls.push({ args: [...args], input, accountId });
    if (input) track(input);
    await clock.sleep(1_500);
    const named = args[args.indexOf("--name") + 1];
    const worker = world.workers.get(named);
    const notFound = { code: 1, timedOut: false, stdout: "", stderr: `✘ [ERROR] Worker "${named}" not found.\n\nIf this is a new Worker, run \`wrangler deploy\` first to create it.\n` };
    if (args[0] === "whoami") {
      return { code: 0, timedOut: false, stdout: JSON.stringify({ loggedIn: true, authType: "OAuth Token", email: "private.person@example.test", accounts, tokenPermissions: [] }), stderr: "" };
    }
    if (args[0] === "secret" && args[1] === "list") {
      if (!worker) return notFound;
      const json = JSON.stringify([...worker.secrets.keys()].map((name) => ({ name, type: "secret_text" })), null, "  ");
      return { code: 0, timedOut: false, stdout: `${quirks.listWarningOnStdout ? "▲ [WARNING] A warning [here]\n" : ""}${json}\n`, stderr: "" };
    }
    if (args[0] === "secret" && args[1] === "put") {
      const name = args[2];
      if (/\s/.test(name) && !quirks.invalidPutExitsZero) return { code: 1, timedOut: false, stdout: "", stderr: "✘ [ERROR] A request to the Cloudflare API failed.\n" };
      let target = worker;
      if (!target) {
        target = newWorker(named);
        world.workers.set(named, target);
      }
      setSecret(target, name, input, quirks.handPutStaleMs ?? 9_000);
      return { code: 0, timedOut: false, stdout: "Success! Uploaded secret.\n", stderr: "" };
    }
    if (args[0] === "secret" && args[1] === "delete") {
      world.lastDeleteInput = input;
      if (!worker) return notFound;
      if (!worker.secrets.has(args[2])) return quirks.absentDeleteExitsZero ? { code: 0, timedOut: false, stdout: "", stderr: "" } : { code: 1, timedOut: false, stdout: "", stderr: "✘ [ERROR] secret not found\n" };
      removeSecret(worker, args[2], quirks.handPutStaleMs ?? 9_000);
      return { code: 0, timedOut: false, stdout: "Success! Deleted secret.\n", stderr: "" };
    }
    if (args[0] === "delete") {
      if (quirks.deleteRemovesNothing) return { code: 0, timedOut: false, stdout: "Successfully deleted\n", stderr: "" };
      if (!worker) return { code: 1, timedOut: false, stdout: "", stderr: "✘ [ERROR] This Worker does not exist on your account.\n" };
      world.workers.delete(named);
      return { code: 0, timedOut: false, stdout: "Successfully deleted\n", stderr: "" };
    }
    return { code: 1, timedOut: false, stdout: "", stderr: "unknown command" };
  };

  const emitTail = (name, path) => {
    for (const tail of world.tails) {
      if (tail.worker !== name) continue;
      world.tailEventsSent += 1;
      const event = {
        outcome: quirks.tailException ? "exception" : "ok",
        exceptions: quirks.tailException ? [{ name: "OperationError", message: "a message that is not kept {}" }] : [],
        logs: [{ message: ['a log with "quotes" and {braces} and \\ escapes'], level: "log" }],
        event: { request: { url: `${addressOf(name)}${path}`, headers: { cookie: "__Host-ssd-x=value-not-kept" } } },
      };
      const text = `noise before {not json\n${JSON.stringify(event, null, 4)}\nmore noise }\n`;
      for (let index = 0; index < text.length; index += 7) tail.onText(text.slice(index, index + 7));
    }
  };

  const cookieValue = (headers, prefix) => {
    const header = headers?.cookie ?? "";
    for (const part of header.split(";")) {
      const [name, ...rest] = part.trim().split("=");
      if (name.startsWith(prefix)) return rest.join("=");
    }
    return null;
  };
  const verifyCode = (account, code) => {
    const now = stepAt(clock.now());
    for (const step of [now - 1, now, now + 1]) if (step > account.lastStep && totpCode(account.secret, step) === code) return step;
    return null;
  };
  const sessionFor = (inst, headers) => {
    const token = cookieValue(headers, "__Host-ssd-s");
    return token ? inst.sessions.get(token) ?? null : null;
  };
  const newSession = (inst, email) => {
    const token = track(randomHex(32));
    inst.sessions.set(token, email);
    return `__Host-ssd-s-a1=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000`;
  };

  world.fetch = async (url, init = {}) => {
    await clock.sleep(100);
    const target = new URL(url);
    const name = target.hostname.split(".")[0];
    const worker = world.workers.get(name);
    if (!worker || !target.hostname.endsWith(`.${SUB}.workers.dev`)) return fakeReply(404, undefined);
    emitTail(name, target.pathname);
    const inst = worker.inst;
    const method = init.method ?? "GET";
    const headers = init.headers ?? {};
    const route = target.pathname;
    if (method === "GET") {
      if (route === "/api/v1/status") return fakeReply(200, { release: "test" });
      if (route === "/api/v1/setup/state") return fakeReply(200, { state: inst.accounts.size > 0 ? "closed" : "open" });
      if (route === "/api/v1/deployment-key/state") return fakeReply(200, keyState(worker));
      if (route === "/api/v1/session") {
        const email = sessionFor(inst, headers);
        const account = email ? inst.accounts.get(email) : null;
        return fakeReply(200, account ? { signedIn: true, name: account.name, role: account.role } : { signedIn: false, installationName: "Acceptance 15a" });
      }
      return fakeReply(404, undefined);
    }
    if (headers.origin !== target.origin || headers["x-site-survey-design"] !== "1") return refusal(403, "origin_refused");
    let body;
    try {
      body = JSON.parse(init.body);
    } catch {
      return refusal(400, "invalid_input");
    }
    if (route === "/api/v1/setup") {
      inst.setupCalls += 1;
      world.setupRequests = (world.setupRequests ?? 0) + 1;
      const notConfigured = quirks.setupNotConfiguredFirst ?? 0;
      if (inst.setupCalls <= notConfigured) return refusal(503, "setup_code_not_configured");
      if (inst.setupCalls <= notConfigured + (quirks.setupReplacedFirst ?? 0)) return refusal(409, "setup_code_replaced");
      if (quirks.setupAlwaysWrong) return refusal(403, "setup_code_wrong");
      if (inst.accounts.size > 0) return refusal(409, "setup_closed");
      if (!body.code || body.code !== worker.secrets.get("SETUP_CODE")) return refusal(403, "setup_code_wrong");
      track(body.password);
      inst.accounts.set(body.email, { email: body.email, name: body.name, password: body.password, role: "administrator", secret: null, lastStep: -1, recovery: new Set(), setup: null });
      return fakeReply(200, { installationName: body.installationName, email: body.email });
    }
    if (route === "/api/v1/session/sign-in") {
      const account = inst.accounts.get(body.email);
      if (!account || account.password !== body.password) return refusal(401, "signin_failed");
      if (account.secret) {
        const token = track(randomHex(32));
        inst.pendings.set(token, account.email);
        return fakeReply(200, { secondStep: true }, [`__Host-ssd-p-a1=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=300`]);
      }
      return fakeReply(200, { name: account.name }, [newSession(inst, account.email)]);
    }
    if (route === "/api/v1/session/second-step") {
      const token = cookieValue(headers, "__Host-ssd-p");
      const email = token ? inst.pendings.get(token) : null;
      const account = email ? inst.accounts.get(email) : null;
      if (!account) return refusal(401, "second_step_expired");
      // A handler that answers 200 and the name but sets no session cookie (finding C2's case).
      let noSession = false;
      if (body.method === "code") {
        world.codes.add(String(body.code));
        if (quirks.secondStepRefuses) return refusal(401, "second_step_code_wrong");
        if (keyFor(worker) !== inst.fingerprintKey) return refusal(503, "deployment_key_mismatch");
        const step = verifyCode(account, body.code);
        if (step === null) return refusal(401, "second_step_code_wrong");
        account.lastStep = step;
        world.codeSignIns += 1;
        noSession = Boolean(quirks.noSessionOnCodeSignIn?.includes(world.codeSignIns));
      } else {
        if (!account.recovery.has(body.code)) return refusal(401, "second_step_recovery_code_wrong");
        account.recovery.delete(body.code);
        noSession = Boolean(quirks.noSessionOnRecovery);
      }
      inst.pendings.delete(token);
      const clearPending = "__Host-ssd-p-a1=; Max-Age=0; Path=/; Secure; HttpOnly; SameSite=Strict";
      return fakeReply(200, { name: account.name }, noSession ? [clearPending] : [newSession(inst, account.email), clearPending]);
    }
    if (route === "/api/v1/account/two-step/start") {
      const email = sessionFor(inst, headers);
      const account = email ? inst.accounts.get(email) : null;
      if (!account) return refusal(401, "not_signed_in");
      if (account.password !== body.password) return refusal(403, "two_step_password_wrong");
      inst.startCalls += 1;
      const key = keyFor(worker);
      if (!key || inst.startCalls <= (quirks.startKeyMissingFirst ?? 0)) return refusal(503, "deployment_key_missing");
      if (inst.fingerprintKey !== null && key !== inst.fingerprintKey) return refusal(503, "deployment_key_mismatch");
      const secret = track(base32Encode(randomBytes(20)));
      const setupId = track(randomHex(16));
      account.setup = { setupId, secret };
      return fakeReply(200, { setupId, secret, otpauthUri: `otpauth://totp/x?secret=${secret}`, installationName: "Acceptance 15a", email });
    }
    if (route === "/api/v1/account/two-step/confirm") {
      const email = sessionFor(inst, headers);
      const account = email ? inst.accounts.get(email) : null;
      if (!account) return refusal(401, "not_signed_in");
      if (!account.setup || account.setup.setupId !== body.setupId) return refusal(409, "two_step_setup_expired");
      world.codes.add(String(body.code));
      const step = verifyCode({ secret: account.setup.secret, lastStep: account.lastStep }, body.code);
      if (step === null) return refusal(403, "two_step_code_wrong");
      account.secret = account.setup.secret;
      account.setup = null;
      account.lastStep = step;
      if (inst.fingerprintKey === null) inst.fingerprintKey = keyFor(worker);
      const codes = Array.from({ length: 10 }, () => track(randomHex(8)));
      account.recovery = new Set(codes);
      return fakeReply(200, { recoveryCodes: codes });
    }
    if (route === "/api/v1/invitations") {
      world.inviteRequests = (world.inviteRequests ?? 0) + 1;
      if (quirks.inviteUnauthorizedFirst && world.inviteRequests === 1) return refusal(401, "not_signed_in");
      const email = sessionFor(inst, headers);
      if (!email) return refusal(401, "not_signed_in");
      const secret = track(randomBytes(32).toString("base64url"));
      inst.invitations.set(secret, { email: body.email, name: body.name });
      return fakeReply(200, { link: `${target.origin}/invite#${secret}`, expiresAt: new Date(clock.now() + 7 * 86_400_000).toISOString() });
    }
    if (route === "/api/v1/invitations/accept") {
      const invitation = inst.invitations.get(body.secret);
      if (!invitation) return refusal(410, "invitation_unusable");
      inst.invitations.delete(body.secret);
      track(body.password);
      inst.accounts.set(invitation.email, { email: invitation.email, name: body.name, password: body.password, role: "standard", secret: null, lastStep: -1, recovery: new Set(), setup: null });
      return fakeReply(200, { name: body.name }, [newSession(inst, invitation.email)]);
    }
    return fakeReply(404, undefined);
  };

  // The deploy command: the real `runDeploy`, bound to this world.
  world.deployCommand = async (worker, { key = null, accountId } = {}) => {
    assert.match(worker, /^site-studio-test-15[abc]$/);
    world.deploys.push({ worker, keySupplied: key !== null, accountId });
    const lines = [];
    const startedAt = clock.now();
    const keyStateActions = createKeyStateActions({ fetchImpl: world.fetch, sleep: clock.sleep, now: clock.now });
    const code = await runDeploy({
      env: key === null ? {} : { [DEPLOYMENT_KEY_ENV]: key },
      deploy: async () => {
        await clock.sleep(quirks.buildMs ?? 40_000);
        let target = world.workers.get(worker);
        if (!target) {
          target = newWorker(worker);
          world.workers.set(worker, target);
        } else if (quirks.redeployDropsKey) {
          removeSecret(target, DEPLOYMENT_KEY_SECRET, 0);
        }
        return { workerName: worker, targets: [addressOf(worker)] };
      },
      listSecrets: async (name) => {
        const result = await world.wrangler(["secret", "list", "--name", name, "--format", "json"], { accountId, internal: true });
        const names = parseSecretList(result.stdout);
        if (!names) throw new Error("listing failed");
        return names;
      },
      askKeyState: keyStateActions.askKeyState,
      settleKeyState: keyStateActions.settleKeyState,
      askState: (address) => waitForSetupState(address, { fetchImpl: world.fetch, sleep: clock.sleep, now: clock.now }),
      putSecret: async (name, secretName, value) => {
        await clock.sleep(2_000);
        setSecret(world.workers.get(name), secretName, value, 9_000);
      },
      deleteSecret: async (name, secretName) => {
        await clock.sleep(2_000);
        removeSecret(world.workers.get(name), secretName, 9_000);
      },
      print: (text) => lines.push({ stream: "out", text, at: clock.now() }),
      printError: (text) => lines.push({ stream: "err", text, at: clock.now() }),
      generate: () => track(generateSetupCode()),
      generateKey: () => {
        world.generatedKey = track(generateDeploymentKey());
        return world.generatedKey;
      },
    });
    // A deploy after the first that shows the key in another form than the "Deployment key" line.
    if (quirks.keyInOtherForm && world.deploys.length > 1) lines.push({ stream: "err", text: `debug: DEPLOYMENT_KEY="${world.generatedKey}"`, at: clock.now() });
    // A deploy that echoes whatever key it was supplied, the wrong key of check 14 (a) included.
    if (quirks.echoSuppliedKey && key !== null) lines.push({ stream: "out", text: `debug: supplied ${key}`, at: clock.now() });
    return { code, timedOut: false, lines, startedAt, endedAt: clock.now() };
  };

  world.startTail = async (worker, { onText }) => {
    const tail = { worker, onText };
    world.tails.add(tail);
    return { restarts: () => 0, stop: async () => world.tails.delete(tail) };
  };
  return world;
}

async function dryRun({ quirks, accounts, existing, isTTY = false, answers = [], hiddenAnswers, wrap = (effects) => effects, signal, onPrint } = {}) {
  const world = makeWorld({ quirks, accounts, existing });
  const prints = [];
  const asked = [];
  const effects = {
    deployCommand: world.deployCommand,
    wrangler: world.wrangler,
    startTail: world.startTail,
    fetch: world.fetch,
    now: world.clock.now,
    sleep: world.clock.sleep,
    isTTY,
    ask: async (question) => {
      asked.push(question);
      return answers.shift() ?? "";
    },
    askHidden: async () => {
      const value = hiddenAnswers ? hiddenAnswers.shift() : randomBytes(18).toString("base64url");
      world.secrets.add(value);
      return value;
    },
    print: (line) => {
      prints.push(line);
      onPrint?.(line);
    },
    generateKey: () => {
      const key = generateDeploymentKey();
      world.secrets.add(key);
      return key;
    },
    generatePassword: () => {
      const password = randomBytes(24).toString("base64url");
      world.secrets.add(password);
      return password;
    },
  };
  const record = await runAcceptance(wrap(effects, world), { signal });
  return { record, prints, world, asked };
}

/** Every string in a parsed value (keys and string values); numbers, booleans and null are left out. */
function stringsIn(value, out = []) {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) for (const item of value) stringsIn(item, out);
  else if (value && typeof value === "object") for (const [key, item] of Object.entries(value)) out.push(key), stringsIn(item, out);
  return out;
}

/**
 * Whether a six-digit authenticator code shows as a whole digit run in a string of the record or of
 * a printed line. JSON numbers (times, counts, statuses) are left out, so a count or a time that
 * happens to equal a code is not a false hit; a printed line's JSON part is read as JSON.
 */
function codeShown(record, prints, codes) {
  const texts = stringsIn(JSON.parse(JSON.stringify(record)));
  for (const line of prints) {
    const start = line.search(/[[{]/);
    let parsed;
    try {
      parsed = start === -1 ? undefined : JSON.parse(line.slice(start));
    } catch {
      parsed = undefined;
    }
    if (parsed === undefined) texts.push(line);
    else texts.push(line.slice(0, start), ...stringsIn(parsed));
  }
  return [...codes].filter((code) => /^\d{6}$/.test(code)).some((code) => texts.some((text) => new RegExp(`(^|\\D)${code}(\\D|$)`).test(text)));
}

/** Nothing secret in the record or any printed line (keys, codes, passwords, secrets, tokens, links). */
function assertNoLeak({ record, prints, world }) {
  const blob = `${JSON.stringify(record)}\n${prints.join("\n")}`;
  assert.ok(world.secrets.size > 0);
  for (const secret of world.secrets) assert.ok(!blob.includes(secret), "a secret value reached the record or the printed output");
  assert.ok(!codeShown(record, prints, world.codes), "an authenticator code reached the record or the printed output");
  assert.ok(!blob.includes("private.person@example.test"), "the signed-in email reached the record");
  assert.ok(!blob.includes("value-not-kept") && !blob.includes("quotes"), "raw tail content reached the record");
  for (const call of world.wranglerCalls) {
    for (const arg of call.args) for (const secret of world.secrets) assert.ok(!String(arg).includes(secret), "a secret value was in a command-line argument");
  }
  // The whole record is printed as the last line, and it is the record (checked above for secrets).
  const last = prints.at(-1);
  assert.ok(last.startsWith("Record: "));
  assert.deepEqual(JSON.parse(last.slice("Record: ".length)), JSON.parse(JSON.stringify(record)));
}

let happy;
const happyRun = () => (happy ??= dryRun());

// ---------------------------------------------------------------------------------------------

describe("RFC 6238 helper", () => {
  it("matches RFC 6238's SHA-1 test vectors (last 6 digits)", () => {
    const secret = Buffer.from("12345678901234567890", "ascii");
    const vectors = [
      [59, "287082"],
      [1111111109, "081804"],
      [1111111111, "050471"],
      [1234567890, "005924"],
      [2000000000, "279037"],
      [20000000000, "353130"],
    ];
    for (const [seconds, code] of vectors) assert.equal(hotp(secret, stepAt(seconds * 1000), 6), code);
  });

  it("reads base32 the way it writes it, and totpCode is HOTP of the decoded secret", () => {
    const bytes = randomBytes(20);
    const text = base32Encode(bytes);
    assert.deepEqual(base32Decode(text), bytes);
    assert.deepEqual(base32Decode(text.toLowerCase().replace(/(.{4})/g, "$1 ")), bytes);
    assert.equal(totpCode(text, 1234), hotp(bytes, 1234, 6));
    assert.throws(() => base32Decode("not base32!"), AcceptanceError);
  });
});

describe("tail stream parser", () => {
  it("parses events split across chunks, with braces and escapes inside strings and noise between", () => {
    const seen = [];
    const stream = createJsonObjectStream((value) => seen.push(value));
    const first = { outcome: "ok", exceptions: [], logs: [{ message: ['a "quoted" {brace} \\ and }'] }] };
    const second = { outcome: "exception", exceptions: [{ name: "OperationError", message: "x" }] };
    const text = `starting...\n${JSON.stringify(first, null, 4)}\nnot json } here, a stray { there\n${JSON.stringify(second, null, 4)}\nand } {"broken": }`;
    for (let index = 0; index < text.length; index += 3) stream.push(text.slice(index, index + 3));
    assert.deepEqual(seen, [first, second]);
  });

  it("keeps every event after a stray unclosed { in other text, followed only by well-formed events", () => {
    const seen = [];
    const stream = createJsonObjectStream((value) => seen.push(value));
    const events = [{ outcome: "ok", exceptions: [] }, { outcome: "exception", exceptions: [{ name: "Error" }] }, { outcome: "ok", exceptions: [], logs: [{ nested: { a: 1 } }] }];
    const text = `Connecting { never closed\n${events.map((event) => JSON.stringify(event, null, 4)).join("\n")}\n`;
    for (let index = 0; index < text.length; index += 5) stream.push(text.slice(index, index + 5));
    assert.deepEqual(seen, events);
  });

  it("keeps only each event's outcome and exception names, and summarises them", () => {
    assert.deepEqual(tailOutcome({ outcome: "ok", exceptions: [], logs: ["kept nowhere"], event: { request: { headers: { cookie: "c" } } } }), { outcome: "ok", exceptions: [] });
    assert.deepEqual(tailOutcome({ outcome: "exception", exceptions: [{ name: "OperationError", message: "m", stack: "s" }] }), { outcome: "exception", exceptions: ["OperationError"] });
    assert.deepEqual(tailOutcome({ outcome: "a value with spaces" }), { outcome: "unreadable", exceptions: [] });
    assert.deepEqual(summariseTail([{ outcome: "ok", exceptions: [] }, { outcome: "ok", exceptions: [] }]), { events: 2, byOutcome: { ok: 2 }, exceptionNames: [], platformErrorSeen: "no" });
    assert.equal(summariseTail([{ outcome: "exception", exceptions: ["OperationError"] }]).platformErrorSeen, "yes");
    assert.equal(summariseTail([]).platformErrorSeen, "not observed (no events)");
  });
});

describe("cookie jar", () => {
  it("keeps name=value from each Set-Cookie, drops a cookie on Max-Age=0 and sends the rest back", () => {
    const jar = createCookieJar();
    assert.equal(jar.header(), undefined);
    jar.store(fakeReply(200, {}, ["a=1; HttpOnly; Path=/; Max-Age=300", "b=two=parts; Secure"]));
    assert.equal(jar.header(), "a=1; b=two=parts");
    jar.store(fakeReply(200, {}, ["a=; Max-Age=0; Path=/"]));
    assert.equal(jar.header(), "b=two=parts");
    jar.store({ headers: {} });
    assert.deepEqual(jar.names(), ["b"]);
  });
});

describe("pure pieces", () => {
  it("reads the deploy command's lines: the key and code into memory, counted, and other lines by exact text", () => {
    const key = generateDeploymentKey();
    const lines = [
      { stream: "out", text: KEY_LINES.oneAtATime, at: 1 },
      { stream: "out", text: `  Deployment key: ${key}`, at: 2 },
      { stream: "out", text: "Deployed to https://site-studio-test-15a.sub.workers.dev. Set-up is open.", at: 3 },
      { stream: "out", text: "  Set-up code: ABCDEFGH", at: 4 },
      { stream: "err", text: KEY_LINES.notOriginal, at: 5 },
    ];
    const out = readDeployLines(lines);
    assert.equal(out.key, key);
    assert.equal(out.keyLines, 1);
    assert.equal(out.setupCodeLines, 1);
    assert.equal(out.address, "https://site-studio-test-15a.sub.workers.dev");
    assert.ok(out.find(KEY_LINES.notOriginal, "err"));
    assert.equal(out.find(KEY_LINES.notOriginal, "out"), null);
  });

  it("derives 15b's address from 15a's workers.dev address", () => {
    assert.equal(deriveWorkerAddress("https://site-studio-test-15a.sub.workers.dev", WORKERS.b), "https://site-studio-test-15b.sub.workers.dev");
    assert.equal(deriveWorkerAddress("https://survey.example.com", WORKERS.b), null);
    assert.equal(deriveWorkerAddress(null, WORKERS.b), null);
  });

  it("reads not found only as a non-zero exit with Wrangler's not-found text", () => {
    assert.equal(isNotFound({ code: 1, stdout: "", stderr: `Worker "${WORKERS.a}" not found.` }, WORKERS.a), true);
    assert.equal(isNotFound({ code: 1, stdout: "", stderr: "Authentication error" }, WORKERS.a), false);
    assert.equal(isNotFound({ code: 0, stdout: `Worker "${WORKERS.a}" not found.`, stderr: "" }, WORKERS.a), false);
  });

  it("checks the account: exactly one, named PhySec Site Studio, and never records the email", () => {
    const ok = checkAccount({ code: 0, stdout: JSON.stringify({ email: "private.person@example.test", accounts: [{ name: ACCOUNT_NAME, id: ACCOUNT_ID }] }) });
    assert.equal(ok.ok, true);
    assert.deepEqual(ok.record, { whoamiExit: 0, readable: "yes", accounts: 1, namedAccountPresent: "yes", name: ACCOUNT_NAME, id: ACCOUNT_ID });
    const two = checkAccount({ code: 0, stdout: JSON.stringify({ accounts: [{ name: ACCOUNT_NAME, id: ACCOUNT_ID }, { name: "Other", id: ACCOUNT_ID }] }) });
    assert.equal(two.ok, false);
    assert.equal(checkAccount({ code: 0, stdout: "not json {" }).ok, false);
    assert.ok(!JSON.stringify(two.record).includes("Other"));
  });

  it("records only fixed text for errors that are not the script's own", () => {
    assert.equal(fixedMessage(new AcceptanceError("A request failed.")), "A request failed.");
    assert.equal(fixedMessage(new SyntaxError("Unexpected token in {\"secret\":\"x\"}")), "unexpected SyntaxError");
  });
});

describe("pass tests", () => {
  it("check 1: one key line, a well-formed key, one set-up code, an address and the secret listed", () => {
    const good = { exitCode: 0, timedOut: false, keyLines: 1, keyWellFormed: true, setupCodeLines: 1, listed: true, address: "https://a" };
    assert.equal(check1Pass(good).pass, true);
    assert.equal(check1Pass({ ...good, keyLines: 2 }).pass, false);
    assert.equal(check1Pass({ ...good, listed: false }).pass, false);
    assert.equal(check1Pass(good).record.printedOnce, "yes");
  });

  it("check 9: only the JSON array on standard output passes; a warning on standard output fails, one on standard error does not", () => {
    const json = JSON.stringify([{ name: "DEPLOYMENT_KEY", type: "secret_text" }], null, "  ");
    assert.equal(check9Pass({ exitCode: 0, stdout: `${json}\n`, stderr: "" }).pass, true);
    const warned = check9Pass({ exitCode: 0, stdout: `[WARNING] x\n${json}`, stderr: "" });
    assert.equal(warned.pass, false);
    assert.equal(warned.record.otherStdoutBytes, Buffer.byteLength("[WARNING] x"));
    const onErr = check9Pass({ exitCode: 0, stdout: json, stderr: "warning" });
    assert.equal(onErr.pass, true);
    assert.deepEqual([onErr.record.stderrWritten, onErr.record.stderrLength], ["yes", 7]);
  });

  it("check 3 fails when the redeploy's output holds a Deployment key line (deliberate breakage 1)", () => {
    const key = generateDeploymentKey();
    const lines = [
      { stream: "out", text: KEY_LINES.oneAtATime, at: 1 },
      { stream: "out", text: `  Deployment key: ${key}`, at: 2 },
      { stream: "out", text: KEY_LINES.kept, at: 3 },
    ];
    const out = readDeployLines(lines);
    const good = { exitCode: 0, timedOut: false, keyLines: 0, keyValueInOutput: false, keptLine: true, listed: true, listUnchanged: true };
    const result = check3Pass({ ...good, keyLines: out.keyLines, keptLine: Boolean(out.find(KEY_LINES.kept, "out")) });
    assert.equal(result.pass, false);
    assert.equal(check3Pass(good).pass, true);
    assert.ok(!JSON.stringify(result.record).includes(key));
  });

  it("check 3 fails when the key value shows in another form, or the secret list changed", () => {
    const good = { exitCode: 0, timedOut: false, keyLines: 0, keyValueInOutput: false, keptLine: true, listed: true, listUnchanged: true };
    const key = generateDeploymentKey();
    const lines = [{ stream: "err", text: `debug: ${key}.`, at: 1 }];
    assert.equal(valueInOutput(lines, [key, null]), true);
    assert.equal(valueInOutput(lines, [generateDeploymentKey()]), false);
    const leaked = check3Pass({ ...good, keyValueInOutput: valueInOutput(lines, [key]) });
    assert.equal(leaked.pass, false);
    assert.equal(leaked.record.keyValueInOutput, "yes");
    assert.ok(!JSON.stringify(leaked.record).includes(key));
    assert.equal(sameNames(["DEPLOYMENT_KEY", "SETUP_CODE"], ["SETUP_CODE", "DEPLOYMENT_KEY"]), true);
    assert.equal(sameNames(["DEPLOYMENT_KEY", "SETUP_CODE"], ["DEPLOYMENT_KEY", "SETUP_CODE", "OTHER"]), false);
    assert.equal(check3Pass({ ...good, listUnchanged: false }).pass, false);
    assert.equal(check6Pass({ exitCode: 0, timedOut: false, keyLines: 0, keyValueInOutput: true, suppliedLine: true, listed: true }).pass, false);
  });

  it("check 2: set-up, sign-in, start and confirm answered 200, 10 codes, and the key state stored and matching", () => {
    const good = { setupStatus: 200, signInStatus: 200, startStatus: 200, confirmStatus: 200, recoveryCodes: 10, keyState: "stored/matches" };
    assert.equal(check2Pass(good).pass, true);
    assert.equal(check2Pass({ ...good, keyState: "stored/mismatch" }).pass, false);
    assert.equal(check2Pass({ ...good, recoveryCodes: 9 }).pass, false);
    assert.equal(check2Pass({ ...good, setupStatus: 403 }).pass, false);
  });

  it("checks 4, 5 and 6 pass and fail on what they name", () => {
    assert.equal(check4Pass({ signInStatus: 200, secondStep: true, secondStepStatus: 200, signedIn: true }).pass, true);
    assert.equal(check4Pass({ signInStatus: 200, secondStep: false, secondStepStatus: null, signedIn: false }).pass, false);
    assert.equal(check5Pass({ firstStatus: 200, firstSignedIn: true, secondStatus: 401, secondRefusal: "second_step_recovery_code_wrong", signInStatuses: [200, 200] }).pass, true);
    assert.equal(check5Pass({ firstStatus: 200, firstSignedIn: true, secondStatus: 200, secondRefusal: null, signInStatuses: [200, 200] }).pass, false);
    assert.equal(check6Pass({ exitCode: 0, timedOut: false, keyLines: 0, suppliedLine: true, listed: true }).pass, true);
    assert.equal(check6Pass({ exitCode: 0, timedOut: false, keyLines: 1, suppliedLine: true, listed: true }).pass, false);
  });

  it("check 13: last differing reply under 60 s passes; at 61 s it fails; not settled and the wrong final value fail", () => {
    const replies = (differUntilMs, stable = "matches", other = "mismatch") => {
      const list = [];
      for (let atMs = 0; atMs <= 180_000; atMs += 3_000) list.push({ atMs, key: atMs < differUntilMs ? other : stable });
      return list;
    };
    const quick = evaluatePutPolls(replies(10_000), "matches");
    assert.equal(quick.pass, true);
    assert.equal(quick.record.lastDifferingReplyMs, 9_000);
    const late = evaluatePutPolls([...replies(0).filter((reply) => reply.atMs !== 60_000), { atMs: 61_000, key: "mismatch" }].sort((a, b) => a.atMs - b.atMs), "matches");
    assert.equal(late.pass, false);
    assert.equal(late.record.lastDifferingReplyMs, 61_000);
    const unreadable = replies(0).map((reply) => (reply.atMs === 150_000 ? { ...reply, key: null } : reply));
    assert.equal(evaluatePutPolls(unreadable, "matches").record.final, "not settled");
    assert.equal(evaluatePutPolls(replies(0, "mismatch"), "matches").pass, false);
    assert.equal(evaluatePutPolls(replies(0), "matches").record.lastDifferingReplyMs, 0);
    const sparse = [...replies(0).filter((reply) => reply.atMs <= 120_000 && reply.atMs !== 120_000), { atMs: 150_000, key: "matches" }];
    const fewInFinal = evaluatePutPolls(sparse, "matches");
    assert.equal(fewInFinal.record.final, "not settled");
    assert.equal(fewInFinal.record.repliesInFinalWindow, 1);
    assert.equal(quick.record.repliesInFinalWindow, 21);
    assert.equal(check13Pass([quick, quick, quick, quick]).pass, true);
    assert.equal(check13Pass([quick, quick, quick, late]).pass, false);
  });

  it("checks 11, 12 and 14 (a) to (d) pass and fail on what they name", () => {
    assert.equal(check11Pass({ exitCode: 0, timedOut: false, absent: true }).pass, true);
    assert.equal(check11Pass({ exitCode: 0, timedOut: true, absent: true }).pass, false);
    assert.equal(check12Pass({ afterGenerated: true, afterSupplied: true, afterRestored: true }).pass, true);
    assert.equal(check12Pass({ afterGenerated: true, afterSupplied: true, afterRestored: null }).record.afterRestoredKey, "not run");
    assert.equal(check14aPass({ exitCode: 1, timedOut: false, checkingLine: true, notOriginalLine: true, absent: true, settleMs: 70_000 }).pass, true);
    assert.equal(check14aPass({ exitCode: 1, timedOut: false, checkingLine: true, notOriginalLine: true, absent: false, settleMs: 70_000 }).pass, false);
    const b = { exitCode: 0, timedOut: false, checkingLine: true, suppliedLine: true, listed: true, signInStatus: 200, secondStepStatus: 200, signedIn: true, settleMs: 70_000 };
    assert.equal(check14bPass(b).pass, true);
    assert.equal(check14bPass({ ...b, signedIn: false }).pass, false);
    const c = { handPutExit: 0, exitCode: 1, timedOut: false, checkingLine: true, manualDeleteLine: true, suppliedLine: false, listed: true, settledKey: "mismatch", settleMs: 70_000 };
    assert.equal(check14cPass(c).pass, true);
    assert.equal(check14cPass({ ...c, settledKey: "matches" }).pass, false);
    assert.equal(check14dPass({ a: 60_000, b: 120_000, c: 180_000 }).pass, true);
    assert.equal(check14dPass({ a: 59_999, b: 120_000, c: 180_000 }).pass, false);
    assert.equal(check14dPass({ a: 60_000, b: null, c: 180_001 }).pass, false);
  });

  it("check 10 passes on non-zero exits and is acceptable with not shown; cleanup needs every Worker confirmed gone", () => {
    assert.equal(check10Pass({ put: { exitCode: 1 }, del: { exitCode: 1 } }).pass, true);
    const notShown = check10Pass({ put: { exitCode: 0 }, del: { exitCode: null } });
    assert.equal(notShown.pass, false);
    assert.equal(notShown.acceptable, true);
    assert.equal(notShown.record.delete.outcome, "not shown");
    const killed = check10Pass({ put: { exitCode: 1, timedOut: true }, del: { exitCode: 1, timedOut: false } });
    assert.equal(killed.pass, false);
    assert.deepEqual([killed.record.put.outcome, killed.record.put.timedOut, killed.record.delete.outcome], ["not shown", "yes", "non-zero exit"]);
    assert.equal(cleanupPass([{ confirmedGone: "yes" }, { confirmedGone: "no" }]).pass, false);
  });

  it("the exit code is 0 only when every check meets its pass column", () => {
    const checks = {};
    for (const number of [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14]) checks[number] = { pass: true };
    checks[10] = { pass: false, acceptable: true };
    assert.equal(exitCodeFor({ checks, cleanup: { pass: true }, stopped: null }), 0);
    assert.equal(exitCodeFor({ checks: { ...checks, 13: { pass: false } }, cleanup: { pass: true }, stopped: null }), 1);
    assert.equal(exitCodeFor({ checks, cleanup: { pass: false }, stopped: null }), 1);
    assert.equal(exitCodeFor({ checks, cleanup: { pass: true }, stopped: "check 4 failed" }), 1);
    assert.equal(exitCodeFor({ checks: { ...checks, 7: { pass: false, record: { error: "unexpected Error" } } }, cleanup: { pass: true }, stopped: null }), 1);
    assert.equal(exitCodeFor({ checks: { ...checks, 8: { pass: false, record: { error: "unexpected Error" } } }, cleanup: { pass: true }, stopped: null }), 1);
  });
});

describe("dry run against fakes: one test per I/O matrix row", () => {
  it("Wrong account: whoami names another account, so nothing is deployed and the run stops", async () => {
    const run = await dryRun({ accounts: [{ name: "Another Account", id: ACCOUNT_ID }] });
    assert.match(run.record.stopped, /wrong account/);
    assert.equal(run.world.deploys.length, 0);
    assert.deepEqual(run.world.wranglerCalls.map((call) => call.args[0]), ["whoami"]);
    assert.equal(run.record.exitCode, 1);
    const both = await dryRun({ accounts: [{ name: ACCOUNT_NAME, id: ACCOUNT_ID }, { name: "Another Account", id: ACCOUNT_ID }] });
    assert.equal(both.world.deploys.length, 0);
    assert.ok(!JSON.stringify(both.record).includes("Another Account"));
  });

  it("Leftover Worker: 15a, 15b or 15c exists, so nothing is deployed, nothing deleted, and the run stops", async () => {
    const run = await dryRun({ existing: [WORKERS.b] });
    assert.match(run.record.stopped, /leftover/);
    assert.equal(run.world.deploys.length, 0);
    assert.ok(run.world.wranglerCalls.every((call) => call.args[0] !== "delete"));
    assert.ok(run.world.workers.has(WORKERS.b));
    for (const call of run.world.wranglerCalls.slice(1)) assert.equal(call.accountId, ACCOUNT_ID);
    assert.equal(run.record.exitCode, 1);
  });

  it("First deploy: new Worker, key printed once, secret listed", async () => {
    const run = await happyRun();
    assert.equal(run.record.checks[1].pass, true);
    assert.equal(run.record.checks[1].record.printedOnce, "yes");
    assert.equal(run.record.checks[1].record.secretListed, "yes");
    assert.deepEqual(run.world.deploys[0], { worker: WORKERS.a, keySupplied: false, accountId: ACCOUNT_ID });
    assertNoLeak(run);
  });

  it("Redeploy: key present, no key printed, listed unchanged; a redeploy that loses the key stops the run with cleanup", async () => {
    const run = await happyRun();
    assert.equal(run.record.checks[3].pass, true);
    assert.deepEqual([run.record.checks[3].record.deploymentKeyLines, run.record.checks[3].record.keptLine], [0, "yes"]);
    assert.deepEqual([run.record.checks[3].record.listUnchanged, run.record.checks[3].record.keyValueInOutput], ["yes", "no"]);
    const broken = await dryRun({ quirks: { redeployDropsKey: true } });
    assert.equal(broken.record.checks[3].pass, false);
    assert.equal(broken.record.stopped, "check 3 failed");
    assert.equal(broken.record.checks[4], undefined);
    assert.equal(broken.record.cleanup.pass, true);
    assert.equal(broken.world.workers.size, 0);
    assertNoLeak(broken);
  });

  it("Sign-in after redeploy: second step, then signed in; a refused code records and stops", async () => {
    const run = await happyRun();
    assert.equal(run.record.checks[4].pass, true);
    assert.equal(run.record.checks[4].record.askedForSecondStep, "yes");
    assert.equal(run.record.checks[2].pass, true);
    assert.equal(run.record.checks[2].record.recoveryCodes, 10);
    assert.equal(run.record.checks[5].pass, true);
    const broken = await dryRun({ quirks: { secondStepRefuses: true } });
    assert.equal(broken.record.checks[4].pass, false);
    assert.equal(broken.record.checks[4].record.refusal, "second_step_code_wrong");
    assert.equal(broken.record.stopped, "check 4 failed");
    assert.equal(broken.record.checks[5], undefined);
    assert.equal(broken.record.cleanup.pass, true);
  });

  it("Supplied key: second Worker, used, not printed", async () => {
    const run = await happyRun();
    assert.equal(run.record.checks[6].pass, true);
    assert.equal(run.record.checks[6].record.suppliedLine, "yes");
    assert.deepEqual(run.world.deploys[2], { worker: WORKERS.b, keySupplied: true, accountId: ACCOUNT_ID });
    const seven = run.record.checks[7].record;
    assert.equal(typeof seven.firstKeyState200AfterStartMs, "number");
    assert.ok(seven.firstKeyState200AfterStartMs >= 40_000);
    assert.equal(seven.derivedEqualsReported, "yes");
    assert.equal(seven.tailConnected, "yes");
    assert.equal(seven.tailProbes, 1);
    assert.equal(seven.tailLastProbeStatus, 200);
    assert.equal(seven.tailDuringChecks2to5.platformErrorSeen, "no");
    assert.ok(seven.tailDuringChecks2to5.events > 0);
    const errors = await dryRun({ quirks: { tailException: true } });
    assert.equal(errors.record.checks[7].record.tailDuringChecks2to5.platformErrorSeen, "yes");
    assert.deepEqual(errors.record.checks[7].record.tailDuringChecks2to5.exceptionNames, ["OperationError"]);
  });

  it("List output: secret list --format json gives only the array on standard output; a warning there is recorded and the run goes on", async () => {
    const run = await happyRun();
    assert.equal(run.record.checks[9].pass, true);
    const warned = await dryRun({ quirks: { listWarningOnStdout: true } });
    assert.equal(warned.record.checks[9].pass, false);
    assert.ok(warned.record.checks[9].record.otherStdoutBytes > 0);
    assert.equal(warned.record.checks[2].pass, true);
    assert.equal(warned.record.checks[14].pass, true);
    assert.equal(warned.record.stopped, null);
    assert.equal(warned.record.exitCode, 1);
  });

  it("Failed put / delete: invalid name and absent secret exit non-zero; when they exit 0 the fallback 15c is used, recorded, and deleted at the end", async () => {
    const run = await happyRun();
    assert.equal(run.record.checks[10].pass, true);
    assert.equal(run.record.checks[10].record.put.way, "invalid name on 15a");
    assert.equal(run.record.checks[10].record.delete.way, "absent secret on 15a");
    const quirky = await dryRun({ quirks: { invalidPutExitsZero: true, absentDeleteExitsZero: true } });
    const ten = quirky.record.checks[10];
    assert.equal(ten.record.put.way, "absent Worker 15c (fallback)");
    assert.equal(ten.record.put.worker15cNowExists, "yes");
    assert.equal(ten.record.delete.outcome, "not shown");
    assert.equal(ten.acceptable, true);
    assert.equal(quirky.record.cleanup.pass, true);
    assert.ok(!quirky.world.workers.has(WORKERS.c));
    assert.equal(quirky.record.exitCode, 0);
    assertNoLeak(quirky);
  });

  it("Delete without a terminal: empty piped standard input, exits 0 within 60 s, key gone from the next list", async () => {
    const run = await happyRun();
    assert.equal(run.record.checks[11].pass, true);
    assert.deepEqual(run.record.checks[11].record, { exitCode: 0, endedWithinLimit: "yes", absentFromNextList: "yes" });
    const deletes = run.world.wranglerCalls.filter((call) => call.args[0] === "secret" && call.args[1] === "delete");
    assert.ok(deletes.length > 0);
    for (const call of deletes) assert.equal(call.input, "");
    assert.equal(run.record.checks[12].pass, true);
  });

  it("Replies after a put: four puts polled 180 s each, last differing reply under 60 s; at 61 s the run skips 14 and 10, cleans up and stops (deliberate breakage 3)", async () => {
    const run = await happyRun();
    const puts = run.record.checks[13].record.puts;
    assert.equal(puts.length, 4);
    assert.deepEqual(puts.map((put) => put.expected), ["mismatch", "matches", "mismatch", "matches"]);
    for (const put of puts) {
      assert.ok(put.lastDifferingReplyMs < 60_000);
      assert.equal(put.replies, 61);
    }
    const slow = await dryRun({ quirks: { handPutStaleMs: 61_000 } });
    assert.equal(slow.record.checks[13].pass, false);
    assert.ok(slow.record.checks[13].record.puts.some((put) => put.lastDifferingReplyMs >= 60_000));
    assert.match(slow.record.stopped, /check 13 failed/);
    for (const label of [14, 11, 12, 10]) assert.equal(slow.record.checks[label], undefined);
    assert.ok(slow.world.wranglerCalls.every((call) => !call.args.includes("ACCEPTANCE INVALID NAME")));
    assert.equal(slow.record.cleanup.pass, true);
    assert.equal(slow.world.workers.size, 0);
    assert.equal(slow.record.exitCode, 1);
  });

  it("Restore, wrong key: key deleted, wrong key supplied, settles mismatch, deleted again, exit 1, no key listed", async () => {
    const run = await happyRun();
    const a = run.record.checks[14].record.a;
    assert.equal(a.pass, true);
    assert.deepEqual([a.exitCode, a.checkingLine, a.notOriginalLine, a.absentFromNextList], [1, "yes", "yes", "yes"]);
  });

  it("Restore, original: original supplied, settles matches, exit 0, a code sign-in works", async () => {
    const run = await happyRun();
    const b = run.record.checks[14].record.b;
    assert.equal(b.pass, true);
    assert.deepEqual([b.exitCode, b.suppliedLine, b.secretListed, b.signedInWithLaterCode], [0, "yes", "yes", "yes"]);
  });

  it("Wrong key in the Worker: wrong key put by hand, original supplied, nothing changed, manual-delete line, exit 1", async () => {
    const run = await happyRun();
    const c = run.record.checks[14].record.c;
    assert.equal(c.pass, true);
    assert.deepEqual([c.handPutExit, c.exitCode, c.manualDeleteLineNamingWorker, c.keyStillListed, c.keyStateSettledOn], [0, 1, "yes", "yes", "mismatch"]);
  });

  it("Settle time: (a), (b) and (c) each 60 to 180 s", async () => {
    const run = await happyRun();
    const d = run.record.checks[14].record.d;
    assert.equal(d.pass, true);
    for (const ms of [d.aMs, d.bMs, d.cMs]) assert.ok(ms >= 60_000 && ms <= 180_000);
    assert.equal(run.record.checks[14].pass, true);
  });

  it("Phone check: Kevin declines; with no terminal it is declined for this run and nothing is asked", async () => {
    const run = await happyRun();
    assert.deepEqual(run.record.checks[8].record, { phoneCheck: "declined for this run (no terminal)" });
    assert.equal(run.asked.length, 0);
    const declined = await dryRun({ isTTY: true, answers: ["n"] });
    assert.deepEqual(declined.record.checks[8].record, { phoneCheck: "declined" });
    const taken = await dryRun({ isTTY: true, answers: ["y", "y", "n"] });
    assert.deepEqual(taken.record.checks[8].record, { phoneCheck: "taken", account: "phone-check@example.test", numericKeypadShown: "yes", codeAutofillSuggestionShown: "no" });
    assert.ok(taken.world.workers.size === 0);
    assertNoLeak(taken);
  });

  it("Cleanup: any outcome, all three names deleted and confirmed not found; a delete that removes nothing fails the final check (deliberate breakage 2)", async () => {
    const run = await happyRun();
    assert.equal(run.record.cleanup.pass, true);
    assert.deepEqual(run.record.cleanup.record.workers.map((worker) => [worker.worker, worker.confirmedGone]), [
      [WORKERS.a, "yes"],
      [WORKERS.b, "yes"],
      [WORKERS.c, "yes"],
    ]);
    assert.equal(run.world.workers.size, 0);
    assert.equal(run.record.exitCode, 0);
    assert.equal(run.record.stopped, null);
    const kept = await dryRun({ quirks: { deleteRemovesNothing: true } });
    assert.equal(kept.record.cleanup.pass, false);
    assert.equal(kept.record.exitCode, 1);
    assertNoLeak(kept);
  });

  it("Cleanup after a throw: an effect that throws mid-run is recorded as fixed text and every Worker is still deleted", async () => {
    let deploys = 0;
    const throwing = await dryRun({
      wrap: (effects) => ({
        ...effects,
        deployCommand: async (worker, options) => {
          deploys += 1;
          if (deploys === 2) throw new Error("a message holding output that must not be kept");
          return effects.deployCommand(worker, options);
        },
      }),
    });
    assert.equal(throwing.record.checks[3].pass, false);
    assert.deepEqual(throwing.record.checks[3].record, { error: "unexpected Error" });
    assert.equal(throwing.record.stopped, "check 3 failed");
    assert.equal(throwing.record.cleanup.pass, true);
    assert.equal(throwing.world.workers.size, 0);
    assert.ok(!JSON.stringify(throwing.record).includes("must not be kept"));
    assertNoLeak(throwing);

    let thrown = false;
    const sleepy = await dryRun({
      wrap: (effects) => ({
        ...effects,
        sleep: async (ms) => {
          if (ms === 10_000 && !thrown) {
            thrown = true;
            throw new TypeError("a sleep that fails with {\"secret\":1}");
          }
          return effects.sleep(ms);
        },
      }),
    });
    assert.equal(sleepy.record.error, "unexpected TypeError");
    assert.equal(sleepy.record.stopped, "unexpected error");
    assert.equal(sleepy.record.cleanup.pass, true);
    assert.equal(sleepy.world.workers.size, 0);
    assert.equal(sleepy.record.exitCode, 1);
  });

  it("Cleanup after an interrupt: the run stops at the next step and every Worker is still deleted", async () => {
    const controller = new AbortController();
    const run = await dryRun({ signal: controller.signal, onPrint: (line) => line.startsWith("Check 5 ") && controller.abort() });
    assert.equal(run.record.stopped, "interrupted");
    assert.equal(run.record.checks[6], undefined);
    assert.equal(run.record.cleanup.pass, true);
    assert.equal(run.world.workers.size, 0);
    assert.equal(run.record.exitCode, 1);
  });

  it("An interrupt during check 14's delete starts no deploy afterwards, and the record says interrupted", async () => {
    const controller = new AbortController();
    const run = await dryRun({
      signal: controller.signal,
      wrap: (effects) => ({
        ...effects,
        wrangler: async (args, options) => {
          const result = await effects.wrangler(args, options);
          if (args[0] === "secret" && args[1] === "delete" && args[2] === DEPLOYMENT_KEY_SECRET) controller.abort();
          return result;
        },
      }),
    });
    assert.equal(run.record.stopped, "interrupted");
    assert.deepEqual(run.world.deploys.map((deploy) => deploy.worker), [WORKERS.a, WORKERS.a, WORKERS.b]);
    assert.equal(run.record.checks[14], undefined);
    assert.equal(run.record.cleanup.pass, true);
    assert.equal(run.world.workers.size, 0);
  });

  it("A key shown in another form by a later deploy fails check 3 and stops the run, never recording the value", async () => {
    const run = await dryRun({ quirks: { keyInOtherForm: true } });
    assert.equal(run.record.checks[3].pass, false);
    assert.equal(run.record.checks[3].record.keyValueInOutput, "yes");
    assert.equal(run.record.checks[3].record.deploymentKeyLines, 0);
    assert.equal(run.record.stopped, "check 3 failed");
    assertNoLeak(run);
  });

  it("Set-up and two-step start retries: not configured, replaced and key missing are retried and check 2 passes", async () => {
    const run = await dryRun({ quirks: { setupNotConfiguredFirst: 2, setupReplacedFirst: 1, startKeyMissingFirst: 3 } });
    const two = run.record.checks[2];
    assert.equal(two.pass, true);
    assert.equal(two.record.setupRetries, 3);
    assert.ok(two.record.startRetries >= 3);
    assert.equal(run.record.exitCode, 0);
  });

  it("Check 2 fails: set-up refused once (never retried); 4, 5, 13, 14 and 11 need check 2, 12 recorded, 10 ran, cleanup confirmed, exit 1", async () => {
    for (const isTTY of [true, false]) {
      const run = await dryRun({ quirks: { setupAlwaysWrong: true }, isTTY, answers: ["y"] });
      assert.equal(run.world.setupRequests, 1);
      assert.equal(run.record.checks[2].pass, false);
      assert.equal(run.record.checks[2].record.setupRefusal, "setup_code_wrong");
      for (const label of [4, 5, 13, 14, 11]) assert.deepEqual(run.record.checks[label].record, { notRun: "needs check 2" });
      assert.ok(run.record.checks[12]);
      assert.equal(run.record.checks[10].pass, true);
      assert.equal(run.record.checks[8].record.phoneCheck, isTTY ? "not offered (needs check 2)" : "declined for this run (no terminal)");
      assert.equal(run.record.cleanup.pass, true);
      assert.equal(run.world.workers.size, 0);
      assert.equal(run.record.exitCode, 1);
      assertNoLeak(run);
    }
  });

  it("Check 1 fails: the run stops and the cleanup still runs", async () => {
    const run = await dryRun({
      wrap: (effects) => ({
        ...effects,
        deployCommand: async (worker, options) => ({ ...(await effects.deployCommand(worker, options)), code: 1 }),
      }),
    });
    assert.equal(run.record.checks[1].pass, false);
    assert.equal(run.record.stopped, "check 1 failed");
    assert.equal(run.record.checks[9], undefined);
    assert.equal(run.record.cleanup.pass, true);
    assert.equal(run.world.workers.size, 0);
  });

  it("Phone check taken after the invitation answers 401: the administrator signs in again with a later code", async () => {
    const run = await dryRun({ isTTY: true, answers: ["y", "n", "y"], quirks: { inviteUnauthorizedFirst: true } });
    assert.deepEqual(run.record.checks[8].record, { phoneCheck: "taken", account: "phone-check@example.test", numericKeypadShown: "no", codeAutofillSuggestionShown: "yes" });
    assert.equal(run.world.inviteRequests, 2);
    assertNoLeak(run);
  });

  it("Settle time is measured from the Checking line, not the command's start (a 130 s build)", async () => {
    const results = [];
    const run = await dryRun({
      quirks: { buildMs: 130_000 },
      wrap: (effects) => ({
        ...effects,
        deployCommand: async (worker, options) => {
          const result = await effects.deployCommand(worker, options);
          results.push(result);
          return result;
        },
      }),
    });
    const d = run.record.checks[14].record.d;
    assert.equal(d.pass, true);
    const expected = results.slice(3, 6).map((result) => result.endedAt - result.lines.find((line) => line.text === KEY_LINES.checking).at);
    assert.deepEqual([d.aMs, d.bMs, d.cMs], expected);
    for (const result of results.slice(3, 6)) assert.ok(result.endedAt - result.startedAt > 180_000);
  });

  it("the whole happy run prints one line per check in the frozen order, with nothing secret", async () => {
    const run = await happyRun();
    const order = run.prints.filter((line) => line.startsWith("Check ")).map((line) => Number(/^Check (\d+)/.exec(line)[1]));
    assert.deepEqual(order, [1, 9, 2, 3, 4, 5, 6, 7, 8, 13, 11, 14, 12, 10]);
    for (const call of run.world.wranglerCalls.slice(1)) assert.equal(call.accountId, ACCOUNT_ID);
    assertNoLeak(run);
  });
});

describe("check 13 times each reply by when it arrived (pull request 13, review round 1; orchestrator ruling of 2026-11-24)", () => {
  // A fake clock: `sleep` advances it, and a request takes `latency(sentMs)` ms. Every reply is
  // `expected` except the one sent at `differSentMs`, which answers the other value.
  async function polls({ differSentMs, latency = () => 0, expected = "mismatch" }) {
    let clock = 1_000_000;
    const start = clock;
    const other = expected === "mismatch" ? "matches" : "mismatch";
    const replies = await pollAfterPut({
      now: () => clock,
      sleep: async (ms) => { clock += ms; },
      read: async () => {
        const sentMs = clock - start;
        clock += latency(sentMs);
        return sentMs === differSentMs ? other : expected;
      },
    });
    return evaluatePutPolls(replies, expected);
  }

  it("fails the put when a reply sent at 57 s differs and arrives at 65 s", async () => {
    const evaluated = await polls({ differSentMs: 57_000, latency: (sentMs) => (sentMs === 57_000 ? 8_000 : 0) });
    assert.equal(evaluated.record.lastDifferingReplyMs, 65_000);
    assert.equal(evaluated.pass, false);
  });

  it("passes the put when that differing reply arrives within 60 s", async () => {
    const evaluated = await polls({ differSentMs: 57_000, latency: (sentMs) => (sentMs === 57_000 ? 2_000 : 0) });
    assert.equal(evaluated.record.lastDifferingReplyMs, 59_000);
    assert.equal(evaluated.pass, true);
  });

  it("counts replies in the final window by arrival: at a 3-second poll 21 or more arrive there; at a 15-second request time too few, so the put is not settled (fails safe)", async () => {
    const fast = await polls({ differSentMs: -1 });
    assert.ok(fast.record.repliesInFinalWindow >= 21);
    assert.equal(fast.pass, true);
    const slow = await polls({ differSentMs: -1, latency: () => 15_000 });
    assert.ok(slow.record.repliesInFinalWindow < 10);
    assert.equal(slow.record.final, "not settled");
    assert.equal(slow.pass, false);
  });
});

describe("check 13: replies arriving after 180 s (pull request 13, review round 2; orchestrator ruling of 2026-11-24)", () => {
  // Replies every 3 s from `fromMs` to `toMs`, all `key`, each arriving when sent.
  const series = (fromMs, toMs, key) => {
    const replies = [];
    for (let at = fromMs; at <= toMs; at += 3_000) replies.push({ atMs: at, key });
    return replies;
  };

  it("does not let a late matching reply supply the tenth reply of the final window", () => {
    // Nine replies arrive in the final window (126 s to 150 s; none after until 180 s), and one
    // matching reply arrives at 185 s. Counted, the late one would make ten.
    const replies = [...series(0, 117_000, "mismatch"), ...series(126_000, 150_000, "mismatch"), { atMs: 185_000, key: "mismatch" }];
    const evaluated = evaluatePutPolls(replies, "mismatch");
    assert.equal(evaluated.record.repliesInFinalWindow, 9);
    assert.equal(evaluated.record.final, "not settled");
    assert.equal(evaluated.pass, false);
  });

  it("still fails the put on a differing reply that arrives after 180 s", () => {
    const replies = [...series(0, 180_000, "mismatch"), { atMs: 186_000, key: "matches" }];
    const evaluated = evaluatePutPolls(replies, "mismatch");
    assert.equal(evaluated.record.final, "mismatch");
    assert.equal(evaluated.record.lastDifferingReplyMs, 186_000);
    assert.equal(evaluated.pass, false);
  });
});

describe("dry run against fakes: pull request 13's review", () => {
  it("check 14 (a) scans its output for the wrong key it supplied, and records only yes/no (C1)", async () => {
    const run = await dryRun({ quirks: { echoSuppliedKey: true } });
    const a = run.record.checks[14].record.a;
    assert.equal(a.keyValueInOutput, "yes");
    assert.equal(a.pass, false);
    assert.equal(run.record.checks[6].record.keyValueInOutput, "yes");
    assert.equal(run.record.cleanup.pass, true);
    assertNoLeak(run);
  });

  it("a second step that answers 200 and the name but sets no session does not count as signed in (C2)", async () => {
    const four = await dryRun({ quirks: { noSessionOnCodeSignIn: [1] } });
    assert.equal(four.record.checks[4].pass, false);
    assert.equal(four.record.checks[4].record.signedIn, "no");
    assert.equal(four.record.checks[4].record.secondStepStatus, 200);
    assert.equal(four.record.stopped, "check 4 failed");
    assert.equal(four.record.cleanup.pass, true);
    assertNoLeak(four);

    const five = await dryRun({ quirks: { noSessionOnRecovery: true } });
    assert.equal(five.record.checks[4].pass, true);
    assert.equal(five.record.checks[5].pass, false);
    assert.equal(five.record.checks[5].record.firstUseStatus, 200);
    assert.equal(five.record.checks[5].record.firstUseSignedIn, "no");
    // The replay is still made from its own cookie jar, and still refused.
    assert.equal(five.record.checks[5].record.secondUseRefusal, "second_step_recovery_code_wrong");
    assertNoLeak(five);

    const fourteen = await dryRun({ quirks: { noSessionOnCodeSignIn: [2] } });
    assert.equal(fourteen.record.checks[4].pass, true);
    assert.equal(fourteen.record.checks[14].record.b.signedInWithLaterCode, "no");
    assert.equal(fourteen.record.checks[14].record.b.pass, false);
    assert.equal(fourteen.record.checks[14].pass, false);
    assertNoLeak(fourteen);
  });

  it("check 7 records when 15b's first 200 reply arrives, not when its request was sent (C4)", async () => {
    let deployStartedAt = null;
    let firstArrival = null;
    const run = await dryRun({
      wrap: (effects, world) => ({
        ...effects,
        deployCommand: async (worker, options) => {
          if (worker === WORKERS.b) deployStartedAt = world.clock.now();
          return effects.deployCommand(worker, options);
        },
        fetch: async (url, init) => {
          const slow = url === `${addressOf(WORKERS.b)}/api/v1/deployment-key/state`;
          // Each of these replies takes 5 s more to come back.
          if (slow) await world.clock.sleep(5_000);
          const response = await effects.fetch(url, init);
          if (slow && response.status === 200 && firstArrival === null) firstArrival = world.clock.now();
          return response;
        },
      }),
    });
    assert.equal(typeof firstArrival, "number");
    assert.equal(run.record.checks[7].record.firstKeyState200AfterStartMs, firstArrival - deployStartedAt);
  });
});

// ---------------------------------------------------------------------------------------------
// The confidentiality check itself (C12, C13).

describe("assertNoLeak", () => {
  it("finds a secret inside a longer Wrangler argument, not only an equal one (C12)", async () => {
    const run = await happyRun();
    const secret = [...run.world.secrets][0];
    const call = { args: ["secret", "put", `NAME=${secret}`], input: "", accountId: ACCOUNT_ID };
    const doctored = { ...run, world: { ...run.world, wranglerCalls: [...run.world.wranglerCalls, call] } };
    assert.throws(() => assertNoLeak(doctored), assert.AssertionError);
  });

  it("finds an authenticator code the API was sent in a record string or a printed line, but not a number that equals one (C13)", async () => {
    const run = await happyRun();
    const codes = run.world.codes;
    assert.ok(codes.size >= 3, "the confirm and the code sign-ins of checks 2, 4 and 14 (b) were captured");
    const code = [...codes].find((value) => !value.startsWith("0")) ?? [...codes][0];
    assert.equal(codeShown(run.record, run.prints, codes), false);
    assert.equal(codeShown({ ...run.record, note: `code ${code}` }, [], codes), true);
    assert.equal(codeShown({}, [`Check 4 at x: pass {"refusal":"${code}"}`], codes), true);
    assert.equal(codeShown({}, [`A line with ${code} in it`], codes), true);
    assert.equal(codeShown({ ms: Number(code) }, [`Check 7 at x: recorded {"ms":${Number(code)}}`], codes), false);
    assert.equal(codeShown({ id: `${code}9` }, [], codes), false);
    assert.throws(() => assertNoLeak({ ...run, prints: [`A line with ${code} in it`, ...run.prints] }), assert.AssertionError);
  });
});

// ---------------------------------------------------------------------------------------------
// The real effects, with a fake spawn: what would be started, never started.

function fakeChild() {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.stdin = Object.assign(new EventEmitter(), {
    ended: null,
    end(data) {
      this.ended = data ?? "";
    },
  });
  child.pid = 4242;
  child.exitCode = null;
  child.killed = false;
  child.kill = () => {
    child.killed = true;
  };
  return child;
}

function fakeSpawn() {
  const calls = [];
  const spawnImpl = (command, args, options) => {
    const child = fakeChild();
    const call = Array.isArray(args) ? { command, args, options, child } : { command, args: null, options: args, child };
    calls.push(call);
    return child;
  };
  return { calls, spawnImpl };
}

describe("real effects with a fake spawn", () => {
  it("the deploy command runs one npm command string with a shell; the key only in its environment when supplied", async () => {
    const { calls, spawnImpl } = fakeSpawn();
    const key = generateDeploymentKey();
    let time = 1_000;
    const run = createDeployCommand({ root: "/repo", env: { PATH: "p", site_survey_deployment_key: "stale" }, spawnImpl, now: () => (time += 5), platform: "linux" });
    const pending = run(WORKERS.a, { key, accountId: ACCOUNT_ID });
    const call = calls[0];
    assert.equal(call.command, "npm run deploy:cloudflare -- --name site-studio-test-15a");
    assert.equal(call.args, null);
    assert.equal(call.options.shell, true);
    assert.deepEqual(call.options.stdio, ["ignore", "pipe", "pipe"]);
    assert.equal(call.options.env.CLOUDFLARE_ACCOUNT_ID, ACCOUNT_ID);
    assert.equal(call.options.env[DEPLOYMENT_KEY_ENV], key);
    assert.ok(!("site_survey_deployment_key" in call.options.env));
    assert.ok(!call.command.includes(key));
    call.child.stdout.emit("data", Buffer.from("Checking the deployment key with this "));
    call.child.stdout.emit("data", Buffer.from("installation. This takes at least a minute.\r\nnext"));
    call.child.stderr.emit("data", Buffer.from(`${KEY_LINES.notOriginal}\n`));
    call.child.emit("close", 1);
    const result = await pending;
    assert.equal(result.code, 1);
    assert.deepEqual(result.lines.map((line) => [line.stream, line.text]), [
      ["out", KEY_LINES.checking],
      ["err", KEY_LINES.notOriginal],
      ["out", "next"],
    ]);
    assert.ok(result.endedAt > result.startedAt);

    const second = run(WORKERS.b, { key: null, accountId: ACCOUNT_ID });
    assert.ok(!Object.keys(calls[1].options.env).some((name) => name.toUpperCase() === DEPLOYMENT_KEY_ENV));
    calls[1].child.emit("close", 0);
    await second;
    assert.throws(() => run("site-studio", { key: null }), AcceptanceError);
  });

  it("the deploy command ends the whole tree with taskkill on Windows when its time limit passes", async () => {
    const { calls, spawnImpl } = fakeSpawn();
    const run = createDeployCommand({ root: "/repo", env: {}, spawnImpl, platform: "win32", timeoutMs: 20 });
    const pending = run(WORKERS.a, { key: null, accountId: ACCOUNT_ID });
    await new Promise((resolve) => setTimeout(resolve, 60));
    const kill = calls.find((call) => call.command === "taskkill");
    assert.ok(kill);
    assert.deepEqual(kill.args, ["/pid", "4242", "/T", "/F"]);
    calls[0].child.emit("close", null);
    const result = await pending;
    assert.equal(result.timedOut, true);
  });

  it("Wrangler runs through wranglerSpawn with standard input piped and ended, outputs apart, and no key in its environment", async () => {
    const { calls, spawnImpl } = fakeSpawn();
    const key = generateDeploymentKey();
    const run = createWranglerRunner({ root: "/repo", env: { PATH: "p", [DEPLOYMENT_KEY_ENV]: key }, spawnImpl, platform: "linux" });
    const pending = run(["secret", "put", "ACCEPTANCE INVALID NAME", "--name", WORKERS.a], { input: key, accountId: ACCOUNT_ID });
    const call = calls[0];
    assert.equal(call.command, process.execPath);
    assert.match(call.args[0], /wrangler[\\/]bin[\\/]wrangler\.js$/);
    assert.deepEqual(call.args.slice(1), ["secret", "put", "ACCEPTANCE INVALID NAME", "--name", WORKERS.a]);
    assert.equal(call.options.shell, false);
    assert.deepEqual(call.options.stdio, ["pipe", "pipe", "pipe"]);
    assert.ok(!(DEPLOYMENT_KEY_ENV in call.options.env));
    assert.equal(call.options.env.CLOUDFLARE_ACCOUNT_ID, ACCOUNT_ID);
    assert.equal(call.child.stdin.ended, key);
    assert.ok(!call.args.includes(key));
    call.child.stdout.emit("data", "out");
    call.child.stderr.emit("data", "err");
    call.child.emit("close", 1);
    assert.deepEqual(await pending, { code: 1, timedOut: false, stdout: "out", stderr: "err" });

    const empty = run(["secret", "delete", DEPLOYMENT_KEY_SECRET, "--name", WORKERS.a], { accountId: ACCOUNT_ID });
    assert.equal(calls[1].child.stdin.ended, "");
    calls[1].child.emit("close", 0);
    await empty;
    assert.throws(() => run(["secret", "list", "--name", "site-studio"]), AcceptanceError);
  });

  it("Wrangler is ended when its time limit passes", async () => {
    const { calls, spawnImpl } = fakeSpawn();
    const run = createWranglerRunner({ root: "/repo", env: {}, spawnImpl, platform: "linux" });
    const pending = run(["secret", "delete", DEPLOYMENT_KEY_SECRET, "--name", WORKERS.a], { timeoutMs: 20 });
    await new Promise((resolve) => setTimeout(resolve, 60));
    assert.equal(calls[0].child.killed, true);
    calls[0].child.emit("close", null);
    assert.equal((await pending).timedOut, true);
  });

  it("the tail ignores standard input, hands its output on, restarts once it ends early, and stops", async () => {
    const { calls, spawnImpl } = fakeSpawn();
    const texts = [];
    const start = createTailStarter({ root: "/repo", env: {}, spawnImpl, platform: "linux", sleep: async () => {} });
    const tail = await start(WORKERS.a, { accountId: ACCOUNT_ID, onText: (text) => texts.push(text) });
    assert.deepEqual(calls[0].args.slice(1), ["tail", WORKERS.a, "--format", "json"]);
    assert.deepEqual(calls[0].options.stdio, ["ignore", "pipe", "pipe"]);
    assert.equal(calls[0].options.env.CLOUDFLARE_ACCOUNT_ID, ACCOUNT_ID);
    calls[0].child.stdout.emit("data", Buffer.from("{}"));
    calls[0].child.stderr.emit("data", Buffer.from("an error text"));
    calls[0].child.emit("close", 1);
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(calls.length, 2);
    assert.equal(tail.restarts(), 1);
    const stopping = tail.stop();
    calls[1].child.emit("close", null);
    await stopping;
    assert.deepEqual(texts, ["{}"]);
    assert.equal(calls[1].child.killed, true);
    assert.deepEqual(tail.exits(), [
      { exitCode: 1, stoppedByRun: "no", stderrBytes: 13 },
      { exitCode: null, stoppedByRun: "yes", stderrBytes: 0 },
    ]);
    await assert.rejects(start("site-studio", { onText: () => {} }), AcceptanceError);
  });

  it("main's real effects, driven through runAcceptance: a wrong account or a leftover Worker starts nothing but whoami and the listings", async () => {
    const answer = (spawned) => {
      const args = spawned.args?.slice(1) ?? [];
      let reply = { code: 1, stdout: "", stderr: "unexpected" };
      if (args[0] === "whoami") reply = { code: 0, stdout: JSON.stringify({ accounts: spawned.accounts }), stderr: "" };
      else if (args[0] === "secret" && args[1] === "list") {
        const worker = args[args.indexOf("--name") + 1];
        reply = spawned.existing.includes(worker) ? { code: 0, stdout: "[]", stderr: "" } : { code: 1, stdout: "", stderr: `Worker "${worker}" not found.` };
      }
      setImmediate(() => {
        if (reply.stdout) spawned.child.stdout.emit("data", Buffer.from(reply.stdout));
        if (reply.stderr) spawned.child.stderr.emit("data", Buffer.from(reply.stderr));
        spawned.child.emit("close", reply.code);
      });
    };
    const drive = async ({ accounts, existing }) => {
      const calls = [];
      const spawnImpl = (command, args, options) => {
        const spawned = { command, args, options, child: fakeChild(), accounts, existing };
        calls.push(spawned);
        answer(spawned);
        return spawned.child;
      };
      const prints = [];
      const effects = createRealEffects({ root: "/repo", env: { PATH: "p" }, spawnImpl, platform: "linux", stdin: { isTTY: false }, stdout: { write() {} }, print: (line) => prints.push(line) });
      const record = await runAcceptance(effects);
      return { record, calls, prints };
    };
    const wrong = await drive({ accounts: [{ name: "Another Account", id: ACCOUNT_ID }], existing: [] });
    assert.match(wrong.record.stopped, /wrong account/);
    assert.deepEqual(wrong.calls.map((call) => call.args.slice(1)), [["whoami", "--json"]]);
    assert.ok(!("CLOUDFLARE_ACCOUNT_ID" in wrong.calls[0].options.env));
    const leftover = await drive({ accounts: [{ name: ACCOUNT_NAME, id: ACCOUNT_ID }], existing: [WORKERS.c] });
    assert.match(leftover.record.stopped, /leftover/);
    assert.deepEqual(leftover.calls.map((call) => call.args.slice(1, 3)), [["whoami", "--json"], ["secret", "list"], ["secret", "list"], ["secret", "list"]]);
    for (const call of leftover.calls.slice(1)) {
      assert.equal(call.options.env.CLOUDFLARE_ACCOUNT_ID, ACCOUNT_ID);
      assert.equal(call.command, process.execPath);
    }
    assert.deepEqual(leftover.record.safety.map((entry) => entry.notFound), ["yes", "yes", "no"]);
    assert.ok(leftover.calls.every((call) => !String(call.command).startsWith("npm")));
  });

  it("after an interrupt, the deploy command and Wrangler start nothing, except Wrangler's cleanup calls", async () => {
    const { calls, spawnImpl } = fakeSpawn();
    const controller = new AbortController();
    controller.abort();
    const deploy = createDeployCommand({ root: "/repo", env: {}, spawnImpl, platform: "linux", signal: controller.signal });
    assert.equal((await deploy(WORKERS.a, { key: null, accountId: ACCOUNT_ID })).code, null);
    const run = createWranglerRunner({ root: "/repo", env: {}, spawnImpl, platform: "linux", signal: controller.signal });
    assert.equal((await run(["secret", "list", "--name", WORKERS.a, "--format", "json"])).code, null);
    assert.equal(calls.length, 0);
    const cleanup = run(["delete", "--name", WORKERS.a, "--force"], { cleanup: true });
    assert.equal(calls.length, 1);
    calls[0].child.emit("close", 0);
    assert.equal((await cleanup).code, 0);
  });

  it("stopping the tail does not wait forever for a child that never closes", async () => {
    const { calls, spawnImpl } = fakeSpawn();
    const start = createTailStarter({ root: "/repo", env: {}, spawnImpl, platform: "linux", sleep: async () => {}, stopLimitMs: 20 });
    const tail = await start(WORKERS.a, { onText: () => {} });
    await tail.stop();
    assert.equal(calls[0].child.killed, true);
  });

  it("stopping the tail keeps Node running until the run goes on, even when nothing else is pending", () => {
    // Node's test runner keeps the event loop alive itself on some versions, so this runs `stop()`
    // in a plain Node process where nothing else is pending: a stop timer that did not hold the
    // process open would let it exit inside `stop()`, before the cleanup that follows in a real run.
    const scriptUrl = new URL("../deploy/acceptance/two-step.mjs", import.meta.url).href;
    const program = `
      import { EventEmitter } from "node:events";
      import { createTailStarter } from ${JSON.stringify(scriptUrl)};
      const spawnImpl = () => {
        const child = new EventEmitter();
        child.stdout = new EventEmitter();
        child.stderr = new EventEmitter();
        child.exitCode = null;
        child.killed = false;
        child.kill = () => { child.killed = true; return true; };
        return child;
      };
      const start = createTailStarter({ root: "/repo", env: {}, spawnImpl, platform: "linux", sleep: async () => {}, stopLimitMs: 50 });
      const tail = await start("site-studio-test-15a", { onText: () => {} });
      await tail.stop();
      console.log("went on after stop");
    `;
    const result = spawnSync(process.execPath, ["--input-type=module", "-e", program], { encoding: "utf8", timeout: 30_000, windowsHide: true });
    assert.equal(result.status, 0);
    assert.match(result.stdout, /went on after stop/);
  });

  it("the hidden question echoes nothing, handles backspace, restores raw mode, and Ctrl-C signals the interrupt", async () => {
    const makeInput = () => {
      const input = new EventEmitter();
      input.isRaw = false;
      input.rawModes = [];
      input.setRawMode = (value) => input.rawModes.push(value);
      input.resumed = 0;
      input.paused = 0;
      input.resume = () => (input.resumed += 1);
      input.pause = () => (input.paused += 1);
      return input;
    };
    const written = [];
    const output = { write: (text) => written.push(text) };
    let interrupts = 0;
    const input = makeInput();
    const ask = createAskHidden({ input, output, onInterrupt: () => (interrupts += 1) });
    const answer = ask("Password: ");
    input.emit("data", Buffer.from("ab\u007fc\r"));
    assert.equal(await answer, "ac");
    assert.deepEqual(written, ["Password: ", "\n"]);
    assert.deepEqual(input.rawModes, [true, false]);
    assert.deepEqual([input.resumed, input.paused, interrupts], [1, 1, 0]);
    assert.equal(input.listenerCount("data"), 0);
    const second = makeInput();
    const cancelled = createAskHidden({ input: second, output, onInterrupt: () => (interrupts += 1) })("Password: ");
    second.emit("data", Buffer.from("xy\u0003z"));
    assert.equal(await cancelled, "");
    assert.equal(interrupts, 1);
  });

  it("the visible question answers what is typed, and Ctrl-C signals the interrupt and answers empty", async () => {
    const { PassThrough } = await import("node:stream");
    let interrupts = 0;
    const input = new PassThrough();
    const output = new PassThrough();
    output.resume();
    const ask = createAsk({ input, output, onInterrupt: () => (interrupts += 1) });
    const answer = ask("Take it? ");
    input.write("yes\r");
    assert.equal(await answer, "yes");
    const cancelled = ask("Take it? ");
    input.write("\u0003");
    assert.equal(await cancelled, "");
    assert.equal(interrupts, 1);
  });

  it("the hidden question settles once on the run's interrupt or the end of input, and gives the terminal back (C5)", async () => {
    const makeInput = () => {
      const input = new EventEmitter();
      input.isRaw = false;
      input.rawModes = [];
      input.setRawMode = (value) => input.rawModes.push(value);
      input.resume = () => {};
      input.pause = () => {};
      return input;
    };
    const listeners = (input) => ["data", "end", "close"].map((name) => input.listenerCount(name));
    let interrupts = 0;
    const onInterrupt = () => (interrupts += 1);

    const written = [];
    const output = { write: (text) => written.push(text) };
    const controller = new AbortController();
    const input = makeInput();
    const answer = createAskHidden({ input, output, onInterrupt, signal: controller.signal })("Password: ");
    input.emit("data", Buffer.from("ab"));
    controller.abort();
    assert.equal(await settledWithin(answer), "");
    assert.deepEqual(input.rawModes, [true, false]);
    assert.deepEqual(listeners(input), [0, 0, 0]);
    assert.deepEqual(written, ["Password: ", "\n"]);
    assert.equal(interrupts, 0, "the run's own interrupt is not raised again");

    const ended = makeInput();
    const atEnd = createAskHidden({ input: ended, output, onInterrupt })("Password: ");
    ended.emit("end");
    assert.equal(await settledWithin(atEnd), "");
    assert.deepEqual(ended.rawModes, [true, false]);
    assert.deepEqual(listeners(ended), [0, 0, 0]);

    const early = makeInput();
    const before = written.length;
    assert.equal(await settledWithin(createAskHidden({ input: early, output, onInterrupt, signal: AbortSignal.abort() })("Password: ")), "");
    assert.deepEqual([early.rawModes, written.length], [[], before]);

    // Ctrl-C whose interrupt aborts the run's signal at once settles one time only.
    const ctrlC = new AbortController();
    const typed = makeInput();
    const once = createAskHidden({ input: typed, output, onInterrupt: () => ((interrupts += 1), ctrlC.abort()), signal: ctrlC.signal })("Password: ");
    const start = written.length;
    typed.emit("data", Buffer.from("x\u0003"));
    assert.equal(await settledWithin(once), "");
    assert.deepEqual(written.slice(start), ["\n"]);
    assert.deepEqual(typed.rawModes, [true, false]);
    assert.equal(interrupts, 1);
  });

  it("the visible question settles on the run's interrupt or the end of input (C5)", async () => {
    const { PassThrough } = await import("node:stream");
    let interrupts = 0;
    const output = new PassThrough();
    output.resume();
    const controller = new AbortController();
    const input = new PassThrough();
    const answer = createAsk({ input, output, onInterrupt: () => (interrupts += 1), signal: controller.signal })("Take it? ");
    controller.abort();
    assert.equal(await settledWithin(answer), "");
    assert.equal(interrupts, 0, "the run's own interrupt is not raised again");

    const ended = new PassThrough();
    const atEnd = createAsk({ input: ended, output, onInterrupt: () => (interrupts += 1) })("Take it? ");
    ended.end();
    assert.equal(await settledWithin(atEnd), "");
    assert.equal(await settledWithin(createAsk({ input: new PassThrough(), output, signal: AbortSignal.abort() })("Take it? ")), "");
  });

  it("a question on an input that has already ended or been destroyed answers at once (review round 2)", async () => {
    const { PassThrough } = await import("node:stream");
    const { once } = await import("node:events");
    const output = new PassThrough();
    output.resume();
    const ended = new PassThrough();
    ended.resume();
    ended.end();
    await once(ended, "end");
    assert.equal(await settledWithin(createAsk({ input: ended, output })("Take it? ")), "");
    const destroyed = new PassThrough();
    destroyed.destroy();
    assert.equal(await settledWithin(createAsk({ input: destroyed, output })("Take it? ")), "");
    const hiddenEnded = new PassThrough();
    hiddenEnded.resume();
    hiddenEnded.end();
    await once(hiddenEnded, "end");
    assert.equal(await settledWithin(createAskHidden({ input: hiddenEnded, output })("Password: ")), "");
    const hiddenDestroyed = new PassThrough();
    hiddenDestroyed.destroy();
    assert.equal(await settledWithin(createAskHidden({ input: hiddenDestroyed, output })("Password: ")), "");
  });

  it("off Windows the deploy leads its own process group and killTree signals the group, falling back to the child (review round 2)", async () => {
    for (const [platform, detached] of [["linux", true], ["win32", false]]) {
      const { calls, spawnImpl } = fakeSpawn();
      const pending = createDeployCommand({ root: "/repo", env: {}, spawnImpl, platform })(WORKERS.a, { key: null, accountId: ACCOUNT_ID });
      assert.equal(calls[0].options.detached, detached, platform);
      calls[0].child.emit("close", 0);
      await pending;
    }

    const signalled = [];
    const child = { pid: 4321, exitCode: null, kill: (signal) => signalled.push(["child", signal]) };
    killTree(child, { platform: "linux", killImpl: (pid, signal) => signalled.push(["group", pid, signal]) });
    assert.deepEqual(signalled, [["group", -4321, "SIGKILL"]]);
    signalled.length = 0;
    killTree(child, { platform: "linux", killImpl: () => { throw Object.assign(new Error("no such process group"), { code: "ESRCH" }); } });
    assert.deepEqual(signalled, [["child", "SIGKILL"]]);
    // The shell has exited but its group can still hold npm and Wrangler: the group is signalled.
    signalled.length = 0;
    const exitedShell = { pid: 4321, exitCode: 0, kill: (signal) => signalled.push(["child", signal]) };
    killTree(exitedShell, { platform: "linux", killImpl: (pid, signal) => signalled.push(["group", pid, signal]) });
    assert.deepEqual(signalled, [["group", -4321, "SIGKILL"]]);
    signalled.length = 0;
    killTree(exitedShell, { platform: "win32", spawnImpl: () => signalled.push(["taskkill"]) });
    assert.deepEqual(signalled, [], "on Windows an exited child is left alone, as before");
  });

  it("main's real effects give both questions the run's signal (C5)", async () => {
    const { PassThrough } = await import("node:stream");
    const output = new PassThrough();
    output.resume();
    for (const which of ["ask", "askHidden"]) {
      const controller = new AbortController();
      const effects = createRealEffects({ root: "/repo", signal: controller.signal, spawnImpl: fakeSpawn().spawnImpl, platform: "linux", stdin: new PassThrough(), stdout: output, print: () => {} });
      const answer = effects[which]("Question? ");
      controller.abort();
      assert.equal(await settledWithin(answer), "", `${which} settles when the run is interrupted`);
    }
  });

  it("a POST carries its method, headers, byte length and body; a request that never answers rejects with fixed text on abort", async () => {
    const seen = [];
    const fakeHttps = {
      request(target, options, onResponse) {
        const request = new EventEmitter();
        const entry = { target: String(target), options, ended: undefined };
        seen.push(entry);
        request.setTimeout = () => {};
        request.destroy = (error) => request.emit("error", error);
        request.end = (body) => {
          entry.ended = body;
          if (options.method !== "POST") return;
          const response = new EventEmitter();
          response.statusCode = 200;
          response.rawHeaders = ["Content-Type", "application/json"];
          onResponse(response);
          response.emit("data", Buffer.from("{}"));
          response.emit("end");
        };
        return request;
      },
    };
    const fetchImpl = createFreshConnectionFetch({ httpsModule: fakeHttps });
    const body = JSON.stringify({ name: "André" });
    const headers = { origin: "https://x.sub.workers.dev", "x-site-survey-design": "1", "content-type": "application/json" };
    const response = await fetchImpl("https://x.sub.workers.dev/api/v1/setup", { method: "POST", headers, body });
    assert.equal(response.status, 200);
    const post = seen[0];
    assert.equal(post.options.method, "POST");
    assert.equal(post.options.agent, false);
    assert.equal(post.options.headers.origin, headers.origin);
    assert.equal(post.options.headers["x-site-survey-design"], "1");
    assert.equal(post.options.headers["content-type"], "application/json");
    assert.equal(post.options.headers["content-length"], String(Buffer.byteLength(body)));
    assert.notEqual(Buffer.byteLength(body), body.length);
    assert.equal(post.ended.toString("utf8"), body);
    const controller = new AbortController();
    const hanging = fetchImpl("https://x.sub.workers.dev/api/v1/status", { signal: controller.signal });
    controller.abort();
    await assert.rejects(hanging, (error) => error instanceof AcceptanceError && error.message === "A request failed.");
  });

  it("each request goes over a new connection (agent: false) and comes back as a Response with its cookies", async () => {
    const seen = [];
    const fakeHttps = {
      request(target, options, onResponse) {
        seen.push({ target: String(target), options });
        const request = new EventEmitter();
        request.setTimeout = () => {};
        request.destroy = () => {};
        request.end = () => {
          const response = new EventEmitter();
          response.statusCode = 200;
          response.rawHeaders = ["Content-Type", "application/json", "Set-Cookie", "a=1; Path=/", "Set-Cookie", "b=2; Path=/"];
          onResponse(response);
          response.emit("data", Buffer.from('{"fingerprint":"stored","key":"matches"}'));
          response.emit("end");
        };
        return request;
      },
    };
    const fetchImpl = createFreshConnectionFetch({ httpsModule: fakeHttps });
    const response = await fetchImpl("https://site-studio-test-15a.sub.workers.dev/api/v1/deployment-key/state", { headers: { accept: "application/json" } });
    assert.equal(seen[0].options.agent, false);
    assert.equal(response.status, 200);
    assert.deepEqual(response.headers.getSetCookie(), ["a=1; Path=/", "b=2; Path=/"]);
    assert.deepEqual(await response.json(), { fingerprint: "stored", key: "matches" });
  });
});
