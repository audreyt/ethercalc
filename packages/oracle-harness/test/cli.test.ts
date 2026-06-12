import { describe, expect, it } from 'vitest';

import {
  DEFAULT_RECORDED_DIR,
  DEFAULT_TARGET,
  main,
  parseArgs,
} from '../src/cli.ts';
import type { RecordResult } from '../src/record.ts';
import type { ReplayResult } from '../src/replay.ts';
import type { HttpScenario } from '@ethercalc/shared/oracle-scenarios';

describe('parseArgs', () => {
  it('returns defaults for record with no flags', () => {
    expect(parseArgs(['record'])).toEqual({
      command: 'record',
      targetUrl: DEFAULT_TARGET,
      dir: DEFAULT_RECORDED_DIR,
    });
  });

  it('returns defaults for replay with no flags', () => {
    expect(parseArgs(['replay'])).toEqual({
      command: 'replay',
      targetUrl: DEFAULT_TARGET,
      dir: DEFAULT_RECORDED_DIR,
    });
  });

  it('parses --target', () => {
    expect(parseArgs(['record', '--target', 'http://x:1234']).targetUrl).toBe('http://x:1234');
  });

  it('parses --out for record', () => {
    expect(parseArgs(['record', '--out', 'custom']).dir).toBe('custom');
  });

  it('parses --recorded for replay', () => {
    expect(parseArgs(['replay', '--recorded', 'custom']).dir).toBe('custom');
  });

  it('parses --ws-transport', () => {
    expect(parseArgs(['replay', '--ws-transport', 'socketio']).wsTransport).toBe('socketio');
    expect(parseArgs(['replay', '--ws-transport', 'native']).wsTransport).toBe('native');
  });

  it('rejects invalid --ws-transport values', () => {
    expect(() => parseArgs(['replay', '--ws-transport', 'bogus'])).toThrow(
      /native, socketio, or socketio-v09/,
    );
  });

  it('rejects unknown subcommands', () => {
    expect(() => parseArgs(['serve'])).toThrow(/unknown command/);
  });

  it('rejects empty argv', () => {
    expect(() => parseArgs([])).toThrow(/unknown command/);
  });

  it('rejects --target with no value', () => {
    expect(() => parseArgs(['record', '--target'])).toThrow(/--target/);
  });

  it('rejects --out with no value', () => {
    expect(() => parseArgs(['record', '--out'])).toThrow(/--out/);
  });

  it('rejects --recorded with no value', () => {
    expect(() => parseArgs(['replay', '--recorded'])).toThrow(/--recorded/);
  });

  it('rejects unknown flags', () => {
    expect(() => parseArgs(['record', '--whatever'])).toThrow(/unknown flag/);
  });
});

