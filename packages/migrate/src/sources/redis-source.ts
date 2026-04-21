/**
 * Redis-source adapter — streams rooms out of a running RESP-speaking
 * server (Redis or Zedis) that has already loaded the legacy dump.
 *
 * Contract: caller owns the client lifecycle (connect/close). This
 * module only enumerates and fetches. One room per async yield; all
 * in-memory state is bounded to (a) the set of distinct room names
 * discovered via `SCAN`, and (b) one room's worth of data at a time
 * during iteration.
 *
 * Semantics follow the legacy key layout (CLAUDE.md §6.3):
 *   - `snapshot-<room>` + `log-<room>` + `audit-<room>` + `chat-<room>`
 *     + `ecell-<room>` are the per-room keys.
 *   - `timestamps` is a shared hash whose fields (either
 *     `timestamp-<room>` or bare `<room>`) carry `updated_at`.
 *   - Rooms appear in sorted order for output determinism.
 *
 * Performance knobs:
 *   - `SCAN` with `COUNT hint` instead of a single `KEYS` call avoids
 *     Redis having to materialize the entire keyspace match list in
 *     one response (saves ~3 GB of RSS on a 1.8M-key dump).
 *   - `pipeline()` batches the 5 per-room fetches so each room only
 *     pays one TCP round-trip (not five), roughly 4× throughput on
 *     loopback.
 */
import type { Room } from '../apply.ts';

/** Narrow shape of {@link import('../resp-client.ts').RespClient} used here. */
export interface RespLike {
  sendCommand(...args: readonly (string | number)[]): Promise<unknown>;
  /**
   * Optional batched path — when present, the source fetches each
   * room's 5 RESP replies in one round-trip. Absent (or stubbed)
   * clients fall back to sequential `sendCommand` calls.
   */
  pipeline?(
    ...commands: readonly (readonly (string | number)[])[]
  ): Promise<readonly unknown[]>;
}

export interface RoomsFromRedisOptions {
  /** Invoked after each room is yielded. */
  onProgress?: (info: { readonly done: number; readonly total: number }) => void;
  /**
   * `SCAN … COUNT <hint>` hint passed per cursor step. Redis treats
   * this as a hint, not a cap — it may return fewer or more keys per
   * batch. Defaults to 10 000, tuned for large dumps on localhost.
   */
  scanCount?: number;
  /**
   * Max bytes per individual `log`/`audit`/`chat` entry — anything
   * longer gets dropped (with optional callback notice) rather than
   * shipped. Cloudflare Durable Object storage rejects values over
   * 128 KiB per key; a handful of legacy `loadclipboard` audit
   * entries in the real dump are 1–5 MB and would 500 the DO seed
   * without this filter. Default 120 KiB (leaving ~8 KiB headroom
   * under the 128 KiB ceiling for the JSON envelope).
   */
  maxEntryBytes?: number;
  /** Called when an entry is dropped for exceeding `maxEntryBytes`. */
  onOversizedEntry?: (info: {
    readonly room: string;
    readonly kind: 'log' | 'audit' | 'chat';
    readonly index: number;
    readonly bytes: number;
  }) => void;
  /**
   * Whole-room skip threshold. Same 128 KiB DO ceiling, but snapshots
   * are authoritative (unlike audit rows) so we can't silently drop
   * them — the room stops being a room without one. Rooms whose
   * snapshot exceeds this are skipped outright and surfaced via
   * `onSkippedRoom` for the operator to inspect manually. Default
   * matches `maxEntryBytes`.
   */
  maxSnapshotBytes?: number;
  /** Called when a whole room is skipped for an oversized snapshot. */
  onSkippedRoom?: (info: {
    readonly room: string;
    readonly bytes: number;
  }) => void;
}

/**
 * Enumerate every EtherCalc room in the connected Redis and yield a
 * fully-assembled {@link Room} for each. Rooms are collected from
 * both `snapshot-*` and `log-*` so log-only rooms (legacy behavior)
 * aren't missed.
 */
export async function* roomsFromRedis(
  client: RespLike,
  options: RoomsFromRedisOptions = {},
): AsyncIterable<Room> {
  const scanCount = options.scanCount ?? 10_000;
  const timestamps = await fetchTimestamps(client);

  // Cursor-iterate both patterns, deduping into a set. Only the room
  // names are held in memory during enumeration — the server never
  // has to materialize the full keyspace in one reply.
  const names = new Set<string>();
  for await (const k of scanKeys(client, 'snapshot-*', scanCount)) {
    names.add(k.slice('snapshot-'.length));
  }
  for await (const k of scanKeys(client, 'log-*', scanCount)) {
    names.add(k.slice('log-'.length));
  }
  const sorted = Array.from(names).sort();
  const maxEntryBytes = options.maxEntryBytes ?? 120 * 1024;
  const maxSnapshotBytes = options.maxSnapshotBytes ?? maxEntryBytes;
  const onOversizedEntry = options.onOversizedEntry;
  const onSkippedRoom = options.onSkippedRoom;

  let done = 0;
  for (const name of sorted) {
    const [snapshot, log, audit, chat, ecellArr] = await fetchRoom(client, name);

    // Snapshots are authoritative — dropping just the snapshot leaves
    // the room in a weird half-state (DO exists, has logs, but no
    // save). Skip the whole room instead and let the operator decide
    // (e.g. split the sheet, rehydrate from audit, or accept loss).
    const snapshotStr = snapshot ?? '';
    const snapshotBytes = Buffer.byteLength(snapshotStr, 'utf8');
    if (snapshotBytes > maxSnapshotBytes) {
      onSkippedRoom?.({ room: name, bytes: snapshotBytes });
      done += 1;
      options.onProgress?.({ done, total: sorted.length });
      continue;
    }

    const ecell: Record<string, string> = {};
    for (let i = 0; i + 1 < ecellArr.length; i += 2) {
      ecell[ecellArr[i] as string] = ecellArr[i + 1] as string;
    }

    const ts = timestamps.get(`timestamp-${name}`) ?? timestamps.get(name);
    const updatedAt =
      ts !== undefined && Number.isFinite(Number(ts)) ? Number(ts) : undefined;

    const room: Room = {
      name,
      snapshot: snapshotStr,
      log: filterOversized(log, 'log', name, maxEntryBytes, onOversizedEntry),
      audit: filterOversized(audit, 'audit', name, maxEntryBytes, onOversizedEntry),
      chat: filterOversized(chat, 'chat', name, maxEntryBytes, onOversizedEntry),
      ecell,
      ...(updatedAt !== undefined ? { updatedAt } : {}),
    };
    yield room;
    done += 1;
    options.onProgress?.({ done, total: sorted.length });
  }
}

