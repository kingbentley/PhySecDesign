// R11 part 2: does a rollback accept the `immediate` code-update mode, and what happens to secrets on a rollback?
// Runs on Windows, macOS or Linux with Node 22.12.0 or later (Wrangler 4.165.0 refuses older Node versions).
// Needs `npx wrangler login` (or CLOUDFLARE_API_TOKEN) and CLOUDFLARE_ACCOUNT_ID for the test account.
// Usage, from this folder:  node run.mjs
//
// Revised after the run of 2026-11-19 (see the experiments record): Wrangler now runs as an asynchronous child
// process, so the polling loops keep running while a rollback command is in progress, and each secret's expected
// hash is computed locally and confirmed before the run goes on.
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";

const BASE = "https://site-studio-experiments.physec-site-studio.workers.dev";
const W = "npx --yes wrangler@4.165.0";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const now = () => Date.now();

// Runs Wrangler without blocking the event loop, so watch() keeps polling while it runs.
function wr(args, input) {
  return new Promise((resolve, reject) => {
    const p = spawn(`${W} ${args}`, { cwd: import.meta.dirname, shell: true, env: process.env });
    let out = "", err = "";
    p.stdout.on("data", (d) => { out += d; });
    p.stderr.on("data", (d) => { err += d; });
    p.on("error", reject);
    p.on("close", (code) => code === 0 ? resolve(out) : reject(Object.assign(new Error(`wrangler ${args.split(" ")[0]} exited with ${code}`), { stderr: err })));
    p.stdin.end(input ?? "");
  });
}
async function get(path) {
  try { const r = await fetch(BASE + path, { signal: AbortSignal.timeout(10000) }); return await r.json(); }
  catch (e) { return { error: String(e).slice(0, 80) }; }
}
async function currentVersion() {
  const list = JSON.parse(await wr("deployments list --json"));
  return list[list.length - 1].versions[0].version_id;
}
async function deploy(letter, mode = "immediate") {
  await wr(`deploy --var VERSION:${letter} --durable-objects-code-update-mode ${mode}`);
  return currentVersion();
}
async function putSecret(value) { await wr("secret put KEY", value + "\n"); return currentVersion(); }

// The same short hash the probe's /key route returns: the first 6 bytes of SHA-256, in hex.
const shortHash = (s) => createHash("sha256").update(s).digest("hex").slice(0, 12);
// Wrangler may or may not keep the trailing newline from stdin, so either form counts as that value.
const hashesOf = (value) => [shortHash(value), shortHash(value + "\n")];
// Polls /key until it answers with one of the expected hashes; returns the hash, or null if it never does.
async function confirmKey(expected, ms = 60000) {
  const until = now() + ms;
  while (now() < until) {
    const r = await get("/key");
    if (r.key && expected.includes(r.key)) return r.key;
    await sleep(1000);
  }
  return null;
}

// Keeps one object busy and records, for every write, which object version answered and when.
function watch(obj) {
  const rows = []; let stop = false;
  (async () => { while (!stop) { const r = await get(`/o/${obj}/write`); rows.push({ at: now(), object: r.object ?? "ERR", instance: r.instance }); await sleep(250); } })();
  const entry = []; (async () => { while (!stop) { const r = await get("/"); entry.push({ at: now(), worker: r.worker ?? "ERR" }); await sleep(250); } })();
  return { rows, entry, end: () => { stop = true; } };
}
function switchTime(series, field, to, from) {
  const first = series.find((s) => s.at >= from && s[field] === to);
  return first ? ((first.at - from) / 1000).toFixed(1) + " s" : "not within the window";
}
// Requests that failed while a command was running, which the earlier blocking version could not observe.
const failedDuring = (w, from, to) =>
  w.rows.filter((r) => r.at >= from && r.at <= to && r.object === "ERR").length + w.entry.filter((r) => r.at >= from && r.at <= to && r.worker === "ERR").length;

