import { describe, expect, it } from 'vitest';
import { decodeFrame, encodeFrame, PacketType, type Packet } from '../src/framing.ts';

describe('encodeFrame', () => {
  it('encodes just a type (disconnect)', () => {
    expect(encodeFrame({ type: PacketType.Disconnect })).toBe('0::');
  });

  it('encodes a connect packet with endpoint', () => {
    expect(encodeFrame({ type: PacketType.Connect, endpoint: '/' })).toBe('1::/');
  });

  it('encodes a heartbeat (no id, no endpoint, no data)', () => {
    expect(encodeFrame({ type: PacketType.Heartbeat })).toBe('2::');
  });

  it('encodes a plain message', () => {
    expect(encodeFrame({ type: PacketType.Message, data: 'hello' })).toBe('3:::hello');
  });

  it('encodes a json message', () => {
    expect(encodeFrame({ type: PacketType.Json, data: '{"a":1}' })).toBe('4:::{"a":1}');
  });

  it('encodes an event with endpoint and data', () => {
    expect(
      encodeFrame({
        type: PacketType.Event,
        endpoint: '/',
        data: '{"name":"data","args":[{"x":1}]}',
      }),
    ).toBe('5::/:{"name":"data","args":[{"x":1}]}');
  });

  it('encodes an ack with id', () => {
    expect(encodeFrame({ type: PacketType.Ack, id: 7, data: '[1,2]' })).toBe('6:7::[1,2]');
  });

  it('encodes an error packet', () => {
    expect(encodeFrame({ type: PacketType.Error, data: 'boom' })).toBe('7:::boom');
  });

  it('encodes a noop', () => {
    expect(encodeFrame({ type: PacketType.Noop })).toBe('8::');
  });

  it('preserves colons inside data', () => {
    expect(
      encodeFrame({ type: PacketType.Event, data: '{"url":"http://x:80/y"}' }),
    ).toBe('5:::{"url":"http://x:80/y"}');
  });
});

describe('decodeFrame', () => {
  it('round-trips every packet type', () => {
    const cases: Packet[] = [
      { type: PacketType.Disconnect },
      { type: PacketType.Connect, endpoint: '/' },
      { type: PacketType.Heartbeat },
      { type: PacketType.Message, data: 'hello' },
      { type: PacketType.Json, data: '{"a":1}' },
      { type: PacketType.Event, endpoint: '/', data: '{"name":"data","args":[{"x":1}]}' },
      { type: PacketType.Ack, id: 7, data: '[1,2]' },
      { type: PacketType.Error, data: 'boom' },
      { type: PacketType.Noop },
    ];
    for (const p of cases) {
      const raw = encodeFrame(p);
      expect(decodeFrame(raw)).toEqual(p);
    }
  });

  it('decodes a bare type code', () => {
    expect(decodeFrame('2')).toEqual({ type: PacketType.Heartbeat });
  });

  it('decodes id with + suffix (auto-ack)', () => {
    expect(decodeFrame('5:7+::{"name":"data","args":[{}]}')).toEqual({
      type: PacketType.Event,
      id: 7,
      data: '{"name":"data","args":[{}]}',
    });
  });

  it('keeps embedded colons in data intact', () => {
    const raw = '5:::{"url":"http://x:80/y"}';
    expect(decodeFrame(raw)).toEqual({
      type: PacketType.Event,
      data: '{"url":"http://x:80/y"}',
    });
  });

  it('rejects empty input', () => {
    expect(decodeFrame('')).toBeNull();
  });

  it('rejects non-string input', () => {
    // Deliberate type-cast: guard against JS callers passing non-string.
    expect(decodeFrame(undefined as unknown as string)).toBeNull();
  });

  it('rejects multi-digit type codes', () => {
    // "42" is the Engine.IO (socket.io 1.x) format, not v0.9.
    expect(decodeFrame('42["data",{}]')).toBeNull();
  });

  it('rejects non-digit type', () => {
    expect(decodeFrame('x::')).toBeNull();
  });

  it('rejects type code 9 (out of range)', () => {
    expect(decodeFrame('9::')).toBeNull();
  });

  it('rejects non-numeric id', () => {
    expect(decodeFrame('5:abc::{"name":"data","args":[{}]}')).toBeNull();
  });

  it('rejects id that is just +', () => {
    expect(decodeFrame('5:+::{}')).toBeNull();
  });

  it('leaves id undefined when segment is empty', () => {
    expect(decodeFrame('5:::x')).toEqual({ type: PacketType.Event, data: 'x' });
  });

  it('leaves endpoint undefined when segment is empty', () => {
    const p = decodeFrame('3:::hello');
    expect(p?.endpoint).toBeUndefined();
    expect(p?.data).toBe('hello');
  });

  it('parses endpoint when present', () => {
    expect(decodeFrame('1::/chat')).toEqual({
      type: PacketType.Connect,
      endpoint: '/chat',
    });
  });

  it('parses id without + suffix', () => {
    expect(decodeFrame('6:12::[1]')).toEqual({
      type: PacketType.Ack,
      id: 12,
      data: '[1]',
    });
  });
});
