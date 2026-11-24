/** Host-only cookie name shared by Worker auth middleware and browsers. */
export const SESSION_COOKIE_NAME = '__Host-ec_sess';

/** Thirty-day lifetime, matching the AuthDO token expiry. */
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

/** Authenticated identity and verified session expiry returned by AuthDO. */
export interface SessionPrincipal {
  readonly uid: string;
  readonly exp: number;
}

/** Injected verifier used to keep cookie parsing independent of AuthDO I/O. */
export type SessionVerifier = (
  session: string,
) => Promise<SessionPrincipal | null>;

const SESSION_VALUE_PATTERN = /^[A-Za-z0-9._~-]+$/;

/**
 * Strip the only whitespace cookie syntax knows: SP and HTAB. `String#trim()`
 * also drops Unicode spaces (U+00A0, U+2000, U+FEFF, ...), which browsers keep
 * as part of a cookie name, so a sibling subdomain could plant
 * U+2000 + `__Host-ec_sess` for the whole domain: that name does not start
 * with `__Host-`. A plain scan, so long whitespace runs stay linear.
 */
function trimCookieWhitespace(text: string): string {
  let start = 0;
  let end = text.length;
  while (start < end && (text[start] === ' ' || text[start] === '\t')) start++;
  while (end > start && (text[end - 1] === ' ' || text[end - 1] === '\t')) end--;
  return text.slice(start, end);
}

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
    const name = trimCookieWhitespace(segment.slice(0, equals));
    if (name !== SESSION_COOKIE_NAME) continue;
    if (session !== null) return null;
    const value = trimCookieWhitespace(segment.slice(equals + 1));
    if (!SESSION_VALUE_PATTERN.test(value)) return null;
    session = value;
  }
  return session;
}

/**
 * Build the Set-Cookie value for an AuthDO-issued opaque session token. A
 * renewed token passes its own remaining lifetime, which the 90-day cap can
 * make shorter than the default.
 */
export function createSessionCookie(
  session: string,
  maxAgeSeconds: number = SESSION_MAX_AGE_SECONDS,
): string {
  if (!SESSION_VALUE_PATTERN.test(session)) {
    throw new RangeError('invalid session cookie value');
  }
  if (!Number.isInteger(maxAgeSeconds) || maxAgeSeconds < 0) {
    throw new RangeError('invalid session cookie lifetime');
  }
  return `${SESSION_COOKIE_NAME}=${session}; Path=/; Max-Age=${maxAgeSeconds}; HttpOnly; Secure; SameSite=Lax`;
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
