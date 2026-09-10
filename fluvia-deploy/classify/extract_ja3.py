#!/usr/bin/env python3
"""Extract TLS client fingerprints (JA3/JA4) from Suricata's eve.json.

Turns "64% of our traffic is xmlrpc from a handful of /24s" into "these N distinct TLS
clients produced it" — the actor-clustering layer for the web side (the SSH side already
has it via key fingerprints).

    python3 classify/extract_ja3.py [eve.json] [out.jsonl]

Reads tls events, writes one compact record per connection, then prints a summary of the
top fingerprints. Safe to re-run; output is rewritten each time.
"""
import json
import os
import sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
EVE = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("EVE", "/var/log/suricata/eve.json")
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, "..", "evidence", "ja3.jsonl")


def jhash(value):
    """suricata returns ja3/ja3s as {hash, string} in 7.x and as a bare string in 6.x."""
    if isinstance(value, dict):
        return value.get("hash")
    return value


def main() -> int:
    if not os.path.exists(EVE):
        print(f"[ja3] no eve.json at {EVE} (is the suricata service up?)")
        return 1

    seen = 0
    fps = Counter()
    out_rows = []
    with open(EVE, "r", encoding="utf-8", errors="replace") as fh:
        for line in fh:
            line = line.strip()
            if not line or '"event_type":"tls"' not in line.replace(" ", ""):
                continue
            try:
                ev = json.loads(line)
            except Exception:
                continue
            if ev.get("event_type") != "tls":
                continue
            tls = ev.get("tls", {}) or {}
            rec = {
                "ts": ev.get("timestamp"),
                "src": f"{ev.get('src_ip')}:{ev.get('src_port')}",
                "dst": f"{ev.get('dest_ip')}:{ev.get('dest_port')}",
                "sni": tls.get("sni"),
                "version": tls.get("version"),
                "ja3": jhash(tls.get("ja3")),
                "ja3s": jhash(tls.get("ja3s")),
                "ja4": tls.get("ja4"),
            }
            if not (rec["ja3"] or rec["ja4"]):
                continue
            seen += 1
            fps[(rec["ja3"], rec["ja4"])] += 1
            out_rows.append(rec)

    os.makedirs(os.path.dirname(os.path.abspath(OUT)), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        for rec in out_rows:
            fh.write(json.dumps(rec, ensure_ascii=False) + "\n")

    print(f"[ja3] {seen} tls client(s) fingerprinted -> {os.path.abspath(OUT)}")
    for (ja3, ja4), n in fps.most_common(10):
        print(f"  {n:6d}  ja3={ja3}  ja4={ja4}")
    if not seen:
        print("  (no ja3/ja4 fields — check the suricata version exposes them)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
