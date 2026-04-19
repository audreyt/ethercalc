/**
 * Mock WebSocket for client tests.  Implements just enough surface for the
 * adapter to exercise open/close/error/message transitions.
 */
import type { WsLike, WsFactory } from '../src/ws-adapter.ts';

type EventType = 'open' | 'close' | 'error' | 'message';
type Listener = (ev: { data?: string | undefined; code?: number | undefined; reason?: string | undefined }) => void;

export class MockWebSocket implements WsLike {
  static OPEN = 1;
  static CLOSED = 3;

  readyState: number = 0;
  sent: string[] = [];
  url: string;
  private listeners: Record<EventType, Listener[]> = {
    open: [],
    close: [],
    error: [],
    message: [],
  };

  constructor(url: string) {
    this.url = url;
  }

  addEventListener(type: EventType, fn: Listener): void {
    this.listeners[type].push(fn);
  }

  removeEventListener(type: EventType, fn: Listener): void {
    this.listeners[type] = this.listeners[type].filter((l) => l !== fn);
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(code?: number, reason?: string): void {
    this.readyState = MockWebSocket.CLOSED;
    const ev: { code?: number; reason?: string } = {};
    if (code !== undefined) ev.code = code;
    if (reason !== undefined) ev.reason = reason;
    this.dispatch('close', ev);
  }

  // Test helpers.
  acceptOpen(): void {
    this.readyState = MockWebSocket.OPEN;
    this.dispatch('open', {});
  }
  acceptMessage(data: string): void {
    this.dispatch('message', { data });
  }
  acceptError(): void {
    this.dispatch('error', {});
  }
  acceptClose(code = 1000, reason = ''): void {
    this.readyState = MockWebSocket.CLOSED;
    this.dispatch('close', { code, reason });
  }

  private dispatch(type: EventType, ev: { data?: string | undefined; code?: number | undefined; reason?: string | undefined }): void {
    for (const l of this.listeners[type].slice()) l(ev);
  }
}

/**
 * Factory returning a fresh `MockWebSocket` on every call, tracking each
 * instance on `sockets` for post-hoc assertions.
 */
export function createMockFactory(): { factory: WsFactory; sockets: MockWebSocket[] } {
  const sockets: MockWebSocket[] = [];
  const factory: WsFactory = (url: string): WsLike => {
    const ws = new MockWebSocket(url);
    sockets.push(ws);
    return ws;
  };
  return { factory, sockets };
}

/** Simple controllable timer.  Returns `setTimeoutFn` + helpers to advance. */
export function createFakeTimers(): {
  setTimeoutFn: (fn: () => void, ms: number) => number;
  clearTimeoutFn: (id: number) => void;
  advance: () => void;
  pending: Array<{ id: number; fn: () => void; ms: number }>;
} {
  let counter = 0;
  const pending: Array<{ id: number; fn: () => void; ms: number }> = [];
  return {
    setTimeoutFn(fn, ms) {
      const id = ++counter;
      pending.push({ id, fn, ms });
      return id;
    },
    clearTimeoutFn(id) {
      const i = pending.findIndex((p) => p.id === id);
      if (i >= 0) pending.splice(i, 1);
    },
    advance() {
      const next = pending.shift();
      if (next) next.fn();
    },
    pending,
  };
}
