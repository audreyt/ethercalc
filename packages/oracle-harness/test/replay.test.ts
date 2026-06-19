import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { encodeBase64 } from '../src/matchers.ts';
import {
  listRecordedFiles,
  parseRecordedFile,
  parseRecordedFileName,
  replayAll,
  replayOne,
  replayWsOne,
  sortRecordedByScenarioOrder,
} from '../src/replay.ts';
import * as wsRunner from '../src/ws-runner.ts';
import { ALL_SCENARIOS } from '../src/scenarios/index.ts';
import type { HttpScenario, WsScenario } from '@ethercalc/shared/oracle-scenarios';
import { stubIoClient, stubWsFactory } from './ws-mock.ts';

function mkRecording(overrides: Partial<HttpScenario> = {}): HttpScenario {
  const base: HttpScenario = {
    name: 'static/sample',
    kind: 'http',
    request: { method: 'GET', path: '/sample' },
    expect: {
      status: 200,
      headers: { 'content-type': 'text/plain' },
      bodyBase64: encodeBase64(new TextEncoder().encode('hi')),
      bodyMatcher: 'exact',
    },
  };
  return { ...base, ...overrides };
}

describe('listRecordedFiles', () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'oracle-harness-replay-'));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('finds nested .json files and ignores others', async () => {
    await mkdir(join(dir, 'a', 'b'), { recursive: true });
    await writeFile(join(dir, 'a', 'one.json'), '{}', 'utf8');
    await writeFile(join(dir, 'a', 'b', 'two.json'), '{}', 'utf8');
    await writeFile(join(dir, 'a', 'skipme.txt'), 'ignored', 'utf8');
    const files = await listRecordedFiles(dir);
    const sorted = [...files].sort();
    expect(sorted).toEqual([join(dir, 'a', 'b', 'two.json'), join(dir, 'a', 'one.json')].sort());
  });
});

describe('parseRecordedFile', () => {
  it('parses a well-formed artifact', () => {
    const file = JSON.stringify({ scenario: mkRecording() });
    expect(parseRecordedFile(file).scenario.name).toBe('static/sample');
  });

  it('parses a recorded ws artifact', () => {
    const ws: WsScenario = {
      name: 'ws/connect',
      kind: 'ws',
      steps: [
        { type: 'connect', url: '/_ws/r?user=u' },
        { type: 'expect', msg: { type: 'ignore' } },
      ],
    };
    expect(parseRecordedFile(JSON.stringify({ scenario: ws })).scenario.name).toBe('ws/connect');
  });

  it('throws when ws scenario has no steps', () => {
    const ws: WsScenario = { name: 'ws/connect', kind: 'ws', steps: [] };
    expect(() => parseRecordedFile(JSON.stringify({ scenario: ws }))).toThrow(/no recorded ws/);
  });

  it('throws when scenario is missing entirely', () => {
    expect(() => parseRecordedFile('{}')).toThrow(/no scenario/);
  });

  it('throws when expect is missing', () => {
    const broken = {
      scenario: {
        name: 'x',
        kind: 'http',
        request: { method: 'GET', path: '/' },
      },
    };
    expect(() => parseRecordedFile(JSON.stringify(broken))).toThrow(/no recorded expectation/);
  });
});

