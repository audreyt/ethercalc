/**
 * Pure unit tests for `src/lib/ws-dispatch.ts`. Exercises every branch so
 * the Node coverage gate stays at 100%. Integration-level WS handling
 * (hibernation, attachments, broadcast) is tested via `room.test.ts`.
 */
import { describe, expect, it } from 'vitest';

import {
  buildAskEcellBroadcast,
  buildChatBroadcast,
  buildEcellBroadcast,
  buildEcellsReply,
  buildExecuteBroadcast,
  buildLogReply,
  buildMyEcellBroadcast,
  buildStopHuddleBroadcast,
  clientMessageType,
  computeSubmitFormTarget,
  isFilteredExecuteCommand,
  isSubmitForm,
} from '../src/lib/ws-dispatch.ts';

describe('isFilteredExecuteCommand', () => {
  it('matches the exact text-wiki filter command', () => {
    expect(
      isFilteredExecuteCommand('set sheet defaulttextvalueformat text-wiki'),
    ).toBe(true);
  });
  it('rejects any other command', () => {
    expect(isFilteredExecuteCommand('set A1 value n 1')).toBe(false);
    expect(isFilteredExecuteCommand('')).toBe(false);
  });
});

describe('isSubmitForm', () => {
  it('matches bare submitform with no body', () => {
    expect(isSubmitForm('submitform')).toBe(true);
  });
  it('matches submitform followed by CR then row data', () => {
    expect(isSubmitForm('submitform\rset A1 value n 1')).toBe(true);
  });
  it('tolerates whitespace around the header line', () => {
    expect(isSubmitForm('  submitform  \rpayload')).toBe(true);
  });
  it('rejects non-submitform commands', () => {
    expect(isSubmitForm('execute submitform')).toBe(false);
    expect(isSubmitForm('set A1 value n 1')).toBe(false);
  });
  it('rejects empty input', () => {
    expect(isSubmitForm('')).toBe(false);
  });
  it('rejects non-string input via runtime contract', () => {
    expect(isSubmitForm(null as unknown as string)).toBe(false);
  });
});

describe('computeSubmitFormTarget', () => {
  it('appends _formdata to a normal room', () => {
    const { siblingRoom, siblingCommands } = computeSubmitFormTarget(
      'hello',
      'submitform\rset A1 value n 1',
    );
    expect(siblingRoom).toBe('hello_formdata');
    expect(siblingCommands).toBe('set A1 value n 1');
  });
  it('leaves _formdata-suffixed rooms alone (idempotent)', () => {
    const { siblingRoom, siblingCommands } = computeSubmitFormTarget(
      'hello_formdata',
      'submitform\rset B2 value n 2',
    );
    expect(siblingRoom).toBe('hello_formdata');
    expect(siblingCommands).toBe('set B2 value n 2');
  });
  it('returns empty commands when cmdstr is the bare header', () => {
    const { siblingCommands } = computeSubmitFormTarget('r', 'submitform');
    expect(siblingCommands).toBe('');
  });
});

describe('broadcast shapers', () => {
  it('buildChatBroadcast carries through all fields', () => {
    expect(
      buildChatBroadcast({ type: 'chat', room: 'r', user: 'u', msg: 'hi' }),
    ).toEqual({ type: 'chat', room: 'r', user: 'u', msg: 'hi' });
  });

  it('buildExecuteBroadcast without auth or include_self drops both', () => {
    const out = buildExecuteBroadcast(
      { type: 'execute', room: 'r', user: 'u', cmdstr: 'c' },
      false,
    );
    expect(out).toEqual({ type: 'execute', room: 'r', user: 'u', cmdstr: 'c' });
    expect('auth' in out).toBe(false);
    expect('include_self' in out).toBe(false);
  });

  it('buildExecuteBroadcast preserves auth when supplied', () => {
    const out = buildExecuteBroadcast(
      { type: 'execute', room: 'r', user: 'u', cmdstr: 'c', auth: 'h' },
      false,
    );
    expect(out.auth).toBe('h');
  });

  it('buildExecuteBroadcast sets include_self when requested', () => {
    const out = buildExecuteBroadcast(
      { type: 'execute', room: 'r', user: 'u', cmdstr: 'c' },
      true,
    );
    expect(out.include_self).toBe(true);
  });

  it('buildEcellsReply wraps the ecells map', () => {
    expect(buildEcellsReply('r', { a: 'A1' })).toEqual({
      type: 'ecells',
      room: 'r',
      ecells: { a: 'A1' },
    });
  });

  it('buildMyEcellBroadcast preserves fields', () => {
    expect(
      buildMyEcellBroadcast({
        type: 'my.ecell',
        room: 'r',
        user: 'u',
        ecell: 'A1',
      }),
    ).toEqual({ type: 'my.ecell', room: 'r', user: 'u', ecell: 'A1' });
  });

  it('buildEcellBroadcast without optional fields yields minimum shape', () => {
    const out = buildEcellBroadcast({
      type: 'ecell',
      room: 'r',
      user: 'u',
      ecell: 'A1',
    });
    expect(out).toEqual({ type: 'ecell', room: 'r', user: 'u', ecell: 'A1' });
    expect('original' in out).toBe(false);
    expect('auth' in out).toBe(false);
    expect('to' in out).toBe(false);
  });

  it('buildEcellBroadcast preserves original + auth when supplied', () => {
    const out = buildEcellBroadcast({
      type: 'ecell',
      room: 'r',
      user: 'u',
      ecell: 'A1',
      original: 'B2',
      auth: 'h',
    });
    expect(out.original).toBe('B2');
    expect(out.auth).toBe('h');
  });

  it('buildEcellBroadcast preserves `to` for ask.ecell private replies', () => {
    const out = buildEcellBroadcast({
      type: 'ecell',
      room: 'r',
      user: 'me',
      ecell: 'C4',
      to: 'asker',
    });
    expect(out.to).toBe('asker');
  });

  it('buildAskEcellBroadcast carries room + asker user for peers to target', () => {
    expect(
      buildAskEcellBroadcast({ type: 'ask.ecell', room: 'r', user: 'alice' }),
    ).toEqual({ type: 'ask.ecell', room: 'r', user: 'alice' });
  });

  it('buildStopHuddleBroadcast preserves auth only when supplied', () => {
    const without = buildStopHuddleBroadcast({ type: 'stopHuddle', room: 'r' });
    expect(without).toEqual({ type: 'stopHuddle', room: 'r' });
    // `toEqual` treats {x: undefined} and {} the same. To kill the
    // "always assign auth" mutant at buildStopHuddleBroadcast line 167,
    // we must assert the absence of the key explicitly.
    expect('auth' in without).toBe(false);
    expect(
      buildStopHuddleBroadcast({ type: 'stopHuddle', room: 'r', auth: 'h' }),
    ).toEqual({ type: 'stopHuddle', room: 'r', auth: 'h' });
  });

  it('buildLogReply assembles the four-field response', () => {
    expect(
      buildLogReply(
        { type: 'ask.log', room: 'r', user: 'u' },
        ['cmd-1'],
        ['hi'],
        'SNAP',
      ),
    ).toEqual({
      type: 'log',
      room: 'r',
      log: ['cmd-1'],
      chat: ['hi'],
      snapshot: 'SNAP',
    });
  });
});

describe('clientMessageType', () => {
  it('returns the discriminator value unchanged', () => {
    expect(
      clientMessageType({ type: 'ask.log', room: 'r', user: 'u' }),
    ).toBe('ask.log');
  });
});
