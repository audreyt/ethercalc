import { describe, expect, it, vi } from 'vitest';

import { main } from '../src/run.ts';
import type { MainDeps } from '../src/run.ts';
import * as parseMod from '../src/parse.ts';

/** Build a fresh stub `MainDeps` for each test. */
function makeDeps(execImpl?: MainDeps['exec']): {
  deps: MainDeps;
  stdout: string[];
  stderr: string[];
  execCalls: Array<{ cmd: string; args: string[]; env: Record<string, string> }>;
} {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const execCalls: Array<{ cmd: string; args: string[]; env: Record<string, string> }> = [];
  const deps: MainDeps = {
    stdout: (s) => { stdout.push(s); },
    stderr: (s) => { stderr.push(s); },
    exec: execImpl ?? ((cmd, args, env) => {
      execCalls.push({ cmd, args, env });
      return 0;
    }),
  };
  return { deps, stdout, stderr, execCalls };
}

describe('main — happy paths', () => {
  it('runs wrangler with the documented default bind when argv is empty', () => {
    const { deps, execCalls } = makeDeps();
    const code = main([], deps);
    expect(code).toBe(0);
    expect(execCalls).toHaveLength(1);
    expect(execCalls[0]?.cmd).toBe('npx');
    expect(execCalls[0]?.args).toEqual([
      'wrangler', 'dev', '--port', '8000', '--ip', '0.0.0.0',
    ]);
    expect(execCalls[0]?.env).toEqual({
      ETHERCALC_PORT: '8000',
      ETHERCALC_HOST: '0.0.0.0',
    });
  });

  it('forwards --port/--host to wrangler args', () => {
    const { deps, execCalls } = makeDeps();
    main(['--port', '8080', '--host', '127.0.0.1'], deps);
    expect(execCalls[0]?.args).toEqual([
      'wrangler', 'dev', '--port', '8080', '--ip', '127.0.0.1',
    ]);
  });

  it('passes --key as ETHERCALC_KEY env', () => {
    const { deps, execCalls } = makeDeps();
    main(['--key', 'secret'], deps);
    expect(execCalls[0]?.env).toEqual({
      ETHERCALC_PORT: '8000',
      ETHERCALC_HOST: '0.0.0.0',
      ETHERCALC_KEY: 'secret',
    });
  });

  it('propagates the exec exit code', () => {
    const { deps } = makeDeps(() => 17);
    expect(main([], deps)).toBe(17);
  });
});

describe('main — --help', () => {
  it('prints help and returns 0 without invoking exec', () => {
    const execSpy = vi.fn(() => 0);
    const { deps, stdout } = makeDeps(execSpy);
    const code = main(['--help'], deps);
    expect(code).toBe(0);
    expect(stdout.join('')).toContain('ethercalc');
    expect(stdout.join('')).toContain('--port');
    expect(execSpy).not.toHaveBeenCalled();
  });

  it('-h short form also works', () => {
    const execSpy = vi.fn(() => 0);
    const { deps, stdout } = makeDeps(execSpy);
    expect(main(['-h'], deps)).toBe(0);
    expect(stdout.join('')).toContain('ethercalc');
    expect(execSpy).not.toHaveBeenCalled();
  });
});

describe('main — parse errors', () => {
  it('returns 2 and writes to stderr for an unknown flag', () => {
    const execSpy = vi.fn(() => 0);
    const { deps, stderr } = makeDeps(execSpy);
    const code = main(['--nope'], deps);
    expect(code).toBe(2);
    expect(stderr.join('')).toContain('Unknown flag');
    expect(stderr.join('')).toContain('--help');
    expect(execSpy).not.toHaveBeenCalled();
  });

  it('returns 2 for a non-numeric --port', () => {
    const { deps, stderr } = makeDeps();
    expect(main(['--port', 'abc'], deps)).toBe(2);
    expect(stderr.join('')).toContain('non-negative integer');
  });

  it('returns 2 for missing required value', () => {
    const { deps, stderr } = makeDeps();
    expect(main(['--key'], deps)).toBe(2);
    expect(stderr.join('')).toContain('requires a value');
  });
});

describe('main — non-CliError propagates', () => {
  it('re-raises unexpected errors from parseFlags so bugs are not swallowed', () => {
    // Replace the real parseFlags with one that throws a generic Error.
    // This path covers the `!(err instanceof CliError)` branch — it should
    // never run in production, but we assert that if a programming bug
    // slips into parseFlags it blows up loudly.
    const spy = vi.spyOn(parseMod, 'parseFlags').mockImplementation(() => {
      throw new Error('unexpected boom');
    });
    const { deps } = makeDeps();
    expect(() => main([], deps)).toThrow('unexpected boom');
    spy.mockRestore();
  });
});

describe('main — TLS warnings', () => {
  it('prints the TLS deferral warning on stderr and still execs', () => {
    const { deps, stderr, execCalls } = makeDeps();
    const code = main(['--keyfile', 'k.pem'], deps);
    expect(code).toBe(0);
    expect(stderr.join('')).toContain('--keyfile');
    expect(stderr.join('')).toContain('reverse proxy');
    expect(execCalls).toHaveLength(1);
  });

  it('prints warning even when both --keyfile AND --certfile are set', () => {
    const { deps, stderr } = makeDeps();
    main(['--keyfile', 'k.pem', '--certfile', 'c.pem'], deps);
    // Warning joined with the "\n" suffix main() adds.
    expect(stderr.some((s) => s.includes('--keyfile/--certfile'))).toBe(true);
  });
});