describe('replayOne', () => {
  it('returns ok on an exact body+header+status match', async () => {
    const scenario = mkRecording();
    const r = await replayOne(scenario, {
      targetUrl: 'http://target.test',
      recordedDir: '',
      fetcher: async () =>
        new Response('hi', { status: 200, headers: { 'content-type': 'text/plain' } }),
    });
    expect(r.ok).toBe(true);
  });

  it('returns failure when scenario has no expect', async () => {
    const scenario = mkRecording();
    // Manually drop expect.
    const bare: HttpScenario = {
      name: scenario.name,
      kind: scenario.kind,
      request: scenario.request,
    };
    const r = await replayOne(bare, {
      targetUrl: 'http://target.test',
      recordedDir: '',
      fetcher: async () => new Response(''),
    });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/no `expect`/);
  });

  it('reports a status mismatch', async () => {
    const scenario = mkRecording();
    const r = await replayOne(scenario, {
      targetUrl: 'http://target.test',
      recordedDir: '',
      fetcher: async () => new Response('hi', { status: 500 }),
    });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/status/);
  });

  it('reports a header mismatch', async () => {
    const scenario = mkRecording();
    const r = await replayOne(scenario, {
      targetUrl: 'http://target.test',
      recordedDir: '',
      fetcher: async () =>
        new Response('hi', { status: 200, headers: { 'content-type': 'text/html' } }),
    });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/content-type/);
  });

  it('reports a body mismatch', async () => {
    const scenario = mkRecording();
    const r = await replayOne(scenario, {
      targetUrl: 'http://target.test',
      recordedDir: '',
      fetcher: async () =>
        new Response('hullo', { status: 200, headers: { 'content-type': 'text/plain' } }),
    });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/length differs/);
  });

  it('forwards request headers to the target', async () => {
    const scenario = mkRecording({
      request: { method: 'GET', path: '/x', headers: { Accept: 'text/plain' } },
      expect: {
        status: 200,
        headers: {},
        bodyBase64: encodeBase64(new Uint8Array()),
        bodyMatcher: 'ignore',
      },
    });
    let sawHeaders: RequestInit['headers'];
    const fetcher: typeof fetch = async (_url, init) => {
      sawHeaders = init?.headers;
      return new Response('');
    };
    await replayOne(scenario, { targetUrl: 'http://target.test', recordedDir: '', fetcher });
    expect(sawHeaders).toMatchObject({ Accept: 'text/plain' });
  });

  it('forwards request bodyBase64 to the target', async () => {
    const body = encodeBase64(new TextEncoder().encode('payload'));
    const scenario = mkRecording({
      request: {
        method: 'PUT',
        path: '/_/room',
        headers: { 'Content-Type': 'text/plain' },
        bodyBase64: body,
      },
      expect: {
        status: 201,
        headers: {},
        bodyBase64: encodeBase64(new TextEncoder().encode('OK')),
        bodyMatcher: 'exact',
      },
    });
    let sawBody: RequestInit['body'];
    const fetcher: typeof fetch = async (_url, init) => {
      sawBody = init?.body;
      return new Response('OK', { status: 201 });
    };
    await replayOne(scenario, { targetUrl: 'http://target.test', recordedDir: '', fetcher });
    expect(sawBody).toBeInstanceOf(Uint8Array);
    expect(new TextDecoder().decode(sawBody as Uint8Array)).toBe('payload');
  });

  it('falls back to the bundled defaultFetcher when none is injected', async () => {
    const originalFetch = globalThis.fetch;
    const scenario = mkRecording();
    (globalThis as { fetch: typeof fetch }).fetch = async () =>
      new Response('hi', { status: 200, headers: { 'content-type': 'text/plain' } });
    try {
      const r = await replayOne(scenario, {
        targetUrl: 'http://target.test',
        recordedDir: '',
      });
      expect(r.ok).toBe(true);
    } finally {
      (globalThis as { fetch: typeof fetch }).fetch = originalFetch;
    }
  });

  it('defaults to accept-encoding: identity to dodge Bun gzip-decompression flakes', async () => {
    // Nightly #70 (2026-06-19) crashed with `ZlibError fetching ...` when
    // wrangler's 404 for /etc/foo came back with `Content-Encoding: gzip`
    // and an empty body; Bun's auto-decompress threw at fetch time.
    // Asserting on the request default guards the regression.
    const scenario = mkRecording();
    let sawHeaders: RequestInit['headers'];
    const fetcher: typeof fetch = async (_url, init) => {
      sawHeaders = init?.headers;
      return new Response('hi', { status: 200, headers: { 'content-type': 'text/plain' } });
    };
    await replayOne(scenario, { targetUrl: 'http://target.test', recordedDir: '', fetcher });
    expect((sawHeaders as Record<string, string>)['accept-encoding']).toBe('identity');
  });

  it('lets scenario-supplied accept-encoding override the identity default', async () => {
    const scenario = mkRecording({
      request: { method: 'GET', path: '/x', headers: { 'accept-encoding': 'gzip' } },
    });
    let sawHeaders: RequestInit['headers'];
    const fetcher: typeof fetch = async (_url, init) => {
      sawHeaders = init?.headers;
      return new Response('hi', { status: 200, headers: { 'content-type': 'text/plain' } });
    };
    await replayOne(scenario, { targetUrl: 'http://target.test', recordedDir: '', fetcher });
    expect((sawHeaders as Record<string, string>)['accept-encoding']).toBe('gzip');
  });

  it('reports fetch failures without crashing the replay run', async () => {
    const scenario = mkRecording();
    const r = await replayOne(scenario, {
      targetUrl: 'http://target.test',
      recordedDir: '',
      fetcher: async () => {
        throw new Error('ZlibError: bad gzip body');
      },
    });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/fetch failed: ZlibError/);
  });

  it('reports body read failures', async () => {
    const scenario = mkRecording();
    const r = await replayOne(scenario, {
      targetUrl: 'http://target.test',
      recordedDir: '',
      fetcher: async () =>
        ({
          status: 200,
          headers: new Headers({ 'content-type': 'text/plain' }),
          arrayBuffer: async () => {
            throw new Error('zlib error');
          },
        }) as unknown as Response,
    });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/body read failed: zlib error/);
  });

  it('defaults to the exact matcher when none recorded', async () => {
    const scenario = mkRecording({
      expect: {
        status: 200,
        headers: {},
        bodyBase64: encodeBase64(new TextEncoder().encode('hi')),
      },
    });
    const r = await replayOne(scenario, {
      targetUrl: 'http://target.test',
      recordedDir: '',
      fetcher: async () => new Response('hi', { status: 200 }),
    });
    expect(r.ok).toBe(true);
  });
});

