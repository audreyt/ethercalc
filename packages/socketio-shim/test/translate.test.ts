import { describe, expect, it } from 'vitest';
import type { ClientMessage, ServerMessage } from '@ethercalc/shared/messages';
import { decodeFrame, encodeFrame, PacketType, type Packet } from '../src/framing.ts';
import { nativeToSocketIoEvent, socketIoEventToNative } from '../src/translate.ts';

function wrapEvent(msg: unknown): Packet {
  return {
    type: PacketType.Event,
    endpoint: '',
    data: JSON.stringify({ name: 'data', args: [msg] }),
  };
}

describe('socketIoEventToNative', () => {
  const clientCases: ClientMessage[] = [
    { type: 'chat', room: 'r', user: 'u', msg: 'hi' },
    { type: 'ask.ecells', room: 'r' },
    { type: 'my.ecell', room: 'r', user: 'u', ecell: 'A1' },
    { type: 'execute', room: 'r', user: 'u', cmdstr: 'set A1 value n 1' },
    { type: 'ask.log', room: 'r', user: 'u' },
    { type: 'ask.recalc', room: 'r' },
    { type: 'stopHuddle', room: 'r', auth: 'abc' },
    { type: 'ecell', room: 'r', user: 'u', ecell: 'A1', original: 'A1', auth: 'abc' },
  ];

  it.each(clientCases)('unwraps %o', (msg) => {
    expect(socketIoEventToNative(wrapEvent(msg))).toEqual(msg);
  });

  it('returns null for non-event packet type', () => {
    expect(socketIoEventToNative({ type: PacketType.Heartbeat })).toBeNull();
    expect(socketIoEventToNative({ type: PacketType.Connect })).toBeNull();
  });

  it('returns null when data is missing', () => {
    expect(socketIoEventToNative({ type: PacketType.Event })).toBeNull();
  });

  it('returns null when data is empty string', () => {
    expect(socketIoEventToNative({ type: PacketType.Event, data: '' })).toBeNull();
  });

  it('returns null for malformed JSON', () => {
    expect(
      socketIoEventToNative({ type: PacketType.Event, data: '{not json' }),
    ).toBeNull();
  });

  it('returns null when parsed JSON is not an object', () => {
    expect(
      socketIoEventToNative({ type: PacketType.Event, data: '"just a string"' }),
    ).toBeNull();
    expect(socketIoEventToNative({ type: PacketType.Event, data: 'null' })).toBeNull();
  });

  it('returns null when event name is not "data"', () => {
    expect(
      socketIoEventToNative({
        type: PacketType.Event,
        data: JSON.stringify({ name: 'other', args: [{ type: 'chat' }] }),
      }),
    ).toBeNull();
  });

  it('returns null when args is missing', () => {
    expect(
      socketIoEventToNative({
        type: PacketType.Event,
        data: JSON.stringify({ name: 'data' }),
      }),
    ).toBeNull();
  });

  it('returns null when args is not an array', () => {
    expect(
      socketIoEventToNative({
        type: PacketType.Event,
        data: JSON.stringify({ name: 'data', args: 'not-array' }),
      }),
    ).toBeNull();
  });

  it('returns null when args is empty', () => {
    expect(
      socketIoEventToNative({
        type: PacketType.Event,
        data: JSON.stringify({ name: 'data', args: [] }),
      }),
    ).toBeNull();
  });

  it('returns null when first arg is not an object', () => {
    expect(socketIoEventToNative(wrapEvent('string'))).toBeNull();
    expect(socketIoEventToNative(wrapEvent(42))).toBeNull();
    expect(socketIoEventToNative(wrapEvent(null))).toBeNull();
  });

  it('returns null when type field is missing', () => {
    expect(socketIoEventToNative(wrapEvent({ room: 'r' }))).toBeNull();
  });

  it('returns null when type field is not a string', () => {
    expect(socketIoEventToNative(wrapEvent({ type: 42 }))).toBeNull();
  });

  it('returns null for unknown client message types', () => {
    expect(socketIoEventToNative(wrapEvent({ type: 'made.up' }))).toBeNull();
  });
});

describe('nativeToSocketIoEvent', () => {
  const serverCases: ServerMessage[] = [
    { type: 'log', room: 'r', log: ['a'], chat: ['b'], snapshot: 'S' },
    { type: 'recalc', room: 'r', log: [], snapshot: 'S' },
    { type: 'recalc', room: 'r', log: [], snapshot: 'S', force: true },
    { type: 'snapshot', snapshot: 'S' },
    { type: 'ecells', room: 'r', ecells: { u: 'A1' } },
    { type: 'execute', room: 'r', user: 'u', cmdstr: 'x' },
    { type: 'execute', room: 'r', user: 'u', cmdstr: 'x', include_self: true },
    { type: 'chat', room: 'r', user: 'u', msg: 'hi' },
    { type: 'confirmemailsent', message: 'sent' },
    { type: 'ignore' },
    { type: 'stopHuddle', room: 'r' },
    { type: 'ecell', room: 'r', user: 'u', ecell: 'A1' },
    { type: 'my.ecell', room: 'r', user: 'u', ecell: 'A1' },
  ];

  it.each(serverCases)('wraps %o in a socket.io event frame', (msg) => {
    const framed = nativeToSocketIoEvent(msg);
    expect(framed.startsWith('5:::')).toBe(true);

    const packet = decodeFrame(framed);
    expect(packet?.type).toBe(PacketType.Event);

    const parsed = JSON.parse(packet!.data!);
    expect(parsed).toEqual({ name: 'data', args: [msg] });
  });

  it('produces a frame that round-trips back to the original message for ClientMessage-shaped payloads', () => {
    // Round-tripping only works for messages that satisfy ClientMessage;
    // we pick one that's valid in both directions.
    const msg = { type: 'chat', room: 'r', user: 'u', msg: 'hi' } as const;
    const framed = nativeToSocketIoEvent(msg);
    const packet = decodeFrame(framed);
    expect(socketIoEventToNative(packet!)).toEqual(msg);
  });

  it('uses event name "data"', () => {
    const framed = nativeToSocketIoEvent({ type: 'ignore' });
    expect(framed).toContain('"name":"data"');
  });

  it('wraps msg as the single arg', () => {
    const framed = nativeToSocketIoEvent({ type: 'ignore' });
    const packet = decodeFrame(framed);
    const parsed = JSON.parse(packet!.data!);
    expect(parsed.args).toHaveLength(1);
    expect(parsed.args[0]).toEqual({ type: 'ignore' });
  });

  it('emits empty endpoint segment', () => {
    // The frame is `5:::<json>` — id empty, endpoint empty.
    const framed = nativeToSocketIoEvent({ type: 'ignore' });
    expect(framed.slice(0, 4)).toBe('5:::');
  });
});

describe('round-trip via encodeFrame', () => {
  it('client → wire → client preserves the payload', () => {
    const original: ClientMessage = {
      type: 'execute',
      room: 'r',
      user: 'u',
      cmdstr: 'set A1 value n 1',
    };
    const wireFromClient = encodeFrame({
      type: PacketType.Event,
      data: JSON.stringify({ name: 'data', args: [original] }),
    });
    const packet = decodeFrame(wireFromClient);
    expect(socketIoEventToNative(packet!)).toEqual(original);
  });
});
