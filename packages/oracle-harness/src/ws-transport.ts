import { decodeFrame, encodeFrame, PacketType } from '@ethercalc/socketio-shim/framing';
// Legacy oracle (zappajs) ships socket.io 1.0.6 + Engine.IO — not v0.9.
import io from 'socket.io-client';

/** Transport mode for WS scenarios — oracle uses socket.io 1.x, worker uses native JSON. */
export type WsTransport = 'socketio' | 'socketio-v09' | 'native';

/** Minimal socket.io 1.x client surface used for oracle recording. */
export interface IoClientLike {
  readonly connected: boolean;
  on(event: string, listener: (...args: unknown[]) => void): void;
  off(event: string, listener: (...args: unknown[]) => void): void;
  emit(event: string, ...args: unknown[]): void;
  disconnect(): void;
  removeAllListeners(): void;
}


export type IoClientFactory = (origin: string) => IoClientLike;

export interface WsSessionOptions {
  readonly targetUrl: string;
  readonly connectUrl: string;
  readonly transport: WsTransport;
  readonly fetcher?: typeof fetch;
  readonly wsFactory?: WsFactory;
  readonly ioClientFactory?: IoClientFactory;
}

export interface WsSession {
  send(msg: unknown): void;
  waitForMessage(timeoutMs: number): Promise<unknown>;
  close(): void;
}

/** Minimal WebSocket surface used by the harness (browser + Node/Bun). */
export interface WsLike {
  readonly readyState: number;
  send(data: string): void;
  close(code?: number, reason?: string): void;
  addEventListener(type: 'message' | 'close' | 'error' | 'open', listener: (ev: WsEvent) => void): void;
  removeEventListener(type: 'message' | 'close' | 'error' | 'open', listener: (ev: WsEvent) => void): void;
}

export interface WsEvent {
  readonly data?: string;
}

export type WsFactory = (url: string) => WsLike;

const WS_OPEN = 1;

/** Default factory — global WebSocket in Bun/Node 20+ and browsers. */
export const defaultWsFactory: WsFactory = (url) => {
  const ctor = (globalThis as { WebSocket?: new (u: string) => WsLike }).WebSocket;
  if (!ctor) throw new Error('ws-transport: no global WebSocket; pass wsFactory explicitly');
  return new ctor(url);
};

/** Convert `http(s)://host` to `ws(s)://host`. */
export function httpToWsUrl(httpUrl: string): string {
  if (httpUrl.startsWith('http://')) return `ws://${httpUrl.slice(7)}`;
  if (httpUrl.startsWith('https://')) return `wss://${httpUrl.slice(8)}`;
  return httpUrl;
}

/** Resolve a scenario connect path (or absolute URL) against the target base. */
export function resolveConnectUrl(connectUrl: string, targetUrl: string): string {
  if (connectUrl.startsWith('ws://') || connectUrl.startsWith('wss://')) return connectUrl;
  const base = new URL(targetUrl);
  if (connectUrl.startsWith('/')) {
    return `${httpToWsUrl(base.origin)}${connectUrl}`;
  }
  return new URL(connectUrl, targetUrl).toString().replace(/^http/, 'ws');
}

/** Open a WS session using either native `/_ws/:room` or legacy socket.io v0.9. */
export async function openWsSession(opts: WsSessionOptions): Promise<WsSession> {
  const fetcher = opts.fetcher ?? fetch;
  const wsFactory = opts.wsFactory ?? defaultWsFactory;
  if (opts.transport === 'native') {
    return openNativeSession(resolveConnectUrl(opts.connectUrl, opts.targetUrl), wsFactory);
  }
  if (opts.transport === 'socketio-v09') {
    return openSocketIoV09Session(opts.targetUrl, fetcher, wsFactory);
  }
  return openSocketIo1Session(opts.targetUrl, opts.connectUrl, opts.ioClientFactory ?? defaultIoClientFactory);
}

async function openNativeSession(url: string, wsFactory: WsFactory): Promise<WsSession> {
  const socket = wsFactory(url);
  await waitForOpen(socket);
  const inbox: unknown[] = [];
  const onMessage = (ev: WsEvent) => {
    if (typeof ev.data !== 'string') return;
    try {
      inbox.push(JSON.parse(ev.data));
    } catch {
      inbox.push(ev.data);
    }
  };
  socket.addEventListener('message', onMessage);
  return {
    send(msg: unknown) {
      socket.send(JSON.stringify(msg));
    },
    async waitForMessage(timeoutMs: number) {
      const msg = await drainInbox(inbox, timeoutMs, () => socket.readyState !== WS_OPEN);
      return msg;
    },
    close() {
      socket.removeEventListener('message', onMessage);
      socket.close();
    },
  };
}

/** Default factory — socket.io-client 1.0.6 (matches legacy oracle). */
export const defaultIoClientFactory: IoClientFactory = (origin) =>
  io(origin, {
    forceNew: true,
    reconnection: false,
    'force new connection': true,
  } as Record<string, unknown>) as IoClientLike;

