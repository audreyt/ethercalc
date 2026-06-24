#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$REPO_ROOT/packages/worker/workerd"

copy_workerd_binary() {
  local workerd_bin

  mkdir -p "$OUT_DIR/bin"
  rm -f "$OUT_DIR/bin/ethercalc-migrate"

  workerd_bin="$REPO_ROOT/node_modules/.bun/node_modules/workerd/bin/workerd"
  if [ ! -x "$workerd_bin" ]; then
    workerd_bin="$REPO_ROOT/node_modules/.bin/workerd"
  fi
  if [ ! -x "$workerd_bin" ]; then
    echo "build.sh: ERROR: workerd binary not found under node_modules" >&2
    exit 127
  fi

  cp "$workerd_bin" "$OUT_DIR/bin/workerd"
  chmod +x "$OUT_DIR/bin/workerd"
}

build_migration_worker_bundle() {
  bun build "$REPO_ROOT/packages/worker/src/sandstorm-legacy-migrate.ts" \
    --bundle \
    --format=esm \
    --outfile="$OUT_DIR/worker/migrate.js"
}

cd "$REPO_ROOT"

bun install
bun run build:assets
bash scripts/build-workerd-bundle.sh
build_migration_worker_bundle
copy_workerd_binary
