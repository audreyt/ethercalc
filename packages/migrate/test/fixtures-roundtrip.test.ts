/**
 * End-to-end test using a realistic EtherCalc dump shape: one snapshot,
 * a handful of log/audit/chat entries, an ecell hash, and a
 * `timestamps` hash. The fixture is produced in-memory via encodeRdb()
 * so we don't ship a binary blob; see test/fixtures/README.md.
 *
 * This exercises the full pipeline: parseRdb → extractRooms →
 * applyRooms → InMemoryTarget.
 */
import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  STORAGE_KEYS,
  logKey,
  auditKey,
  chatKey,
  ecellKey,
} from '@ethercalc/shared/storage-keys';

import { encodeRdb, parseRdb, type RedisDump } from '../src/parse-rdb.ts';
import { extractRooms } from '../src/extract-rooms.ts';
import { applyRooms } from '../src/apply.ts';
import { InMemoryTarget } from '../src/targets/in-memory.ts';

describe('fixture round-trip (end-to-end)', () => {
  it('migrates a multi-room dump via a tmp .rdb file', async () => {
    const dump: RedisDump = {
      strings: new Map([
        ['snapshot-meeting', 'version:1.5\nsheet:\ncell:A1:v:1\n'],
        ['snapshot-ghost', ''],
      ]),
      lists: new Map([
        ['log-meeting', ['set A1 value n 1', 'recalc']],
        ['audit-meeting', ['set A1 value n 1', 'recalc']],
        ['chat-meeting', ['hello world']],
      ]),
      hashes: new Map([
        ['ecell-meeting', new Map([['alice', 'A1'], ['bob', 'C3']])],
        [
          'timestamps',
          new Map([
            ['timestamp-meeting', '1700000000000'],
            ['timestamp-ghost', '1600000000000'],
          ]),
        ],
      ]),
    };

    const dir = mkdtempSync(join(tmpdir(), 'rdb-'));
    try {
      const rdbPath = join(dir, 'fixture.rdb');
      writeFileSync(rdbPath, encodeRdb(dump));
      const buf = readFileSync(rdbPath);
      const parsed = parseRdb(buf);
      const rooms = extractRooms(parsed);
      expect(rooms.map((r) => r.name)).toEqual(['ghost', 'meeting']);

      const target = new InMemoryTarget({ now: () => 42 });
      const stats = await applyRooms(rooms, target);
      expect(stats.rooms).toBe(2);
      expect(stats.snapshots).toBe(1); // "ghost" had empty snapshot, skipped
      expect(stats.logEntries).toBe(2);
      expect(stats.auditEntries).toBe(2);
      expect(stats.chatEntries).toBe(1);
      expect(stats.ecellEntries).toBe(2);
      expect(stats.indexed).toBe(2);

      const meeting = target.doStorage.get('meeting');
      expect(meeting?.get(STORAGE_KEYS.snapshot)).toContain('cell:A1:v:1');
      expect(meeting?.get(logKey(1))).toBe('set A1 value n 1');
      expect(meeting?.get(logKey(2))).toBe('recalc');
      expect(meeting?.get(auditKey(2))).toBe('recalc');
      expect(meeting?.get(chatKey(1))).toBe('hello world');
      expect(meeting?.get(ecellKey('alice'))).toBe('A1');
      expect(meeting?.get(ecellKey('bob'))).toBe('C3');

      expect(target.d1Rooms.get('meeting')?.updatedAt).toBe(1700000000000);
      expect(target.d1Rooms.get('ghost')?.updatedAt).toBe(1600000000000);
      expect(target.kvRoomsExists.get('meeting')).toBe('1');
      expect(target.kvRoomsExists.get('ghost')).toBe('1');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
