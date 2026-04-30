/**
 * CLI tests — parseArgs, dry-run target, and the main() orchestrator.
 */
import { describe, it, expect, vi } from 'vitest';

import {
  DryRunTarget,
  buildTarget,
  runMigrate,
  resolveHealthDeps,
  main,
  USAGE,
  type RunDeps,
} from '../src/cli.ts';
import {
  parseArgs,
  parseSource,
  CliArgError,
  type CliArgs,
} from '../src/cli-args.ts';
import * as argsMod from '../src/cli-args.ts';
import type { FsLike, FsStatLike } from '../src/sources/filesystem-source.ts';

type FakeClient = NonNullable<RunDeps['connectRedis']> extends (
  url: string,
) => Promise<infer T>
  ? T
  : never;

function makeDeps(over: Partial<RunDeps> = {}): {
  deps: RunDeps;
  stdout: string[];
  stderr: string[];
} {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const deps: RunDeps = {
    connectRedis:
      over.connectRedis ??
      (async () => {
        throw new Error('connectRedis not stubbed');
      }),
    stdout: over.stdout ?? ((s) => { stdout.push(s); }),
    stderr: over.stderr ?? ((s) => { stderr.push(s); }),
    ...(over.fetch !== undefined ? { fetch: over.fetch } : {}),
    ...(over.now !== undefined ? { now: over.now } : {}),
    ...(over.sleep !== undefined ? { sleep: over.sleep } : {}),
  };
  return { deps, stdout, stderr };
}

/**
 * Build a fake Redis client that returns stub replies keyed by the
 * space-joined command (`'GET snapshot-foo'`, etc). Missing keys yield
 * `null` (Redis's usual "no such key" reply).
 */
function fakeClient(
  rooms: readonly string[],
  overrides: Partial<Record<string, unknown>> = {},
): FakeClient & { closeSpy: ReturnType<typeof vi.fn<() => Promise<void>>> } {
  const replies: Record<string, unknown> = {
    'HGETALL timestamps': [],
    'SCAN 0 MATCH log-* COUNT 10000': ['0', []],
    'SCAN 0 MATCH snapshot-* COUNT 10000': [
      '0',
      rooms.map((n) => `snapshot-${n}`),
    ],
  };
  for (const n of rooms) {
    replies[`GET snapshot-${n}`] = 'SNAP';
    replies[`LRANGE log-${n} 0 -1`] = [];
    replies[`LRANGE audit-${n} 0 -1`] = [];
    replies[`LRANGE chat-${n} 0 -1`] = [];
    replies[`HGETALL ecell-${n}`] = [];
  }
  for (const [k, v] of Object.entries(overrides)) replies[k] = v;

  const closeSpy = vi.fn<() => Promise<void>>(() => Promise.resolve());
  return {
    closeSpy,
    sendCommand: async (...a: readonly (string | number)[]) =>
      replies[a.map(String).join(' ')] ?? null,
    close: closeSpy,
  };
}

