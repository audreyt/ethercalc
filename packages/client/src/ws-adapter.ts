/**
 * WebSocket adapter — replaces the legacy socket.io client.
 *
 * This is the transport half of CLAUDE.md §8 Phase 10: every `broadcast()`
 * call becomes one JSON frame over a native WS.  `onMessage` delivers the
 * decoded `ServerMessage`s (frames that fail `parseServerMessage` are
 * dropped — matches the legacy behavior of ignoring unknown events).
 *
 * Reconnect policy (ported from `src/player.ls:46`):
 *   - delay between attempts: 500 ms
 *   - max attempts: 1800 (≈15 min of retrying, matches legacy socket.io config)
 *
 * Frames published while the socket is not in `OPEN` are queued and flushed
 * on the next `open`. Frames submitted while permanently closed are dropped
 * (matches `return unless SocialCalc.isConnected` in the legacy callback).
 */
import {
  encodeMessage,
  parseServerMessage,
  type ClientMessage,
  type ServerMessage,
} from '@ethercalc/shared/messages';

// ─── WebSocket surface we rely on ─────────────────────────────────────────

/** Minimal WS shape we depend on. Both `ws` in Node and browser WS satisfy this. */
export interface WsLike {
  readyState: number;
  send(data: string): void;
  close(code?: number, reason?: string): void;
  addEventListener(
    type: 'open' | 'close' | 'error' | 'message',
    listener: (ev: { data?: string | undefined; code?: number | undefined; reason?: string | undefined }) => void,
  ): void;
  removeEventListener?: (
    type: 'open' | 'close' | 'error' | 'message',
    listener: (ev: { data?: string | undefined; code?: number | undefined; reason?: string | undefined }) => void,
  ) => void;
}

export type WsFactory = (url: string) => WsLike;

// ─── Public options / return shape ────────────────────────────────────────

export interface CreateWsAdapterOptions {
  /** Spreadsheet id. */
  room: string;
  /** Presence identifier (randomly generated per tab in the legacy client). */
  user: string;
  /** Optional HMAC auth token. */
  auth?: string | undefined;
  /** Full WS URL or HTTP(S) endpoint — we flip the scheme automatically. */
  url: string;
  /** Milliseconds between reconnect attempts. Legacy default: 500. */
  reconnectDelayMs?: number | undefined;
  /** Max reconnect attempts before we give up. Legacy default: 1800. */
  maxReconnectAttempts?: number | undefined;
  /**
   * Overridable socket constructor — lets tests inject a mock.  When omitted
   * we use `globalThis.WebSocket` (present in browsers + modern Node).
   */
  wsFactory?: WsFactory | undefined;
  /**
   * Overridable timer for reconnect backoff.  Defaults to `setTimeout` on the
   * global.  Tests pass a fake timer so we can assert timing without sleeping.
   */
  setTimeoutFn?: ((fn: () => void, ms: number) => number) | undefined;
  /** Matching `clearTimeout`. */
  clearTimeoutFn?: ((id: number) => void) | undefined;
  /** Hook fired on open/close/error/reconnect.  Tests observe this. */
  onStatus?: ((status: WsStatus) => void) | undefined;
}

export type WsStatus =
  | { type: 'open' }
  | { type: 'close'; code?: number | undefined; reason?: string | undefined }
  | { type: 'error' }
  | { type: 'reconnecting'; attempt: number }
  | { type: 'reconnect_failed' };

export interface WsAdapter {
  /**
   * Public surface that `SocialCalc.Callbacks.broadcast` delegates to.
   * Signature intentionally mirrors the legacy one: `(type, data={})`.
   */
  broadcast(type: string, data?: Record<string, unknown>): void;
  /** Subscribe to decoded server messages. Returns an unsubscribe fn. */
  onMessage(cb: (msg: ServerMessage) => void): () => void;
  /** Stop reconnecting and close the socket for good. */
  close(): void;
  /** For diagnostics/tests. */
  readonly queueLength: number;
  readonly connected: boolean;
  readonly reconnectAttempts: number;
}

// ─── Implementation ───────────────────────────────────────────────────────

const WS_OPEN = 1;

/**
 * Fallbacks for when the caller doesn't pass factories.
 *
 * Kept as getters so the module can be imported in Node test environments
 * that don't have `WebSocket` on the global — it's only required at call
 * time, after the test has injected its own factory.
 */
function defaultWsFactory(url: string): WsLike {
  const ctor = (globalThis as unknown as { WebSocket?: new (u: string) => WsLike }).WebSocket;
  if (!ctor) {
    throw new Error('ws-adapter: no global WebSocket; pass wsFactory explicitly');
  }
  return new ctor(url);
}

function defaultSetTimeout(fn: () => void, ms: number): number {
  return globalThis.setTimeout(fn, ms) as unknown as number;
}

function defaultClearTimeout(id: number): void {
  globalThis.clearTimeout(id);
}

/**
 * Turn an `http(s)://…` URL into `ws(s)://…`. Anything else (including a
 * URL that's already ws/wss) is passed through untouched.
 */
export function toWsUrl(raw: string): string {
  if (raw.startsWith('http://')) return 'ws://' + raw.slice(7);
  if (raw.startsWith('https://')) return 'wss://' + raw.slice(8);
  return raw;
}

/**
 * Build `wss://<base>/_ws/:room?user=…&auth=…` from the options.
 * Exported so the main entry can display it for debugging.
 */
