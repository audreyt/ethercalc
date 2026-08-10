/**
 * EtherCalc Worker entry point. HTTP routing lives in Hono; pure request-
 * handling logic lives in `./handlers/`. This file is intentionally tiny
 * glue — it's excluded from the 100% coverage gate (see `vitest.config.ts`)
 * because istanbul inside `@cloudflare/vitest-pool-workers` doesn't track
 * hits through Hono's bundled invocation path (see AGENTS.md §5.2).
 */
/* istanbul ignore file */
import { MAX_WS_FRAME_CHARS } from '@ethercalc/shared/messages';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';

import { websocketAuthority } from './lib/csp.ts';
import {
  isIndexablePath,
  ROBOTS_NOINDEX,
  ROBOTS_TXT,
} from './lib/robots.ts';
import { buildHealthBody } from './handlers/health.ts';
import {
  clientIpFromHeaders,
  createRateLimitStore,
  isRateLimitExemptPath,
  rateLimitConfigFromEnv,
} from './lib/rate-limit.ts';
import {
  createRateLimitStore as createRoomCreateStore,
  isRoomCreationRoute,
  roomCreateLimitFromEnv,
} from './lib/room-create-limit.ts';
import { parseSessionCookie } from './lib/session.ts';
import { sandstormBlocksMutation } from './lib/sandstorm-access.ts';
import { registerAuth } from './routes/auth.ts';
import { registerAssets, registerRoomCatchAll } from './routes/assets.ts';
import { registerExports } from './routes/exports.ts';
import { registerMultiSheetImport } from './routes/multi-import.ts';
import { registerLegacySocketIo } from './routes/legacy-socketio.ts';
import { registerMigrate } from './routes/migrate.ts';
import { registerRoomRoutes } from './routes/rooms.ts';
import { registerStateless } from './routes/stateless.ts';
import { registerTimetrigger } from './routes/timetrigger.ts';
import { registerWs } from './routes/ws.ts';
import { scheduled } from './scheduled.ts';
import type { EtherCalcHonoEnv } from './env.ts';

export { RoomDO } from './room.ts';
export { AuthDO } from './auth-do.ts';
export { scheduled } from './scheduled.ts';

/**
 * Build the root Hono app. Exported for tests so they can construct it
 * with whatever `Env` they need. The default export at the bottom wires
 * the production app.
 *
 * Route ordering rationale: Hono's radix/trie router matches static
 * prefixes before params, so the specific `/:room/edit` etc register
 * cleanly alongside static `/_new`, `/_start`, `/etc/*`, `/var/*`. The
 * generic `/:room` entry-page route registers LAST (via
 * `registerRoomCatchAll`) so future `_rooms`, `_from/:template`, etc
 * additions sit in front of it in the trie. Phase 5 work that lands
 * new `/_*` routes should plug into `registerStateless` or a new
 * `registerRoomCrud` between the two calls — never after
 * `registerRoomCatchAll`.
 */
const rateLimitStore = createRateLimitStore();
const roomCreateStore = createRoomCreateStore();

