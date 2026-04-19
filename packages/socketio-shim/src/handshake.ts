/**
 * Pure helpers for the socket.io v0.9 handshake exchange.
 *
 * The legacy handshake is a single HTTP GET to `/socket.io/1/` (with an
 * optional JSONP `?t=` or `?jsonp=` query that we ignore). The response
 * body is a colon-delimited tuple:
 *
 *   `<sid>:<hbTimeoutSec>:<closeTimeoutSec>:<transports>`
 *
 * Example: `abcd1234:60:60:websocket,xhr-polling`
 *
 * After that the client picks a transport and upgrades/polls at
 * `/socket.io/1/<transport>/<sid>`. We route each transport separately.
 *
 * Path forms we accept:
 *   - `/socket.io/1/`                         handshake
 *   - `/socket.io/1/websocket/<sid>`          WS upgrade
 *   - `/socket.io/1/xhr-polling/<sid>`        long-poll
 *   - `/socket.io/1/jsonp-polling/<sid>/<i>`  jsonp long-poll (rarely used)
 *
 * An optional `BASEPATH` prefix is allowed: any leading path up to the
 * literal `/socket.io/` is stripped before matching. This mirrors the
 * `BASEPATH` env-var pattern the worker already uses for other routes
 * (§7 item 32 — CLI ports that knob through).
 */

/** Default transports list matches the legacy server's advertised set. */
export const DEFAULT_TRANSPORTS = ['websocket', 'xhr-polling'] as const;

export interface HandshakeOptions {
  /** Session id generated per handshake; opaque to the client. */
  sid: string;
  /** Heartbeat timeout in seconds. Server sends `2::` every hbTimeoutSec/2. */
  hbTimeoutSec: number;
  /** Close timeout — how long the client waits before reconnecting. */
  closeTimeoutSec: number;
  /** Transports advertised to the client (order = preference). */
  transports: readonly string[];
}

/**
 * Build the handshake response body. No headers — Content-Type is
 * `text/plain; charset=utf-8` and is set by the worker at the call site.
 */
export function buildHandshakeResponse(opts: HandshakeOptions): string {
  return `${opts.sid}:${opts.hbTimeoutSec}:${opts.closeTimeoutSec}:${opts.transports.join(',')}`;
}

export interface HandshakePathMatch {
  /** "handshake" for `/socket.io/1/`; otherwise the transport name. */
  transport?: string;
  /** Present for transport routes; undefined for the initial handshake. */
  sid?: string;
}

/**
 * Regex-parse a URL's pathname against the legacy socket.io path family.
 *
 * Accepts any fully-qualified URL or raw pathname. Returns `null` when
 * the path doesn't match any legacy form — callers should treat that as
 * "not socket.io territory, fall through".
 *
 * Returns:
 *   - `{}` for `/socket.io/1/` (the initial handshake)
 *   - `{ transport, sid }` for transport routes
 *
 * We don't return the jsonp-polling `i` suffix separately; it isn't used
 * by any current sheetnode-era client we support. If it ever matters the
 * adapter can pull it from the raw URL.
 */
export function parseHandshakePath(url: string): HandshakePathMatch | null {
  if (typeof url !== 'string' || url.length === 0) return null;

  // Strip query/fragment and accept both full URLs and bare paths.
  let pathname: string;
  try {
    // Use a synthetic base so relative paths work with the URL ctor.
    pathname = new URL(url, 'http://x').pathname;
  } catch {
    return null;
  }

  // Strip any BASEPATH prefix — everything before `/socket.io/`.
  const anchor = pathname.indexOf('/socket.io/');
  if (anchor === -1) return null;
  const tail = pathname.slice(anchor);

  // Initial handshake: `/socket.io/1/` (trailing slash required by spec;
  // also accept without it for liberal clients).
  if (tail === '/socket.io/1/' || tail === '/socket.io/1') {
    return {};
  }

  // Transport routes: `/socket.io/1/<transport>/<sid>[/<i>]`
  // Transport = lowercase letters + hyphen; sid = URL-safe token.
  const m = /^\/socket\.io\/1\/([a-z-]+)\/([A-Za-z0-9_-]+)(?:\/[^/]*)?\/?$/.exec(tail);
  if (m) {
    return { transport: m[1]!, sid: m[2]! };
  }

  return null;
}
