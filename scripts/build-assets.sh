#!/usr/bin/env bash
# Compatibility wrapper for the TypeScript curated asset builder.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec bun run "$ROOT/scripts/build-assets.ts"
