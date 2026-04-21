/**
 * Unit tests for {@link HttpTarget} and {@link waitForHealth}. Exercises
 * every branch of the per-room buffering, payload shape, and the health
 * poll loop without any real sockets.
 */
import { describe, it, expect } from 'vitest';

import {
  HttpTarget,
  waitForHealth,
  type FetchLike,
  type WaitForHealthDeps,
} from '../../src/targets/http.ts';
import { applyRoomStream, type Room } from '../../src/apply.ts';

async function* fromArray(rooms: readonly Room[]): AsyncIterable<Room> {
  for (const r of rooms) yield r;
}

interface CapturedCall {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
}

function okJson(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 201,
    headers: { 'Content-Type': 'text/plain' },
  });
}

function captureFetch(): { fetch: FetchLike; calls: CapturedCall[] } {
  const calls: CapturedCall[] = [];
  const fetch: FetchLike = async (input, init) => {
    const headers: Record<string, string> = {};
    const rawH = init?.headers;
    if (rawH && typeof rawH === 'object') {
      for (const [k, v] of Object.entries(rawH)) {
        headers[k] = String(v);
      }
    }
    let body: unknown = init?.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        /* leave as string */
      }
    }
    calls.push({
      url: String(input),
      method: init?.method ?? 'GET',
      headers,
      body,
    });
    return okJson({ ok: true });
  };
  return { fetch, calls };
}

describe('HttpTarget', () => {
  it('flushes one PUT per room on setRoomIndex, with full payload', async () => {
    const { fetch, calls } = captureFetch();
    const target = new HttpTarget({
      baseUrl: 'http://127.0.0.1:8000',
      token: 'abc',
      fetch,
    });
    await target.putSnapshot('room-a', 'socialcalc:v1');
    await target.putLog('room-a', 1, 'cmd-1');
    await target.putLog('room-a', 2, 'cmd-2');
    await target.putAudit('room-a', 1, 'cmd-1');
    await target.putChat('room-a', 1, 'hello');
    await target.putEcell('room-a', 'alice', 'A1');
    await target.putEcell('room-a', 'bob', 'B2');
    expect(calls).toHaveLength(0); // buffered — nothing sent yet
    await target.setRoomIndex('room-a', 1700);

    expect(calls).toHaveLength(1);
    const c = calls[0]!;
    expect(c.url).toBe('http://127.0.0.1:8000/_migrate/seed/room-a');
    expect(c.method).toBe('PUT');
    expect(c.headers.Authorization).toBe('Bearer abc');
    expect(c.headers['Content-Type']).toBe('application/json');
    expect(c.body).toEqual({
      snapshot: 'socialcalc:v1',
      log: ['cmd-1', 'cmd-2'],
      audit: ['cmd-1'],
      chat: ['hello'],
      ecell: { alice: 'A1', bob: 'B2' },
      updatedAt: 1700,
    });
  });

  it('omits snapshot field when the room has no recorded snapshot', async () => {
    const { fetch, calls } = captureFetch();
    const target = new HttpTarget({
      baseUrl: 'http://127.0.0.1:8000/',
      token: 'abc',
      fetch,
    });
    await target.putLog('orphan', 1, 'cmd');
    await target.setRoomIndex('orphan', 0);
    expect(calls).toHaveLength(1);
    const body = calls[0]!.body as Record<string, unknown>;
    expect(body).not.toHaveProperty('snapshot');
    expect(body.log).toEqual(['cmd']);
    expect(body.updatedAt).toBe(0);
  });

  it('omits snapshot when the extractor passed an empty string', async () => {
    const { fetch, calls } = captureFetch();
    const target = new HttpTarget({
      baseUrl: 'http://127.0.0.1:8000',
      token: 'abc',
      fetch,
    });
    await target.putSnapshot('blank', '');
    await target.setRoomIndex('blank', 10);
    const body = calls[0]!.body as Record<string, unknown>;
    expect(body).not.toHaveProperty('snapshot');
  });

  it('URL-encodes the room name', async () => {
    const { fetch, calls } = captureFetch();
    const target = new HttpTarget({
      baseUrl: 'http://127.0.0.1:8000',
      token: 'abc',
      fetch,
    });
    await target.setRoomIndex('a b/c', 1);
    expect(calls[0]!.url).toBe('http://127.0.0.1:8000/_migrate/seed/a%20b%2Fc');
  });

  it('throws when the seed endpoint returns non-2xx', async () => {
    const fetch: FetchLike = async () =>
      new Response('log must be a string[]', { status: 400 });
    const target = new HttpTarget({
      baseUrl: 'http://127.0.0.1:8000',
      token: 'abc',
      fetch,
    });
    await target.putSnapshot('room-x', 'SAVE');
    await expect(target.setRoomIndex('room-x', 1)).rejects.toThrow(
      /seed room-x failed: 400/,
    );
  });

  it('handles .text() failures on the error path', async () => {
    const fetch: FetchLike = async () =>
      new Response(null, { status: 500 }) as Response & {
        text: () => Promise<string>;
      };
    // Force .text() to throw — matches a dead connection mid-stream.
    const wrapped: FetchLike = async (input, init) => {
      const res = await fetch(input, init);
      Object.defineProperty(res, 'text', {
        value: () => Promise.reject(new Error('stream closed')),
      });
      return res;
    };
    const target = new HttpTarget({
      baseUrl: 'http://127.0.0.1:8000',
      token: 'abc',
      fetch: wrapped,
    });
    await target.putSnapshot('room-y', 'SAVE');
    await expect(target.setRoomIndex('room-y', 1)).rejects.toThrow(
      /<unreadable body>/,
    );
  });

  it('composes with applyRoomStream — one PUT per room in order', async () => {
    const { fetch, calls } = captureFetch();
    const target = new HttpTarget({
      baseUrl: 'http://127.0.0.1:8000',
      token: 'abc',
      fetch,
    });
    const stats = await applyRoomStream(
      fromArray([
        {
          name: 'alpha',
          snapshot: 'SA',
          log: ['a1'],
          audit: ['a1'],
          chat: [],
          ecell: {},
          updatedAt: 1,
        },
        {
          name: 'beta',
          snapshot: 'SB',
          log: [],
          audit: [],
          chat: ['hi'],
          ecell: { u: 'A1' },
          updatedAt: 2,
        },
      ]),
      target,
    );
    expect(stats.rooms).toBe(2);
    expect(calls).toHaveLength(2);
    expect(calls[0]!.url).toBe('http://127.0.0.1:8000/_migrate/seed/alpha');
    expect(calls[1]!.url).toBe('http://127.0.0.1:8000/_migrate/seed/beta');
  });

  it('default config routes through globalThis.fetch', async () => {
    // Covers the `config.fetch ?? ((input, init) => fetch(input, init))`
    // default closure — the only way to hit it is to flush without
    // injecting a fetch and capture the global call.
    const calls: string[] = [];
    const original = globalThis.fetch;
    try {
      globalThis.fetch = (async (url: unknown) => {
        calls.push(String(url));
        return new Response('OK', { status: 201 });
      }) as typeof fetch;
      const t = new HttpTarget({
        baseUrl: 'http://127.0.0.1:8000',
        token: 'abc',
      });
      await t.putSnapshot('x', 'S');
      await t.setRoomIndex('x', 1);
    } finally {
      globalThis.fetch = original;
    }
    expect(calls).toEqual(['http://127.0.0.1:8000/_migrate/seed/x']);
  });
});

