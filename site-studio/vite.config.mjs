import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createReviewApi } from "./server/reviewApi.mjs";

const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));
const localReviewApi = createReviewApi({ directory: fileURLToPath(new URL("./.review-data/", import.meta.url)) });
const localReviews = {
  name: "site-studio-local-reviews",
  configureServer(server) { server.middlewares.use(localReviewApi); },
  configurePreviewServer(server) { server.middlewares.use(localReviewApi); },
};

export default defineConfig({
  define: {
    // The release version every object call carries (shared/release.ts).
    __SITE_STUDIO_RELEASE__: JSON.stringify(version),
  },
  environments: {
    // The app's files, also used by the Sites package (scripts/prepare-sites-build.mjs).
    client: { build: { outDir: "dist/client" } },
    // The server bundle for both hosts; never dist/server, which belongs to the Sites package.
    worker: { build: { outDir: "dist/worker" } },
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    fs: { deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "**/.review-data/**"] },
    watch: { ignored: ["**/.review-data/**", "**/.wrangler/**"] },
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  // The review plugin comes before Cloudflare's so that its middleware still answers
  // /api/reviews/ first in development; the Worker refuses that address when deployed.
  plugins: [react(), localReviews, cloudflare({ configPath: "deploy/cloudflare/wrangler.jsonc", viteEnvironment: { name: "worker" } }),
  ],
});
