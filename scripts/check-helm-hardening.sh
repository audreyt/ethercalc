#!/usr/bin/env bash
# Assert the Helm chart keeps the self-host hardening defaults visible in the
# rendered manifests. Kept dependency-light for CI: helm + grep only.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

tmp_default="$(mktemp)"
tmp_optout="$(mktemp)"
tmp_ingress="$(mktemp)"
cleanup() {
  rm -f "$tmp_default" "$tmp_optout" "$tmp_ingress"
}
trap cleanup EXIT

helm template ci ./helm > "$tmp_default"
if ! grep -A1 'name: ETHERCALC_DISABLE_ROOM_INDEX' "$tmp_default" | grep -q 'value: "1"'; then
  echo "[helm-hardening] FAIL: default render does not set ETHERCALC_DISABLE_ROOM_INDEX=1" >&2
  exit 1
fi

helm template ci ./helm --set config.disableRoomIndex=false > "$tmp_optout"
if ! grep -A1 'name: ETHERCALC_DISABLE_ROOM_INDEX' "$tmp_optout" | grep -q 'value: "0"'; then
  echo "[helm-hardening] FAIL: opt-out render does not set ETHERCALC_DISABLE_ROOM_INDEX=0" >&2
  exit 1
fi

helm install ci ./helm --dry-run=client --debug \
  --set ingress.enabled=true \
  --set ingress.hosts[0].host=ci.example.com \
  --set ingress.hosts[0].paths[0].path=/ \
  --set ingress.hosts[0].paths[0].pathType=Prefix > "$tmp_ingress" 2>&1
if ! grep -q 'SECURITY: ingress is enabled and no ETHERCALC_KEY is configured' "$tmp_ingress"; then
  echo "[helm-hardening] FAIL: keyless ingress warning missing from NOTES" >&2
  exit 1
fi

echo "[helm-hardening] OK"
