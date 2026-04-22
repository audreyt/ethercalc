# EtherCalc self-host image (§13 Q5, CLAUDE.md §8 Phase 11).
#
# Runs the new TypeScript Worker under Miniflare via `wrangler dev`, with
# D1/KV/R2/Durable Object state persisted to a mounted volume at /data so
# a restart preserves all rooms. No Cloudflare account needed.
#
# Base: oven/bun — matches the workspace toolchain (commit 042b731
# "Switch from node/npm to bun"). Wrangler still spawns workerd under the
# hood; bun provides a Node-compatible runtime for wrangler itself.
FROM oven/bun:1.3

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
# curl is kept only because run_grain.sh probes /_health with it; bun
# comes with the oven/bun:1.3 base. Previously we also installed
# nodejs + npm to give the CLI `npx wrangler` — the CLI now spawns
# `bunx wrangler` instead, which is already provided by bun.

WORKDIR /app

# Copy the workspace manifests first so `bun install --frozen-lockfile` is
# cache-friendly. We keep this coarse (copy everything) because the workspace
# has many small packages and bun resolves them from the top-level lockfile.
COPY package.json bun.lock ./
COPY packages ./packages
COPY bin ./bin
COPY scripts ./scripts

# Static files required by the asset pipeline (§6.1, §7 item 24): HTML
# pages, PWA manifests, icons, l10n bundles, manifest.appcache. The
# `scripts/build-assets.sh` step collates these into `/app/assets` which
# the worker's `[assets]` binding serves at runtime.
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

# Build the client bundles and the curated assets/ directory. Must run
# before `wrangler dev` starts or Miniflare fails to bind the ASSETS
# service.
RUN bun run --cwd packages/client build \
 && bun run --cwd packages/client-multi build \
 && ./scripts/build-assets.sh

# Persistent storage for Miniflare-simulated D1/KV/R2/Durable Object state.
# `bin/ethercalc --persist-to=/data` (the default CMD) writes here.
VOLUME ["/data"]

# Legacy EtherCalc listened on 8000; keep that for drop-in compat with
# existing docker-compose users. Override via $ETHERCALC_PORT.
EXPOSE 8000

# Environment variables that override runtime behavior. Documented here so
# `docker inspect` users can see them without reading README:
#   ETHERCALC_PORT       — listening port (default 8000)
#   ETHERCALC_HOST       — listening address (default 0.0.0.0)
#   ETHERCALC_KEY        — HMAC secret for --key auth (§6.4)
#   ETHERCALC_CORS       — "1" to enable permissive CORS headers
#   ETHERCALC_BASEPATH   — URL prefix when running behind a reverse proxy
#   ETHERCALC_EXPIRE     — seconds of inactivity before a room is pruned
ENV ETHERCALC_PORT=8000 \
    ETHERCALC_HOST=0.0.0.0 \
    ETHERCALC_PERSIST_DIR=/data

# `bin/ethercalc` is the legacy CLI entrypoint. It translates the legacy
# flag surface (§13 Q6) into wrangler/Miniflare invocation.
#
# We pass explicit --port/--host/--persist-to because wrangler dev's
# defaults are 127.0.0.1:8787 (not reachable from outside the container)
# and ephemeral state. Users can still override at `docker run` time by
# supplying their own argv.
CMD ["bun", "bin/ethercalc", "--port", "8000", "--host", "0.0.0.0", "--persist-to", "/data"]
