/**
 * Sandstorm grain permission enforcement (SH-6). When
 * `ETHERCALC_SANDSTORM=1`, honour the `X-Sandstorm-Permissions` header
 * injected by `sandstorm-http-bridge`: viewers without `modify` cannot
 * mutate rooms (HTTP writes + WS execute/ecell/stopHuddle).
 */

import { flagEnabled } from './room-index-access.ts';

export interface SandstormEnv {
  readonly ETHERCALC_SANDSTORM?: string | null;
}

export function isSandstormEnforced(env: SandstormEnv): boolean {
  return flagEnabled(env.ETHERCALC_SANDSTORM);
}

/** True when the bridge granted the `modify` permission from pkgdef. */
export function sandstormCanModify(headers: Headers): boolean {
  const perms = headers.get('X-Sandstorm-Permissions');
  if (!perms) return false;
  return perms.split(',').some((p) => p.trim() === 'modify');
}

export function isSandstormMutationRoute(
  method: string,
  pathname: string,
): boolean {
  if (method === 'POST' && /^\/socket\.io\/1\/xhr-polling\/[0-9a-f]{32}$/.test(pathname)) {
    return false;
  }
  if (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
    return true;
  }
  if (method === 'GET') {
    if (pathname === '/_new' || pathname === '/=_new') return true;
    if (pathname.startsWith('/_from/')) return true;
    if (/^\/[^/]+\/form$/.test(pathname)) return true;
  }
  return false;
}

export function sandstormBlocksMutation(
  env: SandstormEnv,
  method: string,
  pathname: string,
  headers: Headers,
): boolean {
  if (!isSandstormEnforced(env)) return false;
  // The one-shot migrator connects directly to workerd, without bridge
  // headers. Keep browser traffic away from the operator-only routes;
  // the route itself verifies the temporary bearer.
  if (
    method === 'PUT' &&
    (pathname === '/_migrate/bulk-index' ||
      /^\/_migrate\/(?:seed|snapshot-chunk)\/[^/]+$/.test(pathname))
  ) {
    return headers.has('X-Sandstorm-Permissions');
  }
  if (sandstormCanModify(headers)) return false;
  return isSandstormMutationRoute(method, pathname);
}

/** WS writes: attachment records modify permission at handshake time. */
export function sandstormAllowsWsWrite(
  env: SandstormEnv,
  handshakeModify: boolean | undefined,
): boolean {
  if (!isSandstormEnforced(env)) return true;
  return handshakeModify === true;
}
