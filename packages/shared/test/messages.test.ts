import { describe, it, expect } from 'vite-plus/test';

import {
  CLIENT_MESSAGE_TYPES,
  MAX_COMMAND_UTF8_BYTES,
  MAX_WS_AUTH_CHARS,
  MAX_WS_CELL_CHARS,
  MAX_WS_CHAT_CHARS,
  MAX_WS_FRAME_CHARS,
  MAX_WS_ROOM_CHARS,
  MAX_WS_USER_CHARS,
  SERVER_MESSAGE_TYPES,
  encodeMessage,
  isStorageSafeCommand,
  parseClientMessage,
  parseClientMessageValue,
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

  it('canonicalizes optional fields and drops unknown properties', () => {
    expect(
      parseClientMessageValue({
        type: 'execute',
        room: 'r',
        user: 'u',
        auth: 'a',
        cmdstr: 'noop',
        ignored: 'not forwarded',
      }),
    ).toEqual({
      type: 'execute',
      room: 'r',
      user: 'u',
      auth: 'a',
      cmdstr: 'noop',
    });
    expect(
      parseClientMessageValue({
        type: 'ecell',
        room: 'r',
        user: 'u',
        ecell: 'B2',
        original: 'A1',
        auth: 'a',
        to: 'peer',
      }),
    ).toEqual({
      type: 'ecell',
      room: 'r',
      user: 'u',
      ecell: 'B2',
      original: 'A1',
      auth: 'a',
      to: 'peer',
    });
    expect(
      parseClientMessageValue({ type: 'stopHuddle', room: 'r', auth: 'a' }),
    ).toEqual({ type: 'stopHuddle', room: 'r', auth: 'a' });
  });

  it.each([
    { type: 'chat', room: 'r', user: 1, msg: 'x' },
    { type: 'chat', room: 'r', user: 'u', msg: 'x'.repeat(MAX_WS_CHAT_CHARS + 1) },
    { type: 'ask.ecells', room: '' },
    { type: 'ask.recalc', room: 'r'.repeat(MAX_WS_ROOM_CHARS + 1) },
    { type: 'my.ecell', room: 'r', user: 'u', ecell: 1 },
    { type: 'my.ecell', room: 'r', user: 'u'.repeat(MAX_WS_USER_CHARS + 1), ecell: 'A1' },
    { type: 'execute', room: 'r', user: 'u', cmdstr: 1 },
    { type: 'execute', room: 'r', user: 'u', cmdstr: '', auth: 1 },
    {
      type: 'execute',
      room: 'r',
      user: 'u',
      cmdstr: '',
      auth: 'a'.repeat(MAX_WS_AUTH_CHARS + 1),
    },
    { type: 'ask.log', room: 'r', user: 1 },
    { type: 'ask.ecell', room: 'r', user: 'u'.repeat(MAX_WS_USER_CHARS + 1) },
    { type: 'stopHuddle', room: 'r', auth: 1 },
    { type: 'ecell', room: 'r', user: 'u', ecell: 'A'.repeat(MAX_WS_CELL_CHARS + 1) },
    { type: 'ecell', room: 'r', user: 'u', ecell: 'A1', original: 1 },
    {
      type: 'ecell',
      room: 'r',
      user: 'u',
      ecell: 'A1',
      original: 'A'.repeat(MAX_WS_CELL_CHARS + 1),
    },
    { type: 'ecell', room: 'r', user: 'u', ecell: 'A1', auth: 1 },
    { type: 'ecell', room: 'r', user: 'u', ecell: 'A1', to: 1 },
    {
      type: 'ecell',
      room: 'r',
      user: 'u',
      ecell: 'A1',
      to: 'u'.repeat(MAX_WS_USER_CHARS + 1),
    },
  ])('rejects a malformed or unbounded payload: $type', (payload) => {
    expect(parseClientMessageValue(payload)).toBeNull();
  });

  it('rejects arrays and oversized raw frames before dispatch', () => {
    expect(parseClientMessageValue([])).toBeNull();
    expect(
      parseClientMessage('x'.repeat(MAX_WS_FRAME_CHARS + 1)),
    ).toBeNull();
  });

  it('rejects a well-formed envelope whose type is not a known discriminator', () => {
    expect(parseClientMessageValue({ type: 'evil', room: 'r' })).toBeNull();
  });
});

