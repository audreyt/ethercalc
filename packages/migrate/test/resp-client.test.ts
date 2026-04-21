/**
 * RESP-client unit tests. Drives the parser via a fake socket so we
 * can replay any wire sequence without a real TCP handshake.
 */
import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from 'node:events';

import {
  RespClient,
  RespError,
  type RespSocket,
} from '../src/resp-client.ts';

/**
 * EventEmitter-backed fake with the narrow surface `RespClient` expects.
 * Exposes helpers for tests to inspect written bytes and emit replies.
 */
interface FakeSocket extends RespSocket {
  write(data: string | Buffer): void;
  __written: string[];
  __recv(chunk: string | Buffer): void;
  __raise(err: Error): void;
  __close(): void;
  __ended: boolean;
  end(cb?: () => void): void;
}

function makeSocket(): FakeSocket {
  const ee = new EventEmitter();
  const written: string[] = [];
  const sock: FakeSocket = {
    write: (data) => {
      written.push(typeof data === 'string' ? data : data.toString('utf8'));
    },
    end: (cb) => {
      sock.__ended = true;
      cb?.();
    },
    on: (event, listener) => {
      ee.on(event, listener as (...args: unknown[]) => void);
    },
    __written: written,
    __recv: (chunk) => {
      const buf = typeof chunk === 'string' ? Buffer.from(chunk, 'utf8') : chunk;
      ee.emit('data', buf);
    },
    __raise: (err) => ee.emit('error', err),
    __close: () => ee.emit('close'),
    __ended: false,
  };
  return sock;
}

describe('RespClient — wire encoding', () => {
  it('sends commands in the array-of-bulks form', async () => {
    const sock = makeSocket();
    const client = new RespClient(sock);
    void client.sendCommand('GET', 'snapshot-abc');
    expect(sock.__written.join('')).toBe(
      '*2\r\n$3\r\nGET\r\n$12\r\nsnapshot-abc\r\n',
    );
  });

  it('serializes numeric arguments via String()', async () => {
    const sock = makeSocket();
    const client = new RespClient(sock);
    void client.sendCommand('LRANGE', 'log-x', 0, -1);
    expect(sock.__written.join('')).toBe(
      '*4\r\n$6\r\nLRANGE\r\n$5\r\nlog-x\r\n$1\r\n0\r\n$2\r\n-1\r\n',
    );
  });
});

