#!/usr/bin/env bash
# Smoke-test the Fluvia app + confirm the capture trail is written.
# Usage:  BASE_URL=http://127.0.0.1:8000 EVIDENCE_DIR=$PWD/evidence ./scripts/verify.sh
set -u

B="${BASE_URL:-http://127.0.0.1:8000}"
EV="${EVIDENCE_DIR:-$PWD/evidence}"
LOG="$EV/capture.jsonl"
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"

mkdir -p "$EV"
rm -f "$LOG"
pass=0; fail=0
ck() { if grep -q "$1" "$LOG" 2>/dev/null; then echo "  OK   $2"; pass=$((pass+1)); else echo "  FAIL $2"; fail=$((fail+1)); fi; }

echo "== A) public pages -> lure_content_read =="
curl -s -o /dev/null -A "$UA" "$B/"
curl -s -o /dev/null -A "$UA" "$B/about"
curl -s -o /dev/null -A "$UA" "$B/pricing"
curl -s -o /dev/null -A "$UA" "$B/api/docs"
ck '"event":"lure_content_read"' "lure_content_read for GET pages"
code=$(curl -s -o /dev/null -w "%{http_code}" -A "$UA" "$B/admin")
if [ "$code" = "200" ]; then echo "  OK   GET /admin served (HTTP 200)"; pass=$((pass+1)); else echo "  FAIL GET /admin returned $code"; fail=$((fail+1)); fi

echo "== B) admin login -> auth_attempt, RAW pass, typo preserved =="
curl -s -X POST "$B/admin/login" -A "$UA" -H 'Content-Type: application/json' \
  -d '{"email":"admin@fluvia.finance","password":"Fluvia202x"}' -o /dev/null
ck '"event":"auth_attempt"' "auth_attempt logged"
ck 'Fluvia202x' "RAW password captured (typo intact)"
ck '"surface":"admin"' "admin surface tagged"

echo "== C) correct creds -> auth ok =="
curl -s -X POST "$B/admin/login" -A "$UA" -H 'Content-Type: application/json' \
  -d '{"email":"founder@fluvia.finance","password":"Fluvia2021!"}' -o /dev/null
ck '"result":"ok"' "founder creds accepted (result ok)"

echo "== D) dashboard -> admin_action =="
curl -s -o /dev/null -A "$UA" "$B/admin/dashboard"
ck '"event":"admin_action"' "admin_action (dashboard)"

echo "== E) api recon -> api_call / balance_query =="
curl -s -o /dev/null -A "$UA" "$B/api/v1/rates"
ck '"event":"api_call"' "api_call (rates)"
curl -s -o /dev/null -A "$UA" "$B/api/v1/balance"
ck '"event":"balance_query"' "balance_query"
curl -s -o /dev/null -A "$UA" "$B/api/debug"
ck '"endpoint":"debug"' "api_call (debug)"

echo "== F) withdraw + sweep flag =="
curl -s -X POST "$B/api/v1/withdraw" -A "$UA" -H 'Content-Type: application/json' \
  -d '{"amount":"all","currency":"USDC","dest_address":"0xAbadIdea00000000000000000000000000000000"}' -o /dev/null
ck '"event":"withdraw_attempt"' "withdraw_attempt"
ck '"sweep":true' "sweep flagged (amount=all)"
ck '0xAbadIdea00000000000000000000000000000000' "dest_address captured"

echo "== G) honeytokens -> seed_touch =="
curl -s -o /dev/null -A "$UA" "$B/wallet.json"
curl -s -o /dev/null -A "$UA" "$B/backup/recovery-phrase.txt"
ck '"event":"seed_touch"' "seed_touch (wallet.json + recovery-phrase.txt)"

echo "== H) webhook + api creds =="
curl -s -X POST "$B/webhooks" -A "$UA" -H 'Content-Type: application/json' \
  -d '{"event":"address_activity"}' -o /dev/null
ck '"event":"webhook_attempt"' "webhook_attempt"
curl -s "$B/api/v1/keys" -A "$UA" -H "Authorization: Bearer fl_live_9xX7fakefakefakefakefakefakef" -o /dev/null
ck '"surface":"api"' "api creds captured (auth_attempt, surface api)"

echo
echo "== result: $pass ok, $fail failed =="
lines=$(wc -l < "$LOG" 2>/dev/null || echo 0)
echo "capture file: $LOG ($lines lines)"
[ "$fail" -eq 0 ]
