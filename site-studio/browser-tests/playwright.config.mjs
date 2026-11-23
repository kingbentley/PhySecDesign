import { randomBytes, randomInt } from "node:crypto";
import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

// Browser tests (story 1.2, K24, standing rule 15): the built app served locally by Cloudflare's
// runtime, in desktop Chromium and in WebKit with an iPhone profile. Each server has its own empty
// state folder, set-up code and deployment key (story 1.5, finding 17: 32 random bytes in
// base64url, a test key for this run only, never a real one), generated here for each run and kept
// in this process's environment so that Playwright's worker processes, which load this file again
// and inherit the environment, see the same values. serve.mjs writes both only into the server's
// gitignored .dev.vars in browser-tests/.local/<server>/ and removes that file when the run ends.
// Nothing is written outside browser-tests/.local/.
//
// Each project has three servers (story 1.3, A-20, V-14): its own for setup.spec.mjs, and a pair
// for signin.spec.mjs, which uses the first for the sign-in tests and both for the test of two
// installations on one host with different ports. Every server is served over HTTPS (D-10): WebKit
// keeps a `Secure` cookie set over http://127.0.0.1 but never sends it back.

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generatedCode() {
  let code = "";
  for (let index = 0; index < 24; index += 1) code += ALPHABET[randomInt(ALPHABET.length)];
  return code;
}

const PROJECTS = [
  { name: "chromium", port: 8791, signInPorts: [8793, 8794], use: { ...devices["Desktop Chrome"] } },
  { name: "webkit-iphone", port: 8792, signInPorts: [8795, 8796], use: { ...devices["iPhone 15"] } },
];

/** Every server: `id` names its state folder and its set-up code's variable. */
const SERVERS = PROJECTS.flatMap((project) => [
  { id: project.name, port: project.port },
  ...project.signInPorts.map((port, index) => ({ id: `${project.name}-signin-${"ab"[index]}`, port })),
]);

const origin = (port) => `https://127.0.0.1:${port}`;

for (const server of SERVERS) {
  process.env[setupCodeVariable(server.id)] ??= generatedCode();
  // Every server gets a key, so two-step verification is available on each (story 1.5).
  process.env[deploymentKeyVariable(server.id)] ??= randomBytes(32).toString("base64url");
}

/** The environment variable holding a server's set-up code for this run (a project's own server has the project's name). */
export function setupCodeVariable(serverId) {
  return `SETUP_CODE_FOR_TESTS_${serverId.replace(/-/g, "_").toUpperCase()}`;
}

// The runner's own process (not a worker) removes every server's .dev.vars as the run ends: on
// Windows Playwright force-kills the web servers, so serve.mjs cannot remove its own (finding 17).
if (process.env.TEST_WORKER_INDEX === undefined) {
  process.on("exit", () => {
    for (const server of SERVERS) {
      // Best effort: a file still held open (EPERM or EBUSY on Windows) must not throw at exit.
      try {
        rmSync(fileURLToPath(new URL(`./.local/${server.id}/.dev.vars`, import.meta.url)), { force: true });
      } catch {
        // The next run's serve.mjs removes the folder before it starts.
      }
    }
  });
}

/** The environment variable holding a server's test deployment key for this run (story 1.5, finding 17). */
export function deploymentKeyVariable(serverId) {
  return `DEPLOYMENT_KEY_FOR_TESTS_${serverId.replace(/-/g, "_").toUpperCase()}`;
}

/** The two sign-in servers of a project: `{ origin, code }` each, the first used for most tests. */
export function signInServers(projectName) {
  const project = PROJECTS.find((candidate) => candidate.name === projectName);
  if (!project) throw new Error(`No project named ${projectName}.`);
  return project.signInPorts.map((port, index) => {
    const code = process.env[setupCodeVariable(`${project.name}-signin-${"ab"[index]}`)];
    if (!code) throw new Error("No set-up code for this server: run through playwright.config.mjs.");
    return { origin: origin(port), code };
  });
}

export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.mjs",
  outputDir: "../test-results",
  // One installation per server, so tests run in order, one at a time; a retried test would meet a
  // changed installation, so there are no retries and a failure keeps its trace.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? [["list"], ["html", { outputFolder: "../playwright-report", open: "never" }]] : "list",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: { trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: PROJECTS.map((project) => ({
    name: project.name,
    // Wrangler's local certificate is self-signed.
    use: { ...project.use, baseURL: origin(project.port), ignoreHTTPSErrors: true },
  })),
  webServer: SERVERS.map((server) => ({
    command: `node browser-tests/serve.mjs ${server.id} ${server.port}`,
    cwd: "..",
    url: `${origin(server.port)}/api/v1/setup/state`,
    ignoreHTTPSErrors: true,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      SETUP_CODE_FOR_TESTS: process.env[setupCodeVariable(server.id)],
      DEPLOYMENT_KEY_FOR_TESTS: process.env[deploymentKeyVariable(server.id)],
    },
    stdout: "ignore",
    stderr: "pipe",
  })),
});
