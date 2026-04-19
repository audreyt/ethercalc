/**
 * Minimal Redis RDB dump parser (offline).
 *
 * Input: a Buffer — the output of `redis-cli --rdb /tmp/ethercalc.rdb`
 * against a legacy EtherCalc Redis instance. Output: a `RedisDump`
 * containing only the three value shapes EtherCalc ever writes:
 *   - strings         (snapshot-<room>, cron-nextTriggerTime)
 *   - lists of bytes  (log-<room>, audit-<room>, chat-<room>)
 *   - hashes          (ecell-<room>, timestamps, cron-list)
 *
 * Why hand-rolled, not `redis-rdb-parser`?
 *   1. We need to run fully offline with zero Redis Node deps (per task
 *      constraint "Do NOT depend on redis/ioredis"). Some npm "rdb
 *      parser" packages are actually thin wrappers around `redis-cli`;
 *      others pull in a native `snappy` addon. Keeping it in-repo lets
 *      CI run on any plain Node image.
 *   2. The RDB opcode and encoding set we must support is tiny. The
 *      legacy server never uses streams, sets, sorted sets, modules,
 *      bignums, or any of the RDB ≥ 10 quick* encodings — so the parser
 *      can stay small and auditable.
 *   3. The alternative format we must also round-trip is our own
 *      synthetic fixtures (see test/fixtures/). A hand-rolled parser
 *      shares its writer counterpart, making test fixtures both
 *      deterministic and free of external tooling during CI.
 *
 * Supported RDB versions: 6 – 11 (Redis 2.6 … 7.4). Unsupported opcodes
 * throw `RdbParseError` with offset + byte so the error message is
 * actionable. This is by design: we'd rather fail loudly on a key type
 * the legacy server never emits than silently skip data.
 *
 * Reference: https://github.com/sripathikrishnan/redis-rdb-tools/blob/master/docs/RDB_File_Format.textile
 */

/** Discriminated-union result of a successful dump parse. */
export interface RedisDump {
  /** string-typed keys. */
  strings: Map<string, string>;
  /** list-typed keys. Values in Redis insertion order. */
  lists: Map<string, string[]>;
  /** hash-typed keys. Nested map preserves field → value. */
  hashes: Map<string, Map<string, string>>;
}

/** Thrown when the input buffer violates the RDB format. */
export class RdbParseError extends Error {
  public readonly offset: number;
  constructor(message: string, offset: number) {
    super(`${message} (at byte ${offset})`);
    this.name = 'RdbParseError';
    this.offset = offset;
  }
}

// --- RDB opcodes we understand ---------------------------------------------
// From the reference above, section "RDB File Format".
const OP_AUX = 0xfa; // aux field (redis-ver, redis-bits, ctime, used-mem…)
const OP_RESIZEDB = 0xfb; // hash-table size hint
const OP_EXPIRETIME_MS = 0xfc; // 8-byte ms expiration for next key
const OP_EXPIRETIME_S = 0xfd; // 4-byte sec expiration for next key
const OP_SELECTDB = 0xfe; // new DB selector
const OP_EOF = 0xff; // end of file

// Value type tags (first byte of each key's value).
const TYPE_STRING = 0x00;
const TYPE_LIST = 0x01;
const TYPE_HASH = 0x04;
const TYPE_LIST_ZIPLIST = 0x0e; // listpack-in-ziplist envelope (legacy)
const TYPE_HASH_ZIPLIST = 0x0d;
const TYPE_LIST_QUICKLIST = 0x12; // Redis >= 7
const TYPE_HASH_LISTPACK = 0x10;
const TYPE_LIST_QUICKLIST_2 = 0x13;

// --- Length-prefix encoding ------------------------------------------------
// Redis RDB length encoding: first two bits indicate size width.
//   00 — 6-bit length follows in the low bits of the same byte.
//   01 — 14-bit length, high bits in this byte, low byte next.
//   10 — 32-bit length big-endian, 4 bytes follow. (RDB >= 7 uses 0x80 +
//        64-bit LE for >2GB, handled explicitly.)
//   11 — special encoding: the low 6 bits pick an integer or compressed
//        string format (see SPECIAL_ prefixes below).
const SPECIAL_INT8 = 0;
const SPECIAL_INT16 = 1;
const SPECIAL_INT32 = 2;
const SPECIAL_LZF = 3;

/**
 * Entry point — parse a full RDB dump buffer.
 *
 * @throws {RdbParseError} on malformed input or unsupported opcode.
 */
