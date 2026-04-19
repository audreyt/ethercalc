import { describe, it, expect } from 'vitest';

import {
  classifyCommandBody,
  joinCommands,
} from '../src/handlers/post-command.ts';

/** Pure-logic tests for classifyCommandBody and joinCommands. 100% gated. */

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
