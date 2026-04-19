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

WORKDIR /app

# Copy the workspace manifests first so `bun install --frozen-lockfile` is
# cache-friendly. We keep this coarse (copy everything) because the workspace
# has many small packages and bun resolves them from the top-level lockfile.
COPY package.json bun.lock ./
COPY packages ./packages
COPY bin ./bin

RUN bun install --frozen-lockfile

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
# flag surface (§13 Q6) into wrangler/Miniflare invocation. Running it with
# no flags picks up the ENV defaults above.
CMD ["bun", "bin/ethercalc"]