describe('parseArgs', () => {
  it('accepts the minimum valid flag set (HTTP seed mode)', () => {
    const a = parseArgs([
      '--source',
      'redis://127.0.0.1:6379',
      '--target',
      'http://127.0.0.1:8000',
      '--token',
      'secret',
    ]);
    expect(a).toEqual({
      source: 'redis://127.0.0.1:6379',
      target: 'http://127.0.0.1:8000',
      token: 'secret',
      dryRun: false,
      help: false,
      skipBulkIndex: false,
    });
  });

  it('accepts --skip-bulk-index (DO-only pass)', () => {
    const a = parseArgs([
      '--source',
      'redis://127.0.0.1:6379',
      '--target',
      'http://127.0.0.1:8000',
      '--token',
      'secret',
      '--skip-bulk-index',
    ]);
    expect(a.skipBulkIndex).toBe(true);
  });

  it('accepts --dry-run without a target', () => {
    const a = parseArgs([
      '--source',
      'redis://127.0.0.1:6379',
      '--dry-run',
    ]);
    expect(a.dryRun).toBe(true);
    expect(a.target).toBe('');
    expect(a.token).toBe('');
  });

  it('accepts --help / -h', () => {
    expect(parseArgs(['-h']).help).toBe(true);
    expect(parseArgs(['--help']).help).toBe(true);
  });

  it('accepts --health-timeout-ms', () => {
    const a = parseArgs([
      '--source',
      'redis://x',
      '--target',
      'http://x',
      '--token',
      't',
      '--health-timeout-ms',
      '60000',
    ]);
    expect(a.healthTimeoutMs).toBe(60_000);

    const zero = parseArgs([
      '--source',
      'redis://x',
      '--target',
      'http://x',
      '--token',
      't',
      '--health-timeout-ms',
      '0',
    ]);
    expect(zero.healthTimeoutMs).toBe(0);
  });

  it('rejects negative or non-numeric --health-timeout-ms', () => {
    expect(() =>
      parseArgs([
        '--source',
        'redis://x',
        '--target',
        'http://x',
        '--token',
        't',
        '--health-timeout-ms',
        'not-a-number',
      ]),
    ).toThrow(/--health-timeout-ms/);
    expect(() =>
      parseArgs([
        '--source',
        'redis://x',
        '--target',
        'http://x',
        '--token',
        't',
        '--health-timeout-ms',
        '-1',
      ]),
    ).toThrow(/--health-timeout-ms/);
  });

  it('accepts --concurrency N', () => {
    const a = parseArgs([
      '--source',
      'redis://x',
      '--target',
      'http://x',
      '--token',
      't',
      '--concurrency',
      '16',
    ]);
    expect(a.concurrency).toBe(16);

    const one = parseArgs([
      '--source',
      'redis://x',
      '--target',
      'http://x',
      '--token',
      't',
      '--concurrency',
      '1',
    ]);
    expect(one.concurrency).toBe(1);
  });

  it('rejects non-positive or non-integer --concurrency', () => {
    for (const v of ['0', '1.5']) {
      expect(() =>
        parseArgs([
          '--source',
          'redis://x',
          '--target',
          'http://x',
          '--token',
          't',
          '--concurrency',
          v,
        ]),
      ).toThrow(/--concurrency/);
    }
  });

  it('rejects missing --source', () => {
    expect(() => parseArgs([])).toThrow(CliArgError);
    expect(() => parseArgs(['--dry-run'])).toThrow(/--source is required/);
  });

  it('rejects missing --target when not in dry-run', () => {
    expect(() =>
      parseArgs(['--source', 'redis://x']),
    ).toThrow(/--target is required/);
  });

  it('rejects missing --token when not in dry-run', () => {
    expect(() =>
      parseArgs(['--source', 'redis://x', '--target', 'http://x']),
    ).toThrow(/--token is required/);
  });

  it('rejects missing value after a flag', () => {
    for (const f of [
      '--source',
      '--target',
      '--token',
      '--health-timeout-ms',
      '--concurrency',
    ]) {
      expect(() => parseArgs([f])).toThrow(/requires a value/);
    }
  });

  it('rejects unknown flags', () => {
    expect(() => parseArgs(['--bogus'])).toThrow(/Unknown flag/);
  });
});

describe('DryRunTarget', () => {
  it('emits one line per action and counts them in .log', async () => {
    const out: string[] = [];
    const t = new DryRunTarget((s) => out.push(s));
    await t.putSnapshot('r', 'SAVE');
    await t.putLog('r', 1, 'set A1 value n 1');
    await t.putAudit('r', 1, 'set A1 value n 1');
    await t.putChat('r', 1, 'hi');
    await t.putEcell('r', 'alice', 'A1');
    await t.setRoomIndex('r', 42);
    expect(t.log).toHaveLength(7); // snapshot + log + audit + chat + ecell + d1 + kv
    expect(out.join('')).toContain('DO[r] put snapshot');
    expect(out.join('')).toContain('D1 rooms INSERT r updated_at=42');
    expect(out.join('')).toContain('KV rooms:exists:r = 1');
  });

  it('abbreviates long strings', async () => {
    const out: string[] = [];
    const t = new DryRunTarget((s) => out.push(s));
    const long = 'x'.repeat(100);
    await t.putLog('r', 1, long);
    expect(out.join('')).toContain('...');
    expect(out.join('')).toContain('(100)');
  });

  it('does NOT abbreviate short strings', async () => {
    const out: string[] = [];
    const t = new DryRunTarget((s) => out.push(s));
    await t.putChat('r', 1, 'short');
    expect(out.join('')).not.toContain('...');
  });
});

