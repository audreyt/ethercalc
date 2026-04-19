/**
 * Environment bindings available to the Worker at runtime. Kept in one place
 * so Hono's generic type argument stays in sync with `wrangler.toml`.
 */
export interface Env {
  /** One Durable Object per spreadsheet room. */
  ROOM: DurableObjectNamespace;

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
}
