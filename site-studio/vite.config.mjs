import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { createReviewApi } from "./server/reviewApi.mjs";

const localReviewApi = createReviewApi({ directory: fileURLToPath(new URL("./.review-data/", import.meta.url)) });
const localReviews = {
  name: "site-studio-local-reviews",
  configureServer(server) { server.middlewares.use(localReviewApi); },
  configurePreviewServer(server) { server.middlewares.use(localReviewApi); },
};

export default defineConfig({
  build: {
    outDir: "dist/client",
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    fs: { deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "**/.review-data/**"] },
    watch: { ignored: ["**/.review-data/**"] },
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  plugins: [react(), localReviews],
});
