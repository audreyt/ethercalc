import { env, runInDurableObject } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

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
});
