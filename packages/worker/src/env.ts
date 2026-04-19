/**
 * Environment bindings available to the Worker at runtime. Kept in one place
 * so Hono's generic type argument stays in sync with `wrangler.toml`.
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
}
