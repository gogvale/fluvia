#!/usr/bin/env python3
"""Harness for the AI-era username lane in fluvia-watch.py (change of 2026-09-27).

Verifies the 2026-09-27 addition (`openclaw`, `clawdbot`, `cursor`, `hummingbot`
to AI_USERS / AI_USER_PREFIX) and, just as important, that the older names and
the crypto lane do not regress.

Run: python3 test-ai-users.py
Exit code 0 = all cases green.
"""
import importlib.util
import os
import sys

_here = os.path.dirname(os.path.abspath(__file__))
CANDIDATES = [
    os.path.join(_here, "fluvia-watch.py"),                      # inside the repo
    os.path.expanduser("~/.hermes/scripts/fluvia-watch.py"),     # as deployed
]
TARGET = next((p for p in CANDIDATES if os.path.exists(p)), None)
if not TARGET:
    sys.exit("fluvia-watch.py not found next to this harness nor in ~/.hermes/scripts")

spec = importlib.util.spec_from_file_location("fw", TARGET)
fw = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fw)

AI = "nombre de la era IA"
CRYPTO = "contexto crypto"
ok = fail = 0


def check(label, got, want):
    global ok, fail
    if got == want:
        ok += 1
        print(f"  ok    {label:28} -> {got!r}")
    else:
        fail += 1
        print(f"  FAIL  {label:28} -> {got!r} (want {want!r})")


print(f"target: {TARGET}\n")
print("interesting_user() — new names")
check("openclaw", fw.interesting_user("openclaw"), AI)
check("openclaw_7", fw.interesting_user("openclaw_7"), AI)
check("clawdbot", fw.interesting_user("clawdbot"), AI)
check("clawdbot-3", fw.interesting_user("clawdbot-3"), AI)
check("cursor", fw.interesting_user("cursor"), AI)
check("cursor1", fw.interesting_user("cursor1"), AI)
check("hummingbot", fw.interesting_user("hummingbot"), AI)
check("HummingBot (case)", fw.interesting_user("HummingBot"), AI)

print("interesting_user() — old names must not regress")
check("claude", fw.interesting_user("claude"), AI)
check("claude-codex", fw.interesting_user("claude-codex"), AI)
check("bot", fw.interesting_user("bot"), AI)
check("ai", fw.interesting_user("ai"), AI)
check("codex", fw.interesting_user("codex"), AI)
check("admin (plain)", fw.interesting_user("admin"), "")
check("root (plain)", fw.interesting_user("root"), "")
check("(empty)", fw.interesting_user(""), "")

print("crypto lane untouched")
check("eth", fw.interesting_user("eth"), CRYPTO)
check("eth-node-3", fw.interesting_user("eth-node-3"), CRYPTO)
check("ethereum", fw.interesting_user("ethereum"), CRYPTO)
check("ethan (must NOT be crypto)", fw.interesting_user("ethan"), "")

print("distinctive_name() — the campaign-IP gate")
check("openclaw", fw.distinctive_name("openclaw"), False)
check("clawdbot", fw.distinctive_name("clawdbot"), False)
check("hummingbot", fw.distinctive_name("hummingbot"), False)
check("openclaw_7", fw.distinctive_name("openclaw_7"), True)
check("cursor1", fw.distinctive_name("cursor1"), True)
check("crawler-bot (separator)", fw.distinctive_name("crawler-bot"), True)

print("campaign branch (>5 attempts) — bare name silenced, chosen name survives")


def campaign_line(user):
    """Mirror of the branch in main(): the suffix the line would carry."""
    why = fw.interesting_user(user)
    if why and not fw.distinctive_name(user):
        return ""            # -> suppressed.ai_name_in_wordlist
    return why


check("openclaw (campaign)", campaign_line("openclaw"), "")
check("clawdbot (campaign)", campaign_line("clawdbot"), "")
check("openclaw_7 (campaign)", campaign_line("openclaw_7"), AI)
check("claude-codex (campaign)", campaign_line("claude-codex"), AI)
check("root (campaign)", campaign_line("root"), "")

print("known remaining gap (unchanged by this patch)")
check("gpt4all", fw.interesting_user("gpt4all"), "")

print(f"\n{ok} ok, {fail} fail")
sys.exit(1 if fail else 0)
