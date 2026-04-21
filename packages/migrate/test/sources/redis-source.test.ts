/**
 * Redis source adapter tests. Uses scripted fake clients so we can
 * assert exact command sequences per room without a real server.
 * Covers both the pipelined fast path and the sequential fallback.
 */
import { describe, it, expect, vi } from 'vitest';

import {
  roomsFromRedis,
  type RespLike,
} from '../../src/sources/redis-source.ts';

type Reply = unknown;
type Replies = Record<string, Reply | (() => Reply)>;

/**
 * Scripted fake — each incoming `(cmd, ...args)` is stringified
 * space-joined to build the lookup key. Unknown commands throw to
 * surface test gaps immediately.
 */
function scriptedClient(
  replies: Replies,
  opts: { pipeline?: boolean } = {},
): RespLike & { calls: string[] } {
  const calls: string[] = [];
  const resolve = (key: string): Reply => {
    if (!(key in replies)) throw new Error(`unscripted command: ${key}`);
    const v = replies[key];
    return typeof v === 'function' ? (v as () => Reply)() : v;
  };
  const client: RespLike & { calls: string[] } = {
    calls,
    sendCommand(...args) {
      const key = args.map(String).join(' ');
      calls.push(key);
      return Promise.resolve(resolve(key));
    },
  };
  if (opts.pipeline === true) {
    client.pipeline = (...commands) => {
      const results = commands.map((cmd) => {
        const key = cmd.map(String).join(' ');
        calls.push(`pipeline: ${key}`);
        return resolve(key);
      });
      return Promise.resolve(results);
    };
  }
  return client;
}

/**
 * Build a single-batch SCAN reply. The adapter stops iterating when
 * cursor `'0'` comes back, so a 1-shot scan uses cursor '0' → '0'.
 */
function oneShotScan(keys: readonly string[]): Replies {
  return {
    [`SCAN 0 MATCH snapshot-* COUNT 10000`]: ['0', keys.filter((k) => k.startsWith('snapshot-'))],
    [`SCAN 0 MATCH log-* COUNT 10000`]: ['0', keys.filter((k) => k.startsWith('log-'))],
  };
}

async function collect<T>(iter: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const v of iter) out.push(v);
  return out;
}

describe('roomsFromRedis — SCAN enumeration', () => {
  it('paginates SCAN across multiple cursor steps', async () => {
    const client = scriptedClient({
      'HGETALL timestamps': [],
      // 3 cursor steps for snapshot-* : 0 → 17 → 42 → 0.
      'SCAN 0 MATCH snapshot-* COUNT 10000': ['17', ['snapshot-a', 'snapshot-b']],
      'SCAN 17 MATCH snapshot-* COUNT 10000': ['42', ['snapshot-c']],
      'SCAN 42 MATCH snapshot-* COUNT 10000': ['0', []],
      'SCAN 0 MATCH log-* COUNT 10000': ['0', []],
      'GET snapshot-a': 'A',
      'LRANGE log-a 0 -1': [],
      'LRANGE audit-a 0 -1': [],
      'LRANGE chat-a 0 -1': [],
      'HGETALL ecell-a': [],
      'GET snapshot-b': 'B',
      'LRANGE log-b 0 -1': [],
      'LRANGE audit-b 0 -1': [],
      'LRANGE chat-b 0 -1': [],
      'HGETALL ecell-b': [],
      'GET snapshot-c': 'C',
      'LRANGE log-c 0 -1': [],
      'LRANGE audit-c 0 -1': [],
      'LRANGE chat-c 0 -1': [],
      'HGETALL ecell-c': [],
    });
    const rooms = await collect(roomsFromRedis(client));
    expect(rooms.map((r) => r.name)).toEqual(['a', 'b', 'c']);
  });

  it('honors the scanCount hint', async () => {
    const client = scriptedClient({
      'HGETALL timestamps': [],
      'SCAN 0 MATCH snapshot-* COUNT 50': ['0', ['snapshot-only']],
      'SCAN 0 MATCH log-* COUNT 50': ['0', []],
      'GET snapshot-only': 'S',
      'LRANGE log-only 0 -1': [],
      'LRANGE audit-only 0 -1': [],
      'LRANGE chat-only 0 -1': [],
      'HGETALL ecell-only': [],
    });
    const rooms = await collect(roomsFromRedis(client, { scanCount: 50 }));
    expect(rooms).toHaveLength(1);
  });

  it('includes log-only rooms discovered via the log-* scan', async () => {
    const client = scriptedClient({
      'HGETALL timestamps': [],
      'SCAN 0 MATCH snapshot-* COUNT 10000': ['0', []],
      'SCAN 0 MATCH log-* COUNT 10000': ['0', ['log-orphan']],
      'GET snapshot-orphan': null,
      'LRANGE log-orphan 0 -1': ['cmd'],
      'LRANGE audit-orphan 0 -1': [],
      'LRANGE chat-orphan 0 -1': [],
      'HGETALL ecell-orphan': [],
    });
    const rooms = await collect(roomsFromRedis(client));
    expect(rooms).toHaveLength(1);
    expect(rooms[0]).toMatchObject({ name: 'orphan', snapshot: '', log: ['cmd'] });
  });

  it('yields rooms in alphabetical order regardless of SCAN order', async () => {
    const client = scriptedClient({
      'HGETALL timestamps': [],
      'SCAN 0 MATCH snapshot-* COUNT 10000': [
        '0',
        ['snapshot-zebra', 'snapshot-alpha'],
      ],
      'SCAN 0 MATCH log-* COUNT 10000': ['0', []],
      'GET snapshot-alpha': 'A',
      'LRANGE log-alpha 0 -1': [],
      'LRANGE audit-alpha 0 -1': [],
      'LRANGE chat-alpha 0 -1': [],
      'HGETALL ecell-alpha': [],
      'GET snapshot-zebra': 'Z',
      'LRANGE log-zebra 0 -1': [],
      'LRANGE audit-zebra 0 -1': [],
      'LRANGE chat-zebra 0 -1': [],
      'HGETALL ecell-zebra': [],
    });
    const rooms = await collect(roomsFromRedis(client));
    expect(rooms.map((r) => r.name)).toEqual(['alpha', 'zebra']);
  });
});

