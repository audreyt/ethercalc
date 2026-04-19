/**
 * URL/env parsing that mirrors the legacy `multi/main.ls` preamble.
 *
 *   BasePath = '.' normally.
 *     If location.href contains `(127.0.0.1|localhost|*.local):8080`, BasePath
 *     becomes `http://127.0.0.1:8000` (dev Vite → same-origin EtherCalc API).
 *     If any `?auth=` param exists and BasePath is `.`, it is bumped to `..`
 *     (the page moves one path segment deeper once we push history).
 *
 *   Index (room name) = capture from `/=<index>` URL; fallback `foobar`.
 *
 *   IsReadOnly = true when `auth=0` appears anywhere in the href.
 *     When `?auth=` is present in the query, IsReadOnly narrows to match only
 *     `?auth=0` (not the bare substring).
 *
 *   Suffix = ''
 *     When `?auth=` is in the query, Suffix becomes `/view` (readonly) or
 *     `/edit` (writable). The legacy code also pushes this suffix into the
 *     history via `pushState` so reloads keep the suffix.
 */

export interface MultiEnv {
  readonly basePath: string;
  readonly index: string;
  readonly isReadOnly: boolean;
  readonly suffix: '' | '/view' | '/edit';
  /** Path the UI should push into window.history.pushState. Null = no push. */
  readonly pushStatePath: string | null;
}

/** Fallback room name when the URL doesn't match the `/=<room>` pattern. */
export const DEFAULT_INDEX = 'foobar';

const DEV_HOST_RE = /(?:127\.0\.0\.1|localhost|\.local):8080/;
const INDEX_RE = /\/=([^_][^/?]*)(?:\?.*)?$/;
const AUTH_IN_HREF_RE = /auth=0/;
const AUTH_QUERY_RE = /\?auth=/;
const AUTH_IS_ZERO_RE = /\??auth=0/;

export function parseMultiEnv(loc: { href: string; search: string }): MultiEnv {
  let basePath: string = DEV_HOST_RE.test(loc.href) ? 'http://127.0.0.1:8000' : '.';

  const indexMatch = INDEX_RE.exec(loc.href);
  const index = indexMatch ? (indexMatch[1] as string) : DEFAULT_INDEX;

  let isReadOnly = AUTH_IN_HREF_RE.test(loc.href);
  let suffix: MultiEnv['suffix'] = '';
  let pushStatePath: string | null = null;

  if (AUTH_QUERY_RE.test(loc.search)) {
    isReadOnly = AUTH_IS_ZERO_RE.test(loc.search);
    suffix = isReadOnly ? '/view' : '/edit';
    if (basePath === '.') {
      basePath = '..';
    }
    pushStatePath = `./=${index}${suffix}`;
  }

  return { basePath, index, isReadOnly, suffix, pushStatePath };
}
