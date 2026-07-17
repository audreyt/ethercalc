import { describe, expect, it, beforeEach } from 'vite-plus/test';

import {
  clientIpFromHeaders,
  createRateLimitStore,
  isRateLimitExemptPath,
  parseRateLimitConfig,
  rateLimitConfigFromEnv,
} from '../src/lib/rate-limit.ts';

describe('parseRateLimitConfig', () => {
  it.each([
    [undefined, null],
    [null, null],
    ['', null],
    ['   ', null],
    ['0', null],
    ['false', null],
    ['no', null],
    ['off', null],
    ['garbage', null],
    ['0:0', null],
    ['0:10', null],
    ['60:0', null],
    ['-1', null],
    ['abc:10', null],
  ] as const)('treats %s as disabled', (raw, expected) => {
    expect(parseRateLimitConfig(raw)).toBe(expected);
  });

  it('maps bare enable keywords to the nginx-aligned default', () => {
    const expected = { capacity: 30, refillPerSec: 10 };
    expect(parseRateLimitConfig('1')).toEqual(expected);
    expect(parseRateLimitConfig('true')).toEqual(expected);
    expect(parseRateLimitConfig('yes')).toEqual(expected);
    expect(parseRateLimitConfig('on')).toEqual(expected);
  });

  it('parses a plain number as requests per second', () => {
    expect(parseRateLimitConfig('5')).toEqual({
      capacity: 15,
      refillPerSec: 5,
    });
  });

  it('rejects a plain-number rps that evaluates to exactly zero', () => {
    // '0.0' is numerically zero but is not one of `rateLimitDisabled`'s
    // exact string matches ('0', 'false', 'no', 'off', ''), so it reaches
    // the bare-rps branch. Pins the `rps <= 0` boundary (a mutant
    // loosening it to `rps < 0` would wrongly accept a zero rate).
    expect(parseRateLimitConfig('0.0')).toBe(null);
  });

  it('parses window:max form', () => {
    expect(parseRateLimitConfig('60:600')).toEqual({
      capacity: 600,
      refillPerSec: 10,
    });
  });
});

  it('normalizes whitespace and case', () => {
    expect(parseRateLimitConfig(' ON ')).toEqual({ capacity: 30, refillPerSec: 10 });
    expect(parseRateLimitConfig(' 60:600 ')).toEqual({ capacity: 600, refillPerSec: 10 });
    expect(parseRateLimitConfig(' OFF ')).toBeNull();
  });

  it.each(['0.00', '-0', 'NaN', 'Infinity', '60:-1', '60:Infinity'])('rejects invalid numeric boundary %s', raw => { expect(parseRateLimitConfig(raw)).toBeNull(); });

describe('rateLimitConfigFromEnv', () => {
  it('reads ETHERCALC_RATELIMIT from env', () => {
    expect(
      rateLimitConfigFromEnv({ ETHERCALC_RATELIMIT: '10' }),
    ).toEqual({
      capacity: 30,
      refillPerSec: 10,
    });
    expect(rateLimitConfigFromEnv({})).toBeNull();
    expect(
      rateLimitConfigFromEnv({ ETHERCALC_RATELIMIT: null }),
    ).toBeNull();
  });
});

