/**
 * Isolate-wide bound on the save bodies RoomDOs hold between receiving
 * and storing them.
 *
 * A RoomDO needs a save whole before it can validate and store it. For an
 * upload the client pays for every byte, but a template copy
 * (`GET /_from/:template`, `POST /_from/:template/private`,
 * `/_do/clone`) or `loadclipboard` enrichment has the server send or read
 * a complete save for a request of a few dozen bytes. Each copy lands in
 * its own object, so no input gate orders them, and every RoomDO of a
 * standalone deployment shares one heap: without a bound, parallel copies
 * of one large room hold as many saves as there are requests.
 */

/**
 * UTF-8 bytes of save bodies held at once: one upload of the maximum size
 * (25 MiB) with room for ordinary saves beside it. A held byte costs the
 * process several while the save is validated, chunked and written.
 */
export const MAX_SNAPSHOT_BYTES_IN_FLIGHT = 32 * 1024 * 1024;

/**
 * How long one body can count against the budget. When the runtime resets
 * an object (a `blockConcurrencyWhile` callback threw, say), its pending
 * requests are dropped without running their `finally` blocks, while this
 * module lives on with the isolate: a hold released only in `finally`
 * would then shrink the budget for good.
 */
export const SNAPSHOT_HOLD_MS = 60_000;

interface Hold {
  bytes: number;
  readonly expires: number;
}

const holds = new Set<Hold>();

/** Bytes held for requests other than `own`; forgets expired holds. */
function otherBytesInFlight(own: Hold, now: number): number {
  let bytes = 0;
  for (const hold of holds) {
    if (hold.expires <= now) holds.delete(hold);
    else if (hold !== own) bytes += hold.bytes;
  }
  return bytes;
}

function busyResponse(): Response {
  return new Response('Server is busy storing other saves', {
    status: 503,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Retry-After': '5' },
  });
}

/**
 * Read `source`'s body as text (decoded as `Request.text()` does) and
 * pass it to `store`, counting its bytes against the budget until `store`
 * settles. A body that would take the total past the budget is refused
 * with a retryable 503 and its stream cancelled. The only body in flight
 * is never refused, so the budget bounds how many saves are held, not how
 * large one may be.
 */
export async function withSnapshotBody(
  source: Pick<Request, 'body'>,
  store: (body: string) => Promise<Response>,
): Promise<Response> {
  const hold: Hold = { bytes: 0, expires: Date.now() + SNAPSHOT_HOLD_MS };
  holds.add(hold);
  try {
    const parts: string[] = [];
    const reader = source.body?.getReader();
    if (reader) {
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        hold.bytes += value.byteLength;
        const others = otherBytesInFlight(hold, Date.now());
        if (others > 0 && others + hold.bytes > MAX_SNAPSHOT_BYTES_IN_FLIGHT) {
          await reader.cancel();
          return busyResponse();
        }
        parts.push(decoder.decode(value, { stream: true }));
      }
      parts.push(decoder.decode());
    }
    return await store(parts.join(''));
  } finally {
    holds.delete(hold);
  }
}
