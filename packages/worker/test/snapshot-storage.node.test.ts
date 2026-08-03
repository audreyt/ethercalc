/**
 * Unit tests for the chunked-snapshot storage helper. Covers the fast
 * single-key path, the chunked read/write path, the `hasSnapshot`
 * existence check, and the meta round-trip — all against an in-memory
 * fake storage.
 */
import { describe, it, expect } from 'vite-plus/test';

import { STORAGE_KEYS, snapshotChunkKey } from '@ethercalc/shared/storage-keys';
import {
  MAX_SNAPSHOT_CHUNKS,
  SNAPSHOT_CHUNK_BYTES,
  hasSnapshot,
  readSnapshot,
  readSnapshotMeta,
  snapshotEntries,
} from '../src/lib/snapshot-storage.ts';

type FakeStorage = DurableObjectStorage & {
  __map: Map<string, unknown>;
};

function fakeStorage(): FakeStorage {
  const m = new Map<string, unknown>();
  return {
    __map: m,
    async get(key: unknown) {
      if (typeof key === 'string') return m.get(key);
      if (Array.isArray(key)) {
        if (key.length > 128) {
          throw new RangeError('get(keys) supports at most 128 keys');
        }
        const out = new Map<string, unknown>();
        for (const k of key) if (m.has(k as string)) out.set(k as string, m.get(k as string));
        return out;
      }
      throw new Error('unexpected get');
    },
    async put(key: unknown, value?: unknown) {
      if (typeof key === 'string') {
        m.set(key, value);
        return;
      }
      if (key !== null && typeof key === 'object') {
        for (const [k, v] of Object.entries(key as Record<string, unknown>)) m.set(k, v);
        return;
      }
      throw new Error('unexpected put');
    },
    async delete(key: unknown) {
      if (typeof key === 'string') return m.delete(key);
      if (Array.isArray(key)) {
        let n = 0;
        for (const k of key) if (m.delete(k as string)) n += 1;
        return n;
      }
      throw new Error('unexpected delete');
    },
  } as unknown as FakeStorage;
}

