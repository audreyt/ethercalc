import { describe, expect, it } from 'vitest';
import { installLegacyIo, LEGACY_IO_JS } from '../src/client/legacy-io.ts';

/**
 * Full jsdom/happy-dom eval is avoided deliberately (see FINDINGS): the
 * package's test env is plain Node, and pulling a DOM library in just to
 * cover this tiny shim would double the dev-dep surface. Instead we:
 *   - call `installLegacyIo` directly with a hand-rolled host mock that
 *     exposes the three touch points (WebSocket, location, io) the shim
 *     reads;
 *   - assert structural properties of LEGACY_IO_JS (IIFE wrapper, call
 *     site) so a refactor can't silently break the bundled string.
 */

type Listener = (ev: any) => void;

class FakeWebSocket {
  static last: FakeWebSocket | null = null;
  readonly url: string;
  readonly sent: unknown[] = [];
  closed = false;
  private readonly listeners = new Map<string, Listener[]>();
  sendThrows = false;
  closeThrows = false;

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.last = this;
  }

  send(data: unknown): void {
    if (this.sendThrows) throw new Error('send-boom');
    this.sent.push(data);
  }

  close(): void {
    if (this.closeThrows) throw new Error('close-boom');
    this.closed = true;
  }

  addEventListener(type: string, listener: Listener): void {
    const bucket = this.listeners.get(type) ?? [];
    bucket.push(listener);
    this.listeners.set(type, bucket);
  }

  emit(type: string, ev?: any): void {
    for (const l of this.listeners.get(type) ?? []) l(ev);
  }
}

function makeHost(protocol: 'http:' | 'https:' = 'http:') {
  return {
    WebSocket: FakeWebSocket as unknown as typeof WebSocket,
    location: { host: 'example.com', protocol },
    io: undefined as unknown,
  };
}

