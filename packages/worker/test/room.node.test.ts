import { describe, it, expect } from 'vitest';

import { RoomDO } from '../src/room.ts';
import type { Env } from '../src/env.ts';

/**
 * RoomDO unit tests — direct construction (no DO namespace). Runs in Node
 * environment so istanbul tracks every line. Integration tests that go
 * through the real DO namespace live in `room.test.ts` (workers pool).
 */

function makeState(idString: string): DurableObjectState {
  return {
    id: { toString: () => idString } as DurableObjectId,
  } as unknown as DurableObjectState;
}

function makeEnv(): Env {
  return { ROOM: {} as DurableObjectNamespace };
}

describe('RoomDO (unit, direct construction)', () => {
  it('ping echoes id and name', async () => {
    const room = new RoomDO(makeState('abc123'), makeEnv());
    const res = await room.fetch(new Request('https://do/_do/ping?name=gamma'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string; name: string };
    expect(body).toEqual({ id: 'abc123', name: 'gamma' });
  });

  it('ping with no name yields a null name field', async () => {
    const room = new RoomDO(makeState('abc'), makeEnv());
    const res = await room.fetch(new Request('https://do/_do/ping'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string; name: string | null };
    expect(body.name).toBeNull();
  });

  it('unknown path returns 501', async () => {
    const room = new RoomDO(makeState('xyz'), makeEnv());
    const res = await room.fetch(new Request('https://do/anything'));
    expect(res.status).toBe(501);
    expect(await res.text()).toBe('Not implemented');
  });
});