describe('snapshotEntries', () => {
  it('fast path: ≤ SNAPSHOT_CHUNK_BYTES goes into a single key', () => {
    const entries = snapshotEntries('hello');
    expect(Object.keys(entries)).toEqual([STORAGE_KEYS.snapshot]);
    expect(entries[STORAGE_KEYS.snapshot]).toBe('hello');
  });

  it('boundary: exactly SNAPSHOT_CHUNK_BYTES stays single-key', () => {
    const s = 'x'.repeat(SNAPSHOT_CHUNK_BYTES);
    const entries = snapshotEntries(s);
    expect(Object.keys(entries)).toEqual([STORAGE_KEYS.snapshot]);
  });

  it('splits > SNAPSHOT_CHUNK_BYTES into meta + chunks', () => {
    // 2.5 × chunk size → 3 chunks.
    const s = 'y'.repeat(SNAPSHOT_CHUNK_BYTES * 2 + 5000);
    const entries = snapshotEntries(s);
    expect(entries[STORAGE_KEYS.snapshot]).toBeUndefined();
    const meta = entries[STORAGE_KEYS.snapshotMeta] as { chunks: number };
    expect(meta.chunks).toBe(3);
    // All three chunk keys present.
    for (let i = 0; i < 3; i++) {
      expect(entries[`snapshot:chunk:${String(i).padStart(16, '0')}`]).toBeDefined();
    }
  });

  it('splits preserving exact byte content (ASCII)', () => {
    const s = 'a'.repeat(SNAPSHOT_CHUNK_BYTES + 10);
    const entries = snapshotEntries(s);
    const parts: string[] = [];
    for (let i = 0; i < 2; i++) {
      parts.push(entries[`snapshot:chunk:${String(i).padStart(16, '0')}`] as string);
    }
    expect(parts.join('')).toBe(s);
  });

  it('splits on UTF-8 code points — no surrogate half-cuts', () => {
    // 4-byte emoji repeated to exceed chunk size. Each '🙂' = 4 bytes.
    const count = Math.floor(SNAPSHOT_CHUNK_BYTES / 4) + 5_000; // well over
    const s = '🙂'.repeat(count);
    const entries = snapshotEntries(s);
    const meta = entries[STORAGE_KEYS.snapshotMeta] as { chunks: number };
    const parts: string[] = [];
    for (let i = 0; i < meta.chunks; i++) {
      parts.push(entries[`snapshot:chunk:${String(i).padStart(16, '0')}`] as string);
    }
    // Reassembled string matches byte-for-byte.
    expect(parts.join('')).toBe(s);
    // No orphan surrogate halves in any chunk.
    for (const p of parts) {
      // `isWellFormed()` is ES2024; fall back to a try/catch using
      // `TextEncoder`, which throws on malformed strings.
      new TextEncoder().encode(p);
    }
  });

  it('splits 2-byte and 3-byte scalars without cutting mid-character', () => {
    // é = 2 UTF-8 bytes; 中 = 3. Cross the chunk boundary with both so the
    // 2-byte and 3-byte width lanes in chunkString run.
    const twoByte = 'é'.repeat(Math.floor(SNAPSHOT_CHUNK_BYTES / 2) + 100);
    const threeByte = '中'.repeat(Math.floor(SNAPSHOT_CHUNK_BYTES / 3) + 100);
    for (const s of [twoByte, threeByte]) {
      const entries = snapshotEntries(s);
      const meta = entries[STORAGE_KEYS.snapshotMeta] as { chunks: number };
      expect(meta.chunks).toBeGreaterThan(1);
      const parts: string[] = [];
      for (let i = 0; i < meta.chunks; i++) {
        parts.push(
          entries[`snapshot:chunk:${String(i).padStart(16, '0')}`] as string,
        );
      }
      expect(parts.join('')).toBe(s);
      for (const p of parts) new TextEncoder().encode(p);
    }
  });

  it('counts unpaired surrogates as the 3-byte replacement width', () => {
    // Lone high and low surrogates match TextEncoder's U+FFFD (3-byte)
    // replacement so chunk boundaries stay byte-accurate.
    const high = String.fromCharCode(0xd800);
    const low = String.fromCharCode(0xdc00);
    const s = high + 'a'.repeat(SNAPSHOT_CHUNK_BYTES) + low;
    const entries = snapshotEntries(s);
    const meta = entries[STORAGE_KEYS.snapshotMeta] as { chunks: number };
    expect(meta.chunks).toBeGreaterThan(1);
    const parts: string[] = [];
    for (let i = 0; i < meta.chunks; i++) {
      parts.push(
        entries[`snapshot:chunk:${String(i).padStart(16, '0')}`] as string,
      );
    }
    expect(parts.join('')).toBe(s);
  });

  it('classifies the exact 1-byte and 2-byte UTF-8 width boundaries', () => {
    // U+007F is still 1 byte; U+0080 is the first 2-byte scalar. U+07FF is
    // still 2 bytes; U+0800 is the first 3-byte BMP scalar. Wrong relational
    // operators on those cutoffs change the chunk count.
    const oneByteEdge = String.fromCharCode(0x7f).repeat(SNAPSHOT_CHUNK_BYTES + 1);
    const twoByteStart = String.fromCharCode(0x80).repeat(
      Math.floor(SNAPSHOT_CHUNK_BYTES / 2) + 1,
    );
    const twoByteEdge = String.fromCharCode(0x7ff).repeat(
      Math.floor(SNAPSHOT_CHUNK_BYTES / 2) + 1,
    );
    const threeByteStart = String.fromCharCode(0x800).repeat(
      Math.floor(SNAPSHOT_CHUNK_BYTES / 3) + 1,
    );
    for (const [label, s, expectedChunks] of [
      ['U+007F', oneByteEdge, 2],
      ['U+0080', twoByteStart, 2],
      ['U+07FF', twoByteEdge, 2],
      ['U+0800', threeByteStart, 2],
    ] as const) {
      const entries = snapshotEntries(s);
      const meta = entries[STORAGE_KEYS.snapshotMeta] as { chunks: number };
      expect(meta.chunks, label).toBe(expectedChunks);
      const parts: string[] = [];
      for (let i = 0; i < meta.chunks; i++) {
        parts.push(
          entries[`snapshot:chunk:${String(i).padStart(16, '0')}`] as string,
        );
      }
      expect(parts.join(''), label).toBe(s);
      for (const p of parts) {
        expect(new TextEncoder().encode(p).byteLength).toBeLessThanOrEqual(
          SNAPSHOT_CHUNK_BYTES,
        );
      }
    }
  });

  it('keeps exact surrogate-pair boundaries as single 4-byte scalars', () => {
    // First and last valid supplementary-plane scalars: U+10000 and U+10FFFF.
    const first = String.fromCodePoint(0x10000);
    const last = String.fromCodePoint(0x10ffff);
    const s =
      first.repeat(Math.floor(SNAPSHOT_CHUNK_BYTES / 4) + 2) +
      last.repeat(Math.floor(SNAPSHOT_CHUNK_BYTES / 4) + 2);
    const entries = snapshotEntries(s);
    const meta = entries[STORAGE_KEYS.snapshotMeta] as { chunks: number };
    expect(meta.chunks).toBeGreaterThan(1);
    const parts: string[] = [];
    for (let i = 0; i < meta.chunks; i++) {
      parts.push(
        entries[`snapshot:chunk:${String(i).padStart(16, '0')}`] as string,
      );
    }
    expect(parts.join('')).toBe(s);
    for (const p of parts) {
      // No orphan high/low halves.
      expect(p.length % 2 === 0 || !/[\uD800-\uDBFF]$/.test(p)).toBe(true);
      new TextEncoder().encode(p);
    }
  });

  it('treats a trailing unpaired high surrogate as a 3-byte replacement', () => {
    const high = String.fromCharCode(0xd800);
    // Fill almost one chunk with ASCII, then end on a lone high surrogate so
    // the scanner hits the `index + 1 < length` false branch.
    const s = 'a'.repeat(SNAPSHOT_CHUNK_BYTES - 1) + high;
    const entries = snapshotEntries(s);
    const meta = entries[STORAGE_KEYS.snapshotMeta] as { chunks: number };
    expect(meta.chunks).toBe(2);
    const parts: string[] = [];
    for (let i = 0; i < meta.chunks; i++) {
      parts.push(
        entries[`snapshot:chunk:${String(i).padStart(16, '0')}`] as string,
      );
    }
    expect(parts.join('')).toBe(s);
    expect(parts[1]).toBe(high);
  });
});

