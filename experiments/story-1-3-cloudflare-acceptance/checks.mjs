#!/usr/bin/env node
// Story 1.3, spec 4: throwaway checks against two deployed Cloudflare test Workers (A and B).
// Not part of the application. Run with Node 22+ from anywhere:
//
//   S13=<private folder> node checks.mjs <command>
//
// S13 is a private folder outside the repository (the session scratchpad). It holds the deploy
// logs (from which the set-up codes are read), the generated administrator passwords and the
// cookies the checks pass between steps. Nothing secret is printed: cookie values, tokens,
// passwords and set-up codes never reach this script's output.
//
// Commands, in the spec's order: setup-a, setup-b, check1, check3, check5, check6, signin-b,
// check6b, check7, check8 <probe url>, check9, check4.
import https from "node:https";
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const S13 = process.env.S13;
if (!S13 || !existsSync(S13)) throw new Error("Set S13 to the private folder.");

const WORKERS = {
  a: "https://site-studio-test-13a.physec-site-studio.workers.dev",
  b: "https://site-studio-test-13b.physec-site-studio.workers.dev",
};
const EMAILS = { a: "admin-a@example.com", b: "admin-b@example.com" };
const PREFIX = "__Host-ssd-";

const statePath = path.join(S13, "state.json");
const readState = () => (existsSync(statePath) ? JSON.parse(readFileSync(statePath, "utf8")) : {});
const saveState = (patch) => writeFileSync(statePath, JSON.stringify({ ...readState(), ...patch }), { mode: 0o600 });
const creds = (x) => JSON.parse(readFileSync(path.join(S13, `creds-${x}.json`), "utf8"));
const now = () => new Date().toISOString().slice(11, 23);

/** One request over its own connection (a fresh agent, keep-alive off). Cookies only as given. */
function request(base, method, route, { body, cookie } = {}) {
  const url = new URL(route, base);
  const data = body === undefined ? undefined : JSON.stringify(body);
  const headers = { accept: "application/json", origin: base, "x-site-survey-design": "1" };
  if (data !== undefined) headers["content-type"] = "application/json";
  if (cookie) headers.cookie = cookie;
  const agent = new https.Agent({ keepAlive: false, maxSockets: 1 });
  const started = performance.now();
  return new Promise((resolve, reject) => {
    const req = https.request(url, { method, headers, agent }, (res) => {
      let text = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => (text += chunk));
      res.on("end", () => {
        const ms = performance.now() - started;
        agent.destroy();
        let json = null;
        try {
          json = JSON.parse(text);
        } catch {}
        const setCookie = res.headers["set-cookie"] ?? [];
        resolve({ status: res.statusCode, json, setCookie, retryAfter: res.headers["retry-after"], ms, at: now() });
      });
    });
    req.on("error", reject);
    if (data !== undefined) req.write(data);
    req.end();
  });
}

/** A Set-Cookie line split into name, value and attributes. */
function parseSetCookie(line) {
  const [pair, ...attrs] = line.split(";").map((part) => part.trim());
  const eq = pair.indexOf("=");
  return { name: pair.slice(0, eq), value: pair.slice(eq + 1), attrs };
}

/** A cookie line with its value and identifier hidden, for printing. */
function redact(line) {
  const { name, value, attrs } = parseSetCookie(line);
  return `${shortName(name)}=${value ? "<value>" : ""}; ${attrs.join("; ")}`;
}
function shortName(name) {
  return name.replace(/^(__Host-ssd-(?:m-)?)(.{4}).*$/, "$1$2…");
}
const kind = (name) => (name.startsWith(`${PREFIX}m-`) ? "marker" : name.startsWith(PREFIX) ? "session" : "other");

function printReply(label, reply) {
  console.log(
    `${reply.at} ${label}: ${reply.status} ${JSON.stringify(reply.json)} (${reply.ms.toFixed(0)} ms)` +
      (reply.retryAfter ? ` Retry-After ${reply.retryAfter}` : ""),
  );
  for (const line of reply.setCookie) console.log(`    Set-Cookie ${redact(line)}`);
}

function expect(condition, text) {
  console.log(`  ${condition ? "PASS" : "FAIL"}: ${text}`);
  if (!condition) process.exitCode = 1;
}

const median = (values) => {
  const sorted = [...values].sort((x, y) => x - y);
  const mid = sorted.length / 2;
  return sorted.length % 2 ? sorted[Math.floor(mid)] : (sorted[mid - 1] + sorted[mid]) / 2;
};

async function signIn(x, password, cookie) {
  return request(WORKERS[x], "POST", "/api/v1/session/sign-in", { body: { email: EMAILS[x], password }, cookie });
}

/** The session and marker cookies of a successful sign-in, saved to the private folder only. */
function cookiesOf(reply) {
  const out = {};
  for (const line of reply.setCookie) {
    const parsed = parseSetCookie(line);
    out[kind(parsed.name)] = parsed;
  }
  return out;
}

