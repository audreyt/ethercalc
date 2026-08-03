import { describe, expect, it, beforeEach } from 'vite-plus/test';

import {
  createRateLimitStore,
  isRoomCreationRoute,
  parseRoomCreateLimitConfig,
  roomCreateLimitFromEnv,
} from '../src/lib/room-create-limit.ts';

describe('parseRoomCreateLimitConfig', () => {
  it.each([
    [undefined, null],
    [null, null],
    ['', null],
    ['0', null],
    ['bad', null],
    ['0:10', null],
  ] as const)('treats %s as disabled', (raw, expected) => {
    expect(parseRoomCreateLimitConfig(raw)).toBe(expected);
  });

  it('maps bare enable keywords to six per minute', () => {
    const expected = { capacity: 6, refillPerSec: 0.1 };
    expect(parseRoomCreateLimitConfig('1')).toEqual(expected);
    expect(parseRoomCreateLimitConfig('on')).toEqual(expected);
  });

  it('parses window:max and plain numeric forms', () => {
    expect(parseRoomCreateLimitConfig('60:12')).toEqual({
      capacity: 12,
      refillPerSec: 0.2,
    });
    expect(parseRoomCreateLimitConfig('2')).toEqual({
      capacity: 6,
      refillPerSec: 2,
    });
  });
});

  it('normalizes whitespace and case', () => {
    expect(parseRoomCreateLimitConfig(' ON ')).toEqual({ capacity: 6, refillPerSec: 0.1 });
    expect(parseRoomCreateLimitConfig(' 60:12 ')).toEqual({ capacity: 12, refillPerSec: 0.2 });
    expect(parseRoomCreateLimitConfig(' OFF ')).toBeNull();
  });

  it.each(['0.00', '-0', 'NaN', 'Infinity', '60:-1', '60:Infinity'])('rejects invalid numeric boundary %s', raw => { expect(parseRoomCreateLimitConfig(raw)).toBeNull(); });

describe('roomCreateLimitFromEnv', () => {
  it('reads ETHERCALC_ROOM_CREATE_LIMIT', () => {
    expect(
      roomCreateLimitFromEnv({ ETHERCALC_ROOM_CREATE_LIMIT: '1' }),
    ).not.toBeNull();
    expect(roomCreateLimitFromEnv({})).toBeNull();
  });
});

describe('isRoomCreationRoute', () => {
  it.each([
    ['POST', '/_', true],
    ['POST', '/_/private', true],
    ['GET', '/_new', true],
    ['GET', '/=_new', true],
    ['GET', '/_from/template', true],
    ['POST', '/_from/template/private', true],
    ['GET', '/template/form', true],
    ['PUT', '/_/fresh-room', true],
    ['PUT', '/=fresh.xlsx', true],
    ['PUT', '/_/=fresh/ods', true],
    ['PUT', '/=fresh.csv', false],
    ['PUT', '/_/room/csv', false],
    ['GET', '/_from/template/extra', false],
    ['POST', '/_/room', false],
    ['GET', '/_/room', false],
    ['GET', '/', false],
  ] as const)('%s %s → %s', (method, path, expected) => {
    expect(isRoomCreationRoute(method, path)).toBe(expected);
  });
});

describe('route method precedence', () => {
  it('rejects creation paths with wrong methods', () => {
    expect(isRoomCreationRoute('GET', '/_')).toBe(false);
    expect(isRoomCreationRoute('POST', '/_new')).toBe(false);
    expect(isRoomCreationRoute('PUT', '/_from/template')).toBe(false);
    expect(isRoomCreationRoute('PUT', '/_/')).toBe(false);
  });
});

describe('room create limit store', () => {
  let store: ReturnType<typeof createRateLimitStore>;

  beforeEach(() => {
    store = createRateLimitStore();
  });

  it('denies the seventh immediate creation from one IP', () => {
    const cfg = { capacity: 6, refillPerSec: 0.1 };
    for (let i = 0; i < 6; i++) {
      expect(store.consume('a', cfg, 0).allowed).toBe(true);
    }
    expect(store.consume('a', cfg, 0).allowed).toBe(false);
  });
});

describe('room-create limit parsing boundaries', () => {
  it('treats each disable spelling as off, case- and space-insensitively', () => {
    for (const raw of ['', '0', 'false', 'no', 'off']) {
      expect(parseRoomCreateLimitConfig(raw), raw).toBeNull();
      expect(parseRoomCreateLimitConfig(` ${raw.toUpperCase()} `), raw).toBeNull();
    }
    // Only the exact words disable; a longer word that contains one does not.
    expect(parseRoomCreateLimitConfig('offset')).toBeNull();
    expect(parseRoomCreateLimitConfig('0.5')).toEqual({
      capacity: 1.5,
      refillPerSec: 0.5,
    });
  });

  it('accepts every bare enable keyword', () => {
    const expected = { capacity: 6, refillPerSec: 0.1 };
    for (const raw of ['1', 'true', 'yes', 'on', 'YES', ' On ']) {
      expect(parseRoomCreateLimitConfig(raw), raw).toEqual(expected);
    }
  });

  it('requires both window and max to be positive finite numbers', () => {
    expect(parseRoomCreateLimitConfig(' 60 : 12 ')).toEqual({
      capacity: 12,
      refillPerSec: 0.2,
    });
    expect(parseRoomCreateLimitConfig(':12')).toBeNull();
    expect(parseRoomCreateLimitConfig('60:')).toBeNull();
    expect(parseRoomCreateLimitConfig('Infinity:12')).toBeNull();
    expect(parseRoomCreateLimitConfig('60:0')).toBeNull();
    expect(parseRoomCreateLimitConfig('0:12')).toBeNull();
  });
});

describe('creation-route matching is anchored', () => {
  it.each([
    ['GET', '/_from/a', true],
    ['GET', '/_from/', false],
    ['GET', '/_from/a/b', false],
    ['GET', '/x/_from/a', false],
    ['POST', '/_from/a/private', true],
    ['POST', '/_from/a/private/x', false],
    ['POST', '/_from//private', false],
    ['GET', '/a/form', true],
    ['GET', '/a/b/form', false],
    ['GET', '/form', false],
    ['GET', '/a/form/', false],
    ['PUT', '/=a.xlsx', true],
    ['PUT', '/=a.ods', true],
    ['PUT', '/=a.fods', true],
    ['PUT', '/=a.xlsxx', false],
    ['PUT', '/=a/b.xlsx', false],
    ['PUT', '/=.xlsx', false],
    ['PUT', '/_/=a/xlsx', true],
    ['PUT', '/_/=a/ods', true],
    ['PUT', '/_/=a/fods', true],
    ['PUT', '/_/=a/csv', false],
    ['PUT', '/_/=a/b/xlsx', false],
  ] as const)('%s %s → %s', (method, path, expected) => {
    expect(isRoomCreationRoute(method, path)).toBe(expected);
  });
});