export function parseRdb(buf: Buffer): RedisDump {
  const r = new Reader(buf);
  r.expectMagic();
  const dump: RedisDump = {
    strings: new Map(),
    lists: new Map(),
    hashes: new Map(),
  };
  while (true) {
    const op = r.readByte();
    if (op === OP_EOF) return dump;
    if (op === OP_SELECTDB) {
      r.readLength(); // we ignore DB index — legacy uses DB 0 exclusively
      continue;
    }
    if (op === OP_RESIZEDB) {
      r.readLength(); // hash table size
      r.readLength(); // expires table size
      continue;
    }
    if (op === OP_AUX) {
      r.readString(); // aux key
      r.readString(); // aux value
      continue;
    }
    if (op === OP_EXPIRETIME_MS) {
      r.skip(8); // we don't preserve expirations — snapshots will re-set TTL
      continue;
    }
    if (op === OP_EXPIRETIME_S) {
      r.skip(4);
      continue;
    }
    // Value-bearing byte: the `op` is actually the RDB type tag for the
    // next key+value pair.
    const key = r.readString();
    readValue(r, op, key, dump);
  }
}

/** Dispatch on the type tag and populate the appropriate dump slot. */
function readValue(r: Reader, type: number, key: string, dump: RedisDump): void {
  switch (type) {
    case TYPE_STRING: {
      dump.strings.set(key, r.readString());
      return;
    }
    case TYPE_LIST: {
      const n = r.readLength();
      const out: string[] = [];
      for (let i = 0; i < n; i++) out.push(r.readString());
      dump.lists.set(key, out);
      return;
    }
    case TYPE_HASH: {
      const n = r.readLength();
      const out = new Map<string, string>();
      for (let i = 0; i < n; i++) {
        const f = r.readString();
        const v = r.readString();
        out.set(f, v);
      }
      dump.hashes.set(key, out);
      return;
    }
    case TYPE_LIST_QUICKLIST:
    case TYPE_LIST_QUICKLIST_2: {
      // Quicklist: a list of ziplist/listpack-encoded sub-buffers.
      const nNodes = r.readLength();
      const out: string[] = [];
      for (let i = 0; i < nNodes; i++) {
        if (type === TYPE_LIST_QUICKLIST_2) r.readLength(); // container hint
        const sub = r.readStringBuffer();
        parseListpackInto(sub, out);
      }
      dump.lists.set(key, out);
      return;
    }
    case TYPE_HASH_LISTPACK: {
      const sub = r.readStringBuffer();
      const arr: string[] = [];
      parseListpackInto(sub, arr);
      const m = new Map<string, string>();
      for (let i = 0; i + 1 < arr.length; i += 2) {
        // parseListpackInto only ever pushes strings so these slots are
        // well-defined; the cast silences noUncheckedIndexedAccess.
        m.set(arr[i] as string, arr[i + 1] as string);
      }
      dump.hashes.set(key, m);
      return;
    }
    case TYPE_LIST_ZIPLIST: {
      // Redis <= 6 sometimes emitted lists as a single ziplist blob.
      const sub = r.readStringBuffer();
      const arr: string[] = [];
      parseZiplistInto(sub, arr);
      dump.lists.set(key, arr);
      return;
    }
    case TYPE_HASH_ZIPLIST: {
      const sub = r.readStringBuffer();
      const arr: string[] = [];
      parseZiplistInto(sub, arr);
      const m = new Map<string, string>();
      for (let i = 0; i + 1 < arr.length; i += 2) {
        m.set(arr[i] as string, arr[i + 1] as string);
      }
      dump.hashes.set(key, m);
      return;
    }
    default:
      throw new RdbParseError(
        `Unsupported RDB value type 0x${type.toString(16).padStart(2, '0')} for key ${JSON.stringify(key)}`,
        r.offset - 1,
      );
  }
}

// ---------------------------------------------------------------------------
// Listpack / ziplist mini-parsers. We implement *only* the subset needed
// for EtherCalc's stored values: UTF-8 short strings and unsigned integers
// up to 2^63. The output is always stringified (parity with how the legacy
// server consumed LRANGE / HGETALL replies — everything came back as a
// Node string).
// ---------------------------------------------------------------------------

