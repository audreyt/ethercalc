#!/bin/bash
#
# Sandstorm grain entrypoint for EtherCalc (TypeScript / Cloudflare
# rewrite). Invoked by `sandstorm-http-bridge 33411 -- ./run_grain.sh`
# as the continueCommand in sandstorm-pkgdef.capnp.
#
# Responsibilities:
#   1. Boot workerd on port 33411, persisting Durable Object state to
#      /var/do-storage (the grain's writable volume). We use workerd
#      directly (rather than `wrangler dev` + Miniflare) because
#      wrangler's startup fetches Cloudflare's metadata endpoint for
#      `setupCf`, which fails in Sandstorm grains (no outbound network
#      by default).
#   2. On the first boot after an upgrade from the legacy LiveScript
#      EtherCalc (appVersion ≤ 201910080), stream the previous dump
#      through `ethercalc migrate` so users keep their spreadsheets.
#   3. Run until Sandstorm signals exit, then shut the worker down
#      cleanly so DO storage gets a chance to flush.
#
# Migrate token (SH-7): the bearer is passed only to the one-shot
# `ethercalc migrate` subprocess while workerd is briefly started with
# `ETHERCALC_MIGRATE_TOKEN` set. Normal grain operation runs workerd
# without the token so `PUT /_migrate/seed/*` returns 404.
set -euo pipefail

# Resolve the app directory from the script's own path. Under
# `spk dev` this is the source tree on the dev machine; under a
# packaged grain (after `spk pack` + `spk install`) this resolves
# to /opt/app, Sandstorm's standard mount point.
APP_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$APP_DIR"

MIGRATE_TOKEN="sandstorm-grain-local"
# Each Sandstorm grain IS one workbook. The legacy client opened `/=sheet`,
# where `sheet` is the table-of-contents room and `sheet1` is its first
# worksheet. The root handler classifies `sheet`: migrated TOCs and fresh
# grains open with tabs, while an existing ordinary room stays single-sheet.
export ETHERCALC_DEFAULT_ROOM="sheet"
# SH-6: honour Sandstorm viewer vs editor roles via bridge headers.
export ETHERCALC_SANDSTORM="1"
# Wrangler/Bun used to need HOME/TMPDIR set in the grain sandbox; now
# that we run workerd directly neither is load-bearing, but keep them
# exported — bunx is still invoked by the `ethercalc migrate` CLI for
# post-boot seeding and wants HOME.
export HOME="/var/home"
export TMPDIR="/var/tmp"
mkdir -p "$HOME" "$TMPDIR" /var/do-storage

# Locate workerd. `spk dev` maps the host's filesystem into the grain,
# so the path under node_modules is reachable. Packaged grains embed
# workerd inside the .spk at the same path via sandstorm-files.list
# tracing. On the host machine, bun install drops the platform-matched
# binary package under .bun/@cloudflare+workerd-linux-64@…/.
WORKERD_BIN="$(find "$APP_DIR/node_modules" -name workerd -type f -executable 2>/dev/null | head -n1)"
if [ -z "$WORKERD_BIN" ]; then
  echo "run_grain: ERROR — workerd binary not found under node_modules" >&2
  echo "           run 'bun install' before packaging" >&2
  exit 127
fi

WORKER_PID=""

start_workerd() {
  local migrate_token="${1:-}"
  local -a extra_env=()
  if [ -n "$migrate_token" ]; then
    extra_env+=(ETHERCALC_MIGRATE_TOKEN="$migrate_token")
  fi
  env "${extra_env[@]}" \
    "$WORKERD_BIN" serve \
    "$APP_DIR/packages/worker/workerd/config.capnp" \
    -ddo="/var/do-storage" \
    -dassets="$APP_DIR/assets" \
    &
  WORKER_PID=$!
}

stop_workerd() {
  if [ -n "$WORKER_PID" ]; then
    kill -TERM "$WORKER_PID" 2>/dev/null || true
    wait "$WORKER_PID" 2>/dev/null || true
    WORKER_PID=""
  fi
}

# Forward SIGTERM/SIGINT so DO storage flushes before the grain tears
# down. workerd traps SIGTERM cleanly and writes pending .sqlite pages.
trap 'stop_workerd; exit 0' TERM INT

wait_for_health() {
  for _ in $(seq 1 60); do
    if curl -sf http://127.0.0.1:33411/_health > /dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  echo "run_grain: ERROR — workerd failed /_health within 60s" >&2
  return 1
}

# First-load migration from the legacy LiveScript EtherCalc. That
# version ran Node + the db.ls filesystem fallback (no Redis on
# Sandstorm), which wrote either:
#   /var/dump.json   — single-blob JSON of all legacy Redis keys
#   /var/dump/*.txt  — per-key text files (snapshot-* raw, audit-*
#                      with \n/\r/\\ escape encoding)
# We feed whichever shape we find into `ethercalc migrate`, which
# seeds the worker's DO storage with full fidelity (snapshot + audit
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
    start_workerd "$MIGRATE_TOKEN"
    wait_for_health
    if bun "$APP_DIR"/bin/ethercalc migrate \
        --source "$LEGACY_SOURCE" \
        --target http://127.0.0.1:33411 \
        --token "$MIGRATE_TOKEN"; then
      echo "run_grain: legacy migration complete" >&2
      touch /var/.migrated
    else
      echo "run_grain: legacy migration FAILED — will retry on next boot" >&2
    fi
    stop_workerd
  else
    # Fresh grain, no legacy state. Mark sentinel so the /var probes
    # don't fire on every subsequent continueCommand invocation.
    touch /var/.migrated
  fi
fi

# Normal operation — migrate seed routes stay disarmed (SH-7).
start_workerd
wait $WORKER_PID