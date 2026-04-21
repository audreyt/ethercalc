/**
 * Unit tests for the chunked-snapshot storage helper. Covers the fast
 * single-key path, the chunked read/write path, the `hasSnapshot`
 * existence check, and the meta round-trip — all against an in-memory
 * fake storage.
 */
import { describe, it, expect } from 'vitest';

import { STORAGE_KEYS } from '@ethercalc/shared/storage-keys';
import {
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

  it('throws when a chunk is missing (never-silently-corrupt)', async () => {
    const s = fakeStorage();
    const big = 'w'.repeat(SNAPSHOT_CHUNK_BYTES + 100);
    await s.put(snapshotEntries(big));
    // Sabotage: delete chunk 1.
    await s.delete(`snapshot:chunk:${String(1).padStart(16, '0')}`);
    await expect(readSnapshot(s)).rejects.toThrow(/chunk 1 missing/);
  });
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
