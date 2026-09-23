#!/usr/bin/env bash
# Fluvia classification refresh — the layer that was NEVER scheduled (frozen since
# 2026-09-15 06:07, the deploy-verification run). Driven by fluvia-analyze.timer.
#
#   score_creds.py  -> evidence/cred_scores.jsonl   (rewritten: full cowrie scan)
#   sessionize.py   -> evidence/sessions.jsonl      (rewritten: agentic_score per session)
#   extract_ja3.py  -> evidence/ja3.jsonl           (merged+deduped, cumulative)
#
# Costs ~10 s total on this 1-vCPU box (eve.json is ~1 GB and scanned in ~5 s).
set -euo pipefail
cd /root/fluvia-deploy
EVID=evidence
EVE=classify/eve/eve.json

echo "[$(date -u +%FT%TZ)] analyze: start"
python3 scripts/score_creds.py >/dev/null
python3 scripts/sessionize.py >/dev/null

# ja3 output is rewritten per run, so accumulate: merge the fresh extraction into the
# existing file, dedupe on (ts, src, dst, ja3), keep the newest 60k rows.
if [ -f "$EVE" ]; then
  TMP="$(mktemp /tmp/ja3.XXXXXX.jsonl)"
  python3 classify/extract_ja3.py "$EVE" "$TMP" >/dev/null
  python3 - "$EVID/ja3.jsonl" "$TMP" <<'PY'
import json, os, sys
out, new = sys.argv[1], sys.argv[2]

def rows(path):
    if not os.path.exists(path):
        return
    with open(path, encoding="utf-8", errors="replace") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            try:
                yield json.loads(line)
            except Exception:
                continue

seen, order = {}, []
for path in (out, new):
    for rec in rows(path):
        key = (rec.get("ts"), rec.get("src"), rec.get("dst"), rec.get("ja3"))
        if key not in seen:
            seen[key] = rec
            order.append(key)
order.sort(key=lambda k: seen[k].get("ts") or "")
if len(order) > 60000:
    order = order[-60000:]
tmp = out + ".tmp"
with open(tmp, "w", encoding="utf-8") as fh:
    for key in order:
        fh.write(json.dumps(seen[key], ensure_ascii=False) + "\n")
os.replace(tmp, out)
print(f"[ja3] {len(order)} cumulative record(s)")
PY
  rm -f "$TMP"
fi

echo "[$(date -u +%FT%TZ)] analyze: done — sessions=$(wc -l < "$EVID/sessions.jsonl") creds=$(wc -l < "$EVID/cred_scores.jsonl") ja3=$(wc -l < "$EVID/ja3.jsonl")"
