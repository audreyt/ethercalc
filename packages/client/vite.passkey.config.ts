/// <reference types="node" />
import { defineConfig } from 'vite-plus';
import { resolve } from 'node:path';

/**
 * Passkey / room-access UI bundle (Material 3 Expressive — `@m3e/web`).
 *
 * A SEPARATE Vite config from `vite.config.ts`, not a second entry added to
 * it: `build.outDir` applies to a whole build invocation, not per-input, so
 * a second `rollupOptions.input` in the existing config can't emit to its
 * own directory.
 *
 * Build output: `dist-passkey/ui.js` (+ `dist-passkey/ui.css` if any
 * light-DOM CSS is extracted — M3E's own shadow-DOM component styles never
 * emit as a separate asset). `entryFileNames` is pinned to `ui.js` — same
 * reason `vite.config.ts` pins `player.js`: `index.html`/`start.html` are
 * plain static HTML (not Vite-built entries), so the `<script>` tag they
 * reference must be a stable, predictable path, not Rollup's default
 * content hash. Unlike `player.js`, this build's *chunk*-splitting
 * behavior is left unpinned (whether `@m3e/web` triggers it internally is
 * unverified) — `scripts/build-assets.ts` copies the whole `dist-passkey/`
 * directory (mirroring how `client-multi`'s multi-file `dist/` is already
 * directory-copied), so any additional hashed chunk file Rollup emits
 * still ships correctly even though only the entry's name is fixed.
 *
 * `src/boot.ts` (the `player.js` entry) never imports `@m3e/web/*` — this
 * is the only Rollup graph that does, so there is nothing for `player.js`
 * to extract a shared chunk from in the first place.
 */
/**
 * Prepends a license-notice pointer comment to the emitted entry chunk
 * only. `rollupOptions.output.banner` is explicitly typed out for
 * Vite's Rolldown-backed build (`Omit<OutputOptions, ... | "banner">`)
 * - a `generateBundle` hook operates directly on the final chunks
 * instead, unaffected by that restriction.
 *
 * Scoped to `isEntry` (not every chunk `generateBundle` sees): this
 * build's chunk-splitting is deliberately left unpinned (see the
 * top-of-file doc comment), so a future extra chunk would land under
 * `assets/[name]-[hash].js`, not next to `ui.js` - a `./NOTICE`-style
 * *relative* reference banner-ed onto every chunk would resolve
 * correctly from `ui.js` but wrongly (`assets/NOTICE`, which doesn't
 * exist) from such a chunk. One banner on the one stable, pinned entry
 * file avoids that, and the wording itself names the repo-relative
 * path outright rather than relying on "same directory as this file".
 */
function licenseNoticeBanner() {
  const banner =
    '/*! Bundles third-party code under separate licenses. ' +
    'Full attribution and license text: /static/passkey/NOTICE once deployed ' +
    '(source: third-party/m3e/NOTICE, copied by scripts/build-assets.ts). */\n';
  return {
    name: 'license-notice-banner',
    generateBundle(_options: unknown, bundle: Record<string, { type: string; isEntry?: boolean; code?: string }>) {
      for (const file of Object.values(bundle)) {
        if (file.type === 'chunk' && file.isEntry && typeof file.code === 'string') {
          file.code = banner + file.code;
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [licenseNoticeBanner()],
  build: {
    target: 'es2022',
    outDir: 'dist-passkey',
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: resolve(__dirname, 'src/passkey/ui.ts'),
      output: {
        format: 'esm',
        entryFileNames: 'ui.js',
        assetFileNames: (asset) =>
          asset.name && asset.name.endsWith('.css') ? 'ui.css' : 'assets/[name][extname]',
      },
    },
  },
  esbuild: {
    target: 'es2022',
  },
});
