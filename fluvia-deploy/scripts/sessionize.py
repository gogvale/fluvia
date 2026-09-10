#!/usr/bin/env python3
"""Session/interaction stats — scripted bot vs agentic/human.

Groups the web capture by (ip, user-agent) and describes HOW each session moved, not just
how much: inter-request timing, navigation order, and whether it followed the hidden
links (agent runbook, maze, marker endpoint). This is what tells a tuned crawler apart
from an agent that actually read the pages.

    python3 scripts/sessionize.py [--top N]

Outputs evidence/sessions.jsonl (sorted by agentic_score) and prints a summary.
"""
import json
import os
import statistics
import sys
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CAPTURE = os.path.join(ROOT, "evidence", "capture.jsonl")
OUT = os.path.join(ROOT, "evidence", "sessions.jsonl")

SIGNALS = {
    "ai_canary_fetch": 20,   # fetched /llms.txt or the runbook
    "ai_maze_step": 5,       # stepped into the generated archive
    "ai_agent_ack": 40,      # confirmed the marker -> an agent followed instructions
    "ai_agent_ack_probe": 10,
    "robots_fetch": 5,
    "seed_touch": 15,
    "lure_content_read": 5,
    "withdraw_attempt": 10,
    "admin_action": 10,
}


def parse_ts(ts: str):
    import datetime

    try:
        return datetime.datetime.fromisoformat(ts.replace("Z", "+00:00")).timestamp()
    except Exception:
        return None


def main() -> int:
    top_n = 20
    if "--top" in sys.argv:
        try:
            top_n = int(sys.argv[sys.argv.index("--top") + 1])
        except Exception:
            pass

    if not os.path.exists(CAPTURE):
        print(f"[sessions] no capture at {CAPTURE}")
        return 1

    sessions = defaultdict(list)
    with open(CAPTURE, "r", encoding="utf-8", errors="replace") as fh:
        for line in fh:
            try:
                rec = json.loads(line)
            except Exception:
                continue
            ua = (rec.get("ua") or "").strip()[:80]
            sessions[(rec.get("ip") or "?", ua)].append(rec)

    rows = []
    for (ip, ua), events in sessions.items():
        events.sort(key=lambda r: r.get("ts") or "")
        stamps = [t for t in (parse_ts(r.get("ts", "")) for r in events) if t]
        gaps = [round(b - a, 3) for a, b in zip(stamps, stamps[1:])]
        paths = [r.get("path", "/") for r in events]
        kinds = defaultdict(int)
        for r in events:
            kinds[r.get("event", "?")] += 1

        score = 0
        for ev, weight in SIGNALS.items():
            score += weight * min(kinds.get(ev, 0), 3)
        if len(set(paths)) >= 3 and kinds.get("lure_content_read", 0) >= 3:
            score += 15  # walked the site instead of hammering one endpoint
        med = statistics.median(gaps) if gaps else None
        if med is not None and med < 0.05:
            score -= 20  # sub-50ms cadence = a loop, not a reader
        score = max(0, min(100, score))

        rows.append(
            {
                "ip": ip,
                "ua": ua,
                "events": len(events),
                "first": events[0].get("ts"),
                "last": events[-1].get("ts"),
                "gap_median_s": med,
                "gap_p95_s": round(statistics.quantiles(gaps, n=20)[18], 3) if len(gaps) >= 20 else (max(gaps) if gaps else None),
                "gap_max_s": max(gaps) if gaps else None,
                "distinct_paths": len(set(paths)),
                "path_order": paths[:25],
                "event_kinds": dict(kinds),
                "agentic_score": score,
            }
        )

    rows.sort(key=lambda r: (r["agentic_score"], r["events"]), reverse=True)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        for row in rows:
            fh.write(json.dumps(row, ensure_ascii=False) + "\n")

    print(f"[sessions] {len(rows)} session(s) -> {OUT}")
    for row in rows[:top_n]:
        print(
            f"  score={row['agentic_score']:3d} n={row['events']:4d} "
            f"gap_med={row['gap_median_s']} ip={row['ip']:<16s} {row['ua'][:40]}"
        )
        if row["agentic_score"] >= 30:
            print(f"        order: {' -> '.join(row['path_order'][:10])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