function checkCookieAttrs(parsed, maxAge) {
  const attrs = parsed.attrs.map((a) => a.toLowerCase());
  expect(parsed.name.startsWith("__Host-"), `${kind(parsed.name)} name starts with __Host-`);
  expect(attrs.includes("httponly"), `${kind(parsed.name)} HttpOnly`);
  expect(attrs.includes("secure"), `${kind(parsed.name)} Secure`);
  expect(attrs.includes("samesite=lax"), `${kind(parsed.name)} SameSite=Lax`);
  expect(attrs.includes("path=/"), `${kind(parsed.name)} Path=/`);
  expect(attrs.includes(`max-age=${maxAge}`), `${kind(parsed.name)} Max-Age=${maxAge}`);
  expect(!attrs.some((a) => a.startsWith("domain")), `${kind(parsed.name)} no Domain`);
  expect(parsed.value.length > 0, `${kind(parsed.name)} has a value`);
}

function isClearing(line, name) {
  const parsed = parseSetCookie(line);
  const attrs = parsed.attrs.map((a) => a.toLowerCase());
  return (
    parsed.name === name &&
    parsed.value === "" &&
    ["max-age=0", "path=/", "secure", "httponly", "samesite=lax"].every((a) => attrs.includes(a))
  );
}

const commands = {
  async "setup-a"() {
    await setup("a", "Test installation A", "Administrator A");
  },
  async "setup-b"() {
    await setup("b", "Test installation B", "Administrator B");
  },

  /** Check 1: sign in on https:// to A; both cookies' attributes. */
  async check1() {
    const reply = await signIn("a", creds("a").password);
    printReply("sign-in A", reply);
    expect(reply.status === 200, "200");
    expect(JSON.stringify(Object.keys(reply.json ?? {})) === '["name"]', "reply equals { name }");
    const cookies = cookiesOf(reply);
    expect(reply.setCookie.length === 2 && cookies.session && cookies.marker, "two Set-Cookie: session and marker");
    if (!cookies.session || !cookies.marker) return;
    checkCookieAttrs(cookies.session, 2592000);
    checkCookieAttrs(cookies.marker, 31536000);
    const idSession = cookies.session.name.slice(PREFIX.length);
    const idMarker = cookies.marker.name.slice(`${PREFIX}m-`.length);
    expect(idSession === idMarker, "session and marker carry the same installation identifier");
    const read = await request(WORKERS.a, "GET", "/api/v1/session", { cookie: `${cookies.session.name}=${cookies.session.value}` });
    printReply("session read A with the new cookie", read);
    expect(read.json?.signedIn === true, "the cookie reads as signed in on A");
    saveState({ a1: cookies, idA: idSession });
  },

  /** Check 3: 20 sign-ins in a row on A, timed at the client, no cookies kept. */
  async check3() {
    const times = [];
    for (let i = 1; i <= 20; i += 1) {
      const reply = await signIn("a", creds("a").password);
      console.log(`${reply.at} sign-in ${i}: ${reply.status} ${reply.ms.toFixed(0)} ms`);
      if (reply.status !== 200) process.exitCode = 1;
      times.push(reply.ms);
    }
    const sorted = [...times].sort((x, y) => x - y);
    console.log(`min ${sorted[0].toFixed(0)} ms, median ${median(times).toFixed(0)} ms, max ${sorted.at(-1).toFixed(0)} ms`);
    expect(median(times) < 1000, "median under 1 s");
  },

  /** Check 5: A's administrator email and password on B. */
  async check5() {
    const reply = await request(WORKERS.b, "POST", "/api/v1/session/sign-in", { body: { email: EMAILS.a, password: creds("a").password } });
    printReply("A's email and password on B", reply);
    expect(reply.status === 401 && reply.json?.error?.code === "signin_failed", "401 signin_failed");
    expect(reply.json?.error?.message === "That email and password do not match.", "the one message");
    expect(reply.setCookie.length === 0, "no Set-Cookie");
  },

  /** Check 6: A's session cookie sent to B. */
  async check6() {
    const { a1 } = readState();
    const reply = await request(WORKERS.b, "GET", "/api/v1/session", { cookie: `${a1.session.name}=${a1.session.value}` });
    printReply("A's session cookie on B", reply);
    expect(reply.status === 200 && reply.json?.signedIn === false, "not signed in on B");
    expect(reply.setCookie.length === 0, "B does not clear A's cookie (another installation's name is ignored)");
    const stillA = await request(WORKERS.a, "GET", "/api/v1/session", { cookie: `${a1.session.name}=${a1.session.value}` });
    printReply("same cookie on A afterwards", stillA);
    expect(stillA.json?.signedIn === true, "still signed in on A");
  },

  /** Prepares 6b and 9: B's administrator signs in on B, giving B's cookie names and a marker. */
  async "signin-b"() {
    const reply = await signIn("b", creds("b").password);
    printReply("sign-in B", reply);
    expect(reply.status === 200, "200");
    const cookies = cookiesOf(reply);
    const idB = cookies.session?.name.slice(PREFIX.length);
    expect(idB && idB !== readState().idA, "B's installation identifier differs from A's");
    saveState({ b1: cookies, idB });
  },

  /** Check 6b: A's token sent under B's cookie name. */
  async check6b() {
    const { a1, b1 } = readState();
    const reply = await request(WORKERS.b, "GET", "/api/v1/session", { cookie: `${b1.session.name}=${a1.session.value}` });
    printReply("A's token under B's cookie name, on B", reply);
    expect(reply.status === 200 && reply.json?.signedIn === false, "not signed in on B");
    expect(reply.setCookie.some((line) => isClearing(line, b1.session.name)), "B clears its own cookie name (unknown token)");
  },

  /** Check 7: sign out on A, then the old cookie on the session read and on sign-out. */
  async check7() {
    const { a1 } = readState();
    const cookie = `${a1.session.name}=${a1.session.value}`;
    const out = await request(WORKERS.a, "POST", "/api/v1/session/sign-out", { body: {}, cookie });
    printReply("sign-out A", out);
    expect(out.status === 200 && out.json?.signedIn === false, "200 { signedIn: false }");
    expect(out.setCookie.some((line) => isClearing(line, a1.session.name)), "clearing Set-Cookie for the session");
    expect(!out.setCookie.some((line) => kind(parseSetCookie(line).name) === "marker"), "no marker Set-Cookie");
    const read = await request(WORKERS.a, "GET", "/api/v1/session", { cookie });
    printReply("old cookie on session read", read);
    expect(read.status === 200 && read.json?.signedIn === false, "200, not signed in");
    expect(read.setCookie.some((line) => isClearing(line, a1.session.name)), "clearing Set-Cookie");
    const again = await request(WORKERS.a, "POST", "/api/v1/session/sign-out", { body: {}, cookie });
    printReply("old cookie on sign-out", again);
    expect(again.status === 200 && again.json?.signedIn === false, "200, not signed in");
    expect(again.setCookie.some((line) => isClearing(line, a1.session.name)), "clearing Set-Cookie");
  },

  /** Check 8: the probe Worker verifies the fixture and refuses a wrong password. */
  async check8(probeUrl) {
    const reply = await request(probeUrl, "GET", "/verify");
    printReply("probe /verify", reply);
    expect(reply.status === 200 && reply.json?.fixture === true, "the fixture verifies");
    expect(reply.json?.wrongPassword === false, "the wrong password does not verify");
  },

  /** Check 9: 25 wrong sign-ins at once on B, each with a valid marker for B's administrator. */
  async check9() {
    const { b1 } = readState();
    const cookie = `${b1.marker.name}=${b1.marker.value}`;
    await burst("b", cookie, "marker cookie only");
  },

  /** Check 4: A's email has no failures (a correct sign-in clears them), then 25 wrong at once, no cookies. */
  async check4() {
    const confirm = await signIn("a", creds("a").password);
    printReply("correct sign-in on A (clears A's email count)", confirm);
    expect(confirm.status === 200, "200, so A's email count is clear");
    await burst("a", undefined, "no cookies");
  },
};

