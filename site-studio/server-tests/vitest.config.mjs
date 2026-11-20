// Server tests inside Cloudflare's runtime (workerd), through @cloudflare/vitest-plugin, using
// the Cloudflare host configuration itself.
import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const { version } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

export default defineConfig({
  root: fileURLToPath(new URL("..", import.meta.url)),
  define: {
    __SITE_STUDIO_RELEASE__: JSON.stringify(version),
  },
  plugins: [
    cloudflareTest({
      wrangler: { configPath: fileURLToPath(new URL("../deploy/cloudflare/wrangler.jsonc", import.meta.url)) },
    }),
  ],
  test: {
    include: ["server-tests/**/*.test.ts"],
  },
});
