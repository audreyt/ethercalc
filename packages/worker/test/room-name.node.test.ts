import { describe, it, expect } from 'vite-plus/test';

import {
  MAX_ROOM_NAME_CHARS,
  encodeRoom,
  generateRoomId,
  isValidRoomName,
} from '../src/lib/room-name.ts';

describe('generateRoomId', () => {
  it('is 12 chars of lowercase alphanumerics', () => {
    for (let i = 0; i < 32; i++) {
      expect(generateRoomId()).toMatch(/^[0-9a-z]{12}$/);
    }
  });

  it('returns distinct ids on each call', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 16; i++) ids.add(generateRoomId());
    // Birthday collision probability over 36^12 is negligible at 16 draws.
    expect(ids.size).toBe(16);
  });
});

describe('isValidRoomName', () => {
  it('accepts ordinary, non-ASCII, and paired-surrogate names', () => {
    expect(isValidRoomName('room')).toBe(true);
    expect(isValidRoomName('試算表')).toBe(true);
    expect(isValidRoomName('sheet-😀')).toBe(true);
  });

  it('rejects empty, overlong, control, non-string, and malformed UTF-16 names', () => {
    expect(isValidRoomName('')).toBe(false);
    expect(isValidRoomName('x'.repeat(MAX_ROOM_NAME_CHARS + 1))).toBe(false);
    expect(isValidRoomName('room\u0000name')).toBe(false);
    expect(isValidRoomName(null)).toBe(false);
    expect(isValidRoomName('\ud800')).toBe(false);
    expect(isValidRoomName('\udc00')).toBe(false);
  });

  it('pins the length and surrogate boundaries exactly', () => {
    expect(isValidRoomName('x')).toBe(true);
    expect(isValidRoomName('x'.repeat(MAX_ROOM_NAME_CHARS))).toBe(true);
    // Control-character range boundaries: 0x1f is banned, 0x20 (space) is not;
    // 0x7f (DEL) is banned, 0x80 is not.
    expect(isValidRoomName('a\u001fb')).toBe(false);
    expect(isValidRoomName('a b')).toBe(true);
    expect(isValidRoomName('a\u007fb')).toBe(false);
    expect(isValidRoomName('a\u0080b')).toBe(true);
    // Surrogate-range boundaries, both ends, paired and unpaired.
    expect(isValidRoomName('\ud800\udc00')).toBe(true);
    expect(isValidRoomName('\udbff\udfff')).toBe(true);
    expect(isValidRoomName('\ud7ff')).toBe(true);
    expect(isValidRoomName('\ue000')).toBe(true);
    expect(isValidRoomName('\udbff')).toBe(false);
    expect(isValidRoomName('\udfff')).toBe(false);
    // A high surrogate followed by a non-low-surrogate is still malformed,
    // and the scan must continue past a valid pair rather than stop at it.
    expect(isValidRoomName('\ud800a')).toBe(false);
    expect(isValidRoomName('\ud800\udc00\udfff')).toBe(false);
    expect(isValidRoomName('ok\ud800')).toBe(false);
  });
});

describe('encodeRoom', () => {
  it('leaves simple room names untouched', () => {
    expect(encodeRoom('some-room')).toBe('some-room');
  });

  it('leaves multi-sheet `=`-prefix untouched (reserved char)', () => {
    expect(encodeRoom('=mysheet')).toBe('=mysheet');
  });

  it('percent-encodes spaces', () => {
    expect(encodeRoom('my room')).toBe('my%20room');
  });

  it('percent-encodes non-ASCII characters', () => {
    // A legacy room name containing Chinese characters round-trips via
    // UTF-8 percent-encoding, matching the oracle's Redis key byte-for-byte.
    expect(encodeRoom('試算表')).toBe('%E8%A9%A6%E7%AE%97%E8%A1%A8');
  });

  it('preserves reserved URI characters that encodeURI does not touch', () => {
    // encodeURI leaves ';/?:@&=+$,#' alone. These aren't expected in
    // real room names but documented for parity.
    expect(encodeRoom('a/b')).toBe('a/b');
  });
  it('throws before deriving an unsafe room identifier', () => {
    expect(() => encodeRoom('room\u0000name')).toThrow(RangeError);
    expect(() => encodeRoom('\ud800')).toThrow(RangeError);
  });
});
