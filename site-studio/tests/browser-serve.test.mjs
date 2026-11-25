// The browser tests' server wrapper (browser-tests/serve.mjs) and the vars-file cleanup in
// browser-tests/playwright.config.mjs, without starting Wrangler or a browser. Pull request 13's
// review, findings C8 to C10. Every value here is made up for the test; none is a real key.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { removeQuietly, RUN_ID_PATTERN, varsFile, wranglerEnvironment } from "../browser-tests/serve.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("browser-tests/serve.mjs", () => {
  it("removes the vars file best effort: EPERM or EBUSY does not throw past Wrangler's outcome (C9)", () => {
    const calls = [];
    for (const code of ["EPERM", "EBUSY"]) {
      const rm = (file, options) => {
        calls.push([file, options]);
        throw Object.assign(new Error(`${code}: resource busy or locked`), { code });
      };
      assert.doesNotThrow(() => removeQuietly("/tmp/run-0000000000000000.vars", rm));
    }
    assert.deepEqual(calls.map(([, options]) => options), [{ force: true }, { force: true }]);
    let removed = null;
    removeQuietly("/tmp/a.vars", (file) => (removed = file));
    assert.equal(removed, "/tmp/a.vars");
  });

  it("gives Wrangler no test set-up code or test deployment key from the merged environment, exact or suffixed, in any case (C10)", () => {
    const env = {
      PATH: "/usr/bin",
      SystemRoot: "C:\\Windows",
      SETUP_CODE_FOR_TESTS: "selected-server-code",
      DEPLOYMENT_KEY_FOR_TESTS: "selected-server-key",
      SETUP_CODE_FOR_TESTS_CHROMIUM: "code-a",
      SETUP_CODE_FOR_TESTS_WEBKIT_IPHONE_SIGNIN_B: "code-b",
      DEPLOYMENT_KEY_FOR_TESTS_CHROMIUM_SIGNIN_A: "key-a",
      deployment_key_for_tests_webkit_iphone: "key-b",
      Setup_Code_For_Tests: "code-c",
      // Not test values: other names that merely start alike are kept.
      SETUP_CODE_FOR_TESTSUITE: "kept",
      BROWSER_TESTS_RUN_ID: "0123456789abcdef",
      WRANGLER_SEND_METRICS: "true",
    };
    const out = wranglerEnvironment(env);
    for (const name of Object.keys(out)) assert.doesNotMatch(name, /^(SETUP_CODE_FOR_TESTS|DEPLOYMENT_KEY_FOR_TESTS)(_|$)/i, `${name} reached Wrangler's environment`);
    const values = Object.values(out);
    for (const value of ["selected-server-code", "selected-server-key", "code-a", "code-b", "code-c", "key-a", "key-b"]) assert.ok(!values.includes(value), "a test value reached Wrangler's environment");
    assert.deepEqual(out, { PATH: "/usr/bin", SystemRoot: "C:\\Windows", SETUP_CODE_FOR_TESTSUITE: "kept", BROWSER_TESTS_RUN_ID: "0123456789abcdef", WRANGLER_SEND_METRICS: "false" });
  });

  it("runs its main when started as a script: with no arguments it stops at the usage line, before anything starts", () => {
    const result = spawnSync(process.execPath, ["browser-tests/serve.mjs"], { cwd: root, encoding: "utf8", timeout: 120_000, windowsHide: true });
    assert.equal(result.status, 2);
    assert.match(result.stderr, /Usage: node browser-tests\/serve\.mjs <project> <port> <run>/);
  });

  it("names a vars file for each server and run inside browser-tests/.local/<server>/ (C8)", () => {
    const file = varsFile(root, "chromium", "0123456789abcdef");
    assert.equal(file, path.join(root, "browser-tests", ".local", "chromium", "run-0123456789abcdef.vars"));
    assert.notEqual(varsFile(root, "chromium", "fedcba9876543210"), file);
    assert.match(randomBytes(8).toString("hex"), RUN_ID_PATTERN);
    assert.doesNotMatch("../../x", RUN_ID_PATTERN);
  });
});

describe("browser-tests/playwright.config.mjs", () => {
  it("a process that loads the config without starting the servers removes only its own run's vars files at exit (C8)", () => {
    // Loading the config in a plain Node process stands for `playwright test --list` or an editor
    // listing the tests: the runner's exit hook is installed, no web server is started. Its run id
    // is given; a vars file of another run (and one of the earlier fixed name) must survive it.
    const mine = randomBytes(8).toString("hex");
    let other = randomBytes(8).toString("hex");
    while (other === mine) other = randomBytes(8).toString("hex");
    const folder = path.join(root, "browser-tests", ".local", "chromium");
    mkdirSync(folder, { recursive: true });
    const own = varsFile(root, "chromium", mine);
    const another = varsFile(root, "chromium", other);
    const fixed = path.join(folder, ".dev.vars");
    const hadFixed = existsSync(fixed);
    try {
      writeFileSync(own, "PLACEHOLDER=this run\n");
      writeFileSync(another, "PLACEHOLDER=another run\n");
      if (!hadFixed) writeFileSync(fixed, "PLACEHOLDER=another run\n");
      const env = { ...process.env, BROWSER_TESTS_RUN_ID: mine };
      delete env.TEST_WORKER_INDEX;
      const configUrl = new URL("../browser-tests/playwright.config.mjs", import.meta.url).href;
      const result = spawnSync(process.execPath, ["--input-type=module", "-e", `await import(${JSON.stringify(configUrl)});`], { cwd: root, env, encoding: "utf8", timeout: 120_000, windowsHide: true });
      assert.equal(result.status, 0, "the config loaded and the process exited");
      assert.equal(existsSync(own), false, "this run's vars file is removed at exit");
      assert.equal(existsSync(another), true, "another run's vars file is left alone");
      assert.equal(existsSync(fixed), true, "a .dev.vars of another run is left alone");
    } finally {
      rmSync(own, { force: true });
      rmSync(another, { force: true });
      if (!hadFixed) rmSync(fixed, { force: true });
    }
  });

  it("replaces an inherited run id that is not one, so it never reaches a path the exit hook removes (review layer, round 1)", () => {
    const configUrl = new URL("../browser-tests/playwright.config.mjs", import.meta.url).href;
    for (const inherited of ["../../outside", "0123456789ABCDEF", ""]) {
      const env = { ...process.env, BROWSER_TESTS_RUN_ID: inherited };
      delete env.TEST_WORKER_INDEX;
      const script = `await import(${JSON.stringify(configUrl)}); process.stdout.write(process.env.BROWSER_TESTS_RUN_ID);`;
      const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], { cwd: root, env, encoding: "utf8", timeout: 120_000, windowsHide: true });
      assert.equal(result.status, 0);
      assert.match(result.stdout, RUN_ID_PATTERN, "the run id used is a fresh valid one");
    }
  });
});
