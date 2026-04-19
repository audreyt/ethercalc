import { describe, it, expect } from 'vitest';
import {
  STORAGE_KEYS,
  logKey,
  auditKey,
  chatKey,
  ecellKey,
} from '@ethercalc/shared/storage-keys';

import { InMemoryTarget } from '../../src/targets/in-memory.ts';

describe('InMemoryTarget', () => {
  it('stores snapshots and writes meta:updated_at via injected clock', async () => {
    const t = new InMemoryTarget({ now: () => 100 });
    await t.putSnapshot('r1', 'SAVE');
    expect(t.doStorage.get('r1')?.get(STORAGE_KEYS.snapshot)).toBe('SAVE');
    expect(t.doStorage.get('r1')?.get(STORAGE_KEYS.metaUpdatedAt)).toBe('100');
  });

  it('stores log/audit/chat under their prefixed zero-padded keys', async () => {
    const t = new InMemoryTarget();
    await t.putLog('r', 1, 'L');
    await t.putAudit('r', 2, 'A');
    await t.putChat('r', 3, 'C');
    expect(t.doStorage.get('r')?.get(logKey(1))).toBe('L');
    expect(t.doStorage.get('r')?.get(auditKey(2))).toBe('A');
    expect(t.doStorage.get('r')?.get(chatKey(3))).toBe('C');
  });

  it('stores ecell under ecell:<user>', async () => {
    const t = new InMemoryTarget();
    await t.putEcell('r', 'alice', 'A1');
    expect(t.doStorage.get('r')?.get(ecellKey('alice'))).toBe('A1');
  });

  it('records D1 + KV entries via setRoomIndex', async () => {
    const t = new InMemoryTarget();
    await t.setRoomIndex('r', 5000);
    expect(t.d1Rooms.get('r')).toEqual({ updatedAt: 5000 });
    expect(t.kvRoomsExists.get('r')).toBe('1');
  });

  it('shares a bucket across writes to the same room', async () => {
    const t = new InMemoryTarget();
    await t.putLog('r', 1, 'one');
    await t.putLog('r', 2, 'two');
    expect(t.doStorage.get('r')?.size).toBe(2);
  });

  it('defaults the clock to Date.now when no override is supplied', async () => {
    const t = new InMemoryTarget();
    const before = Date.now();
    await t.putSnapshot('r', 'S');
    const written = Number(t.doStorage.get('r')?.get(STORAGE_KEYS.metaUpdatedAt));
    expect(written).toBeGreaterThanOrEqual(before);
    expect(written).toBeLessThanOrEqual(Date.now() + 10);
  });
});
