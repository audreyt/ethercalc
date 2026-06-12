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
# Each Sandstorm grain IS a single spreadsheet — `/` should land in
# the live sheet, not the ethercalc.net "create new" landing. The
# legacy LiveScript EtherCalc initialized a `sheet1` room on grain
# creation; we point `/` at the same name so existing grains upgrade
# seamlessly (the migrated `/var/dump.json` content is under
# `sheet1`).
export ETHERCALC_DEFAULT_ROOM="sheet1"
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

# Boot workerd in the background, pointing the DO disk service at /var
# and the assets service at the symlinked assets/ tree (the bundle
# layout script-build-workerd-bundle.sh produces).
"$WORKERD_BIN" serve \
    "$APP_DIR/packages/worker/workerd/config.capnp" \
    -ddo="/var/do-storage" \
    -dassets="$APP_DIR/assets" \
    &
WORKER_PID=$!

# Forward SIGTERM/SIGINT so DO storage flushes before the grain tears
# down. workerd traps SIGTERM cleanly and writes pending .sqlite pages.
trap 'kill -TERM "$WORKER_PID" 2>/dev/null; wait "$WORKER_PID" 2>/dev/null; exit 0' TERM INT

# Wait for /_health before proceeding with migration. workerd normally
# responds in <1s; we give it up to 60s for a cold grain.
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