async function setup(x, installationName, name) {
  const log = readFileSync(path.join(S13, `deploy-${x}.log`), "utf8");
  const code = log.match(/Set-up code: (\S+)/)?.[1];
  if (!code) throw new Error(`No set-up code in deploy-${x}.log.`);
  const password = randomBytes(18).toString("base64url");
  writeFileSync(path.join(S13, `creds-${x}.json`), JSON.stringify({ email: EMAILS[x], password }), { mode: 0o600 });
  const reply = await request(WORKERS[x], "POST", "/api/v1/setup", { body: { code, installationName, name, email: EMAILS[x], password } });
  printReply(`set-up ${x.toUpperCase()}`, reply);
  expect(reply.status === 200, "200");
}

/** 25 wrong sign-ins for one email at once, over 25 separate connections. */
async function burst(x, cookie, label) {
  const replies = await Promise.all(
    Array.from({ length: 25 }, () =>
      request(WORKERS[x], "POST", "/api/v1/session/sign-in", { body: { email: EMAILS[x], password: "wrong-password-" + randomBytes(6).toString("hex") }, cookie }),
    ),
  );
  const counts = {};
  for (const reply of replies) {
    const key = `${reply.status} ${reply.json?.error?.code}`;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  console.log(`${now()} 25 wrong sign-ins on ${x.toUpperCase()} (${label}), sent ${replies[0].at}..: ${JSON.stringify(counts)}`);
  const waits = replies.filter((r) => r.json?.error?.code === "signin_wait");
  console.log(`  Retry-After on waits: ${[...new Set(waits.map((r) => r.retryAfter))].join(", ")}; any Set-Cookie: ${replies.some((r) => r.setCookie.length)}`);
  console.log(`  times ms: ${replies.map((r) => r.ms.toFixed(0)).join(" ")}`);
  expect(counts["401 signin_failed"] === 5, "exactly 5 signin_failed (checked against the password)");
  expect(counts["429 signin_wait"] === 20, "exactly 20 signin_wait");
}

const [command, ...args] = process.argv.slice(2);
if (!commands[command]) throw new Error(`Unknown command ${command}. One of: ${Object.keys(commands).join(", ")}`);
console.log(`${now()} UTC ${command}`);
await commands[command](...args);
