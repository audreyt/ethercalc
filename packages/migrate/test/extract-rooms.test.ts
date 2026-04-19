/**
 * Tests for extractRooms — the pure dump → Room[] transform.
 */
import { describe, it, expect } from 'vitest';

import { extractRooms } from '../src/extract-rooms.ts';
import type { RedisDump } from '../src/parse-rdb.ts';

function dump(over: Partial<RedisDump> = {}): RedisDump {
  return {
    strings: over.strings ?? new Map(),
    lists: over.lists ?? new Map(),
    hashes: over.hashes ?? new Map(),
  };
}

describe('extractRooms', () => {
  it('returns [] for an empty dump', () => {
    expect(extractRooms(dump())).toEqual([]);
  });

  it('extracts a fully populated room', () => {
    const d = dump({
      strings: new Map([['snapshot-meeting', 'SAVE']]),
      lists: new Map([
        ['log-meeting', ['set A1 value n 1']],
        ['audit-meeting', ['set A1 value n 1']],
        ['chat-meeting', ['hello']],
      ]),
      hashes: new Map([
        ['ecell-meeting', new Map([['alice', 'A1']])],
        ['timestamps', new Map([['timestamp-meeting', '1700000000000']])],
      ]),
    });
    const rooms = extractRooms(d);
    expect(rooms).toEqual([
      {
        name: 'meeting',
        snapshot: 'SAVE',
        log: ['set A1 value n 1'],
        audit: ['set A1 value n 1'],
        chat: ['hello'],
        ecell: { alice: 'A1' },
        updatedAt: 1700000000000,
      },
    ]);
  });

  it('fills missing sub-fields with defaults', () => {
    const d = dump({ strings: new Map([['snapshot-solo', 'SAVE2']]) });
    const rooms = extractRooms(d);
    expect(rooms).toHaveLength(1);
    expect(rooms[0]).toMatchObject({
      name: 'solo',
      snapshot: 'SAVE2',
      log: [],
      audit: [],
      chat: [],
      ecell: {},
    });
    expect(rooms[0]?.updatedAt).toBeUndefined();
  });

  it('promotes a log-only key into a snapshot-less room', () => {
    const d = dump({ lists: new Map([['log-ghost', ['cmd']]]) });
    const rooms = extractRooms(d);
    expect(rooms).toEqual([
      {
        name: 'ghost',
        snapshot: '',
        log: ['cmd'],
        audit: [],
        chat: [],
        ecell: {},
      },
    ]);
  });

  it('sorts rooms alphabetically', () => {
    const d = dump({
      strings: new Map([
        ['snapshot-z', 'Z'],
        ['snapshot-a', 'A'],
        ['snapshot-m', 'M'],
      ]),
    });
    expect(extractRooms(d).map((r) => r.name)).toEqual(['a', 'm', 'z']);
  });

  it('accepts legacy bare-room timestamp field as fallback', () => {
    const d = dump({
      strings: new Map([['snapshot-room', 'S']]),
      hashes: new Map([['timestamps', new Map([['room', '42']])]]),
    });
    expect(extractRooms(d)[0]?.updatedAt).toBe(42);
  });

  it('prefers timestamp-<room> over bare <room>', () => {
    const d = dump({
      strings: new Map([['snapshot-room', 'S']]),
      hashes: new Map([
        [
          'timestamps',
          new Map([
            ['timestamp-room', '2000'],
            ['room', '1000'],
          ]),
        ],
      ]),
    });
    expect(extractRooms(d)[0]?.updatedAt).toBe(2000);
  });

  it('drops non-numeric timestamp entries', () => {
    const d = dump({
      strings: new Map([['snapshot-room', 'S']]),
      hashes: new Map([['timestamps', new Map([['timestamp-room', 'not-a-num']])]]),
    });
    expect(extractRooms(d)[0]?.updatedAt).toBeUndefined();
  });

  it('deduplicates a room that appears across multiple key families', () => {
    const d = dump({
      strings: new Map([['snapshot-r', '']]),
      lists: new Map([
        ['log-r', ['c1']],
        ['audit-r', ['c1']],
        ['chat-r', ['m']],
      ]),
      hashes: new Map([['ecell-r', new Map([['u', 'A1']])]]),
    });
    expect(extractRooms(d)).toHaveLength(1);
  });
});