describe('waitForHealth', () => {
  function fixedTime(start: number): { now: () => number; advance: (n: number) => void } {
    let t = start;
    return {
      now: () => t,
      advance: (n) => {
        t += n;
      },
    };
  }

  it('returns true on the first successful response', async () => {
    const calls: string[] = [];
    const deps: WaitForHealthDeps = {
      fetch: async (url) => {
        calls.push(url);
        return new Response('OK', { status: 200 });
      },
      now: () => 0,
      sleep: async () => {
        /* never reached */
      },
    };
    expect(await waitForHealth('http://127.0.0.1:8000/', 1000, deps)).toBe(true);
    expect(calls).toEqual(['http://127.0.0.1:8000/_health']);
  });

  it('retries past non-2xx responses then succeeds', async () => {
    const clock = fixedTime(0);
    let attempt = 0;
    const deps: WaitForHealthDeps = {
      fetch: async () => {
        attempt += 1;
        return new Response('warming', {
          status: attempt < 3 ? 503 : 200,
        });
      },
      now: clock.now,
      sleep: async (ms) => {
        clock.advance(ms);
      },
    };
    expect(await waitForHealth('http://127.0.0.1:8000', 10_000, deps)).toBe(true);
    expect(attempt).toBe(3);
  });

  it('retries past thrown fetch errors (socket not ready)', async () => {
    const clock = fixedTime(0);
    let attempt = 0;
    const deps: WaitForHealthDeps = {
      fetch: async () => {
        attempt += 1;
        if (attempt < 2) throw new Error('ECONNREFUSED');
        return new Response('ok');
      },
      now: clock.now,
      sleep: async (ms) => {
        clock.advance(ms);
      },
    };
    expect(await waitForHealth('http://127.0.0.1:8000', 5_000, deps)).toBe(true);
  });

  it('returns false when the deadline elapses', async () => {
    const clock = fixedTime(0);
    const deps: WaitForHealthDeps = {
      fetch: async () => new Response('no', { status: 503 }),
      now: clock.now,
      sleep: async (ms) => {
        clock.advance(ms);
      },
    };
    expect(await waitForHealth('http://127.0.0.1:8000', 500, deps)).toBe(false);
  });
});