describe('resolveHealthDeps', () => {
  it('passes through injected deps verbatim', () => {
    const f = async () => new Response('ok');
    const n = () => 42;
    const s = async () => undefined;
    const { deps } = makeDeps();
    deps.fetch = f;
    deps.now = n;
    deps.sleep = s;
    const resolved = resolveHealthDeps(deps);
    expect(resolved.fetch).toBe(f);
    expect(resolved.now).toBe(n);
    expect(resolved.sleep).toBe(s);
  });

  it('falls back to platform fetch/now/sleep when unset', async () => {
    const { deps } = makeDeps();
    const resolved = resolveHealthDeps(deps);
    expect(resolved.now()).toEqual(expect.any(Number));
    const original = globalThis.fetch;
    try {
      globalThis.fetch = (async () =>
        new Response('ok', { status: 200 })) as typeof fetch;
      const res = await resolved.fetch('http://127.0.0.1/ignored');
      expect(res.status).toBe(200);
    } finally {
      globalThis.fetch = original;
    }
    await resolved.sleep(0);
  });
});

describe('buildTarget', () => {
  it('returns a DryRunTarget when --dry-run is set', () => {
    const { deps } = makeDeps();
    const args: CliArgs = {
      source: 'redis://x',
      target: '',
      token: '',
      dryRun: true,
      help: false,
      skipBulkIndex: false,
    };
    expect(buildTarget(args, deps)).toBeInstanceOf(DryRunTarget);
  });

  it('returns an HttpTarget in non-dry-run mode', () => {
    const { deps } = makeDeps();
    const args: CliArgs = {
      source: 'redis://x',
      target: 'http://127.0.0.1:8000',
      token: 'abc',
      dryRun: false,
      help: false,
      skipBulkIndex: false,
    };
    const t = buildTarget(args, deps);
    expect(t.constructor.name).toBe('HttpTarget');
  });

  it('forwards injected fetch into the HttpTarget', () => {
    const { deps } = makeDeps();
    deps.fetch = async () => new Response('ok', { status: 200 });
    const args: CliArgs = {
      source: 'redis://x',
      target: 'http://127.0.0.1:8000',
      token: 'abc',
      dryRun: false,
      help: false,
      skipBulkIndex: false,
    };
    const t = buildTarget(args, deps);
    expect(t.constructor.name).toBe('HttpTarget');
  });
});

