#!/usr/bin/env bash
# Self-host smoke test (§13 Q5, CLAUDE.md §11.1 item 10).
#
# Builds the standalone workerd image, boots it via docker compose, hits
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
BASE_URL="http://localhost:${PORT}"
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
      echo "[smoke] health OK"
      echo "[smoke] checking GET / serves the landing page (no /null redirect)"
      # Regression guard: workerd hands unset fromEnvironment bindings to
      # the worker as null; a bad ETHERCALC_DEFAULT_ROOM guard once turned
      # every docker-compose GET / into a 302 to /null.
      root_code="$(curl -sS -o /dev/null -w '%{http_code}' "$BASE_URL/")"
      if [ "$root_code" != "200" ]; then
        echo "[smoke] FAIL — expected 200 for /, got $root_code"
        curl -sSi "$BASE_URL/" | head -5
        exit 1
      fi

      echo "[smoke] checking room-index endpoints are gated by default"
      for path in /_rooms /_roomlinks /_roomtimes /_exists/smoke-room; do
        code="$(curl -sS -o /tmp/smoke-gated.txt -w '%{http_code}' "$BASE_URL$path")"
        if [ "$code" != "403" ]; then
          echo "[smoke] FAIL — expected 403 for $path, got $code"
          cat /tmp/smoke-gated.txt
          exit 1
        fi
      done

      echo "[smoke] checking anonymous create/read/delete still works"
      room_path="$(curl -fsS -X POST "$BASE_URL/_")"
      room="${room_path#/}"
      if [ -z "$room" ] || [ "$room" = "$room_path" ]; then
        echo "[smoke] FAIL — POST /_ did not return a /room path: $room_path"
        exit 1
      fi
      curl -fsS -X PUT --data-binary $'version:1.5\n' "$BASE_URL/_/$room" >/dev/null
      curl -fsS "$BASE_URL/_/$room" > /tmp/smoke-room.txt
      if ! grep -q 'version:1.5' /tmp/smoke-room.txt; then
        echo "[smoke] FAIL — room read did not return the written snapshot"
        exit 1
      fi
      curl -fsS -X DELETE "$BASE_URL/_/$room" >/dev/null
      # DELETE returns 201 unconditionally (legacy semantics), so prove
      # the room is actually gone rather than trusting the status code.
      gone_code="$(curl -sS -o /dev/null -w '%{http_code}' "$BASE_URL/_/$room")"
      if [ "$gone_code" != "404" ]; then
        echo "[smoke] FAIL — room still readable after DELETE (got $gone_code)"
        exit 1
      fi

      echo "[smoke] checking ETHERCALC_DISABLE_ROOM_INDEX=0 opt-out boot"
      docker compose down --remove-orphans >/dev/null 2>&1
      ETHERCALC_DISABLE_ROOM_INDEX=0 docker compose up -d
      optout_ok=""
      for j in $(seq 1 "$ATTEMPTS"); do
        if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
          optout_ok=1
          break
        fi
        sleep "$SLEEP_SECONDS"
      done
      if [ -z "$optout_ok" ]; then
        echo "[smoke] FAIL — opt-out boot never became healthy"
        docker compose logs ethercalc | tail -30
        exit 1
      fi
      optout_code="$(curl -sS -o /tmp/smoke-optout.txt -w '%{http_code}' "$BASE_URL/_exists/smoke-room")"
      if [ "$optout_code" != "200" ]; then
        echo "[smoke] FAIL — expected 200 for /_exists with opt-out, got $optout_code"
        cat /tmp/smoke-optout.txt
        exit 1
      fi

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