describe('roomsFromRedis — pipelined fetches', () => {
  it('uses pipeline() when the client supports it', async () => {
    const client = scriptedClient(
      {
        'HGETALL timestamps': ['timestamp-foo', '1700'],
        ...oneShotScan(['snapshot-foo']),
        'GET snapshot-foo': 'SAVE',
        'LRANGE log-foo 0 -1': ['cmd'],
        'LRANGE audit-foo 0 -1': ['cmd'],
        'LRANGE chat-foo 0 -1': ['hi'],
        'HGETALL ecell-foo': ['alice', 'A1'],
      },
      { pipeline: true },
    );
    const rooms = await collect(roomsFromRedis(client));
    expect(rooms).toHaveLength(1);
    expect(rooms[0]).toMatchObject({
      name: 'foo',
      snapshot: 'SAVE',
      log: ['cmd'],
      audit: ['cmd'],
      chat: ['hi'],
      ecell: { alice: 'A1' },
      updatedAt: 1700,
    });
    // All 5 per-room fetches went through the pipeline, not sequential sendCommand.
    expect(client.calls.filter((c) => c.startsWith('pipeline: '))).toHaveLength(5);
  });

  it('falls back to sequential sendCommand when pipeline is absent', async () => {
    const client = scriptedClient({
      'HGETALL timestamps': [],
      ...oneShotScan(['snapshot-foo']),
      'GET snapshot-foo': 'SAVE',
      'LRANGE log-foo 0 -1': [],
      'LRANGE audit-foo 0 -1': [],
      'LRANGE chat-foo 0 -1': [],
      'HGETALL ecell-foo': [],
    });
    const rooms = await collect(roomsFromRedis(client));
    expect(rooms).toHaveLength(1);
    expect(client.calls).toContain('GET snapshot-foo');
    expect(client.calls).toContain('LRANGE log-foo 0 -1');
  });
});

