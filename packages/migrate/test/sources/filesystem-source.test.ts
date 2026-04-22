/**
 * Filesystem source adapter tests. Uses an in-memory FsLike fake so we
 * can exercise both layout shapes (dump/ dir and dump.json blob) and
 * the auto-detection logic without touching disk.
 *
 * Covers everything in src/sources/filesystem-source.ts:
 *   - layout detection (file/dir/dump.json/dump dir/bare dump dir)
 *   - snapshot + audit round-trip, legacy escape decoding
 *   - log/chat/ecell only appearing in JSON mode
 *   - timestamps lookup (timestamp-<room> and bare <room>, numeric + string)
 *   - oversized entry skipping + onOversizedEntry callback
 *   - oversized snapshot skipping + onSkippedRoom callback
 *   - onProgress firing once per room
 *   - typed-but-wrong-shape values in dump.json gracefully ignored
 *   - hidden files + non-.txt files in dump/ ignored
 *   - room names with embedded dashes preserved
 */
import { describe, it, expect } from 'vitest';

import {
  roomsFromFilesystem,
  type FsLike,
  type FsStatLike,
} from '../../src/sources/filesystem-source.ts';
import type { Room } from '../../src/apply.ts';

type FileShape = string; // file contents (utf-8)
type DirShape = Map<string, Entry>;
type Entry = { kind: 'file'; contents: FileShape } | { kind: 'dir'; entries: DirShape };

/**
 * Build an in-memory FsLike from a plain object. Keys ending in `/` are
 * interpreted as directory markers (value must be an object of child
 * entries); otherwise values are file contents. `/` is the path separator.
 */
function fakeFs(tree: Record<string, unknown>): FsLike {
  const root: DirShape = new Map();
  const ingest = (into: DirShape, obj: Record<string, unknown>): void => {
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'string') {
        into.set(k, { kind: 'file', contents: v });
      } else if (v && typeof v === 'object') {
        const sub: DirShape = new Map();
        into.set(k, { kind: 'dir', entries: sub });
        ingest(sub, v as Record<string, unknown>);
      }
    }
  };
  ingest(root, tree);

  const resolve = (p: string): Entry | null => {
    const parts = p.split('/').filter((s) => s.length > 0);
    let cur: Entry | { kind: 'dir'; entries: DirShape } = { kind: 'dir', entries: root };
    for (const part of parts) {
      if (cur.kind !== 'dir') return null;
      const next = cur.entries.get(part);
      if (next === undefined) return null;
      cur = next;
    }
    return cur as Entry;
  };

  return {
    readdir: async (p) => {
      const e = resolve(p);
      if (e === null || e.kind !== 'dir') throw new Error(`ENOTDIR: ${p}`);
      return Array.from(e.entries.keys());
    },
    readFile: async (p, encoding) => {
      expect(encoding).toBe('utf8');
      const e = resolve(p);
      if (e === null || e.kind !== 'file') throw new Error(`ENOENT: ${p}`);
      return e.contents;
    },
    stat: async (p): Promise<FsStatLike> => {
      const e = resolve(p);
      if (e === null) throw new Error(`ENOENT: ${p}`);
      return {
        isDirectory: () => e.kind === 'dir',
        isFile: () => e.kind === 'file',
      };
    },
  };
}

async function collect<T>(iter: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const v of iter) out.push(v);
  return out;
}

