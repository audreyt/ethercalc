#!/usr/bin/env bash
# Self-host smoke test (§13 Q5, CLAUDE.md §11.1 item 10).
#
# Builds the Miniflare-backed image, boots it via docker compose, hits
# /_health, and tears down. Fails fast on any step. Used both locally
# ("does my change break self-host?") and in CI as the `build:selfhost`
# job.
#
# Prerequisites: docker + docker compose plugin.
# Exit codes: 0 on success; non-zero with a readable message otherwise.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PORT="${SMOKE_PORT:-8000}"
HEALTH_URL="http://localhost:${PORT}/_health"
ATTEMPTS="${SMOKE_ATTEMPTS:-30}"     # 30 × 2s = 60s total poll budget
SLEEP_SECONDS="${SMOKE_SLEEP:-2}"

cleanup() {
  echo "[smoke] tearing down docker compose stack"
  docker compose down --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "[smoke] docker compose build"
docker compose build ethercalc

echo "[smoke] docker compose up -d"
docker compose up -d

echo "[smoke] polling ${HEALTH_URL} (up to $((ATTEMPTS * SLEEP_SECONDS))s)"
for i in $(seq 1 "$ATTEMPTS"); do
  if curl -fsS "$HEALTH_URL" >/tmp/smoke-health.json 2>/dev/null; then
    echo "[smoke] got response on attempt $i"
    cat /tmp/smoke-health.json
    echo
    # Minimal content check: the body must mention status:"ok". We use
    # a dumb grep rather than jq so the smoke script stays dependency-free.
    if grep -q '"status":"ok"' /tmp/smoke-health.json; then
      echo "[smoke] OK"
      exit 0
    else
      echo "[smoke] FAIL — response did not include status:\"ok\""
      exit 1
    fi
  fi
  sleep "$SLEEP_SECONDS"
done

echo "[smoke] FAIL — health endpoint never returned 200 within the poll budget"
echo "[smoke] container logs:"
docker compose logs ethercalc | tail -50
exit 1
