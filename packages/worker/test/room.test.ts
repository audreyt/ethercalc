import { env, runInDurableObject } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

import { logKey } from '@ethercalc/shared/storage-keys';

import { RoomDO } from '../src/room.ts';
import type { Env } from '../src/env.ts';

/**
 * RoomDO integration tests — exercise the code through the real DO namespace
 * (`env.ROOM.get(id).fetch(...)`). Proves wiring end-to-end. See the sibling
 * `room.node.test.ts` for line-coverage-tracked unit tests.
 */

function getStub(name: string) {
  const e = env as unknown as Env;
  const id = e.ROOM.idFromName(name);
  return { e, id, stub: e.ROOM.get(id) };
}

describe('RoomDO (integration via DO namespace)', () => {
  it('echoes its id for /_do/ping', async () => {
    const { id, stub } = getStub('alpha');
    const res = await stub.fetch('https://do/_do/ping?name=alpha');
    const body = (await res.json()) as { id: string; name: string };
    expect(res.status).toBe(200);
    expect(body.name).toBe('alpha');
    expect(body.id).toBe(id.toString());
  });

  it('reports PITR as unavailable in local workerd', async () => {
    expect(typeof Promise.withResolvers).toBe('function');
    const { stub } = getStub('pitr-local-unavailable');
    const res = await stub.fetch('https://do/_do/pitr-restore', {
      method: 'POST',
      body: JSON.stringify({ at: 1, dryRun: true }),
    });
    expect(res.status).toBe(501);
    expect(await res.text()).toBe('PITR is unavailable on this deployment');
  });

  it('returns 501 for unknown DO paths via runInDurableObject', async () => {
    const { e, id } = getStub('beta');
    await runInDurableObject(e.ROOM.get(id), async (instance: RoomDO) => {
      expect(instance).toBeInstanceOf(RoomDO);
      const res = await instance.fetch(new Request('https://do/_do/other'));
      expect(res.status).toBe(501);
    });
  });

  it('PUT+GET /_do/snapshot round-trips a SocialCalc save string', async () => {
    const { stub } = getStub('crud-roundtrip');
    const save =
      'socialcalc:version:1.5\n' +
      'MIME-Version: 1.0\n' +
      '\n' +
      '--SocialCalcSpreadsheetControlSave--\n' +
      'Content-type: text/plain; charset=UTF-8\n' +
      '\n' +
      'version:1.5\n';
    const put = await stub.fetch('https://do/_do/snapshot', {
      method: 'PUT',
      body: save,
    });
    expect(put.status).toBe(201);
    expect(await put.text()).toBe('OK');

    const get = await stub.fetch('https://do/_do/snapshot');
    expect(get.status).toBe(200);
    expect(await get.text()).toBe(save);
  });

  it('GET /_do/exists flips 0→1 after snapshot PUT', async () => {
    const { stub } = getStub('exists-flip');
    const pre = await stub.fetch('https://do/_do/exists');
    expect(((await pre.json()) as { exists: number }).exists).toBe(0);

    await stub.fetch('https://do/_do/snapshot', { method: 'PUT', body: 'x' });

    const post = await stub.fetch('https://do/_do/exists');
    expect(((await post.json()) as { exists: number }).exists).toBe(1);
  });

  it('POST /_do/commands executes SocialCalc and updates snapshot', async () => {
    const { stub } = getStub('cmd-execute');
    // Start from empty — creating a blank room via an empty-snapshot PUT.
    await stub.fetch('https://do/_do/snapshot', { method: 'PUT', body: '' });

    // `set A1 value n 1` is the canonical numeric-cell SocialCalc command.
    const res = await stub.fetch('https://do/_do/commands', {
      method: 'POST',
      body: 'set A1 value n 1',
    });
    expect(res.status).toBe(202);

    const log = await stub.fetch('https://do/_do/log');
    const body = (await log.json()) as { log: string[]; chat: string[] };
    expect(body.log).toEqual(['set A1 value n 1']);
    expect(body.chat).toEqual([]);

    // Snapshot should now have the cell in it.
    const snap = await stub.fetch('https://do/_do/snapshot');
    const snapText = await snap.text();
    expect(snapText).toContain('cell:A1');
  });

  it('DELETE /_do/all wipes the snapshot', async () => {
    const { stub } = getStub('delete-all');
    await stub.fetch('https://do/_do/snapshot', { method: 'PUT', body: 'save' });
    const del = await stub.fetch('https://do/_do/all', { method: 'DELETE' });
    expect(del.status).toBe(201);
    const g = await stub.fetch('https://do/_do/snapshot');
    expect(g.status).toBe(404);
  });

  it('GET /_do/cells returns sheet cells object', async () => {
    const { stub } = getStub('cells-route');
    await stub.fetch('https://do/_do/snapshot', { method: 'PUT', body: '' });
    await stub.fetch('https://do/_do/commands', {
      method: 'POST',
      body: 'set A1 value n 42',
    });
    const cellsRes = await stub.fetch('https://do/_do/cells');
    expect(cellsRes.status).toBe(200);
    // Legacy (src/sc.ls:361) returns the cells map unwrapped — external
    // API clients (sheetnode, ethercalc-cli) destructure `response.A1`,
    // not `response.cells.A1`.
    const cells = (await cellsRes.json()) as Record<string, unknown>;
    expect(cells['A1']).toBeDefined();
  });

  it('GET /_do/cells/:coord returns a single cell or null', async () => {
    const { stub } = getStub('cell-route');
    await stub.fetch('https://do/_do/snapshot', { method: 'PUT', body: '' });
    await stub.fetch('https://do/_do/commands', {
      method: 'POST',
      body: 'set A1 value n 7',
    });
    const a1 = await stub.fetch('https://do/_do/cells/A1');
    expect(a1.status).toBe(200);
    expect(await a1.json()).not.toBeNull();

    const zz = await stub.fetch('https://do/_do/cells/ZZ99');
    expect(zz.status).toBe(200);
    expect(await zz.json()).toBeNull();
  });

  // ─── Design "fold": double-apply regression + storage bounds ──────────
  //
  // These run against REAL SocialCalc so the non-idempotent command
  // (`insertrow`) actually shifts cells — the exact corruption the old
  // "replay log over a snapshot that already contains it" hydrate caused.

  it('cold rehydrate of a non-idempotent command produces single-applied state', async () => {
    // THE regression test. `set A1` then `insertrow A1` pushes A1's value
    // down to A2. `#appendCommand` stores a post-command snapshot (value
    // already at A2) AND appends the same commands to `log:`. On a COLD
    // rehydrate the snapshot must be authoritative — replaying the log on
    // top would apply `insertrow` a SECOND time, shifting the value to A3
    // (corruption). We reproduce exactly the on-disk layout (`snapshot`
    // includes the commands, `log:` also holds them) and then force a
    // fresh hydrate to prove the log is NOT replayed.

    // Phase 1: build the authoritative post-command snapshot on a helper
    // room, then read it + its log straight off disk.
    const src = getStub('fold-src');
    await src.stub.fetch('https://do/_do/snapshot', { method: 'PUT', body: '' });
    await src.stub.fetch('https://do/_do/commands', {
      method: 'POST',
      body: 'set A1 text t hello',
    });
    await src.stub.fetch('https://do/_do/commands', {
      method: 'POST',
      body: 'insertrow A1',
    });
    const foldedSnapshot = await (
      await src.stub.fetch('https://do/_do/snapshot')
    ).text();
    // Sanity: the value sits at A2 in the stored (single-applied) snapshot.
    const srcA2 = await src.stub.fetch('https://do/_do/cells/A2');
    expect(((await srcA2.json()) as { datavalue?: string } | null)?.datavalue).toBe(
      'hello',
    );

    // Phase 2: hand-craft the exact post-command on-disk layout into a
    // FRESH room's storage — `snapshot` already includes both commands AND
    // `log:` still holds them — then trigger the very first `#getSpreadsheet`
    // (a cold hydrate). The OLD code replayed `insertrow` here → A3; the
    // fix builds from the snapshot alone → A2 stays, A3 empty.
    const cold = getStub('fold-cold');
    await runInDurableObject(
      cold.stub,
      async (instance: RoomDO, state) => {
        await state.storage.put('snapshot', foldedSnapshot);
        await state.storage.put(logKey(0), 'set A1 text t hello');
        await state.storage.put(logKey(1), 'insertrow A1');
        // First read on this fresh instance → cold hydrate from storage.
        const a2 = await instance.fetch(new Request('https://do/_do/cells/A2'));
        expect(
          ((await a2.json()) as { datavalue?: string } | null)?.datavalue,
        ).toBe('hello');
        const a3 = await instance.fetch(new Request('https://do/_do/cells/A3'));
        // A3 empty → insertrow was applied exactly once (no log replay).
        expect(await a3.json()).toBeNull();
      },
    );
  });

  it('log-only room (no snapshot) still replays the log on hydrate', async () => {
    // The no-snapshot branch of #getSpreadsheet must still replay — there
    // is no folded state to read, so the log IS the state. Hand-craft a
    // log-only room and confirm the command takes effect.
    const cold = getStub('fold-log-only');
    await runInDurableObject(cold.stub, async (instance: RoomDO, state) => {
      await state.storage.put(logKey(0), 'set A1 value n 7');
      const a1 = await instance.fetch(new Request('https://do/_do/cells/A1'));
      expect(((await a1.json()) as { datavalue?: number } | null)?.datavalue).toBe(
        7,
      );
    });
  });

  it('seed folds base + since-base log into the authoritative snapshot', async () => {
    // A migrated room whose base snapshot predates its log: the seeded
    // snapshot must already incorporate the log command (it is no longer
    // replayed at hydrate). Verify the cell the log sets is present.
    const { stub } = getStub('fold-seed-base-log');
    // Build a real base snapshot containing A1=1 by round-tripping it.
    const base = getStub('fold-seed-source').stub;
    await base.fetch('https://do/_do/snapshot', { method: 'PUT', body: '' });
    await base.fetch('https://do/_do/commands', {
      method: 'POST',
      body: 'set A1 value n 1',
    });
    const baseSnapshot = await (
      await base.fetch('https://do/_do/snapshot')
    ).text();

    await stub.fetch('https://do/_do/seed?name=fold-seed-base-log', {
      method: 'POST',
      body: JSON.stringify({
        snapshot: baseSnapshot,
        log: ['set B2 value n 99'], // since-base command, not yet folded
        updatedAt: Date.now(),
      }),
    });
    // Both the base cell and the folded-in log cell are present.
    const a1 = await stub.fetch('https://do/_do/cells/A1');
    expect(((await a1.json()) as { datavalue?: number } | null)?.datavalue).toBe(1);
    const b2 = await stub.fetch('https://do/_do/cells/B2');
    expect(((await b2.json()) as { datavalue?: number } | null)?.datavalue).toBe(99);
  });
});
