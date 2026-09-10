#!/usr/bin/env bash
# End-to-end check of the three Run-2 additions. Run ON the lure host after setup.sh.
#   bash verify-features.sh
# Exits non-zero if any check fails.
set -uo pipefail
cd "$(dirname "$0")"

BASE="${BASE:-http://127.0.0.1}"
pass=0; fail=0
ok() { echo "  PASS  $1"; pass=$((pass + 1)); }
no() { echo "  FAIL  $1"; fail=$((fail + 1)); }

echo
echo "== feature 2: ai-agent lures =="
curl -sf -o /dev/null "$BASE/llms.txt" && ok "/llms.txt 200" || no "/llms.txt"
curl -sf -o /dev/null "$BASE/robots.txt" && ok "/robots.txt 200" || no "/robots.txt"
curl -sf -o /dev/null "$BASE/agent-notes" && ok "/agent-notes 200" || no "/agent-notes"
curl -sf -o /dev/null "$BASE/archive/ledger2024" && ok "/archive/<slug> 200" || no "/archive/<slug>"
MARKER=$(grep -o 'fluvia-agent-ack-[a-z0-9]*' fluvi-app/lib/vault.ts | head -1)
curl -sf -o /dev/null -X POST "$BASE/api/v1/agent-ack" \
  -H 'content-type: application/json' -d "{\"marker\":\"$MARKER\"}" \
  && ok "POST /api/v1/agent-ack 200 (marker=$MARKER)" || no "POST /api/v1/agent-ack"

echo "== capture events (evidence/capture.jsonl) =="
sleep 1
for ev in ai_canary_fetch robots_fetch ai_maze_step ai_agent_ack; do
  if grep -q "\"event\":\"$ev\"" evidence/capture.jsonl 2>/dev/null; then ok "event $ev logged"; else no "event $ev missing"; fi
done

echo "== feature 1: fake-c2 sinkhole =="
IP=$(grep -v '^#' sinkhole/targets.txt | grep -v '^$' | head -1 | cut -d: -f1)
BODY=$(curl -s -m 6 "http://$IP/" || true)
if echo "$BODY" | grep -q '"node":"edge-1"'; then ok "sinkholed http://$IP/ answered by the responder"; else no "sinkhole answer for $IP (got: $BODY)"; fi
sleep 1
grep -q "$IP" evidence/fakec2.jsonl 2>/dev/null && ok "evidence/fakec2.jsonl logged $IP" || no "fakec2.jsonl missing the connection"

echo "== feature 3: classification layer =="
docker ps --format '{{.Names}}' | grep -q fluvi-ja3 && ok "suricata container up" || no "suricata container not running"
[ -d classify/eve ] && ok "classify/eve mounted" || no "classify/eve missing"
python3 scripts/score_creds.py --quiet >/dev/null 2>&1 && ok "score_creds.py ran" || no "score_creds.py failed"
python3 scripts/sessionize.py >/dev/null 2>&1 && ok "sessionize.py ran" || no "sessionize.py failed"
[ -f evidence/sessions.jsonl ] && ok "evidence/sessions.jsonl written" || no "sessions.jsonl missing"
[ -f evidence/cred_scores.jsonl ] && ok "evidence/cred_scores.jsonl written" || no "cred_scores.jsonl missing"
if [ -f classify/eve/eve.json ]; then
  python3 classify/extract_ja3.py classify/eve/eve.json >/dev/null 2>&1 && ok "extract_ja3.py ran" || no "extract_ja3.py failed"
else
  echo "  INFO  no eve.json yet — send TLS traffic to this host from another machine, then re-check"
fi

echo
echo "verdict: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