describe('roomsFromFilesystem — layout detection', () => {
  it('treats a file path as a JSON blob', async () => {
    const fs = fakeFs({
      'dump.json': JSON.stringify({
        'snapshot-alpha': 'SNAP-A',
      }),
    });
    const rooms = await collect(roomsFromFilesystem(fs, '/dump.json'));
    expect(rooms).toEqual<Room[]>([
      {
        name: 'alpha',
        snapshot: 'SNAP-A',
        log: [],
        audit: [],
        chat: [],
        ecell: {},
      },
    ]);
  });

  it('prefers dump.json when a directory contains both dump.json and dump/', async () => {
    const fs = fakeFs({
      var: {
        'dump.json': JSON.stringify({ 'snapshot-from-json': 'J' }),
        dump: {
          'snapshot-from-dir.txt': 'D',
        },
      },
    });
    const rooms = await collect(roomsFromFilesystem(fs, '/var'));
    expect(rooms.map((r) => r.name)).toEqual(['from-json']);
  });

  it('falls through to dump/ when a directory has only that', async () => {
    const fs = fakeFs({
      var: {
        dump: {
          'snapshot-alpha.txt': 'SNAP-A',
          'audit-alpha.txt': 'cmd1\ncmd2\n',
        },
      },
    });
    const rooms = await collect(roomsFromFilesystem(fs, '/var'));
    expect(rooms).toEqual<Room[]>([
      {
        name: 'alpha',
        snapshot: 'SNAP-A',
        log: [],
        audit: ['cmd1', 'cmd2'],
        chat: [],
        ecell: {},
      },
    ]);
  });

  it('treats a bare dump directory as its own dump dir', async () => {
    const fs = fakeFs({
      'my-dump': {
        'snapshot-alpha.txt': 'SNAP-A',
      },
    });
    const rooms = await collect(roomsFromFilesystem(fs, '/my-dump'));
    expect(rooms.map((r) => r.name)).toEqual(['alpha']);
  });

  it('handles a path with a trailing slash', async () => {
    const fs = fakeFs({
      dump: {
        'snapshot-alpha.txt': 'SNAP-A',
      },
    });
    const rooms = await collect(roomsFromFilesystem(fs, '/dump/'));
    expect(rooms).toHaveLength(1);
  });

  it('skips the `dump` entry when it is a file (not a directory)', async () => {
    // Edge case: a path containing a file literally named "dump" but
    // no "dump.json" inside. Should fall through to treating the parent
    // as the dump dir itself (which means the file "dump" is ignored
    // because it has no .txt suffix).
    const fs = fakeFs({
      var: {
        dump: 'not-a-directory',
        'snapshot-alpha.txt': 'SNAP',
      },
    });
    const rooms = await collect(roomsFromFilesystem(fs, '/var'));
    expect(rooms.map((r) => r.name)).toEqual(['alpha']);
  });
});

