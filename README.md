# EtherCalc

* Overview: https://ethercalc.net/
* 中文版: http://tw.ethercalc.net/
* 简体中文: http://cn.ethercalc.net/
* REST API: [API.md](./API.md)

EtherCalc is a web spreadsheet for real-time collaborative editing.
This branch is the TypeScript rewrite on the Cloudflare fullstack
(Hono + Workers + Durable Objects + D1 + KV + R2). It deploys to
Cloudflare via `wrangler deploy`, and **self-hosts anywhere via
`docker compose up`** with no Cloudflare account required. See
[CLAUDE.md](./CLAUDE.md) for the plan-of-record, full architecture,
and phase status.

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

Both paths boot the same Miniflare-backed Worker, persist state
under `./ethercalc-data/` (or `/data` in the container), and need no
Cloudflare account.

## Self-hosting

    git clone https://github.com/audreyt/ethercalc
    cd ethercalc
    docker compose up -d

This boots the Miniflare-backed Worker on `http://localhost:8000` and
persists all spreadsheet state (Durable Objects, D1, KV, R2) to
`./ethercalc-data/` in the repo. No Redis, no Node runtime, no
Cloudflare account.

### Environment variables

Override defaults by exporting these before `docker compose up`:

| Variable              | Default     | Effect                                            |
| --------------------- | ----------- | ------------------------------------------------- |
| `ETHERCALC_PORT`      | `8000`      | Listening port (remaps container bind).           |
| `ETHERCALC_HOST`      | `0.0.0.0`   | Listening address.                                |
| `ETHERCALC_KEY`       | *(unset)*   | HMAC secret; enables read-only vs. edit auth.     |
| `ETHERCALC_CORS`      | *(unset)*   | `1` enables permissive CORS headers.              |
| `ETHERCALC_BASEPATH`  | *(unset)*   | URL prefix, e.g. `/ethercalc` behind a proxy.     |
| `ETHERCALC_EXPIRE`    | *(unset)*   | Seconds of inactivity before a room is pruned.    |

On Apple Silicon, Docker Desktop's virtio networking has an
intermittent quirk that can make `curl localhost:8000` hang even
against a healthy container. If you hit it, run the worker directly
(`bun run --cwd packages/worker dev`) or use a Linux host.

## CLI

For non-Docker runs (local dev, systemd, etc.) use the `bin/ethercalc`
wrapper. It accepts the legacy flag surface and forwards to
`wrangler dev` + Miniflare env vars:

    bin/ethercalc [--key SECRET] [--cors] [--port N] [--host ADDR] \
                  [--expire SEC] [--basepath PREFIX] \
                  [--persist-to DIR]

Run `bin/ethercalc --help` for the full flag table. `--keyfile` /
`--certfile` are accepted for backward compatibility but currently
print a warning — `wrangler dev` does not expose TLS. Terminate TLS at
a reverse proxy (nginx/caddy/traefik).

## Deploy to Cloudflare

    cd packages/worker
    npx wrangler deploy

Store the HMAC secret as a Worker secret:

    npx wrangler secret put ETHERCALC_KEY

## Migration from a legacy (Redis-backed) EtherCalc

`bin/ethercalc migrate` streams an existing Redis or Zedis instance
into the new Worker via `PUT /_migrate/seed/:room`:

    bin/ethercalc migrate \
      --source redis://localhost:6379 \
      --target http://new-worker.example/ \
      --token $ETHERCALC_MIGRATE_TOKEN

The migrator holds O(1-per-room) memory regardless of dump size — the
Redis server owns RDB decoding. The target endpoint is gated by
`env.ETHERCALC_MIGRATE_TOKEN` (when unset, the route returns 404).
Pass `--dry-run` to preview without writing.

## Development

    bun install
    bun run --cwd packages/worker dev          # wrangler dev --local
    bun run --cwd packages/worker test         # workers-pool + node tests

See [CLAUDE.md](./CLAUDE.md) for the directory map, testing strategy
(100% line/branch/function/statement coverage plus Stryker mutation
gates on gated packages), and the remaining phase plan.

## REST API

See [API.md](./API.md). The public HTTP surface is preserved
byte-for-byte where deterministic, minus a small allow-list of
sensible fixes documented in CLAUDE.md §6.1.

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