/** socket.io 1.x session via the official client (oracle ground truth). */
async function openSocketIo1Session(
  targetUrl: string,
  connectUrl: string,
  ioClientFactory: IoClientFactory,
): Promise<WsSession> {
  const origin = new URL(targetUrl).origin;
  const inbox: unknown[] = [];
  let connected = false;

  const socket = ioClientFactory(origin);

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('socket.io connect timeout')), 10_000);
    socket.on('connect', () => {
      connected = true;
      clearTimeout(timer);
      resolve();
    });
    socket.on('connect_error', (err: unknown) => {
      clearTimeout(timer);
      reject(err instanceof Error ? err : new Error('socket.io connect failed'));
    });
  });

  const match = connectUrl.match(/\/_(?:ws|do\/ws)\/([^?#\s]+)/);
  const room = match ? decodeURIComponent(match[1]!) : '';
  const searchParams = new URL(connectUrl, 'http://localhost').searchParams;
  const user = searchParams.get('user') ?? '';

  if (room) {
    socket.emit('data', { type: 'ask.log', room, user });
    await new Promise<void>((resolve, reject) => {
      /* istanbul ignore next -- defensive timeout that doesn't fire under tests */
      const timer = setTimeout(() => reject(new Error('socket.io join ask.log timeout')), 5000);
      const onData = (msg: unknown) => {
        const payload = msg as { type?: string };
        if (payload && payload.type === 'log') {
          socket.off('data', onData);
          clearTimeout(timer);
          resolve();
        }
      };
      socket.on('data', onData);
    });
  }

  socket.on('data', (msg: unknown) => inbox.push(msg));

  return {
    send(msg: unknown) {
      socket.emit('data', msg);
    },
    async waitForMessage(timeoutMs: number) {
      const msg = await drainInbox(inbox, timeoutMs, () => !connected || !socket.connected);
      return msg;
    },
    close() {
      connected = false;
      socket.removeAllListeners();
      socket.disconnect();
    },
  };
}

/** socket.io v0.9 wire session — worker shim compatibility only. */
async function openSocketIoV09Session(
  targetUrl: string,
  fetcher: typeof fetch,
  wsFactory: WsFactory,
): Promise<WsSession> {
  const handshake = await fetcher(`${targetUrl.replace(/\/$/, '')}/socket.io/1/`);
  if (!handshake.ok) {
    throw new Error(`socket.io handshake failed: ${handshake.status}`);
  }
  const body = await handshake.text();
  const sid = body.split(':')[0];
  if (!sid) throw new Error(`socket.io handshake body malformed: ${JSON.stringify(body)}`);

  const wsUrl = `${httpToWsUrl(new URL(targetUrl).origin)}/socket.io/1/websocket/${sid}`;
  const socket = wsFactory(wsUrl);
  await waitForOpen(socket);

  const inbox: unknown[] = [];
  const onMessage = (ev: WsEvent) => {
    if (typeof ev.data !== 'string') return;
    const payload = unwrapSocketIoEvent(ev.data);
    if (payload !== null) inbox.push(payload);
  };
  socket.addEventListener('message', onMessage);

  return {
    send(msg: unknown) {
      socket.send(wrapSocketIoEvent(msg));
    },
    async waitForMessage(timeoutMs: number) {
      const msg = await drainInbox(inbox, timeoutMs, () => socket.readyState !== WS_OPEN);
      return msg;
    },
    close() {
      socket.removeEventListener('message', onMessage);
      socket.close();
    },
  };
}

function wrapSocketIoEvent(msg: unknown): string {
  return encodeFrame({
    type: PacketType.Event,
    endpoint: '',
    data: JSON.stringify({ name: 'data', args: [msg] }),
  });
}

function unwrapSocketIoEvent(raw: string): unknown | null {
  const packet = decodeFrame(raw);
  if (!packet || packet.type !== PacketType.Event || !packet.data) return null;
  try {
    const parsed = JSON.parse(packet.data) as { name?: unknown; args?: unknown };
    if (!parsed || parsed.name !== 'data' || !Array.isArray(parsed.args) || parsed.args.length === 0) {
      return null;
    }
    return parsed.args[0];
  } catch {
    return null;
  }
}

function waitForOpen(socket: WsLike): Promise<void> {
  if (socket.readyState === WS_OPEN) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const onOpen = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error('WebSocket connection failed'));
    };
    const onClose = () => {
      cleanup();
      reject(new Error('WebSocket closed before open'));
    };
    const cleanup = () => {
      socket.removeEventListener('open', onOpen);
      socket.removeEventListener('error', onError);
      socket.removeEventListener('close', onClose);
    };
    socket.addEventListener('open', onOpen);
    socket.addEventListener('error', onError);
    socket.addEventListener('close', onClose);
  });
}

async function drainInbox(
  inbox: unknown[],
  timeoutMs: number,
  isClosed: () => boolean,
): Promise<unknown> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (inbox.length > 0) return inbox.shift()!;
    if (isClosed()) throw new Error('WebSocket closed while waiting for message');
    await sleep(10);
  }
  throw new Error(`timed out after ${timeoutMs}ms waiting for WS message`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}