describe('roomsFromFilesystem — dump.json blob', () => {
  it('decodes snapshot, log, audit, chat, ecell, and timestamps', async () => {
    const blob = {
      'snapshot-room1': 'SNAP-1',
      'log-room1': ['cmd-a', 'cmd-b'],
      'audit-room1': ['cmd-a', 'cmd-b', 'cmd-c'],
      'chat-room1': ['hi', 'there'],
      'ecell-room1': { alice: 'A1', bob: 'B2' },
      'snapshot-room2': 'SNAP-2',
      timestamps: { 'timestamp-room1': 100, room2: 200 },
    };
    const fs = fakeFs({ 'dump.json': JSON.stringify(blob) });
    const rooms = await collect(roomsFromFilesystem(fs, '/dump.json'));
    expect(rooms).toEqual<Room[]>([
      {
        name: 'room1',
        snapshot: 'SNAP-1',
        log: ['cmd-a', 'cmd-b'],
        audit: ['cmd-a', 'cmd-b', 'cmd-c'],
        chat: ['hi', 'there'],
        ecell: { alice: 'A1', bob: 'B2' },
        updatedAt: 100,
      },
      {
        name: 'room2',
        snapshot: 'SNAP-2',
        log: [],
        audit: [],
        chat: [],
        ecell: {},
        updatedAt: 200,
      },
    ]);
  });

  it('accepts string timestamps that parse as numbers', async () => {
    const fs = fakeFs({
      'dump.json': JSON.stringify({
        'snapshot-a': 'S',
        timestamps: { 'timestamp-a': '12345' },
      }),
    });
    const [room] = await collect(roomsFromFilesystem(fs, '/dump.json'));
    expect(room?.updatedAt).toBe(12345);
  });

  it('omits updatedAt when no timestamp is present for the room', async () => {
    const fs = fakeFs({
      'dump.json': JSON.stringify({ 'snapshot-a': 'S' }),
    });
    const [room] = await collect(roomsFromFilesystem(fs, '/dump.json'));
    expect(room).toEqual<Room>({
      name: 'a',
      snapshot: 'S',
      log: [],
      audit: [],
      chat: [],
      ecell: {},
    });
  });

  it('omits updatedAt when the timestamp value is a non-numeric string', async () => {
    const fs = fakeFs({
      'dump.json': JSON.stringify({
        'snapshot-a': 'S',
        timestamps: { 'timestamp-a': 'not-a-number' },
      }),
    });
    const [room] = await collect(roomsFromFilesystem(fs, '/dump.json'));
    expect(room?.updatedAt).toBeUndefined();
  });

  it('ignores non-object / array / null timestamps', async () => {
    const variants = [
      null,
      42,
      'string',
      ['an', 'array'],
    ];
    for (const v of variants) {
      const fs = fakeFs({
        'dump.json': JSON.stringify({ 'snapshot-a': 'S', timestamps: v }),
      });
      const [room] = await collect(roomsFromFilesystem(fs, '/dump.json'));
      expect(room?.updatedAt).toBeUndefined();
    }
  });

  it('ignores non-number/non-string timestamp field values', async () => {
    const fs = fakeFs({
      'dump.json': JSON.stringify({
        'snapshot-a': 'S',
        timestamps: { 'timestamp-a': { not: 'allowed' } },
      }),
    });
    const [room] = await collect(roomsFromFilesystem(fs, '/dump.json'));
    expect(room?.updatedAt).toBeUndefined();
  });

  it('ignores unrecognized key prefixes', async () => {
    const fs = fakeFs({
      'dump.json': JSON.stringify({
        'snapshot-a': 'S',
        'cron-list': ['stuff'], // unrecognized in-memory-only key
        'random-key': 'value',
      }),
    });
    const rooms = await collect(roomsFromFilesystem(fs, '/dump.json'));
    expect(rooms.map((r) => r.name)).toEqual(['a']);
  });

  it('ignores shape-mismatched values silently', async () => {
    // A `snapshot-foo` that isn't a string, `log-bar` that isn't an
    // array, `ecell-baz` that contains a non-string value, etc. We
    // leave the accumulator's default (empty string / array / object)
    // in place rather than throwing — legacy dump.json files have been
    // hand-edited by users and we'd rather migrate the valid subset.
    const fs = fakeFs({
      'dump.json': JSON.stringify({
        'snapshot-a': 12345, // not a string
        'log-a': 'not-an-array',
        'audit-a': { not: 'an-array' },
        'chat-a': null,
        'ecell-a': { alice: 42 }, // non-string value in record
      }),
    });
    const rooms = await collect(roomsFromFilesystem(fs, '/dump.json'));
    expect(rooms).toEqual<Room[]>([
      { name: 'a', snapshot: '', log: [], audit: [], chat: [], ecell: {} },
    ]);
  });

  it('rejects non-record shapes at each ecell entry type (null/primitive/array)', async () => {
    // Exercises every `||` branch of `isStringRecord`: v===null,
    // typeof!=='object', and Array.isArray(v). Each yields an empty
    // ecell accumulator without touching the enclosing room otherwise.
    const cases: Array<{ ecell: unknown; label: string }> = [
      { ecell: null, label: 'null' },
      { ecell: 42, label: 'number' },
      { ecell: ['A1', 'B2'], label: 'array' },
    ];
    for (const { ecell, label } of cases) {
      const fs = fakeFs({
        'dump.json': JSON.stringify({
          [`snapshot-${label}`]: 'S',
          [`ecell-${label}`]: ecell,
        }),
      });
      const [room] = await collect(roomsFromFilesystem(fs, '/dump.json'));
      expect(room?.ecell).toEqual({});
    }
  });

  it('coerces non-string log/audit/chat entries via String()', async () => {
    const fs = fakeFs({
      'dump.json': JSON.stringify({
        'snapshot-a': 'S',
        'log-a': [1, 2, 'three'],
      }),
    });
    const [room] = await collect(roomsFromFilesystem(fs, '/dump.json'));
    expect(room?.log).toEqual(['1', '2', 'three']);
  });

  it('yields rooms sorted by name', async () => {
    const fs = fakeFs({
      'dump.json': JSON.stringify({
        'snapshot-zebra': 'Z',
        'snapshot-apple': 'A',
        'snapshot-mango': 'M',
      }),
    });
    const rooms = await collect(roomsFromFilesystem(fs, '/dump.json'));
    expect(rooms.map((r) => r.name)).toEqual(['apple', 'mango', 'zebra']);
  });

  it('creates a room even when only logs exist (no snapshot)', async () => {
    const fs = fakeFs({
      'dump.json': JSON.stringify({
        'log-only': ['cmd'], // room inferred from log- prefix alone
      }),
    });
    const rooms = await collect(roomsFromFilesystem(fs, '/dump.json'));
    expect(rooms).toEqual<Room[]>([
      {
        name: 'only',
        snapshot: '',
        log: ['cmd'],
        audit: [],
        chat: [],
        ecell: {},
      },
    ]);
  });
});

