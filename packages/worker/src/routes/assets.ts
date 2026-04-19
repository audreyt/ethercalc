/**
 * Workers Assets integration (Phase 4.1 / 11-assets).
 *
 * Wires the curated `assets/` directory (produced by
 * `scripts/build-assets.sh`) onto the Hono router. The directory is
 * declared in `wrangler.toml` under `[assets] directory = "../../assets"`,
 * which produces an `env.ASSETS: Fetcher` binding at runtime.
 *
 * Behavior:
 *   - When `env.ASSETS` is bound, requests are proxied through to it via
 *     `env.ASSETS.fetch(request)` using a synthesized URL. The Workers
 *     Assets binding resolves by pathname alone.
 *   - When the binding is unbound (unit tests that import the router
 *     without a Miniflare env), routes return 404 with
 *     `Content-Type: text/plain; charset=utf-8`. Keeps oracle-replay
 *     Phase 4 expectations intact.
 *
 * Dynamic endpoints that can't be served as static files:
 *   - `GET /manifest.appcache` — DevMode returns a dynamic stub
 *     (§7 item 29). Production serves the file from ASSETS.
 *   - `GET /static/form:part.js` — literal-colon param route (§7 item 26).
 *     Translates to the repo-rooted `form<part>.js`. Delegates to ASSETS.
 *   - `GET /:room` entry page — redirects or serves `index.html` /
 *     `multi/index.html` depending on the `=` prefix and KEY state.
 *   - `GET /:template/form` — duplicates a template into a fresh room;
 *     requires Phase 5 room CRUD (currently stubs 503).
 *   - `GET /:template/appeditor` — serves `panels.html` from ASSETS.
 *
 * This file is excluded from coverage for the same reason as
 * `src/index.ts` — exercised via the workerd integration pool which
 * istanbul can't instrument (CLAUDE.md §5.2). The pure-logic builders
 * (`manifest-appcache.ts`, `static-form.ts`, `room-entry.ts`) live in
 * `../handlers/` and carry 100% coverage.
 */
/* istanbul ignore file */
import type { Hono } from 'hono';

import {
  buildDynamicAppcache,
  APPCACHE_CONTENT_TYPE,
} from '../handlers/manifest-appcache.ts';
import { buildFormPartPath } from '../handlers/static-form.ts';
import {
  buildRoomEntry,
  buildTemplateFormRedirect,
  TEMPLATE_FORM_STUB_STATUS,
} from '../handlers/room-entry.ts';
import type { Env } from '../env.ts';

/**
 * Proxy a request into the `ASSETS` binding. When the binding is absent
 * (unit tests importing the router without Miniflare), returns a 404 so
 * callers fail soft.
 */
