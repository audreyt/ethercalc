import type { Env } from '../env.ts';
import { flagEnabled } from './room-index-access.ts';
import type { SessionPrincipal } from './session.ts';

const AUTH_DO_NAME = 'auth';
const VERIFY_SESSION_URL = 'https://auth.local/_auth/verify-session';

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
    const id = env.AUTH.idFromName(AUTH_DO_NAME);
    const response = await env.AUTH.get(id).fetch(VERIFY_SESSION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session }),
    });
    if (!response.ok) return null;
    const body: unknown = await response.json();
    if (
      // The next three narrowing clauses are shadowed by the enclosing
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
  } catch {
    return null;
  }
}