describe('roomsFromFilesystem — dump/ directory', () => {
  it('decodes legacy audit escape encoding (\\n, \\r, \\\\)', async () => {
    // The legacy encoder replaces \n→\\n, \r→\\r, then \→\\. The
    // decoder reverses: \\n→\n, \\r→\r, \\\\→\. A literal "\\ in the
    // source string appears as two backslashes in the on-disk file.
    const fs = fakeFs({
      dump: {
        'snapshot-r.txt': 'S',
        'audit-r.txt': 'a\\nb\nc\\rd\ne\\\\f\n',
      },
    });
    const [room] = await collect(roomsFromFilesystem(fs, '/dump'));
    expect(room?.audit).toEqual(['a\nb', 'c\rd', 'e\\f']);
  });

  it('skips hidden files (dotfiles) in the dump dir', async () => {
    const fs = fakeFs({
      dump: {
        'snapshot-a.txt': 'S',
        '.DS_Store': 'macOS garbage',
        '.snapshot-hidden.txt': 'do not load',
      },
    });
    const rooms = await collect(roomsFromFilesystem(fs, '/dump'));
    expect(rooms.map((r) => r.name)).toEqual(['a']);
  });

  it('skips non-.txt files', async () => {
    const fs = fakeFs({
      dump: {
        'snapshot-a.txt': 'S',
        'README.md': 'docs',
        'extra.json': '{}',
      },
    });
    const rooms = await collect(roomsFromFilesystem(fs, '/dump'));
    expect(rooms.map((r) => r.name)).toEqual(['a']);
  });

  it('skips files whose stem has no dash', async () => {
    const fs = fakeFs({
      dump: {
        'snapshot-a.txt': 'S',
        'nodashinme.txt': 'ignore me',
      },
    });
    const rooms = await collect(roomsFromFilesystem(fs, '/dump'));
    expect(rooms.map((r) => r.name)).toEqual(['a']);
  });

  it('skips files with an unrecognized kind prefix', async () => {
    const fs = fakeFs({
      dump: {
        'snapshot-a.txt': 'S',
        'chat-a.txt': 'unrecognized in dir mode',
        'log-a.txt': 'also ignored',
        'ecell-a.txt': 'also ignored',
      },
    });
    const [room] = await collect(roomsFromFilesystem(fs, '/dump'));
    expect(room).toEqual<Room>({
      name: 'a',
      snapshot: 'S',
      log: [],
      audit: [],
      chat: [],
      ecell: {},
    });
  });

  it('preserves embedded dashes in room names', async () => {
    const fs = fakeFs({
      dump: {
        'snapshot-my-fancy-room.txt': 'S',
      },
    });
    const [room] = await collect(roomsFromFilesystem(fs, '/dump'));
    expect(room?.name).toBe('my-fancy-room');
  });

  it('yields a room with only snapshot when audit is missing', async () => {
    const fs = fakeFs({
      dump: { 'snapshot-a.txt': 'S' },
    });
    const [room] = await collect(roomsFromFilesystem(fs, '/dump'));
    expect(room?.audit).toEqual([]);
  });

  it('yields a room with only audit when snapshot is missing', async () => {
    const fs = fakeFs({
      dump: { 'audit-a.txt': 'cmd\n' },
    });
    const [room] = await collect(roomsFromFilesystem(fs, '/dump'));
    expect(room).toEqual<Room>({
      name: 'a',
      snapshot: '',
      log: [],
      audit: ['cmd'],
      chat: [],
      ecell: {},
    });
  });

  it('filters empty lines from audit files', async () => {
    const fs = fakeFs({
      dump: {
        'snapshot-a.txt': 'S',
        'audit-a.txt': 'cmd1\n\ncmd2\n\n\n',
      },
    });
    const [room] = await collect(roomsFromFilesystem(fs, '/dump'));
    expect(room?.audit).toEqual(['cmd1', 'cmd2']);
  });
});

