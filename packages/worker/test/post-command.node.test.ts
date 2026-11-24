import { describe, it, expect } from 'vite-plus/test';

import {
  classifyCommandBody,
  echoCommand,
  joinCommands,
  MAX_COMMAND_ECHO_CHARS,
} from '../src/handlers/post-command.ts';

/** Pure-logic tests for classifyCommandBody, joinCommands and echoCommand. 100% gated. */

function enc(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

describe('classifyCommandBody', () => {
  it('returns kind empty for a zero-byte plain-text body', () => {
    expect(classifyCommandBody('text/plain', new Uint8Array(0))).toEqual({
      kind: 'empty',
    });
  });

  it('returns kind empty for a zero-byte socialcalc body', () => {
    expect(classifyCommandBody('text/x-socialcalc', new Uint8Array(0))).toEqual({
      kind: 'empty',
    });
  });

  it('parses a JSON body with string .command', () => {
    const body = JSON.stringify({ command: 'set A1 value n 1' });
    expect(classifyCommandBody('application/json', enc(body))).toEqual({
      kind: 'json-command',
      command: 'set A1 value n 1',
    });
  });

  it('parses a JSON body with array .command', () => {
    const body = JSON.stringify({ command: ['set A1 value n 1', 'set A2 value n 2'] });
    expect(classifyCommandBody('application/json', enc(body))).toEqual({
      kind: 'json-command',
      command: ['set A1 value n 1', 'set A2 value n 2'],
    });
  });

  it('returns empty for JSON body with empty array .command', () => {
    const body = JSON.stringify({ command: [] });
    expect(classifyCommandBody('application/json', enc(body))).toEqual({
      kind: 'empty',
    });
  });

  it('returns empty for JSON body with no .command', () => {
    const body = JSON.stringify({ nocommand: true });
    expect(classifyCommandBody('application/json', enc(body))).toEqual({
      kind: 'empty',
    });
  });

  it('returns empty for JSON body with array containing non-string', () => {
    const body = JSON.stringify({ command: ['ok', 42] });
    expect(classifyCommandBody('application/json', enc(body))).toEqual({
      kind: 'empty',
    });
  });

  it('returns empty for JSON body with empty string .command', () => {
    const body = JSON.stringify({ command: '' });
    expect(classifyCommandBody('application/json', enc(body))).toEqual({
      kind: 'empty',
    });
  });

  it('returns empty for malformed JSON', () => {
    expect(classifyCommandBody('application/json', enc('{not-json'))).toEqual({
      kind: 'empty',
    });
  });

  it('returns empty for JSON non-object body', () => {
    expect(classifyCommandBody('application/json', enc('null'))).toEqual({
      kind: 'empty',
    });
    expect(classifyCommandBody('application/json', enc('42'))).toEqual({
      kind: 'empty',
    });
    expect(classifyCommandBody('application/json', enc('"string"'))).toEqual({
      kind: 'empty',
    });
  });

  it('returns text-command for text/x-socialcalc body', () => {
    expect(classifyCommandBody('text/x-socialcalc', enc('set A1 value n 1'))).toEqual({
      kind: 'text-command',
      command: 'set A1 value n 1',
    });
  });

  it('returns text-command for text/plain body', () => {
    expect(classifyCommandBody('text/plain', enc('loadclipboard stuff'))).toEqual({
      kind: 'text-command',
      command: 'loadclipboard stuff',
    });
  });

  it('returns text-command for unknown content-type with body', () => {
    expect(classifyCommandBody('', enc('raw'))).toEqual({
      kind: 'text-command',
      command: 'raw',
    });
  });

  it('handles content-type with parameters (trimmed + lowercased)', () => {
    const body = JSON.stringify({ command: 'x' });
    expect(
      classifyCommandBody('Application/JSON; charset=UTF-8', enc(body)),
    ).toEqual({ kind: 'json-command', command: 'x' });
  });

  it('defers xlsx bodies to Phase 8 (kind xlsx-deferred)', () => {
    expect(
      classifyCommandBody(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        enc('PK\x03\x04'),
      ),
    ).toEqual({ kind: 'xlsx-deferred' });
  });

  it('defers ods bodies to Phase 8 (kind xlsx-deferred)', () => {
    expect(
      classifyCommandBody(
        'application/vnd.oasis.opendocument.spreadsheet',
        enc('PK\x03\x04'),
      ),
    ).toEqual({ kind: 'xlsx-deferred' });
  });

  it('classifies text/csv with a body as csv-deferred', () => {
    expect(
      classifyCommandBody('text/csv', enc('"#url","#title"\n"/r.1","Sheet1"\n')),
    ).toEqual({ kind: 'csv-deferred' });
  });

  it('classifies text/csv with charset parameter as csv-deferred', () => {
    expect(
      classifyCommandBody(
        'text/csv; charset=utf-8',
        enc('"#url","#title"\n"/r.1","Sheet1"\n'),
      ),
    ).toEqual({ kind: 'csv-deferred' });
  });

  it('classifies zero-byte text/csv as empty', () => {
    expect(classifyCommandBody('text/csv', new Uint8Array())).toEqual({
      kind: 'empty',
    });
  });
});

describe('joinCommands', () => {
  it('returns a string command as-is', () => {
    expect(joinCommands('abc')).toBe('abc');
  });
  it('joins an array with newlines', () => {
    expect(joinCommands(['a', 'b', 'c'])).toBe('a\nb\nc');
  });
  it('handles a single-element array', () => {
    expect(joinCommands(['one'])).toBe('one');
  });
  it('handles an empty array', () => {
    expect(joinCommands([])).toBe('');
  });
});

describe('echoCommand', () => {
  it('echoes a string command as-is', () => {
    expect(echoCommand('set A1 value n 1')).toBe('set A1 value n 1');
  });
  it('echoes an array command member by member', () => {
    expect(echoCommand(['loadclipboard foo', 'paste A2 all'])).toEqual([
      'loadclipboard foo',
      'paste A2 all',
    ]);
    expect(echoCommand([])).toEqual([]);
  });
  it('echoes in full every command a client can post', () => {
    const longest = `set A1 text t ${'x'.repeat(MAX_COMMAND_ECHO_CHARS)}`.slice(
      0,
      MAX_COMMAND_ECHO_CHARS,
    );
    expect(echoCommand(longest)).toBe(longest);
    expect(echoCommand([longest])).toEqual([longest]);
  });
  it('echoes a longer, generated command by its verb alone', () => {
    // One control character is six bytes of JSON (`\u0001`).
    const generated = `loadclipboard ${'\x01'.repeat(MAX_COMMAND_ECHO_CHARS)}`;
    expect(echoCommand(generated)).toBe('loadclipboard');
    expect(echoCommand([generated, 'paste A1 all'])).toEqual([
      'loadclipboard',
      'paste A1 all',
    ]);
  });
  it('echoes nothing of an over-long command without a verb', () => {
    expect(echoCommand('x'.repeat(MAX_COMMAND_ECHO_CHARS + 1))).toBe('');
  });
});