export function buildWsEndpoint(opts: {
  url: string;
  room: string;
  user: string;
  auth?: string | undefined;
}): string {
  const base = toWsUrl(opts.url.replace(/\/+$/, ''));
  const params = new URLSearchParams();
  params.set('user', opts.user);
  if (opts.auth !== undefined) params.set('auth', opts.auth);
  // `:room` is URL-encoded — matches the server-side `encodeURI` rule
  // (CLAUDE.md §7 item 15).
  return `${base}/_ws/${encodeURIComponent(opts.room)}?${params.toString()}`;
}

/**
 * Envelope that the adapter injects before shipping a frame.  Mirrors the
 * legacy `data.user`/`data.room`/`data.auth` fill-in at `src/player.ls:74`.
 */
function envelope(
  type: string,
  data: Record<string, unknown>,
  opts: Pick<CreateWsAdapterOptions, 'room' | 'user' | 'auth'>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...data };
  out.type = type;
  out.user = opts.user;
  if (out.room === undefined) out.room = opts.room;
  if (opts.auth !== undefined) out.auth = opts.auth;
  return out;
}

export function createWsAdapter(opts: CreateWsAdapterOptions): WsAdapter {
  const delay = opts.reconnectDelayMs ?? 500;
  const maxAttempts = opts.maxReconnectAttempts ?? 1800;
  const wsFactory = opts.wsFactory ?? defaultWsFactory;
  const setTimeoutFn = opts.setTimeoutFn ?? defaultSetTimeout;
  const clearTimeoutFn = opts.clearTimeoutFn ?? defaultClearTimeout;
  const endpoint = buildWsEndpoint(opts);

  const subscribers = new Set<(msg: ServerMessage) => void>();
  const queue: string[] = [];
  let socket: WsLike | null = null;
  let closed = false;
  let reconnectAttempts = 0;
  let pendingTimer: number | null = null;

  function notifyStatus(status: WsStatus): void {
    opts.onStatus?.(status);
  }

  function connect(): void {
    let s: WsLike;
    try {
      s = wsFactory(endpoint);
    } catch {
      // Factory threw (network offline, test dummy) — schedule a retry just
      // like the socket.io client used to.
      scheduleReconnect();
      return;
    }
    socket = s;
    s.addEventListener('open', onOpen);
    s.addEventListener('close', onClose);
    s.addEventListener('error', onError);
    s.addEventListener('message', onMessageFrame);
  }

  function onOpen(): void {
    reconnectAttempts = 0;
    notifyStatus({ type: 'open' });
    flushQueue();
  }

  function onClose(ev: { code?: number | undefined; reason?: string | undefined }): void {
    notifyStatus({ type: 'close', code: ev.code, reason: ev.reason });
    socket = null;
    scheduleReconnect();
  }

  function onError(): void {
    notifyStatus({ type: 'error' });
    // `error` is normally followed by `close`; let `close` drive reconnect.
  }

  function onMessageFrame(ev: { data?: string | undefined }): void {
    if (typeof ev.data !== 'string') return;
    const parsed = parseServerMessage(ev.data);
    if (!parsed) return;
    for (const cb of subscribers) cb(parsed);
  }

  function scheduleReconnect(): void {
    if (closed) return;
    if (reconnectAttempts >= maxAttempts) {
      notifyStatus({ type: 'reconnect_failed' });
      return;
    }
    reconnectAttempts++;
    notifyStatus({ type: 'reconnecting', attempt: reconnectAttempts });
    pendingTimer = setTimeoutFn(() => {
      pendingTimer = null;
      connect();
    }, delay);
  }

  function flushQueue(): void {
    // Only called from the `open` event handler, so we know `socket` is set
    // and in `OPEN` state.  No defensive guard needed.
    while (queue.length > 0) {
      const frame = queue.shift()!;
      socket!.send(frame);
    }
  }

  function broadcast(type: string, data: Record<string, unknown> = {}): void {
    if (closed) return;
    const enveloped = envelope(type, data, opts);
    // Cast is safe — we accept arbitrary `type` strings at the broadcast
    // surface for parity (`ask.ecell` is emitted internally and isn't in the
    // `ClientMessage` union), but the JSON shape is a superset.
    const frame = encodeMessage(enveloped as unknown as ClientMessage);
    if (socket && socket.readyState === WS_OPEN) {
      socket.send(frame);
    } else {
      queue.push(frame);
    }
  }

  function onMessage(cb: (msg: ServerMessage) => void): () => void {
    subscribers.add(cb);
    return () => {
      subscribers.delete(cb);
    };
  }

  function close(): void {
    closed = true;
    if (pendingTimer !== null) {
      clearTimeoutFn(pendingTimer);
      pendingTimer = null;
    }
    if (socket) {
      try {
        socket.close();
      } catch {
        // Some mock sockets throw on double-close — ignore.
      }
      socket = null;
    }
    subscribers.clear();
    queue.length = 0;
  }

  // Kick off the first connection synchronously so tests that await a
  // microtask can observe the socket creation.
  connect();

  const adapter: WsAdapter = {
    broadcast,
    onMessage,
    close,
    get queueLength() {
      return queue.length;
    },
    get connected() {
      return socket !== null && socket.readyState === WS_OPEN;
    },
    get reconnectAttempts() {
      return reconnectAttempts;
    },
  };
  return adapter;
}
