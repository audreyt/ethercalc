import type {
  IoClientFactory,
  IoClientLike,
  WsEvent,
  WsFactory,
  WsLike,
} from '../src/ws-transport.ts';

/** Minimal open WebSocket stub for harness unit tests. */
export function stubWsFactory(): WsFactory {
  return () => {
    const listeners = new Map<string, Array<(ev: WsEvent) => void>>();
    const socket: WsLike = {
      readyState: 1,
      send: () => {},
      close: () => {},
      addEventListener(type: 'message' | 'close' | 'error' | 'open', listener: (ev: WsEvent) => void) {
        const bucket = listeners.get(type) ?? [];
        bucket.push(listener);
        listeners.set(type, bucket);
        if (type === 'open') queueMicrotask(() => listener({}));
      },
      removeEventListener: () => {},
    };
    return socket;
  };
}

export interface StubIoClient {
  readonly factory: IoClientFactory;
  /** Simulate an inbound `data` event from the oracle. */
  emitData(msg: unknown): void;
  /** Outbound `data` emits captured from the harness. */
  readonly sent: unknown[];
}

/** socket.io 1.x client stub that auto-connects. */
export function stubIoClient(): StubIoClient {
  const sent: unknown[] = [];
  let emitData = (_msg: unknown) => {};
  const factory: IoClientFactory = () => {
    const listeners = new Map<string, Array<(...args: unknown[]) => void>>();
    let live = true;
    emitData = (msg: unknown) => {
      for (const fn of listeners.get('data') ?? []) fn(msg);
    };
    return {
      get connected() {
        return live;
      },
      on(event: string, fn: (...args: unknown[]) => void) {
        const bucket = listeners.get(event) ?? [];
        bucket.push(fn);
        listeners.set(event, bucket);
        if (event === 'connect') queueMicrotask(() => fn());
      },
      emit(event: string, msg: unknown) {
        if (event === 'data') sent.push(msg);
      },
      disconnect() {
        live = false;
      },
      removeAllListeners() {
        listeners.clear();
      },
    };
  };
  return { factory, emitData: (msg) => emitData(msg), sent };
}