describe('frame and field boundaries', () => {
  it('rejects an over-ceiling frame that would otherwise parse', () => {
    // Unknown properties are dropped, so a valid message can still arrive
    // in an arbitrarily large frame; the ceiling is what stops it.
    const raw = JSON.stringify({
      type: 'ask.log',
      room: 'r',
      user: 'u',
      pad: 'x'.repeat(MAX_WS_FRAME_CHARS),
    });
    expect(raw.length).toBeGreaterThan(MAX_WS_FRAME_CHARS);
    expect(parseClientMessage(raw)).toBeNull();
  });

  it('accepts a frame sized exactly at the ceiling', () => {
    const envelope = JSON.stringify({
      type: 'ask.log',
      room: 'r',
      user: 'u',
      pad: '',
    });
    const raw = JSON.stringify({
      type: 'ask.log',
      room: 'r',
      user: 'u',
      pad: 'x'.repeat(MAX_WS_FRAME_CHARS - envelope.length),
    });
    expect(raw.length).toBe(MAX_WS_FRAME_CHARS);
    expect(parseClientMessage(raw)).toEqual({
      type: 'ask.log',
      room: 'r',
      user: 'u',
    });
  });

  it('rejects values that are not plain objects', () => {
    expect(parseClientMessage('"chat"')).toBeNull();
    expect(parseClientMessage('42')).toBeNull();
    expect(parseClientMessageValue('chat')).toBeNull();
    // A callable carrying message-shaped properties is still not a message.
    const callable = Object.assign(() => undefined, {
      type: 'ask.recalc',
      room: 'r',
    });
    expect(parseClientMessageValue(callable)).toBeNull();
  });

  it('canonicalizes the discriminators that carry no auth field', () => {
    expect(parseClientMessageValue({ type: 'ask.recalc', room: 'r' })).toEqual({
      type: 'ask.recalc',
      room: 'r',
    });
    expect(
      parseClientMessageValue({
        type: 'my.ecell',
        room: 'r',
        user: 'u',
        ecell: 'A1',
      }),
    ).toEqual({ type: 'my.ecell', room: 'r', user: 'u', ecell: 'A1' });
  });

  it('omits absent optional fields rather than writing undefined keys', () => {
    const keysOf = (value: unknown): string[] =>
      Object.keys(parseClientMessageValue(value) ?? {}).sort();
    expect(
      keysOf({ type: 'execute', room: 'r', user: 'u', cmdstr: 'set A1 value n 1' }),
    ).toEqual(['cmdstr', 'room', 'type', 'user']);
    expect(keysOf({ type: 'stopHuddle', room: 'r' })).toEqual(['room', 'type']);
    expect(keysOf({ type: 'ecell', room: 'r', user: 'u', ecell: 'A1' })).toEqual([
      'ecell',
      'room',
      'type',
      'user',
    ]);
  });

  it('accepts empty and exactly-capped field values', () => {
    // Only `room` is required to be non-empty; the rest may be blank.
    expect(parseClientMessageValue({ type: 'ask.log', room: 'r', user: '' })).toEqual({
      type: 'ask.log',
      room: 'r',
      user: '',
    });
    const user = 'u'.repeat(MAX_WS_USER_CHARS);
    expect(parseClientMessageValue({ type: 'ask.log', room: 'r', user })).toEqual({
      type: 'ask.log',
      room: 'r',
      user,
    });
  });
});

