/**
 * applyRoomStream() against a recording target — asserts the exact call
 * sequence and stat counts.
 */
import { describe, it, expect } from 'vitest';
import {
  applyRoomStream,
  type MigrationTarget,
  type Room,
} from '../src/apply.ts';

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

async function* fromArray(rooms: readonly Room[]): AsyncIterable<Room> {
  for (const r of rooms) yield r;
}

describe('applyRoomStream', () => {
  it('returns zero stats for an empty input', async () => {
    const t = new RecordingTarget();
    expect(await applyRoomStream(fromArray([]), t)).toEqual({
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
    const stats = await applyRoomStream(fromArray([room]), t);
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
    const stats = await applyRoomStream(fromArray([room]), t);
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
    await applyRoomStream(fromArray([room]), t);
    expect(t.calls.at(-1)?.args).toEqual(['x', 0]);
  });

  it('processes multiple rooms in order at concurrency=1', async () => {
    const t = new RecordingTarget();
    await applyRoomStream(
      fromArray([
        { name: 'a', snapshot: 'A', log: [], audit: [], chat: [], ecell: {} },
        { name: 'b', snapshot: 'B', log: [], audit: [], chat: [], ecell: {} },
      ]),
      t,
    );
    const rooms = t.calls
      .filter((c) => c.method === 'putSnapshot')
      .map((c) => c.args[0]);
    expect(rooms).toEqual(['a', 'b']);
  });

  it('invokes onProgress after every completed room', async () => {
    const seen: Array<{ seeded: number; inFlight: number }> = [];
    const t = new RecordingTarget();
    await applyRoomStream(
      fromArray([
        { name: 'a', snapshot: '', log: [], audit: [], chat: [], ecell: {} },
        { name: 'b', snapshot: '', log: [], audit: [], chat: [], ecell: {} },
      ]),
      t,
      {
        onProgress: (info) => {
          seen.push({ seeded: info.seeded, inFlight: info.inFlight });
        },
      },
    );
    expect(seen.map((s) => s.seeded)).toEqual([1, 2]);
  });

  it('parallelizes up to concurrency and propagates the first error', async () => {
    class FlakyTarget extends RecordingTarget {
      override setRoomIndex(room: string, updatedAt: number): Promise<void> {
        if (room === 'b') return Promise.reject(new Error('boom'));
        return super.setRoomIndex(room, updatedAt);
      }
    }
    const t = new FlakyTarget();
    await expect(
      applyRoomStream(
        fromArray([
          { name: 'a', snapshot: '', log: [], audit: [], chat: [], ecell: {} },
          { name: 'b', snapshot: '', log: [], audit: [], chat: [], ecell: {} },
          { name: 'c', snapshot: '', log: [], audit: [], chat: [], ecell: {} },
        ]),
        t,
        { concurrency: 2 },
      ),
    ).rejects.toThrow('boom');
  });

  it('continues past per-room errors when onRoomError is set', async () => {
    // Production CF migrations hit transient 500s that outlast the
    // per-request retry budget. With onRoomError set, applyRoomStream
    // reports each failure and keeps going rather than aborting.
    class MiddleFailTarget extends RecordingTarget {
      override setRoomIndex(room: string): Promise<void> {
        if (room === 'b') return Promise.reject(new Error('transient 500'));
        return super.setRoomIndex(room, 0);
      }
    }
    const t = new MiddleFailTarget();
    const errors: Array<{ room: string; msg: string }> = [];
    const stats = await applyRoomStream(
      fromArray([
        { name: 'a', snapshot: '', log: [], audit: [], chat: [], ecell: {} },
        { name: 'b', snapshot: '', log: [], audit: [], chat: [], ecell: {} },
        { name: 'c', snapshot: '', log: [], audit: [], chat: [], ecell: {} },
      ]),
      t,
      {
        concurrency: 1,
        onRoomError: ({ room, error }) => {
          errors.push({ room, msg: (error as Error).message });
        },
      },
    );
    // Rooms a and c succeeded — stats.rooms counts only successes.
    expect(stats.rooms).toBe(2);
    expect(errors).toEqual([{ room: 'b', msg: 'transient 500' }]);
  });

  it('fast-fails subsequent rooms once a prior one errors', async () => {
    // Covers the `if (firstError !== null) break;` guard. Sets up a
    // target that rejects the very first room so firstError lands
    // before the second room is pulled from the source; asserts only
    // one room was seeded (no `break` → we'd see three).
    class FirstFailTarget extends RecordingTarget {
      override setRoomIndex(_room: string): Promise<void> {
        return Promise.reject(new Error('first-fail'));
      }
    }
    const t = new FirstFailTarget();
    const seen: string[] = [];
    async function* withObserver(): AsyncIterable<Room> {
      for (const name of ['a', 'b', 'c', 'd']) {
        seen.push(name);
        yield { name, snapshot: '', log: [], audit: [], chat: [], ecell: {} };
      }
    }
    await expect(
      applyRoomStream(withObserver(), t, { concurrency: 1 }),
    ).rejects.toThrow('first-fail');
    // Only 'a' and 'b' pulled — 'b' saw firstError and break'd before
    // 'c'/'d' were produced.
    expect(seen).toEqual(['a', 'b']);
  });

  it('keeps the first error and ignores later ones (concurrent failures)', async () => {
    // Covers the `if (firstError === null) firstError = err;` guard
    // when two rooms fail concurrently. All rejections are delayed
    // (setTimeout) so both work_a and work_b are pushed to inFlight
    // BEFORE either catch runs — then both catches fire, the second
    // observes firstError !== null and takes the false branch.
    class DelayedFailTarget extends RecordingTarget {
      override setRoomIndex(room: string): Promise<void> {
        const delay = room === 'a' ? 5 : 10;
        return new Promise((_, rej) =>
          setTimeout(() => rej(new Error(`fail-${room}`)), delay),
        );
      }
    }
    const t = new DelayedFailTarget();
    await expect(
      applyRoomStream(
        fromArray([
          { name: 'a', snapshot: '', log: [], audit: [], chat: [], ecell: {} },
          { name: 'b', snapshot: '', log: [], audit: [], chat: [], ecell: {} },
          { name: 'c', snapshot: '', log: [], audit: [], chat: [], ecell: {} },
        ]),
        t,
        { concurrency: 3 },
      ),
    ).rejects.toThrow('fail-a');
  });
});