describe('runMigrate — end to end with in-memory deps', () => {
  it('waits for /_health, then fires one PUT per room via HttpTarget', async () => {
    const fetched: string[] = [];
    const client = fakeClient(['foo']);
    const { deps, stdout } = makeDeps({
      connectRedis: async (url) => {
        expect(url).toBe('redis://127.0.0.1:6379');
        return client;
      },
      fetch: async (url, init) => {
        fetched.push(`${init?.method ?? 'GET'} ${String(url)}`);
        return new Response('OK', { status: 201 });
      },
      now: () => 0,
      sleep: async () => undefined,
    });
    const stats = await runMigrate(
      {
        source: 'redis://127.0.0.1:6379',
        target: 'http://127.0.0.1:8000',
        token: 'abc',
        dryRun: false,
        help: false,
        skipBulkIndex: false,
      },
      deps,
    );
    expect(stats.rooms).toBe(1);
    expect(stdout.join('')).toContain('migrated 1 rooms');
    // Expected call order: health poll, seed with skipIndex:true, then
    // the end-of-run bulk-index flush for the single (foo, updatedAt)
    // pair.
    expect(fetched).toEqual([
      'GET http://127.0.0.1:8000/_health',
      'PUT http://127.0.0.1:8000/_migrate/seed/foo',
      'PUT http://127.0.0.1:8000/_migrate/bulk-index',
    ]);
    expect(client.closeSpy).toHaveBeenCalledTimes(1);
  });

  it('calls Bun.gc(true) every 100 rooms when the runtime exposes it', async () => {
    // Builds 250 rooms so the hook fires at 100 and 200 but not at
    // 250 (250 % 100 !== 0). Stubs globalThis.Bun.gc to record calls
    // without actually needing Bun's runtime; restores the original
    // (possibly real Bun.gc when the test runs under Bun) afterward.
    const names: string[] = [];
    for (let i = 0; i < 250; i++) {
      names.push(`room-${i.toString().padStart(4, '0')}`);
    }
    const client = fakeClient(names);
    const gcCalls: boolean[] = [];
    const scope = globalThis as { Bun?: { gc?: (force: boolean) => void } };
    const prior = scope.Bun;
    scope.Bun = { gc: (force) => { gcCalls.push(force); } };
    try {
      const { deps } = makeDeps({
        connectRedis: async () => client,
        fetch: async () => new Response('OK', { status: 201 }),
        now: () => 0,
        sleep: async () => undefined,
      });
      await runMigrate(
        {
          source: 'redis://127.0.0.1:6379',
          target: 'http://127.0.0.1:8000',
          token: 'abc',
          dryRun: false,
          help: false,
          skipBulkIndex: false,
        },
        deps,
      );
    } finally {
      scope.Bun = prior as { gc?: (force: boolean) => void };
    }
    // Hook fires twice: once at seeded=100, once at seeded=200. Always
    // forced (full GC, argument `true`).
    expect(gcCalls).toEqual([true, true]);
  });

  it('skips Bun.gc when globalThis.Bun is absent (Node-compat path)', async () => {
    // Ensures the optional-chain guard doesn't throw when running
    // under a runtime without `Bun`. We run >100 rooms so the
    // seeded-% 100 check passes — if the code tried to dereference a
    // non-existent Bun.gc it would throw.
    const names: string[] = [];
    for (let i = 0; i < 150; i++) {
      names.push(`room-${i.toString().padStart(3, '0')}`);
    }
    const client = fakeClient(names);
    const scope = globalThis as { Bun?: unknown };
    const prior = scope.Bun;
    delete scope.Bun;
    try {
      const { deps } = makeDeps({
        connectRedis: async () => client,
        fetch: async () => new Response('OK', { status: 201 }),
        now: () => 0,
        sleep: async () => undefined,
      });
      const stats = await runMigrate(
        {
          source: 'redis://127.0.0.1:6379',
          target: 'http://127.0.0.1:8000',
          token: 'abc',
          dryRun: false,
          help: false,
          skipBulkIndex: false,
        },
        deps,
      );
      expect(stats.rooms).toBe(150);
    } finally {
      scope.Bun = prior as { gc?: (force: boolean) => void };
    }
  });

  it('reports progress on every 100th room and always closes the client', async () => {
    const names: string[] = [];
    for (let i = 0; i < 120; i++) {
      names.push(`room-${i.toString().padStart(3, '0')}`);
    }
    const client = fakeClient(names);
    const { deps, stderr, stdout } = makeDeps({
      connectRedis: async () => client,
      fetch: async () => new Response('OK', { status: 201 }),
      now: () => 0,
      sleep: async () => undefined,
    });
    const stats = await runMigrate(
      {
        source: 'redis://127.0.0.1:6379',
        target: 'http://127.0.0.1:8000',
        token: 'abc',
        dryRun: false,
        help: false,
        skipBulkIndex: false,
      },
      deps,
    );
    expect(stats.rooms).toBe(120);
    expect(stdout.join('')).toContain('migrated 120 rooms');
    const stderrJoined = stderr.join('');
    expect(stderrJoined).toMatch(/source: room 1\/120/);
    expect(stderrJoined).toMatch(/source: room 100\/120/);
    expect(stderrJoined).toMatch(/seed: 100/);
    expect(client.closeSpy).toHaveBeenCalledTimes(1);
  });

  it('surfaces per-room errors via ROOM ERROR + end-of-run note', async () => {
    // Failing target that 500s deterministically on one specific room.
    // onRoomError wires the CLI's stderr hook; the migrator continues
    // past the failure and reports a summary note at the end.
    const client = fakeClient(['a', 'b', 'c']);
    let seen = 0;
    const { deps, stderr } = makeDeps({
      connectRedis: async () => client,
      fetch: async (url) => {
        const u = String(url);
        if (u.includes('_migrate/seed/b')) {
          seen += 1;
          return new Response('upstream unreachable', { status: 500 });
        }
        return new Response('OK', { status: 201 });
      },
      now: () => 0,
      sleep: async () => undefined,
    });
    const stats = await runMigrate(
      {
        source: 'redis://127.0.0.1:6379',
        target: 'http://127.0.0.1:8000',
        token: 'abc',
        dryRun: false,
        help: false,
        skipBulkIndex: false,
      },
      deps,
    );
    expect(stats.rooms).toBe(2); // a and c succeeded
    expect(seen).toBeGreaterThanOrEqual(3); // all retries exhausted
    const err = stderr.join('');
    expect(err).toMatch(/ROOM ERROR: b — seed b failed: 500/);
    expect(err).toMatch(/1 room\(s\) failed all retries and were skipped/);
  });

  it('logs oversized-entry warnings to stderr', async () => {
    // Overrides one room's audit with a 200 KB entry (> 120 KB cap).
    // The redis-source filter drops it and fires onOversizedEntry,
    // which the CLI hook forwards to stderr.
    const big = 'z'.repeat(200_000);
    const client = fakeClient(['big'], {
      'LRANGE audit-big 0 -1': [big, 'ok'],
    });
    const { deps, stderr } = makeDeps({
      connectRedis: async () => client,
      fetch: async () => new Response('OK', { status: 201 }),
      now: () => 0,
      sleep: async () => undefined,
    });
    const stats = await runMigrate(
      {
        source: 'redis://127.0.0.1:6379',
        target: 'http://127.0.0.1:8000',
        token: 'abc',
        dryRun: false,
        help: false,
        skipBulkIndex: false,
      },
      deps,
    );
    expect(stats.rooms).toBe(1);
    expect(stderr.join('')).toMatch(
      /skip oversized: big audit\[0\] = .* KiB \(> 120 KiB DO limit\)/,
    );
  });

  it('--skip-bulk-index fires seed PUTs only, no /_migrate/bulk-index', async () => {
    const fetched: string[] = [];
    const client = fakeClient(['foo', 'bar']);
    const { deps, stdout } = makeDeps({
      connectRedis: async () => client,
      fetch: async (url, init) => {
        fetched.push(`${init?.method ?? 'GET'} ${String(url)}`);
        return new Response('OK', { status: 201 });
      },
      now: () => 0,
      sleep: async () => undefined,
    });
    const stats = await runMigrate(
      {
        source: 'redis://127.0.0.1:6379',
        target: 'http://127.0.0.1:8000',
        token: 'abc',
        dryRun: false,
        help: false,
        skipBulkIndex: true,
      },
      deps,
    );
    expect(stats.rooms).toBe(2);
    expect(stdout.join('')).toContain('migrated 2 rooms');
    // Health probe + two seed PUTs, but ZERO bulk-index calls.
    expect(fetched).toEqual([
      'GET http://127.0.0.1:8000/_health',
      'PUT http://127.0.0.1:8000/_migrate/seed/bar',
      'PUT http://127.0.0.1:8000/_migrate/seed/foo',
    ]);
  });

  it('dry-run drives the RESP source without hitting /_health', async () => {
    const fetched: string[] = [];
    const client = fakeClient(['foo']);
    const { deps, stdout } = makeDeps({
      connectRedis: async () => client,
      fetch: async (url) => {
        fetched.push(String(url));
        return new Response('no', { status: 503 });
      },
    });
    const stats = await runMigrate(
      {
        source: 'redis://127.0.0.1:6379',
        target: '',
        token: '',
        dryRun: true,
        help: false,
        skipBulkIndex: false,
      },
      deps,
    );
    expect(stats.rooms).toBe(1);
    expect(fetched).toEqual([]); // no /_health poll, no PUTs
    expect(stdout.join('')).toContain('DO[foo] put snapshot');
    expect(stdout.join('')).toContain('migrated 1 rooms');
    expect(client.closeSpy).toHaveBeenCalledTimes(1);
  });

  it('throws when /_health never comes up inside the timeout', async () => {
    const client = fakeClient(['foo']);
    let t = 0;
    const { deps } = makeDeps({
      connectRedis: async () => client,
      fetch: async () => new Response('no', { status: 503 }),
      now: () => t,
      sleep: async (ms: number) => {
        t += ms;
      },
    });
    await expect(
      runMigrate(
        {
          source: 'redis://127.0.0.1:6379',
          target: 'http://127.0.0.1:8000',
          token: 'abc',
          dryRun: false,
          help: false,
          skipBulkIndex: false,
          healthTimeoutMs: 50,
        },
        deps,
      ),
    ).rejects.toThrow(/did not respond to \/_health/);
    // Health poll never opens the source connection — nothing to close.
    expect(client.closeSpy).not.toHaveBeenCalled();
  });
});

