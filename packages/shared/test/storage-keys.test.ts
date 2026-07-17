import { describe, it, expect } from 'vite-plus/test';

import {
  STORAGE_KEYS,
  SEQ_PAD_WIDTH,
  padSeq,
  logKey,
  auditKey,
  chatKey,
  ecellKey,
  snapshotChunkKey,
  type AccessMode,
  type RoomAcl,
} from '../src/storage-keys.ts';

describe('STORAGE_KEYS', () => {
  it('exposes every key pattern from AGENTS.md §3.3', () => {
    expect(STORAGE_KEYS).toEqual({
      snapshot: 'snapshot',
      snapshotMeta: 'snapshot:meta',
      snapshotChunkPrefix: 'snapshot:chunk:',
      metaUpdatedAt: 'meta:updated_at',
      metaAccess: 'meta:access',
      metaAcl: 'meta:acl',
      metaGroup: 'meta:group',
      logPrefix: 'log:',
      auditPrefix: 'audit:',
      chatPrefix: 'chat:',
      ecellPrefix: 'ecell:',
    });
  });
});

describe('snapshotChunkKey', () => {
  it('zero-pads the index so listPrefix returns chunks in order', () => {
    expect(snapshotChunkKey(0)).toBe('snapshot:chunk:0000000000000000');
    expect(snapshotChunkKey(42)).toBe('snapshot:chunk:0000000000000042');
  });
});

describe('padSeq', () => {
  it('pads to 16 digits', () => {
    expect(padSeq(0)).toBe('0000000000000000');
    expect(padSeq(1)).toBe('0000000000000001');
    expect(padSeq(12345)).toBe('0000000000012345');
    expect(padSeq(0)).toHaveLength(SEQ_PAD_WIDTH);
  });

  it('preserves lexicographic ordering for small numbers', () => {
    const ordered = [3, 1, 20, 2, 10].map(padSeq);
    expect([...ordered].sort()).toEqual([1, 2, 3, 10, 20].map(padSeq));
  });

  it('rejects negative integers', () => {
    expect(() => padSeq(-1)).toThrow(RangeError);
    // Pin the literal error message so a mutation that replaces the
    // template with `\`\`` doesn't survive (the debugging value of the
    // message is the whole point of using a RangeError over a plain
    // Error). Regex matches either the integer or the NaN rejection.
    expect(() => padSeq(-1)).toThrow(/padSeq requires a non-negative integer, got -1/);
  });

  it('rejects non-integers', () => {
    expect(() => padSeq(1.5)).toThrow(RangeError);
    expect(() => padSeq(1.5)).toThrow(/padSeq requires a non-negative integer, got 1\.5/);
    expect(() => padSeq(Number.NaN)).toThrow(RangeError);
    expect(() => padSeq(Number.NaN)).toThrow(/padSeq requires a non-negative integer, got NaN/);
  });
});

describe('logKey / auditKey / chatKey', () => {
  it('prefix the padded sequence', () => {
    expect(logKey(5)).toBe('log:0000000000000005');
    expect(auditKey(0)).toBe('audit:0000000000000000');
    expect(chatKey(999)).toBe('chat:0000000000000999');
  });
});

describe('ecellKey', () => {
  it('prefixes the user id', () => {
    expect(ecellKey('alice')).toBe('ecell:alice');
  });

  it('rejects empty user', () => {
    expect(() => ecellKey('')).toThrow(RangeError);
    // Pin the literal so a mutation replacing the message with `""`
    // doesn't survive.
    expect(() => ecellKey('')).toThrow(/ecellKey requires a non-empty user/);
  });
});

describe('AccessMode', () => {
  it('is a union of public and private', () => {
    const modes: AccessMode[] = ['public', 'private'];
    expect(modes).toContain('public');
    expect(modes).toContain('private');
  });
});

describe('RoomAcl', () => {
  it('defines owner, writers, and readers arrays', () => {
    const acl: RoomAcl = { owner: 'uid-1', writers: ['uid-1'], readers: ['uid-1'] };
    expect(acl.owner).toBe('uid-1');
    expect(acl.writers).toEqual(['uid-1']);
    expect(acl.readers).toEqual(['uid-1']);
  });
});
