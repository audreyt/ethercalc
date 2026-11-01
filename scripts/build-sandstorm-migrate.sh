#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
output="$repo_root/sandstorm-migrate.mjs"

cd "$repo_root"
bun build scripts/sandstorm-migrate.ts --target=node --outfile="$output"
test -s "$output"
