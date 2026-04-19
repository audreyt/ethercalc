import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config for the multi-sheet client. Builds to `dist/` with esnext target
// (no legacy polyfills — we ship for evergreen browsers, matching the worker's
// modern Cloudflare runtime). CSS Modules are on by default for *.module.css.
//
// `base: '/multi/'` — the worker mounts this bundle under `/multi/` via
// `scripts/build-assets.sh` but serves the index.html at `/=:room` (via
// `buildRoomEntry`'s `/multi/index.html` path). Without a base prefix, the
// emitted `<script src="/assets/..."` refs would 404 because they'd look for
// the bundle at the server root, not under `/multi/`. Setting `base` rewrites
// the HTML to `<script src="/multi/assets/...">` so the URLs work regardless
// of the serving URL.
export default defineConfig({
  base: '/multi/',
  plugins: [react()],
  build: {
    target: 'esnext',
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    sourcemap: true,
  },
  server: {
    port: 8080,
    host: '127.0.0.1',
  },
});
