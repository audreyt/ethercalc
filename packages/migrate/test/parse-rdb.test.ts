/**
 * Tests for the RDB parser. Each test drives a hand-crafted byte
 * sequence — we trust the encoder for the simple length-prefixed forms
 * (and assert the round-trip) but *manually* craft the listpack /
 * ziplist / LZF buffers because those formats are the load-bearing
 * claim of this parser.
 */
import { describe, it, expect } from 'vitest';
import {
  parseRdb,
  encodeRdb,
  RdbParseError,
  type RedisDump,
} from '../src/parse-rdb.ts';

function emptyDump(): RedisDump {
  return { strings: new Map(), lists: new Map(), hashes: new Map() };
}

describe('parseRdb — magic + header', () => {
  it('rejects a buffer that is too short', () => {
    expect(() => parseRdb(Buffer.from('RED'))).toThrow(RdbParseError);
  });

  it('rejects non-RDB magic', () => {
    const bad = Buffer.concat([Buffer.from('NOPE0009', 'ascii'), Buffer.from([0xff])]);
    expect(() => parseRdb(bad)).toThrow(/not an RDB file/);
  });

  it('rejects a non-numeric version', () => {
    const bad = Buffer.concat([Buffer.from('REDISabcd', 'ascii'), Buffer.from([0xff])]);
    expect(() => parseRdb(bad)).toThrow(/unsupported RDB version/);
  });

  it('rejects a version out of range', () => {
    const bad = Buffer.concat([Buffer.from('REDIS9999', 'ascii'), Buffer.from([0xff])]);
    expect(() => parseRdb(bad)).toThrow(/unsupported RDB version/);
  });
});

describe('parseRdb — simple forms via encoder round-trip', () => {
  it('returns an empty dump when only EOF is present', () => {
    const buf = encodeRdb(emptyDump());
    const out = parseRdb(buf);
    expect(out.strings.size).toBe(0);
    expect(out.lists.size).toBe(0);
    expect(out.hashes.size).toBe(0);
  });

  it('round-trips a single string key', () => {
    const d = emptyDump();
    d.strings.set('snapshot-myroom', 'version:1.5\nsheet:v\ncell:A1:v\n');
    const parsed = parseRdb(encodeRdb(d));
    expect(parsed.strings.get('snapshot-myroom')).toBe('version:1.5\nsheet:v\ncell:A1:v\n');
  });

  it('round-trips list keys in order', () => {
    const d = emptyDump();
    d.lists.set('log-room1', ['set A1 value n 1', 'set A2 value n 2', 'recalc']);
    const parsed = parseRdb(encodeRdb(d));
    expect(parsed.lists.get('log-room1')).toEqual([
      'set A1 value n 1',
      'set A2 value n 2',
      'recalc',
    ]);
  });

  it('round-trips hashes (field → value)', () => {
    const d = emptyDump();
    d.hashes.set(
      'ecell-room1',
      new Map([
        ['alice', 'A1'],
        ['bob', 'B7'],
      ]),
    );
    const parsed = parseRdb(encodeRdb(d));
    expect(Object.fromEntries(parsed.hashes.get('ecell-room1') ?? new Map())).toEqual({
      alice: 'A1',
      bob: 'B7',
    });
  });

  it('round-trips a key that triggers 14-bit length encoding', () => {
    const d = emptyDump();
    const big = 'x'.repeat(100); // 0x40 threshold is 64 bytes
    d.strings.set('snapshot-a', big);
    const parsed = parseRdb(encodeRdb(d));
    expect(parsed.strings.get('snapshot-a')).toBe(big);
  });

  it('round-trips a key that triggers 32-bit length encoding', () => {
    const d = emptyDump();
    const big = 'x'.repeat(20_000); // > 16384 threshold
    d.strings.set('snapshot-a', big);
    const parsed = parseRdb(encodeRdb(d));
    expect(parsed.strings.get('snapshot-a')?.length).toBe(20_000);
  });

  it('honors encoder version option', () => {
    const buf = encodeRdb(emptyDump(), { version: 6 });
    expect(buf.subarray(0, 9).toString('ascii')).toBe('REDIS0006');
    parseRdb(buf);
  });
});