export function buildApp(): Hono<EtherCalcHonoEnv> {
  const app = new Hono<EtherCalcHonoEnv>();
  // APIs remain CORS-friendly for external embeds and dashboards.
  app.use('*', cors());
  app.use('*', async (c, next) => {
    await next();
    const hasSession = parseSessionCookie(c.req.header('Cookie') ?? null) !== null;
    const isAuthRoute = c.req.path.startsWith('/_auth/');
    const hasAuthorization = c.req.header('Authorization') !== undefined;
    const isOperatorRoute =
      c.req.path.startsWith('/_migrate/') ||
      c.req.path === '/_timetrigger' ||
      c.req.path.endsWith('/pitr-restore');
    const hasRouteCsp = c.res.headers.has('Content-Security-Policy');
    const forwardedProto = c.req.header('X-Forwarded-Proto');
    const requestUrl = new URL(c.req.url);
    const secureTransport =
      requestUrl.protocol === 'https:' || forwardedProto === 'https';
    // The WebSocket authority in `connect-src` is a trust anchor like the
    // `www` redirect below: prefer the configured origin so a spoofed `Host`
    // cannot name a third-party host in our own policy. Self-hosts that leave
    // `ETHERCALC_ORIGIN` unset fall back to the request host.
    // SocialCalc's trusted toolbar/dialog renderer still emits inline event
    // handlers. Stored cell HTML is separately sanitized by DOMPurify; keep
    // inline handlers enabled here until the upstream UI stops generating them.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self' data:",
      `connect-src 'self' ${websocketAuthority(c.env.ETHERCALC_ORIGIN, requestUrl, secureTransport)}`,
      "worker-src 'self'",
      "frame-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ];
    if (hasSession) csp.push("frame-ancestors 'self'");
    if (secureTransport) csp.push('upgrade-insecure-requests');
    if (!hasRouteCsp) c.header('Content-Security-Policy', csp.join('; '));
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    c.header('Permissions-Policy', 'camera=(), geolocation=(), microphone=()');
    c.header('Cross-Origin-Opener-Policy', 'same-origin');
    if (secureTransport) {
      c.header('Strict-Transport-Security', 'max-age=31536000');
    }
    if (hasSession && !hasRouteCsp) {
      c.header('X-Frame-Options', 'SAMEORIGIN');
    }
    if (hasSession || isAuthRoute || hasAuthorization || isOperatorRoute) {
      c.header('Cache-Control', 'private, no-store');
    }
    if (hasSession || isAuthRoute) {
      c.header('Vary', 'Cookie', { append: true });
    }
    if (hasAuthorization || isOperatorRoute) {
      c.header('Vary', 'Authorization', { append: true });
    }
    // Room URLs are unlisted by design. Keep the response fetchable so
    // crawlers can observe this header; do NOT add a robots.txt Disallow
    // for the same paths (that freezes already-indexed rooms forever).
    if (!isIndexablePath(c.req.path)) {
      c.header('X-Robots-Tag', ROBOTS_NOINDEX);
    }
  });
  // Redirect only the configured relying-party host's `www` alias. Never
  // derive a cross-origin Location from an attacker-controlled Host header.
  app.use('*', async (c, next) => {
    const url = new URL(c.req.url);
    const configuredOrigin = c.env.ETHERCALC_ORIGIN;
    if (typeof configuredOrigin === 'string' && configuredOrigin.length > 0) {
      try {
        const canonical = new URL(configuredOrigin);
        if (url.hostname === `www.${canonical.hostname}`) {
          const destination = new URL(canonical.origin);
          destination.pathname = url.pathname;
          destination.search = url.search;
          destination.hash = url.hash;
          return c.redirect(destination.toString(), 301);
        }
      } catch {
        // Invalid deploy configuration must not create an open redirect.
      }
    }
    await next();
  });
  // SameSite=Lax blocks ordinary cross-site session CSRF, but not an
  // untrusted sibling subdomain (same-site, cross-origin). Browser mutations
  // carry Origin; require the configured WebAuthn origin whenever a session
  // cookie accompanies an unsafe request. Origin-less non-browser API callers
  // remain compatible unless they explicitly identify as cross-site.
  app.use('*', async (c, next) => {
    const method = c.req.method;
    const unsafe = method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS';
    const hasSession =
      parseSessionCookie(c.req.header('Cookie') ?? null) !== null;
    if (unsafe && hasSession) {
      const origin = c.req.header('Origin');
      const fetchSite = c.req.header('Sec-Fetch-Site');
      if (origin !== undefined || fetchSite === 'cross-site') {
        if (
          typeof c.env.ETHERCALC_ORIGIN !== 'string' ||
          origin !== c.env.ETHERCALC_ORIGIN
        ) {
          return c.text('Forbidden', 403);
        }
      }
    }
    await next();
  });
  // Optional self-host abuse belt-and-suspenders (§13 Q7). Default off;
  // when `ETHERCALC_RATELIMIT` is set, apply a per-IP token bucket before
  // routing. Health probes stay exempt.
  app.use('*', async (c, next) => {
    const config = rateLimitConfigFromEnv(c.env);
    if (!config || isRateLimitExemptPath(c.req.path)) {
      await next();
      return;
    }
    const result = rateLimitStore.consume(
      clientIpFromHeaders(c.req.raw.headers),
      config,
    );
    if (!result.allowed) {
      c.header('Retry-After', String(result.retryAfterSec));
      return c.text('Too Many Requests', 429);
    }
    await next();
  });
  // SH-3: optional per-IP cap on room-creation endpoints (default off).
  app.use('*', async (c, next) => {
    const config = roomCreateLimitFromEnv(c.env);
    if (
      !config ||
      isRateLimitExemptPath(c.req.path) ||
      !isRoomCreationRoute(c.req.method, c.req.path)
    ) {
      await next();
      return;
    }
    const result = roomCreateStore.consume(
      clientIpFromHeaders(c.req.raw.headers),
      config,
    );
    if (!result.allowed) {
      c.header('Retry-After', String(result.retryAfterSec));
      return c.text('Too Many Requests', 429);
    }
    await next();
  });
  // SH-6: Sandstorm viewer role — block mutations without `modify`.
  app.use('*', async (c, next) => {
    if (
      sandstormBlocksMutation(
        c.env,
        c.req.method,
        c.req.path,
        c.req.raw.headers,
      )
    ) {
      return c.text('Forbidden', 403);
    }
    await next();
  });
  // Bound every public buffering path before its route reads the body.
  // General snapshots and workbook imports may use 25 MiB; ordinary command
  // JSON/text is capped at 1 MiB. Auth ceremonies get a tighter 64 KiB cap.
  const MAX_WRITE_BYTES = 25 * 1024 * 1024;
  const MAX_COMMAND_BODY_BYTES = 1024 * 1024;
  const MAX_AUTH_BODY_BYTES = 64 * 1024;
  const MAX_LEGACY_BODY_BYTES = MAX_WS_FRAME_CHARS + 1024;
  app.use('/_', bodyLimit({ maxSize: MAX_WRITE_BYTES }));
  app.use('/_/*', bodyLimit({ maxSize: MAX_WRITE_BYTES }));
  app.use('/:room', bodyLimit({ maxSize: MAX_WRITE_BYTES }));
  app.use('/_migrate/*', bodyLimit({ maxSize: MAX_WRITE_BYTES }));
  const commandBodyLimit = bodyLimit({ maxSize: MAX_COMMAND_BODY_BYTES });
  app.use('/_/:room', async (c, next) => {
    if (c.req.method !== 'POST') return next();
    const contentType = (c.req.header('content-type') ?? '')
      .split(';', 1)[0]!
      .trim()
      .toLowerCase();
    if (
      contentType === 'text/csv' ||
      contentType ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      contentType === 'application/vnd.oasis.opendocument.spreadsheet'
    ) {
      return next();
    }
    return commandBodyLimit(c, next);
  });
  app.use('/_auth/*', bodyLimit({ maxSize: MAX_AUTH_BODY_BYTES }));
  app.use('/socket.io/*', bodyLimit({ maxSize: MAX_LEGACY_BODY_BYTES }));
  app.get('/_health', (c) => c.json(buildHealthBody()));
  // Fetchable on purpose: crawlers must reach this file AND the
  // X-Robots-Tag on room responses. See lib/robots.ts.
  app.get('/robots.txt', (c) =>
    c.text(ROBOTS_TXT, 200, {
      'Content-Type': 'text/plain; charset=utf-8',
    }),
  );
  // Phase 7: native WS + legacy socket.io shim. Register early so their
  // literal prefixes win against the `/:room` catch-all. `/_ws/:room` is
  // the native transport; `/socket.io/*` covers the old embeds.
  registerWs(app);
  registerLegacySocketIo(app);
  // Phase 9 — backwards-compat `/_timetrigger` endpoint. Registered before
  // the room routes so the `_timetrigger` literal wins against any
  // `/_exists/:room` pattern (same leading underscore). Reads the D1
  // `cron_triggers` table and fires due rows just like `scheduled()`.
  registerTimetrigger(app);
  // Phase 11b — migration seed endpoint (`PUT /_migrate/seed/:room`).
  // Registered before the room routes so the `_migrate` literal prefix
  // wins against `/_/:room` patterns. Gated by `ETHERCALC_MIGRATE_TOKEN`
  // inside the handler; no risk of exposing it accidentally.
  registerMigrate(app);
  // Phase A — passkey ceremonies (`POST /_auth/*`). Registered before the
  // room routes so the `_auth` literal wins against `/:room` patterns.
  // Every route self-gates on `ETHERCALC_AUTH` + the AUTH binding.
  registerAuth(app);
  // Room index + CRUD — register BEFORE stateless so `/_rooms`, `/_exists/:room`,
  // `/_from/:template` etc take precedence over any `/:room`-style catch-all.
  registerRoomRoutes(app);
  // Exports — `/_/:room/<format>` and `/:room.<format>`. Registered after
  // CRUD (so `/_/:room` itself still wins for raw-save) but before the
  // `/:room` catch-all (so `/foo.csv` routes to the csv exporter rather
  // than being treated as a room-entry request).
  registerExports(app);
  registerMultiSheetImport(app);
  registerStateless(app);
  registerAssets(app);
  registerRoomCatchAll(app);
  return app;
}

// Module-worker default export: Cloudflare calls `fetch` for HTTP + WS
// upgrades and `scheduled` for cron triggers (Phase 9). Using the Hono
// app's `.fetch` directly keeps the existing HTTP routing intact.
const _app = buildApp();
export default {
  fetch: _app.fetch.bind(_app),
  scheduled,
};
