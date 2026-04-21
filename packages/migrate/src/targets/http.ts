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
}

export class HttpTarget implements MigrationTarget {
  readonly #baseUrl: string;
  readonly #token: string;
  readonly #fetch: FetchLike;
  readonly #buffers: Map<string, RoomBuffer> = new Map();

  constructor(config: HttpTargetConfig) {
    // Strip a trailing slash so `${baseUrl}/_migrate/...` is always well-formed.
    this.#baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.#token = config.token;
    this.#fetch = config.fetch ?? ((input, init) => fetch(input, init));
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
    await this.#flush(room, buffer, updatedAt);
    this.#buffers.delete(room);
  }

  #bucket(room: string): RoomBuffer {
    let b = this.#buffers.get(room);
    if (b === undefined) {
      b = { log: [], audit: [], chat: [], ecell: {} };
      this.#buffers.set(room, b);
    }
    return b;
  }

  async #flush(
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
    };
    // Match `applyRoomStream`: only send `snapshot` when the source
    // yielded one. A log-only room (dump entry with no `snapshot-*`
    // key) ships without the field so the server's seed path skips
    // the snapshot write.
    if (buffer.snapshot !== undefined && buffer.snapshot.length > 0) {
      body['snapshot'] = buffer.snapshot;
    }
    const res = await this.#fetch(
      `${this.#baseUrl}/_migrate/seed/${encodeURIComponent(room)}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.#token}`,
        },
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) {
      const text = await safeText(res);
      throw new Error(
        `seed ${room} failed: ${res.status} ${res.statusText} — ${text}`,
      );
    }
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
      if (res.ok) return true;
    } catch {
      // Retry — the socket may still be warming up.
    }
    if (deps.now() >= deadline) return false;
    await deps.sleep(200);
  }
}