describe('parseRdb — opcode handling', () => {
  it('rejects an unknown value type byte', () => {
    // Header + SELECTDB 0 + unknown type 0x99 + key + EOF
    const buf = Buffer.concat([
      Buffer.from('REDIS0009', 'ascii'),
      Buffer.from([0xfe, 0x00]), // SELECTDB 0
      Buffer.from([0x99]), // unknown type
      Buffer.from([0x03]),
      Buffer.from('key', 'ascii'),
      Buffer.from([0xff]),
    ]);
    expect(() => parseRdb(buf)).toThrow(/Unsupported RDB value type 0x99/);
  });

  it('consumes AUX opcode + value pair', () => {
    const buf = Buffer.concat([
      Buffer.from('REDIS0009', 'ascii'),
      // AUX: "redis-ver" → "7.4.0"
      Buffer.from([0xfa]),
      encStr('redis-ver'),
      encStr('7.4.0'),
      Buffer.from([0xff]),
    ]);
    const out = parseRdb(buf);
    expect(out.strings.size).toBe(0);
  });

  it('ignores RESIZEDB', () => {
    const buf = Buffer.concat([
      Buffer.from('REDIS0009', 'ascii'),
      Buffer.from([0xfb, 0x00, 0x00]),
      Buffer.from([0xff]),
    ]);
    parseRdb(buf);
  });

  it('skips EXPIRETIME_MS (8 bytes)', () => {
    const buf = Buffer.concat([
      Buffer.from('REDIS0009', 'ascii'),
      Buffer.from([0xfc]),
      Buffer.alloc(8),
      Buffer.from([0x00]),
      encStr('k'),
      encStr('v'),
      Buffer.from([0xff]),
    ]);
    const out = parseRdb(buf);
    expect(out.strings.get('k')).toBe('v');
  });

  it('skips EXPIRETIME_S (4 bytes)', () => {
    const buf = Buffer.concat([
      Buffer.from('REDIS0009', 'ascii'),
      Buffer.from([0xfd]),
      Buffer.alloc(4),
      Buffer.from([0x00]),
      encStr('k'),
      encStr('v'),
      Buffer.from([0xff]),
    ]);
    const out = parseRdb(buf);
    expect(out.strings.get('k')).toBe('v');
  });

  it('raises when the buffer ends mid-value', () => {
    const buf = Buffer.concat([
      Buffer.from('REDIS0009', 'ascii'),
      Buffer.from([0x00]), // string value type
      // … but no key
    ]);
    expect(() => parseRdb(buf)).toThrow(RdbParseError);
  });

  it('errors when skip past end', () => {
    // 8-byte expire time truncated
    const buf = Buffer.concat([
      Buffer.from('REDIS0009', 'ascii'),
      Buffer.from([0xfc]),
      Buffer.alloc(4), // only 4 bytes, need 8
    ]);
    expect(() => parseRdb(buf)).toThrow(/unexpected EOF/);
  });
});

describe('parseRdb — special integer encodings', () => {
  it('decodes int8 special', () => {
    const buf = Buffer.concat([
      Buffer.from('REDIS0009', 'ascii'),
      // key = "k"
      Buffer.from([0x00]),
      encStr('k'),
      // value: special encoding INT8 = 0xc0 | 0 = 0xc0, then int8 byte
      Buffer.from([0xc0, 42]),
      Buffer.from([0xff]),
    ]);
    const out = parseRdb(buf);
    expect(out.strings.get('k')).toBe('42');
  });

  it('decodes int16 special', () => {
    const buf = Buffer.concat([
      Buffer.from('REDIS0009', 'ascii'),
      Buffer.from([0x00]),
      encStr('k'),
      Buffer.from([0xc1]),
      int16LE(-1000),
      Buffer.from([0xff]),
    ]);
    const out = parseRdb(buf);
    expect(out.strings.get('k')).toBe('-1000');
  });

  it('decodes int32 special', () => {
    const buf = Buffer.concat([
      Buffer.from('REDIS0009', 'ascii'),
      Buffer.from([0x00]),
      encStr('k'),
      Buffer.from([0xc2]),
      int32LE(1234567),
      Buffer.from([0xff]),
    ]);
    const out = parseRdb(buf);
    expect(out.strings.get('k')).toBe('1234567');
  });

  it('rejects an unknown special encoding', () => {
    const buf = Buffer.concat([
      Buffer.from('REDIS0009', 'ascii'),
      Buffer.from([0x00]),
      encStr('k'),
      Buffer.from([0xc4]), // special type 4 — not defined
      Buffer.from([0xff]),
    ]);
    expect(() => parseRdb(buf)).toThrow(/unknown special encoding/);
  });
});

