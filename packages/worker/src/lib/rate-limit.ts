/**
 * Optional per-source request rate limiting for self-host deployments.
 *
 * token bucket keyed on the platform-provided `CF-Connecting-IP`, or the
 * rightmost `X-Forwarded-For` hop supplied by the mandatory self-host proxy.
 * Hosted Cloudflare deploys leave the flag unset and rely on the platform
 * edge instead (AGENTS.md §13 Q7).
 */

export interface RateLimitEnv {
  readonly ETHERCALC_RATELIMIT?: string | null;
}

export interface RateLimitConfig {
  /** Token bucket capacity (burst). */
  readonly capacity: number;
  /** Tokens added per elapsed second. */
  readonly refillPerSec: number;
}

/**
 * A denial always carries its retry hint — the union keeps callers from
 * inventing a fallback for a state the store cannot produce.
 */
export type RateLimitResult =
  | { readonly allowed: true }
  | {
      readonly allowed: false;
      /** Whole seconds until a request would likely succeed (429 Retry-After). */
      readonly retryAfterSec: number;
    };

interface BucketState {
  tokens: number;
  lastRefillMs: number;
}

/** Aligns with the nginx recipe's `rate=10r/s` + `burst=30`. */
const DEFAULT_CAPACITY = 30;
const DEFAULT_REFILL_PER_SEC = 10;
const MAX_BUCKETS = 10_000;

// Every spelling below also fails the numeric parse at the bottom of
// `parseRateLimitConfig` (`Number('off')` is NaN, `Number('')`/`Number('0')`
// are <= 0), which returns `null` too. So this list is intent documentation,
// not behaviour: mutating any case label or the whole switch produces an
// observationally identical parser.
// Stryker disable all
function rateLimitDisabled(raw: string): boolean {
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
// Stryker restore all

/**
 * Parse `ETHERCALC_RATELIMIT`.
 *
 * - unset / false-like → `null` (disabled)
 * - `1` / `true` / `yes` / `on` → nginx-aligned default (10 r/s, burst 30)
 * - plain number `N` → `N` requests per second, burst `max(3N, N)`
 * - `window:max` → `max` requests per `window` seconds (e.g. `60:600`)
 * - unparseable → `null` (fail closed to off, not deny-all)
 */
export function parseRateLimitConfig(
  raw: string | null | undefined,
): RateLimitConfig | null {
  if (raw == null) return null;
  const trimmed = raw.trim();
  if (rateLimitDisabled(trimmed)) return null;

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

export function rateLimitConfigFromEnv(env: RateLimitEnv): RateLimitConfig | null {
  return parseRateLimitConfig(env.ETHERCALC_RATELIMIT);
}

function validClientIp(value: string | undefined): string | null {
  const candidate = value?.trim();
  if (
    !candidate ||
    candidate.length > 64 ||
    !/^[0-9a-f:.]+$/i.test(candidate)
  ) {
    return null;
  }
  return candidate;
}

export function clientIpFromHeaders(headers: Headers): string {
  const cf = validClientIp(headers.get('CF-Connecting-IP') ?? undefined);
  if (cf) return cf;
  const forwarded = headers.get('X-Forwarded-For')?.split(',');
  const last = validClientIp(forwarded?.at(-1));
  return last ?? 'unknown';
}

export interface RateLimitStore {
  consume(ip: string, config: RateLimitConfig, nowMs?: number): RateLimitResult;
  /** Test hook — drop all per-IP state. */
  reset(): void;
}

export function createRateLimitStore(
  maxBuckets = MAX_BUCKETS,
): RateLimitStore {
  const buckets = new Map<string, BucketState>();

  return {
    consume(ip, config, nowMs = Date.now()) {
      let bucket = buckets.get(ip);
      if (!bucket) {
        if (buckets.size >= maxBuckets) {
          const oldest = buckets.keys().next().value;
          if (oldest !== undefined) buckets.delete(oldest);
        }
        bucket = { tokens: config.capacity, lastRefillMs: nowMs };
        buckets.set(ip, bucket);
      }

      const elapsedSec = Math.max(0, (nowMs - bucket.lastRefillMs) / 1000);
      if (elapsedSec > 0) {
        bucket.tokens = Math.min(
          config.capacity,
          bucket.tokens + elapsedSec * config.refillPerSec,
        );
        bucket.lastRefillMs = nowMs;
      }

      if (bucket.tokens >= 1) {
        bucket.tokens -= 1;
        return { allowed: true };
      }

      const deficit = 1 - bucket.tokens;
      const retryAfterSec = Math.max(
        1,
        Math.ceil(deficit / config.refillPerSec),
      );
      return { allowed: false, retryAfterSec };
    },
    reset() {
      buckets.clear();
    },
  };
}

/** Paths that bypass the optional limiter (health probes). */
export function isRateLimitExemptPath(pathname: string): boolean {
  return pathname === '/_health';
}