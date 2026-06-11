#!/usr/bin/env bash
# Proxy-recipe smoke test (SH-2 baseline, docs/SELFHOST_HARDENING.md).
#
# Validates deploy/nginx/ethercalc.conf with `nginx -t`, then boots the
# full docker-compose.proxy.yml stack and exercises the app THROUGH the
# proxy: landing page, room-index 403, and a WebSocket upgrade (which
# proves the Upgrade/Connection header forwarding actually works).
#
# Prerequisites: docker + docker compose plugin.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PROXY_PORT="${ETHERCALC_PROXY_HTTP_PORT:-18080}"
export ETHERCALC_PROXY_HTTP_PORT="$PROXY_PORT"
BASE_URL="http://localhost:${PROXY_PORT}"
ATTEMPTS="${SMOKE_ATTEMPTS:-30}"
SLEEP_SECONDS="${SMOKE_SLEEP:-2}"
NGINX_IMAGE="nginx:1.27-alpine"

cleanup() {
  echo "[smoke-proxy] tearing down proxy compose stack"
  docker compose -f docker-compose.proxy.yml down --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "[smoke-proxy] nginx -t syntax check"
# `nginx -t` resolves upstream hostnames, so stub the compose service
# name onto loopback — otherwise it fails with "host not found in
# upstream ethercalc:8000" even when the config is fine.
docker run --rm \
  --add-host ethercalc:127.0.0.1 \
  -v "$ROOT/deploy/nginx/ethercalc.conf:/etc/nginx/conf.d/default.conf:ro" \
  "$NGINX_IMAGE" nginx -t

echo "[smoke-proxy] docker compose -f docker-compose.proxy.yml up -d"
docker compose -f docker-compose.proxy.yml up -d --build

echo "[smoke-proxy] polling ${BASE_URL}/_health through the proxy"
healthy=""
for i in $(seq 1 "$ATTEMPTS"); do
  if curl -fsS "$BASE_URL/_health" >/dev/null 2>&1; then
    healthy=1
    break
  fi
  sleep "$SLEEP_SECONDS"
done
if [ -z "$healthy" ]; then
  echo "[smoke-proxy] FAIL — health never reachable through the proxy"
  docker compose -f docker-compose.proxy.yml logs | tail -50
  exit 1
fi

echo "[smoke-proxy] checking GET / and the room-index gate through the proxy"
root_code="$(curl -sS -o /dev/null -w '%{http_code}' "$BASE_URL/")"
if [ "$root_code" != "200" ]; then
  echo "[smoke-proxy] FAIL — expected 200 for /, got $root_code"
  exit 1
fi
rooms_code="$(curl -sS -o /dev/null -w '%{http_code}' "$BASE_URL/_rooms")"
if [ "$rooms_code" != "403" ]; then
  echo "[smoke-proxy] FAIL — expected 403 for /_rooms, got $rooms_code"
  exit 1
fi

echo "[smoke-proxy] checking WebSocket upgrade forwarding"
# A successful upgrade leaves the socket open, so curl exits 28 when
# --max-time fires — that's expected; judge by the captured headers.
curl -sSi -N \
  --http1.1 \
  -H 'Connection: Upgrade' \
  -H 'Upgrade: websocket' \
  -H 'Sec-WebSocket-Key: c21va2UtcHJveHktdGVzdA==' \
  -H 'Sec-WebSocket-Version: 13' \
  --max-time 5 \
  "$BASE_URL/_ws/smoke-proxy-room?user=smoke" > /tmp/smoke-proxy-ws.txt 2>&1 || true
if ! grep -q '101 Switching Protocols' /tmp/smoke-proxy-ws.txt; then
  echo "[smoke-proxy] FAIL — WS upgrade via proxy did not return 101:"
  head -5 /tmp/smoke-proxy-ws.txt
  exit 1
fi

echo "[smoke-proxy] OK"