describe('replayWsOne', () => {
  it('replays a ws scenario via the runner', async () => {
    const scenario: WsScenario = {
      name: 'ws/connect',
      kind: 'ws',
      steps: [
        { type: 'connect', url: '/_ws/r?user=u&auth=0' },
        { type: 'close' },
      ],
    };
    const result = await replayWsOne(scenario, {
      targetUrl: 'http://target.test',
      recordedDir: '',
      wsTransport: 'native',
      wsFactory: stubWsFactory(),
    });
    expect(result.ok).toBe(true);
  });

  it('defaults wsTransport to native when replaying', async () => {
    const scenario: WsScenario = {
      name: 'ws/connect',
      kind: 'ws',
      steps: [
        { type: 'connect', url: '/_ws/r?user=u&auth=0' },
        { type: 'close' },
      ],
    };
    const result = await replayWsOne(scenario, {
      targetUrl: 'http://target.test',
      recordedDir: '',
      wsFactory: stubWsFactory(),
    });
    expect(result.ok).toBe(true);
  });

  it('returns failure when the runner reports an error', async () => {
    const scenario: WsScenario = {
      name: 'ws/connect',
      kind: 'ws',
      steps: [
        { type: 'connect', url: '/_ws/r?user=u&auth=0' },
        { type: 'expect', msg: { type: 'log' }, timeoutMs: 20 },
      ],
    };
    const result = await replayWsOne(scenario, {
      targetUrl: 'http://target.test',
      recordedDir: '',
      wsTransport: 'native',
      wsFactory: stubWsFactory(),
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/timed out/);
  });

  it('replays with only required options', async () => {
    const scenario: WsScenario = {
      name: 'ws/connect',
      kind: 'ws',
      steps: [{ type: 'close' }],
    };
    const spy = vi.spyOn(wsRunner, 'runWsScenario').mockResolvedValueOnce({ ok: true });
    try {
      const result = await replayWsOne(scenario, {
        targetUrl: 'http://target.test',
        recordedDir: '',
      });
      expect(result.ok).toBe(true);
      expect(spy.mock.calls[0]![1]).not.toHaveProperty('fetcher');
      expect(spy.mock.calls[0]![1]).not.toHaveProperty('wsFactory');
      expect(spy.mock.calls[0]![1]).not.toHaveProperty('ioClientFactory');
    } finally {
      spy.mockRestore();
    }
  });

  it('returns failure without an error field when the runner omits one', async () => {
    const scenario: WsScenario = {
      name: 'ws/connect',
      kind: 'ws',
      steps: [{ type: 'connect', url: '/_ws/r?user=u&auth=0' }],
    };
    const spy = vi.spyOn(wsRunner, 'runWsScenario').mockResolvedValueOnce({ ok: false });
    try {
      const result = await replayWsOne(scenario, {
        targetUrl: 'http://target.test',
        recordedDir: '',
        fetcher: async () => new Response(''),
        wsFactory: stubWsFactory(),
        ioClientFactory: stubIoClient().factory,
      });
      expect(result.ok).toBe(false);
      expect(result.error).toBeUndefined();
    } finally {
      spy.mockRestore();
    }
  });
});

describe('sortRecordedByScenarioOrder', () => {
  it('orders files by ALL_SCENARIOS rank', () => {
    const files = [
      '/rec/exports/get-csv.json',
      '/rec/static/get-root-index.json',
      '/rec/room-crud/put-export-room.json',
    ];
    const sorted = sortRecordedByScenarioOrder(files, ALL_SCENARIOS);
    expect(sorted.map(parseRecordedFileName)).toEqual([
      'static/get-root-index',
      'room-crud/put-export-room',
      'exports/get-csv',
    ]);
  });

  it('extracts scenario names from nested paths', () => {
    expect(parseRecordedFileName('/a/b/misc/get-new-redirect.json')).toBe(
      'misc/get-new-redirect',
    );
  });

  it('extracts scenario names from flat paths', () => {
    expect(parseRecordedFileName('orphan.json')).toBe('orphan');
  });

  it('handles edge-case paths without a family directory', () => {
    expect(parseRecordedFileName('/')).toBe('');
  });

  it('sorts unknown files after catalogued ones and lexicographically among themselves', () => {
    const files = [
      '/rec/custom/zzz.json',
      '/rec/static/get-root-index.json',
      '/rec/custom/aaa.json',
    ];
    const sorted = sortRecordedByScenarioOrder(files, ALL_SCENARIOS);
    expect(sorted.map(parseRecordedFileName)).toEqual([
      'static/get-root-index',
      'custom/aaa',
      'custom/zzz',
    ]);
  });

  it('places a single known file before unknown files', () => {
    const files = ['/rec/custom/extra.json', '/rec/misc/get-new-redirect.json'];
    const sorted = sortRecordedByScenarioOrder(files, ALL_SCENARIOS);
    expect(sorted.map(parseRecordedFileName)).toEqual(['misc/get-new-redirect', 'custom/extra']);
  });
});

describe('replayAll', () => {
  it('works without a logger', async () => {
    const results = await replayAll({
      targetUrl: 'http://target.test',
      recordedDir: '/virtual',
      listFiles: async () => ['/a.json'],
      readFile: async () => JSON.stringify({ scenario: mkRecording() }),
      fetcher: async () =>
        new Response('hi', { status: 200, headers: { 'content-type': 'text/plain' } }),
    });
    expect(results).toHaveLength(1);
    expect(results[0]!.ok).toBe(true);
  });

  it('uses the default file lister + reader when none is injected', async () => {
    const { mkdtemp, rm, mkdir, writeFile } = await import('node:fs/promises');
    const { join: pathJoin } = await import('node:path');
    const { tmpdir: tmpd } = await import('node:os');
    const dir = await mkdtemp(pathJoin(tmpd(), 'oracle-harness-default-'));
    try {
      await mkdir(pathJoin(dir, 'group'), { recursive: true });
      const sc = JSON.stringify({ scenario: mkRecording({ name: 'group/thing' }) });
      await writeFile(pathJoin(dir, 'group', 'thing.json'), sc, 'utf8');
      const results = await replayAll({
        targetUrl: 'http://target.test',
        recordedDir: dir,
        fetcher: async () =>
          new Response('hi', { status: 200, headers: { 'content-type': 'text/plain' } }),
      });
      expect(results).toHaveLength(1);
      expect(results[0]!.ok).toBe(true);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('replays ws artifacts from disk', async () => {
    const ws: WsScenario = {
      name: 'ws/connect',
      kind: 'ws',
      steps: [
        { type: 'connect', url: '/_ws/r?user=u&auth=0' },
        { type: 'close' },
      ],
    };
    const results = await replayAll({
      targetUrl: 'http://target.test',
      recordedDir: '/virtual',
      listFiles: async () => ['/ws.json'],
      readFile: async () => JSON.stringify({ scenario: ws }),
      wsTransport: 'native',
      wsFactory: stubWsFactory(),
    });
    expect(results[0]!.ok).toBe(true);
  });

  it('iterates over recorded files, logs outcomes, and returns results', async () => {
    const good = mkRecording({ name: 'static/good' });
    const bad = mkRecording({
      name: 'static/bad',
      expect: {
        status: 500,
        headers: {},
        bodyBase64: encodeBase64(new TextEncoder().encode('hi')),
        bodyMatcher: 'exact',
      },
    });
    const logs: string[] = [];
    const results = await replayAll({
      targetUrl: 'http://target.test',
      recordedDir: '/virtual',
      listFiles: async () => ['/a.json', '/b.json'],
      readFile: async (p) =>
        p === '/a.json'
          ? JSON.stringify({ scenario: good })
          : JSON.stringify({ scenario: bad }),
      fetcher: async () =>
        new Response('hi', { status: 200, headers: { 'content-type': 'text/plain' } }),
      log: (line) => logs.push(line),
    });
    expect(results).toHaveLength(2);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(logs.some((l) => l.includes('ok  static/good'))).toBe(true);
    expect(logs.some((l) => l.includes('FAIL static/bad'))).toBe(true);
  });
});
