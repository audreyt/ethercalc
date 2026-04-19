/// <reference types="node" />
import { defineConfig } from 'vite';
import { resolve } from 'node:path';

/**
 * Single-sheet browser client.
 *
 * Build output: `dist/player.js` + `dist/player.css`.
 * Served by the Worker under `/static/player.js` / `/static/player.css`.
 *
 * The legacy `<script src="/static/socialcalc.js">` still loads SocialCalc
 * on the page before our bundle executes, so we treat `window.SocialCalc`
 * as a runtime global (see `src/types.ts`).
 */
export default defineConfig({
  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: resolve(__dirname, 'src/boot.ts'),
      output: {
        format: 'esm',
        entryFileNames: 'player.js',
        chunkFileNames: 'player-[name].js',
        assetFileNames: (asset) =>
          asset.name && asset.name.endsWith('.css') ? 'player.css' : 'assets/[name][extname]',
      },
    },
  },
  esbuild: {
    target: 'es2022',
  },
});
