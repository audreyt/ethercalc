import { describe, it, expect, vi } from 'vite-plus/test';

import { doFetch, roomStub } from '../src/lib/do-dispatch.ts';
import type { Env } from '../src/env.ts';

interface RecordedFetch {
  url: string;
  init: RequestInit | undefined;
}

function makeRecordingEnv(calls: RecordedFetch[]): Env {
  return {
    ROOM: {
      idFromName: () => ({}) as DurableObjectId,
      get: () => ({
        async fetch(input: Request | string, init?: RequestInit) {
          calls.push({
            url: typeof input === 'string' ? input : input.url,
            init,
          });
          return new Response('x');
        },
      }),
    } as unknown as DurableObjectNamespace,
  };
}

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
    const calls: RecordedFetch[] = [];
    // Room name is threaded as `?name=<encoded>` so the DO can self-
    // identify for the D1 rooms-index mirror (Phase 5.1).
    await doFetch(makeRecordingEnv(calls), 'r', '/_do/snapshot', {
      method: 'PUT',
      body: 'x',
    });
    expect(calls[0]?.url).toBe('https://do.local/_do/snapshot?name=r');
    expect(calls[0]?.init).toMatchObject({ method: 'PUT', body: 'x' });
  });

  it('doFetch defaults init to an empty object', async () => {
    const calls: RecordedFetch[] = [];
    await doFetch(makeRecordingEnv(calls), 'r', '/_do/log');
    expect(calls[0]?.url).toBe('https://do.local/_do/log?name=r');
  });

  it('doFetch appends with `&` when the path already carries a query string', async () => {
    const calls: RecordedFetch[] = [];
    await doFetch(makeRecordingEnv(calls), 'r', '/_do/ping?probe=1');
    expect(calls[0]?.url).toBe('https://do.local/_do/ping?probe=1&name=r');
  });

  it('doFetch URL-encodes room names that contain spaces', async () => {
    const calls: RecordedFetch[] = [];
    await doFetch(makeRecordingEnv(calls), 'some room', '/_do/log');
    expect(calls[0]?.url).toBe('https://do.local/_do/log?name=some%20room');
  });

  it('doFetch strips forged X-EC-Uid headers when no principal is supplied', async () => {
    const calls: RecordedFetch[] = [];
    await doFetch(makeRecordingEnv(calls), 'r', '/_do/snapshot', {
      headers: { 'x-ec-uid': 'uid-forged', Accept: 'text/plain' },
    });
    const headers = new Headers(calls[0]?.init?.headers);
    expect(headers.get('X-EC-Uid')).toBeNull();
    expect(headers.get('Accept')).toBe('text/plain');
  });

  it('doFetch sets X-EC-Uid exclusively from the verified principal', async () => {
    const calls: RecordedFetch[] = [];
    await doFetch(
      makeRecordingEnv(calls),
      'r',
      '/_do/snapshot',
      { headers: { 'X-EC-Uid': 'uid-forged' } },
      { uid: 'uid-verified', exp: Number.MAX_SAFE_INTEGER },
    );
    const headers = new Headers(calls[0]?.init?.headers);
    expect(headers.get('X-EC-Uid')).toBe('uid-verified');
  });
});
