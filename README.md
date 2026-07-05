# EtherCalc

* Overview: https://ethercalc.net/
* User guide: [docs.ethercalc.net](https://docs.ethercalc.net) (Starlight). Local: `bun run --cwd packages/docs dev`
* 中文版: http://tw.ethercalc.net/
* 简体中文: http://cn.ethercalc.net/
* REST API: [API.md](./API.md)

EtherCalc is a web spreadsheet for real-time collaborative editing.
This branch is the TypeScript rewrite on the Cloudflare fullstack
(Hono + Workers + Durable Objects + D1 + KV + R2). It deploys to
Cloudflare via `wrangler deploy`, and **self-hosts anywhere via
`docker compose up`** with no Cloudflare account required. See
[AGENTS.md](./AGENTS.md) for agent context and
[docs.ethercalc.net](https://docs.ethercalc.net) for architecture.
The full rewrite plan lives in
[docs/historic/REWRITE_ULTRAPLAN.md](./docs/historic/REWRITE_ULTRAPLAN.md).

Integrated with content management systems:

* [Drupal](https://drupal.org/project/sheetnode)

Browsers tested: Safari, Chrome, Firefox.

## Install

Via npm (requires [Bun](https://bun.sh/) ≥ 1.1 on PATH — the CLI
spawns `bunx wrangler`):

    npm install -g ethercalc
    ethercalc              # starts on http://localhost:8000

Via Docker (no Bun needed on the host — the image carries it):

    git clone https://github.com/audreyt/ethercalc
    cd ethercalc
    docker compose up -d

The CLI path boots wrangler/Miniflare; the Docker path boots standalone
workerd. Both need no Cloudflare account, and Docker persists room state
under `./ethercalc-data/` (or `/data` in the container).

## Self-hosting

### Local / trusted LAN

    git clone https://github.com/audreyt/ethercalc
    cd ethercalc
    docker compose up -d

This boots the standalone workerd Worker on `http://localhost:8000` and
persists spreadsheet room state to `./ethercalc-data/` in the repo. No
Redis, no Node runtime, no Cloudflare account. **Use this path only on
a trusted network** (localhost, office LAN, VPN). It binds plaintext HTTP
with no rate limiting or TLS.

### Internet-facing (required)

If the instance is reachable from the public internet, **you must put a
reverse proxy in front** that terminates TLS and applies rate limits.
Plain `docker compose up` alone is not suitable for that threat model.
The app deliberately keeps anonymous read/write for anyone who knows a
room URL; the edge is where you bound request volume. A runnable nginx
recipe ships in the repo:

    docker compose -f docker-compose.proxy.yml up -d

The proxy config at `deploy/nginx/ethercalc.conf` sets a 25 MiB body
limit to match the Worker write cap, limits request/connection rates per
source address, and forwards WebSocket upgrades (with long read
timeouts, so idle spreadsheets stay connected). For production HTTPS:
place your certificates under `deploy/nginx/certs/`, uncomment the 443
listener in that file, **and** uncomment the 443 ports mapping in
`docker-compose.proxy.yml` — or copy the same limits to your existing
nginx/caddy/traefik edge. The bundled proxy serves the app at the URL
root; don't combine it with `ETHERCALC_BASEPATH` (the config does no
prefix stripping).

### Environment variables

Override defaults by exporting these before `docker compose up`:

| Variable              | Default     | Effect                                            |
| --------------------- | ----------- | ------------------------------------------------- |
| `ETHERCALC_PORT`      | `8000`      | Listening port (remaps container bind).           |
| `ETHERCALC_HOST`      | `0.0.0.0`   | Listening address.                                |
| `ETHERCALC_KEY`       | *(unset)*   | HMAC secret; enables read-only vs. edit auth.     |
| `ETHERCALC_DISABLE_ROOM_INDEX` | `1` | Hide `/_rooms*` and `/_exists/:room`. Set `0` to reopen (on the Docker image the directory endpoints then return empty bodies — there is no D1 index; only `/_exists` becomes a live oracle). |
| `ETHERCALC_CORS`      | *(unset)*   | Legacy room-index gate; CORS headers are always permissive for embeds. |
| `ETHERCALC_BASEPATH`  | *(unset)*   | URL prefix, e.g. `/ethercalc` behind a proxy.     |
| `ETHERCALC_EXPIRE`    | *(unset)*   | Seconds of inactivity before a room is pruned.    |
| `ETHERCALC_RATELIMIT` | *(unset)*   | Optional in-Worker per-IP limit (off by default). `1` or `10` = 10 req/s; `60:600` = 600 per minute. Belt-and-suspenders behind nginx — not a substitute for the proxy. |
| `ETHERCALC_ROOM_CREATE_LIMIT` | *(unset)* | Optional per-IP cap on room creation (`POST /_`, `/_new`, `/_from`, `PUT /_/room`). `1` = 6/min. Proxy compose defaults this on. |

Recommended public-instance settings:

- Set `ETHERCALC_KEY` if you want edit/delete URLs to require a per-room
  HMAC rather than anonymous write/delete.
- Leave `ETHERCALC_DISABLE_ROOM_INDEX=1` unless you intentionally want a
  public room directory and existence oracle.
- Set `ETHERCALC_EXPIRE` for public scratch instances, e.g.
  `ETHERCALC_EXPIRE=2592000` for a 30-day inactivity TTL.
- **Always** use `docker-compose.proxy.yml` (or your own nginx/caddy/
  traefik edge with equivalent limits) when the service is internet-facing.
- Keep the container on plain HTTP and terminate TLS at the reverse
  proxy. If a local proxy fronts the container, publish the container
  port on loopback, e.g. `127.0.0.1:8000:8000`; do not change
  `ETHERCALC_HOST`, which must stay reachable inside the container.
- Optionally set `ETHERCALC_RATELIMIT=1` for an extra in-Worker per-IP
  cap when nginx is already in place.

On Apple Silicon, Docker Desktop's virtio networking has an
intermittent quirk that can make `curl localhost:8000` hang even
against a healthy container. If you hit it, run the worker directly
(`bun run --cwd packages/worker dev`) or use a Linux host.

## CLI

For non-Docker runs (local dev, systemd, etc.) use the `bin/ethercalc`
wrapper. It accepts the legacy flag surface and forwards to
`wrangler dev` + Miniflare/`--var` bindings:

    bin/ethercalc [--key SECRET] [--cors] [--port N] [--host ADDR] \
                  [--expire SEC] [--basepath PREFIX] \
                  [--persist-to DIR]

Run `bin/ethercalc --help` for the full flag table. `--keyfile` /
`--certfile` are accepted for backward compatibility but currently
print a warning — `wrangler dev` does not expose TLS. Terminate TLS at
a reverse proxy (nginx/caddy/traefik).

The `ETHERCALC_*` environment variables from the table above work here
too (exported before `bin/ethercalc`). Note that the CLI forwards them
to `wrangler dev` as `--var` arguments, which are visible in the local
process list — on shared machines, prefer a loopback bind or put
secrets in `packages/worker/.dev.vars` instead of the environment.

## Deploy to Cloudflare

    cd packages/worker
    npx wrangler deploy

Store the HMAC secret as a Worker secret:

    npx wrangler secret put ETHERCALC_KEY

## Staying on legacy (Redis-backed) EtherCalc

`audreyt/ethercalc:latest` (and every `0.20260422.*` tag and later)
ships the 2026 TypeScript rewrite. It stores rooms in Durable Object SQLite
files, **not** Redis — pulling `latest` over an existing Redis-backed
install will look broken until you migrate.

To keep using Redis without migrating yet, pin the last pre-rewrite release:

    docker pull audreyt/ethercalc:0.20201228.1

Or use the bundled compose file (builds the same image locally if the tag
is not cached yet):

    git clone https://github.com/audreyt/ethercalc
    cd ethercalc
    # Reuse your existing Redis data directory:
    ETHERCALC_LEGACY_REDIS_DATA=/var/lib/redis docker compose -f docker-compose.legacy.yml up -d

Room state lives in Redis (`appendonly yes`). The legacy stack listens on
port 8000 and speaks socket.io — same URLs and behaviour as pre-2026
self-hosts. When you are ready to move forward, see the migration section
below.

## Migration from a legacy (Redis-backed) EtherCalc

### Turnkey (recommended)

If you have a legacy Redis-backed EtherCalc and just want to upgrade:

    # Preserve the Redis dump outside the repo — this is your rollback point
    sudo cp /var/lib/redis/dump.rdb ~/ethercalc-dump-$(date +%F).rdb

    git clone https://github.com/audreyt/ethercalc
    cd ethercalc
    cp ~/ethercalc-dump-$(date +%F).rdb ./legacy-dump.rdb
    ./bin/migrate-legacy.sh

One command stands up a temporary Redis loaded with your dump,
builds and runs the new Worker, streams every room across, and
writes a dated backup to `./backups/ethercalc-<timestamp>.tar.gz`
containing both the migrated state and your source dump. On success
the Worker is left running on http://localhost:8000 — open any
existing room by its URL to confirm.

Requires only `docker` + the `docker compose` plugin on the host.
On Ubuntu: `sudo apt install -y docker.io docker-compose-plugin`.
Tested against OrbStack and Docker Desktop on macOS/arm64; Docker
Engine on Linux.

### Migrating rooms to a Cloudflare deployment

Once the turnkey path above has verified locally, the same dump can
be pushed to a Cloudflare Workers deployment. From the repo root:

    # Deploy the worker. Spits out https://ethercalc.<subdomain>.workers.dev
    cd packages/worker
    npx wrangler login       # one-time browser auth
    npx wrangler deploy

    # Mint a migration token and store it as a Cloudflare secret
    TOKEN=$(openssl rand -hex 16)
    echo "$TOKEN" | npx wrangler secret put ETHERCALC_MIGRATE_TOKEN

    # Stand up a temporary local Redis loaded with the legacy dump
    cd ../..
    docker run -d --name ec-migrate-redis -p 6379:6379 \
      -v "$PWD/legacy-dump.rdb:/input/dump.rdb:ro" \
      redis:7-alpine sh -c \
      'cp /input/dump.rdb /data/dump.rdb && exec redis-server --save "" --appendonly no'
    sleep 3   # let redis finish loading the dump

    # Push every room up to the Cloudflare deployment
    ./bin/ethercalc migrate \
      --source redis://localhost:6379 \
      --target https://ethercalc.<subdomain>.workers.dev \
      --token "$TOKEN"

    docker rm -f ec-migrate-redis

Then attach your domain in the Cloudflare dashboard under Workers &
Pages → your worker → Triggers → Custom Domains.

### Manual (advanced)

`bin/ethercalc migrate` streams a running Redis or Zedis directly
into a Worker you already have up:

    bin/ethercalc migrate \
      --source redis://localhost:6379 \
      --target http://new-worker.example/ \
      --token $ETHERCALC_MIGRATE_TOKEN

O(1)-per-room memory regardless of dump size — Redis owns the decoding.
The target endpoint is gated by `env.ETHERCALC_MIGRATE_TOKEN` (when
unset, the route returns 404). Pass `--dry-run` to preview without
writing. `--source file:///path` (or bare `/path`) also works for
on-disk legacy dumps (the Sandstorm grain fallback format).

## Development

    bun install
    bun run --cwd packages/worker dev          # wrangler dev --local
    bun run --cwd packages/worker test         # workers-pool + node tests

See [AGENTS.md](./AGENTS.md) for the directory map, testing strategy
(100% line/branch/function/statement coverage plus Stryker mutation
gates on gated packages), and the remaining phase plan.

## REST API

See [API.md](./API.md). The public HTTP surface is preserved
byte-for-byte where deterministic, minus a small allow-list of
sensible fixes documented in AGENTS.md §6.1.

# Licensing

### Common Public Attribution License (Socialtext Inc.)

* socialcalcspreadsheetcontrol.js
* socialcalctableeditor.js

### Artistic License 2.0 (Socialtext Inc.)

* formatnumber2.js
* formula1.js
* socialcalc-3.js
* socialcalcconstants.js
* socialcalcpopup.js

#### Artistic License 2.0 (Framasoft)

* l10n/fr.json

### MIT License (John Resig, The Dojo Foundation)

* static/jquery.js

### MIT License (HubSpot, Inc.)

* static/vex-theme-flat-attack.css
* static/vex.combined.min.js
* static/vex.css

### MIT License (Stuart Knightley, David Duponchel, Franz Buchinger, Ant'onio Afonso)

* static/jszip.js

### Apache License 2.0 (SheetJS)

* static/shim.js
* static/xlsx.core.min.js
* static/xlsxworker.js
* assets/start.html (xlsx2socialcalc.js)

### CC0 Public Domain (唐鳳 / Audrey Tang)

* src/*.ls (legacy LiveScript sources, preserved until Phase 12 sweep)
* packages/**/*.ts (TypeScript rewrite)

### Mozilla Public License Version 2.0 (LibreOffice contributors)

* images/sc_*.png
