import { describe, expect, it } from 'vitest';
import {
  buildHandshakeResponse,
  DEFAULT_TRANSPORTS,
  parseHandshakePath,
} from '../src/handshake.ts';

describe('buildHandshakeResponse', () => {
  it('builds a canonical response with default transports', () => {
    expect(
      buildHandshakeResponse({
        sid: 'abcd1234',
        hbTimeoutSec: 60,
        closeTimeoutSec: 60,
        transports: DEFAULT_TRANSPORTS,
      }),
    ).toBe('abcd1234:60:60:websocket,xhr-polling');
  });

  it('joins multiple transports with a comma', () => {
    expect(
      buildHandshakeResponse({
        sid: 'x',
        hbTimeoutSec: 15,
        closeTimeoutSec: 30,
        transports: ['websocket', 'xhr-polling', 'jsonp-polling'],
      }),
    ).toBe('x:15:30:websocket,xhr-polling,jsonp-polling');
  });

  it('handles a single-transport list', () => {
    expect(
      buildHandshakeResponse({
        sid: 'sid',
        hbTimeoutSec: 1,
        closeTimeoutSec: 2,
        transports: ['websocket'],
      }),
    ).toBe('sid:1:2:websocket');
  });

  it('handles an empty transports list', () => {
    // Edge case — legacy server always sends at least one, but the
    // function is pure so we should handle it without throwing.
    expect(
      buildHandshakeResponse({
        sid: 's',
        hbTimeoutSec: 1,
        closeTimeoutSec: 1,
        transports: [],
      }),
    ).toBe('s:1:1:');
  });
});

describe('parseHandshakePath', () => {
  it('parses the initial handshake path with trailing slash', () => {
    expect(parseHandshakePath('/socket.io/1/')).toEqual({});
  });

  it('parses the initial handshake path without trailing slash', () => {
    expect(parseHandshakePath('/socket.io/1')).toEqual({});
  });

  it('parses a websocket transport path', () => {
    expect(parseHandshakePath('/socket.io/1/websocket/abc123')).toEqual({
      transport: 'websocket',
      sid: 'abc123',
    });
  });

  it('parses an xhr-polling transport path', () => {
    expect(parseHandshakePath('/socket.io/1/xhr-polling/def456')).toEqual({
      transport: 'xhr-polling',
      sid: 'def456',
    });
  });

  it('parses a jsonp-polling transport path and drops the trailing index', () => {
    expect(parseHandshakePath('/socket.io/1/jsonp-polling/xyz/0')).toEqual({
      transport: 'jsonp-polling',
      sid: 'xyz',
    });
  });

  it('strips a BASEPATH prefix', () => {
    expect(parseHandshakePath('/mount/socket.io/1/websocket/abc')).toEqual({
      transport: 'websocket',
      sid: 'abc',
    });
  });

  it('accepts a full URL', () => {
    expect(
      parseHandshakePath('https://example.com/socket.io/1/websocket/abc123?t=1'),
    ).toEqual({ transport: 'websocket', sid: 'abc123' });
  });

  it('returns null for a non-socket.io path', () => {
    expect(parseHandshakePath('/some/other/path')).toBeNull();
  });

  it('returns null for empty input', () => {
    expect(parseHandshakePath('')).toBeNull();
  });

  it('returns null for a non-string argument', () => {
    expect(parseHandshakePath(undefined as unknown as string)).toBeNull();
  });

  it('returns null for an unparseable URL', () => {
    // URL with an invalid base — the URL ctor will throw and we catch it.
    expect(parseHandshakePath('http://[')).toBeNull();
  });

  it('returns null for socket.io/2/* (protocol 2)', () => {
    // Only protocol 1 is supported by this shim; protocol 2 is the
    // later Engine.IO format handled elsewhere or ignored.
    expect(parseHandshakePath('/socket.io/2/websocket/abc')).toBeNull();
  });

  it('returns null for malformed transport segment', () => {
    expect(parseHandshakePath('/socket.io/1/BAD_TRANSPORT/abc')).toBeNull();
  });

  it('returns null when the sid is missing', () => {
    expect(parseHandshakePath('/socket.io/1/websocket/')).toBeNull();
  });
});
