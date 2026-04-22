# EtherCalc self-host image (§13 Q5, CLAUDE.md §8 Phase 11).
#
# Launches `workerd serve` directly against a pre-bundled worker module,
# persisting Durable Object state to /data (a bind-mount volume). We
# deliberately do NOT run `wrangler dev` — wrangler's startup fetches
# Cloudflare metadata (`setupCf`), which fails in CI runners and in
# network-sandboxed environments like Sandstorm grains with an opaque
# "Unexpected server response: 101" that blocks the worker from ever
# binding a port. The standalone workerd path has no such dependency.
#
# Build pipeline inside the image:
#   1. bun install                              — workspace deps
#   2. bun run build:clients + build-assets.sh  — static tree under /app/assets
#   3. scripts/build-workerd-bundle.sh          — produces
#      /app/packages/worker/workerd/worker/index.js (the bundled ES
#      module) alongside the checked-in config.capnp.
#
# Runtime:
#   4. /app/bin/workerd-entrypoint.sh launches `workerd serve` with
#      per-invocation disk overrides (`-ddo=/data/do -dassets=…`).

FROM oven/bun:1.3

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json bun.lock ./
COPY packages ./packages
COPY bin ./bin
COPY scripts ./scripts

COPY index.html start.html panels.html \
     favicon.ico favicon-16x16.png favicon-32x32.png \
     android-chrome-192x192.png apple-touch-icon.png \
     mstile-150x150.png mstile-310x310.png \
     safari-pinned-tab.svg browserconfig.xml \
     manifest.json manifest.appcache \
     ./
COPY l10n ./l10n
COPY images ./images
COPY static ./static

RUN bun install --frozen-lockfile

# Build the client bundles + curated assets/ dir.
RUN bun run --cwd packages/client build \
 && bun run --cwd packages/client-multi build \
 && ./scripts/build-assets.sh

# Build the standalone workerd bundle. Produces
# packages/worker/workerd/worker/index.js from wrangler's dry-run, plus
# a symlink `packages/worker/workerd/assets` → /app/assets which the
# runtime overrides via the `-dassets=` flag anyway. Remove the symlink
# after build so we can bake in an explicit path below.
RUN ./scripts/build-workerd-bundle.sh \
 && rm -f /app/packages/worker/workerd/assets

# Persistent storage for Durable Object state. `workerd serve`'s
# on-disk DO backend writes SQLite files under /data/do/<uniqueKey>/.
VOLUME ["/data"]

EXPOSE 8000

# Environment variables that override runtime behavior. Documented here so
# `docker inspect` users can see them without reading README:
#   ETHERCALC_PORT                — listening port (default 8000)
#   ETHERCALC_HOST                — listening address (default 0.0.0.0)
#   ETHERCALC_KEY                 — HMAC secret for --key auth (§6.4)
#   ETHERCALC_CORS                — "1" to enable permissive CORS headers
#   ETHERCALC_BASEPATH            — URL prefix when running behind a reverse proxy
#   ETHERCALC_EXPIRE              — seconds of inactivity before a room is pruned
#   ETHERCALC_DEFAULT_ROOM        — single-grain default room (302 from `/`)
#   ETHERCALC_MIGRATE_TOKEN       — enable PUT /_migrate/seed
ENV ETHERCALC_PORT=8000 \
    ETHERCALC_HOST=0.0.0.0 \
    ETHERCALC_DATA_DIR=/data

CMD ["bash", "/app/bin/workerd-entrypoint.sh"]
