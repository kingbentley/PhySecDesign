import { randomInt } from "node:crypto";
import { defineConfig, devices } from "@playwright/test";

// Browser tests (story 1.2, K24, standing rule 15): the built app served locally by Cloudflare's
// runtime, in desktop Chromium and in WebKit with an iPhone profile. Each project has its own
// server, empty state folder and set-up code, generated here for each run and kept in this
// process's environment so that Playwright's worker processes, which load this file again and
// inherit the environment, see the same code. Nothing is written outside browser-tests/.local/.

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generatedCode() {
  let code = "";
  for (let index = 0; index < 24; index += 1) code += ALPHABET[randomInt(ALPHABET.length)];
  return code;
}

const PROJECTS = [
  { name: "chromium", port: 8791, use: { ...devices["Desktop Chrome"] } },
  { name: "webkit-iphone", port: 8792, use: { ...devices["iPhone 15"] } },
];

for (const project of PROJECTS) {
  const key = setupCodeVariable(project.name);
  process.env[key] ??= generatedCode();
}

/** The environment variable holding a project's set-up code for this run. */
export function setupCodeVariable(projectName) {
  return `SETUP_CODE_FOR_TESTS_${projectName.replace(/-/g, "_").toUpperCase()}`;
}

export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.mjs",
  outputDir: "../test-results",
  // One installation per project, so tests run in order, one at a time; a retried test would
  // meet a changed installation, so there are no retries and a failure keeps its trace.
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
    use: { ...project.use, baseURL: `http://127.0.0.1:${project.port}` },
  })),
  webServer: PROJECTS.map((project) => ({
    command: `node browser-tests/serve.mjs ${project.name} ${project.port}`,
    cwd: "..",
    url: `http://127.0.0.1:${project.port}/api/v1/setup/state`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: { SETUP_CODE_FOR_TESTS: process.env[setupCodeVariable(project.name)] },
    stdout: "ignore",
    stderr: "pipe",
  })),
});
