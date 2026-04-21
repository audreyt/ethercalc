/**
 * Minimal RESP (Redis Serialization Protocol) client.
 *
 * Purpose: let `@ethercalc/migrate` consume a legacy dump by pointing
 * at a RESP-speaking server (real `redis-server` or Zedis) that has
 * already loaded `dump.rdb`. The server owns the RDB parser; the
 * migrator owns the shape-shifting into Worker PUTs. Total memory in
 * the migrator stays O(1-per-room) regardless of the dump size.
 *
 * Wire format (per Redis docs):
 *   `+…\r\n`      simple string
 *   `-…\r\n`      error (surfaced as `RespError`)
 *   `:42\r\n`     integer
 *   `$5\r\nhello\r\n`   bulk string
 *   `$-1\r\n`      null bulk
 *   `*2\r\n…\r\n…` array (length-prefixed, -1 for null)
 *
 * We implement the subset EtherCalc needs. The parser is incremental:
 * each socket chunk drains as many complete responses as possible,
 * returning `null` when the current message is still in flight.
 */

import { createConnection, type Socket } from 'node:net';

/** Value shape returned from Redis — strings decoded as UTF-8. */
export type RespValue = string | number | null | RespValue[];

/** Raised when the server responds with a `-ERR …` line. */
export class RespError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RespError';
  }
}

/**
 * Minimal socket surface used by {@link RespClient}. Subset of
 * `node:net.Socket` so tests can inject a fake without a real TCP
 * handshake. Unit tests cover the parser by driving `onData` directly.
 */
export interface RespSocket {
  write(data: string | Buffer): void;
  end(cb?: () => void): void;
  on(event: 'data', listener: (chunk: Buffer) => void): void;
  on(event: 'error' | 'close', listener: (err?: Error) => void): void;
}

interface Waiter {
  resolve: (v: RespValue) => void;
  reject: (err: Error) => void;
}

/**
 * Strictly-ordered RESP client. Every `sendCommand` enqueues a waiter
 * and writes the encoded command; as bytes arrive, the parser resolves
 * or rejects the oldest waiter. No pipelining (command-per-roundtrip
 * is fast enough over loopback for the migration use case).
 */
export class RespClient {
  readonly #socket: RespSocket;
  #pending: Buffer = Buffer.alloc(0);
  #queue: Waiter[] = [];
  #closed = false;

