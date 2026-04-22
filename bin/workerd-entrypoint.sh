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
#   ETHERCALC_MIGRATE_TOKEN, ETHERCALC_KEY, ETHERCALC_CORS, …
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

# Rewrite the socket address if it differs from config.capnp's baked-in
# `*:33411`. workerd's capnp format doesn't support env-var expansion,
# and cross-config imports can't inherit sibling constants, so the
# simplest portable tactic is: copy the config to a tmp path, sed the
# address line, serve from the tmp copy. Cheap — the config is <100
# lines and we only do this once at startup.
CONFIG_SRC="$APP_ROOT/packages/worker/workerd/config.capnp"
CONFIG_DIR="$APP_ROOT/packages/worker/workerd"
if [[ "$PORT" != "33411" || "$HOST" != "0.0.0.0" ]]; then
  # The config uses `embed "worker/index.js"` which is resolved relative
  # to the config file's directory, so we must write the modified copy
  # alongside the original — not into /tmp.
  CONFIG_PATH="$CONFIG_DIR/config.runtime.capnp"
  # Socket address in config.capnp looks like: `address = "*:33411",`
  # Swap the whole `"…"` literal for `"$HOST:$PORT"`.
  sed -E "s|address = \"[^\"]*\"|address = \"$HOST:$PORT\"|" "$CONFIG_SRC" > "$CONFIG_PATH"
else
  CONFIG_PATH="$CONFIG_SRC"
fi

echo "workerd-entrypoint: binding $HOST:$PORT  DO=$DO_DIR  assets=$ASSETS_DIR" >&2

exec "$WORKERD_BIN" serve \
    "$CONFIG_PATH" \
    -ddo="$DO_DIR" \
    -dassets="$ASSETS_DIR"
