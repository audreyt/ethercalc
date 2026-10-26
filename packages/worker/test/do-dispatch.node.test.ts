import { describe, it, expect, vi } from 'vite-plus/test';

import {
  DoUnavailableError,
  doFetch,
  doUnavailableResponse,
  roomStub,
} from '../src/lib/do-dispatch.ts';
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

  it('roomStub rejects invalid room identifiers before namespace lookup', () => {
    const idFromName = vi.fn();
    const env = {
      ROOM: { idFromName, get: vi.fn() },
    } as unknown as Env;
    expect(() => roomStub(env, '')).toThrow(RangeError);
    expect(() => roomStub(env, 'bad\u0000room')).toThrow(RangeError);
    expect(idFromName).not.toHaveBeenCalled();
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

  it('doFetch returns 400 without dispatching an invalid room name', async () => {
    const calls: RecordedFetch[] = [];
    const res = await doFetch(
      makeRecordingEnv(calls),
      'x'.repeat(2049),
      '/_do/log',
    );
    expect(res.status).toBe(400);
    expect(await res.text()).toBe('Invalid room name');
    expect(calls).toHaveLength(0);
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

describe('do-dispatch refusal shape', () => {
  it('names the invalid room in both the stub and fetch paths', async () => {
    const env = makeRecordingEnv([]);
    expect(() => roomStub(env, 'bad\u0000name')).toThrow('Invalid room name');
    const res = await doFetch(env, 'bad\u0000name', '/_do/ping');
    expect(res.status).toBe(400);
    expect(await res.text()).toBe('Invalid room name');
    expect(res.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
  });
});

/** Runtime-shaped stub.fetch error (flags as set by workerd). */
function doError(
  message: string,
  flags: { remote?: boolean; retryable?: boolean; overloaded?: boolean } = {},
): Error {
  return Object.assign(new Error(message), flags);
}

/**
 * Env whose successive stub.fetch calls follow `script`: an Error entry is
 * thrown, a string becomes a 200 body. `stubs` counts namespace.get calls.
 */
function makeScriptedEnv(script: Array<Error | string | unknown>): {
  env: Env;
  stubs: () => number;
  fetches: () => number;
} {
  let stubs = 0;
  let fetches = 0;
  const env: Env = {
    ROOM: {
      idFromName: () => ({}) as DurableObjectId,
      get: () => {
        stubs += 1;
        return {
          async fetch() {
            const next = script[fetches];
            fetches += 1;
            if (typeof next === 'string') return new Response(next);
            throw next;
          },
        };
      },
    } as unknown as DurableObjectNamespace,
  };
  return { env, stubs: () => stubs, fetches: () => fetches };
}

describe('doFetch transient DO failures (#862)', () => {
  const lost = () => doError('Network connection lost.', { retryable: true });

  it('retries a retryable GET once on a fresh stub and returns the retry response', async () => {
    const { env, stubs, fetches } = makeScriptedEnv([lost(), 'second']);
    const res = await doFetch(env, 'r', '/_do/csv.json');
    expect(await res.text()).toBe('second');
    expect(fetches()).toBe(2);
    expect(stubs()).toBe(2);
  });

  it('retries HEAD and lowercase get the same way', async () => {
    for (const method of ['HEAD', 'get']) {
      const { env, fetches } = makeScriptedEnv([lost(), 'ok']);
      const res = await doFetch(env, 'r', '/_do/exists', { method });
      expect(res.status).toBe(200);
      expect(fetches()).toBe(2);
    }
  });

  it('does not retry a write; throws DoUnavailableError carrying the cause', async () => {
    const cause = lost();
    const { env, fetches } = makeScriptedEnv([cause, 'never']);
    const err = await doFetch(env, 'r', '/_do/commands', { method: 'POST', body: 'x' }).catch(
      (e: unknown) => e,
    );
    expect(err).toBeInstanceOf(DoUnavailableError);
    expect((err as Error).cause).toBe(cause);
    expect(fetches()).toBe(1);
  });

  it('does not retry an overloaded or non-retryable failure', async () => {
    for (const cause of [
      doError('overloaded', { retryable: true, overloaded: true }),
      doError('internal error'),
    ]) {
      const { env, fetches } = makeScriptedEnv([cause, 'never']);
      const err = await doFetch(env, 'r', '/_do/csv.json').catch((e: unknown) => e);
      expect(err).toBeInstanceOf(DoUnavailableError);
      expect((err as Error).cause).toBe(cause);
      expect(fetches()).toBe(1);
    }
  });

  it('wraps a non-object throw as DoUnavailableError', async () => {
    const { env } = makeScriptedEnv([42]);
    const err = await doFetch(env, 'r', '/_do/csv.json').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(DoUnavailableError);
    expect((err as Error).cause).toBe(42);
  });

  it('rethrows an exception raised by RoomDO code itself, untouched and unretried', async () => {
    const remote = doError('TypeError: v.replace is not a function', {
      remote: true,
      retryable: true,
    });
    const { env, fetches } = makeScriptedEnv([remote, 'never']);
    await expect(doFetch(env, 'r', '/_do/html')).rejects.toBe(remote);
    expect(fetches()).toBe(1);
  });

  it('throws DoUnavailableError with the second cause when the retry also fails', async () => {
    const second = lost();
    const { env, fetches } = makeScriptedEnv([lost(), second]);
    const err = await doFetch(env, 'r', '/_do/csv.json').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(DoUnavailableError);
    expect((err as Error).cause).toBe(second);
    expect(fetches()).toBe(2);
  });

  it('rethrows a remote exception from the retry untouched', async () => {
    const remote = doError('boom', { remote: true });
    const { env } = makeScriptedEnv([lost(), remote]);
    await expect(doFetch(env, 'r', '/_do/csv.json')).rejects.toBe(remote);
  });

  it('DoUnavailableError is a named Error', () => {
    const err = new DoUnavailableError('c');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('DoUnavailableError');
    expect(err.message).toBe('Durable Object unavailable');
    expect(err.cause).toBe('c');
  });

  it('doUnavailableResponse maps DoUnavailableError to a retryable 503 and ignores other errors', async () => {
    const res = doUnavailableResponse(new DoUnavailableError(null));
    expect(res?.status).toBe(503);
    expect(res?.headers.get('Retry-After')).toBe('1');
    expect(res?.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
    expect(await res?.text()).toBe('Service temporarily unavailable');
    expect(doUnavailableResponse(new Error('other'))).toBeNull();
    expect(doUnavailableResponse('x')).toBeNull();
  });
});
