import { beforeEach, describe, expect, it } from 'vite-plus/test';

import {
  DEFAULT_LIVE_ROOM_LIMIT,
  LIVE_ROOM_MS,
  admitRoom,
  isViewerRequest,
  liveRoomCount,
  liveRoomLimit,
  noteRoomAwake,
  resetLiveRooms,
  viewerRoomLimit,
} from '../src/lib/live-rooms.ts';

const limited = (limit: string | null) => ({ ETHERCALC_LIVE_ROOM_LIMIT: limit });

describe('live-room budget', () => {
  beforeEach(() => resetLiveRooms());

  it('counts nothing where the variable is not bound (Cloudflare)', () => {
    expect(liveRoomLimit({})).toBeNull();
    for (let n = 0; n < DEFAULT_LIVE_ROOM_LIMIT * 2; n += 1) {
      expect(admitRoom({}, `id${n}`, 0)).toBe(true);
    }
    noteRoomAwake({}, 'woken', 0);
    expect(liveRoomCount()).toBe(0);
  });

  it('takes the default when workerd binds the variable but nothing sets it', () => {
    expect(DEFAULT_LIVE_ROOM_LIMIT).toBe(300);
    for (const raw of [null, '', ' ', '0', '-5', '2.5', 'off', 'Infinity']) {
      expect(liveRoomLimit(limited(raw))).toBe(DEFAULT_LIVE_ROOM_LIMIT);
    }
    expect(liveRoomLimit(limited('1'))).toBe(1);
    expect(liveRoomLimit(limited(' 4096 '))).toBe(4096);
  });

  it('refuses a room beyond the budget and keeps serving the ones awake', () => {
    const env = limited('2');
    expect(admitRoom(env, 'a', 0)).toBe(true);
    expect(admitRoom(env, 'b', 0)).toBe(true);
    expect(admitRoom(env, 'c', 1)).toBe(false);
    expect(admitRoom(env, 'a', 1)).toBe(true);
    expect(admitRoom(env, 'b', 1)).toBe(true);
    expect(liveRoomCount()).toBe(2);
  });

  it('frees a place once a room has been idle for LIVE_ROOM_MS', () => {
    const env = limited('2');
    expect(LIVE_ROOM_MS).toBe(20_000);
    admitRoom(env, 'a', 0);
    admitRoom(env, 'b', 5);
    // `a` is handed work again, so `b` is now the oldest.
    admitRoom(env, 'a', 10);
    expect(admitRoom(env, 'c', 5 + LIVE_ROOM_MS - 1)).toBe(false);
    expect(admitRoom(env, 'c', 5 + LIVE_ROOM_MS)).toBe(true);
    expect(admitRoom(env, 'b', 5 + LIVE_ROOM_MS)).toBe(false);
    expect(admitRoom(env, 'b', 10 + LIVE_ROOM_MS)).toBe(true);
    expect(liveRoomCount()).toBe(2);
  });

  it('reserves headroom above viewerRoomLimit for editors and writes', () => {
    expect(viewerRoomLimit(1)).toBe(1);
    expect(viewerRoomLimit(3)).toBe(2);
    expect(viewerRoomLimit(DEFAULT_LIVE_ROOM_LIMIT)).toBe(281);
    const env = limited('3');
    expect(admitRoom(env, 'v1', 0, true)).toBe(true);
    expect(admitRoom(env, 'v2', 0, true)).toBe(true);
    // Viewers are capped at 2 so editors still get the reserved 3rd slot.
    expect(admitRoom(env, 'v3', 1, true)).toBe(false);
    expect(admitRoom(env, 'v1', 1, true)).toBe(true);
    expect(admitRoom(env, 'editor', 1, false)).toBe(true);
    expect(admitRoom(env, 'editor2', 1, false)).toBe(false);
    // An expired entry is no longer treated as awake.
    expect(admitRoom(env, 'v2', LIVE_ROOM_MS + 1, true)).toBe(true);
  });

  it('counts a room the runtime woke, which no budget can refuse', () => {
    const env = limited('1');
    noteRoomAwake(env, { toString: () => 'socket-woken' }, 0);
    noteRoomAwake(env, { toString: () => 'alarm-woken' }, 0);
    expect(liveRoomCount()).toBe(2);
    expect(admitRoom(env, 'other', 1)).toBe(false);
    expect(admitRoom(env, 'socket-woken', 1)).toBe(true);
    expect(admitRoom(env, 'other', 1 + LIVE_ROOM_MS)).toBe(true);
    expect(liveRoomCount()).toBe(1);
  });

  it('reads the clock when no time is passed', () => {
    const env = limited('1');
    expect(admitRoom(env, 'a')).toBe(true);
    noteRoomAwake(env, 'a');
    expect(admitRoom(env, 'b')).toBe(false);
  });

  it('classifies Sandstorm viewers and anonymous non-Sandstorm callers as viewers', () => {
    const principal = { uid: 'u1', exp: Number.MAX_SAFE_INTEGER };
    expect(isViewerRequest({}, new Headers(), null)).toBe(true);
    expect(isViewerRequest({}, new Headers(), principal)).toBe(false);
    expect(isViewerRequest({ ETHERCALC_SANDSTORM: '1' }, new Headers(), null)).toBe(true);
    expect(
      isViewerRequest(
        { ETHERCALC_SANDSTORM: '1' },
        new Headers({ 'X-Sandstorm-Permissions': 'read' }),
        principal,
      ),
    ).toBe(true);
    expect(
      isViewerRequest(
        { ETHERCALC_SANDSTORM: '1' },
        new Headers({ 'X-Sandstorm-Permissions': 'modify' }),
        null,
      ),
    ).toBe(false);
  });
});
