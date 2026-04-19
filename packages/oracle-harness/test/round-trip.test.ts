import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { recordAll } from '../src/record.ts';
import { replayAll } from '../src/replay.ts';
import type { HttpScenario } from '@ethercalc/shared/oracle-scenarios';

/**
 * End-to-end record → replay exercise using a local in-memory fetcher
 * (no docker, no network). Proves the artifact shape survives a
 * round-trip and asserts that a byte-identical replay passes while a
 * regressed one fails.
 */
describe('record → replay round-trip', () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'oracle-harness-rt-'));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('passes replay against an unchanged fixture', async () => {
    const scenario: HttpScenario = {
      name: 'rt/sample',
      kind: 'http',
      request: { method: 'GET', path: '/sample' },
    };
    const responses = new Map<string, () => Response>([
      [
        'http://oracle.test/sample',
        () =>
          new Response('{"ok":true}', {
            status: 200,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              Date: 'Mon, 01 Jan 2026 00:00:00 GMT',
            },
          }),
      ],
    ]);
    const fetcher: typeof fetch = async (url) => {
      const make = responses.get(String(url));
      if (!make) throw new Error(`unexpected url: ${url}`);
      return make();
    };
    await recordAll([scenario], { targetUrl: 'http://oracle.test', outDir: dir, fetcher });

    const results = await replayAll({
      targetUrl: 'http://target.test',
      recordedDir: dir,
      fetcher: async (url) => {
        expect(String(url)).toBe('http://target.test/sample');
        return new Response('{"ok":true}', {
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            Server: 'target', // volatile, should be ignored by normalizer
          },
        });
      },
    });
    expect(results).toHaveLength(1);
    expect(results[0]!.ok).toBe(true);
  });

  it('flags a regression where the target diverges', async () => {
    const scenario: HttpScenario = {
      name: 'rt/regress',
      kind: 'http',
      request: { method: 'GET', path: '/regress' },
    };
    await recordAll([scenario], {
      targetUrl: 'http://oracle.test',
      outDir: dir,
      fetcher: async () =>
        new Response('ok', {
          status: 200,
          headers: { 'Content-Type': 'text/plain' },
        }),
    });

    const results = await replayAll({
      targetUrl: 'http://target.test',
      recordedDir: dir,
      fetcher: async () =>
        new Response('different', {
          status: 200,
          headers: { 'Content-Type': 'text/plain' },
        }),
    });
    expect(results[0]!.ok).toBe(false);
    expect(results[0]!.error).toMatch(/length differs/);
  });
});
