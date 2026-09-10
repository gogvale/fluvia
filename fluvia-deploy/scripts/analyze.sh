#!/usr/bin/env bash
# Run the whole classification layer over everything captured so far.
#   bash scripts/analyze.sh
# Writes evidence/cred_scores.jsonl, evidence/sessions.jsonl, evidence/ja3.jsonl.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== credentials =="
python3 scripts/score_creds.py

echo
echo "== sessions =="
python3 scripts/sessionize.py

echo
echo "== tls fingerprints =="
for eve in /var/log/suricata/eve.json classify/eve/eve.json; do
  if [ -f "$eve" ]; then python3 classify/extract_ja3.py "$eve"; exit 0; fi
done
echo "[ja3] no eve.json yet (suricata not running or no TLS traffic)"