describe('isStorageSafeCommand', () => {
  it('counts ASCII, BMP, and surrogate-pair UTF-8 encodings', () => {
    expect(isStorageSafeCommand('a'.repeat(MAX_COMMAND_UTF8_BYTES))).toBe(true);
    expect(isStorageSafeCommand('a'.repeat(MAX_COMMAND_UTF8_BYTES + 1))).toBe(false);
    expect(isStorageSafeCommand('€'.repeat(MAX_COMMAND_UTF8_BYTES / 3))).toBe(true);
    expect(isStorageSafeCommand(`${'€'.repeat(MAX_COMMAND_UTF8_BYTES / 3)}€`)).toBe(false);
    expect(isStorageSafeCommand('😀'.repeat(MAX_COMMAND_UTF8_BYTES / 4))).toBe(true);
    expect(isStorageSafeCommand(`${'😀'.repeat(MAX_COMMAND_UTF8_BYTES / 4)}😀`)).toBe(false);
  });

  it('rejects non-strings and treats unpaired surrogates as three-byte code points', () => {
    expect(isStorageSafeCommand(null)).toBe(false);
    // Two-byte code points (U+0080..U+07FF) sit between the ASCII and BMP arms.
    expect(isStorageSafeCommand('é'.repeat(MAX_COMMAND_UTF8_BYTES / 2))).toBe(true);
    expect(
      isStorageSafeCommand(`${'é'.repeat(MAX_COMMAND_UTF8_BYTES / 2)}é`),
    ).toBe(false);
    expect(isStorageSafeCommand('\ud800')).toBe(true);
    expect(isStorageSafeCommand('\udc00')).toBe(true);
  });

  it('counts each UTF-8 width class at its exact boundary', () => {
    // U+007F is the last one-byte code point.
    expect(isStorageSafeCommand('\u007f'.repeat(MAX_COMMAND_UTF8_BYTES))).toBe(true);
    // One 3-byte char pushes a length-capped ASCII run past the byte cap.
    expect(
      isStorageSafeCommand('a'.repeat(MAX_COMMAND_UTF8_BYTES - 1) + '€'),
    ).toBe(false);
    // U+07FF is the last two-byte code point.
    expect(
      isStorageSafeCommand('\u07ff'.repeat(MAX_COMMAND_UTF8_BYTES / 2)),
    ).toBe(true);
    expect(
      isStorageSafeCommand('\u07ff'.repeat(MAX_COMMAND_UTF8_BYTES / 2 + 1)),
    ).toBe(false);
    // Both ends of the surrogate-pair range encode as four bytes.
    expect(
      isStorageSafeCommand('\ud800\udc00'.repeat(MAX_COMMAND_UTF8_BYTES / 4)),
    ).toBe(true);
    expect(
      isStorageSafeCommand('\ud800\udc00'.repeat(MAX_COMMAND_UTF8_BYTES / 4 + 1)),
    ).toBe(false);
    expect(
      isStorageSafeCommand('\udbff\udfff'.repeat(MAX_COMMAND_UTF8_BYTES / 4)),
    ).toBe(true);
    // A BMP char followed by a lone low surrogate is 3+3, never a pair.
    expect(
      isStorageSafeCommand('€\udc00'.repeat(Math.floor(MAX_COMMAND_UTF8_BYTES / 5))),
    ).toBe(false);
    // Only a well-formed high+low pair collapses to four bytes. Each of these
    // is 3+3 per unit, so a run that fits under the cap as pairs must not.
    const fifth = Math.floor(MAX_COMMAND_UTF8_BYTES / 5);
    // Lone low surrogate first: never a pair opener.
    expect(isStorageSafeCommand('\udc00\udc00'.repeat(fifth))).toBe(false);
    // High surrogate followed by a BMP char: not a pair.
    expect(isStorageSafeCommand('\ud800€'.repeat(fifth))).toBe(false);
    // High surrogate followed by the first code point above the low range.
    expect(isStorageSafeCommand('\ud800\ue000'.repeat(fifth))).toBe(false);
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