const results = {};
console.log("1. Version A, then secret KEY set to value one, then to value two.");
await deploy("A");
const v1 = "value-one-" + Math.random().toString(36).slice(2);
const vA1 = await putSecret(v1);
const k1 = await confirmKey(hashesOf(v1));
const v2 = "value-two-" + Math.random().toString(36).slice(2);
const vA2 = await putSecret(v2);
const k2 = await confirmKey(hashesOf(v2));
if (!k1 || !k2) {
  console.log("   INCONCLUSIVE: the probe never answered with the expected hash of each secret; stopping before any rollback.");
  process.exit(2);
}
console.log(`   version with value one ${vA1.slice(0, 8)} (hash ${k1}); with value two ${vA2.slice(0, 8)} (hash ${k2})`);

console.log("2. Version B deployed; it inherits the current secret.");
const vB = await deploy("B");
results.secretAfterB = await confirmKey([k2], 30000) ?? (await get("/key")).key ?? "no answer";
console.log(`   B is ${vB.slice(0, 8)}; KEY hash now ${results.secretAfterB} (${results.secretAfterB === k2 ? "value two" : "not value two"})`);

console.log("3. A busy object under B, then a rollback to the version with value one, in immediate mode.");
await get("/o/p2a/clear");
await get("/o/p2a/alarms?seconds=240&every=500");
const w = watch("p2a");
await sleep(10000);
const t0 = now();
let rollbackOutput;
try { rollbackOutput = await wr(`rollback ${vA1} --message "R11 part 2: immediate rollback" --yes --durable-objects-code-update-mode immediate`); results.immediateAccepted = true; }
catch (e) { rollbackOutput = String(e.stderr || e).slice(0, 400); results.immediateAccepted = false; }
const t1 = now();
results.failedDuringImmediateCommand = failedDuring(w, t0, t1);
console.log(`   rollback command ${results.immediateAccepted ? "accepted" : "REFUSED"} in ${((t1 - t0) / 1000).toFixed(1)} s; ${results.failedDuringImmediateCommand} failed requests while it ran`);
await sleep(30000);
results.entrySwitch = switchTime(w.entry, "worker", "A", t1);
results.objectSwitch = switchTime(w.rows, "object", "A", t1);
const after = await get("/key");
results.secretAfterRollback = after.key ?? null;
console.log(`   entry code on A after ${results.entrySwitch}; busy object on A after ${results.objectSwitch}`);
if (results.secretAfterRollback == null) {
  results.secretResult = "inconclusive: /key did not answer after the rollback";
} else {
  results.secretResult = results.secretAfterRollback === k1 ? "value one (the rolled-back version's own secret)" : results.secretAfterRollback === k2 ? "value two (the latest secret)" : "neither";
}
console.log(`   KEY hash after rollback ${results.secretAfterRollback}: ${results.secretResult}`);

console.log("4. A rollback to B with no mode given, watched for 60 s.");
const t2 = now();
await wr(`rollback ${vB} --message "R11 part 2: default rollback" --yes`);
const t3 = now();
results.failedDuringDefaultCommand = failedDuring(w, t2, t3);
await sleep(60000);
results.defaultEntry = switchTime(w.entry, "worker", "B", t3);
results.defaultObject = switchTime(w.rows, "object", "B", t3);
console.log(`   rollback took ${((t3 - t2) / 1000).toFixed(1)} s (${results.failedDuringDefaultCommand} failed requests while it ran); entry code on B after ${results.defaultEntry}; busy object on B after ${results.defaultObject}`);
w.end();
await sleep(1000);
const errors = w.rows.filter((r) => r.object === "ERR").length + w.entry.filter((r) => r.worker === "ERR").length;
results.failedRequests = errors;
console.log(`5. Failed requests during the run: ${errors} of ${w.rows.length + w.entry.length}`);
console.log("\nRESULTS " + JSON.stringify(results));
if (!results.immediateAccepted) console.log("Rollback output: " + rollbackOutput);