describe('RespClient — response parsing', () => {
  it('resolves a simple string', async () => {
    const sock = makeSocket();
    const client = new RespClient(sock);
    const p = client.sendCommand('PING');
    sock.__recv('+PONG\r\n');
    await expect(p).resolves.toBe('PONG');
  });

  it('resolves an integer', async () => {
    const sock = makeSocket();
    const client = new RespClient(sock);
    const p = client.sendCommand('EXISTS', 'k');
    sock.__recv(':1\r\n');
    await expect(p).resolves.toBe(1);
  });

  it('resolves a bulk string', async () => {
    const sock = makeSocket();
    const client = new RespClient(sock);
    const p = client.sendCommand('GET', 'k');
    sock.__recv('$5\r\nhello\r\n');
    await expect(p).resolves.toBe('hello');
  });

  it('resolves a null bulk', async () => {
    const sock = makeSocket();
    const client = new RespClient(sock);
    const p = client.sendCommand('GET', 'missing');
    sock.__recv('$-1\r\n');
    await expect(p).resolves.toBeNull();
  });

  it('resolves a flat array (KEYS-style reply)', async () => {
    const sock = makeSocket();
    const client = new RespClient(sock);
    const p = client.sendCommand('KEYS', 'snapshot-*');
    sock.__recv('*2\r\n$10\r\nsnapshot-a\r\n$10\r\nsnapshot-b\r\n');
    await expect(p).resolves.toEqual(['snapshot-a', 'snapshot-b']);
  });

  it('resolves a null array', async () => {
    const sock = makeSocket();
    const client = new RespClient(sock);
    const p = client.sendCommand('LRANGE', 'nope', 0, -1);
    sock.__recv('*-1\r\n');
    await expect(p).resolves.toBeNull();
  });

  it('rejects with RespError on a `-…` line', async () => {
    const sock = makeSocket();
    const client = new RespClient(sock);
    const p = client.sendCommand('GET');
    sock.__recv("-ERR wrong number of arguments for 'get'\r\n");
    await expect(p).rejects.toThrow(RespError);
    await expect(p).rejects.toThrow(/wrong number of arguments/);
  });

  it('reassembles a reply that arrives across multiple chunks', async () => {
    const sock = makeSocket();
    const client = new RespClient(sock);
    const p = client.sendCommand('GET', 'k');
    sock.__recv('$5\r\n');
    sock.__recv('hel');
    sock.__recv('lo\r\n');
    await expect(p).resolves.toBe('hello');
  });

  it('waits for a CRLF inside the length prefix before decoding', async () => {
    // The first chunk has no CRLF at all — the parser must return
    // without consuming any byte. Exercises the `findCRLF` return-(-1)
    // path and the `tag === '$'` branch's "need more data" early exit.
    const sock = makeSocket();
    const client = new RespClient(sock);
    const p = client.sendCommand('GET', 'k');
    sock.__recv('$5'); // no CRLF yet
    sock.__recv('\r\nhello\r\n');
    await expect(p).resolves.toBe('hello');
  });

  it('handles a simple string whose CRLF straddles two chunks', async () => {
    const sock = makeSocket();
    const client = new RespClient(sock);
    const p = client.sendCommand('PING');
    sock.__recv('+PO');
    sock.__recv('NG\r\n');
    await expect(p).resolves.toBe('PONG');
  });

  it('handles an array whose header straddles two chunks', async () => {
    const sock = makeSocket();
    const client = new RespClient(sock);
    const p = client.sendCommand('KEYS', '*');
    sock.__recv('*1');
    sock.__recv('\r\n$1\r\nA\r\n');
    await expect(p).resolves.toEqual(['A']);
  });

  it('handles an integer whose CRLF straddles two chunks', async () => {
    const sock = makeSocket();
    const client = new RespClient(sock);
    const p = client.sendCommand('EXISTS', 'k');
    sock.__recv(':4');
    sock.__recv('2\r\n');
    await expect(p).resolves.toBe(42);
  });

  it('handles a -ERR line whose CRLF straddles two chunks', async () => {
    const sock = makeSocket();
    const client = new RespClient(sock);
    const p = client.sendCommand('X');
    sock.__recv('-bad');
    sock.__recv(' command\r\n');
    await expect(p).rejects.toThrow(/bad command/);
  });

  it('tolerates a zero-byte `data` event', async () => {
    // Hits the `offset >= buf.length` guard inside `tryParse` — a
    // real socket may emit empty data frames on edge-case flushes.
    const sock = makeSocket();
    const client = new RespClient(sock);
    const p = client.sendCommand('GET', 'k');
    sock.__recv(Buffer.alloc(0));
    sock.__recv('+OK\r\n');
    await expect(p).resolves.toBe('OK');
  });

  it('pauses mid-array when a sub-element straddles chunk boundaries', async () => {
    // Covers the `sub === null` early-return inside the array branch:
    // header arrives first, then the first element's length prefix,
    // only later the actual content.
    const sock = makeSocket();
    const client = new RespClient(sock);
    const p = client.sendCommand('KEYS', '*');
    sock.__recv('*1\r\n$3\r\n'); // array header + element header, no body yet
    sock.__recv('foo\r\n');
    await expect(p).resolves.toEqual(['foo']);
  });

  it('dispatches interleaved replies to the correct waiters (FIFO)', async () => {
    const sock = makeSocket();
    const client = new RespClient(sock);
    const p1 = client.sendCommand('GET', 'a');
    const p2 = client.sendCommand('GET', 'b');
    sock.__recv('$1\r\nA\r\n$1\r\nB\r\n');
    await expect(p1).resolves.toBe('A');
    await expect(p2).resolves.toBe('B');
  });

  it('throws a hard protocol error on an unknown reply tag', async () => {
    const sock = makeSocket();
    const client = new RespClient(sock);
    const p = client.sendCommand('X');
    sock.__recv('?unknown\r\n');
    await expect(p).rejects.toThrow(/unsupported RESP type/);
  });

  it('propagates an error nested inside an array', async () => {
    const sock = makeSocket();
    const client = new RespClient(sock);
    const p = client.sendCommand('CLUSTER', 'NODES');
    sock.__recv('*1\r\n-ERR from cluster\r\n');
    await expect(p).rejects.toThrow(/from cluster/);
  });
});

