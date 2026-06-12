/**
 * Optional per-IP rate limit on room-creation endpoints (SH-3). Gated by
 * `ETHERCALC_ROOM_CREATE_LIMIT` (default off). Complements the general
 * `ETHERCALC_RATELIMIT` bucket — creation paths get a stricter default.
 */

import {
  createRateLimitStore,
  type RateLimitConfig,
  type RateLimitStore,
} from './rate-limit.ts';

export interface RoomCreateLimitEnv {
  readonly ETHERCALC_ROOM_CREATE_LIMIT?: string | null;
}

/** Six new rooms per minute per source (burst 6). */
const DEFAULT_CAPACITY = 6;
const DEFAULT_REFILL_PER_SEC = 6 / 60;

function limitDisabled(raw: string): boolean {
  switch (raw.trim().toLowerCase()) {
    case '':
    case '0':
    case 'false':
    case 'no':
    case 'off':
      return true;
    default:
      return false;
  }
}

/**
 * Parse `ETHERCALC_ROOM_CREATE_LIMIT` — same forms as `ETHERCALC_RATELIMIT`
 * but bare `1`/`true`/`on` defaults to 6 creations per 60 seconds.
 */
export function parseRoomCreateLimitConfig(
  raw: string | null | undefined,
): RateLimitConfig | null {
  if (raw == null) return null;
  const trimmed = raw.trim();
  if (limitDisabled(trimmed)) return null;

  switch (trimmed.toLowerCase()) {
    case '1':
    case 'true':
    case 'yes':
    case 'on':
      return {
        capacity: DEFAULT_CAPACITY,
        refillPerSec: DEFAULT_REFILL_PER_SEC,
      };
  }

  const colon = trimmed.indexOf(':');
  if (colon >= 0) {
    const windowSec = Number(trimmed.slice(0, colon).trim());
    const maxRequests = Number(trimmed.slice(colon + 1).trim());
    if (
      !Number.isFinite(windowSec) ||
      !Number.isFinite(maxRequests) ||
      windowSec <= 0 ||
      maxRequests <= 0
    ) {
      return null;
    }
    return {
      capacity: maxRequests,
      refillPerSec: maxRequests / windowSec,
    };
  }

  const rps = Number(trimmed);
  if (!Number.isFinite(rps) || rps <= 0) return null;
  return {
    capacity: Math.max(rps * 3, rps),
    refillPerSec: rps,
  };
}

export function roomCreateLimitFromEnv(
  env: RoomCreateLimitEnv,
): RateLimitConfig | null {
  return parseRoomCreateLimitConfig(env.ETHERCALC_ROOM_CREATE_LIMIT);
}

/** Routes that mint or seed a new room DO. */
export function isRoomCreationRoute(method: string, pathname: string): boolean {
  if (method === 'POST' && pathname === '/_') return true;
  if (method === 'GET' && (pathname === '/_new' || pathname === '/=_new')) {
    return true;
  }
  if (method === 'GET' && pathname.startsWith('/_from/')) return true;
  if (method === 'PUT' && pathname.startsWith('/_/')) {
    const rest = pathname.slice(3);
    return rest.length > 0 && !rest.includes('/');
  }
  return false;
}

export { createRateLimitStore, type RateLimitStore };