describe('roomsFromFilesystem — size limits + callbacks', () => {
  it('fires onProgress once per room (including oversized-skipped rooms)', async () => {
    const fs = fakeFs({
      'dump.json': JSON.stringify({
        'snapshot-a': 'S',
        'snapshot-b': 'TOO_LARGE',
      }),
    });
    const progress: { done: number; total: number }[] = [];
    await collect(
      roomsFromFilesystem(fs, '/dump.json', {
        maxSnapshotBytes: 5,
        onProgress: (info) => progress.push({ ...info }),
      }),
    );
    expect(progress).toEqual([
      { done: 1, total: 2 }, // 'a' yielded
      { done: 2, total: 2 }, // 'b' skipped
    ]);
  });

  it('skips rooms with oversized snapshots and fires onSkippedRoom', async () => {
    const bigSnapshot = 'x'.repeat(10);
    const fs = fakeFs({
      'dump.json': JSON.stringify({
        'snapshot-big': bigSnapshot,
        'snapshot-small': 'ok',
      }),
    });
    const skipped: { room: string; bytes: number }[] = [];
    const rooms = await collect(
      roomsFromFilesystem(fs, '/dump.json', {
        maxSnapshotBytes: 5,
        onSkippedRoom: (info) => skipped.push({ ...info }),
      }),
    );
    expect(rooms.map((r) => r.name)).toEqual(['small']);
    expect(skipped).toEqual([{ room: 'big', bytes: 10 }]);
  });

  it('skips oversized snapshots in dump/ mode too', async () => {
    const fs = fakeFs({
      dump: {
        'snapshot-big.txt': 'x'.repeat(10),
        'snapshot-ok.txt': 'ok',
      },
    });
    const skipped: { room: string; bytes: number }[] = [];
    const rooms = await collect(
      roomsFromFilesystem(fs, '/dump', {
        maxSnapshotBytes: 5,
        onSkippedRoom: (info) => skipped.push({ ...info }),
      }),
    );
    expect(rooms.map((r) => r.name)).toEqual(['ok']);
    expect(skipped).toEqual([{ room: 'big', bytes: 10 }]);
  });

  it('keeps snapshots exactly at maxSnapshotBytes (boundary is strict >)', async () => {
    // A 5-byte snapshot at maxSnapshotBytes=5 MUST pass through.
    // Catches the `snapshotBytes > maxSnapshotBytes` → `>=` boundary
    // mutant in both dump.json and dump/ code paths.
    const fsJson = fakeFs({
      'dump.json': JSON.stringify({ 'snapshot-exact': 'exact' /* 5 bytes */ }),
    });
    const skipJson: Array<{ room: string; bytes: number }> = [];
    const [roomJson] = await collect(
      roomsFromFilesystem(fsJson, '/dump.json', {
        maxSnapshotBytes: 5,
        onSkippedRoom: (info) => skipJson.push({ ...info }),
      }),
    );
    expect(roomJson?.name).toBe('exact');
    expect(skipJson).toEqual([]);

    const fsDir = fakeFs({
      dump: { 'snapshot-exact.txt': 'exact' },
    });
    const skipDir: Array<{ room: string; bytes: number }> = [];
    const [roomDir] = await collect(
      roomsFromFilesystem(fsDir, '/dump', {
        maxSnapshotBytes: 5,
        onSkippedRoom: (info) => skipDir.push({ ...info }),
      }),
    );
    expect(roomDir?.name).toBe('exact');
    expect(skipDir).toEqual([]);
  });

  it('drops oversized log/audit/chat entries and fires onOversizedEntry', async () => {
    const tooBig = 'x'.repeat(10);
    const fs = fakeFs({
      'dump.json': JSON.stringify({
        'snapshot-a': 'S',
        'log-a': ['ok', tooBig],
        'audit-a': [tooBig, 'ok'],
        'chat-a': ['ok', tooBig],
      }),
    });
    const drops: Array<{
      room: string;
      kind: 'log' | 'audit' | 'chat';
      index: number;
      bytes: number;
    }> = [];
    const [room] = await collect(
      roomsFromFilesystem(fs, '/dump.json', {
        maxEntryBytes: 5,
        onOversizedEntry: (info) => drops.push({ ...info }),
      }),
    );
    expect(room?.log).toEqual(['ok']);
    expect(room?.audit).toEqual(['ok']);
    expect(room?.chat).toEqual(['ok']);
    expect(drops).toEqual([
      { room: 'a', kind: 'log', index: 1, bytes: 10 },
      { room: 'a', kind: 'audit', index: 0, bytes: 10 },
      { room: 'a', kind: 'chat', index: 1, bytes: 10 },
    ]);
  });

  it('skips oversized audit entries in dump/ mode', async () => {
    const fs = fakeFs({
      dump: {
        'snapshot-a.txt': 'S',
        'audit-a.txt': `ok\n${'x'.repeat(10)}\n`,
      },
    });
    const drops: unknown[] = [];
    const [room] = await collect(
      roomsFromFilesystem(fs, '/dump', {
        maxEntryBytes: 5,
        onOversizedEntry: (info) => drops.push({ ...info }),
      }),
    );
    expect(room?.audit).toEqual(['ok']);
    expect(drops).toEqual([{ room: 'a', kind: 'audit', index: 1, bytes: 10 }]);
  });

  it('applies the default entry ceiling (120 KiB) when unspecified', async () => {
    const fs = fakeFs({
      'dump.json': JSON.stringify({
        'snapshot-a': 'S',
        'log-a': ['x'.repeat(120 * 1024 + 1)], // just over 120 KiB
      }),
    });
    const [room] = await collect(roomsFromFilesystem(fs, '/dump.json'));
    expect(room?.log).toEqual([]); // dropped
  });
});