/**
 * Drop entries that exceed the per-value byte ceiling and invoke the
 * `onOversizedEntry` callback for each drop. Preserves array order for
 * the survivors; sequence indices on the DO side go by `i` in the
 * filtered array, so the dropped audits silently disappear from the
 * post-migration history (fine — they're historical audit noise, not
 * load-bearing state).
 */
function filterOversized(
  entries: readonly string[],
  kind: 'log' | 'audit' | 'chat',
  room: string,
  max: number,
  cb?: (info: {
    readonly room: string;
    readonly kind: 'log' | 'audit' | 'chat';
    readonly index: number;
    readonly bytes: number;
  }) => void,
): string[] {
  const out: string[] = [];
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i] as string;
    // Always compute real UTF-8 byte length — an earlier "length * 3"
    // fast-path false-positived on mostly-ASCII strings (e.g. 60k ASCII
    // chars report `length * 3 = 180k` but actual is 60k).
    const bytes = Buffer.byteLength(entry, 'utf8');
    if (bytes > max) {
      cb?.({ room, kind, index: i, bytes });
      continue;
    }
    out.push(entry);
  }
  return out;
}

/**
 * Yield every key matching `pattern` via `SCAN`. The cursor protocol:
 *   `SCAN <cursor> MATCH <pattern> COUNT <hint>` →
 *     `[<nextCursor>, [<key>, <key>, …]]`
 * Cursor `'0'` on the reply means "iteration complete".
 */
async function* scanKeys(
  client: RespLike,
  pattern: string,
  count: number,
): AsyncIterable<string> {
  let cursor = '0';
  // `do…while` so we start the loop body on the initial cursor '0' and
  // stop only after the server echoes '0' back post-scan.
  do {
    const resp = (await client.sendCommand(
      'SCAN',
      cursor,
      'MATCH',
      pattern,
      'COUNT',
      count,
    )) as [string, string[]];
    cursor = resp[0];
    for (const k of resp[1]) yield k;
  } while (cursor !== '0');
}

/**
 * Fetch the 5 per-room shapes (snapshot + log + audit + chat + ecell)
 * in one RESP round-trip when pipelining is supported. The sequential
 * fallback is preserved for test doubles that only implement
 * `sendCommand`.
 */
async function fetchRoom(
  client: RespLike,
  name: string,
): Promise<readonly [string | null, string[], string[], string[], string[]]> {
  const commands: readonly (readonly (string | number)[])[] = [
    ['GET', `snapshot-${name}`],
    ['LRANGE', `log-${name}`, '0', '-1'],
    ['LRANGE', `audit-${name}`, '0', '-1'],
    ['LRANGE', `chat-${name}`, '0', '-1'],
    ['HGETALL', `ecell-${name}`],
  ];
  if (client.pipeline !== undefined) {
    const [snapshot, log, audit, chat, ecell] = await client.pipeline(...commands);
    return [
      snapshot as string | null,
      log as string[],
      audit as string[],
      chat as string[],
      ecell as string[],
    ];
  }
  const snapshot = (await client.sendCommand(...commands[0] as (string | number)[])) as
    | string
    | null;
  const log = (await client.sendCommand(...commands[1] as (string | number)[])) as string[];
  const audit = (await client.sendCommand(...commands[2] as (string | number)[])) as string[];
  const chat = (await client.sendCommand(...commands[3] as (string | number)[])) as string[];
  const ecell = (await client.sendCommand(...commands[4] as (string | number)[])) as string[];
  return [snapshot, log, audit, chat, ecell];
}

/**
 * Fetch the `timestamps` hash in one round-trip, flattened into a
 * `field → value` map. Missing → empty map (legacy dumps omitted the
 * hash entirely in early EtherCalc versions).
 */
async function fetchTimestamps(
  client: RespLike,
): Promise<ReadonlyMap<string, string>> {
  const resp = (await client.sendCommand('HGETALL', 'timestamps')) as
    | string[]
    | null;
  const out = new Map<string, string>();
  if (resp === null) return out;
  for (let i = 0; i + 1 < resp.length; i += 2) {
    out.set(resp[i] as string, resp[i + 1] as string);
  }
  return out;
}
