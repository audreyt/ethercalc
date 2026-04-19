/**
 * `GET /manifest.appcache` — DevMode dynamic stub.
 *
 * Legacy (src/main.ls:70-75) emits a fresh CACHE MANIFEST in dev mode so
 * the browser always treats the cache as dirty and re-downloads everything
 * on refresh:
 *
 * ```livescript
 * @get "#BASEPATH/manifest.appcache": ->
 *   @response.type \text/cache-manifest
 *   if DevMode
 *     @response.send 200 "CACHE MANIFEST\n\n##{Date!}\n\nNETWORK:\n*\n"
 *   else
 *     @response.sendfile "#RealBin/manifest.appcache"
 * ```
 *
 * The legacy `Date!` was a LiveScript call producing a human-readable
 * date string. We use `Date.now()` (numeric ms) so the output is stable
 * and testable — the only requirement is that each hit produces a
 * different body. This module owns the DevMode branch; the production
 * branch delegates to the Workers Assets binding directly.
 *
 * Pure slice — the route layer wraps this in a Hono response with
 * `Content-Type: text/cache-manifest`.
 */

export const APPCACHE_CONTENT_TYPE = 'text/cache-manifest';

export interface BuildDynamicAppcacheOpts {
  /**
   * Injected for determinism in tests. Defaults to `Date.now()` at the
   * call site. The number is stringified verbatim into the comment line.
   */
  readonly now: number;
}

/**
 * Build the dynamic DevMode body. Shape must match legacy byte-for-byte:
 *
 *   `CACHE MANIFEST\n\n#<timestamp>\n\nNETWORK:\n*\n`
 *
 * The `#` line is a comment containing the timestamp. `NETWORK: *`
 * tells the browser that everything not listed under `CACHE:` may be
 * fetched from the network (we intentionally list nothing under CACHE
 * in dev, so every fetch goes straight through).
 */
export function buildDynamicAppcache(opts: BuildDynamicAppcacheOpts): string {
  return `CACHE MANIFEST\n\n#${opts.now}\n\nNETWORK:\n*\n`;
}
