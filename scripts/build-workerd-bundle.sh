#!/usr/bin/env bash
#
# Produce a self-contained workerd deployable tree at
# packages/worker/workerd/. This is the artifact that Sandstorm's
# run_grain.sh launches via `workerd serve config.capnp`, bypassing
# wrangler dev's Cloudflare-metadata fetch (which fails in
# network-sandboxed grains).
#
# Output layout after this script runs:
#
#   packages/worker/workerd/
#     config.capnp              # static; checked in
#     worker/
#       index.js                # bundled worker (produced here)
#     assets/                   # symlink to ../../../assets — so
#                               # build:assets rebuilds land in place
#     do-storage/               # left empty; workerd creates per-DO
#                               # SQLite files on first boot
#
# The Sandstorm packager (`spk pack`) bundles everything under
# `packages/worker/workerd/` into the .spk; run_grain.sh points workerd
# at the path.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORKER_DIR="$REPO_ROOT/packages/worker"
OUT_DIR="$WORKER_DIR/workerd"

echo "==> Building worker bundle to $OUT_DIR/worker/"
mkdir -p "$OUT_DIR/worker" "$OUT_DIR/do-storage"

# Ensure assets/ has been built. build-assets.sh is idempotent; running
# again just re-copies. If the user forgot, this catches it.
if [ ! -d "$REPO_ROOT/assets" ] || [ -z "$(ls -A "$REPO_ROOT/assets" 2>/dev/null)" ]; then
  echo "==> assets/ empty; running scripts/build-assets.sh first"
  bash "$REPO_ROOT/scripts/build-assets.sh"
fi

# Symlink assets/ into the workerd tree so live rebuilds propagate.
# `spk pack` dereferences symlinks, so the .spk gets the real files.
if [ ! -L "$OUT_DIR/assets" ] && [ ! -e "$OUT_DIR/assets" ]; then
  ln -s "$REPO_ROOT/assets" "$OUT_DIR/assets"
fi

# Bundle the worker. `--dry-run` skips the CF deploy, `--outdir` writes
# the bundled index.js locally. The output is a standalone ES module
# with all imports inlined — no node_modules lookup at runtime.
cd "$WORKER_DIR"
echo "==> Running wrangler deploy --dry-run --outdir=$OUT_DIR/worker/"
bunx wrangler deploy --dry-run --outdir="$OUT_DIR/worker"

# wrangler writes index.js + a sourcemap + README.md. Drop the README
# (wrangler's auto-generated blurb); keep the sourcemap gated on DEBUG.
rm -f "$OUT_DIR/worker/README.md"
if [ -z "${DEBUG_WORKERD:-}" ]; then
  rm -f "$OUT_DIR/worker/index.js.map"
fi

echo "==> Bundle ready:"
ls -la "$OUT_DIR/worker/"
echo
echo "==> To launch:"
echo "    cd $OUT_DIR"
echo "    workerd serve config.capnp"