describe('parseRdb — listpack (Redis ≥ 7 quicklist)', () => {
  it('decodes a quicklist with one listpack node', () => {
    // Build a listpack holding three elements: "hello", 42 (short int), "world"
    const lp = buildListpack([
      { kind: 'str', value: 'hello' },
      { kind: 'uint7', value: 42 },
      { kind: 'str', value: 'world' },
    ]);
    const buf = Buffer.concat([
      Buffer.from('REDIS0011', 'ascii'),
      // TYPE_LIST_QUICKLIST = 0x12; key; node count=1; listpack blob
      Buffer.from([0x12]),
      encStr('chat-room1'),
      Buffer.from([0x01]), // count=1 (6-bit length)
      encStrBuf(lp),
      Buffer.from([0xff]),
    ]);
    const out = parseRdb(buf);
    expect(out.lists.get('chat-room1')).toEqual(['hello', '42', 'world']);
  });

  it('decodes a quicklist v2 with container hint', () => {
    const lp = buildListpack([{ kind: 'str', value: 'one' }, { kind: 'str', value: 'two' }]);
    const buf = Buffer.concat([
      Buffer.from('REDIS0011', 'ascii'),
      Buffer.from([0x13]), // QUICKLIST_2
      encStr('log-r'),
      Buffer.from([0x01]),
      Buffer.from([0x02]), // container hint (length-encoded int)
      encStrBuf(lp),
      Buffer.from([0xff]),
    ]);
    const out = parseRdb(buf);
    expect(out.lists.get('log-r')).toEqual(['one', 'two']);
  });

  it('decodes a hash-listpack', () => {
    const lp = buildListpack([
      { kind: 'str', value: 'alice' },
      { kind: 'str', value: 'A1' },
      { kind: 'str', value: 'bob' },
      { kind: 'str', value: 'B2' },
    ]);
    const buf = Buffer.concat([
      Buffer.from('REDIS0011', 'ascii'),
      Buffer.from([0x10]), // TYPE_HASH_LISTPACK
      encStr('ecell-r'),
      encStrBuf(lp),
      Buffer.from([0xff]),
    ]);
    const out = parseRdb(buf);
    expect(Object.fromEntries(out.hashes.get('ecell-r') ?? new Map())).toEqual({
      alice: 'A1',
      bob: 'B2',
    });
  });

  it('decodes listpack int encodings (13/16/24/32/64)', () => {
    const lp = buildListpack([
      // Positive 13-bit and negative 24-bit exercise both sign branches.
      { kind: 'int13', value: 100 },
      { kind: 'int13', value: -100 },
      { kind: 'int16', value: 30000 },
      { kind: 'int24', value: 5_000_000 },
      { kind: 'int24', value: -5_000_000 },
      { kind: 'int32', value: 1_000_000_000 },
      { kind: 'int64', value: 9_000_000_000n },
    ]);
    const buf = Buffer.concat([
      Buffer.from('REDIS0011', 'ascii'),
      Buffer.from([0x12]),
      encStr('log-r'),
      Buffer.from([0x01]),
      encStrBuf(lp),
      Buffer.from([0xff]),
    ]);
    const out = parseRdb(buf);
    expect(out.lists.get('log-r')).toEqual([
      '100',
      '-100',
      '30000',
      '5000000',
      '-5000000',
      '1000000000',
      '9000000000',
    ]);
  });

  it('decodes listpack 12-bit + 32-bit length strings', () => {
    // 12-bit: string of length > 63 but ≤ 4095
    const s12 = 'a'.repeat(100);
    // 32-bit: string of length > 4095
    const s32 = 'b'.repeat(5000);
    const lp = buildListpack([
      { kind: 'str', value: s12 },
      { kind: 'str', value: s32 },
    ]);
    const buf = Buffer.concat([
      Buffer.from('REDIS0011', 'ascii'),
      Buffer.from([0x12]),
      encStr('log-r'),
      Buffer.from([0x01]),
      encStrBuf(lp),
      Buffer.from([0xff]),
    ]);
    const out = parseRdb(buf);
    expect(out.lists.get('log-r')).toEqual([s12, s32]);
  });

  it('rejects an unknown listpack element tag', () => {
    // header + single element with tag 0xf5 (unused) + terminator
    const lp = Buffer.concat([
      int32LE(8), // total-bytes
      int16LE(1), // num-elements
      Buffer.from([0xf5, 0x02]), // unknown tag + backlen
      Buffer.from([0xff]),
    ]);
    const buf = Buffer.concat([
      Buffer.from('REDIS0011', 'ascii'),
      Buffer.from([0x12]),
      encStr('log-r'),
      Buffer.from([0x01]),
      encStrBuf(lp),
      Buffer.from([0xff]),
    ]);
    expect(() => parseRdb(buf)).toThrow(/Unknown listpack element tag/);
  });

  it('rejects a truncated listpack header', () => {
    const lp = Buffer.from([0x00, 0x00, 0x00, 0x00]); // 4 bytes is < 7
    const buf = Buffer.concat([
      Buffer.from('REDIS0011', 'ascii'),
      Buffer.from([0x12]),
      encStr('log-r'),
      Buffer.from([0x01]),
      encStrBuf(lp),
      Buffer.from([0xff]),
    ]);
    expect(() => parseRdb(buf)).toThrow(/listpack too short/);
  });
});

