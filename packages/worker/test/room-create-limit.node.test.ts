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
    ['GET', '/_new', true],
    ['GET', '/=_new', true],
    ['GET', '/_from/template', true],
    ['PUT', '/_/fresh-room', true],
    ['PUT', '/_/room/csv', false],
    ['POST', '/_/room', false],
    ['GET', '/_/room', false],
    ['GET', '/', false],
  ] as const)('%s %s → %s', (method, path, expected) => {
    expect(isRoomCreationRoute(method, path)).toBe(expected);
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