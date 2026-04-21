/**
 * HTTP-based `MigrationTarget` — writes through the live worker's
 * `PUT /_migrate/seed/:room` endpoint (see
 * `packages/worker/src/routes/migrate.ts`). Intended for local Miniflare
 * seeding: start `./bin/ethercalc` on one terminal, run the migrator on
 * another pointing at its base URL.
 *
 * Why "live target" rather than shelling out to `wrangler`:
 *   1. DO storage is unreachable via any remote `wrangler` verb; you
 *      can't `wrangler kv key put` into a Durable Object. Once we
 *      accept that an HTTP hop is required for the DO, the rest (D1,
 *      KV-style rooms index) falls in line — the worker owns both and
 *      mirrors synchronously on the seed path.
 *   2. One HTTP round-trip per room (full-fidelity payload) beats N
 *      shell-outs per room: a 500 MB dump with 10 k rooms would spawn
 *      ~30 k wrangler invocations, each paying its Bun startup cost.
 *
 * Target buffering:
 *   `applyRoomStream` (see `src/apply.ts`) visits each room in the
 *   order snapshot → log → audit → chat → ecell → setRoomIndex, and
 *   never interleaves writes for the same room. We accumulate a single
 *   per-room payload in `#buffers`, flush on `setRoomIndex` (always
 *   last), and drop the entry so re-emit is free. The payload shape
 *   matches the server's `parseSeedPayload` (see `@ethercalc/worker`).
 *
 * D1 index batching:
 *   The seed PUT carries `skipIndex: true`, so the DO's `#postSeed`
 *   writes storage + meta but does NOT touch the D1 `rooms` row.
 *   Instead we queue `(room, updatedAt)` pairs locally and flush them
 *   through `PUT /_migrate/bulk-index` in chunks. One SQL `INSERT …
 *   VALUES (…),(…),…` per chunk collapses the per-room D1 round-trip
 *   into ~N/chunk round-trips — the difference between a 5-hour D1-
 *   bound migration and a 30-minute upload-bound one.
 *
 * Failure semantics: a non-2xx response aborts the run by throwing. The
 * caller (`runMigrate` in `cli.ts`) doesn't re-try — the dump is
 * deterministic, so if one room failed the fix is to change the code
 * or the target, then re-run (the endpoint is idempotent — rooms already
 * seeded will just be overwritten with their own values).
 */

import type { MigrationTarget } from '../apply.ts';

interface RoomBuffer {
  snapshot?: string;
  log: string[];
  audit: string[];
  chat: string[];
  ecell: Record<string, string>;
}

/** Minimal fetch surface — lets tests inject a stub without importing undici. */
export type FetchLike = (
  input: string,
  init?: RequestInit,
) => Promise<Response>;

export interface HttpTargetConfig {
  /** Base URL of the running worker, e.g. `http://127.0.0.1:8000`. No trailing slash. */
  baseUrl: string;
  /** Bearer token. Must match `env.ETHERCALC_MIGRATE_TOKEN` on the worker. */
  token: string;
  /** Override for tests. Defaults to the global `fetch`. */
  fetch?: FetchLike;
  /**
   * Max number of `(room, updatedAt)` pairs per `/_migrate/bulk-index`
   * round-trip. Default 50 — D1 enforces a hard 100-parameter cap per
   * prepared statement, and we bind two per entry (room + updatedAt),
   * so anything over 50 rows fails with a generic `500 Internal Server
   * Error` (the limit is not surfaced via an error message we'd see).
   * The earlier value of 200 silently broke every production run on
   * 2026-04-21 — see CLAUDE.md §14. Tests can lower further to drive
   * flush-on-threshold deterministically.
   */
  bulkIndexBatchSize?: number;
  /**
   * Disable the bulk-index side of the pipeline entirely. When `true`,
   * the target fires seed PUTs (still with `skipIndex: true` on the
   * body) but never enqueues or flushes `(room, updatedAt)` pairs —
   * i.e. it writes DO storage and leaves the D1 `rooms` table alone.
   *
   * Use this when D1 is being populated out-of-band, e.g. via a
   * `wrangler d1 execute --remote --file=rooms.sql` dump import that
   * runs minutes before this pass. See CLAUDE.md §14 2026-04-21 for
   * the production recipe.
   */
  skipBulkIndex?: boolean;
}