function parseListpackInto(buf: Buffer, out: string[]): void {
  // Listpack layout (Redis ≥ 7):
  //   total-bytes (4 LE) | num-elements (2 LE) | elements* | 0xff terminator
  if (buf.length < 7) {
    throw new RdbParseError('listpack too short', 0);
  }
  let i = 6; // skip header
  while (i < buf.length - 1) {
    const b0 = buf[i] as number;
    if ((b0 & 0x80) === 0) {
      // 7-bit uint (0xxxxxxx)
      out.push(String(b0));
      i += 2; // 1 byte value + 1 byte back-len
      continue;
    }
    if ((b0 & 0xc0) === 0x80) {
      // 6-bit short string: 10xxxxxx | len=low6
      const len = b0 & 0x3f;
      out.push(buf.subarray(i + 1, i + 1 + len).toString('utf8'));
      i += 1 + len + backlen(1 + len);
      continue;
    }
    if ((b0 & 0xe0) === 0xc0) {
      // 13-bit signed int: 110xxxxx | xxxxxxxx
      let v = ((b0 & 0x1f) << 8) | (buf[i + 1] as number);
      if (v >= 1 << 12) v -= 1 << 13;
      out.push(String(v));
      i += 2 + backlen(2);
      continue;
    }
    if ((b0 & 0xff) === 0xf1) {
      // 16-bit signed int.
      const v = buf.readInt16LE(i + 1);
      out.push(String(v));
      i += 3 + backlen(3);
      continue;
    }
    if ((b0 & 0xff) === 0xf2) {
      // 24-bit signed int.
      let v = (buf[i + 1] as number) | ((buf[i + 2] as number) << 8) | ((buf[i + 3] as number) << 16);
      if (v >= 1 << 23) v -= 1 << 24;
      out.push(String(v));
      i += 4 + backlen(4);
      continue;
    }
    if ((b0 & 0xff) === 0xf3) {
      // 32-bit signed int.
      const v = buf.readInt32LE(i + 1);
      out.push(String(v));
      i += 5 + backlen(5);
      continue;
    }
    if ((b0 & 0xff) === 0xf4) {
      // 64-bit signed int.
      const v = buf.readBigInt64LE(i + 1);
      out.push(v.toString());
      i += 9 + backlen(9);
      continue;
    }
    if ((b0 & 0xf0) === 0xe0) {
      // 12-bit length string: 1110xxxx xxxxxxxx | data…
      const len = ((b0 & 0x0f) << 8) | (buf[i + 1] as number);
      const start = i + 2;
      out.push(buf.subarray(start, start + len).toString('utf8'));
      i += 2 + len + backlen(2 + len);
      continue;
    }
    if ((b0 & 0xff) === 0xf0) {
      // 32-bit length string: 11110000 | 32-bit LE len | data…
      const len = buf.readUInt32LE(i + 1);
      const start = i + 5;
      out.push(buf.subarray(start, start + len).toString('utf8'));
      i += 5 + len + backlen(5 + len);
      continue;
    }
    throw new RdbParseError(`Unknown listpack element tag 0x${b0.toString(16)}`, i);
  }
}

/** Listpack back-length width: for encoded-size n, it's ceil(log128(n+1)+1). */
function backlen(encodedLen: number): number {
  // Widths 1..4 cover 0..268MB, which exceeds any single-element listpack
  // payload we will ever encounter (Redis caps at ~1GB total listpack
  // size and individual entries are far smaller). The 5-byte width is
  // defined by the spec for completeness; we never exercise it.
  if (encodedLen < 128) return 1;
  if (encodedLen < 16384) return 2;
  if (encodedLen < 2097152) return 3;
  return 4;
}

