import { env, runInDurableObject } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

import { RoomDO } from '../src/room.ts';
import type { Env } from '../src/env.ts';

/**
 * RoomDO integration tests — exercise the code through the real DO namespace
 * (`env.ROOM.get(id).fetch(...)`). Proves wiring end-to-end. See the sibling
 * `room.node.test.ts` for line-coverage-tracked unit tests.
 */
describe('RoomDO (integration via DO namespace)', () => {
  it('echoes its id for /_do/ping', async () => {
    const e = env as unknown as Env;
    const id = e.ROOM.idFromName('alpha');
    const stub = e.ROOM.get(id);
    const res = await stub.fetch('https://do/_do/ping?name=alpha');
    const body = (await res.json()) as { id: string; name: string };
    expect(res.status).toBe(200);
    expect(body.name).toBe('alpha');
    expect(body.id).toBe(id.toString());
  });

  it('returns 501 for unknown DO paths via runInDurableObject', async () => {
    const e = env as unknown as Env;
    const id = e.ROOM.idFromName('beta');
    await runInDurableObject(e.ROOM.get(id), async (instance: RoomDO) => {
      expect(instance).toBeInstanceOf(RoomDO);
      const res = await instance.fetch(new Request('https://do/_do/other'));
      expect(res.status).toBe(501);
    });
  });
});
