#!/bin/bash
#
# Sandstorm grain entrypoint for EtherCalc (TypeScript / Cloudflare
# rewrite). Invoked by
# `sandstorm-http-bridge 33411 -- /opt/app/.sandstorm/run_grain.sh` as
# the continueCommand in sandstorm-pkgdef.capnp.
#
# Responsibilities:
#   1. Boot workerd on port 33411, persisting Durable Object state to
#      /var/do-storage (the grain's writable volume). We use workerd
#      directly (rather than `wrangler dev` + Miniflare) because
#      wrangler's startup fetches Cloudflare's metadata endpoint for
#      `setupCf`, which fails in Sandstorm grains (no outbound network
#      by default).
#   2. On the first boot after an upgrade from the legacy LiveScript
#      EtherCalc (appVersion ≤ 201910080), run a temporary loopback-only
#      worker that imports the previous /var dump through a read-only
#      disk binding, then stop it before starting the public app worker.
#   3. Run until Sandstorm signals exit, then shut the worker down
#      cleanly so DO storage gets a chance to flush.
#
# Why a grain-local migrate token:
#   The temporary migration worker receives a per-launch random bearer
#   token and listens on 127.0.0.1:33412, not the bridge-facing 33411
#   port. The normal app worker starts after that token is unset and
#   uses config.capnp, which does not bind the legacy /var reader.
set -euo pipefail

# Resolve the app directory from this script's parent directory. The
# script lives under .sandstorm/, while runtime assets live at the app
# root. In Sandstorm dev/package mode that root is /opt/app.
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_DIR"

# Each Sandstorm grain IS a single spreadsheet — `/` should land in
# the live sheet, not the ethercalc.net "create new" landing. The
# legacy LiveScript EtherCalc initialized a `sheet1` room on grain
# creation; we point `/` at the same name so existing grains upgrade
# seamlessly (the migrated `/var/dump.json` content is under
# `sheet1`).
export ETHERCALC_DEFAULT_ROOM="sheet1"
# HOME/TMPDIR are grain-writable fallbacks for tooling that expects
# them. The launcher itself uses prebuilt runtime artifacts.
export HOME="/var/home"
export TMPDIR="/var/tmp"
mkdir -p "$HOME" "$TMPDIR" /var/do-storage

RUNTIME_DIR="$APP_DIR/packages/worker/workerd"
WORKERD_BIN="$RUNTIME_DIR/bin/workerd"
LEGACY_MANIFEST="/var/ethercalc-migrate-manifest.txt"
MIGRATE_PID=""
WORKER_PID=""

if [ ! -x "$WORKERD_BIN" ]; then
  echo "launcher: ERROR — workerd binary not found at $WORKERD_BIN" >&2
  echo "           run scripts/build-workerd-bundle.sh before packaging" >&2
  exit 127
fi

stop_workerd_pid() {
  local pid="$1"
  [ -n "$pid" ] || return 0
  kill -TERM "$pid" 2>/dev/null || true
  wait "$pid" 2>/dev/null || true
}

cleanup() {
  stop_workerd_pid "$MIGRATE_PID"
  stop_workerd_pid "$WORKER_PID"
  unset ETHERCALC_MIGRATE_TOKEN
}

trap 'cleanup; exit 0' TERM INT

new_migrate_token() {
  local token
  if [ -r /proc/sys/kernel/random/uuid ]; then
    IFS= read -r token < /proc/sys/kernel/random/uuid
    printf '%s\n' "$token"
    return
  fi
  # Fallback for unusual kernels. This is only used on the loopback-only
  # temporary worker and is unset before the normal worker starts.
  printf 'sandstorm-migrate-%s\n' "$$"
}

wait_for_health() {
  local port="$1"
  for _ in $(seq 1 60); do
    if curl -sf "http://127.0.0.1:${port}/_health" > /dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  return 1
}

write_legacy_manifest() {
  if [ ! -d /var/dump ]; then
    return 0
  fi
  : > "$LEGACY_MANIFEST"
  for f in /var/dump/*.txt; do
    [ -e "$f" ] || continue
    printf '%s\n' "${f##*/}" >> "$LEGACY_MANIFEST"
  done
}

run_legacy_migration_worker() {
  local has_legacy="$1"

  # DiskDirectory does not provide a directory-listing API to the worker,
  # so the launcher writes a fixed manifest of legacy dump/*.txt files
  # before the temporary migration worker starts. Entries are basenames
  # only and are revalidated in worker code before any file read.
  write_legacy_manifest

  echo "launcher: migrating legacy EtherCalc $has_legacy" >&2
  ETHERCALC_MIGRATE_TOKEN="$(new_migrate_token)"
  export ETHERCALC_MIGRATE_TOKEN
  "$WORKERD_BIN" serve \
      "$RUNTIME_DIR/config-migrate.capnp" \
      -ddo="/var/do-storage" \
      -dassets="$APP_DIR/assets" \
      -dlegacy="/var" \
      &
  MIGRATE_PID=$!

  local ok=""
  if wait_for_health 33412 && curl -sf -X POST \
      -H "Authorization: Bearer $ETHERCALC_MIGRATE_TOKEN" \
      http://127.0.0.1:33412/_migrate/from-legacy-disk; then
    ok="1"
  fi

  stop_workerd_pid "$MIGRATE_PID"
  MIGRATE_PID=""
  unset ETHERCALC_MIGRATE_TOKEN

  [ -n "$ok" ]
}

start_normal_worker() {
  unset ETHERCALC_MIGRATE_TOKEN
  "$WORKERD_BIN" serve \
      "$RUNTIME_DIR/config.capnp" \
      -ddo="/var/do-storage" \
      -dassets="$APP_DIR/assets" \
      &
  WORKER_PID=$!
}

# First-load migration from the legacy LiveScript EtherCalc. That
# version ran Node + the db.ls filesystem fallback (no Redis on
# Sandstorm), which wrote either:
#   /var/dump.json   — single-blob JSON of all legacy Redis keys
#   /var/dump/*.txt  — per-key text files (snapshot-* raw, audit-*
#                      with \n/\r/\\ escape encoding)
# We feed whichever shape we find into the worker's token-gated
# /_migrate/from-legacy-disk route. A /var/.migrated sentinel prevents
# re-runs.
if [ ! -f /var/.migrated ]; then
  HAS_LEGACY=""
  if [ -f /var/dump.json ]; then
    HAS_LEGACY="dump.json"
  elif [ -d /var/dump ]; then
    HAS_LEGACY="dump"
  fi

  if [ -n "$HAS_LEGACY" ]; then
    if run_legacy_migration_worker "$HAS_LEGACY"; then
      echo "launcher: legacy migration complete" >&2
      touch /var/.migrated
    else
      echo "launcher: legacy migration FAILED — will retry on next boot" >&2
    fi
  else
    # Fresh grain, no legacy state. Mark sentinel so the /var probes
    # don't fire on every subsequent continueCommand invocation.
    touch /var/.migrated
  fi
fi

# Normal public runtime: no legacy disk binding and no migration token.
start_normal_worker

wait $WORKER_PID