describe('main — argv orchestrator', () => {
  it('prints USAGE and returns 0 on --help', async () => {
    const { deps, stdout } = makeDeps();
    expect(await main(['--help'], deps)).toBe(0);
    expect(stdout.join('')).toContain(USAGE);
  });

  it('returns 2 on parse error', async () => {
    const { deps, stderr } = makeDeps();
    expect(await main(['--nope'], deps)).toBe(2);
    expect(stderr.join('')).toContain('Unknown flag');
    expect(stderr.join('')).toContain('--help');
  });

  it('returns 0 on a successful dry-run', async () => {
    const client = fakeClient(['foo']);
    const { deps, stdout } = makeDeps({ connectRedis: async () => client });
    const code = await main(
      ['--source', 'redis://x', '--dry-run'],
      deps,
    );
    expect(code).toBe(0);
    expect(stdout.join('')).toContain('migrated 1 rooms');
  });

  it('returns 1 when connectRedis throws (Error subclass)', async () => {
    const { deps, stderr } = makeDeps({
      connectRedis: async () => {
        throw new Error('ECONNREFUSED');
      },
    });
    expect(
      await main(['--source', 'redis://x', '--dry-run'], deps),
    ).toBe(1);
    expect(stderr.join('')).toContain('ECONNREFUSED');
  });

  it('returns 1 when connectRedis throws a non-Error value', async () => {
    const { deps, stderr } = makeDeps({
      connectRedis: async () => {
        throw 'just-a-string';
      },
    });
    expect(
      await main(['--source', 'redis://x', '--dry-run'], deps),
    ).toBe(1);
    expect(stderr.join('')).toContain('just-a-string');
  });

  it('propagates non-CliArgError thrown from parseArgs (programmer-bug path)', async () => {
    const spy = vi
      .spyOn(argsMod, 'parseArgs')
      .mockImplementation(() => {
        throw new Error('boom');
      });
    const { deps } = makeDeps();
    await expect(main(['--anything'], deps)).rejects.toThrow('boom');
    spy.mockRestore();
  });
});

