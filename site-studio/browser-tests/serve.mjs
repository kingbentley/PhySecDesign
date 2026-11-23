// Serves the built Worker for one Playwright test server (story 1.2, K24; story 1.3 adds a pair per
// project): `wrangler dev` on the build's own configuration (dist/worker/wrangler.json), on
// https://127.0.0.1, with a fresh, empty state folder, that server's set-up code and its test
// deployment key (story 1.5).
// Usage: node browser-tests/serve.mjs <server> <port>
//
// The code and the key come from the environment (playwright.config.mjs generates one of each per
// server and run; the key is a per-run test key, never a real one, finding 17) and are written
// only to a mode-600 `.dev.vars` in browser-tests/.local/<server>/, which git ignores (mode 600 has
// no effect on Windows); they are never printed or committed. The file is removed when Wrangler
// exits, on every exit path this script sees; where the run's end kills this script outright
// (Playwright force-kills web servers on Windows), playwright.config.mjs removes it as the run
// ends, and the next run's start removes the folder. No route resets state: each run starts afresh.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const [project, port] = process.argv.slice(2);
if (!/^[a-z0-9-]+$/.test(project ?? "") || !/^\d+$/.test(port ?? "")) {
  console.error("Usage: node browser-tests/serve.mjs <project> <port>");
  process.exit(2);
}
const code = process.env.SETUP_CODE_FOR_TESTS ?? "";
if (code.length < 20 || !/^[A-Za-z0-9]+$/.test(code)) {
  console.error("SETUP_CODE_FOR_TESTS must hold the generated set-up code (20 or more letters and digits).");
  process.exit(2);
}
// The canonical form the server's `parseDeploymentKey` accepts: 32 bytes in base64url, 43 characters.
const deploymentKey = process.env.DEPLOYMENT_KEY_FOR_TESTS ?? "";
if (!/^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$/.test(deploymentKey)) {
  console.error("DEPLOYMENT_KEY_FOR_TESTS must hold the generated test deployment key (32 bytes in base64url, 43 characters).");
  process.exit(2);
}
const config = join(root, "dist", "worker", "wrangler.json");
if (!existsSync(config)) {
  console.error("dist/worker/wrangler.json is missing: run `npm run build` first (npm run test:browser does).");
  process.exit(2);
}

const local = join(root, "browser-tests", ".local", project);
rmSync(local, { recursive: true, force: true });
mkdirSync(join(local, "state"), { recursive: true });
const vars = join(local, ".dev.vars");
writeFileSync(vars, `SETUP_CODE=${code}\nDEPLOYMENT_KEY=${deploymentKey}\n`, { mode: 0o600 });
/** Removes the file holding the set-up code and the test key; safe to call more than once. */
const removeVars = () => rmSync(vars, { force: true });
process.on("exit", removeVars);

const wrangler = join(root, "node_modules", "wrangler", "bin", "wrangler.js");
const child = spawn(
  process.execPath,
  [
    wrangler, "dev",
    "--config", config,
    "--persist-to", join(local, "state"),
    "--env-file", vars,
    "--ip", "127.0.0.1",
    "--port", port,
    // Over HTTPS (story 1.3, D-10): WebKit keeps a `Secure` cookie set over http://127.0.0.1 but
    // never sends it back, so the session would not hold. Wrangler's own local certificate is
    // self-signed; Playwright accepts it (`ignoreHTTPSErrors`). `Secure` is never omitted.
    "--local-protocol", "https",
    "--show-interactive-dev-session=false",
    "--log-level", "warn",
  ],
  {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, SETUP_CODE_FOR_TESTS: undefined, DEPLOYMENT_KEY_FOR_TESTS: undefined, WRANGLER_SEND_METRICS: "false" },
  },
);
// Exit 0 only when Wrangler ended on the signal this script sent it on being asked to stop. Any
// other signal, a crash, or Wrangler ending by itself is a failure, so Playwright reports it.
let sent = null;
const stop = (signal) => {
  sent = signal;
  child.kill(signal);
};
process.on("SIGINT", () => stop("SIGINT"));
process.on("SIGTERM", () => stop("SIGTERM"));
child.on("error", (error) => {
  removeVars();
  console.error(`wrangler dev could not start: ${error.message}`);
  process.exit(1);
});
// A process that handles the signal may instead exit with 0 or with 128 plus the signal's number.
const SIGNAL_STATUS = { SIGINT: 130, SIGTERM: 143 };
child.on("exit", (status, signal) => {
  removeVars();
  const stoppedByUs = sent !== null && (signal === sent || (signal === null && (status === 0 || status === SIGNAL_STATUS[sent])));
  if (stoppedByUs) process.exit(0);
  console.error(`wrangler dev ended unexpectedly (${signal ?? `exit status ${status}`}).`);
  process.exit(status !== null && status !== 0 ? status : 1);
});