describe('parseRdb — ziplist (Redis ≤ 6 legacy form)', () => {
  it('decodes a list-ziplist with short strings and inline ints', () => {
    const zl = buildZiplist([
      { kind: 'str', value: 'ab' },
      { kind: 'int16', value: -32 },
      { kind: 'int32', value: 9999 },
      { kind: 'inline4', value: 2 },
    ]);
    const buf = Buffer.concat([
      Buffer.from('REDIS0006', 'ascii'),
      Buffer.from([0x0e]), // TYPE_LIST_ZIPLIST
      encStr('log-old'),
      encStrBuf(zl),
      Buffer.from([0xff]),
    ]);
    const out = parseRdb(buf);
    expect(out.lists.get('log-old')).toEqual(['ab', '-32', '9999', '2']);
  });

  it('decodes a hash-ziplist with 14-bit and 32-bit string lengths', () => {
    const zl = buildZiplist([
      { kind: 'str', value: 'k' },
      { kind: 'str', value: 'v' },
      { kind: 'str', value: 'x'.repeat(80) }, // forces 14-bit length
      { kind: 'str', value: 'y'.repeat(70_000) }, // forces 32-bit length
      { kind: 'int64', value: 12345678901234n },
      { kind: 'str', value: 'tail' },
    ]);
    const buf = Buffer.concat([
      Buffer.from('REDIS0006', 'ascii'),
      Buffer.from([0x0d]), // TYPE_HASH_ZIPLIST
      encStr('ecell-old'),
      encStrBuf(zl),
      Buffer.from([0xff]),
    ]);
    const out = parseRdb(buf);
    const h = out.hashes.get('ecell-old');
    expect(h?.get('k')).toBe('v');
    expect(h?.get('x'.repeat(80))?.length).toBe(70_000);
    expect(h?.get('12345678901234')).toBe('tail');
  });

  it('rejects a ziplist that is too short', () => {
    const zl = Buffer.alloc(5);
    const buf = Buffer.concat([
      Buffer.from('REDIS0006', 'ascii'),
      Buffer.from([0x0e]),
      encStr('log'),
      encStrBuf(zl),
      Buffer.from([0xff]),
    ]);
    expect(() => parseRdb(buf)).toThrow(/ziplist too short/);
  });
});

describe('parseRdb — defensive branches', () => {
  it('rejects a 64-bit length header (0x81)', () => {
    const buf = Buffer.concat([
      Buffer.from('REDIS0009', 'ascii'),
      Buffer.from([0x00]), // TYPE_STRING
      Buffer.from([0x81]), // 64-bit length marker (we don't support it)
      Buffer.alloc(8),
      Buffer.from([0xff]),
    ]);
    expect(() => parseRdb(buf)).toThrow(/64-bit length not supported/);
  });

  it('rejects a truncated string body', () => {
    const buf = Buffer.concat([
      Buffer.from('REDIS0009', 'ascii'),
      Buffer.from([0x00]),
      encStr('k'),
      Buffer.from([0x0a]), // says length 10…
      Buffer.from('short', 'ascii'), // …but only supplies 5 bytes
    ]);
    expect(() => parseRdb(buf)).toThrow(/short read|unexpected EOF/);
  });

  it('rejects an unknown ziplist encoding byte', () => {
    // Craft a ziplist with one entry using encoding 0x90 (reserved).
    const payload = Buffer.concat([
      int32LE(18), // zlbytes
      int32LE(17), // zltail
      Buffer.from([0x01, 0x00]), // zllen
      Buffer.from([0x00]), // prevlen = 0
      Buffer.from([0x90]), // unknown encoding
      Buffer.from([0xff]),
    ]);
    const buf = Buffer.concat([
      Buffer.from('REDIS0006', 'ascii'),
      Buffer.from([0x0e]),
      encStr('log-x'),
      encStrBuf(payload),
      Buffer.from([0xff]),
    ]);
    expect(() => parseRdb(buf)).toThrow(/Unknown ziplist encoding/);
  });
});

