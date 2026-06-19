import { describe, expect, it, vi } from 'vitest';

vi.mock('socket.io-client', () => ({
  default: () => ({
    connected: true,
    on(event: string, fn: (...args: unknown[]) => void) {
      if (event === 'connect') queueMicrotask(() => fn());
    },
    off() {},
    emit() {},
    disconnect() {},
    removeAllListeners() {},
  }),
}));

import { decodeFrame, PacketType } from '@ethercalc/socketio-shim/framing';
import {
  defaultIoClientFactory,
  defaultWsFactory,
  httpToWsUrl,
  openWsSession,
  resolveConnectUrl,
  type WsEvent,
  type WsLike,
} from '../src/ws-transport.ts';

class MockWebSocket implements WsLike {
  readyState = 1;
  private listeners = new Map<string, Array<(ev: WsEvent) => void>>();

  send = vi.fn();
  close = vi.fn();

  addEventListener(type: 'message' | 'close' | 'error' | 'open', listener: (ev: WsEvent) => void) {
    const bucket = this.listeners.get(type) ?? [];
    bucket.push(listener);
    this.listeners.set(type, bucket);
    if (type === 'open') queueMicrotask(() => listener({}));
  }

  removeEventListener(type: 'message' | 'close' | 'error' | 'open', listener: (ev: WsEvent) => void) {
    const bucket = this.listeners.get(type) ?? [];
    this.listeners.set(
      type,
      bucket.filter((l) => l !== listener),
    );
  }

  emit(type: 'message' | 'close' | 'error', data?: string) {
    const ev: WsEvent = data !== undefined ? { data } : {};
    for (const listener of this.listeners.get(type) ?? []) listener(ev);
  }

  emitEmptyMessage() {
    for (const listener of this.listeners.get('message') ?? []) listener({});
  }
}

describe('httpToWsUrl', () => {
  it('converts http and https origins', () => {
    expect(httpToWsUrl('http://127.0.0.1:8000')).toBe('ws://127.0.0.1:8000');
    expect(httpToWsUrl('https://example.test')).toBe('wss://example.test');
    expect(httpToWsUrl('ws://already')).toBe('ws://already');
  });
});

describe('resolveConnectUrl', () => {
  it('joins relative paths against the target origin', () => {
    expect(resolveConnectUrl('/_ws/r?user=u', 'http://host.test:8000')).toBe(
      'ws://host.test:8000/_ws/r?user=u',
    );
    expect(resolveConnectUrl('wss://already.test/ws', 'http://host.test')).toBe(
      'wss://already.test/ws',
    );
    expect(resolveConnectUrl('room/path', 'http://host.test:8000')).toBe(
      'ws://host.test:8000/room/path',
    );
  });
});

describe('openWsSession — native', () => {
  it('connects immediately when the socket is already open', async () => {
    const session = await openWsSession({
      targetUrl: 'http://host.test',
      connectUrl: '/_ws/r?user=u',
      transport: 'native',
      wsFactory: () => new MockWebSocket(),
    });
    session.close();
  });

  it('waits for the open event when the socket is still connecting', async () => {
    class PendingSocket implements WsLike {
      readyState = 0;
      private listeners = new Map<string, Array<(ev: WsEvent) => void>>();
      send() {}
      close() {}
      addEventListener(type: 'message' | 'close' | 'error' | 'open', listener: (ev: WsEvent) => void) {
        const bucket = this.listeners.get(type) ?? [];
        bucket.push(listener);
        this.listeners.set(type, bucket);
      }
      removeEventListener(type: 'message' | 'close' | 'error' | 'open', listener: (ev: WsEvent) => void) {
        const bucket = this.listeners.get(type) ?? [];
        this.listeners.set(
          type,
          bucket.filter((l) => l !== listener),
        );
      }
      open() {
        this.readyState = 1;
        for (const fn of this.listeners.get('open') ?? []) fn({});
      }
    }
    const sock = new PendingSocket();
    const pending = openWsSession({
      targetUrl: 'http://host.test',
      connectUrl: '/_ws/r?user=u',
      transport: 'native',
      wsFactory: () => sock,
    });
    sock.open();
    const session = await pending;
    session.close();
  });

  it('preserves non-JSON native payloads as raw strings', async () => {
    const sockets: MockWebSocket[] = [];
    const session = await openWsSession({
      targetUrl: 'http://host.test',
      connectUrl: '/_ws/r?user=u',
      transport: 'native',
      wsFactory: () => {
        const ws = new MockWebSocket();
        sockets.push(ws);
        return ws;
      },
    });
    const wait = session.waitForMessage(200);
    sockets[0]!.emitEmptyMessage();
    sockets[0]!.emit('message', 'plain-text');
    await expect(wait).resolves.toBe('plain-text');
    session.close();
  });

  it('sends JSON frames and parses replies', async () => {
    const sockets: MockWebSocket[] = [];
    const session = await openWsSession({
      targetUrl: 'http://host.test',
      connectUrl: '/_ws/room?user=u&auth=0',
      transport: 'native',
      wsFactory: () => {
        const ws = new MockWebSocket();
        sockets.push(ws);
        return ws;
      },
    });
    const wait = session.waitForMessage(500);
    sockets[0]!.emit('message', JSON.stringify({ type: 'log', room: 'room' }));
    await expect(wait).resolves.toEqual({ type: 'log', room: 'room' });
    session.send({ type: 'ask.log', room: 'room', user: 'u' });
    expect(sockets[0]!.send).toHaveBeenCalledWith(
      JSON.stringify({ type: 'ask.log', room: 'room', user: 'u' }),
    );
    session.close();
  });
});

