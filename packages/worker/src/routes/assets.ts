/**
 * Workers Assets integration scaffolding (Phase 4). The real asset
 * pipeline (copying legacy files into a binding-managed dir) lands in
 * Phase 11. For now we expose a `serveAsset` helper that:
 *   - Delegates to `env.ASSETS.fetch()` when the binding is present.
 *   - Returns a 404 with `Content-Type: text/plain; charset=utf-8` when
 *     the binding is absent (test env fallback).
 *
 * Excluded from coverage for the same reason as `src/index.ts` —
 * exercised only via the `test:workers` integration pool which istanbul
 * can't instrument (CLAUDE.md §5.2).
 */
/* istanbul ignore file */
import type { Hono } from 'hono';

import type { Env } from '../env.ts';

export async function serveAsset(env: Env, pathname: string): Promise<Response> {
  if (!env.ASSETS) {
    return new Response('Not Found', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
  // `env.ASSETS.fetch` expects a full request; synthesise one from the
  // pathname. Asset bindings are keyed by pathname so the origin doesn't
  // matter — we use a placeholder to satisfy the URL constructor.
  const req = new Request(`https://assets.local${pathname}`, { method: 'GET' });
  return env.ASSETS.fetch(req);
}

/**
 * Register asset-backed routes. The legacy server's static assets were
 * served by `express.static(__dirname)` plus specific handlers for a
 * handful of files. Phase 4 scaffolds the plumbing; Phase 11 bundles
 * the real files into the asset binding.
 */
export function registerAssets(app: Hono<{ Bindings: Env }>): void {
  // Entry page — legacy served `index.html` at `/`.
  app.get('/', async (c) => serveAsset(c.env, '/index.html'));

  // Start page — second entry point.
  app.get('/_start', async (c) => serveAsset(c.env, '/start.html'));

  // Favicon + PWA manifests — all served as raw assets.
  for (const path of [
    '/favicon.ico',
    '/favicon-16x16.png',
    '/favicon-32x32.png',
    '/apple-touch-icon.png',
    '/android-chrome-192x192.png',
    '/mstile-150x150.png',
    '/mstile-310x310.png',
    '/safari-pinned-tab.svg',
    '/browserconfig.xml',
    '/manifest.json',
  ]) {
    app.get(path, async (c) => serveAsset(c.env, path));
  }

  // `manifest.appcache` — legacy had a DevMode dynamic stub (CLAUDE.md
  // §7 item 29). Under Workers the `.git` check doesn't apply; always
  // serve the static file from ASSETS. Dynamic stub for dev parity can
  // be added in Phase 11 if a developer needs it.
  app.get('/manifest.appcache', async (c) => serveAsset(c.env, '/manifest.appcache'));
}