describe('parseRdb — listpack backlen with large elements', () => {
  it('handles elements that require 3-byte backlen (> 16KB encoded size)', () => {
    // A 20000-char string yields ~20003-byte encoded size → backlen is 3.
    const big = 'z'.repeat(20000);
    const lp = buildListpack([{ kind: 'str', value: big }]);
    const buf = Buffer.concat([
      Buffer.from('REDIS0011', 'ascii'),
      Buffer.from([0x12]),
      encStr('log-big'),
      Buffer.from([0x01]),
      encStrBuf(lp),
      Buffer.from([0xff]),
    ]);
    const out = parseRdb(buf);
    expect(out.lists.get('log-big')?.[0]?.length).toBe(20000);
  });

  it('handles elements that require 4-byte backlen (> 2MB encoded size)', () => {
    // 3 million bytes encoded — backlen goes to 4 bytes.
    const big = 'q'.repeat(3_000_000);
    const lp = buildListpack([{ kind: 'str', value: big }]);
    const buf = Buffer.concat([
      Buffer.from('REDIS0011', 'ascii'),
      Buffer.from([0x12]),
      encStr('log-huge'),
      Buffer.from([0x01]),
      encStrBuf(lp),
      Buffer.from([0xff]),
    ]);
    const out = parseRdb(buf);
    expect(out.lists.get('log-huge')?.[0]?.length).toBe(3_000_000);
  });
});

