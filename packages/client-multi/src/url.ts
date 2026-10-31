/**
 * URL/env parsing that mirrors the legacy `multi/main.ls` preamble.
 *
 *   BasePath = '.' normally.
 *     In Vite dev only, if location.href contains
 *     `(127.0.0.1|localhost|*.local):8080`, BasePath becomes
 *     `http://127.0.0.1:8000` (client-multi dev server → wrangler API).
 *     Production builds (including Sandstorm grains on localhost:8080) keep `.`.
 *     If any `?auth=` param exists and BasePath is `.`, it is bumped to `..`
 *     (the page moves one path segment deeper once we push history).
 *
 *   Index (room name) = capture from `/=<index>` URL; fallback `foobar`.
 *
 *   IsReadOnly = true when `auth=0` appears anywhere in the href.
 *     When `auth` is present in the query, IsReadOnly matches only `auth=0`.
 *
 *   Suffix = ''
 *     When `?auth=` is in the query, Suffix becomes `/view` (readonly) or
 *     `/edit` (writable). The history path retains the capability so reloads
 *     and keyed server redirects keep the same access.
 */

export interface MultiEnv {
  readonly basePath: string;
  readonly index: string;
  readonly auth: string | null;
  readonly isReadOnly: boolean;
  readonly suffix: '' | '/view' | '/edit';
  /** Path the UI should push into window.history.pushState. Null = no push. */
  readonly pushStatePath: string | null;
}

/** Fallback room name when the URL doesn't match the `/=<room>` pattern. */
export const DEFAULT_INDEX = 'foobar';

const DEV_HOST_RE = /(?:127\.0\.0\.1|localhost|\.local):8080(?!\d)/;
const INDEX_RE = /\/=([^_][^/?]*)(?:\?.*)?$/;
const AUTH_IN_HREF_RE = /auth=0/;

/** Keep the room capability on same-origin requests and navigation links. */
export function withAuthQuery(url: string, auth: string | null | undefined): string {
  if (auth === null || auth === undefined) return url;
  return `${url}${url.includes('?') ? '&' : '?'}auth=${encodeURIComponent(auth)}`;
}

/** Resolve `VITE_ETHERCALC_BASE` with an optional test override. */
export function resolveViteApiBase(
  override: string | undefined,
  envValue: unknown = import.meta.env.VITE_ETHERCALC_BASE,
): string {
  if (override !== undefined) return override;
  return typeof envValue === 'string' ? envValue : '';
}

export function parseMultiEnv(
  loc: { href: string; search: string },
  /** Test seam — production callers omit this. */
  viteBaseOverride?: string,
  /** Test seam — defaults to `import.meta.env.DEV`. */
  isDev: boolean = import.meta.env.DEV,
): MultiEnv {
  const viteApi = resolveViteApiBase(viteBaseOverride);
  let basePath: string =
    viteApi.length > 0
      ? viteApi.replace(/\/$/, '')
      : isDev && DEV_HOST_RE.test(loc.href)
        ? 'http://127.0.0.1:8000'
        : '.';

  const indexMatch = INDEX_RE.exec(loc.href);
  const index = indexMatch ? (indexMatch[1] as string) : DEFAULT_INDEX;

  const auth = new URLSearchParams(loc.search).get('auth');
  const isReadOnly = auth === null ? AUTH_IN_HREF_RE.test(loc.href) : auth === '0';
  let suffix: MultiEnv['suffix'] = '';
  let pushStatePath: string | null = null;

  if (auth !== null) {
    suffix = isReadOnly ? '/view' : '/edit';
    if (basePath === '.') {
      basePath = '..';
    }
    pushStatePath = withAuthQuery(`./=${index}${suffix}`, auth);
  }

  return { basePath, index, auth, isReadOnly, suffix, pushStatePath };
}
