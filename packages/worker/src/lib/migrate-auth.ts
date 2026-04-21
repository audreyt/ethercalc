/**
 * Phase 11b — migration endpoint authorization.
 *
 * The seed endpoint (`PUT /_migrate/seed/:room`) is gated by an optional
 * bearer token sourced from `env.ETHERCALC_MIGRATE_TOKEN`. Rules:
 *
 *   - Token unset (or empty) → endpoint is DISABLED: the route returns
 *     `404 Not Found` exactly like an unknown path. Hiding the endpoint
 *     on production deploys is the default posture.
 *   - Token set, no `Authorization` header → `401 Unauthorized`.
 *   - Token set, wrong value → `401 Unauthorized`.
 *   - Token set, matching `Bearer <token>` → OK.
 *
 * Constant-time comparison via `constantTimeEqual` below — not
 * cryptographically necessary for a short-lived migration token, but
 * avoids the bad pattern of propagating `===` into security-adjacent
 * code.
 */

/** Verdict returned by {@link verifyMigrateToken}. */
export type MigrateAuthResult =
  /** Endpoint disabled: the caller should respond `404`. */
  | { readonly kind: 'disabled' }
  /** Caller didn't supply `Authorization` or supplied a malformed value. */
  | { readonly kind: 'missing' }
  /** Token supplied but didn't match; respond `401`. */
  | { readonly kind: 'bad' }
  /** Token verified; caller may proceed. */
  | { readonly kind: 'ok' };

const BEARER_PREFIX = 'Bearer ';

/**
 * Match the incoming `Authorization` header against the expected token.
 * `expected` is typically `env.ETHERCALC_MIGRATE_TOKEN` — treat empty or
 * whitespace-only as unset.
 */
export function verifyMigrateToken(
  expected: string | undefined,
  authHeader: string | null,
): MigrateAuthResult {
  const token = (expected ?? '').trim();
  if (token.length === 0) return { kind: 'disabled' };
  if (authHeader === null) return { kind: 'missing' };
  if (!authHeader.startsWith(BEARER_PREFIX)) return { kind: 'missing' };
  const presented = authHeader.slice(BEARER_PREFIX.length);
  if (!constantTimeEqual(presented, token)) return { kind: 'bad' };
  return { kind: 'ok' };
}

/**
 * Length-constant comparison. Returns `false` when lengths differ without
 * looking at the contents; same-length inputs are compared byte-by-byte
 * with an XOR accumulator so runtime doesn't leak a match prefix length.
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
