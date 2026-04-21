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
  it('flushes one seed PUT on setRoomIndex with skipIndex:true, queues index', async () => {
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

    // Only the seed PUT — the index write is queued until flush() /
    // batch threshold.
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
      skipIndex: true,
    });

    // Flushing drains the one queued (room, updatedAt) pair through
    // /_migrate/bulk-index.
    await target.flush();
    expect(calls).toHaveLength(2);
    const b = calls[1]!;
    expect(b.url).toBe('http://127.0.0.1:8000/_migrate/bulk-index');
    expect(b.method).toBe('PUT');
    expect(b.body).toEqual({ rooms: [{ room: 'room-a', updatedAt: 1700 }] });
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

  it('composes with applyRoomStream — seed PUTs + batched bulk-index tail', async () => {
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
    // Two seed PUTs + one bulk-index PUT at end-of-run.
    expect(calls).toHaveLength(3);
    expect(calls[0]!.url).toBe('http://127.0.0.1:8000/_migrate/seed/alpha');
    expect(calls[1]!.url).toBe('http://127.0.0.1:8000/_migrate/seed/beta');
    expect(calls[2]!.url).toBe('http://127.0.0.1:8000/_migrate/bulk-index');
    expect(calls[2]!.body).toEqual({
      rooms: [
        { room: 'alpha', updatedAt: 1 },
        { room: 'beta', updatedAt: 2 },
      ],
    });
  });

  it('flushes bulk-index on batch-size threshold without waiting for flush()', async () => {
    const { fetch, calls } = captureFetch();
    const target = new HttpTarget({
      baseUrl: 'http://127.0.0.1:8000',
      token: 'abc',
      fetch,
      bulkIndexBatchSize: 2,
    });
    // 3 rooms + batch size 2 → bulk-index fires on room 2, leaves 1 in
    // the queue for flush().
    for (const n of ['r1', 'r2', 'r3']) {
      await target.putSnapshot(n, 'S');
      await target.setRoomIndex(n, Number(n.slice(1)));
    }
    // 3 seeds + 1 mid-stream bulk-index.
    expect(calls.map((c) => c.url)).toEqual([
      'http://127.0.0.1:8000/_migrate/seed/r1',
      'http://127.0.0.1:8000/_migrate/seed/r2',
      'http://127.0.0.1:8000/_migrate/bulk-index',
      'http://127.0.0.1:8000/_migrate/seed/r3',
    ]);
    expect(calls[2]!.body).toEqual({
      rooms: [
        { room: 'r1', updatedAt: 1 },
        { room: 'r2', updatedAt: 2 },
      ],
    });
    await target.flush();
    expect(calls).toHaveLength(5);
    expect(calls[4]!.url).toBe('http://127.0.0.1:8000/_migrate/bulk-index');
    expect(calls[4]!.body).toEqual({
      rooms: [{ room: 'r3', updatedAt: 3 }],
    });
  });

  it('skipBulkIndex suppresses both the queued flushes and the final flush()', async () => {
    const { fetch, calls } = captureFetch();
    const target = new HttpTarget({
      baseUrl: 'http://127.0.0.1:8000',
      token: 'abc',
      fetch,
      skipBulkIndex: true,
      bulkIndexBatchSize: 1, // would normally flush after every room
    });
    for (const n of ['a', 'b', 'c']) {
      await target.putSnapshot(n, 'S');
      await target.setRoomIndex(n, 1);
    }
    await target.flush();
    // Three seed PUTs + ZERO bulk-index calls even with batch size 1
    // and an explicit final flush.
    expect(calls.map((c) => c.url)).toEqual([
      'http://127.0.0.1:8000/_migrate/seed/a',
      'http://127.0.0.1:8000/_migrate/seed/b',
      'http://127.0.0.1:8000/_migrate/seed/c',
    ]);
    // Seed body still carries skipIndex: true — the DO side must also
    // avoid mirroring when our side is about to skip the bulk-index.
    for (const c of calls) {
      const body = c.body as Record<string, unknown>;
      expect(body.skipIndex).toBe(true);
    }
  });

  it('flush() is a no-op when the queue is empty', async () => {
    const { fetch, calls } = captureFetch();
    const target = new HttpTarget({
      baseUrl: 'http://127.0.0.1:8000',
      token: 'abc',
      fetch,
    });
    await target.flush();
    expect(calls).toHaveLength(0);
  });

  it('drains the response body on success (falls back to arrayBuffer when body.cancel absent)', async () => {
    const cancelCalls: number[] = [];
    const arrayBufferCalls: number[] = [];
    let n = 0;
    // Build three Response shapes the drain() helper has to handle:
    //   1. body with cancel()  — typical Bun/undici path
    //   2. body without cancel — must fall through to arrayBuffer()
    //   3. body === null       — must go straight to the fallback too
    const fetch: FetchLike = async () => {
      n += 1;
      if (n === 1) {
        // Standard Response — body is a ReadableStream with cancel().
        return new Response('OK', { status: 201 });
      }
      if (n === 2) {
        // Monkey-patched to drop cancel() so drain() uses arrayBuffer().
        const res = new Response('OK', { status: 201 });
        Object.defineProperty(res, 'body', {
          value: { cancel: undefined }, // no cancel method → typeof !== 'function'
        });
        const origAB = res.arrayBuffer.bind(res);
        res.arrayBuffer = async () => {
          arrayBufferCalls.push(n);
          return origAB();
        };
        return res;
      }
      // null body — e.g. 204 No Content. drain() hits the arrayBuffer branch.
      const res = new Response(null, { status: 201 });
      const origAB = res.arrayBuffer.bind(res);
      res.arrayBuffer = async () => {
        arrayBufferCalls.push(n);
        return origAB();
      };
      return res;
    };

    const target = new HttpTarget({
      baseUrl: 'http://127.0.0.1:8000',
      token: 'abc',
      fetch,
    });
    // Three seed PUTs → three drain() calls.
    for (const name of ['a', 'b', 'c']) {
      await target.putSnapshot(name, 'S');
      await target.setRoomIndex(name, 1);
    }
    // Both monkey-patched paths reached arrayBuffer; the first went
    // through body.cancel() (uninstrumented but proven by the absence
    // from arrayBufferCalls).
    expect(arrayBufferCalls).toEqual([2, 3]);
    expect(cancelCalls).toEqual([]); // no-op — cancel itself we can't instrument post-hoc
  });

  it('drain swallows errors thrown by body.cancel()', async () => {
    // Covers the catch in drain(): if cancel() throws we log nothing
    // and move on — the caller has already succeeded from its POV.
    const fetch: FetchLike = async () => {
      const res = new Response('OK', { status: 201 });
      Object.defineProperty(res, 'body', {
        value: {
          cancel: () => {
            throw new Error('stream already closed');
          },
        },
      });
      return res;
    };
    const target = new HttpTarget({
      baseUrl: 'http://127.0.0.1:8000',
      token: 'abc',
      fetch,
    });
    await target.putSnapshot('a', 'S');
    // Must not throw — drain() catches and swallows.
    await expect(target.setRoomIndex('a', 1)).resolves.toBeUndefined();
  });

  it('throws when the bulk-index endpoint returns non-2xx', async () => {
    let call = 0;
    const fetch: FetchLike = async () => {
      call += 1;
      if (call === 1) return new Response('OK', { status: 201 });
      return new Response('rooms[].updatedAt must be a finite number', {
        status: 400,
      });
    };
    const target = new HttpTarget({
      baseUrl: 'http://127.0.0.1:8000',
      token: 'abc',
      fetch,
    });
    await target.putSnapshot('room-z', 'S');
    await target.setRoomIndex('room-z', 1);
    await expect(target.flush()).rejects.toThrow(/bulk-index 1 rows failed: 400/);
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
