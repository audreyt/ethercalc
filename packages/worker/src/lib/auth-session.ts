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
      body === null ||
      typeof body !== 'object' ||
      !('uid' in body) ||
      typeof body.uid !== 'string'
    ) {
      return null;
    }
    return { uid: body.uid };
  } catch {
    return null;
  }
}