  constructor(socket: RespSocket) {
    this.#socket = socket;
    socket.on('data', (chunk) => this.#onData(chunk));
    socket.on('error', (err) => this.#failAll(err ?? new Error('socket error')));
    socket.on('close', () => this.#failAll(new Error('connection closed')));
  }

  /**
   * Open a TCP connection to `redis://host:port`. Any other scheme
   * (including bare host:port) is rejected — we want the URL to be
   * self-describing in log lines.
   */
  static async connect(
    url: string,
    connect: (host: string, port: number) => Promise<RespSocket> = defaultConnect,
  ): Promise<RespClient> {
    const parsed = new URL(url);
    if (parsed.protocol !== 'redis:') {
      throw new Error(`unsupported scheme: ${parsed.protocol} (expected redis://)`);
    }
    // URL() always populates `hostname` for a redis:// URL (it rejects
    // `redis://:6379` outright), so no fallback is needed here.
    const host = parsed.hostname;
    const port = parsed.port === '' ? 6379 : Number(parsed.port);
    const socket = await connect(host, port);
    return new RespClient(socket);
  }

  /**
   * Serialize an inline command via the array-of-bulks form (the
   * universal shape every Redis server accepts). Returns whatever the
   * server sends back, decoded into {@link RespValue}.
   */
  sendCommand(...args: readonly (string | number)[]): Promise<RespValue> {
    if (this.#closed) {
      return Promise.reject(new Error('RespClient is closed'));
    }
    this.#socket.write(encodeCommand(args));
    return new Promise<RespValue>((resolve, reject) => {
      this.#queue.push({ resolve, reject });
    });
  }

  /**
   * Fire a batch of commands in one TCP write, then await all replies
   * in order. Standard Redis pipelining — saves N-1 round-trips per
   * batch over loopback and adds up fast in a per-room migration loop.
   * The server guarantees it processes commands and replies in order,
   * so the Nth returned value corresponds to the Nth command.
   */
  pipeline(
    ...commands: readonly (readonly (string | number)[])[]
  ): Promise<readonly RespValue[]> {
    if (this.#closed) {
      return Promise.reject(new Error('RespClient is closed'));
    }
    // Empty batch is legal — no bytes on the wire, empty reply.
    if (commands.length === 0) return Promise.resolve([]);
    const bufs: string[] = [];
    for (const cmd of commands) bufs.push(encodeCommand(cmd));
    this.#socket.write(bufs.join(''));
    const promises: Promise<RespValue>[] = [];
    for (let i = 0; i < commands.length; i++) {
      promises.push(
        new Promise<RespValue>((resolve, reject) => {
          this.#queue.push({ resolve, reject });
        }),
      );
    }
    return Promise.all(promises);
  }

  /** Send QUIT and close the TCP stream. */
  close(): Promise<void> {
    this.#closed = true;
    return new Promise((resolve) => {
      this.#socket.end(() => resolve());
    });
  }

  #onData(chunk: Buffer): void {
    this.#pending =
      this.#pending.length === 0 ? chunk : Buffer.concat([this.#pending, chunk]);
    while (this.#queue.length > 0) {
      let result: ParseResult;
      try {
        result = tryParse(this.#pending, 0);
      } catch (err) {
        // Propagate hard protocol errors to every pending waiter — the
        // stream is in an unknown state, can't safely deliver more.
        this.#failAll(err as Error);
        return;
      }
      if (result === null) return; // need more bytes
      this.#pending = this.#pending.subarray(result.consumed);
      const waiter = this.#queue.shift() as Waiter;
      if (result.value instanceof Error) waiter.reject(result.value);
      else waiter.resolve(result.value);
    }
  }

  #failAll(err: Error): void {
    this.#closed = true;
    const q = this.#queue;
    this.#queue = [];
    for (const w of q) w.reject(err);
  }
}

interface ParseResultOk {
  readonly value: RespValue | RespError;
  readonly consumed: number;
}
type ParseResult = ParseResultOk | null;

function tryParse(buf: Buffer, offset: number): ParseResult {
  if (offset >= buf.length) return null;
  const tag = buf[offset];
  if (tag === 0x2b /* '+' */) {
    const end = findCRLF(buf, offset + 1);
    if (end < 0) return null;
    return {
      value: buf.subarray(offset + 1, end).toString('utf8'),
      consumed: end + 2,
    };
  }
  if (tag === 0x2d /* '-' */) {
    const end = findCRLF(buf, offset + 1);
    if (end < 0) return null;
    return {
      value: new RespError(buf.subarray(offset + 1, end).toString('utf8')),
      consumed: end + 2,
    };
  }
  if (tag === 0x3a /* ':' */) {
    const end = findCRLF(buf, offset + 1);
    if (end < 0) return null;
    const n = Number(buf.subarray(offset + 1, end).toString('utf8'));
    return { value: n, consumed: end + 2 };
  }
  if (tag === 0x24 /* '$' */) {
    const end = findCRLF(buf, offset + 1);
    if (end < 0) return null;
    const len = Number(buf.subarray(offset + 1, end).toString('utf8'));
    if (len === -1) return { value: null, consumed: end + 2 };
    const start = end + 2;
    if (start + len + 2 > buf.length) return null;
    return {
      value: buf.subarray(start, start + len).toString('utf8'),
      consumed: start + len + 2,
    };
  }
  if (tag === 0x2a /* '*' */) {
    const end = findCRLF(buf, offset + 1);
    if (end < 0) return null;
    const n = Number(buf.subarray(offset + 1, end).toString('utf8'));
    if (n === -1) return { value: null, consumed: end + 2 };
    const arr: RespValue[] = [];
    let pos = end + 2;
    for (let i = 0; i < n; i++) {
      const sub = tryParse(buf, pos);
      if (sub === null) return null;
      // Errors nested inside arrays are valid RESP but never appear in
      // the replies EtherCalc's migration issues (KEYS/GET/LRANGE/
      // HGETALL). Surface as a protocol error if it ever happens so
      // we don't silently corrupt room data.
      if (sub.value instanceof Error) throw sub.value;
      arr.push(sub.value);
      pos = sub.consumed;
    }
    return { value: arr, consumed: pos };
  }
  // `tag` is always defined when we reach this line — the `offset >=
  // buf.length` guard above rules out a short buffer, and we only
  // fall through here when none of the five legal tag bytes matched.
  throw new RespError(`unsupported RESP type 0x${(tag as number).toString(16)}`);
}

/** Encode one command in the RESP array-of-bulks form. */
function encodeCommand(args: readonly (string | number)[]): string {
  const parts: string[] = [`*${args.length}\r\n`];
  for (const a of args) {
    const s = typeof a === 'string' ? a : String(a);
    parts.push(`$${Buffer.byteLength(s, 'utf8')}\r\n`);
    parts.push(s);
    parts.push('\r\n');
  }
  return parts.join('');
}

function findCRLF(buf: Buffer, start: number): number {
  for (let i = start; i < buf.length - 1; i++) {
    if (buf[i] === 0x0d && buf[i + 1] === 0x0a) return i;
  }
  return -1;
}

function defaultConnect(host: string, port: number): Promise<RespSocket> {
  return new Promise((resolve, reject) => {
    const sock = createConnection({ host, port });
    sock.once('connect', () => {
      sock.removeListener('error', reject);
      resolve(sock as unknown as RespSocket);
    });
    sock.once('error', reject);
  });
}
