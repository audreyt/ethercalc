/**
 * Environment bindings available to the Worker at runtime. Kept in one place
 * so Hono's generic type argument stays in sync with `wrangler.toml`.
 *
 * Runtime caveat: under standalone workerd (`config.capnp`
 * `fromEnvironment` bindings), an env var that is UNSET in the process
 * environment arrives here as `null`, not `undefined` and not `''`.
 * Guard optional string fields with truthiness or `!= null`, never
 * `!== undefined` (see `lib/room-index-access.ts`).
 */
export interface Env {
  /** One Durable Object per spreadsheet room. */
  ROOM: DurableObjectNamespace;

  /**
   * D1 binding — cross-room index mirror (Phase 5.1). Authoritative room
   * state lives in the DO's own storage; this table provides the
   * cross-room query surface used by `/_rooms`, `/_roomlinks`,
   * `/_roomtimes`. Every snapshot mutation in `src/room.ts` upserts
   * here via `mirrorRoomToD1`; `DELETE /_do/all` removes the row via
   * `deleteRoomFromD1`. See CLAUDE.md §3.3 and §10.2.
   *
   * Optional because Node unit tests construct `RoomDO` and the Hono
   * app without a Miniflare-bound D1; the mirror helpers (and the
   * `/_rooms*` handlers) no-op / return empty when the binding is
   * missing.
   */
  readonly DB?: D1Database;

  /**
   * Static assets bound via Workers Assets. Used by the stateless route
   * layer to serve `index.html`, `start.html`, icons, `manifest.appcache`,
   * and so on. In local tests we may leave this undefined — routes fall
   * back to a 404 when ASSETS is absent (see `src/routes/assets.ts`).
   *
   * The asset pipeline itself (collecting the legacy repo-root files into
   * an asset dir) lands in Phase 11 (§8). Phase 4 only scaffolds the
   * binding so the rest of the wiring is ready.
   */
  readonly ASSETS?: Fetcher;

  /**
   * HMAC secret used to gate `edit`/`view`/`app` routes and WS `execute`
   * commands. When unset, the server falls back to identity HMAC and
   * anonymous operation (matches legacy `--key` absent behavior; see
   * CLAUDE.md §6.4).
   */
  readonly ETHERCALC_KEY?: string;

  /**
   * Optional URL basepath prefix (legacy `--basepath`). Threaded through
   * the redirect builders so deployments behind a sub-path router stay
   * consistent. Defaults to empty string.
   */
  readonly BASEPATH?: string;

  /**
   * DevMode flag. Legacy `src/main.ls` checked `fs.existsSync('.git')` to
   * decide whether to serve the dynamic `manifest.appcache` stub. Under
   * Workers we can't hit the filesystem, so we expose an explicit env
   * var: any truthy string (`'1'` or `'true'`) enables the DevMode path
   * which returns a fresh-timestamp CACHE MANIFEST body. Defaults to
   * off; production asset serving goes through `env.ASSETS` for the
   * static manifest file.
   */
  readonly DEVMODE?: string;

  /**
   * Single-grain default room. When set, `GET /` 302-redirects into
   * `/<ETHERCALC_DEFAULT_ROOM>` instead of serving the "create new
   * sheet" landing page. Used by Sandstorm grains — where each grain
   * IS a single sheet — to take the user straight to the spreadsheet
   * on `/`. Unset on ethercalc.net (shared pool of rooms, where `/`
   * legitimately is a landing page).
   */
  readonly ETHERCALC_DEFAULT_ROOM?: string;

  /**
   * Cloudflare `send_email` binding (Phase 9, §13 Q3). When present,
   * the cron/email layer wraps it via `BindingEmailSender`. When
   * unbound (Node unit tests, or deployments that omit the
   * `[[send_email]]` entry in wrangler.toml), callers fall back to
   * `StubEmailSender`. Shape is structural — we only invoke `.send()`.
   */
  readonly EMAIL?: {
    send(message: {
      from: string;
      to: string;
      raw: string | ReadableStream<Uint8Array>;
    }): Promise<unknown>;
  };

  /**
   * Default "from" address for outgoing mail (Phase 9). Must be a
   * verified sender in the Cloudflare dashboard for the bound zone.
   * Defaults to `noreply@ethercalc.invalid` when unset — the stub
   * sender ignores it entirely, so this only matters once `EMAIL` is
   * bound.
   */
  readonly EMAIL_FROM?: string;

  /**
   * Phase 11b — bearer token that unlocks `PUT /_migrate/seed/:room`,
   * the write path used by `@ethercalc/migrate` to import legacy
   * Redis dumps. When unset (the default on production deploys), the
   * route returns `404` — migration is an operator-opt-in action,
   * not a public surface. See `src/lib/migrate-auth.ts` for the
   * verifier and `src/routes/migrate.ts` for the Hono glue.
   *
   * Typical local flow:
   *   echo 'ETHERCALC_MIGRATE_TOKEN="local-only"' > packages/worker/.dev.vars
   *   ./bin/ethercalc                                          # Miniflare
   *   bun run migrate -- --input dump.rdb \
   *     --target http://127.0.0.1:8000 --token local-only
   */
  readonly ETHERCALC_MIGRATE_TOKEN?: string;

  /**
   * Legacy room-index gate, kept for hosted/back-compat (`wrangler.toml`
   * pins `'1'` for production Cloudflare deploys; the CLI `--cors` flag
   * sets it too). When enabled it 403s the cross-room discovery
   * endpoints: `/_rooms`, `/_roomlinks`, `/_roomtimes`, and
   * `/_exists/:room`. CORS *headers* are no longer affected — they are
   * emitted unconditionally for embed compatibility. Sensible-fix note:
   * parsed via `flagEnabled` (boolean-string), so `'0'`/`'false'`/`'no'`/
   * `'off'` now read as gate-OFF, where the pre-2026-06 code treated any
   * non-empty string as gate-ON. Prefer `ETHERCALC_DISABLE_ROOM_INDEX`
   * below for new configs.
   */
  readonly ETHERCALC_CORS?: string;

  /**
   * Clearly named self-host switch for hiding cross-room discovery endpoints:
   * `/_rooms`, `/_roomlinks`, `/_roomtimes`, and `/_exists/:room`. When unset,
   * the Worker falls back to the legacy `ETHERCALC_CORS` gate above so hosted
   * deployments keep their existing default.
   */
  readonly ETHERCALC_DISABLE_ROOM_INDEX?: string;

  /**
   * Room TTL in SECONDS (legacy `--expire` / Redis `EXPIRE` semantics,
   * §13 Q10). When set, the RoomDO's housekeeping `alarm()` wipes any
   * room whose `meta:updated_at` is older than this TTL — the DO-storage
   * equivalent of the legacy `EXPIRE snapshot-<room>`. Unset (the
   * default) means rooms live forever. Wired by `bin/ethercalc` into the
   * Miniflare env; on Cloudflare it's an optional `[vars]` entry.
   */
  readonly ETHERCALC_EXPIRE?: string;

  /**
   * Optional per-IP HTTP rate limit for self-host (§13 Q7). Unset or
   * false-like → off (hosted deploys rely on the Cloudflare edge).
   * Bare `1`/`true`/`on` → 10 r/s with burst 30 (nginx recipe default).
   * Plain number `N` → `N` requests/s; `window:max` → `max` per `window`
   * seconds. Keyed on `CF-Connecting-IP` / first `X-Forwarded-For` hop.
   */
  readonly ETHERCALC_RATELIMIT?: string;
}