describe('main', () => {
  const scenario: HttpScenario = {
    name: 'static/demo',
    kind: 'http',
    request: { method: 'GET', path: '/demo' },
  };

  it('record dispatches to the recorder and returns 0', async () => {
    const logs: string[] = [];
    const code = await main(['record', '--target', 'http://o', '--out', '/tmp/r'], {
      log: (line) => logs.push(line),
      record: async (scenarios, opts) => {
        expect(opts.targetUrl).toBe('http://o');
        expect(opts.outDir).toBe('/tmp/r');
        expect([...scenarios]).toEqual([scenario]);
        return [{ scenario, path: '/tmp/r/static/demo.json' }] as RecordResult[];
      },
      replay: async () => [],
      scenarios: [scenario],
    });
    expect(code).toBe(0);
    expect(logs.some((l) => l.includes('recorded 1 scenarios'))).toBe(true);
  });

  it('replay returns 0 when every result passes', async () => {
    const logs: string[] = [];
    const code = await main(['replay'], {
      log: (line) => logs.push(line),
      record: async () => [],
      replay: async (opts) => {
        expect(opts.targetUrl).toBe(DEFAULT_TARGET);
        expect(opts.recordedDir).toBe(DEFAULT_RECORDED_DIR);
        return [{ scenario, ok: true }] as ReplayResult[];
      },
    });
    expect(code).toBe(0);
    expect(logs.some((l) => l.includes('1/1 passed'))).toBe(true);
  });

  it('record forwards --ws-transport to the recorder', async () => {
    const code = await main(['record', '--ws-transport', 'socketio'], {
      log: () => {},
      record: async (_scenarios, opts) => {
        expect(opts.wsTransport).toBe('socketio');
        return [];
      },
      replay: async () => [],
      scenarios: [],
    });
    expect(code).toBe(0);
  });

  it('replay forwards --ws-transport to the replayer', async () => {
    const code = await main(['replay', '--ws-transport', 'native'], {
      log: () => {},
      record: async () => [],
      replay: async (opts) => {
        expect(opts.wsTransport).toBe('native');
        return [{ scenario, ok: true }] as ReplayResult[];
      },
    });
    expect(code).toBe(0);
  });

  it('replay returns 1 if any result fails', async () => {
    const code = await main(['replay'], {
      log: () => {},
      record: async () => [],
      replay: async () =>
        [{ scenario, ok: false, error: 'boom' }] as ReplayResult[],
    });
    expect(code).toBe(1);
  });

  it('uses a default logger when none is injected', async () => {
    // Just make sure default logger path executes without error.
    const original = process.stdout.write.bind(process.stdout);
    const writes: string[] = [];
    (process.stdout as unknown as { write: typeof original }).write = ((line: string) => {
      writes.push(line);
      return true;
    }) as typeof original;
    try {
      await main(['replay'], {
        record: async () => [],
        replay: async () => [{ scenario, ok: true }] as ReplayResult[],
      });
    } finally {
      (process.stdout as unknown as { write: typeof original }).write = original;
    }
    expect(writes.join('')).toMatch(/1\/1 passed/);
  });

  it('falls back to the bundled record/replay + scenarios when deps are empty', async () => {
    // Stub fetch + WebSocket so the real recordAll does no network I/O.
    const originalFetch = globalThis.fetch;
    const g = globalThis as { fetch: typeof fetch; WebSocket?: unknown };
    const originalWs = g.WebSocket;
    class StubWebSocket {
      readyState = 1;
      private listeners = new Map<string, Array<(ev: { data?: string }) => void>>();
      send(data: string) {
        const packet = data.includes('"name":"data"') ? data : null;
        const payload =
          packet !== null
            ? (JSON.parse(packet.split(':').slice(3).join(':')) as { args: unknown[] }).args[0]
            : JSON.parse(data);
        if (
          payload &&
          typeof payload === 'object' &&
          (payload as { type?: string }).type === 'ask.log'
        ) {
          const reply = JSON.stringify({
            type: 'log',
            room: (payload as { room: string }).room,
            log: [],
            chat: [],
            snapshot: '',
          });
          const frame = packet !== null
            ? `5:::{"name":"data","args":[${reply}]}`
            : reply;
          queueMicrotask(() => {
            for (const fn of this.listeners.get('message') ?? []) fn({ data: frame });
          });
        }
      }
      close() {}
      addEventListener(type: string, fn: (ev: { data?: string }) => void) {
        const bucket = this.listeners.get(type) ?? [];
        bucket.push(fn);
        this.listeners.set(type, bucket);
        if (type === 'open') queueMicrotask(() => fn({}));
      }
      removeEventListener() {}
    }
    g.WebSocket = StubWebSocket as unknown as typeof WebSocket;
    g.fetch = async (url) => {
      if (String(url).includes('/socket.io/1/')) {
        return new Response('abc123:60:60:websocket,xhr-polling');
      }
      return new Response('', { status: 200, headers: { 'content-type': 'text/plain' } });
    };
    const { mkdtemp, rm, readdir } = await import('node:fs/promises');
    const { tmpdir: tmpd } = await import('node:os');
    const { join: pathJoin } = await import('node:path');
    const dir = await mkdtemp(pathJoin(tmpd(), 'oracle-harness-main-default-'));
    const logs: string[] = [];
    try {
      const code = await main(['record', '--out', dir], {
        log: (line) => logs.push(line),
      });
      expect(code).toBe(0);
      const names = await readdir(dir, { recursive: true });
      expect(names.length).toBeGreaterThan(0);
    } finally {
      g.fetch = originalFetch;
      g.WebSocket = originalWs;
      await rm(dir, { recursive: true, force: true });
    }
    expect(logs.some((l) => /recorded \d+ scenarios/.test(l))).toBe(true);
  });

  it('constructs default MainDeps when argument is omitted entirely', async () => {
    // Triggers the `deps: MainDeps = {}` branch. parseArgs will throw before
    // we reach the dispatch so we don't need to stub anything.
    await expect(main(['bogus'])).rejects.toThrow(/unknown command/);
  });
});
