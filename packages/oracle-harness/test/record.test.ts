import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  defaultFetcher,
  defaultMatcherForResponse,
  defaultWriter,
  encodeResponseBody,
  persistRecording,
  recordAll,
  recordOne,
  scenarioPath,
  type RecordedFile,
} from '../src/record.ts';
import type { HttpScenario, WsScenario } from '@ethercalc/shared/oracle-scenarios';
import { encodeBase64 } from '../src/matchers.ts';

describe('defaultFetcher', () => {
  it('delegates to the global fetch', async () => {
    const original = globalThis.fetch;
    let seen: unknown;
    (globalThis as { fetch: typeof fetch }).fetch = async (url, init) => {
      seen = { url, init };
      return new Response('stubbed', { status: 200 });
    };
    try {
      const r = await defaultFetcher('http://example.test/x', { method: 'GET' });
      expect(await r.text()).toBe('stubbed');
      expect(seen).toEqual({ url: 'http://example.test/x', init: { method: 'GET' } });
    } finally {
      (globalThis as { fetch: typeof fetch }).fetch = original;
    }
  });
});

describe('defaultWriter', () => {
  it('writes utf8 contents to disk', async () => {
    const dir = await import('node:fs/promises').then((m) =>
      m.mkdtemp(join(tmpdir(), 'oracle-harness-writer-')),
    );
    try {
      const path = join(dir, 'sample.txt');
      await defaultWriter(path, 'hello-writer');
      const got = await import('node:fs/promises').then((m) => m.readFile(path, 'utf8'));
      expect(got).toBe('hello-writer');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe('defaultMatcherForResponse', () => {
  it('uses ignore for redirects', () => {
    expect(defaultMatcherForResponse(302, { location: '/x' })).toBe('ignore');
  });

  it('uses ignore for 204 and 304', () => {
    expect(defaultMatcherForResponse(204, {})).toBe('ignore');
    expect(defaultMatcherForResponse(304, {})).toBe('ignore');
  });

  it('uses json for JSON content types', () => {
    expect(defaultMatcherForResponse(200, { 'content-type': 'application/json; charset=utf-8' })).toBe('json');
  });

  it('defaults to exact for unknown content types', () => {
    expect(defaultMatcherForResponse(200, { 'content-type': 'text/plain' })).toBe('exact');
    expect(defaultMatcherForResponse(200, {})).toBe('exact');
  });
});

describe('scenarioPath', () => {
  it('joins outDir with name and .json extension', () => {
    expect(scenarioPath('/tmp/r', 'static/foo')).toBe('/tmp/r/static/foo.json');
  });

  it('rejects path traversal', () => {
    expect(() => scenarioPath('/tmp/r', '../etc/passwd')).toThrow(/unsafe/);
    expect(() => scenarioPath('/tmp/r', '/abs/path')).toThrow(/unsafe/);
  });
});

describe('encodeResponseBody', () => {
  it('encodes bytes as base64', async () => {
    const r = new Response(new Uint8Array([65, 66, 67]));
    expect(await encodeResponseBody(r)).toBe('QUJD');
  });
});

describe('persistRecording', () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'oracle-harness-record-'));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('creates parent directories and writes formatted JSON', async () => {
    const target = join(dir, 'nested', 'one.json');
    const file: RecordedFile = {
      scenario: {
        name: 'nested/one',
        kind: 'http',
        request: { method: 'GET', path: '/' },
        expect: {
          status: 200,
          headers: { 'content-type': 'text/plain' },
          bodyBase64: encodeBase64(new TextEncoder().encode('hi')),
          bodyMatcher: 'exact',
        },
      },
    };
    const writes: Array<{ path: string; contents: string }> = [];
    await persistRecording(target, file, async (path, contents) => {
      writes.push({ path, contents });
    });
    expect(writes).toHaveLength(1);
    expect(writes[0]!.path).toBe(target);
    expect(JSON.parse(writes[0]!.contents)).toEqual(file);
    expect(writes[0]!.contents.endsWith('\n')).toBe(true);
  });
});

describe('recordOne / recordAll', () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'oracle-harness-record-'));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('captures status, normalized headers, and base64 body', async () => {
    const scenario: HttpScenario = {
      name: 'static/sample',
      kind: 'http',
      request: { method: 'GET', path: '/sample' },
    };
    const fetcher: typeof fetch = async (url) => {
      expect(String(url)).toBe('http://oracle.test/sample');
      return new Response('hello', {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          Date: 'Mon, 01 Jan 2026 00:00:00 GMT',
          Server: 'oracle',
        },
      });
    };
    const logs: string[] = [];
    const result = await recordOne(scenario, {
      targetUrl: 'http://oracle.test',
      outDir: dir,
      fetcher,
      log: (line) => logs.push(line),
    });
    expect(result.path).toBe(join(dir, 'static', 'sample.json'));
    expect(result.scenario.expect?.status).toBe(200);
    expect(result.scenario.expect?.headers).toEqual({ 'content-type': 'text/plain' });
    expect(result.scenario.expect?.bodyBase64).toBe(encodeBase64(new TextEncoder().encode('hello')));
    expect(result.scenario.expect?.bodyMatcher).toBe('exact');
    expect(logs).toEqual(['recorded static/sample → 200']);
    const onDisk = JSON.parse(await readFile(result.path, 'utf8'));
    expect(onDisk.scenario.expect.status).toBe(200);
  });

  it('honors request headers and bodyBase64 in the outgoing request', async () => {
    const scenario: HttpScenario = {
      name: 'static/with-body',
      kind: 'http',
      request: {
        method: 'POST',
        path: '/echo',
        headers: { 'X-Test': '1' },
        bodyBase64: encodeBase64(new TextEncoder().encode('abc')),
      },
    };
    let seen: RequestInit | undefined;
    const fetcher: typeof fetch = async (_url, init) => {
      seen = init;
      return new Response('ok', { status: 200, headers: { 'content-type': 'text/plain' } });
    };
    await recordOne(scenario, {
      targetUrl: 'http://oracle.test',
      outDir: dir,
      fetcher,
      writer: async () => {},
    });
    expect(seen?.method).toBe('POST');
    expect(seen?.headers).toEqual({ 'X-Test': '1' });
    expect(seen?.body).toBeInstanceOf(Uint8Array);
  });

  it('uses a custom matcherForResponse when provided', async () => {
    const scenario: HttpScenario = {
      name: 'static/custom-matcher',
      kind: 'http',
      request: { method: 'GET', path: '/x' },
    };
    const writes: string[] = [];
    await recordOne(scenario, {
      targetUrl: 'http://oracle.test',
      outDir: dir,
      fetcher: async () => new Response('', { status: 200 }),
      writer: async (_p, c) => {
        writes.push(c);
      },
      matcherForResponse: () => 'scsave',
    });
    const parsed = JSON.parse(writes[0]!);
    expect(parsed.scenario.expect.bodyMatcher).toBe('scsave');
  });

  it('skips ws scenarios with a TODO log line', async () => {
    const ws: WsScenario = { name: 'ws/demo', kind: 'ws', steps: [] };
    const logs: string[] = [];
    const results = await recordAll([ws], {
      targetUrl: 'http://oracle.test',
      outDir: dir,
      fetcher: async () => new Response(''),
      writer: async () => {},
      log: (line) => logs.push(line),
    });
    expect(results).toHaveLength(0);
    expect(logs).toEqual(['skipping ws scenario ws/demo (Phase 7)']);
  });

  it('records an iterable of http scenarios in order', async () => {
    const one: HttpScenario = {
      name: 'static/one',
      kind: 'http',
      request: { method: 'GET', path: '/one' },
    };
    const two: HttpScenario = {
      name: 'static/two',
      kind: 'http',
      request: { method: 'GET', path: '/two' },
    };
    const seen: string[] = [];
    const fetcher: typeof fetch = async (url) => {
      seen.push(String(url));
      return new Response('b', { status: 200 });
    };
    const results = await recordAll([one, two], {
      targetUrl: 'http://oracle.test',
      outDir: dir,
      fetcher,
      writer: async () => {},
    });
    expect(results).toHaveLength(2);
    expect(seen).toEqual(['http://oracle.test/one', 'http://oracle.test/two']);
  });
});
