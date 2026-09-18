#!/usr/bin/env python3
"""Fluvia honeypot — read-only summary of *significant* events.

Runs ON the honeypot (fluvia-rebuild). Invoked by the Hermes-side watcher:

    watch-summary.py <since-iso8601>

Emits one JSON object on stdout. Nothing is written to disk, nothing is
started or stopped: this script only reads the capture files and asks
podman/openssl for health. See vault Hermes/Fluvia-Honeypot.md.

Significant = C2 sinkhole hits, SSH credential attempts / commands, AI-agent
lure touches (/llms.txt, /agent-notes, /archive, /api/v1/agent-ack), any AI
crawler touching the lure (near miss: robots.txt / sitemap.xml), and
crypto-value-surface probes. Commodity web scanning noise is deliberately NOT
reported (it is still counted, in `counts`).
"""
import collections
import datetime
import json
import os
import subprocess
import sys

BASE = os.environ.get("FLUVIA_BASE", "/root/fluvia-deploy")

# Our own traffic must never be reported as an attacker. 161.35.0.4 is the Hermes
# box; 68.183.29.202 is the lure's own public IP (a curl from the box arrives
# through Caddy with that forwarded-for).
OURS_IP = {"161.35.0.4", "68.183.29.202"}
OURS_PREFIX = ("10.", "127.", "172.16.", "172.17.", "172.18.", "192.168.")

AGENT_PREFIX = ("/llms.txt", "/agent-notes", "/archive", "/api/v1/agent-ack")
CRYPTO_PREFIX = ("/api/v1/balance", "/api/v1/withdraw", "/webhooks",
                 "/api/v1/export-seed")
EXPECTED_CONTAINERS = ["fluvi-caddy", "fluvi-web", "fluvi-cowrie",
                       "fluvi-fakec2", "fluvi-ja3"]

# AI crawlers / assistants identifiable by user-agent. These are the *near misses*:
# an AI client touched the lure (robots.txt, sitemap.xml, a page) without reaching
# the agent canaries. Added 2026-09-18 after finding ClaudeBot fetching
# /robots.txt + /sitemap.xml sixty-four times (the sitemap 404'd, so the crawl
# stopped there and /llms.txt was never reached). Search-engine crawlers
# (Applebot, PetalBot, Googlebot) and dataset scrapers (Diffbot, TimpiBot) are
# deliberately NOT listed — they are commodity traffic, not AI interactions.
AI_CRAWLER_UA = ("gptbot", "oai-searchbot", "chatgpt-user", "claudebot", "claude-web",
                 "claude-user", "anthropic", "perplexity", "ccbot", "bytespider",
                 "google-extended", "meta-externalagent", "youbot", "mistralai",
                 "cohere", "duckassistbot", "llmstxt", "llms.txt",
                 "ai-agent", "aiagent", "agentic")


def is_ai_crawler(ua):
    ua = (ua or "").lower()
    return any(tag in ua for tag in AI_CRAWLER_UA)


def ours(ip):
    ip = ip or ""
    return ip in OURS_IP or ip.startswith(OURS_PREFIX)


def load(path):
    rows = []
    if not os.path.exists(path):
        return rows
    with open(path, errors="replace") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            try:
                rows.append(json.loads(line))
            except ValueError:
                pass
    return rows


def when(row):
    return row.get("ts") or row.get("timestamp") or ""


def sh(cmd, timeout=15):
    try:
        out = subprocess.run(cmd, shell=True, capture_output=True, text=True,
                             timeout=timeout)
        return out.stdout.strip()
    except Exception:
        return ""


def containers():
    raw = sh("podman ps --format '{{.Names}}' 2>/dev/null")
    up = [x for x in raw.splitlines() if x.strip()]
    return {"up": up, "missing": [c for c in EXPECTED_CONTAINERS if c not in up]}


def cert_days_left():
    cmd = ("openssl s_client -connect 127.0.0.1:443 -servername fluvia.finance "
           "< /dev/null 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null")
    out = sh(cmd, timeout=20)
    if "=" not in out:
        return None
    try:
        stamp = out.split("=", 1)[1].strip()
        end = datetime.datetime.strptime(stamp, "%b %d %H:%M:%S %Y %Z")
        return round((end - datetime.datetime.utcnow()).total_seconds() / 86400, 1)
    except Exception:
        return None


