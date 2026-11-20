// Serves the built Worker for one Playwright project (story 1.2, K24): `wrangler dev` on the
// build's own configuration (dist/worker/wrangler.json), on 127.0.0.1, with a fresh, empty state
// folder and that project's set-up code. Usage: node browser-tests/serve.mjs <project> <port>
//
// The code comes from the environment (playwright.config.mjs generates one per project and run)
// and is written only to a mode-600 `.dev.vars` in browser-tests/.local/<project>/, which git
// ignores; it is never printed or committed. No route resets state: each run starts afresh here.
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
const config = join(root, "dist", "worker", "wrangler.json");
if (!existsSync(config)) {
  console.error("dist/worker/wrangler.json is missing: run `npm run build` first (npm run test:browser does).");
  process.exit(2);
}

const local = join(root, "browser-tests", ".local", project);
rmSync(local, { recursive: true, force: true });
mkdirSync(join(local, "state"), { recursive: true });
const vars = join(local, ".dev.vars");
writeFileSync(vars, `SETUP_CODE=${code}\n`, { mode: 0o600 });

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
    "--show-interactive-dev-session=false",
    "--log-level", "warn",
  ],
  {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, SETUP_CODE_FOR_TESTS: undefined, WRANGLER_SEND_METRICS: "false" },
  },
);
const stop = () => child.kill("SIGTERM");
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
child.on("exit", (status, signal) => process.exit(status ?? (signal ? 0 : 1)));