function parseZiplistInto(buf: Buffer, out: string[]): void {
  // Ziplist layout: zlbytes(4) | zltail(4) | zllen(2) | entries* | 0xff
  if (buf.length < 11) throw new RdbParseError('ziplist too short', 0);
  let i = 10;
  while (i < buf.length) {
    const b = buf[i] as number;
    if (b === 0xff) return;
    // skip prevlen: 1 byte if < 254, else 5 bytes
    const prevLenWidth = b < 254 ? 1 : 5;
    i += prevLenWidth;
    const enc = buf[i] as number;
    if ((enc & 0xc0) === 0x00) {
      // 6-bit string length
      const len = enc & 0x3f;
      out.push(buf.subarray(i + 1, i + 1 + len).toString('utf8'));
      i += 1 + len;
      continue;
    }
    if ((enc & 0xc0) === 0x40) {
      // 14-bit string length
      const len = ((enc & 0x3f) << 8) | (buf[i + 1] as number);
      out.push(buf.subarray(i + 2, i + 2 + len).toString('utf8'));
      i += 2 + len;
      continue;
    }
    if (enc === 0x80) {
      // 32-bit string length
      const len = buf.readUInt32BE(i + 1);
      out.push(buf.subarray(i + 5, i + 5 + len).toString('utf8'));
      i += 5 + len;
      continue;
    }
    if (enc === 0xc0) {
      // int16
      out.push(String(buf.readInt16LE(i + 1)));
      i += 3;
      continue;
    }
    if (enc === 0xd0) {
      // int32
      out.push(String(buf.readInt32LE(i + 1)));
      i += 5;
      continue;
    }
    if (enc === 0xe0) {
      // int64
      out.push(buf.readBigInt64LE(i + 1).toString());
      i += 9;
      continue;
    }
    if ((enc & 0xf0) === 0xf0 && enc !== 0xff) {
      // 4-bit inline int: low nibble + 1
      out.push(String((enc & 0x0f) - 1));
      i += 1;
      continue;
    }
    /* istanbul ignore next */
    throw new RdbParseError(`Unknown ziplist encoding 0x${enc.toString(16)}`, i);
  }
}

// ---------------------------------------------------------------------------
// Low-level reader. Keeps a running cursor and throws on short-read.
// ---------------------------------------------------------------------------

class Reader {
  public offset: number = 0;
  constructor(private readonly buf: Buffer) {}

  expectMagic(): void {
    if (this.buf.length < 9) {
      throw new RdbParseError('input too short for RDB header', 0);
    }
    const magic = this.buf.subarray(0, 5).toString('ascii');
    if (magic !== 'REDIS') {
      throw new RdbParseError(`not an RDB file (magic=${JSON.stringify(magic)})`, 0);
    }
    const version = Number(this.buf.subarray(5, 9).toString('ascii'));
    if (!Number.isFinite(version) || version < 1 || version > 20) {
      throw new RdbParseError(`unsupported RDB version ${JSON.stringify(this.buf.subarray(5, 9).toString('ascii'))}`, 5);
    }
    this.offset = 9;
  }

  readByte(): number {
    if (this.offset >= this.buf.length) {
      throw new RdbParseError('unexpected EOF', this.offset);
    }
    return this.buf[this.offset++] as number;
  }

  skip(n: number): void {
    if (this.offset + n > this.buf.length) {
      throw new RdbParseError(`unexpected EOF (wanted ${n} bytes)`, this.offset);
    }
    this.offset += n;
  }

  /**
   * Decode an RDB length or a "special" encoding marker. For lengths,
   * returns the integer value. For special encodings (int/compressed
   * strings), throws — callers that need to handle those shapes go
   * through {@link readString}.
   */
  readLength(): number {
    const r = this.readLengthOrSpecial();
    if (r.special) {
      throw new RdbParseError(`expected length, got special 0x${r.value.toString(16)}`, this.offset - 1);
    }
    return r.value;
  }

  private readLengthOrSpecial(): { special: boolean; value: number } {
    const b = this.readByte();
    const type = (b & 0xc0) >> 6;
    if (type === 0) return { special: false, value: b & 0x3f };
    if (type === 1) return { special: false, value: ((b & 0x3f) << 8) | this.readByte() };
    if (type === 2) {
      if (b === 0x80) {
        return { special: false, value: this.readUInt32BE() };
      }
      /* istanbul ignore next */
      // 0x81 is 64-bit LE (RDB >=7) — we only care about sizes that fit in 32 bits.
      throw new RdbParseError(`64-bit length not supported`, this.offset - 1);
    }
    // type === 3 (special encoding)
    return { special: true, value: b & 0x3f };
  }

  private readUInt32BE(): number {
    const n = this.buf.readUInt32BE(this.offset);
    this.offset += 4;
    return n;
  }

  /** Read the next string, decoded as UTF-8 (which suffices for EtherCalc). */
  readString(): string {
    return this.readStringBuffer().toString('utf8');
  }