export class HttpTarget implements MigrationTarget {
  readonly #baseUrl: string;
  readonly #token: string;
  readonly #fetch: FetchLike;
  readonly #buffers: Map<string, RoomBuffer> = new Map();
  readonly #pendingIndex: Array<{ room: string; updatedAt: number }> = [];
  readonly #bulkIndexBatchSize: number;
  readonly #skipBulkIndex: boolean;

  constructor(config: HttpTargetConfig) {
    // Strip a trailing slash so `${baseUrl}/_migrate/...` is always well-formed.
    this.#baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.#token = config.token;
    this.#fetch = config.fetch ?? ((input, init) => fetch(input, init));
    this.#bulkIndexBatchSize = Math.max(1, config.bulkIndexBatchSize ?? 50);
    this.#skipBulkIndex = config.skipBulkIndex ?? false;
  }

  putSnapshot(room: string, snapshot: string): Promise<void> {
    this.#bucket(room).snapshot = snapshot;
    return Promise.resolve();
  }

  putLog(room: string, _seq: number, cmd: string): Promise<void> {
    this.#bucket(room).log.push(cmd);
    return Promise.resolve();
  }

  putAudit(room: string, _seq: number, cmd: string): Promise<void> {
    this.#bucket(room).audit.push(cmd);
    return Promise.resolve();
  }

  putChat(room: string, _seq: number, msg: string): Promise<void> {
    this.#bucket(room).chat.push(msg);
    return Promise.resolve();
  }

  putEcell(room: string, user: string, cell: string): Promise<void> {
    this.#bucket(room).ecell[user] = cell;
    return Promise.resolve();
  }

  async setRoomIndex(room: string, updatedAt: number): Promise<void> {
    const buffer = this.#bucket(room);
    // Seed the DO with `skipIndex: true` — it writes storage + meta
    // but leaves the D1 `rooms` row to the batched flush below (or
    // skips it altogether when `skipBulkIndex` is on).
    await this.#flushSeed(room, buffer, updatedAt);
    this.#buffers.delete(room);
    if (this.#skipBulkIndex) return;
    this.#pendingIndex.push({ room, updatedAt });
    if (this.#pendingIndex.length >= this.#bulkIndexBatchSize) {
      await this.#flushBulkIndex();
    }
  }

  /**
   * Drain any remaining `(room, updatedAt)` pairs that haven't reached
   * the batch threshold. Safe to call multiple times — it's a no-op when
   * the queue is empty. Invoked by `applyRoomStream` at end-of-run.
   */
  async flush(): Promise<void> {
    if (this.#skipBulkIndex) return;
    if (this.#pendingIndex.length > 0) await this.#flushBulkIndex();
  }

  #bucket(room: string): RoomBuffer {
    let b = this.#buffers.get(room);
    if (b === undefined) {
      b = { log: [], audit: [], chat: [], ecell: {} };
      this.#buffers.set(room, b);
    }
    return b;
  }

  async #flushSeed(
    room: string,
    buffer: RoomBuffer,
    updatedAt: number,
  ): Promise<void> {
    const body: Record<string, unknown> = {
      log: buffer.log,
      audit: buffer.audit,
      chat: buffer.chat,
      ecell: buffer.ecell,
      updatedAt,
      skipIndex: true,
    };
    // Match `applyRoomStream`: only send `snapshot` when the source
    // yielded one. A log-only room (dump entry with no `snapshot-*`
    // key) ships without the field so the server's seed path skips
    // the snapshot write.
    if (buffer.snapshot !== undefined && buffer.snapshot.length > 0) {
      body['snapshot'] = buffer.snapshot;
    }
    const json = JSON.stringify(body);
    await this.#fetchWithRetry(
      `seed ${room}`,
      `${this.#baseUrl}/_migrate/seed/${encodeURIComponent(room)}`,
      json,
    );
  }

