import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import {
  MAX_SNAPSHOT_BYTES_IN_FLIGHT,
  SNAPSHOT_HOLD_MS,
  withSnapshotBody,
} from '../src/lib/snapshot-budget.ts';

/**
 * Unit tests for src/lib/snapshot-budget.ts. The budget is module state
 * shared by every RoomDO of an isolate, so each test releases what it
 * holds before it ends.
 */

const MIB = 1024 * 1024;

/** A request whose body arrives one part per read. */
function requestOf(...parts: Uint8Array[]): {
  request: Request;
  state: { reads: number; cancelled: boolean };
} {
  const state = { reads: 0, cancelled: false };
  const body = new ReadableStream<Uint8Array>(
    {
      pull(controller) {
        const part = parts[state.reads];
        if (part === undefined) {
          controller.close();
          return;
        }
        state.reads += 1;
        controller.enqueue(part);
      },
      cancel() {
        state.cancelled = true;
      },
    },
    { highWaterMark: 0 },
  );
  const request = new Request('https://do/_do/snapshot', {
    method: 'PUT',
    body,
    duplex: 'half',
  } as RequestInit);
  return { request, state };
}

/** `count` parts of 1 MiB each, all the same zero-filled buffer. */
function mebibytes(count: number): Uint8Array[] {
  return new Array<Uint8Array>(count).fill(new Uint8Array(MIB));
}

const ok = async (): Promise<Response> => new Response('OK', { status: 201 });

/**
 * Occupy `bytes` of the budget the way a RoomDO does while it stores a
 * save; `release` lets that store finish.
 */