describe('openWsSession — socket.io 1.x', () => {
  it('uses defaultIoClientFactory when ioClientFactory is omitted', async () => {
    const session = await openWsSession({
      targetUrl: 'http://oracle.test:8000',
      connectUrl: '/ignored',
      transport: 'socketio',
    });
    session.close();
  });

  it('uses socket.io-client data events', async () => {
    const { stubIoClient } = await import('./ws-mock.ts');
    const stub = stubIoClient();
    const session = await openWsSession({
      targetUrl: 'http://oracle.test:8000',
      connectUrl: '/ignored',
      transport: 'socketio',
      ioClientFactory: stub.factory,
    });
    const wait = session.waitForMessage(200);
    session.send({ type: 'ask.log', room: 'r', user: 'u' });
    stub.emitData({ type: 'log', room: 'r' });
    await expect(wait).resolves.toMatchObject({ type: 'log', room: 'r' });
    expect(stub.sent[0]).toMatchObject({ type: 'ask.log', room: 'r', user: 'u' });
    session.close();
  });

  it('covers socket.io edge cases during join (noise messages)', async () => {
    const factory = () => {
      let dataCallback: ((msg: unknown) => void) | null = null;
      return {
        connected: true,
        on(event: string, fn: (...args: unknown[]) => void) {
          if (event === 'connect') queueMicrotask(() => fn());
          if (event === 'data') dataCallback = fn;
        },
        off() {},
        emit(event: string, msg: unknown) {
          if (event === 'data') {
            const payload = msg as { type?: string };
            if (payload && payload.type === 'ask.log') {
              queueMicrotask(() => {
                if (dataCallback) {
                  dataCallback(null);
                  dataCallback({ type: 'chat' });
                  dataCallback({ type: 'log' });
                }
              });
            }
          }
        },
        disconnect() {},
        removeAllListeners() {},
      };
    };
    const session = await openWsSession({
      targetUrl: 'http://oracle.test:8000',
      connectUrl: '/_ws/r',
      transport: 'socketio',
      ioClientFactory: factory as any,
    });
    session.close();
  });

  it('rejects connect_error from the io client', async () => {
    const factory = () => ({
      connected: false,
      on(event: string, fn: (...args: unknown[]) => void) {
        if (event === 'connect_error') queueMicrotask(() => fn(new Error('nope')));
      },
      off() {},
      emit() {},
      disconnect() {},
      removeAllListeners() {},
    });
    await expect(
      openWsSession({
        targetUrl: 'http://oracle.test:8000',
        connectUrl: '/ignored',
        transport: 'socketio',
        ioClientFactory: factory,
      }),
    ).rejects.toThrow('nope');
  });

  it('rejects non-Error connect_error payloads', async () => {
    const factory = () => ({
      connected: false,
      on(event: string, fn: (...args: unknown[]) => void) {
        if (event === 'connect_error') queueMicrotask(() => fn('bad'));
      },
      off() {},
      emit() {},
      disconnect() {},
      removeAllListeners() {},
    });
    await expect(
      openWsSession({
        targetUrl: 'http://oracle.test:8000',
        connectUrl: '/ignored',
        transport: 'socketio',
        ioClientFactory: factory,
      }),
    ).rejects.toThrow(/connect failed/);
  });

  it('rejects connect timeouts', async () => {
    vi.useFakeTimers();
    const factory = () => ({
      connected: false,
      on() {},
      off() {},
      emit() {},
      disconnect() {},
      removeAllListeners() {},
    });
    const pending = openWsSession({
      targetUrl: 'http://oracle.test:8000',
      connectUrl: '/ignored',
      transport: 'socketio',
      ioClientFactory: factory,
    });
    const assertion = expect(pending).rejects.toThrow(/connect timeout/);
    await vi.advanceTimersByTimeAsync(10_001);
    await assertion;
    vi.useRealTimers();
  });
});

