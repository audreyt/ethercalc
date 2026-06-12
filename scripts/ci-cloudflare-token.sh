#!/usr/bin/env bash
# Emit CLOUDFLARE_API_TOKEN into GITHUB_ENV for wrangler deploy steps.
# Prefer a long-lived dashboard API token (CLOUDFLARE_API_TOKEN secret).
# Otherwise exchange a wrangler-login refresh token (CLOUDFLARE_OAUTH_REFRESH_TOKEN).
set -euo pipefail

if [ -n "${CLOUDFLARE_API_TOKEN:-}" ]; then
  echo "CLOUDFLARE_API_TOKEN=${CLOUDFLARE_API_TOKEN}" >>"${GITHUB_ENV:?}"
  exit 0
fi

if [ -z "${CLOUDFLARE_OAUTH_REFRESH_TOKEN:-}" ]; then
  echo "Set CLOUDFLARE_API_TOKEN or CLOUDFLARE_OAUTH_REFRESH_TOKEN repository secret." >&2
  exit 1
fi

RESP="$(
  curl -fsS -X POST "https://dash.cloudflare.com/oauth2/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    --data-urlencode "grant_type=refresh_token" \
    --data-urlencode "refresh_token=${CLOUDFLARE_OAUTH_REFRESH_TOKEN}" \
    --data-urlencode "client_id=54d11594-84e4-41aa-b438-e81b8fa78ee7"
)"

TOKEN="$(printf '%s' "$RESP" | python3 -c "import json,sys; print(json.load(sys.stdin).get('access_token',''))")"
if [ -z "$TOKEN" ]; then
  echo "OAuth refresh failed: $RESP" >&2
  exit 1
fi

echo "CLOUDFLARE_API_TOKEN=${TOKEN}" >>"${GITHUB_ENV:?}"