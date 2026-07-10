/** Cookie name shared by Worker auth middleware and browser clients. */
export const SESSION_COOKIE_NAME = 'ec_sess';

/** Thirty-day lifetime, matching the AuthDO token expiry. */
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

/** Authenticated identity returned by AuthDO session verification. */
export interface SessionPrincipal {
  readonly uid: string;
}

/** Injected verifier used to keep cookie parsing independent of AuthDO I/O. */
export type SessionVerifier = (
  session: string,
) => Promise<SessionPrincipal | null>;

const SESSION_VALUE_PATTERN = /^[A-Za-z0-9._~-]+$/;

/**
 * Extract one unambiguous EtherCalc session token from a Cookie header.
 * Duplicate names fail closed to avoid cookie-shadowing ambiguity.
 */
export function parseSessionCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  let session: string | null = null;
  for (const segment of cookieHeader.split(';')) {
    const equals = segment.indexOf('=');
    if (equals < 0) continue;
    if (segment.slice(0, equals).trim() !== SESSION_COOKIE_NAME) continue;
    if (session !== null) return null;
    const value = segment.slice(equals + 1).trim();
    if (!SESSION_VALUE_PATTERN.test(value)) return null;
    session = value;
  }
  return session;
}

/** Build the Set-Cookie value for an AuthDO-issued opaque session token. */
export function createSessionCookie(session: string): string {
  if (!SESSION_VALUE_PATTERN.test(session)) {
    throw new RangeError('invalid session cookie value');
  }
  return `${SESSION_COOKIE_NAME}=${session}; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}; HttpOnly; Secure; SameSite=Lax`;
}

/** Parse and verify a session cookie, failing closed on verifier errors. */
export async function verifySessionCookie(
  cookieHeader: string | null,
  verifier: SessionVerifier,
): Promise<SessionPrincipal | null> {
  const session = parseSessionCookie(cookieHeader);
  if (session === null) return null;
  try {
    return await verifier(session);
  } catch {
    return null;
  }
}
