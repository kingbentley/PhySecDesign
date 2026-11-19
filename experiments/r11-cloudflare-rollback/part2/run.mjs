// R11 part 2: does a rollback accept the `immediate` code-update mode, and what happens to secrets on a rollback?
// Runs on Windows, macOS or Linux with Node 20+. Needs `npx wrangler login` (or CLOUDFLARE_API_TOKEN) and
// CLOUDFLARE_ACCOUNT_ID for the test account. Usage, from this folder:  node run.mjs
import { execSync } from "node:child_process";

const BASE = "https://site-studio-experiments.physec-site-studio.workers.dev";
const W = "npx --yes wrangler@4.165.0";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const now = () => Date.now();

function wr(args, input) {
  const out = execSync(`${W} ${args}`, { cwd: import.meta.dirname, input, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], env: process.env });
  return out;
}
async function get(path) {
  try { const r = await fetch(BASE + path, { signal: AbortSignal.timeout(10000) }); return await r.json(); }
  catch (e) { return { error: String(e).slice(0, 80) }; }
}
function currentVersion() {
  const list = JSON.parse(wr("deployments list --json"));
  return list[list.length - 1].versions[0].version_id;
}
function deploy(letter, mode = "immediate") {
  wr(`deploy --var VERSION:${letter} --durable-objects-code-update-mode ${mode}`);
  return currentVersion();
}
function putSecret(value) { wr("secret put KEY", value + "\n"); return currentVersion(); }

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

const results = {};
console.log("1. Version A, then secret KEY set to value one, then to value two.");
deploy("A");
const vA1 = putSecret("value-one-" + Math.random().toString(36).slice(2));
const k1 = (await get("/key")).key;
const vA2 = putSecret("value-two-" + Math.random().toString(36).slice(2));
await sleep(3000);
const k2 = (await get("/key")).key;
console.log(`   version with value one ${vA1.slice(0, 8)} (hash ${k1}); with value two ${vA2.slice(0, 8)} (hash ${k2})`);

console.log("2. Version B deployed; it inherits the current secret.");
const vB = deploy("B");
await sleep(5000);
results.secretAfterB = (await get("/key")).key;
console.log(`   B is ${vB.slice(0, 8)}; KEY hash now ${results.secretAfterB} (${results.secretAfterB === k2 ? "value two" : "?"})`);

console.log("3. A busy object under B, then a rollback to the version with value one, in immediate mode.");
await get("/o/p2a/clear");
await get("/o/p2a/alarms?seconds=240&every=500");
const w = watch("p2a");
await sleep(10000);
const t0 = now();
let rollbackOutput;
try { rollbackOutput = wr(`rollback ${vA1} --message "R11 part 2: immediate rollback" --yes --durable-objects-code-update-mode immediate`); results.immediateAccepted = true; }
catch (e) { rollbackOutput = String(e.stderr || e).slice(0, 400); results.immediateAccepted = false; }
const t1 = now();
console.log(`   rollback command ${results.immediateAccepted ? "accepted" : "REFUSED"} in ${((t1 - t0) / 1000).toFixed(1)} s`);
await sleep(30000);
results.entrySwitch = switchTime(w.entry, "worker", "A", t1);
results.objectSwitch = switchTime(w.rows, "object", "A", t1);
results.secretAfterRollback = (await get("/key")).key;
console.log(`   entry code on A after ${results.entrySwitch}; busy object on A after ${results.objectSwitch}`);
console.log(`   KEY hash after rollback ${results.secretAfterRollback}: ${results.secretAfterRollback === k1 ? "value one (the rolled-back version's own secret)" : results.secretAfterRollback === k2 ? "value two (the latest secret)" : "neither"}`);

console.log("4. A rollback to B with no mode given, watched for 60 s.");
const t2 = now();
wr(`rollback ${vB} --message "R11 part 2: default rollback" --yes`);
const t3 = now();
await sleep(60000);
results.defaultEntry = switchTime(w.entry, "worker", "B", t3);
results.defaultObject = switchTime(w.rows, "object", "B", t3);
console.log(`   rollback took ${((t3 - t2) / 1000).toFixed(1)} s; entry code on B after ${results.defaultEntry}; busy object on B after ${results.defaultObject}`);
w.end();
await sleep(1000);
const errors = w.rows.filter((r) => r.object === "ERR").length + w.entry.filter((r) => r.worker === "ERR").length;
results.failedRequests = errors;
console.log(`5. Failed requests during the run: ${errors} of ${w.rows.length + w.entry.length}`);
console.log("\nRESULTS " + JSON.stringify(results));
if (!results.immediateAccepted) console.log("Rollback output: " + rollbackOutput);
