#!/usr/bin/env python3
"""Fetch the crawler-operator published IP ranges and push them to the Fluvia lure.

Runs on the **Hermes box** (which has egress); the lure's egress is locked, so
`state/crawler_ranges.json` is generated here and scp'd over. The lure only reads
it: `fluvia-deploy/scripts/crawler_verify.py` turns (ip, ua) into a verified-crawler
label, and `sessionize.py` stops scoring those sessions on the agentic scale.

Why: 2026-09-27, a Googlebot smartphone session scored exactly AGENTIC_MIN (30) from
four page reads plus the site-walk bonus and fired the watcher's 🧠 lane. See the
crawler_verify docstring and vault Hermes/Fluvia-Honeypot.md.

    fluvia-crawler-ranges.py [--no-push] [--verbose] [--ranges PATH]

Silent on success (it is a `no_agent` cron job: empty stdout sends nothing) and loud
on failure — a run that cannot refresh and cannot carry the previous file forward
exits non-zero with a line explaining what is stale.

Only the operators that publish machine-readable ranges are included. Bingbot and
Applebot publish theirs as JSON; ClaudeBot has no JSON, so its range comes from ARIN
RDAP and is only accepted when the returned handle is AWS-ANTHROPIC.
"""
from __future__ import annotations

import argparse
import hashlib
import ipaddress
import json
import os
import subprocess
import sys
import tempfile
import urllib.request
from datetime import datetime, timezone

SSH_BOX = "root@68.183.29.202"
SSH_PORT = "64221"
SSH_KEY = os.path.expanduser("~/.ssh/id_ed25519")
REMOTE_DIR = "/root/fluvia-deploy/state"
REMOTE_FILE = f"{REMOTE_DIR}/crawler_ranges.json"
DEFAULT_OUT = os.path.expanduser("~/.hermes/state/fluvia-watch/crawler_ranges.json")

# Probe that must classify after a refresh: the Googlebot address that caused the
# false positive. A refresh that loses it is not written.
PROBE_IP = "66.249.66.78"
PROBE_FAMILY = "google-common"

JSON_SOURCES = (
    ("google-common", "https://developers.google.com/static/crawling/ipranges/common-crawlers.json"),
    ("bingbot", "https://www.bing.com/toolbox/bingbot.json"),
    ("applebot", "https://search.developer.apple.com/applebot.json"),
    ("gptbot", "https://openai.com/gptbot.json"),
    ("oai-searchbot", "https://openai.com/searchbot.json"),
    ("chatgpt-user", "https://openai.com/chatgpt-user.json"),
    ("perplexitybot", "https://www.perplexity.ai/perplexitybot.json"),
)
RDAP_SOURCES = (
    # (family, ip to look up, required substring of the RDAP handle/name)
    ("claudebot", "216.73.216.0", "ANTHROPIC"),
)
UA = "Mozilla/5.0 (X11; Linux x86_64) fluvia-crawler-ranges/1.0"


def fetch(url: str, timeout: int = 30) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as resp:  # noqa: S310 (fixed https list)
        return resp.read().decode("utf-8", "replace")


def parse_prefixes(doc) -> list:
    """Pull every *Prefix field out of an operator JSON (OpenAI/Apple/Bing/Google shape).

    Accepts `{"prefixes": [{"ipv4Prefix": ...}]}` and a bare list of strings.
    """
    out = []
    entries = doc.get("prefixes") if isinstance(doc, dict) else doc
    for ent in entries or []:
        if isinstance(ent, str):
            out.append(ent)
            continue
        for key, val in (ent or {}).items():
            if key.endswith("Prefix") and isinstance(val, str):
                out.append(val)
    return out


def parse_rdap(doc, want: str) -> list:
    """Netblock(s) from an RDAP object, only when the handle/name names the operator."""
    blob = json.dumps(doc).upper()
    if want.upper() not in blob:
        return []
    nets = []
    start, end = doc.get("startAddress"), doc.get("endAddress")
    if start and end:
        for cidr in (doc.get("cidr0_cids") or doc.get("cidr0_cidrs") or []):
            if cidr.get("v4prefix"):
                nets.append(f"{cidr['v4prefix']}/{cidr['length']}")
        if not nets:
            span = [n for n in ipaddress.summarize_address_range(
                ipaddress.ip_address(start), ipaddress.ip_address(end))]
            nets = [str(n) for n in span]
    return nets


def collapse(prefixes) -> list:
    nets = []
    for p in prefixes:
        try:
            net = ipaddress.ip_network(str(p).strip(), strict=False)
        except ValueError:
            continue
        if net.version == 4 and net.prefixlen:  # v4 only: the lure's capture is v4
            nets.append(net)
    return [str(n) for n in ipaddress.collapse_addresses(sorted(set(nets)))]


def load_previous(path: str) -> dict:
    try:
        with open(path, encoding="utf-8") as fh:
            return json.load(fh)
    except (OSError, ValueError):
        return {}


