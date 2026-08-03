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

  it('uses the rightmost X-Forwarded-For hop when CF header is absent', () => {
    const headers = new Headers({
      'X-Forwarded-For': '198.51.100.2, 203.0.113.9',
    });
    expect(clientIpFromHeaders(headers)).toBe('203.0.113.9');
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

  it('trims the selected forwarded hop', () => { expect(clientIpFromHeaders(new Headers({'X-Forwarded-For': '198.51.100.2, 203.0.113.9 ' }))).toBe('203.0.113.9'); });

  it('falls back to unknown when X-Forwarded-For has no client hop', () => {
    const headers = new Headers({
      'X-Forwarded-For': ' , ',
    });
    expect(clientIpFromHeaders(headers)).toBe('unknown');
  });

  it.each([
    ['CF-Connecting-IP', 'attacker.example'],
    ['CF-Connecting-IP', '1'.repeat(65)],
    ['X-Forwarded-For', 'unknown'],
  ])('rejects malformed %s values', (name, value) => {
    expect(clientIpFromHeaders(new Headers({ [name]: value }))).toBe('unknown');
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
    expect(denied).toEqual({ allowed: false, retryAfterSec: 1 });
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


  it('evicts the oldest bucket instead of growing without bound', () => {
    const bounded = createRateLimitStore(2);
    bounded.consume('oldest', tight, 0);
    bounded.consume('oldest', tight, 0);
    expect(bounded.consume('oldest', tight, 0).allowed).toBe(false);
    bounded.consume('second', tight, 0);
    bounded.consume('third', tight, 0);
    expect(bounded.consume('oldest', tight, 0).allowed).toBe(true);
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

describe('createRateLimitStore — degenerate bucket cap', () => {
  it('serves requests when the store may retain no buckets at all', () => {
    const store = createRateLimitStore(0);
    const config = { capacity: 2, refillPerSec: 1 };
    // size >= maxBuckets on every call, but there is never an oldest key
    // to evict — the guard must not throw or deny.
    expect(store.consume('1.1.1.1', config, 0).allowed).toBe(true);
    expect(store.consume('2.2.2.2', config, 0).allowed).toBe(true);
  });
});

describe('rate-limit parsing and bucket boundaries', () => {
  it('treats each disable spelling as off, case- and space-insensitively', () => {
    for (const raw of ['', '0', 'false', 'no', 'off']) {
      expect(parseRateLimitConfig(raw), raw).toBeNull();
      expect(parseRateLimitConfig(`  ${raw.toUpperCase()}  `), raw).toBeNull();
    }
    // A value that merely contains a disable word is not a disable value.
    expect(parseRateLimitConfig('offset')).toBeNull();
    expect(parseRateLimitConfig('0.5')).toEqual({
      capacity: 1.5,
      refillPerSec: 0.5,
    });
  });

  it('parses window:max and rejects non-positive or non-finite parts', () => {
    expect(parseRateLimitConfig('60:600')).toEqual({
      capacity: 600,
      refillPerSec: 10,
    });
    // Whitespace around either side is tolerated.
    expect(parseRateLimitConfig(' 60 : 600 ')).toEqual({
      capacity: 600,
      refillPerSec: 10,
    });
    expect(parseRateLimitConfig(':600')).toBeNull();
    expect(parseRateLimitConfig('60:')).toBeNull();
    expect(parseRateLimitConfig('Infinity:600')).toBeNull();
    expect(parseRateLimitConfig('60:Infinity')).toBeNull();
    expect(parseRateLimitConfig('-1:600')).toBeNull();
    expect(parseRateLimitConfig('60:-1')).toBeNull();
  });

  it('rejects a client IP that is empty, overlong, or not address-shaped', () => {
    const ipFor = (value: string): string =>
      clientIpFromHeaders(new Headers({ 'CF-Connecting-IP': value }));
    expect(ipFor('203.0.113.7')).toBe('203.0.113.7');
    expect(ipFor('  203.0.113.7  ')).toBe('203.0.113.7');
    expect(ipFor('2001:db8::1')).toBe('2001:db8::1');
    expect(ipFor('')).toBe('unknown');
    expect(ipFor('   ')).toBe('unknown');
    expect(ipFor('a'.repeat(65))).toBe('unknown');
    expect(ipFor('f'.repeat(64))).toBe('f'.repeat(64));
    expect(ipFor('203.0.113.7; drop')).toBe('unknown');
  });

  it('takes the last X-Forwarded-For hop only when CF-Connecting-IP is unusable', () => {
    expect(
      clientIpFromHeaders(
        new Headers({
          'CF-Connecting-IP': 'not an ip',
          'X-Forwarded-For': '10.0.0.1, 203.0.113.9',
        }),
      ),
    ).toBe('203.0.113.9');
    expect(
      clientIpFromHeaders(new Headers({ 'X-Forwarded-For': '10.0.0.1, bogus!' })),
    ).toBe('unknown');
  });

  it('refills to the cap and never past it', () => {
    const store = createRateLimitStore();
    const config = { capacity: 2, refillPerSec: 1 };
    expect(store.consume('a', config, 0).allowed).toBe(true);
    expect(store.consume('a', config, 0).allowed).toBe(true);
    expect(store.consume('a', config, 0).allowed).toBe(false);
    // Same instant: no refill happens, so the bucket stays empty.
    expect(store.consume('a', config, 0).allowed).toBe(false);
    // One second later exactly one token is back.
    expect(store.consume('a', config, 1000).allowed).toBe(true);
    expect(store.consume('a', config, 1000).allowed).toBe(false);
    // A long idle period cannot bank more than the capacity.
    expect(store.consume('a', config, 100_000).allowed).toBe(true);
    expect(store.consume('a', config, 100_000).allowed).toBe(true);
    expect(store.consume('a', config, 100_000).allowed).toBe(false);
  });

  it('ignores clock skew instead of granting free tokens', () => {
    const store = createRateLimitStore();
    const config = { capacity: 1, refillPerSec: 1 };
    expect(store.consume('skew', config, 10_000).allowed).toBe(true);
    // A backwards clock must not refill (elapsed is clamped at zero).
    expect(store.consume('skew', config, 0).allowed).toBe(false);
  });

  it('evicts the oldest bucket once the table is full', () => {
    const store = createRateLimitStore(2);
    const config = { capacity: 1, refillPerSec: 0.001 };
    expect(store.consume('first', config, 0).allowed).toBe(true);
    expect(store.consume('second', config, 0).allowed).toBe(true);
    // `third` evicts `first`, so `first` comes back with a fresh bucket…
    expect(store.consume('third', config, 0).allowed).toBe(true);
    expect(store.consume('first', config, 0).allowed).toBe(true);
    // …while `third`, still resident, stays throttled.
    expect(store.consume('third', config, 0).allowed).toBe(false);
  });

  it('reset drops all retained buckets', () => {
    const store = createRateLimitStore();
    const config = { capacity: 1, refillPerSec: 0.001 };
    expect(store.consume('x', config, 0).allowed).toBe(true);
    expect(store.consume('x', config, 0).allowed).toBe(false);
    store.reset();
    expect(store.consume('x', config, 0).allowed).toBe(true);
  });

  it('exempts only the health probe path', () => {
    expect(isRateLimitExemptPath('/_health')).toBe(true);
    expect(isRateLimitExemptPath('/_healthz')).toBe(false);
    expect(isRateLimitExemptPath('/_health/')).toBe(false);
  });
});