def main():
    since = sys.argv[1] if len(sys.argv) > 1 else "1970-01-01T00:00:00Z"

    capture = load(f"{BASE}/evidence/capture.jsonl")
    fakec2 = load(f"{BASE}/evidence/fakec2.jsonl")
    cowrie = load(f"{BASE}/cowrie/log/cowrie.json")
    creds = load(f"{BASE}/evidence/cred_scores.jsonl")

    all_rows = capture + fakec2 + cowrie
    stamps = [when(r) for r in all_rows if when(r)]
    newest = max(stamps) if stamps else ""
    oldest = min(stamps) if stamps else ""

    def fresh(row):
        return when(row) > since

    c2 = [r for r in fakec2 if fresh(r) and not ours(r.get("src_ip"))]

    agent, crypto, crawlers = [], [], []
    for r in capture:
        if ours(r.get("ip")) or not fresh(r):
            continue
        path = r.get("path") or ""
        if path.startswith(AGENT_PREFIX):
            agent.append(r)
        elif path.startswith(CRYPTO_PREFIX):
            crypto.append(r)
        if is_ai_crawler(r.get("ua")):
            crawlers.append(r)

    logins = [r for r in cowrie
              if fresh(r) and not ours(r.get("src_ip"))
              and r.get("eventid") in ("cowrie.login.success", "cowrie.login.failed")]
    commands = [r for r in cowrie
                if fresh(r) and not ours(r.get("src_ip"))
                and r.get("eventid") == "cowrie.command.input"]
    new_cred = [r for r in creds
                if (r.get("ts") or "") > since and not ours(r.get("ip"))]

    now = datetime.datetime.utcnow()

    def connects(minutes):
        cut = (now - datetime.timedelta(minutes=minutes)).strftime(
            "%Y-%m-%dT%H:%M:%S")
        return [r for r in cowrie
                if r.get("eventid") == "cowrie.session.connect"
                and when(r)[:19] > cut and not ours(r.get("src_ip"))]

    w1h, w15m = connects(60), connects(15)
    wave = dict(collections.Counter(r.get("src_ip") for r in w1h).most_common(5))

    attackers = set(r.get("src_ip") for r in c2)
    attackers |= set(r.get("src_ip") for r in w1h)
    attackers |= set(r.get("ip") for r in agent + crypto + crawlers + logins + new_cred)
    attackers.discard(None)

    print(json.dumps({
        "since": since,
        "newest": newest,
        "oldest": oldest,
        "c2": [{"ts": when(r), "ip": r.get("src_ip"),
                "port": r.get("sink_port"),
                "preview": (r.get("preview") or "")[:120]} for r in c2],
        "ssh_logins": [{"ts": when(r), "ip": r.get("src_ip"),
                        "user": r.get("username"), "pass": r.get("password"),
                        "eventid": r.get("eventid")} for r in logins],
        "ssh_commands": [{"ts": when(r), "ip": r.get("src_ip"),
                          "input": (r.get("input") or "")[:120]} for r in commands],
        "ssh_conns_1h": len(w1h),
        "ssh_conns_15m": len(w15m),
        "ssh_wave_top": wave,
        "agent_lures": [{"ts": when(r), "ip": r.get("ip"), "path": r.get("path"),
                         "ua": (r.get("ua") or "")[:70]} for r in agent],
        "crypto_probes": [{"ts": when(r), "ip": r.get("ip"), "path": r.get("path"),
                           "ua": (r.get("ua") or "")[:70]} for r in crypto],
        "ai_crawlers": [{"ts": when(r), "ip": r.get("ip"), "path": r.get("path"),
                         "event": r.get("event"), "ua": (r.get("ua") or "")[:130]}
                        for r in crawlers],
        "scored_creds": new_cred,
        "attackers": sorted(attackers),
        "containers": containers(),
        "cert_days_left": cert_days_left(),
        "counts": {"capture": len(capture), "fakec2": len(fakec2),
                   "cowrie": len(cowrie), "creds": len(creds)},
    }))


if __name__ == "__main__":
    main()
