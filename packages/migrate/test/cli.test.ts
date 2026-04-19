/**
 * CLI tests — parseArgs, dry-run target, and the main() orchestrator.
 */
import { describe, it, expect } from 'vitest';

import {
  DryRunTarget,
  buildTarget,
  runMigrate,
  main,
  USAGE,
  type RunDeps,
} from '../src/cli.ts';
import { parseArgs, CliArgError, type CliArgs } from '../src/cli-args.ts';
import * as argsMod from '../src/cli-args.ts';
import { encodeRdb } from '../src/parse-rdb.ts';
import type { RedisDump } from '../src/parse-rdb.ts';
import { vi } from 'vitest';

function dump(): RedisDump {
  return {
    strings: new Map([['snapshot-foo', 'SAVE']]),
    lists: new Map([
      ['log-foo', ['cmd1']],
      ['audit-foo', ['cmd1']],
      ['chat-foo', ['hi']],
    ]),
    hashes: new Map([
      ['ecell-foo', new Map([['alice', 'A1']])],
      ['timestamps', new Map([['timestamp-foo', '1000']])],
    ]),
  };
}

function makeDeps(
  file?: Buffer,
  over: Partial<RunDeps> = {},
): { deps: RunDeps; stdout: string[]; stderr: string[]; execCalls: unknown[] } {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const execCalls: unknown[] = [];
  const deps: RunDeps = {
    readFile: over.readFile ?? (() => file ?? Buffer.alloc(0)),
    exec: over.exec ?? ((cmd, args) => {
      execCalls.push({ cmd, args });
      return { status: 0, stdout: '', stderr: '' };
    }),
    stdout: over.stdout ?? ((s) => { stdout.push(s); }),
    stderr: over.stderr ?? ((s) => { stderr.push(s); }),
  };
  return { deps, stdout, stderr, execCalls };
}

describe('parseArgs', () => {
  it('accepts the minimum valid flag set', () => {
    const a = parseArgs(['--input', 'f.rdb', '--d1-name', 'd1', '--kv-name', 'kv']);
    expect(a).toEqual({
      input: 'f.rdb',
      d1Name: 'd1',
      kvName: 'kv',
      dryRun: false,
      help: false,
    });
  });

  it('accepts --dry-run and -h', () => {
    const a = parseArgs([
      '--input',
      'f',
      '--d1-name',
      'd',
      '--kv-name',
      'k',
      '--dry-run',
    ]);
    expect(a.dryRun).toBe(true);

    expect(parseArgs(['-h']).help).toBe(true);
    expect(parseArgs(['--help']).help).toBe(true);
  });

  it('rejects missing required flags', () => {
    expect(() => parseArgs([])).toThrow(CliArgError);
    expect(() => parseArgs(['--input', 'f'])).toThrow(/--d1-name/);
    expect(() => parseArgs(['--input', 'f', '--d1-name', 'd'])).toThrow(/--kv-name/);
  });

  it('rejects missing value after a flag', () => {
    expect(() => parseArgs(['--input'])).toThrow(/requires a value/);
    expect(() => parseArgs(['--d1-name'])).toThrow(/requires a value/);
    expect(() => parseArgs(['--kv-name'])).toThrow(/requires a value/);
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

describe('buildTarget', () => {
  it('returns a DryRunTarget when --dry-run is set', () => {
    const { deps } = makeDeps();
    const args: CliArgs = {
      input: '',
      d1Name: 'd',
      kvName: 'k',
      dryRun: true,
      help: false,
    };
    expect(buildTarget(args, deps)).toBeInstanceOf(DryRunTarget);
  });

  it('returns a WranglerTarget otherwise', () => {
    const { deps } = makeDeps();
    const args: CliArgs = {
      input: '',
      d1Name: 'd',
      kvName: 'k',
      dryRun: false,
      help: false,
    };
    const t = buildTarget(args, deps);
    expect(t.constructor.name).toBe('WranglerTarget');
  });
});

describe('runMigrate — end to end with in-memory deps', () => {
  it('drives applyRooms with the parsed dump', async () => {
    const { deps, stdout } = makeDeps(encodeRdb(dump()));
    const stats = await runMigrate(
      { input: 'x', d1Name: 'd', kvName: 'k', dryRun: true, help: false },
      deps,
    );
    expect(stats.rooms).toBe(1);
    expect(stats.snapshots).toBe(1);
    expect(stdout.join('')).toContain('migrated 1 rooms');
  });

  it('shells out via exec when --dry-run is off', async () => {
    const { deps, execCalls } = makeDeps(encodeRdb(dump()));
    await runMigrate(
      { input: 'x', d1Name: 'd1n', kvName: 'kvn', dryRun: false, help: false },
      deps,
    );
    expect(execCalls.length).toBeGreaterThan(0);
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
    const { deps, stdout } = makeDeps(encodeRdb(dump()));
    const code = await main(
      ['--input', 'f', '--d1-name', 'd', '--kv-name', 'k', '--dry-run'],
      deps,
    );
    expect(code).toBe(0);
    expect(stdout.join('')).toContain('migrated 1 rooms');
  });

  it('returns 1 when readFile throws (Error subclass)', async () => {
    const deps: RunDeps = {
      readFile: () => {
        throw new Error('ENOENT');
      },
      exec: () => ({ status: 0, stdout: '', stderr: '' }),
      stdout: () => undefined,
      stderr: () => undefined,
    };
    const stderr: string[] = [];
    const deps2: RunDeps = { ...deps, stderr: (s) => { stderr.push(s); } };
    expect(
      await main(
        ['--input', 'f', '--d1-name', 'd', '--kv-name', 'k', '--dry-run'],
        deps2,
      ),
    ).toBe(1);
    expect(stderr.join('')).toContain('ENOENT');
  });

  it('returns 1 when readFile throws a non-Error value', async () => {
    const stderr: string[] = [];
    const deps: RunDeps = {
      readFile: () => {
        throw 'just-a-string';
      },
      exec: () => ({ status: 0, stdout: '', stderr: '' }),
      stdout: () => undefined,
      stderr: (s) => { stderr.push(s); },
    };
    expect(
      await main(
        ['--input', 'f', '--d1-name', 'd', '--kv-name', 'k', '--dry-run'],
        deps,
      ),
    ).toBe(1);
    expect(stderr.join('')).toContain('just-a-string');
  });

  it('propagates non-CliArgError thrown from parseArgs (programmer-bug path)', async () => {
    // If a future refactor of parseArgs accidentally throws a plain Error
    // instead of CliArgError, main() should re-throw so the bug surfaces
    // instead of silently returning exit code 2.
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