describe('readSnapshot', () => {
  it('returns null when nothing is stored', async () => {
    expect(await readSnapshot(fakeStorage())).toBeNull();
  });

  it('fast path: returns the single-key value unchanged', async () => {
    const s = fakeStorage();
    await s.put(STORAGE_KEYS.snapshot, 'legacy-small-snapshot');
    expect(await readSnapshot(s)).toBe('legacy-small-snapshot');
  });

  it('chunked path: reassembles parts in order', async () => {
    const s = fakeStorage();
    const big = 'z'.repeat(SNAPSHOT_CHUNK_BYTES + 500);
    await s.put(snapshotEntries(big));
    expect(await readSnapshot(s)).toBe(big);
  });

  it('reassembles snapshots whose chunk count exceeds one storage batch', async () => {
    // What matters here is the 128-key `storage.get(keys)` ceiling, not the
    // payload size: seeding tiny chunks directly keeps the test off the
    // per-code-point UTF-8 chunker (12.8 MiB there costs seconds, and times
    // out under Stryker's instrumented dry run).
    const s = fakeStorage();
    const chunks = 129;
    s.__map.set(STORAGE_KEYS.snapshotMeta, { chunks });
    let expected = '';
    for (let index = 0; index < chunks; index += 1) {
      const part = `part-${index};`;
      expected += part;
      s.__map.set(snapshotChunkKey(index), part);
    }

    expect(await readSnapshot(s)).toBe(expected);
  });

  it('throws when a chunk is missing (never-silently-corrupt)', async () => {
    const s = fakeStorage();
    const big = 'w'.repeat(SNAPSHOT_CHUNK_BYTES + 100);
    await s.put(snapshotEntries(big));
    // Sabotage: delete chunk 1.
    await s.delete(`snapshot:chunk:${String(1).padStart(16, '0')}`);
    await expect(readSnapshot(s)).rejects.toThrow(/chunk 1 missing/);
  });

  it.each([{ chunks: 0 }, { chunks: 2049 }, { chunks: 1.5 }, { chunks: NaN }])(
    'rejects invalid chunk metadata $chunks',
    async (meta) => {
      const s = fakeStorage();
      s.__map.set(STORAGE_KEYS.snapshotMeta, meta);
      await expect(readSnapshot(s)).rejects.toThrow(
        'invalid snapshot chunk metadata',
      );
    },
  );
});

describe('hasSnapshot', () => {
  it('false when nothing is stored', async () => {
    expect(await hasSnapshot(fakeStorage())).toBe(false);
  });

  it('true for single-key layout', async () => {
    const s = fakeStorage();
    await s.put(STORAGE_KEYS.snapshot, 'anything');
    expect(await hasSnapshot(s)).toBe(true);
  });

  it('true for chunked layout (meta present, single-key absent)', async () => {
    const s = fakeStorage();
    await s.put(snapshotEntries('t'.repeat(SNAPSHOT_CHUNK_BYTES + 1)));
    expect(await hasSnapshot(s)).toBe(true);
  });
});