describe('openWsSession — socket.io-v09', () => {
  it('handshakes then wraps event frames', async () => {
    const sockets: MockWebSocket[] = [];
    const fetcher: typeof fetch = async (url) => {
      expect(String(url)).toBe('http://oracle.test/socket.io/1/');
      return new Response('abc123:60:60:websocket,xhr-polling');
    };
    const session = await openWsSession({
      targetUrl: 'http://oracle.test',
      connectUrl: '/_ws/ignored-on-socketio',
      transport: 'socketio-v09',
      fetcher,
      wsFactory: (url) => {
        expect(url).toBe('ws://oracle.test/socket.io/1/websocket/abc123');
        const ws = new MockWebSocket();
        sockets.push(ws);
        return ws;
      },
    });
    session.send({ type: 'ask.log', room: 'r', user: 'u' });
    const frame = sockets[0]!.send.mock.calls[0]![0] as string;
    const packet = decodeFrame(frame);
    expect(packet?.type).toBe(PacketType.Event);

    const wait = session.waitForMessage(500);
    sockets[0]!.emit(
      'message',
      '5:::{"name":"data","args":[{"type":"log","room":"r","log":[],"chat":[],"snapshot":""}]}',
    );
    await expect(wait).resolves.toMatchObject({ type: 'log', room: 'r' });
    session.close();
  });
});

describe('defaultIoClientFactory', () => {
  it('returns a socket.io client with the expected surface', () => {
    const client = defaultIoClientFactory('http://unused.test');
    expect(client.on).toBeTypeOf('function');
    expect(client.emit).toBeTypeOf('function');
    client.disconnect();
  });
});

describe('defaultWsFactory', () => {
  it('constructs a WebSocket when the global ctor exists', () => {
    expect(defaultWsFactory('ws://example.test')).toBeInstanceOf(WebSocket);
  });

  it('throws when global WebSocket is unavailable', () => {
    const g = globalThis as { WebSocket?: unknown };
    const orig = g.WebSocket;
    g.WebSocket = undefined;
    try {
      expect(() => defaultWsFactory('ws://x')).toThrow(/no global WebSocket/);
    } finally {
      g.WebSocket = orig;
    }
  });
});

