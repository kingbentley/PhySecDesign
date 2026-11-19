// R14: write with an old runtime, open with each newer one in turn, then try going back.
// Usage: ./install.sh && node run.mjs
import { spawn } from "node:child_process";
import { rmSync, mkdirSync, cpSync, readdirSync, statSync } from "node:fs";

const VERSIONS = ["1.20250109.0", "1.20250701.0", "1.20260101.0", "1.20260701.1", "1.20261119.1"];
const BASE = "http://127.0.0.1:8791";
const OBJECTS = ["alpha", "beta", "gamma"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const bin = (v) => `runtimes/${v}/node_modules/@cloudflare/workerd-linux-64/bin/workerd`;

async function start(v) {
  let log = "";
  const p = spawn(bin(v), ["serve", "config.capnp"], { stdio: ["ignore", "pipe", "pipe"] });
  p.stdout.on("data", (d) => (log += d)); p.stderr.on("data", (d) => (log += d));
  let exited = false; p.on("exit", () => (exited = true));
  for (let i = 0; i < 200 && !exited; i++) {
    try { await fetch(BASE + "/"); return { p, log: () => log }; } catch { await sleep(50); }
  }
  return { p: null, log: () => log, failed: true };
}
const stop = (s, signal = "SIGTERM") => new Promise((r) => { s.p.on("exit", r); s.p.kill(signal); });
const call = async (path) => { const r = await fetch(BASE + path); return { status: r.status, body: await r.json().catch(() => null) }; };
const digests = async () => Object.fromEntries(await Promise.all(OBJECTS.map(async (o) => [o, (await call(`/o/${o}/digest`)).body])));
const brief = (d) => Object.fromEntries(Object.entries(d).map(([k, v]) => [k, v && `${v.rows} rows ${v.sha256?.slice(0, 12)} check=${v.integrity?.[0]?.quick_check ?? JSON.stringify(v.integrity)} alarm=${v.pendingAlarm} kv=${v.kvKeys?.length}`]));
const same = (a, b) => OBJECTS.every((o) => a[o] && b[o] && a[o].sha256 === b[o].sha256 && a[o].rows === b[o].rows && a[o].pendingAlarm === b[o].pendingAlarm);
const files = (dir) => readdirSync(dir, { recursive: true }).filter((f) => statSync(`${dir}/${f}`).isFile()).map((f) => `${f} (${statSync(`${dir}/${f}`).size})`);

const results = [];
rmSync("data", { recursive: true, force: true }); mkdirSync("data/do", { recursive: true });
const ALARM_AT = Date.UTC(2030, 0, 1);

// 1. Write with the oldest runtime.
let s = await start(VERSIONS[0]);
if (s.failed) { console.log("oldest runtime did not start:\n" + s.log()); process.exit(1); }
for (const o of OBJECTS) { await call(`/o/${o}/fill?tag=${VERSIONS[0]}&count=2000`); await call(`/o/${o}/alarm?at=${ALARM_AT}`); }
let expected = await digests();
console.log(`written by ${VERSIONS[0]}:`, brief(expected));
await stop(s);
console.log("files on disk:", files("data/do"));
cpSync("data", "data-oldest", { recursive: true });

// 2. Open with each newer runtime in turn; check, then add rows so each version also writes.
for (const v of VERSIONS.slice(1)) {
  s = await start(v);
  if (s.failed) { results.push({ step: `open with ${v}`, ok: false, note: s.log().slice(-400) }); break; }
  const got = await digests();
  const ok = same(expected, got);
  results.push({ step: `open with ${v} (data last written by an earlier version)`, ok, note: JSON.stringify(brief(got)) });
  for (const o of OBJECTS) await call(`/o/${o}/fill?tag=${v}&count=500`);
  expected = await digests();
  // Unclean stop on the last-but-one version: kill without warning, straight after a write.
  await stop(s, v === VERSIONS.at(-2) ? "SIGKILL" : "SIGTERM");
}
cpSync("data", "data-newest", { recursive: true });

// 3. Straight jump: oldest data opened by the newest runtime.
rmSync("data", { recursive: true }); cpSync("data-oldest", "data", { recursive: true });
s = await start(VERSIONS.at(-1));
if (s.failed) results.push({ step: "straight jump oldest -> newest", ok: false, note: s.log().slice(-400) });
else { const got = await digests(); const first = JSON.parse(JSON.stringify(got));
  results.push({ step: `straight jump ${VERSIONS[0]} -> ${VERSIONS.at(-1)}`, ok: OBJECTS.every((o) => got[o]?.rows === 2000 && got[o].pendingAlarm === ALARM_AT && got[o].integrity?.[0]?.quick_check === "ok"), note: JSON.stringify(brief(first)) });
  await stop(s); }

// 4. Going back: data last written by the newest runtime, opened by the oldest.
rmSync("data", { recursive: true }); cpSync("data-newest", "data", { recursive: true });
s = await start(VERSIONS[0]);
if (s.failed) results.push({ step: "going back newest -> oldest", ok: false, note: "did not start: " + s.log().slice(-400) });
else { const got = await digests();
  results.push({ step: `going back ${VERSIONS.at(-1)} -> ${VERSIONS[0]}`, ok: same(expected, got), note: JSON.stringify(brief(got)) + " | log: " + s.log().slice(-300) });
  await stop(s); }

for (const d of ["data", "data-oldest", "data-newest"]) rmSync(d, { recursive: true, force: true });
console.log("\nRESULTS");
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.step}\n      ${r.note}`);
