import { describe, expect, it } from 'vitest';

import { parseFlags, CliError } from '../src/parse.ts';

describe('parseFlags — happy paths', () => {
  it('returns an empty object for an empty argv', () => {
    expect(parseFlags([])).toEqual({});
  });

  it('parses --key as a string', () => {
    expect(parseFlags(['--key', 'hunter2'])).toEqual({ key: 'hunter2' });
  });

  it('parses --key=hunter2 (equals form)', () => {
    expect(parseFlags(['--key=hunter2'])).toEqual({ key: 'hunter2' });
  });

  it('parses --cors as a boolean', () => {
    expect(parseFlags(['--cors'])).toEqual({ cors: true });
  });

  it('parses --port as a number', () => {
    expect(parseFlags(['--port', '8080'])).toEqual({ port: 8080 });
  });

  it('parses --port=8080 (equals form)', () => {
    expect(parseFlags(['--port=8080'])).toEqual({ port: 8080 });
  });

  it('parses --host as a string', () => {
    expect(parseFlags(['--host', '127.0.0.1'])).toEqual({ host: '127.0.0.1' });
  });

  it('parses --expire as a number', () => {
    expect(parseFlags(['--expire', '86400'])).toEqual({ expire: 86400 });
  });

  it('parses --basepath as a string', () => {
    expect(parseFlags(['--basepath', '/sheets'])).toEqual({ basepath: '/sheets' });
  });

  it('parses --keyfile and --certfile', () => {
    expect(parseFlags(['--keyfile', 'k.pem', '--certfile', 'c.pem'])).toEqual({
      keyfile: 'k.pem',
      certfile: 'c.pem',
    });
  });

  it('parses --persist-to as a string', () => {
    expect(parseFlags(['--persist-to', '/data'])).toEqual({ persistTo: '/data' });
  });

  it('parses --help and -h identically', () => {
    expect(parseFlags(['--help'])).toEqual({ help: true });
    expect(parseFlags(['-h'])).toEqual({ help: true });
  });

  it('parses a full flag combo in a single argv', () => {
    const result = parseFlags([
      '--key', 's3cr3t',
      '--cors',
      '--port', '9000',
      '--host', '0.0.0.0',
      '--expire', '3600',
      '--basepath', '/etc',
      '--keyfile', 'k',
      '--certfile', 'c',
      '--persist-to', '/tmp/data',
    ]);
    expect(result).toEqual({
      key: 's3cr3t',
      cors: true,
      port: 9000,
      host: '0.0.0.0',
      expire: 3600,
      basepath: '/etc',
      keyfile: 'k',
      certfile: 'c',
      persistTo: '/tmp/data',
    });
  });

  it('accepts port 0 (bind-any)', () => {
    expect(parseFlags(['--port', '0'])).toEqual({ port: 0 });
  });
});

describe('parseFlags — error paths', () => {
  it('rejects unknown flags', () => {
    expect(() => parseFlags(['--foo'])).toThrow(CliError);
    expect(() => parseFlags(['--foo'])).toThrow(/Unknown flag/);
  });

  it('rejects positional arguments', () => {
    expect(() => parseFlags(['positional'])).toThrow(CliError);
  });

  it('rejects --key without a value', () => {
    expect(() => parseFlags(['--key'])).toThrow(/requires a value/);
  });

  it('rejects --port without a value', () => {
    expect(() => parseFlags(['--port'])).toThrow(/requires a value/);
  });

  it('rejects --port with non-numeric value', () => {
    expect(() => parseFlags(['--port', 'abc'])).toThrow(/non-negative integer/);
  });

  it('rejects --port with fractional value', () => {
    expect(() => parseFlags(['--port', '8080.5'])).toThrow(/non-negative integer/);
  });

  it('rejects --port with negative value', () => {
    expect(() => parseFlags(['--port', '-1'])).toThrow(/non-negative integer/);
  });

  it('rejects --expire with non-numeric value', () => {
    expect(() => parseFlags(['--expire', 'forever'])).toThrow(/non-negative integer/);
  });

  it('rejects --cors=true (boolean flag with inline value)', () => {
    expect(() => parseFlags(['--cors=true'])).toThrow(/does not take a value/);
  });

  it('rejects --help with a value', () => {
    expect(() => parseFlags(['--help=yes'])).toThrow(/does not take a value/);
  });

  it('CliError has name CliError for typed catching', () => {
    try {
      parseFlags(['--foo']);
    } catch (err) {
      expect(err).toBeInstanceOf(CliError);
      expect((err as CliError).name).toBe('CliError');
    }
  });

  it('rejects --basepath without a value at end of argv', () => {
    expect(() => parseFlags(['--basepath'])).toThrow(/requires a value/);
  });
});
