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
  const principal = await verifySessionCookie(cookie, (session) =>
    verifier(context.env, session),
  );
  context.set('principal', principal);
  return principal;
}