describe('openWsSession edge cases', () => {
  it('rejects a failed socket.io handshake', async () => {
    await expect(
      openWsSession({
        targetUrl: 'http://oracle.test',
        connectUrl: '/_ws/x',
        transport: 'socketio-v09',
        fetcher: async () => new Response('', { status: 500 }),
      }),
    ).rejects.toThrow(/handshake failed/);
  });

  it('rejects a malformed socket.io handshake body', async () => {
    await expect(
      openWsSession({
        targetUrl: 'http://oracle.test',
        connectUrl: '/_ws/x',
        transport: 'socketio-v09',
        fetcher: async () => new Response(''),
      }),
    ).rejects.toThrow(/malformed/);
  });

  it('rejects native WebSocket connection errors and close', async () => {
    await expect(
      openWsSession({
        targetUrl: 'http://oracle.test',
        connectUrl: '/_ws/r',
        transport: 'native',
        wsFactory: (url) => {
          const ws = new MockWebSocket();
          (ws as any).readyState = 0;
          queueMicrotask(() => {
            const bucket = (ws as any).listeners.get('error') ?? [];
            for (const fn of bucket) fn(new Error('conn error'));
          });
          return ws;
        },
      }),
    ).rejects.toThrow('WebSocket connection failed');

    await expect(
      openWsSession({
        targetUrl: 'http://oracle.test',
        connectUrl: '/_ws/r',
        transport: 'native',
        wsFactory: (url) => {
          const ws = new MockWebSocket();
          (ws as any).readyState = 0;
          queueMicrotask(() => {
            const bucket = (ws as any).listeners.get('close') ?? [];
            for (const fn of bucket) fn();
          });
          return ws;
        },
      }),
    ).rejects.toThrow('WebSocket closed before open');
  });

  it('ignores non-event socket.io frames and non-JSON native frames', async () => {
    const sockets: MockWebSocket[] = [];
    const native = await openWsSession({
      targetUrl: 'http://host.test',
      connectUrl: '/_ws/r?user=u',
      transport: 'native',
      wsFactory: () => {
        const ws = new MockWebSocket();
        sockets.push(ws);
        return ws;
      },
    });
    const wait = native.waitForMessage(200);
    sockets[0]!.emit('message', JSON.stringify({ type: 'log' }));
    await expect(wait).resolves.toEqual({ type: 'log' });

    const sockets2: MockWebSocket[] = [];
    const io = await openWsSession({
      targetUrl: 'http://oracle.test',
      connectUrl: '/_ws/x',
      transport: 'socketio-v09',
      fetcher: async () => new Response('sid1:60:60:websocket'),
      wsFactory: () => {
        const ws = new MockWebSocket();
        sockets2.push(ws);
        return ws;
      },
    });
    const wait2 = io.waitForMessage(200);
    sockets2[0]!.emitEmptyMessage();
    sockets2[0]!.emit('message', '2::');
    sockets2[0]!.emit('message', '5:::{"name":"data","args":[]}');
    sockets2[0]!.emit('message', '5:::not-json');
    sockets2[0]!.emit(
      'message',
      '5:::{"name":"other","args":[{"type":"log"}]}',
    );
    sockets2[0]!.emit(
      'message',
      '5:::{"name":"data","args":[{"type":"log","room":"r"}]}',
    );
    await expect(wait2).resolves.toMatchObject({ type: 'log' });
    native.close();
    io.close();
  });

  it('rejects when the socket errors before open', async () => {
    class ErrorSocket implements WsLike {
      readyState = 0;
      private listeners = new Map<string, Array<(ev: WsEvent) => void>>();
      send() {}
      close() {}
      addEventListener(type: 'message' | 'close' | 'error' | 'open', listener: (ev: WsEvent) => void) {
        const bucket = this.listeners.get(type) ?? [];
        bucket.push(listener);
        this.listeners.set(type, bucket);
      }
      removeEventListener(type: 'message' | 'close' | 'error' | 'open', listener: (ev: WsEvent) => void) {
        const bucket = this.listeners.get(type) ?? [];
        this.listeners.set(
          type,
          bucket.filter((l) => l !== listener),
        );
      }
      emitError() {
        for (const fn of this.listeners.get('error') ?? []) fn({});
      }
    }
    const sock = new ErrorSocket();
    const pending = openWsSession({
      targetUrl: 'http://host.test',
      connectUrl: '/_ws/r?user=u',
      transport: 'native',
      wsFactory: () => sock,
    });
    sock.emitError();
    await expect(pending).rejects.toThrow(/connection failed/);
  });

  it('waits for open and reports close-before-open', async () => {
    class SlowSocket implements WsLike {
      readyState = 0;
      private listeners = new Map<string, Array<(ev: WsEvent) => void>>();
      send() {}
      close() {}
      addEventListener(type: 'message' | 'close' | 'error' | 'open', listener: (ev: WsEvent) => void) {
        const bucket = this.listeners.get(type) ?? [];
        bucket.push(listener);
        this.listeners.set(type, bucket);
      }
      removeEventListener(type: 'message' | 'close' | 'error' | 'open', listener: (ev: WsEvent) => void) {
        const bucket = this.listeners.get(type) ?? [];
        this.listeners.set(
          type,
          bucket.filter((l) => l !== listener),
        );
      }
      emitClose() {
        for (const fn of this.listeners.get('close') ?? []) fn({});
      }
    }
    const sock = new SlowSocket();
    const pending = openWsSession({
      targetUrl: 'http://host.test',
      connectUrl: '/_ws/r?user=u',
      transport: 'native',
      wsFactory: () => sock,
    });
    sock.emitClose();
    await expect(pending).rejects.toThrow(/closed before open/);
  });

  it('times out when the socket closes while waiting', async () => {
    let socket!: MockWebSocket & { readyState: number };
    const session = await openWsSession({
      targetUrl: 'http://host.test',
      connectUrl: '/_ws/r?user=u',
      transport: 'native',
      wsFactory: () => {
        socket = new MockWebSocket() as MockWebSocket & { readyState: number };
        return socket;
      },
    });
    socket.readyState = 3;
    await expect(session.waitForMessage(30)).rejects.toThrow(/closed while waiting/);
  });
});