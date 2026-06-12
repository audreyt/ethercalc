declare module 'socket.io-client' {
  interface SocketLike {
    connected: boolean;
    on(event: string, listener: (...args: unknown[]) => void): void;
    emit(event: string, ...args: unknown[]): void;
    disconnect(): void;
    removeAllListeners(): void;
  }

  interface IoOptions {
    forceNew?: boolean;
    reconnection?: boolean;
    [key: string]: unknown;
  }

  export default function io(url: string, opts?: IoOptions): SocketLike;
}