# @ethercalc/migrate

Phase 11b migrator — reads a legacy EtherCalc Redis dump and replays
every room into Cloudflare (DO storage + D1 + KV) via wrangler. See
`CLAUDE.md` §12 for the full design.

## Exporting a Redis dump

On the host that runs the legacy server:

```bash
redis-cli --rdb /tmp/ethercalc.rdb
```

This writes a point-in-time snapshot of every key (`snapshot-*`,
`log-*`, `audit-*`, `chat-*`, `ecell-*`, plus the global `timestamps`
hash). No online Redis is required once the `.rdb` is in hand — this
tool parses it offline.

## Running the migration

```bash
bun run --cwd packages/migrate migrate \
  --input /tmp/ethercalc.rdb \
  --d1-name ethercalc-rooms \
  --kv-name ROOMS_INDEX
```

The migrator will:

1. Parse the RDB file (pure, offline — see `src/parse-rdb.ts`).
2. Partition it into per-room records (`src/extract-rooms.ts`).
3. Shell out to `wrangler d1 execute` / `wrangler kv key put` for each
   write (`src/targets/wrangler.ts`).

Per-room DO storage is seeded via a staging table `do_storage_seed`
in D1 (the Worker hydrates it on first room access). Once Phase 5's
`PUT /_do/snapshot` DO endpoint lands, this target will switch to
direct DO API calls without changing its public surface.

## Dry-run preview

```bash
bun run --cwd packages/migrate migrate \
  --input /tmp/ethercalc.rdb \
  --d1-name ethercalc-rooms \
  --kv-name ROOMS_INDEX \
  --dry-run
```

Prints every intended write to stdout without invoking wrangler.
Useful for diffing against a previous dump and for sanity-checking
`--d1-name`/`--kv-name`.

## What goes where

| Legacy Redis key            | New location                                        |
| --------------------------- | --------------------------------------------------- |
| `snapshot-<room>`           | DO storage `snapshot` (+ `meta:updated_at`)         |
| `log-<room>[i]`             | DO storage `log:<padSeq(i+1)>`                      |
| `audit-<room>[i]`           | DO storage `audit:<padSeq(i+1)>`                    |
| `chat-<room>[i]`            | DO storage `chat:<padSeq(i+1)>`                     |
| `ecell-<room>` hash field   | DO storage `ecell:<user>`                           |
| `timestamps` hash           | D1 `rooms(room, updated_at)`                        |
| (new) existence flag        | KV `rooms:exists:<room>` → `"1"`                    |

Room names preserve the exact bytes they had in Redis (including URL
encoding applied by the legacy `encodeURI` call).

## Testing

```bash
bun run --cwd packages/migrate test            # 91 tests
bun run --cwd packages/migrate test:coverage   # 100% gate
```

All tests run in pure Node — no Redis, no wrangler, no Cloudflare
credentials required.