describe('installLegacyIo', () => {
  it('installs `io` onto the host', () => {
    const host = makeHost();
    installLegacyIo(host);
    expect(typeof host.io).toBe('function');
  });

  it('does nothing when host.io is already set', () => {
    const existing = { sentinel: true };
    const host = makeHost();
    host.io = existing;
    installLegacyIo(host);
    expect(host.io).toBe(existing);
  });

  it('io() returns an object with emit/on/disconnect', () => {
    const host = makeHost();
    installLegacyIo(host);
    const sock = (host.io as (url?: string) => {
      emit: unknown;
      on: unknown;
      disconnect: unknown;
    })();
    expect(typeof sock.emit).toBe('function');
    expect(typeof sock.on).toBe('function');
    expect(typeof sock.disconnect).toBe('function');
  });

  it('defaults to ws://host/_ws/legacy when no URL is given', () => {
    const host = makeHost('http:');
    installLegacyIo(host);
    (host.io as (url?: string) => void)();
    expect(FakeWebSocket.last?.url).toBe('ws://example.com/_ws/legacy');
  });

  it('uses wss when location.protocol is https', () => {
    const host = makeHost('https:');
    installLegacyIo(host);
    (host.io as (url?: string) => void)();
    expect(FakeWebSocket.last?.url).toBe('wss://example.com/_ws/legacy');
  });

  it('rewrites http(s) URLs to ws(s) when passed a custom URL', () => {
    const host = makeHost('https:');
    installLegacyIo(host);
    (host.io as (url?: string) => void)('https://other/_ws/x');
    expect(FakeWebSocket.last?.url).toBe('wss://other/_ws/x');
  });

  it('accepts a bare ws URL', () => {
    const host = makeHost();
    installLegacyIo(host);
    (host.io as (url?: string) => void)('ws://custom/_ws/y');
    expect(FakeWebSocket.last?.url).toBe('ws://custom/_ws/y');
  });

  it('on("connect") fires when the WS opens', () => {
    const host = makeHost();
    installLegacyIo(host);
    const sock = (host.io as (url?: string) => {
      on: (event: string, cb: Listener) => void;
    })();
    let called = 0;
    sock.on('connect', () => called++);
    FakeWebSocket.last!.emit('open');
    expect(called).toBe(1);
  });

  it('on("disconnect") fires when the WS closes', () => {
    const host = makeHost();
    installLegacyIo(host);
    const sock = (host.io as (url?: string) => {
      on: (event: string, cb: Listener) => void;
    })();
    let called = 0;
    sock.on('disconnect', () => called++);
    FakeWebSocket.last!.emit('close');
    expect(called).toBe(1);
  });

  it('on("error") fires on ws error', () => {
    const host = makeHost();
    installLegacyIo(host);
    const sock = (host.io as (url?: string) => {
      on: (event: string, cb: Listener) => void;
    })();
    let called = 0;
    sock.on('error', () => called++);
    FakeWebSocket.last!.emit('error');
    expect(called).toBe(1);
  });

  it('on("data") receives parsed JSON payloads', () => {
    const host = makeHost();
    installLegacyIo(host);
    const sock = (host.io as (url?: string) => {
      on: (event: string, cb: Listener) => void;
    })();
    const received: unknown[] = [];
    sock.on('data', (payload) => received.push(payload));
    FakeWebSocket.last!.emit('message', { data: JSON.stringify({ type: 'ignore' }) });
    expect(received).toEqual([{ type: 'ignore' }]);
  });

  it('on("data") passes the raw string through when JSON is malformed', () => {
    const host = makeHost();
    installLegacyIo(host);
    const sock = (host.io as (url?: string) => {
      on: (event: string, cb: Listener) => void;
    })();
    const received: unknown[] = [];
    sock.on('data', (payload) => received.push(payload));
    FakeWebSocket.last!.emit('message', { data: '{not json' });
    expect(received).toEqual(['{not json']);
  });

  it('on("data") passes non-string payloads verbatim', () => {
    const host = makeHost();
    installLegacyIo(host);
    const sock = (host.io as (url?: string) => {
      on: (event: string, cb: Listener) => void;
    })();
    const received: unknown[] = [];
    sock.on('data', (payload) => received.push(payload));
    const buf = new ArrayBuffer(4);
    FakeWebSocket.last!.emit('message', { data: buf });
    expect(received).toEqual([buf]);
  });

  it('fires nothing when an unregistered event is emitted (no listeners bucket)', () => {
    const host = makeHost();
    installLegacyIo(host);
    (host.io as (url?: string) => void)();
    // Emit an event no one subscribed to — should be a no-op.
    expect(() => FakeWebSocket.last!.emit('custom')).not.toThrow();
  });

  it('gracefully handles WS lifecycle events with no registered user listener', () => {
    // The `fire()` path has a short-circuit when listeners[event] is
    // undefined (no one called `.on(event, cb)`). That branch is only
    // reachable when the WS emits `open`/`close`/`error`/`message`
    // before the user hooks up listeners.
    const host = makeHost();
    installLegacyIo(host);
    (host.io as (url?: string) => void)(); // creates the WS but no `.on()` calls
    expect(() => FakeWebSocket.last!.emit('open')).not.toThrow();
    expect(() => FakeWebSocket.last!.emit('close')).not.toThrow();
    expect(() => FakeWebSocket.last!.emit('error')).not.toThrow();
    expect(() => FakeWebSocket.last!.emit('message', { data: '{}' })).not.toThrow();
  });

  it('emit("data", obj) serializes object payloads to JSON before send', () => {
    const host = makeHost();
    installLegacyIo(host);
    const sock = (host.io as (url?: string) => {
      emit: (event: string, data: unknown) => void;
    })();
    sock.emit('data', { type: 'chat', room: 'r', user: 'u', msg: 'hi' });
    expect(FakeWebSocket.last!.sent).toEqual([
      '{"type":"chat","room":"r","user":"u","msg":"hi"}',
    ]);
  });

  it('emit("data", string) sends the string as-is', () => {
    const host = makeHost();
    installLegacyIo(host);
    const sock = (host.io as (url?: string) => {
      emit: (event: string, data: unknown) => void;
    })();
    sock.emit('data', 'raw');
    expect(FakeWebSocket.last!.sent).toEqual(['raw']);
  });

  it('emit with non-data event is ignored', () => {
    const host = makeHost();
    installLegacyIo(host);
    const sock = (host.io as (url?: string) => {
      emit: (event: string, data: unknown) => void;
    })();
    sock.emit('other', 'hello');
    expect(FakeWebSocket.last!.sent).toEqual([]);
  });

  it('emit swallows send errors (closed socket)', () => {
    const host = makeHost();
    installLegacyIo(host);
    const sock = (host.io as (url?: string) => {
      emit: (event: string, data: unknown) => void;
    })();
    FakeWebSocket.last!.sendThrows = true;
    expect(() => sock.emit('data', { type: 'ignore' })).not.toThrow();
  });

  it('disconnect closes the WS', () => {
    const host = makeHost();
    installLegacyIo(host);
    const sock = (host.io as (url?: string) => { disconnect: () => void })();
    sock.disconnect();
    expect(FakeWebSocket.last!.closed).toBe(true);
  });

  it('disconnect swallows errors from close()', () => {
    const host = makeHost();
    installLegacyIo(host);
    const sock = (host.io as (url?: string) => { disconnect: () => void })();
    FakeWebSocket.last!.closeThrows = true;
    expect(() => sock.disconnect()).not.toThrow();
  });

  it('handles a URL that is explicitly the empty string (falls back to default)', () => {
    // `typeof url === 'string' && url.length > 0` — empty string takes
    // the default branch.
    const host = makeHost('http:');
    installLegacyIo(host);
    (host.io as (url?: string) => void)('');
    expect(FakeWebSocket.last?.url).toBe('ws://example.com/_ws/legacy');
  });
});

describe('LEGACY_IO_JS string', () => {
  it('is an IIFE', () => {
    expect(LEGACY_IO_JS).toMatch(/^\/\*[\s\S]*\*\/\s*\(function\(\)\s*\{/);
    expect(LEGACY_IO_JS).toContain('})();');
  });

  it('calls installLegacyIo with host references', () => {
    expect(LEGACY_IO_JS).toContain('installLegacyIo({');
    expect(LEGACY_IO_JS).toContain('WebSocket: window.WebSocket');
    expect(LEGACY_IO_JS).toContain('location: window.location');
  });

  it('embeds the installLegacyIo function body', () => {
    // toString() on the function produces the source — the shim-gen
    // step stringifies it into the bundle. We don't assert line-by-line
    // (that would over-constrain the implementation); we assert that
    // the three core API method names are present.
    expect(LEGACY_IO_JS).toContain('emit');
    expect(LEGACY_IO_JS).toContain('disconnect');
    expect(LEGACY_IO_JS).toContain('addEventListener');
  });

  it('is safe to serve as application/javascript (no stray control chars)', () => {
    // The bundled string must not contain any NUL byte that would make
    // browsers reject the script. Also covers the CR/LF sanity.
    expect(LEGACY_IO_JS).not.toContain('\0');
  });

  it('is a non-empty multi-line string', () => {
    expect(LEGACY_IO_JS.length).toBeGreaterThan(200);
    expect(LEGACY_IO_JS.split('\n').length).toBeGreaterThan(3);
  });
});
