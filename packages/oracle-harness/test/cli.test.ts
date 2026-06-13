import { describe, expect, it } from 'vitest';

import {
  DEFAULT_RECORDED_DIR,
  DEFAULT_TARGET,
  main,
  parseArgs,
} from '../src/cli.ts';
import { recordAll } from '../src/record.ts';
import type { IoClientLike } from '../src/ws-transport.ts';
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

  it('falls back to recordAll when record dep is omitted', async () => {
    const stubFetch: typeof fetch = async () =>
      new Response('[]', {
        status: 200,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'content-length': '2',
        },
      });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = stubFetch;

    const { mkdtemp, rm } = await import('node:fs/promises');
    const { tmpdir: tmpd } = await import('node:os');
    const { join: pathJoin } = await import('node:path');
    const dir = await mkdtemp(pathJoin(tmpd(), 'oracle-harness-main-record-'));
    try {
      const code = await main(['record', '--out', dir], {
        log: () => {},
        scenarios: [
          {
            name: 'rooms-index/get-rooms-empty',
            kind: 'http',
            request: { method: 'GET', path: '/_rooms' },
          },
        ],
      });
      expect(code).toBe(0);
    } finally {
      globalThis.fetch = originalFetch;
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('falls back to the bundled scenarios when deps are empty', async () => {
    // Shared `data` bus across every client the factory hands out, so a
    // frame emitted by one peer reaches the others' listeners — this is
    // what lets the multi-client broadcast verbs (chat / my.ecell / ecell /
    // ask.ecell / stopHuddle) resolve their peer-side `expect` steps, while
    // the reply-only verbs (ask.log / ask.ecells / ask.recalc) still satisfy
    // the sender. The double mirrors the documented server replies in
    // `src/lib/ws-handlers.ts`.
    const dataBus = new Set<(...args: unknown[]) => void>();
    const fanout = (reply: unknown): void => {
      queueMicrotask(() => {
        for (const fn of dataBus) fn(reply);
      });
    };
    const replyFor = (msg: { type?: string; room?: string }): unknown | null => {
      switch (msg.type) {
        case 'ask.log':
          return { type: 'log', room: msg.room, log: [], chat: [], snapshot: '' };
        case 'ask.ecells':
          return { type: 'ecells', room: msg.room, ecells: {} };
        case 'ask.recalc':
          return { type: 'recalc', room: msg.room, log: [], snapshot: '' };
        // Broadcast verbs: echo the server-shaped frame back onto the bus so
        // the peer client observes it. We forward the original payload, which
        // already carries every field the `expect` asserts.
        case 'chat':
        case 'my.ecell':
        case 'ecell':
        case 'ask.ecell':
        case 'stopHuddle':
          return msg;
        default:
          return null;
      }
    };
    const mockIoClientFactory = (): IoClientLike => {
      const localData = new Set<(...args: unknown[]) => void>();
      return {
        connected: true,
        on(event, fn) {
          if (event === 'connect') {
            queueMicrotask(() => fn());
            return;
          }
          if (event === 'data') {
            localData.add(fn);
            dataBus.add(fn);
          }
        },
        emit(event, ...args) {
          if (event !== 'data') return;
          const msg = args[0];
          if (!msg || typeof msg !== 'object') return;
          const reply = replyFor(msg as { type?: string; room?: string });
          if (reply !== null) fanout(reply);
        },
        disconnect() {},
        removeAllListeners() {
          for (const fn of localData) dataBus.delete(fn);
          localData.clear();
        },
      };
    };

    const originalFetch = globalThis.fetch;
    const stubFetch: typeof fetch = async () =>
      new Response('', { status: 200, headers: { 'content-type': 'text/plain' } });
    globalThis.fetch = stubFetch;

    const { mkdtemp, rm, readdir } = await import('node:fs/promises');
    const { tmpdir: tmpd } = await import('node:os');
    const { join: pathJoin } = await import('node:path');
    const dir = await mkdtemp(pathJoin(tmpd(), 'oracle-harness-main-default-'));
    const logs: string[] = [];
    try {
      const code = await main(['record', '--out', dir], {
        log: (line) => logs.push(line),
        record: (scenarios, opts) =>
          recordAll(scenarios, {
            ...opts,
            fetcher: stubFetch,
            ioClientFactory: mockIoClientFactory,
          }),
      });
      expect(code).toBe(0);
      const names = await readdir(dir, { recursive: true });
      expect(names.length).toBeGreaterThan(0);
    } finally {
      globalThis.fetch = originalFetch;
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