def build(previous: dict, verbose: bool) -> tuple:
    """Returns (document, problems[]). Families that fail are carried forward."""
    prev_families = (previous or {}).get("families") or {}
    prev_sources = (previous or {}).get("sources") or {}
    families, sources, problems = {}, {}, []

    for family, url in JSON_SOURCES:
        try:
            nets = collapse(parse_prefixes(json.loads(fetch(url))))
            if not nets:
                raise ValueError("no prefixes in response")
            families[family] = nets
            sources[family] = {"url": url, "prefixes": len(nets),
                               "fetched": datetime.now(timezone.utc).isoformat(timespec="seconds")}
            if verbose:
                print(f"  {family}: {len(nets)} prefix(es) <- {url}")
        except Exception as exc:  # noqa: BLE001 — one dead source must not kill the run
            carried = prev_families.get(family)
            if carried:
                families[family] = carried
                sources[family] = dict(prev_sources.get(family) or {}, stale=True, error=str(exc)[:160])
                problems.append(f"{family}: fetch failed ({exc}); kept {len(carried)} stale prefix(es)")
            else:
                problems.append(f"{family}: fetch failed ({exc}); no previous copy, family dropped")

    for family, ip, want in RDAP_SOURCES:
        url = f"https://rdap.arin.net/registry/ip/{ip}"
        try:
            nets = collapse(parse_rdap(json.loads(fetch(url)), want))
            if not nets:
                raise ValueError(f"RDAP handle does not name {want}")
            families[family] = nets
            sources[family] = {"url": url, "prefixes": len(nets),
                               "fetched": datetime.now(timezone.utc).isoformat(timespec="seconds")}
            if verbose:
                print(f"  {family}: {len(nets)} prefix(es) <- {url}")
        except Exception as exc:  # noqa: BLE001
            carried = prev_families.get(family)
            if carried:
                families[family] = carried
                sources[family] = dict(prev_sources.get(family) or {}, stale=True, error=str(exc)[:160])
                problems.append(f"{family}: RDAP failed ({exc}); kept {len(carried)} stale prefix(es)")
            else:
                problems.append(f"{family}: RDAP failed ({exc}); no previous copy, family dropped")

    doc = {
        "version": 1,
        "generated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "note": ("Crawler-operator published ranges, pre-fetched on the Hermes box because "
                 "the lure's egress is locked. Read by scripts/crawler_verify.py. "
                 "A UA is a claim; an address inside these prefixes is the identity."),
        "families": {k: families[k] for k in sorted(families)},
        "sources": {k: sources[k] for k in sorted(sources)},
    }
    return doc, problems


def probe_ok(doc: dict) -> bool:
    nets = doc.get("families", {}).get(PROBE_FAMILY) or []
    addr = ipaddress.ip_address(PROBE_IP)
    return any(addr in ipaddress.ip_network(n) for n in nets)


def push(path: str, verbose: bool) -> str:
    """scp + verify by remote sha256. A push that is not verified is not a push."""
    local = hashlib.sha256(open(path, "rb").read()).hexdigest()
    ssh = ["ssh", "-o", "StrictHostKeyChecking=no", "-o", "ConnectTimeout=15",
           "-p", SSH_PORT, "-i", SSH_KEY, SSH_BOX]
    subprocess.run(ssh + [f"mkdir -p {REMOTE_DIR}"], check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    subprocess.run(["scp", "-q", "-o", "StrictHostKeyChecking=no", "-P", SSH_PORT,
                    "-i", SSH_KEY, path, f"{SSH_BOX}:{REMOTE_FILE}"], check=True)
    out = subprocess.run(ssh + [f"sha256sum {REMOTE_FILE}"], check=True,
                         capture_output=True, text=True).stdout.split()[0]
    if out != local:
        raise RuntimeError(f"remote sha256 {out[:12]} != local {local[:12]}")
    if verbose:
        print(f"  pushed {path} -> {REMOTE_FILE} (sha256 {local[:12]} verified)")
    return local


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--ranges", default=DEFAULT_OUT, help="output path (local copy)")
    ap.add_argument("--no-push", action="store_true", help="do not scp to the lure")
    ap.add_argument("--verbose", action="store_true")
    args = ap.parse_args()

    previous = load_previous(args.ranges)
    doc, problems = build(previous, args.verbose)

    if not probe_ok(doc):
        print("fluvia-crawler-ranges: FAIL — probe "
              f"{PROBE_IP} is not inside {PROBE_FAMILY} after this refresh; file NOT written "
              "(a ranges file that cannot classify the address that motivated it is worse "
              "than the previous one)")
        return 1

    os.makedirs(os.path.dirname(args.ranges), exist_ok=True)
    fd, tmp = tempfile.mkstemp(prefix=".crawler_ranges", dir=os.path.dirname(args.ranges))
    with os.fdopen(fd, "w", encoding="utf-8") as fh:
        json.dump(doc, fh, indent=1, sort_keys=True)
        fh.write("\n")
    os.replace(tmp, args.ranges)

    pushed = ""
    if not args.no_push:
        try:
            pushed = push(args.ranges, args.verbose)[:12]
        except Exception as exc:  # noqa: BLE001
            print(f"fluvia-crawler-ranges: FAIL — could not push to the lure: {exc}")
            return 1

    total = sum(len(v) for v in doc["families"].values())
    if problems:
        # a carried-forward family is a degraded (but safe) state: it under-verifies,
        # never over-verifies, so report it loudly and exit 0 only if the push worked.
        print("fluvia-crawler-ranges: DEGRADED — "
              f"{len(doc['families'])} families, {total} prefixes, pushed={pushed[:12] or 'no'}; "
              + "; ".join(problems))
        return 0
    if args.verbose:
        print(f"fluvia-crawler-ranges: ok — {len(doc['families'])} families, {total} prefixes, "
              f"{args.ranges}, pushed={pushed[:12]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
