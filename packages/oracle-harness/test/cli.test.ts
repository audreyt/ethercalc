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
    // Stub the global fetch so the real recordAll does no network I/O.
    const originalFetch = globalThis.fetch;
    (globalThis as { fetch: typeof fetch }).fetch = async () =>
      new Response('', { status: 200, headers: { 'content-type': 'text/plain' } });
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
      const names = await readdir(dir);
      expect(names.length).toBeGreaterThan(0);
    } finally {
      (globalThis as { fetch: typeof fetch }).fetch = originalFetch;
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
