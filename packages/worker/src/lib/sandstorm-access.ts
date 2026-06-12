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
  if (method === 'DELETE') return true;
  if (method === 'POST') {
    return pathname === '/_' || pathname.startsWith('/_/');
  }
  if (method === 'PUT' && pathname.startsWith('/_/')) return true;
  if (method === 'GET') {
    if (pathname === '/_new' || pathname === '/=_new') return true;
    if (pathname.startsWith('/_from/')) return true;
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