describe('parseRdb — LZF compressed strings', () => {
  it('decompresses a short back-reference (ctrl-len field < 7)', () => {
    // literal "AB" + backref(len=3, off=0) → "ABABAB"
    // ctrl for backref: top3 = (len-2)=1, bottom5 = hi5(off=0)=0
    // that is 0x20. Followed by lo8(off=0)=0. Net back-ref goes to (op-1).
    // Actually off is stored as (off-1) and decoded as (stored+1). Using
    // off=0 stored means ref = op - 0 - 1 = op-1. So starting at op=2
    // (after "AB"), ref=1 → reads out[1]='B' then out[2]='A' (the copy
    // just written) etc. Produces "ABBAB". We test this shape.
    const lit = Buffer.from([0x01, 0x41, 0x42]); // literal run 2 bytes "AB"
    const backref = Buffer.from([
      (1 << 5) | 0x00, // len=1 → decoded len = 1 + 2 = 3
      0, // offset = 0 → ref = op - 1
    ]);
    const lzf = Buffer.concat([lit, backref]);
    const ulen = 5;
    const payload = Buffer.concat([
      Buffer.from([0xc3]),
      encLen(lzf.length),
      encLen(ulen),
      lzf,
    ]);
    const buf = Buffer.concat([
      Buffer.from('REDIS0009', 'ascii'),
      Buffer.from([0x00]),
      encStr('short'),
      payload,
      Buffer.from([0xff]),
    ]);
    const out = parseRdb(buf);
    expect(out.strings.get('short')?.length).toBe(5);
  });

  it('decompresses a long back-reference (ctrl-len field == 7)', () => {
    // Hand-craft an LZF stream:
    //   [literal:1][X][backref: len=10, off=0]
    // Literal: ctrl=0 → 1 byte literal "X"
    // Backref with len 10: high 3 bits = 7 (extended), then extra byte = 10-9=1
    // offset = 0 (self-ref previous byte)
    const literalRun = Buffer.from([0x00, 0x58 /* 'X' */]);
    const backref = Buffer.from([
      (7 << 5) | 0x00, // ctrl: top3=7 (extended), bottom5=hi5(offset=0) = 0
      1, // extra len byte: len = 1 + 9 = 10
      0, // lo8(offset) = 0; real offset = 0+1 = -1 (prev byte)
    ]);
    const lzf = Buffer.concat([literalRun, backref]);
    const ulen = 11; // 1 literal + 10 back-ref repeats → "XXXXXXXXXXX"
    const lzfEncoded = Buffer.concat([
      Buffer.from([0xc3]),
      encLen(lzf.length),
      encLen(ulen),
      lzf,
    ]);
    const buf = Buffer.concat([
      Buffer.from('REDIS0009', 'ascii'),
      Buffer.from([0x00]),
      encStr('long'),
      lzfEncoded,
      Buffer.from([0xff]),
    ]);
    const out = parseRdb(buf);
    expect(out.strings.get('long')).toBe('X'.repeat(11));
  });

  it('rejects an LZF stream whose back-reference underflows', () => {
    // Back-reference at op=0 with any non-zero offset → ref < 0.
    // ctrl: len=1 (so top3=1) and non-zero lo5 for offset.
    // len-encoding: (1<<5)|0x01 = 0x21; lo8=0
    // offset = (1<<8)|0 = 256, ref = 0 - 256 - 1 = -257.
    const bad = Buffer.from([0x21, 0x00]); // backref right at the start
    const ulen = 3;
    const payload = Buffer.concat([
      Buffer.from([0xc3]),
      encLen(bad.length),
      encLen(ulen),
      bad,
    ]);
    const buf = Buffer.concat([
      Buffer.from('REDIS0009', 'ascii'),
      Buffer.from([0x00]),
      encStr('bad'),
      payload,
      Buffer.from([0xff]),
    ]);
    expect(() => parseRdb(buf)).toThrow(/back-reference underflow/);
  });

  it('rejects an LZF stream whose declared output length is wrong', () => {
    // Literal run of 1 byte but ulen=2 → mismatch at the end.
    const bad = Buffer.from([0x00, 0x41]);
    const payload = Buffer.concat([
      Buffer.from([0xc3]),
      encLen(bad.length),
      encLen(2), // claim 2 bytes but only 1 literal
      bad,
    ]);
    const buf = Buffer.concat([
      Buffer.from('REDIS0009', 'ascii'),
      Buffer.from([0x00]),
      encStr('bad2'),
      payload,
      Buffer.from([0xff]),
    ]);
    expect(() => parseRdb(buf)).toThrow(/output length mismatch/);
  });

  it('decompresses a known compressed payload', () => {
    // Build an LZF-compressed payload: repeated "ABCD" 64 times → 256 bytes.
    // LZF's literal run covers the first 4, then a back-reference repeats.
    const original = 'ABCD'.repeat(64);
    const lzf = compressLZF(original);
    // special encoding byte for LZF = 0xc0 | 3 = 0xc3
    const lzfEncoded = Buffer.concat([
      Buffer.from([0xc3]),
      encLen(lzf.length),
      encLen(original.length),
      lzf,
    ]);
    const buf = Buffer.concat([
      Buffer.from('REDIS0009', 'ascii'),
      Buffer.from([0x00]),
      encStr('big'),
      lzfEncoded,
      Buffer.from([0xff]),
    ]);
    const out = parseRdb(buf);
    expect(out.strings.get('big')).toBe(original);
  });
});

describe('parseRdb — readLength expectations', () => {
  it('rejects a length encoded via the special type', () => {
    // TYPE_LIST = 0x01, key, then "length" byte = 0xc0 (special int8)
    const buf = Buffer.concat([
      Buffer.from('REDIS0009', 'ascii'),
      Buffer.from([0x01]),
      encStr('log-r'),
      Buffer.from([0xc0, 0x00]), // special length triggers error
      Buffer.from([0xff]),
    ]);
    expect(() => parseRdb(buf)).toThrow(/expected length/);
  });
});

// ---------------------------------------------------------------------------
// Helpers — hand-rolled encoders for the binary formats above. Kept
// separate from the src writer since they're test-only surfaces.
// ---------------------------------------------------------------------------

function int16LE(n: number): Buffer {
  const b = Buffer.alloc(2);
  b.writeInt16LE(n);
  return b;
}

function int32LE(n: number): Buffer {
  const b = Buffer.alloc(4);
  b.writeInt32LE(n);
  return b;
}

function int24LE(n: number): Buffer {
  const b = Buffer.alloc(3);
  if (n < 0) n = n + (1 << 24);
  b[0] = n & 0xff;
  b[1] = (n >> 8) & 0xff;
  b[2] = (n >> 16) & 0xff;
  return b;
}