describe('clientIpFromHeaders', () => {
  it('returns a trimmed CF-Connecting-IP when present', () => {
    const headers = new Headers({ 'CF-Connecting-IP': '203.0.113.1' });
    expect(clientIpFromHeaders(headers)).toBe('203.0.113.1');
  });

  it('prefers CF-Connecting-IP over X-Forwarded-For', () => {
    const headers = new Headers({
      'CF-Connecting-IP': ' 203.0.113.1 ',
      'X-Forwarded-For': '198.51.100.2, 203.0.113.9',
    });
    expect(clientIpFromHeaders(headers)).toBe('203.0.113.1');
  });

  it('uses the first X-Forwarded-For hop when CF header is absent', () => {
    const headers = new Headers({
      'X-Forwarded-For': '198.51.100.2, 203.0.113.9',
    });
    expect(clientIpFromHeaders(headers)).toBe('198.51.100.2');
  });

  it('falls back to unknown when no client IP headers are present', () => {
    expect(clientIpFromHeaders(new Headers())).toBe('unknown');
  });

  it('skips blank CF-Connecting-IP and uses X-Forwarded-For', () => {
    const headers = new Headers({
      'CF-Connecting-IP': '   ',
      'X-Forwarded-For': '10.0.0.1',
    });
    expect(clientIpFromHeaders(headers)).toBe('10.0.0.1');
  });

  it('trims the selected forwarded hop', () => { expect(clientIpFromHeaders(new Headers({'X-Forwarded-For': ' 198.51.100.2 , 203.0.113.9' }))).toBe('198.51.100.2'); });

  it('falls back to unknown when X-Forwarded-For has no client hop', () => {
    const headers = new Headers({
      'X-Forwarded-For': ' , ',
    });
    expect(clientIpFromHeaders(headers)).toBe('unknown');
  });
});

describe('createRateLimitStore', () => {
  const tight: { capacity: number; refillPerSec: number } = {
    capacity: 2,
    refillPerSec: 1,
  };

  let store: ReturnType<typeof createRateLimitStore>;

  beforeEach(() => {
    store = createRateLimitStore();
  });

  it('allows requests while tokens remain', () => {
    expect(store.consume('a', tight, 0).allowed).toBe(true);
    expect(store.consume('a', tight, 0).allowed).toBe(true);
  });

  it('denies when the bucket is empty and reports Retry-After', () => {
    store.consume('a', tight, 0);
    store.consume('a', tight, 0);
    const denied = store.consume('a', tight, 0);
    expect(denied.allowed).toBe(false);
    expect(denied.retryAfterSec).toBe(1);
  });

  it('reports the full retry delay for a slow bucket', () => {
    const cfg = { capacity: 1, refillPerSec: 0.1 };
    store.consume('slow', cfg, 0);
    expect(store.consume('slow', cfg, 0)).toEqual({ allowed: false, retryAfterSec: 10 });
  });

  it('reports reduced retry delay after partial refill', () => {
    const cfg = { capacity: 1, refillPerSec: 0.1 };
    store.consume('partial', cfg, 0);
    expect(store.consume('partial', cfg, 5000)).toEqual({ allowed: false, retryAfterSec: 5 });
  });

  it('refills tokens after elapsed time', () => {
    store.consume('a', tight, 0);
    store.consume('a', tight, 0);
    expect(store.consume('a', tight, 0).allowed).toBe(false);
    expect(store.consume('a', tight, 2000).allowed).toBe(true);
  });

  it('tracks buckets independently per IP', () => {
    store.consume('a', tight, 0);
    store.consume('a', tight, 0);
    expect(store.consume('b', tight, 0).allowed).toBe(true);
  });

  it('reset clears all state', () => {
    store.consume('a', tight, 0);
    store.consume('a', tight, 0);
    store.reset();
    expect(store.consume('a', tight, 0).allowed).toBe(true);
  });

  it('reuses an existing bucket without refilling at the same timestamp', () => {
    expect(store.consume('a', tight, 1000).allowed).toBe(true);
    expect(store.consume('a', tight, 1000).allowed).toBe(true);
    expect(store.consume('a', tight, 1000).allowed).toBe(false);
  });

  it('defaults nowMs to the real clock when omitted', () => {
    expect(store.consume('z', tight).allowed).toBe(true);
  });

  it('caps refilled tokens at bucket capacity', () => {
    store.consume('a', tight, 0);
    store.consume('a', tight, 0);
    expect(store.consume('a', tight, 60_000).allowed).toBe(true);
    expect(store.consume('a', tight, 60_000).allowed).toBe(true);
    expect(store.consume('a', tight, 60_000).allowed).toBe(false);
  });
});

describe('isRateLimitExemptPath', () => {
  it('exempts the health probe only', () => {
    expect(isRateLimitExemptPath('/_health')).toBe(true);
    expect(isRateLimitExemptPath('/')).toBe(false);
  });
});