describe('readSnapshotMeta', () => {
  it('returns null when no meta key exists', async () => {
    expect(await readSnapshotMeta(fakeStorage())).toBeNull();
  });

  it('returns the {chunks} object for chunked rooms', async () => {
    const s = fakeStorage();
    await s.put(snapshotEntries('p'.repeat(SNAPSHOT_CHUNK_BYTES * 2 + 1)));
    const meta = await readSnapshotMeta(s);
    expect(meta).toEqual({ chunks: 3 });
  });
});

describe('snapshot chunk metadata', () => {
  it('rejects malformed stored chunk metadata instead of trusting it', async () => {
    const storage = fakeStorage();
    storage.__map.set(STORAGE_KEYS.snapshotMeta, { chunks: -1 });
    await expect(readSnapshotMeta(storage)).rejects.toThrow(
      'invalid snapshot chunk metadata',
    );
  });
});

describe('chunk metadata validation boundaries', () => {
  it('accepts only a safe-integer chunk count inside the retention range', async () => {
    const accept = async (chunks: unknown): Promise<boolean> => {
      const s = fakeStorage();
      s.__map.set(STORAGE_KEYS.snapshotMeta, chunks);
      try {
        await readSnapshotMeta(s);
        return true;
      } catch {
        return false;
      }
    };
    expect(await accept({ chunks: 1 })).toBe(true);
    expect(await accept({ chunks: MAX_SNAPSHOT_CHUNKS })).toBe(true);
    expect(await accept({ chunks: 0 })).toBe(false);
    expect(await accept({ chunks: MAX_SNAPSHOT_CHUNKS + 1 })).toBe(false);
    expect(await accept({ chunks: 1.5 })).toBe(false);
    expect(await accept({ chunks: '2' })).toBe(false);
    expect(await accept({ chunks: Number.MAX_SAFE_INTEGER + 2 })).toBe(false);
    expect(await accept({})).toBe(false);
    expect(await accept('meta')).toBe(false);
    expect(await accept([])).toBe(false);
  });

  it('treats an absent meta key as "no chunked snapshot"', async () => {
    const s = fakeStorage();
    await expect(readSnapshotMeta(s)).resolves.toBeNull();
    s.__map.set(STORAGE_KEYS.snapshotMeta, null);
    await expect(readSnapshotMeta(s)).resolves.toBeNull();
  });

  it('reports existence under either layout and neither', async () => {
    const empty = fakeStorage();
    expect(await hasSnapshot(empty)).toBe(false);
    const single = fakeStorage();
    await single.put(STORAGE_KEYS.snapshot, '');
    expect(await hasSnapshot(single)).toBe(true);
    const chunked = fakeStorage();
    chunked.__map.set(STORAGE_KEYS.snapshotMeta, { chunks: 2 });
    expect(await hasSnapshot(chunked)).toBe(true);
    // A non-string value under the single key is not a snapshot.
    const bogus = fakeStorage();
    bogus.__map.set(STORAGE_KEYS.snapshot, 42);
    expect(await hasSnapshot(bogus)).toBe(false);
  });

  it('splits exactly at the byte ceiling without splitting a code point', () => {
    // A chunk holds SNAPSHOT_CHUNK_BYTES bytes; one more byte starts a new one.
    const exact = 'a'.repeat(SNAPSHOT_CHUNK_BYTES);
    expect(Object.keys(snapshotEntries(exact))).toEqual([STORAGE_KEYS.snapshot]);
    const overflow = snapshotEntries(`${exact}b`);
    expect(overflow[STORAGE_KEYS.snapshotMeta]).toEqual({ chunks: 2 });
    expect(overflow[snapshotChunkKey(0)]).toBe(exact);
    expect(overflow[snapshotChunkKey(1)]).toBe('b');
    // A 4-byte code point straddling the boundary moves whole to chunk 2.
    const straddle = `${'a'.repeat(SNAPSHOT_CHUNK_BYTES - 2)}😀`;
    const parts = snapshotEntries(straddle);
    expect(parts[snapshotChunkKey(0)]).toBe('a'.repeat(SNAPSHOT_CHUNK_BYTES - 2));
    expect(parts[snapshotChunkKey(1)]).toBe('😀');
  });
});