describe('RespClient — lifecycle + error paths', () => {
  it('fails every pending waiter when the socket raises `error`', async () => {
    const sock = makeSocket();
    const client = new RespClient(sock);
    const p1 = client.sendCommand('GET', 'a');
    const p2 = client.sendCommand('GET', 'b');
    sock.__raise(new Error('network down'));
    await expect(p1).rejects.toThrow(/network down/);
    await expect(p2).rejects.toThrow(/network down/);
  });

  it('falls back to a generic message when `error` fires without an Error', async () => {
    const sock = makeSocket();
    const client = new RespClient(sock);
    const p = client.sendCommand('GET', 'k');
    // Emit a bare close/error without argument — covers the `err ?? new Error(...)` default.
    sock.__raise(undefined as unknown as Error);
    await expect(p).rejects.toThrow(/socket error/);
  });

  it('fails pending waiters when the socket closes', async () => {
    const sock = makeSocket();
    const client = new RespClient(sock);
    const p = client.sendCommand('GET', 'a');
    sock.__close();
    await expect(p).rejects.toThrow(/connection closed/);
  });

  it('refuses further sendCommand calls after close()', async () => {
    const sock = makeSocket();
    const client = new RespClient(sock);
    await client.close();
    await expect(client.sendCommand('GET', 'a')).rejects.toThrow(
      /RespClient is closed/,
    );
    expect(sock.__ended).toBe(true);
  });

  it('propagates unknown-tag errors to every in-flight waiter', async () => {
    const sock = makeSocket();
    const client = new RespClient(sock);
    const p1 = client.sendCommand('X');
    const p2 = client.sendCommand('Y');
    sock.__recv('?oops\r\n');
    await expect(p1).rejects.toThrow(/unsupported RESP type/);
    await expect(p2).rejects.toThrow(/unsupported RESP type/);
  });
});

describe('RespClient.pipeline', () => {
  it('writes every command in one frame and resolves in FIFO order', async () => {
    const sock = makeSocket();
    const client = new RespClient(sock);
    const p = client.pipeline(['GET', 'a'], ['GET', 'b'], ['LRANGE', 'c', 0, -1]);
    // A single socket write carrying all three commands back-to-back.
    expect(sock.__written.length).toBe(1);
    expect(sock.__written[0]).toBe(
      '*2\r\n$3\r\nGET\r\n$1\r\na\r\n' +
        '*2\r\n$3\r\nGET\r\n$1\r\nb\r\n' +
        '*4\r\n$6\r\nLRANGE\r\n$1\r\nc\r\n$1\r\n0\r\n$2\r\n-1\r\n',
    );
    // Replies arrive in order, matched to waiters via the FIFO queue.
    sock.__recv('$1\r\nA\r\n$1\r\nB\r\n*0\r\n');
    await expect(p).resolves.toEqual(['A', 'B', []]);
  });

  it('returns an empty array for an empty batch (zero bytes on the wire)', async () => {
    const sock = makeSocket();
    const client = new RespClient(sock);
    await expect(client.pipeline()).resolves.toEqual([]);
    expect(sock.__written.length).toBe(0);
  });

  it('rejects after close() — symmetry with sendCommand', async () => {
    const sock = makeSocket();
    const client = new RespClient(sock);
    await client.close();
    await expect(client.pipeline(['GET', 'a'])).rejects.toThrow(
      /RespClient is closed/,
    );
  });

  it('rejects the whole batch when any reply is an error', async () => {
    const sock = makeSocket();
    const client = new RespClient(sock);
    const p = client.pipeline(['GET', 'a'], ['GET', 'b']);
    sock.__recv('$1\r\nA\r\n-something broke\r\n');
    await expect(p).rejects.toThrow(/something broke/);
  });
});

describe('RespClient.connect — default TCP connector', () => {
  it('opens a real socket when no connector is injected', async () => {
    // Spin up a trivial TCP echo-nothing server on an ephemeral port
    // so we can cover the built-in `defaultConnect` path without a
    // real Redis install.
    const net = await import('node:net');
    const server = net.createServer((sock) => {
      // We never reply — the test just verifies the connect succeeds.
      sock.on('data', () => {});
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (address === null || typeof address === 'string') {
      server.close();
      throw new Error('ephemeral listen() did not return an AddressInfo');
    }
    const url = `redis://127.0.0.1:${address.port}`;
    try {
      const client = await RespClient.connect(url);
      await client.close();
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});

describe('RespClient.connect — URL handling', () => {
  it('parses redis://host:port and passes to the injected connector', async () => {
    const connect = vi.fn<(host: string, port: number) => Promise<RespSocket>>(
      async () => makeSocket(),
    );
    await RespClient.connect('redis://example.test:1234', connect);
    expect(connect).toHaveBeenCalledWith('example.test', 1234);
  });

  it('defaults host to 127.0.0.1 and port to 6379', async () => {
    const connect = vi.fn<(host: string, port: number) => Promise<RespSocket>>(
      async () => makeSocket(),
    );
    // URL() rejects `redis://` without a host — use the explicit
    // localhost form that exercises the empty-port default.
    await RespClient.connect('redis://127.0.0.1', connect);
    expect(connect).toHaveBeenCalledWith('127.0.0.1', 6379);
  });

  it('rejects non-redis:// URLs', async () => {
    await expect(RespClient.connect('http://x:80')).rejects.toThrow(
      /unsupported scheme/,
    );
  });
});
