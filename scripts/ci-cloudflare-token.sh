#!/usr/bin/env bash
# Emit a masked Cloudflare token as the `cloudflare_api_token` step output.
# Prefer a long-lived dashboard API token (CLOUDFLARE_API_TOKEN secret);
# otherwise exchange a wrangler-login refresh token.
set -euo pipefail

TOKEN="${CLOUDFLARE_API_TOKEN:-}"

if [ -z "$TOKEN" ]; then

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
fi
if [ -z "$TOKEN" ] || [[ "$TOKEN" == *$'\n'* ]] || [[ "$TOKEN" == *$'\r'* ]]; then
  echo "Cloudflare token resolution failed." >&2
  exit 1
fi

printf '::add-mask::%s\n' "$TOKEN"
printf 'cloudflare_api_token=%s\n' "$TOKEN" >>"${GITHUB_OUTPUT:?}"