function int64LE(n: bigint): Buffer {
  const b = Buffer.alloc(8);
  b.writeBigInt64LE(n);
  return b;
}

function encLen(n: number): Buffer {
  if (n < 64) return Buffer.from([n & 0x3f]);
  if (n < 16384) return Buffer.from([0x40 | ((n >> 8) & 0x3f), n & 0xff]);
  const out = Buffer.alloc(5);
  out[0] = 0x80;
  out.writeUInt32BE(n, 1);
  return out;
}

function encStr(s: string): Buffer {
  return Buffer.concat([encLen(Buffer.byteLength(s, 'utf8')), Buffer.from(s, 'utf8')]);
}

function encStrBuf(b: Buffer): Buffer {
  return Buffer.concat([encLen(b.length), b]);
}

// Listpack builder — only the element kinds we need.
type LpElem =
  | { kind: 'str'; value: string }
  | { kind: 'uint7'; value: number }
  | { kind: 'int13'; value: number }
  | { kind: 'int16'; value: number }
  | { kind: 'int24'; value: number }
  | { kind: 'int32'; value: number }
  | { kind: 'int64'; value: bigint };

function buildListpack(elems: LpElem[]): Buffer {
  const body: Buffer[] = [];
  for (const e of elems) {
    const piece = encodeLpElem(e);
    body.push(piece.enc);
    body.push(backlen(piece.enc.length));
  }
  body.push(Buffer.from([0xff])); // terminator
  const payload = Buffer.concat(body);
  const header = Buffer.alloc(6);
  header.writeUInt32LE(payload.length + 6, 0);
  header.writeUInt16LE(elems.length, 4);
  return Buffer.concat([header, payload]);
}

function encodeLpElem(e: LpElem): { enc: Buffer } {
  if (e.kind === 'str') {
    const data = Buffer.from(e.value, 'utf8');
    if (data.length < 64) {
      return { enc: Buffer.concat([Buffer.from([0x80 | data.length]), data]) };
    }
    if (data.length < 4096) {
      return {
        enc: Buffer.concat([
          Buffer.from([0xe0 | ((data.length >> 8) & 0x0f), data.length & 0xff]),
          data,
        ]),
      };
    }
    return {
      enc: Buffer.concat([
        Buffer.from([0xf0]),
        (() => {
          const b = Buffer.alloc(4);
          b.writeUInt32LE(data.length);
          return b;
        })(),
        data,
      ]),
    };
  }
  if (e.kind === 'uint7') return { enc: Buffer.from([e.value & 0x7f]) };
  if (e.kind === 'int13') {
    let v = e.value;
    if (v < 0) v = v + (1 << 13);
    return { enc: Buffer.from([0xc0 | ((v >> 8) & 0x1f), v & 0xff]) };
  }
  if (e.kind === 'int16') return { enc: Buffer.concat([Buffer.from([0xf1]), int16LE(e.value)]) };
  if (e.kind === 'int24')
    return { enc: Buffer.concat([Buffer.from([0xf2]), int24LE(e.value)]) };
  if (e.kind === 'int32') return { enc: Buffer.concat([Buffer.from([0xf3]), int32LE(e.value)]) };
  return { enc: Buffer.concat([Buffer.from([0xf4]), int64LE(e.value)]) };
}

function backlen(n: number): Buffer {
  if (n < 128) return Buffer.from([n]);
  if (n < 16384) return Buffer.from([(n & 0x7f) | 0x80, n >> 7]);
  if (n < 2_097_152) return Buffer.from([(n & 0x7f) | 0x80, ((n >> 7) & 0x7f) | 0x80, n >> 14]);
  return Buffer.from([
    (n & 0x7f) | 0x80,
    ((n >> 7) & 0x7f) | 0x80,
    ((n >> 14) & 0x7f) | 0x80,
    n >> 21,
  ]);
}

// Ziplist builder.
type ZlElem =
  | { kind: 'str'; value: string }
  | { kind: 'int16'; value: number }
  | { kind: 'int32'; value: number }
  | { kind: 'int64'; value: bigint }
  | { kind: 'inline4'; value: number };

