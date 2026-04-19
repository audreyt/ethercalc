import { describe, it, expect } from 'vitest';

import {
  CLIENT_MESSAGE_TYPES,
  SERVER_MESSAGE_TYPES,
  encodeMessage,
  parseClientMessage,
  parseServerMessage,
} from '../src/messages.ts';

describe('CLIENT_MESSAGE_TYPES / SERVER_MESSAGE_TYPES', () => {
  it('exhaustively lists every client discriminator', () => {
    expect([...CLIENT_MESSAGE_TYPES].sort()).toEqual(
      [
        'ask.ecell',
        'ask.ecells',
        'ask.log',
        'ask.recalc',
        'chat',
        'ecell',
        'execute',
        'my.ecell',
        'stopHuddle',
      ].sort(),
    );
  });

  it('exhaustively lists every server discriminator', () => {
    expect([...SERVER_MESSAGE_TYPES].sort()).toEqual(
      [
        'ask.ecell',
        'chat',
        'confirmemailsent',
        'ecell',
        'ecells',
        'execute',
        'ignore',
        'log',
        'my.ecell',
        'recalc',
        'snapshot',
        'stopHuddle',
      ].sort(),
    );
  });
});

describe('encodeMessage / parseClientMessage', () => {
  it('round-trips every client message shape', () => {
    for (const type of CLIENT_MESSAGE_TYPES) {
      const msg = { type, room: 'r', user: 'u', msg: 'hello', cmdstr: 'noop', ecell: 'A1' };
      const decoded = parseClientMessage(encodeMessage(msg as never));
      expect(decoded?.type).toBe(type);
    }
  });

  it('rejects unknown discriminators', () => {
    expect(parseClientMessage(JSON.stringify({ type: 'nope' }))).toBeNull();
  });

  it('rejects non-object JSON', () => {
    expect(parseClientMessage('42')).toBeNull();
    expect(parseClientMessage('null')).toBeNull();
    expect(parseClientMessage('"str"')).toBeNull();
  });

  it('rejects missing type', () => {
    expect(parseClientMessage(JSON.stringify({ room: 'r' }))).toBeNull();
  });

  it('rejects non-string type', () => {
    expect(parseClientMessage(JSON.stringify({ type: 42 }))).toBeNull();
  });

  it('rejects malformed JSON', () => {
    expect(parseClientMessage('{not json')).toBeNull();
  });
});

describe('parseServerMessage', () => {
  it('round-trips every server message shape', () => {
    const fixtures = {
      log: { type: 'log', room: 'r', log: [], chat: [], snapshot: '' },
      recalc: { type: 'recalc', room: 'r', log: [], snapshot: '' },
      snapshot: { type: 'snapshot', snapshot: '' },
      ecells: { type: 'ecells', room: 'r', ecells: {} },
      execute: { type: 'execute', room: 'r', user: 'u', cmdstr: '' },
      chat: { type: 'chat', room: 'r', user: 'u', msg: '' },
      confirmemailsent: { type: 'confirmemailsent', message: 'sent' },
      ignore: { type: 'ignore' },
      stopHuddle: { type: 'stopHuddle', room: 'r' },
      ecell: { type: 'ecell', room: 'r', user: 'u', ecell: 'A1' },
      'my.ecell': { type: 'my.ecell', room: 'r', user: 'u', ecell: 'A1' },
      'ask.ecell': { type: 'ask.ecell', room: 'r', user: 'u' },
    } as const;
    for (const type of SERVER_MESSAGE_TYPES) {
      const fixture = fixtures[type];
      const decoded = parseServerMessage(encodeMessage(fixture as never));
      expect(decoded?.type).toBe(type);
    }
  });

  it('rejects unknown discriminators', () => {
    expect(parseServerMessage(JSON.stringify({ type: 'nope' }))).toBeNull();
  });

  it('rejects non-string type', () => {
    expect(parseServerMessage(JSON.stringify({ type: false }))).toBeNull();
  });

  it('rejects arrays, primitives, and null', () => {
    // Arrays are objects but lack a string `type` field.
    expect(parseServerMessage('[1,2,3]')).toBeNull();
    expect(parseServerMessage('null')).toBeNull();
    expect(parseServerMessage('true')).toBeNull();
  });

  it('rejects malformed JSON', () => {
    expect(parseServerMessage('not json')).toBeNull();
  });
});
