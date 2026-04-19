/**
 * apply() against a recording target — asserts the exact call sequence
 * and stat counts.
 */
import { describe, it, expect } from 'vitest';
import { applyRooms, type MigrationTarget } from '../src/apply.ts';
import type { Room } from '../src/extract-rooms.ts';

type Call = { method: string; args: unknown[] };

class RecordingTarget implements MigrationTarget {
  public calls: Call[] = [];
  putSnapshot(room: string, snapshot: string): Promise<void> {
    this.calls.push({ method: 'putSnapshot', args: [room, snapshot] });
    return Promise.resolve();
  }
  putLog(room: string, seq: number, cmd: string): Promise<void> {
    this.calls.push({ method: 'putLog', args: [room, seq, cmd] });
    return Promise.resolve();
  }
  putAudit(room: string, seq: number, cmd: string): Promise<void> {
    this.calls.push({ method: 'putAudit', args: [room, seq, cmd] });
    return Promise.resolve();
  }
  putChat(room: string, seq: number, msg: string): Promise<void> {
    this.calls.push({ method: 'putChat', args: [room, seq, msg] });
    return Promise.resolve();
  }
  putEcell(room: string, user: string, cell: string): Promise<void> {
    this.calls.push({ method: 'putEcell', args: [room, user, cell] });
    return Promise.resolve();
  }
  setRoomIndex(room: string, updatedAt: number): Promise<void> {
    this.calls.push({ method: 'setRoomIndex', args: [room, updatedAt] });
    return Promise.resolve();
  }
}

describe('applyRooms', () => {
  it('returns zero stats for an empty input', async () => {
    const t = new RecordingTarget();
    expect(await applyRooms([], t)).toEqual({
      rooms: 0,
      snapshots: 0,
      logEntries: 0,
      auditEntries: 0,
      chatEntries: 0,
      ecellEntries: 0,
      indexed: 0,
    });
    expect(t.calls).toEqual([]);
  });

  it('replays a full room in the expected order', async () => {
    const room: Room = {
      name: 'r',
      snapshot: 'SAVE',
      log: ['L1', 'L2'],
      audit: ['A1'],
      chat: ['C1'],
      ecell: { alice: 'A1', bob: 'B2' },
      updatedAt: 1234,
    };
    const t = new RecordingTarget();
    const stats = await applyRooms([room], t);
    expect(stats).toEqual({
      rooms: 1,
      snapshots: 1,
      logEntries: 2,
      auditEntries: 1,
      chatEntries: 1,
      ecellEntries: 2,
      indexed: 1,
    });
    expect(t.calls.map((c) => c.method)).toEqual([
      'putSnapshot',
      'putLog',
      'putLog',
      'putAudit',
      'putChat',
      'putEcell',
      'putEcell',
      'setRoomIndex',
    ]);
    // Seq numbers start at 1 and ascend.
    expect(t.calls[1]?.args).toEqual(['r', 1, 'L1']);
    expect(t.calls[2]?.args).toEqual(['r', 2, 'L2']);
    expect(t.calls.at(-1)?.args).toEqual(['r', 1234]);
  });

  it('skips putSnapshot when snapshot is empty but still indexes', async () => {
    const room: Room = {
      name: 'x',
      snapshot: '',
      log: [],
      audit: [],
      chat: [],
      ecell: {},
    };
    const t = new RecordingTarget();
    const stats = await applyRooms([room], t);
    expect(stats.snapshots).toBe(0);
    expect(stats.indexed).toBe(1);
    expect(t.calls.find((c) => c.method === 'putSnapshot')).toBeUndefined();
    expect(t.calls.find((c) => c.method === 'setRoomIndex')).toBeDefined();
  });

  it('defaults updatedAt to 0 when absent', async () => {
    const room: Room = {
      name: 'x',
      snapshot: '',
      log: [],
      audit: [],
      chat: [],
      ecell: {},
    };
    const t = new RecordingTarget();
    await applyRooms([room], t);
    expect(t.calls.at(-1)?.args).toEqual(['x', 0]);
  });

  it('processes multiple rooms in order', async () => {
    const t = new RecordingTarget();
    await applyRooms(
      [
        { name: 'a', snapshot: 'A', log: [], audit: [], chat: [], ecell: {} },
        { name: 'b', snapshot: 'B', log: [], audit: [], chat: [], ecell: {} },
      ],
      t,
    );
    const rooms = t.calls.filter((c) => c.method === 'putSnapshot').map((c) => c.args[0]);
    expect(rooms).toEqual(['a', 'b']);
  });
});
