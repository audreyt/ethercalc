import type { Env } from '../env.ts';
import { flagEnabled } from './room-index-access.ts';
import type { SessionPrincipal } from './session.ts';

const AUTH_DO_NAME = 'auth';
const VERIFY_SESSION_URL = 'https://auth.local/_auth/verify-session';
const REFRESH_SESSION_URL = 'https://auth.local/_auth/refresh-session';

/** A verified principal plus, when AuthDO renewed it, the replacement token. */
export interface RefreshedSession extends SessionPrincipal {
  readonly session?: string;
}

async function postSession(
  namespace: DurableObjectNamespace,
  url: string,
  session: string,
): Promise<unknown> {
  const response = await namespace.get(namespace.idFromName(AUTH_DO_NAME)).fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session }),
  });
  if (!response.ok) throw new Error(`AuthDO refused session (${response.status})`);
  return response.json();
}

/** Callers invoke this inside their try/catch. */
function principalFrom(body: unknown): SessionPrincipal | null {
  if (
    // The next three narrowing clauses are shadowed by the callers'
    // `try`/`catch`: dropping any of them turns a malformed payload into a
    // TypeError (`'uid' in null`, property access on a primitive) that the
    // catch converts into the same `null`. They stay for readability.
    // Stryker disable next-line ConditionalExpression
    body === null ||
    // Stryker disable next-line ConditionalExpression
    typeof body !== 'object' ||
    !('uid' in body) ||
    typeof body.uid !== 'string' ||
    !('exp' in body) ||
    // Stryker disable next-line ConditionalExpression
    typeof body.exp !== 'number' ||
    !Number.isFinite(body.exp) ||
    Date.now() >= body.exp
  ) {
    return null;
  }
  return { uid: body.uid, exp: body.exp };
}

/**
 * Verify an opaque session token against the singleton AuthDO.
 * Disabled, unbound, malformed, and unavailable auth all fail closed.
 */
export async function verifyAuthSession(
  env: Env,
  session: string,
): Promise<SessionPrincipal | null> {
  if (!flagEnabled(env.ETHERCALC_AUTH) || !env.AUTH) return null;
  try {
    return principalFrom(await postSession(env.AUTH, VERIFY_SESSION_URL, session));
  } catch {
    return null;
  }
}

/**
 * Verify a session and let AuthDO renew it when due (at most daily, capped
 * at 90 days after the passkey ceremony). Fails closed exactly like
 * `verifyAuthSession`, including for a malformed replacement token.
 */
export async function refreshAuthSession(
  env: Env,
  session: string,
): Promise<RefreshedSession | null> {
  if (!flagEnabled(env.ETHERCALC_AUTH) || !env.AUTH) return null;
  try {
    const body = await postSession(env.AUTH, REFRESH_SESSION_URL, session);
    const principal = principalFrom(body);
    if (principal === null) return null;
    const renewed = (body as { session?: unknown }).session;
    if (renewed === undefined) return principal;
    if (typeof renewed !== 'string' || renewed.length === 0) return null;
    return { ...principal, session: renewed };
  } catch {
    return null;
  }
}
