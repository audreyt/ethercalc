#!/bin/bash
#
# Sandstorm grain entrypoint for EtherCalc (TypeScript / Cloudflare
# rewrite). Invoked by `sandstorm-http-bridge 33411 -- ./run_grain.sh`
# as the continueCommand in sandstorm-pkgdef.capnp.
#
# Responsibilities:
#   1. Boot the Miniflare-backed Worker on port 33411, persisting DO/
#      D1/KV/R2 state to /var/miniflare (the grain's writable volume).
#   2. On the first boot after an upgrade from the legacy LiveScript
#      EtherCalc (appVersion ≤ 201910080), stream the previous dump
#      through `ethercalc migrate` so users keep their spreadsheets.
#   3. Run until Sandstorm signals exit, then shut the worker down
#      cleanly so Miniflare gets a chance to flush state.
#
# Why a grain-local migrate token:
#   The PUT /_migrate/seed endpoint on the worker is gated on
#   `env.ETHERCALC_MIGRATE_TOKEN` (returns 404 if unset). Because the
#   worker is only reachable from within the grain's sandbox, a fixed
#   token is safe — it's defense-in-depth, not the primary isolation.
#   The Sandstorm grain's filesystem and network are already private
#   to the user.
set -euo pipefail

# Resolve the app directory from the script's own path. Under
# `spk dev` this is the source tree on the dev machine; under a
# packaged grain (after `spk pack` + `spk install`) this resolves
# to /opt/app, Sandstorm's standard mount point.
APP_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$APP_DIR"

export ETHERCALC_MIGRATE_TOKEN="sandstorm-grain-local"
export ETHERCALC_PERSIST_DIR="/var/miniflare"
# Bun's runtime scaffolds a fake /usr/bin/node symlink under $TMPDIR for
# scripts that import from `node:*`. In Sandstorm's grain sandbox the
# default TMPDIR (/tmp) is a separate fs that Bun's symlink-create
# pathway stumbles on — it panics with `createFakeTemporaryNodeExecutable:
# error.FileNotFound`. Point TMPDIR at the grain's writable /var so Bun
# uses that instead.
export TMPDIR="/var/tmp"
export BUN_INSTALL_CACHE_DIR="/var/bun-cache"
# Wrangler / Miniflare call `os.homedir()` during bootstrap. The Sandstorm
# grain sandbox doesn't set HOME; point it at a grain-local writable dir
# so Wrangler's startup (`uv_os_homedir`) doesn't ENOENT.
export HOME="/var/home"
mkdir -p "$ETHERCALC_PERSIST_DIR" "$TMPDIR" "$BUN_INSTALL_CACHE_DIR" "$HOME"

# Boot Miniflare in the background. We pass --port 33411 so it binds
# the port sandstorm-http-bridge expects to proxy.
bun "$APP_DIR"/bin/ethercalc \
    --port 33411 --host 0.0.0.0 \
    --persist-to "$ETHERCALC_PERSIST_DIR" &
WORKER_PID=$!

# Forward SIGTERM/SIGINT so Miniflare gets a chance to flush before
# the grain is torn down.
trap 'kill -TERM "$WORKER_PID" 2>/dev/null; wait "$WORKER_PID" 2>/dev/null; exit 0' TERM INT

# Wait for /_health before proceeding. Miniflare normally responds in
# 1–2s; we give it up to 60s for a cold grain.
for _ in $(seq 1 60); do
  if curl -sf http://127.0.0.1:33411/_health > /dev/null 2>&1; then
    break
  fi
  sleep 1
done

# First-load migration from the legacy LiveScript EtherCalc. That
# version ran Node + the db.ls filesystem fallback (no Redis on
# Sandstorm), which wrote either:
#   /var/dump.json   — single-blob JSON of all legacy Redis keys
#   /var/dump/*.txt  — per-key text files (snapshot-* raw, audit-*
#                      with \n/\r/\\ escape encoding)
# We feed whichever shape we find into `ethercalc migrate`, which
# seeds the worker's DO/D1 layer with full fidelity (snapshot + audit
# from dir mode; snapshot + log + audit + chat + ecell + timestamps
# from JSON mode). A /var/.migrated sentinel prevents re-runs.
if [ ! -f /var/.migrated ]; then
  LEGACY_SOURCE=""
  if [ -f /var/dump.json ]; then
    LEGACY_SOURCE="file:///var/dump.json"
  elif [ -d /var/dump ]; then
    LEGACY_SOURCE="file:///var/dump"
  fi

  if [ -n "$LEGACY_SOURCE" ]; then
    echo "run_grain: migrating legacy EtherCalc dump at $LEGACY_SOURCE" >&2
    if bun "$APP_DIR"/bin/ethercalc migrate \
        --source "$LEGACY_SOURCE" \
        --target http://127.0.0.1:33411 \
        --token "$ETHERCALC_MIGRATE_TOKEN"; then
      echo "run_grain: legacy migration complete" >&2
      touch /var/.migrated
    else
      echo "run_grain: legacy migration FAILED — will retry on next boot" >&2
    fi
  else
    # Fresh grain, no legacy state. Mark sentinel so the /var probes
    # don't fire on every subsequent continueCommand invocation.
    touch /var/.migrated
  fi
fi

wait $WORKER_PID
