// R7: the real prototype (root = site-studio) served through Cloudflare's Vite plugin.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cloudflare } from '@cloudflare/vite-plugin';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('../../site-studio/', import.meta.url)),
  build: { outDir: fileURLToPath(new URL('./dist/', import.meta.url)), emptyOutDir: true },
  plugins: [react(), cloudflare({ configPath: fileURLToPath(new URL('./wrangler.jsonc', import.meta.url)) })],
});