describe('roomsFromRedis — timestamps + progress', () => {
  it('falls back to the bare-room timestamp key (pre-2015 legacy)', async () => {
    const client = scriptedClient({
      'HGETALL timestamps': ['x', '42'],
      ...oneShotScan(['snapshot-x']),
      'GET snapshot-x': 'S',
      'LRANGE log-x 0 -1': [],
      'LRANGE audit-x 0 -1': [],
      'LRANGE chat-x 0 -1': [],
      'HGETALL ecell-x': [],
    });
    const rooms = await collect(roomsFromRedis(client));
    expect(rooms[0]?.updatedAt).toBe(42);
  });

  it('drops non-finite timestamp values', async () => {
    const client = scriptedClient({
      'HGETALL timestamps': ['timestamp-y', 'nope'],
      ...oneShotScan(['snapshot-y']),
      'GET snapshot-y': 'S',
      'LRANGE log-y 0 -1': [],
      'LRANGE audit-y 0 -1': [],
      'LRANGE chat-y 0 -1': [],
      'HGETALL ecell-y': [],
    });
    const rooms = await collect(roomsFromRedis(client));
    expect(rooms[0]?.updatedAt).toBeUndefined();
  });

  it('treats a null `HGETALL timestamps` response as empty', async () => {
    const client = scriptedClient({
      'HGETALL timestamps': null,
      ...oneShotScan(['snapshot-z']),
      'GET snapshot-z': 'S',
      'LRANGE log-z 0 -1': [],
      'LRANGE audit-z 0 -1': [],
      'LRANGE chat-z 0 -1': [],
      'HGETALL ecell-z': [],
    });
    const rooms = await collect(roomsFromRedis(client));
    expect(rooms[0]?.updatedAt).toBeUndefined();
  });

  it('drops oversized log/audit/chat entries and fires onOversizedEntry', async () => {
    // The real 2026-04-21 prod dump had 1 MB+ `loadclipboard` audit
    // entries that 500'd DO seed (values > 128 KiB are rejected by
    // DO storage). Filter side on the migrator so the run can
    // complete — the dropped audits are legacy clipboard pastes,
    // not load-bearing.
    const big = 'x'.repeat(200_000); // 200 KB > 120 KB default cap
    const small = 'ok';
    const client = scriptedClient({
      'HGETALL timestamps': [],
      ...oneShotScan(['snapshot-fat']),
      'GET snapshot-fat': 'S',
      'LRANGE log-fat 0 -1': [small, big, small],
      'LRANGE audit-fat 0 -1': [big, small],
      'LRANGE chat-fat 0 -1': [],
      'HGETALL ecell-fat': [],
    });
    const dropped: Array<{ kind: string; index: number; bytes: number }> = [];
    const rooms = await collect(
      roomsFromRedis(client, {
        onOversizedEntry: ({ kind, index, bytes }) => {
          dropped.push({ kind, index, bytes });
        },
      }),
    );
    expect(rooms[0]?.log).toEqual([small, small]);
    expect(rooms[0]?.audit).toEqual([small]);
    expect(dropped).toEqual([
      { kind: 'log', index: 1, bytes: 200_000 },
      { kind: 'audit', index: 0, bytes: 200_000 },
    ]);
  });

  it('skips whole room when snapshot exceeds maxSnapshotBytes', async () => {
    // Covers the oversized-snapshot path — dropping just the snapshot
    // leaves a half-room, so the adapter omits the whole room and
    // fires onSkippedRoom for the operator.
    const bigSnap = 'a'.repeat(200_000);
    const client = scriptedClient({
      'HGETALL timestamps': [],
      ...oneShotScan(['snapshot-huge', 'snapshot-ok']),
      'GET snapshot-huge': bigSnap,
      'LRANGE log-huge 0 -1': [],
      'LRANGE audit-huge 0 -1': [],
      'LRANGE chat-huge 0 -1': [],
      'HGETALL ecell-huge': [],
      'GET snapshot-ok': 'small',
      'LRANGE log-ok 0 -1': [],
      'LRANGE audit-ok 0 -1': [],
      'LRANGE chat-ok 0 -1': [],
      'HGETALL ecell-ok': [],
    });
    const skipped: Array<{ room: string; bytes: number }> = [];
    const rooms = await collect(
      roomsFromRedis(client, {
        onSkippedRoom: ({ room, bytes }) => skipped.push({ room, bytes }),
      }),
    );
    expect(rooms.map((r) => r.name)).toEqual(['ok']);
    expect(skipped).toEqual([{ room: 'huge', bytes: 200_000 }]);
  });

  it('honors custom maxEntryBytes threshold', async () => {
    const medium = 'y'.repeat(50_000); // 50 KB
    const client = scriptedClient({
      'HGETALL timestamps': [],
      ...oneShotScan(['snapshot-m']),
      'GET snapshot-m': 'S',
      'LRANGE log-m 0 -1': [medium],
      'LRANGE audit-m 0 -1': [],
      'LRANGE chat-m 0 -1': [],
      'HGETALL ecell-m': [],
    });
    const rooms = await collect(
      roomsFromRedis(client, { maxEntryBytes: 40_000 }),
    );
    expect(rooms[0]?.log).toEqual([]); // 50 KB > 40 KB, dropped
  });

  it('calls onProgress after each room', async () => {
    const client = scriptedClient({
      'HGETALL timestamps': [],
      ...oneShotScan(['snapshot-a', 'snapshot-b']),
      'GET snapshot-a': 'A',
      'LRANGE log-a 0 -1': [],
      'LRANGE audit-a 0 -1': [],
      'LRANGE chat-a 0 -1': [],
      'HGETALL ecell-a': [],
      'GET snapshot-b': 'B',
      'LRANGE log-b 0 -1': [],
      'LRANGE audit-b 0 -1': [],
      'LRANGE chat-b 0 -1': [],
      'HGETALL ecell-b': [],
    });
    const onProgress = vi.fn();
    await collect(roomsFromRedis(client, { onProgress }));
    expect(onProgress).toHaveBeenCalledTimes(2);
    expect(onProgress.mock.calls[0]).toEqual([{ done: 1, total: 2 }]);
    expect(onProgress.mock.calls[1]).toEqual([{ done: 2, total: 2 }]);
  });
});
