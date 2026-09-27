#!/usr/bin/env python3
"""Verified-crawler check for the behavioural (agentic) lane — added 2026-09-27.

Why this exists
---------------
A user-agent is a *claim*; an IP inside the operator's published crawl range is an
identity. `sessionize.py` scores HOW a session moved, and a polite search-engine
crawler moves like a patient reader: on 2026-09-27 a Googlebot smartphone session
drew `/`, `/how-it-works`, `/terms` over 34 h and scored **30** — exactly
`AGENTIC_MIN` — from four page reads (5 x min(4, 3)) plus the "walked the site"
bonus (15), so the watcher fired its 🧠 lane on commodity Google traffic. Nothing
about the arithmetic was wrong; the input simply was not an agent.

Deterministic and offline by construction. The lure's egress is locked (no DNS, no
HTTP), so the ranges are fetched on the Hermes box by
`~/.hermes/scripts/fluvia-crawler-ranges.py`, pushed to `state/crawler_ranges.json`
and only *read* here. No network call happens on the lure, ever.

The direction of the error is deliberate: anything not proven is not verified.
Missing file, unknown family, empty range, or a UA naming a crawler whose operator
publishes no machine-readable ranges (Bytespider, DuckAssistBot, Mistral,
Meta-ExternalAgent) all fall back to the old behaviour — the session scores
normally. A **spoofed** Googlebot UA from a VPS is therefore still reported.

Read together with the ⚠️ health line in the watcher: an absent or stale ranges file
silently disables this whole exclusion, so `info()` reports the age.
"""
from __future__ import annotations

import ipaddress
import json
import os
import time

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
RANGES = os.environ.get("FLUVIA_CRAWLER_RANGES") or os.path.join(
    ROOT, "state", "crawler_ranges.json")

# UA marker -> (label, ranges family). Every marker is tested against the whole UA:
# the Googlebot smartphone UA also carries Chrome/Mobile Safari, and the marker is
# the "Googlebot/2.1" fragment. Ranges families are named after the *source* that
# publishes them, which is why Google's is `google-common` (the published file is
# the common-crawlers union: Googlebot, GoogleOther, Feedfetcher, Storebot…).
CLAIMS = (
    ("googlebot", "googlebot", "google-common"),
    ("bingbot", "bingbot", "bingbot"),
    ("applebot", "applebot", "applebot"),
    ("gptbot", "gptbot", "gptbot"),
    ("oai-searchbot", "oai-searchbot", "oai-searchbot"),
    ("chatgpt-user", "chatgpt-user", "chatgpt-user"),
    ("claudebot", "claudebot", "claudebot"),
    ("claude-web", "claudebot", "claudebot"),
    ("claude-user", "claudebot", "claudebot"),
    ("anthropic", "claudebot", "claudebot"),
    ("perplexitybot", "perplexitybot", "perplexitybot"),
    ("perplexity-user", "perplexitybot", "perplexitybot"),
)

_cache = {"mtime": None, "families": {}, "doc": {}}


def _load() -> dict:
    """Parse the ranges file, cached on mtime. Returns {family: [ip_network]}.

    Any failure (absent file, truncated JSON, bad CIDR) yields {} — never an
    exception, because this runs inside the hourly classifier: a broken ranges file
    must degrade to the pre-2026-09-27 behaviour, not stop the scorer.
    """
    try:
        st = os.stat(RANGES)
    except OSError:
        _cache.update(mtime=None, families={}, doc={})
        return {}
    if _cache["mtime"] == st.st_mtime:
        return _cache["families"]

    families, doc = {}, {}
    try:
        with open(RANGES, encoding="utf-8") as fh:
            doc = json.load(fh)
        for fam, nets in (doc.get("families") or {}).items():
            parsed = []
            for net in nets:
                try:
                    parsed.append(ipaddress.ip_network(str(net), strict=False))
                except ValueError:
                    continue
            if parsed:
                families[fam] = parsed
    except (OSError, ValueError, AttributeError):
        families, doc = {}, {}
    _cache.update(mtime=st.st_mtime, families=families, doc=doc)
    return families


def classify(ua: str) -> tuple:
    """(label, ranges family) claimed by the UA, or (None, None)."""
    ua = (ua or "").lower()
    for marker, label, family in CLAIMS:
        if marker in ua:
            return label, family
    return None, None


def verify(ip: str, ua: str) -> str:
    """Return the crawler label when `ip` is inside the range its UA claims.

    Example: verify("66.249.66.78", "Mozilla/5.0 (Linux; Android 6.0.1…) …Googlebot/2.1")
    -> "googlebot". A Googlebot UA from an address outside Google's published
    prefixes returns "" (falsy) and scores as before.
    """
    label, family = classify(ua)
    if not label:
        return ""
    nets = _load().get(family)
    if not nets:
        return ""
    try:
        addr = ipaddress.ip_address((ip or "").strip())
    except ValueError:
        return ""
    for net in nets:
        if addr.version == net.version and addr in net:
            return label
    return ""


def info() -> dict:
    """Freshness of the ranges file, for the watcher's health line."""
    families = _load()
    try:
        st = os.stat(RANGES)
    except OSError:
        return {"path": RANGES, "present": False, "age_days": None, "families": {}}
    doc = _cache.get("doc") or {}
    return {
        "path": RANGES,
        "present": True,
        "age_days": round((time.time() - st.st_mtime) / 86400, 2),
        "generated": doc.get("generated"),
        "families": {fam: len(nets) for fam, nets in sorted(families.items())},
    }


if __name__ == "__main__":
    import sys

    payload = info()
    print(json.dumps(payload, indent=2))
    if len(sys.argv) > 2:
        print("verify:", verify(sys.argv[1], sys.argv[2]) or "(no verificado)")