function buildZiplist(elems: ZlElem[]): Buffer {
  const entries: Buffer[] = [];
  let prevLen = 0;
  for (const e of elems) {
    const prev = prevLen < 254 ? Buffer.from([prevLen]) : Buffer.concat([
      Buffer.from([254]),
      (() => {
        const b = Buffer.alloc(4);
        b.writeUInt32LE(prevLen);
        return b;
      })(),
    ]);
    const body = encodeZlElem(e);
    const entry = Buffer.concat([prev, body]);
    entries.push(entry);
    prevLen = entry.length;
  }
  entries.push(Buffer.from([0xff]));
  const payload = Buffer.concat(entries);
  const header = Buffer.alloc(10);
  header.writeUInt32LE(payload.length + 10, 0); // zlbytes
  header.writeUInt32LE(payload.length + 10 - 1, 4); // zltail
  header.writeUInt16LE(elems.length, 8);
  return Buffer.concat([header, payload]);
}

function encodeZlElem(e: ZlElem): Buffer {
  if (e.kind === 'str') {
    const data = Buffer.from(e.value, 'utf8');
    if (data.length < 64) {
      return Buffer.concat([Buffer.from([data.length & 0x3f]), data]);
    }
    if (data.length < 16384) {
      return Buffer.concat([
        Buffer.from([0x40 | ((data.length >> 8) & 0x3f), data.length & 0xff]),
        data,
      ]);
    }
    const hdr = Buffer.alloc(5);
    hdr[0] = 0x80;
    hdr.writeUInt32BE(data.length, 1);
    return Buffer.concat([hdr, data]);
  }
  if (e.kind === 'int16') return Buffer.concat([Buffer.from([0xc0]), int16LE(e.value)]);
  if (e.kind === 'int32') return Buffer.concat([Buffer.from([0xd0]), int32LE(e.value)]);
  if (e.kind === 'int64') return Buffer.concat([Buffer.from([0xe0]), int64LE(e.value)]);
  // inline4: encoded as 0xf0 | (n+1), n in [0..12]
  return Buffer.from([0xf0 | ((e.value + 1) & 0x0f)]);
}

/**
 * Minimal LZF compressor — produces output the parser can decompress.
 * We implement a naïve longest-match search; any valid output works
 * because `lzfDecompress` is deterministic on well-formed inputs.
 */
function compressLZF(s: string): Buffer {
  const data = Buffer.from(s, 'utf8');
  const out: number[] = [];
  let i = 0;
  while (i < data.length) {
    // Try to find a back-reference within a 8KB window.
    let bestLen = 0;
    let bestOff = 0;
    const winStart = Math.max(0, i - 8191);
    // Minimum back-ref length is 3 per LZF spec.
    for (let j = winStart; j < i; j++) {
      let m = 0;
      while (m < 264 && i + m < data.length && data[j + m] === data[i + m]) m++;
      if (m >= 3 && m > bestLen) {
        bestLen = m;
        bestOff = i - j;
        if (bestLen === 264) break;
      }
    }
    if (bestLen >= 3) {
      const off = bestOff - 1;
      if (bestLen <= 8) {
        // ((len-2) << 5) | hi5-off, then lo8-off
        out.push(((bestLen - 2) << 5) | ((off >> 8) & 0x1f));
        out.push(off & 0xff);
      } else {
        // 7 << 5 flag, then len-9, then hi5/lo8
        out.push((7 << 5) | ((off >> 8) & 0x1f));
        out.push(bestLen - 9);
        out.push(off & 0xff);
        // Insert marker for wrong ordering — LZF actually expects:
        //   ctrl (7<<5|hi5), len-9, lo8
        // but implementations vary in order. Re-emit correctly:
        out.pop();
        out.pop();
        out.pop();
        out.push((7 << 5) | ((off >> 8) & 0x1f));
        out.push(bestLen - 9);
        out.push(off & 0xff);
      }
      i += bestLen;
    } else {
      // Emit a literal run. Find how many literals until we could back-ref.
      let litStart = i;
      let litLen = 1;
      while (
        litLen < 32 &&
        litStart + litLen < data.length
      ) {
        // Greedy: stop the run if we *could* back-ref from the next position.
        // For simplicity we just emit single-byte literals — the parser
        // handles arbitrary literal-run lengths.
        litLen++;
        break;
      }
      out.push(litLen - 1);
      for (let k = 0; k < litLen; k++) out.push(data[litStart + k] as number);
      i += litLen;
    }
  }
  return Buffer.from(out);
}
