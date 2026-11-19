#!/bin/sh
# Uploads worker.js as "site-studio-experiments" with VERSION set to $1. Pass "first" as $2 on the very first
# upload, which declares the Durable Object class. Needs CLOUDFLARE_ACCOUNT_ID; see ../cloudflare-probes/deploy.sh.
cd "$(dirname "$0")"
API="https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/workers/scripts/site-studio-experiments"
AUTH="Authorization: Bearer ${CLOUDFLARE_API_TOKEN:-proxy-injected}"
MIG=""; [ "$2" = "first" ] && MIG=',"migrations":{"new_tag":"v1","new_sqlite_classes":["Probe"]}'
curl -sS -X PUT "$API" -H "$AUTH" \
  -F "metadata={\"main_module\":\"worker.js\",\"compatibility_date\":\"2026-11-01\",\"bindings\":[{\"type\":\"plain_text\",\"name\":\"VERSION\",\"text\":\"$1\"},{\"type\":\"durable_object_namespace\",\"name\":\"PROBE\",\"class_name\":\"Probe\"}]$MIG};type=application/json" \
  -F 'worker.js=@worker.js;type=application/javascript+module'