  async #flushBulkIndex(): Promise<void> {
    // Splice out up to one batch's worth; leave the tail in place so a
    // larger-than-batch flush (e.g. if concurrency outpaced the
    // threshold check) still drains in bounded chunks.
    const chunk = this.#pendingIndex.splice(0, this.#bulkIndexBatchSize);
    const json = JSON.stringify({ rooms: chunk });
    await this.#fetchWithRetry(
      `bulk-index ${chunk.length} rows`,
      `${this.#baseUrl}/_migrate/bulk-index`,
      json,
    );
  }

  /**
   * PUT a JSON body with retry-on-5xx. CF Workers (and the load path
   * through a DO) do occasionally 500 under load — a single retry with
   * ~1s backoff clears almost every transient. Gives up after 3 tries
   * and surfaces the final error; 4xx is never retried because those
   * are deterministic (bad token, bad payload) and will fail the same
   * way every time.
   *
   * Response body drained on every path — Bun/undici hold the buffered
   * Request+Response pair alive until the body stream is consumed or
   * cancelled. At hundreds of thousands of PUTs × ~85 KB per pair, not
   * draining balloons RSS to 58 GB and segfaults (2026-04-21 repro).
   */
  async #fetchWithRetry(
    label: string,
    url: string,
    jsonBody: string,
  ): Promise<void> {
    const maxAttempts = 3;
    let lastErrorText = '';
    let lastStatus = 0;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const res = await this.#fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.#token}`,
        },
        body: jsonBody,
      });
      if (res.ok) {
        await drain(res);
        return;
      }
      // Read the body once — drain happens automatically via `.text()`.
      lastErrorText = await safeText(res);
      lastStatus = res.status;
      if (res.status < 500 || attempt === maxAttempts) {
        throw new Error(
          `${label} failed: ${res.status} ${res.statusText} — ${lastErrorText}`,
        );
      }
      // 5xx and we have attempts left: sleep with jitter, then retry.
      const backoffMs = 200 * attempt + Math.floor(Math.random() * 100);
      await new Promise((r) => setTimeout(r, backoffMs));
    }
    // Unreachable — the loop always either returns or throws on the
    // final attempt. Included for the compiler's narrowing.
    /* istanbul ignore next */
    throw new Error(`${label} failed: ${lastStatus} — ${lastErrorText}`);
  }
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return '<unreadable body>';
  }
}

/**
 * Release a Response without inspecting its bytes. `safeText`/`.text()`
 * already drain the body; this is for success paths where we don't
 * need the payload but still must consume it or cancel the stream.
 *
 * Both Bun and undici/Node hold the buffered Request + Response bytes
 * alive until the body is fully read or explicitly cancelled. On a
 * long-running migration (hundreds of thousands of calls) this adds
 * up to tens of GB of retained memory and eventually crashes the
 * process — see CLAUDE.md §14 2026-04-21 entry.
 *
 * Try `body.cancel()` first (cheapest — tells the runtime to stop
 * buffering); fall back to `.arrayBuffer()` on engines where cancel
 * is missing or where the body has no underlying stream. Any error
 * here is non-fatal: we've already succeeded from the caller's POV.
 */
async function drain(res: Response): Promise<void> {
  try {
    if (res.body !== null && typeof res.body.cancel === 'function') {
      await res.body.cancel();
      return;
    }
    await res.arrayBuffer();
  } catch {
    // best-effort — the underlying bytes will be reclaimed when the
    // Response goes out of scope regardless, this just accelerates it.
  }
}

/**
 * Poll `${baseUrl}/_health` until it returns a 2xx or the deadline
 * elapses. Used by the CLI to wait for `wrangler dev --local` to warm
 * up before firing the first seed. `deps.now`/`deps.sleep` are injected
 * so tests can drive the polling loop without real time.
 */
export interface WaitForHealthDeps {
  fetch: FetchLike;
  now: () => number;
  sleep: (ms: number) => Promise<void>;
}

export async function waitForHealth(
  baseUrl: string,
  timeoutMs: number,
  deps: WaitForHealthDeps,
): Promise<boolean> {
  const url = `${baseUrl.replace(/\/+$/, '')}/_health`;
  const deadline = deps.now() + timeoutMs;
  // Always make at least one attempt, even with timeoutMs=0. The deadline
  // guard below only short-circuits retries, not the first request.
  while (true) {
    try {
      const res = await deps.fetch(url);
      // Drain whether ok or not — see `drain()` doc for why skipping
      // this leaks up to a few hundred KB per health poll.
      await drain(res);
      if (res.ok) return true;
    } catch {
      // Retry — the socket may still be warming up.
    }
    if (deps.now() >= deadline) return false;
    await deps.sleep(200);
  }
}
