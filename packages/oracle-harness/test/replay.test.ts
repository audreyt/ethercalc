import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { encodeBase64 } from '../src/matchers.ts';
import {
  listRecordedFiles,
  parseRecordedFile,
  replayAll,
  replayOne,
} from '../src/replay.ts';
import type { HttpScenario } from '@ethercalc/shared/oracle-scenarios';

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

  it('throws when the scenario kind is missing', () => {
    expect(() => parseRecordedFile('{"scenario":{"name":"x","kind":"ws"}}')).toThrow(/http scenario/);
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
    expect(sawHeaders).toEqual({ Accept: 'text/plain' });
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
