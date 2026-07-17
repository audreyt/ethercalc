import { describe, expect, it } from 'vite-plus/test';

import {
  flagEnabled,
  shouldDisableRoomIndex,
} from '../src/lib/room-index-access.ts';

describe('flagEnabled', () => {
  it.each([
    [undefined, false],
    [null, false],
    ['', false],
    ['   ', false],
    ['0', false],
    ['false', false],
    ['False', false],
    ['no', false],
    ['off', false],
    ['1', true],
    ['true', true],
    ['yes', true],
    ['on', true],
    ['anything-else', true],
  ] as const)('maps %s to %s', (raw, expected) => {
    expect(flagEnabled(raw)).toBe(expected);
  });
});

describe('shouldDisableRoomIndex', () => {
  it('defaults to open when no flag is present', () => {
    expect(shouldDisableRoomIndex({})).toBe(false);
  });

  it('keeps the hosted legacy ETHERCALC_CORS gate working', () => {
    expect(shouldDisableRoomIndex({ ETHERCALC_CORS: '1' })).toBe(true);
  });

  it('treats false-like legacy CORS values as opt-out', () => {
    expect(shouldDisableRoomIndex({ ETHERCALC_CORS: '0' })).toBe(false);
    expect(shouldDisableRoomIndex({ ETHERCALC_CORS: 'false' })).toBe(false);
  });

  it('uses the explicit room-index flag when set', () => {
    expect(
      shouldDisableRoomIndex({
        ETHERCALC_DISABLE_ROOM_INDEX: '1',
      }),
    ).toBe(true);
    expect(
      shouldDisableRoomIndex({
        ETHERCALC_DISABLE_ROOM_INDEX: '0',
      }),
    ).toBe(false);
  });

  it('lets the explicit flag override the legacy CORS fallback', () => {
    expect(
      shouldDisableRoomIndex({
        ETHERCALC_DISABLE_ROOM_INDEX: '0',
        ETHERCALC_CORS: '1',
      }),
    ).toBe(false);
  });

  it('treats an empty explicit flag as absent', () => {
    expect(
      shouldDisableRoomIndex({
        ETHERCALC_DISABLE_ROOM_INDEX: '   ',
        ETHERCALC_CORS: '1',
      }),
    ).toBe(true);
  });

  it('survives workerd null bindings (unset fromEnvironment env vars)', () => {
    expect(
      shouldDisableRoomIndex({
        ETHERCALC_DISABLE_ROOM_INDEX: null,
        ETHERCALC_CORS: '1',
      }),
    ).toBe(true);
    expect(
      shouldDisableRoomIndex({
        ETHERCALC_DISABLE_ROOM_INDEX: null,
        ETHERCALC_CORS: null,
      }),
    ).toBe(false);
  });
});
