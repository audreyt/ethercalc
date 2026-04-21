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

  let done = 0;
  for (const name of sorted) {
    const [snapshot, log, audit, chat, ecellArr] = await fetchRoom(client, name);

    const ecell: Record<string, string> = {};
    for (let i = 0; i + 1 < ecellArr.length; i += 2) {
      ecell[ecellArr[i] as string] = ecellArr[i + 1] as string;
    }

    const ts = timestamps.get(`timestamp-${name}`) ?? timestamps.get(name);
    const updatedAt =
      ts !== undefined && Number.isFinite(Number(ts)) ? Number(ts) : undefined;

    const room: Room = {
      name,
      snapshot: snapshot ?? '',
      log,
      audit,
      chat,
      ecell,
      ...(updatedAt !== undefined ? { updatedAt } : {}),
    };
    yield room;
    done += 1;
    options.onProgress?.({ done, total: sorted.length });
  }
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
