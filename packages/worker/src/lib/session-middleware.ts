import type { Context } from 'hono';

import type { Env, EtherCalcHonoEnv } from '../env.ts';
import { verifyAuthSession } from './auth-session.ts';
import {
  verifySessionCookie,
  type SessionPrincipal,
} from './session.ts';

export type { EtherCalcHonoEnv } from '../env.ts';

export type AuthSessionVerifier = (
  env: Env,
  session: string,
) => Promise<SessionPrincipal | null>;

/**
 * How long one AuthDO verification stays reusable inside a request that
 * spreads its work over several RoomDO requests or waits on a large body.
 * Same value and bounded-staleness tradeoff as RoomDO's
 * `SESSION_VERIFY_TTL_MS`.
 */
export const SESSION_REVERIFY_TTL_MS = 3_000;

/**
 * Resolve and memoize a request principal only when a room route needs it.
 * Static assets, health checks, and other public glue never touch AuthDO.
 */
export async function getSessionPrincipal(
  context: Context<EtherCalcHonoEnv>,
  verifier: AuthSessionVerifier = verifyAuthSession,
): Promise<SessionPrincipal | null> {
  const cached = context.get('principal');
  if (cached !== undefined) return cached;
  const cookie = context.req.header('Cookie') ?? null;
  context.set('principalVerifiedAt', Date.now());
  const principal = await verifySessionCookie(cookie, (session) =>
    verifier(context.env, session),
  );
  context.set('principal', principal);
  return principal;
}

/**
 * Re-check a previously cached principal if it has expired or is older than
 * `SESSION_REVERIFY_TTL_MS`, preventing a signed-out session from continuing to
 * act after a slow upload or held preflight request.
 */
export async function getFreshSessionPrincipal(
  context: Context<EtherCalcHonoEnv>,
  verifier: AuthSessionVerifier = verifyAuthSession,
): Promise<SessionPrincipal | null> {
  const cached = context.get('principal');
  if (cached) {
    const now = Date.now();
    if (
      now >= cached.exp ||
      now - context.get('principalVerifiedAt') >= SESSION_REVERIFY_TTL_MS
    ) {
      context.set('principal', undefined);
    }
  }
  return getSessionPrincipal(context, verifier);
}