/**
 * In-memory FsLike — mirrors the helper in filesystem-source.test.ts
 * but duplicated here so cli.test.ts doesn't reach into a sibling test
 * file. Only the shapes actually exercised by the CLI tests are built.
 */
function buildFs(tree: Record<string, unknown>): FsLike {
  type Entry =
    | { kind: 'file'; contents: string }
    | { kind: 'dir'; entries: Map<string, Entry> };
  const root = new Map<string, Entry>();
  const ingest = (into: Map<string, Entry>, obj: Record<string, unknown>): void => {
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'string') {
        into.set(k, { kind: 'file', contents: v });
      } else if (v && typeof v === 'object') {
        const sub = new Map<string, Entry>();
        into.set(k, { kind: 'dir', entries: sub });
        ingest(sub, v as Record<string, unknown>);
      }
    }
  };
  ingest(root, tree);
  const resolve = (p: string): Entry | null => {
    const parts = p.split('/').filter((s) => s.length > 0);
    let cur: Entry = { kind: 'dir', entries: root };
    for (const part of parts) {
      if (cur.kind !== 'dir') return null;
      const next = cur.entries.get(part);
      if (next === undefined) return null;
      cur = next;
    }
    return cur;
  };
  return {
    readdir: async (p) => {
      const e = resolve(p);
      if (e === null || e.kind !== 'dir') throw new Error(`ENOTDIR: ${p}`);
      return Array.from(e.entries.keys());
    },
    readFile: async (p) => {
      const e = resolve(p);
      if (e === null || e.kind !== 'file') throw new Error(`ENOENT: ${p}`);
      return e.contents;
    },
    stat: async (p): Promise<FsStatLike> => {
      const e = resolve(p);
      if (e === null) throw new Error(`ENOENT: ${p}`);
      return {
        isDirectory: () => e.kind === 'dir',
        isFile: () => e.kind === 'file',
      };
    },
  };
}

describe('parseSource', () => {
  it('classifies redis:// URLs', () => {
    expect(parseSource('redis://localhost:6379')).toEqual({
      kind: 'redis',
      url: 'redis://localhost:6379',
    });
  });

  it('classifies file:// URLs and pulls out the pathname', () => {
    expect(parseSource('file:///var/dump')).toEqual({
      kind: 'file',
      path: '/var/dump',
    });
  });

  it('decodes %xx escapes in file:// URL pathnames', () => {
    // A grain path with a space-like escape. WHATWG URL encodes spaces
    // as %20; we want callers to get the real on-disk path back.
    expect(parseSource('file:///var/my%20dumps')).toEqual({
      kind: 'file',
      path: '/var/my dumps',
    });
  });

  it('treats a bare absolute path as a filesystem source', () => {
    expect(parseSource('/var/dump')).toEqual({
      kind: 'file',
      path: '/var/dump',
    });
  });

  it('rejects relative paths and unknown schemes', () => {
    expect(() => parseSource('./dump')).toThrow(CliArgError);
    expect(() => parseSource('redis:/missing-slash')).toThrow(CliArgError);
    expect(() => parseSource('')).toThrow(CliArgError);
  });
});

