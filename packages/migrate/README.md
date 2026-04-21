# @ethercalc/migrate

Phase 11b migrator — streams a legacy EtherCalc Redis out of a live
RESP server and seeds each room into the new Cloudflare stack via the
worker's `PUT /_migrate/seed/:room` endpoint. See `CLAUDE.md` §12 for
the full design.

## Exporting the legacy data

Load the legacy `dump.rdb` into a RESP-speaking server on the migration
host. Any of these works — the migrator only talks RESP:

```bash
# Option A — real redis-server
redis-server --dir /path/to/dump/ --dbfilename dump.rdb --port 6379

# Option B — Zedis or any other RESP-compatible RDB loader.
```

The server owns the RDB decode; the migrator owns shape-shifting into
Worker PUTs. Total memory in the migrator stays O(1-per-room)
regardless of dump size — rooms are streamed via `SCAN` and pipelined
`GET`/`LRANGE`/`HGETALL`.

## Running the migration

Start the new worker in one terminal (Miniflare or `wrangler dev`):

```bash
echo 'ETHERCALC_MIGRATE_TOKEN="local-only"' > packages/worker/.dev.vars
./bin/ethercalc
```

Then run the migrator in another:

```bash
./bin/ethercalc migrate \
  --source redis://127.0.0.1:6379 \
  --target http://127.0.0.1:8000 \
  --token local-only
```

`--token` must match `env.ETHERCALC_MIGRATE_TOKEN` on the worker. In
production, set it with `wrangler secret put ETHERCALC_MIGRATE_TOKEN`
before running with `--target https://ethercalc.workers.dev`.

## Dry-run preview

```bash
./bin/ethercalc migrate \
  --source redis://127.0.0.1:6379 \
  --dry-run
```

Enumerates every room via RESP and prints the intended writes to
stdout without contacting any worker. Useful for sanity-checking the
dump before a real seed.

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
bun run --cwd packages/migrate test
bun run --cwd packages/migrate test:coverage   # 100% gate
```

All tests run in pure Node — no Redis, no wrangler, no Cloudflare
credentials required.
