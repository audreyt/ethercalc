#!/usr/bin/env bash
#
# Docker / Sandstorm / bare-metal entrypoint that launches `workerd
# serve` against the pre-bundled worker under
# /app/packages/worker/workerd/. Handles the two things the
# wrangler-dev path used to: picking the socket bind + locating the
# persistent Durable Object storage.
#
# Env vars (all optional):
#   ETHERCALC_PORT          — listening port (default 8000)
#   ETHERCALC_HOST          — listening interface (default 0.0.0.0)
#   ETHERCALC_DATA_DIR      — persistent root (default /data) — the DO
#                             service writes SQLite files under $DIR/do/
#   ETHERCALC_ASSETS_DIR    — curated asset tree (default /app/assets)
#   ETHERCALC_MIGRATE_TOKEN, ETHERCALC_KEY,
#   ETHERCALC_DISABLE_ROOM_INDEX, ETHERCALC_CORS, …
#     — forwarded to the worker via `fromEnvironment` bindings in
#       packages/worker/workerd/config.capnp. No action needed here.

set -euo pipefail

APP_ROOT="${APP_ROOT:-/app}"
PORT="${ETHERCALC_PORT:-8000}"
HOST="${ETHERCALC_HOST:-0.0.0.0}"
DATA_DIR="${ETHERCALC_DATA_DIR:-/data}"
ASSETS_DIR="${ETHERCALC_ASSETS_DIR:-$APP_ROOT/assets}"
DO_DIR="$DATA_DIR/do"

mkdir -p "$DO_DIR"

# Self-host defaults: hide cross-room discovery unless the operator opts out.
# This does not affect anonymous read/write of known room URLs.
export ETHERCALC_DISABLE_ROOM_INDEX="${ETHERCALC_DISABLE_ROOM_INDEX:-1}"

# Locate the workerd binary. `bun install` drops the platform-matched
# package under node_modules/.bun/@cloudflare+workerd-<arch>-<abi>/.
# `find -executable` is GNU-only; use a portable `test -x` filter so
# this entrypoint works on both macOS and Linux CI runners.
WORKERD_BIN=""
while IFS= read -r candidate; do
  if [[ -x "$candidate" ]]; then
    WORKERD_BIN="$candidate"
    break
  fi
done < <(find "$APP_ROOT/node_modules" -name workerd -type f 2>/dev/null)
if [[ -z "$WORKERD_BIN" ]]; then
  echo "workerd-entrypoint: ERROR — no workerd binary found under node_modules" >&2
  exit 127
fi

# The socket bind is overridden on the command line via `--socket-addr`
# (the socket is named "http" in config.capnp), so nothing is ever
# written to the app dir at startup — which is what lets Helm run the
# container with `readOnlyRootFilesystem: true` (SH-8).
CONFIG_PATH="$APP_ROOT/packages/worker/workerd/config.capnp"

is_loopback_host() {
  case "$1" in
    127.*|::1|localhost)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

echo "workerd-entrypoint: binding $HOST:$PORT  DO=$DO_DIR  assets=$ASSETS_DIR" >&2
if [[ -z "${ETHERCALC_KEY:-}" ]] && ! is_loopback_host "$HOST"; then
  echo "workerd-entrypoint: WARNING: no ETHERCALC_KEY set; anonymous read/write/delete is open. Restrict ingress or set ETHERCALC_KEY." >&2
fi

# Privilege drop (SH-8). The image deliberately has no `USER` directive:
# `docker compose` bind-mounts ./ethercalc-data, which on Linux hosts is
# created root-owned — so the entrypoint starts as root, fixes the data
# dir's ownership (existing deployments upgrade cleanly), then drops to
# the unprivileged `bun` user for the actual server process. Under
# Kubernetes the chart sets runAsNonRoot + fsGroup instead, so this
# branch is skipped and workerd execs directly.
RUN_AS_USER="${ETHERCALC_RUN_AS_USER:-bun}"
if [[ "$(id -u)" == "0" ]] && id "$RUN_AS_USER" >/dev/null 2>&1 \
   && command -v setpriv >/dev/null 2>&1; then
  run_uid="$(id -u "$RUN_AS_USER")"
  run_gid="$(id -g "$RUN_AS_USER")"
  data_uid="$(stat -c %u "$DATA_DIR" 2>/dev/null || stat -f %u "$DATA_DIR")"
  if [[ "$data_uid" != "$run_uid" ]]; then
    echo "workerd-entrypoint: fixing $DATA_DIR ownership for uid $run_uid" >&2
    chown -R "$run_uid:$run_gid" "$DATA_DIR"
  fi
  echo "workerd-entrypoint: dropping privileges to $RUN_AS_USER" >&2
  exec setpriv --reuid="$run_uid" --regid="$run_gid" --init-groups \
      "$WORKERD_BIN" serve \
      "$CONFIG_PATH" \
      --socket-addr "http=$HOST:$PORT" \
      -ddo="$DO_DIR" \
      -dassets="$ASSETS_DIR"
fi

exec "$WORKERD_BIN" serve \
    "$CONFIG_PATH" \
    --socket-addr "http=$HOST:$PORT" \
    -ddo="$DO_DIR" \
    -dassets="$ASSETS_DIR"