async function holdBytes(parts: Uint8Array[]): Promise<{
  response: Promise<Response>;
  release: () => void;
}> {
  let release!: () => void;
  const stored = new Promise<Response>((resolve) => {
    release = () => resolve(new Response('OK', { status: 201 }));
  });
  let storing!: () => void;
  const reached = new Promise<void>((resolve) => {
    storing = resolve;
  });
  const response = withSnapshotBody(requestOf(...parts).request, () => {
    storing();
    return stored;
  });
  await reached;
  return { response, release };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('withSnapshotBody', () => {
  it('passes the body to the store as Request.text() would decode it', async () => {
    const text = '\uFEFFsheet:c:1:r:1\ncell:A1:t:héllo \u{1F600}\n';
    const bytes = new TextEncoder().encode(text);
    // One byte per read after the byte order mark: every other multi-byte
    // character is split across reads.
    const { request } = requestOf(
      bytes.subarray(0, 3),
      ...[...bytes.subarray(3)].map((byte) => Uint8Array.of(byte)),
    );
    const expected = await new Request('https://do/', { method: 'PUT', body: bytes }).text();
    const store = vi.fn(async (body: string) => new Response(body, { status: 201 }));
    const res = await withSnapshotBody(request, store);
    expect(res.status).toBe(201);
    expect(store).toHaveBeenCalledExactlyOnceWith(expected);
    expect(expected).toBe(text.slice(1));
  });

  it('replaces a truncated final character like Request.text()', async () => {
    const store = vi.fn(ok);
    await withSnapshotBody(requestOf(Uint8Array.of(0x61, 0xc3)).request, store);
    expect(store).toHaveBeenCalledExactlyOnceWith('a\uFFFD');
  });

  it('stores the empty string for a request without a body', async () => {
    const store = vi.fn(ok);
    const res = await withSnapshotBody(
      new Request('https://do/_do/snapshot', { method: 'PUT' }),
      store,
    );
    expect(res.status).toBe(201);
    expect(store).toHaveBeenCalledExactlyOnceWith('');
  });

  it('refuses the body that would take the bytes in flight past the budget', async () => {
    const first = await holdBytes(mebibytes(20));
    const second = requestOf(...mebibytes(20));
    const store = vi.fn(ok);
    const refused = await withSnapshotBody(second.request, store);
    expect(refused.status).toBe(503);
    expect(refused.headers.get('Retry-After')).toBe('5');
    expect(refused.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
    expect(await refused.text()).toBe('Server is busy storing other saves');
    expect(store).not.toHaveBeenCalled();
    // Refused at the read that crossed the budget; the rest is never read.
    expect(second.state).toEqual({ reads: 13, cancelled: true });

    // The refused body no longer counts: 12 MiB more still fit beside the first.
    const beside = await withSnapshotBody(requestOf(...mebibytes(12)).request, ok);
    expect(beside.status).toBe(201);

    first.release();
    expect((await first.response).status).toBe(201);
    const retried = await withSnapshotBody(requestOf(...mebibytes(20)).request, ok);
    expect(retried.status).toBe(201);
  });

  it('admits bodies up to the budget exactly', async () => {
    const first = await holdBytes([new Uint8Array(MAX_SNAPSHOT_BYTES_IN_FLIGHT - 2)]);
    const second = await holdBytes([Uint8Array.of(0x61, 0x62)]);
    const third = await withSnapshotBody(requestOf(Uint8Array.of(0x63)).request, ok);
    expect(third.status).toBe(503);
    second.release();
    await second.response;
    const fourth = await withSnapshotBody(requestOf(Uint8Array.of(0x63, 0x64)).request, ok);
    expect(fourth.status).toBe(201);
    first.release();
    await first.response;
  });

  it('never refuses the only body in flight, whatever its size', async () => {
    const store = vi.fn(async (body: string) => new Response(String(body.length), { status: 201 }));
    const res = await withSnapshotBody(
      requestOf(...mebibytes(MAX_SNAPSHOT_BYTES_IN_FLIGHT / MIB + 1)).request,
      store,
    );
    expect(res.status).toBe(201);
    expect(await res.text()).toBe(String(MAX_SNAPSHOT_BYTES_IN_FLIGHT + MIB));
  });

  it('releases its bytes when the store fails', async () => {
    await expect(
      withSnapshotBody(requestOf(...mebibytes(20)).request, async () => {
        throw new Error('storage failed');
      }),
    ).rejects.toThrow('storage failed');
    const first = await holdBytes(mebibytes(20));
    first.release();
    expect((await first.response).status).toBe(201);
    const res = await withSnapshotBody(requestOf(...mebibytes(20)).request, ok);
    expect(res.status).toBe(201);
  });

  it('releases its bytes when the body cannot be read', async () => {
    let reads = 0;
    const body = new ReadableStream<Uint8Array>(
      {
        pull(controller) {
          reads += 1;
          if (reads > 20) controller.error(new Error('sender went away'));
          else controller.enqueue(new Uint8Array(MIB));
        },
      },
      { highWaterMark: 0 },
    );
    const store = vi.fn(ok);
    await expect(
      withSnapshotBody(
        new Request('https://do/_do/snapshot', { method: 'PUT', body, duplex: 'half' } as RequestInit),
        store,
      ),
    ).rejects.toThrow('sender went away');
    expect(store).not.toHaveBeenCalled();
    // Nothing is left held: a second body would otherwise be refused below.
    const first = await holdBytes(mebibytes(20));
    const beside = await withSnapshotBody(requestOf(...mebibytes(12)).request, ok);
    expect(beside.status).toBe(201);
    first.release();
    await first.response;
  });

  it('stops counting a body whose request never returned to release it', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(1_000_000);
    // A reset object drops its requests mid-await: this store never settles.
    await holdBytes(mebibytes(20));

    vi.setSystemTime(1_000_000 + SNAPSHOT_HOLD_MS - 1);
    const held = await withSnapshotBody(requestOf(...mebibytes(20)).request, ok);
    expect(held.status).toBe(503);

    vi.setSystemTime(1_000_000 + SNAPSHOT_HOLD_MS);
    const later = await holdBytes(mebibytes(20));
    // The stale hold is gone for good, not merely skipped once.
    const beside = await withSnapshotBody(requestOf(...mebibytes(12)).request, ok);
    expect(beside.status).toBe(201);
    const refused = await withSnapshotBody(requestOf(...mebibytes(20)).request, ok);
    expect(refused.status).toBe(503);
    later.release();
    await later.response;
  });
});