  /** Like {@link readString}, but returns the raw bytes. */
  readStringBuffer(): Buffer {
    const head = this.readLengthOrSpecial();
    if (!head.special) {
      const slice = this.buf.subarray(this.offset, this.offset + head.value);
      if (slice.length !== head.value) {
        throw new RdbParseError(`short read (wanted ${head.value})`, this.offset);
      }
      this.offset += head.value;
      return Buffer.from(slice);
    }
    switch (head.value) {
      case SPECIAL_INT8: {
        const v = this.buf.readInt8(this.offset);
        this.offset += 1;
        return Buffer.from(String(v), 'utf8');
      }
      case SPECIAL_INT16: {
        const v = this.buf.readInt16LE(this.offset);
        this.offset += 2;
        return Buffer.from(String(v), 'utf8');
      }
      case SPECIAL_INT32: {
        const v = this.buf.readInt32LE(this.offset);
        this.offset += 4;
        return Buffer.from(String(v), 'utf8');
      }
      case SPECIAL_LZF: {
        const clen = this.readLength();
        const ulen = this.readLength();
        const src = this.buf.subarray(this.offset, this.offset + clen);
        this.offset += clen;
        return lzfDecompress(src, ulen, this.offset);
      }
      /* istanbul ignore next */
      default:
        throw new RdbParseError(`unknown special encoding 0x${head.value.toString(16)}`, this.offset - 1);
    }
  }
}

// ---------------------------------------------------------------------------
// LZF decompression — algorithm from the Redis source. Tiny, standalone.
// Only runs when the legacy server was configured with
// `rdbcompression yes` (default) AND a string was >20 bytes AND got a
// good compression ratio. Tests exercise this path with a known fixture.
// ---------------------------------------------------------------------------

function lzfDecompress(src: Buffer, ulen: number, errOffset: number): Buffer {
  const out = Buffer.alloc(ulen);
  let ip = 0;
  let op = 0;
  while (ip < src.length) {
    const ctrl = src[ip++] as number;
    if (ctrl < 32) {
      // Literal run of `ctrl + 1` bytes.
      const n = ctrl + 1;
      src.copy(out, op, ip, ip + n);
      ip += n;
      op += n;
      continue;
    }
    // Back-reference.
    let len = ctrl >> 5;
    if (len === 7) len += src[ip++] as number;
    len += 2;
    const ref = op - (((ctrl & 0x1f) << 8) | (src[ip++] as number)) - 1;
    if (ref < 0) throw new RdbParseError('LZF back-reference underflow', errOffset);
    for (let i = 0; i < len; i++) out[op + i] = out[ref + i] as number;
    op += len;
  }
  if (op !== ulen) throw new RdbParseError(`LZF output length mismatch`, errOffset);
  return out;
}

// ---------------------------------------------------------------------------
// Writer — used by tests to build RDB fixtures deterministically. NOT a
// full-fidelity RDB encoder; it only emits the simple forms the parser
// needs to consume. Exported for the sibling test module.
// ---------------------------------------------------------------------------

/** Build a minimal valid RDB byte sequence from a {@link RedisDump}. */
export function encodeRdb(dump: RedisDump, opts: { version?: number } = {}): Buffer {
  const parts: Buffer[] = [];
  const ver = opts.version ?? 9;
  parts.push(Buffer.from(`REDIS${String(ver).padStart(4, '0')}`, 'ascii'));
  parts.push(Buffer.from([OP_SELECTDB, 0])); // DB 0
  for (const [k, v] of dump.strings) {
    parts.push(Buffer.from([TYPE_STRING]));
    parts.push(encodeString(k));
    parts.push(encodeString(v));
  }
  for (const [k, items] of dump.lists) {
    parts.push(Buffer.from([TYPE_LIST]));
    parts.push(encodeString(k));
    parts.push(encodeLength(items.length));
    for (const item of items) parts.push(encodeString(item));
  }
  for (const [k, fields] of dump.hashes) {
    parts.push(Buffer.from([TYPE_HASH]));
    parts.push(encodeString(k));
    parts.push(encodeLength(fields.size));
    for (const [f, v] of fields) {
      parts.push(encodeString(f));
      parts.push(encodeString(v));
    }
  }
  parts.push(Buffer.from([OP_EOF]));
  // Checksum suffix: 8 zero bytes. The parser ignores anything after EOF.
  parts.push(Buffer.alloc(8));
  return Buffer.concat(parts);
}

function encodeLength(n: number): Buffer {
  if (n < 64) return Buffer.from([n & 0x3f]);
  if (n < 16384) return Buffer.from([0x40 | ((n >> 8) & 0x3f), n & 0xff]);
  const out = Buffer.alloc(5);
  out[0] = 0x80;
  out.writeUInt32BE(n, 1);
  return out;
}

function encodeString(s: string): Buffer {
  const data = Buffer.from(s, 'utf8');
  return Buffer.concat([encodeLength(data.length), data]);
}
