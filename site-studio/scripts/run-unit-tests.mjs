#!/usr/bin/env node
// Runs the existing unit tests in tests/ with Node's test runner. The Sites test is left out
// because it checks build output; run it after `npm run build` with `npm run test:sites`.
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const files = readdirSync(path.join(root, "tests"))
  .filter((name) => name.endsWith(".test.mjs") && name !== "sites-worker.test.mjs")
  .sort()
  .map((name) => path.join("tests", name));

const result = spawnSync(process.execPath, ["--test", ...files], { cwd: root, stdio: "inherit" });
process.exit(result.status ?? 1);
