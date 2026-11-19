#!/bin/sh
# Uploads worker.js as the Worker "site-studio-experiments" and turns on its workers.dev address.
# Needs CLOUDFLARE_ACCOUNT_ID, and a token for api.cloudflare.com in CLOUDFLARE_API_TOKEN
# (in the cloud session the network proxy supplies the token, so any placeholder value works).
cd "$(dirname "$0")"
API="https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/workers/scripts/site-studio-experiments"
AUTH="Authorization: Bearer ${CLOUDFLARE_API_TOKEN:-proxy-injected}"
curl -sS -X PUT "$API" -H "$AUTH" \
  -F 'metadata={"main_module":"worker.js","compatibility_date":"2026-11-01","compatibility_flags":["nodejs_compat"],"usage_model":"standard"};type=application/json' \
  -F 'worker.js=@worker.js;type=application/javascript+module' | head -c 600; echo
curl -sS -X POST "$API/subdomain" -H "$AUTH" -H 'content-type: application/json' -d '{"enabled":true,"previews_enabled":false}' | head -c 300; echo
