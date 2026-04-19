import { describe, it, expect } from 'vitest';

import { generateRoomId, encodeRoom } from '../src/lib/room-name.ts';

describe('generateRoomId', () => {
  it('is 12 chars of lowercase alphanumerics', () => {
    for (let i = 0; i < 32; i++) {
      expect(generateRoomId()).toMatch(/^[0-9a-z]{12}$/);
    }
  });

  it('returns distinct ids on each call', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 16; i++) ids.add(generateRoomId());
    // Birthday bound on 16^12 is astronomically small; 16 unique is a
    // near-certainty unless the impl returns a constant.
    expect(ids.size).toBe(16);
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
});