export async function serveAsset(env: Env, pathname: string): Promise<Response> {
  if (!env.ASSETS) {
    return new Response('Not Found', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
  const req = new Request(`https://assets.local${pathname}`, { method: 'GET' });
  return env.ASSETS.fetch(req);
}

/**
 * Register asset-backed routes. See the file header for the inventory.
 */
export function registerAssets(app: Hono<{ Bindings: Env }>): void {
  // Root entry page. Legacy served `index.html` at `/`. We forward to
  // ASSETS which picks it up from the curated dir.
  app.get('/', async (c) => serveAsset(c.env, '/index.html'));

  // Secondary landing page used by the home-screen link.
  app.get('/_start', async (c) => serveAsset(c.env, '/start.html'));

  // Icon / PWA manifest family. Each path maps 1:1 to the same file in
  // `assets/`. Listed explicitly so the Hono router short-circuits before
  // `/:room` entry matching.
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

  // `manifest.appcache`. DevMode returns a dynamic stub with a fresh
  // timestamp (forces reload each hit); prod serves the static copy.
  app.get('/manifest.appcache', async (c) => {
    const dev = isDevMode(c.env);
    if (dev) {
      const body = buildDynamicAppcache({ now: Date.now() });
      return new Response(body, {
        status: 200,
        headers: { 'Content-Type': APPCACHE_CONTENT_TYPE },
      });
    }
    return serveAsset(c.env, '/manifest.appcache');
  });

  // `/l10n/:lang.json` — curated per-locale bundles. Explicitly registered
  // so Hono doesn't treat the path segment as the `/:room` entry page.
  // Any lang file missing from `assets/l10n/` yields a 404 from ASSETS.
  app.get('/l10n/:lang{.+\\.json}', async (c) => {
    const lang = c.req.param('lang');
    return serveAsset(c.env, `/l10n/${lang}`);
  });

  // `/static/socialcalc.js` — vendored SocialCalc 2.3.0 UMD (§13 Q8).
  app.get('/static/socialcalc.js', async (c) => serveAsset(c.env, '/static/socialcalc.js'));

  // `/static/player.js` — built single-sheet client bundle from
  // `packages/client/dist/player.js`.
  app.get('/static/player.js', async (c) => serveAsset(c.env, '/static/player.js'));

  // `/static/form<part>.js` — literal-colon segment route (§7 item 26).
  // Hono's trie splits on `/`, so `form:part.js` (the legacy syntax from
  // zappa/express) isn't recognized as a param; we instead register a
  // constrained segment `:file{form.+\.js}` that captures the whole
  // filename and then peel off the `form`/`.js` wrappers ourselves.
  // `buildFormPartPath` does the extraction + rebuild.
  app.get('/static/:file{form.+\\.js}', async (c) => {
    const file = c.req.param('file');
    const part = file.slice('form'.length, -'.js'.length);
    const target = buildFormPartPath(part);
    return serveAsset(c.env, target);
  });

  // `/:template/appeditor` — Phase 4.1 panels.html route (§6.1). Ordering:
  // this has a literal `/appeditor` suffix so it can safely register
  // alongside the static family above without shadowing. Hono picks the
  // longer-literal-path match first.
  app.get('/:template/appeditor', async (c) => serveAsset(c.env, '/panels.html'));

  // `/:template/form` — Phase 4.1 template-duplicate redirect (§6.1).
  // Requires Room CRUD (Phase 5) which is landing in a parallel agent;
  // until then, return a 503 with the body the builder emits so tests
  // can assert the stub shape. When Phase 5 wires `env.ROOM.get(...)
  // .fetch('/_do/clone')` this handler swaps to the real path.
  app.get('/:template/form', async (c) => {
    const result = buildTemplateFormRedirect({ template: c.req.param('template') });
    if (result.status === 302) {
      return new Response(result.body, {
        status: 302,
        headers: { ...result.headers },
      });
    }
    return new Response(result.body, {
      status: TEMPLATE_FORM_STUB_STATUS,
      headers: { ...result.headers },
    });
  });
}

/**
 * Register the `/:room` entry-page handler. MUST be called AFTER every
 * other GET route registration so the trie matches static prefixes and
 * more-specific paths first. See `buildApp` in `../index.ts`.
 *
 * This is split out (rather than living inside `registerAssets`) so a
 * future `registerRoomCrud` from Phase 5 can cleanly slot between the
 * assets routes and the catch-all: extending `registerAssets` to also
 * register `/:room` would force Phase 5 to either register its `/_rooms`
 * etc. before `registerAssets` or run a custom re-ordering step.
 */
export function registerRoomCatchAll(app: Hono<{ Bindings: Env }>): void {
  app.get('/:room', async (c) => {
    const roomParam = c.req.param('room') ?? '';
    const authQuery = c.req.query('auth');
    const key = c.env.ETHERCALC_KEY;
    const opts = {
      basepath: c.env.BASEPATH ?? '',
      room: roomParam,
      ...(authQuery !== undefined ? { authQuery } : {}),
      ...(key !== undefined ? { key } : {}),
    };
    const decision = buildRoomEntry(opts);
    if (decision.kind === 'redirect') {
      const body = decision.body;
      return new Response(body, {
        status: 302,
        headers: { ...decision.headers },
      });
    }
    // kind === 'serve' — hand off to the ASSETS binding for index.html
    // (or multi/index.html when the room is prefixed with `=`).
    return serveAsset(c.env, decision.path);
  });
}

/**
 * DevMode resolution. Legacy `src/main.ls` checks `fs.existsSync('.git')`
 * at the repo root to decide. We can't reproduce that in workerd, so we
 * expose a simple env flag: when `DEVMODE=1` is set, return the dynamic
 * stub. Defaults off in production. In local `wrangler dev` the flag can
 * be set via `wrangler.toml`'s `[vars]` or `--var DEVMODE=1`.
 */
function isDevMode(env: Env): boolean {
  return env.DEVMODE === '1' || env.DEVMODE === 'true';
}
