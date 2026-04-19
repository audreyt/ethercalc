import { describe, it, expect, vi } from 'vitest';

import { doFetch, roomStub } from '../src/lib/do-dispatch.ts';
import type { Env } from '../src/env.ts';

describe('do-dispatch', () => {
  it('roomStub derives an id from the encoded room name', () => {
    const idFromName = vi.fn((encoded: string) => ({ tag: encoded }));
    const get = vi.fn((id: unknown) => ({ fetch: () => new Response('ok') }));
    const env: Env = {
      ROOM: {
        idFromName,
        get,
      } as unknown as DurableObjectNamespace,
    };
    const stub = roomStub(env, 'some room');
    expect(idFromName).toHaveBeenCalledWith('some%20room');
    expect(get).toHaveBeenCalledWith({ tag: 'some%20room' });
    expect(stub).toBeDefined();
  });

  it('doFetch composes the DO URL + init and threads the room name', async () => {
    const fetchSpy = vi.fn(
      async (input: Request | string, init?: RequestInit) => {
        return new Response(
          JSON.stringify({ url: typeof input === 'string' ? input : input.url, init }),
          { headers: { 'content-type': 'application/json' } },
        );
      },
    );
    const idFromName = vi.fn((n: string) => ({ n }));
    const get = vi.fn(() => ({ fetch: fetchSpy }));
    const env: Env = {
      ROOM: { idFromName, get } as unknown as DurableObjectNamespace,
    };
    // Room name is threaded as `?name=<encoded>` so the DO can self-
    // identify for the D1 rooms-index mirror (Phase 5.1).
    const res = await doFetch(env, 'r', '/_do/snapshot', { method: 'PUT', body: 'x' });
    const body = (await res.json()) as { url: string };
    expect(body.url).toBe('https://do.local/_do/snapshot?name=r');
    expect(fetchSpy).toHaveBeenCalledWith('https://do.local/_do/snapshot?name=r', {
      method: 'PUT',
      body: 'x',
    });
  });

  it('doFetch defaults init to an empty object', async () => {
    const fetchSpy = vi.fn(async () => new Response('x'));
    const env: Env = {
      ROOM: {
        idFromName: () => ({}) as DurableObjectId,
        get: () => ({ fetch: fetchSpy }),
      } as unknown as DurableObjectNamespace,
    };
    await doFetch(env, 'r', '/_do/log');
    expect(fetchSpy).toHaveBeenCalledWith('https://do.local/_do/log?name=r', {});
  });

  it('doFetch appends with `&` when the path already carries a query string', async () => {
    const fetchSpy = vi.fn(async () => new Response('x'));
    const env: Env = {
      ROOM: {
        idFromName: () => ({}) as DurableObjectId,
        get: () => ({ fetch: fetchSpy }),
      } as unknown as DurableObjectNamespace,
    };
    await doFetch(env, 'r', '/_do/ping?probe=1');
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://do.local/_do/ping?probe=1&name=r',
      {},
    );
  });

  it('doFetch URL-encodes room names that contain spaces', async () => {
    const fetchSpy = vi.fn(async () => new Response('x'));
    const env: Env = {
      ROOM: {
        idFromName: () => ({}) as DurableObjectId,
        get: () => ({ fetch: fetchSpy }),
      } as unknown as DurableObjectNamespace,
    };
    await doFetch(env, 'some room', '/_do/log');
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://do.local/_do/log?name=some%20room',
      {},
    );
  });
});
