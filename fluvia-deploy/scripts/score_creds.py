#!/usr/bin/env python3
"""Credential scorer — separates content-aware guesses from wordlist sprays.

Reads every credential attempt we captured (web: evidence/capture.jsonl auth_attempt
events; ssh: cowrie/log/cowrie.json*) and labels each one:

  context_aware  the password carries a token from the lure's own story (brand, founder,
                 year, domain, crypto terms) AND is not part of a mass spray
  commodity      a wordlist/default password, or the same password burned across many
                 usernames
  unknown        neither

This is the instrument for the "did anyone actually READ the site" question: a
context_aware hit from an unknown IP is worth more than a million 123456s.

    python3 scripts/score_creds.py [--quiet]

Outputs evidence/cred_scores.jsonl and prints a summary.
"""
import glob
import json
import math
import os
import sys
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CAPTURE = os.path.join(ROOT, "evidence", "capture.jsonl")
OUT = os.path.join(ROOT, "evidence", "cred_scores.jsonl")
COWRIE_GLOBS = [
    os.path.join(ROOT, "cowrie", "log", "cowrie.json*"),
    "/home/cowrie/cowrie/var/log/cowrie/cowrie.json*",
]

# tokens that only exist because someone read the lure
CONTEXT_TOKENS = {
    "brand": ["fluvia", "cottonsky", "cotton", "sky"],
    "founder": ["arevalo", "diego", "elena", "marsh"],
    "year": ["2021", "2019", "2024", "2025"],
    "domain": ["fluvia.finance", "cottonsky.shop"],
    "crypto": ["monero", "xmr", "usdc", "usdt", "stable", "wallet", "seed", "crypto"],
}

DEFAULT_PASSWORDS = {
    "123456", "12345678", "123456789", "12345", "1234", "123", "1", "111111", "password",
    "admin", "root", "qwerty", "abc123", "raspberry", "ubuntu", "guest", "test", "letmein",
    "monero", "pass", "1111", "0000",
}


def entropy_bits(pw: str) -> float:
    if not pw:
        return 0.0
    counts = Counter(pw)
    n = len(pw)
    return round(-sum((c / n) * math.log2(c / n) for c in counts.values()) * n, 2)


def context_hits(pw: str) -> list:
    low = pw.lower()
    return [f"{kind}:{tok}" for kind, toks in CONTEXT_TOKENS.items() for tok in toks if tok in low]


def looks_like_spray(pw: str, pw_usernames: dict) -> bool:
    if pw.lower() in DEFAULT_PASSWORDS:
        return True
    if len(pw) >= 8:
        return False
    # short password reused across several usernames = dictionary run
    return len(pw_usernames.get(pw, ())) >= 3


def collect():
    attempts = []

    if os.path.exists(CAPTURE):
        with open(CAPTURE, "r", encoding="utf-8", errors="replace") as fh:
            for line in fh:
                try:
                    rec = json.loads(line)
                except Exception:
                    continue
                if rec.get("event") != "auth_attempt":
                    continue
                attempts.append(
                    {
                        "ts": rec.get("ts"),
                        "surface": "web:" + str(rec.get("surface", "?")),
                        "ip": rec.get("ip"),
                        "user": str(rec.get("user", "")),
                        "pass": str(rec.get("password", "")),
                    }
                )

    for pattern in COWRIE_GLOBS:
        for path in glob.glob(pattern):
            with open(path, "r", encoding="utf-8", errors="replace") as fh:
                for line in fh:
                    try:
                        rec = json.loads(line)
                    except Exception:
                        continue
                    if rec.get("eventid") not in ("cowrie.login.failed", "cowrie.login.success"):
                        continue
                    attempts.append(
                        {
                            "ts": rec.get("timestamp"),
                            "surface": "ssh",
                            "ip": rec.get("src_ip"),
                            "user": str(rec.get("username", "")),
                            "pass": str(rec.get("password", "")),
                        }
                    )
    return attempts


def main() -> int:
    quiet = "--quiet" in sys.argv
    attempts = collect()
    pw_usernames = defaultdict(set)
    for a in attempts:
        pw_usernames[a["pass"]].add(a["user"])

    verdicts = Counter()
    context_rows = []
    rows = []
    for a in attempts:
        hits = context_hits(a["pass"])
        spray = looks_like_spray(a["pass"], pw_usernames)
        if hits and not spray:
            verdict = "context_aware"
        elif spray:
            verdict = "commodity"
        else:
            verdict = "unknown"
        verdicts[verdict] += 1
        row = {
            "ts": a["ts"],
            "surface": a["surface"],
            "ip": a["ip"],
            "user": a["user"],
            "password": a["pass"],
            "entropy_bits": entropy_bits(a["pass"]),
            "context_hits": hits,
            "verdict": verdict,
        }
        rows.append(row)
        if verdict == "context_aware":
            context_rows.append(row)

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        for row in rows:
            fh.write(json.dumps(row, ensure_ascii=False) + "\n")

    print(f"[creds] {len(rows)} attempt(s) scored -> {OUT}")
    for verdict, n in verdicts.most_common():
        print(f"  {verdict:15s} {n}")
    if context_rows:
        print("  CONTEXT-AWARE (investigate these):")
        for row in context_rows[:20]:
            print(f"    {row['ts']} {row['ip']:>16s} {row['user']} / {row['password']}  {row['context_hits']}")
    else:
        print("  CONTEXT-AWARE: none (nobody derived a password from the lure text)")

    if not quiet:
        top = Counter((r["password"] for r in rows if r["verdict"] == "commodity")).most_common(10)
        if top:
            print("  top commodity passwords:", ", ".join(f"{p}×{n}" for p, n in top))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
