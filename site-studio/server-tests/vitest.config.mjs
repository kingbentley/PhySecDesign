// Server tests inside Cloudflare's runtime (workerd), through @cloudflare/vitest-plugin, using
// the Cloudflare host configuration itself.
import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const { version } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

// A deployment key for this run only (story 1.5), generated when the configuration loads and
// passed as the Worker's `DEPLOYMENT_KEY` binding for the route tests; never written to a file.
// Store-level tests pass keys of their own.
const deploymentKey = randomBytes(32).toString("base64url");

export default defineConfig({
  root: fileURLToPath(new URL("..", import.meta.url)),
  define: {
    __SITE_STUDIO_RELEASE__: JSON.stringify(version),
  },
  plugins: [
    cloudflareTest({
      wrangler: { configPath: fileURLToPath(new URL("../deploy/cloudflare/wrangler.jsonc", import.meta.url)) },
      miniflare: { bindings: { DEPLOYMENT_KEY: deploymentKey } },
    }),
  ],
  test: {
    include: ["server-tests/**/*.test.ts"],
  },
});
