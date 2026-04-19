import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config for the multi-sheet client. Builds to `dist/` with esnext target
// (no legacy polyfills — we ship for evergreen browsers, matching the worker's
// modern Cloudflare runtime). CSS Modules are on by default for *.module.css.
export default defineConfig({
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