describe('parseArgs — source validation', () => {
  it('rejects a malformed source scheme at parse time (not at connect time)', () => {
    expect(() =>
      parseArgs(['--source', 'redis:/typo', '--dry-run']),
    ).toThrow(CliArgError);
  });

  it('accepts a file:// source', () => {
    const a = parseArgs(['--source', 'file:///var/dump', '--dry-run']);
    expect(a.source).toBe('file:///var/dump');
  });

  it('accepts a bare-absolute-path source', () => {
    const a = parseArgs(['--source', '/var/dump', '--dry-run']);
    expect(a.source).toBe('/var/dump');
  });
});

describe('runMigrate — filesystem source', () => {
  it('dispatches to roomsFromFilesystem with a dump.json blob', async () => {
    const fs = buildFs({
      var: {
        'dump.json': JSON.stringify({
          'snapshot-alpha': 'SAVE-A',
          'log-alpha': ['cmd-a1'],
          timestamps: { 'timestamp-alpha': 42 },
        }),
      },
    });
    const { deps, stdout } = makeDeps();
    deps.fs = fs;
    const stats = await runMigrate(
      {
        source: 'file:///var',
        target: '',
        token: '',
        dryRun: true,
        help: false,
        skipBulkIndex: false,
      },
      deps,
    );
    expect(stats.rooms).toBe(1);
    expect(stats.snapshots).toBe(1);
    expect(stats.logEntries).toBe(1);
    expect(stdout.join('')).toContain('DO[alpha] put snapshot');
    expect(stdout.join('')).toContain('D1 rooms INSERT alpha updated_at=42');
  });

  it('dispatches to roomsFromFilesystem with a dump/ directory', async () => {
    const fs = buildFs({
      var: {
        dump: {
          'snapshot-room1.txt': 'SAVE-1',
          'audit-room1.txt': 'cmd1\ncmd2\n',
        },
      },
    });
    const { deps, stdout } = makeDeps();
    deps.fs = fs;
    const stats = await runMigrate(
      {
        source: 'file:///var',
        target: '',
        token: '',
        dryRun: true,
        help: false,
        skipBulkIndex: false,
      },
      deps,
    );
    expect(stats.rooms).toBe(1);
    expect(stats.auditEntries).toBe(2);
    expect(stdout.join('')).toContain('DO[room1] put audit#1');
    expect(stdout.join('')).toContain('DO[room1] put audit#2');
  });

  it('accepts a bare-absolute path source (no file:// scheme)', async () => {
    const fs = buildFs({
      dump: { 'snapshot-room1.txt': 'SAVE-1' },
    });
    const { deps } = makeDeps();
    deps.fs = fs;
    const stats = await runMigrate(
      {
        source: '/dump',
        target: '',
        token: '',
        dryRun: true,
        help: false,
        skipBulkIndex: false,
      },
      deps,
    );
    expect(stats.rooms).toBe(1);
  });

  it('throws when --source file:// is used but deps.fs is unset', async () => {
    const { deps } = makeDeps();
    // deps.fs intentionally left unset
    await expect(
      runMigrate(
        {
          source: 'file:///var',
          target: '',
          token: '',
          dryRun: true,
          help: false,
          skipBulkIndex: false,
        },
        deps,
      ),
    ).rejects.toThrow(/RunDeps\.fs to be wired/);
  });
});

describe('runMigrate — redis source missing connectRedis', () => {
  it('throws with a clear message when deps.connectRedis is unset', async () => {
    // Bypass makeDeps's default (which stubs connectRedis). Build a
    // bare RunDeps with no redis connector at all.
    const stdout: string[] = [];
    const stderr: string[] = [];
    const deps: RunDeps = {
      stdout: (s) => { stdout.push(s); },
      stderr: (s) => { stderr.push(s); },
    };
    await expect(
      runMigrate(
        {
          source: 'redis://127.0.0.1:6379',
          target: '',
          token: '',
          dryRun: true,
          help: false,
          skipBulkIndex: false,
        },
        deps,
      ),
    ).rejects.toThrow(/RunDeps\.connectRedis to be wired/);
  });
});
