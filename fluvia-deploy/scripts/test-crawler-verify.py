#!/usr/bin/env python3
"""Harness for the verified-crawler filter (change of 2026-09-27).

Covers three things, all offline (no network, no SSH):

  crawler_verify.verify            the decision itself, against a fixture ranges file
  fluvia-crawler-ranges parsing    parse_prefixes / parse_rdap on operator-shaped JSON
  fail-closed behaviour            missing file, empty family, spoofed UA, IPv6 input

The case that motivated it is real: 2026-09-27, `66.249.66.78` with the Googlebot
smartphone UA scored exactly AGENTIC_MIN (30) from `/`, `/how-it-works`, `/terms`
over 34 h and fired the watcher's 🧠 lane. Verified → it must now score 0; the same
UA from a random VPS must still score, because a UA is only a claim.

Run: python3 test-crawler-verify.py     (exit 0 = all green)
"""
import importlib.util
import json
import os
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))


def load(name, candidates):
    target = next((p for p in candidates if os.path.exists(p)), None)
    if not target:
        sys.exit(f"{name} not found; looked in: {candidates}")
    spec = importlib.util.spec_from_file_location(name.replace("-", "_"), target)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod, target


# crawler_verify lives next to sessionize.py (deployed) and in the repo (source)
CV, CV_PATH = load("crawler_verify", [
    os.path.join(HERE, "crawler_verify.py"),
    "/root/fluvia-deploy/scripts/crawler_verify.py",
])
FR, FR_PATH = load("fluvia-crawler-ranges", [
    os.path.expanduser("~/.hermes/scripts/fluvia-crawler-ranges.py"),
    os.path.join(HERE, "fluvia-crawler-ranges.py"),
])

GOOGLEBOT_DESKTOP = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
GOOGLEBOT_MOBILE = ("Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.6478.126 "
                    "Mobile Safari/537.36 (compatible; Googlebot/2.1; "
                    "+http://www.google.com/bot.html)")
FIXTURE = {
    "version": 1,
    "generated": "2026-09-27T19:00:00+00:00",
    "families": {
        "google-common": ["66.249.66.64/27", "66.249.64.0/19"],
        "gptbot": ["132.196.86.0/24"],
        "claudebot": ["216.73.216.0/22"],
        "perplexitybot": ["18.97.9.96/27"],
    },
    "sources": {},
}

ok = fail = 0


def check(label, got, want):
    global ok, fail
    if got == want:
        ok += 1
        print(f"  ok    {label:60} -> {got!r}")
    else:
        fail += 1
        print(f"  FAIL  {label:60} -> {got!r} (want {want!r})")


def with_ranges(doc):
    fd, path = tempfile.mkstemp(prefix="ranges", suffix=".json")
    with os.fdopen(fd, "w") as fh:
        json.dump(doc, fh)
    os.environ["FLUVIA_CRAWLER_RANGES"] = path          # read at import/load time
    CV.RANGES = path
    CV._cache.update(mtime=None, families={}, doc={})   # drop the mtime cache
    return path


print(f"crawler_verify: {CV_PATH}\nranges fetcher: {FR_PATH}\n")

print("verify() — the real false positive, and its spoof")
path = with_ranges(FIXTURE)
check("Googlebot smartphone UA from 66.249.66.78 (the alert)",
      CV.verify("66.249.66.78", GOOGLEBOT_MOBILE), "googlebot")
check("Googlebot desktop UA from the same /19",
      CV.verify("66.249.70.10", GOOGLEBOT_DESKTOP), "googlebot")
check("Googlebot UA from a Hetzner VPS (spoof) still scores",
      CV.verify("5.9.1.2", GOOGLEBOT_MOBILE), "")
check("Googlebot UA from an empty IP", CV.verify("", GOOGLEBOT_MOBILE), "")

print("\nclassify() — other families, and what must NOT classify")
check("GPTBot -> gptbot", CV.verify("132.196.86.5", "Mozilla/5.0 (compatible; GPTBot/1.2)"),
      "gptbot")
check("ClaudeBot -> claudebot", CV.verify("216.73.216.147", "ClaudeBot/1.0; +claudebot@anthropic.com"),
      "claudebot")
check("PerplexityBot -> perplexitybot", CV.verify("18.97.9.100", "Mozilla/5.0 PerplexityBot/1.0"),
      "perplexitybot")
check("Bingbot claimed but no bingbot family in fixture",
      CV.verify("157.55.39.10", "Mozilla/5.0 (compatible; bingbot/2.0)"), "")
check("Bytespider (no published ranges) is never verified",
      CV.verify("110.249.201.4", "Mozilla/5.0 Bytespider/1.0"), "")
check("plain browser UA from Google's own range is not a verified bot",
      CV.verify("66.249.66.78", "Mozilla/5.0 (X11; Linux x86_64) Chrome/126.0 Safari/537.36"), "")
check("empty UA", CV.verify("66.249.66.78", ""), "")
check("UA truncated to 80 chars (sessionize's display field) does NOT verify — "
      "the reason sessionize passes the longest UA in the group",
      CV.verify("66.249.66.78", GOOGLEBOT_MOBILE[:80]), "")

print("\nfail-closed behaviour")
os.environ["FLUVIA_CRAWLER_RANGES"] = "/nonexistent/crawler_ranges.json"
CV.RANGES = "/nonexistent/crawler_ranges.json"
CV._cache.update(mtime=None, families={}, doc={})
check("missing ranges file -> nothing verified", CV.verify("66.249.66.78", GOOGLEBOT_MOBILE), "")
check("info() reports absence", CV.info()["present"], False)

path = with_ranges({**FIXTURE, "families": {"google-common": []}})
check("empty family -> nothing verified", CV.verify("66.249.66.78", GOOGLEBOT_MOBILE), "")
path = with_ranges({**FIXTURE, "families": {"google-common": ["not-a-cidr", "66.249.66.64/27"]}})
check("junk CIDR is skipped, good one still works",
      CV.verify("66.249.66.78", GOOGLEBOT_MOBILE), "googlebot")
path = with_ranges(FIXTURE)
info = CV.info()
check("info() counts families", sorted(info["families"]), ["claudebot", "google-common", "gptbot",
                                                           "perplexitybot"])
check("info() age is a small number of days", info["age_days"] is not None and info["age_days"] < 1,
      True)
check("IPv6 address against a v4 range does not raise or match",
      CV.verify("2001:4860:4801:10::1", GOOGLEBOT_MOBILE), "")
check("garbage IP does not raise", CV.verify("999.999.999.999", GOOGLEBOT_MOBILE), "")
os.environ.pop("FLUVIA_CRAWLER_RANGES", None)

print("\nfluvia-crawler-ranges: parsers (fixtures shaped like the live files)")
google = {"prefixes": [{"ipv6Prefix": "2001:4860:4801:10::/64"},
                       {"ipv4Prefix": "66.249.66.64/27"}]}
openai = {"creationTime": "2026-09-22T02:00:07.000000",
          "prefixes": [{"ipv4Prefix": "132.196.86.0/24"}, {"ipv4Prefix": "132.196.86.0/25"}]}
check("parse_prefixes keeps only the *Prefix fields (v4 and v6)",
      FR.parse_prefixes(google), ["2001:4860:4801:10::/64", "66.249.66.64/27"])
check("collapse: v4 only, merged and deduped", FR.collapse(FR.parse_prefixes(openai)),
      ["132.196.86.0/24"])
rdap_ok = {"handle": "NET-216-73-216-0-1", "name": "AWS-ANTHROPIC",
           "startAddress": "216.73.216.0", "endAddress": "216.73.219.255",
           "cidr0_cidrs": [{"v4prefix": "216.73.216.0", "length": 22}]}
check("parse_rdap accepts a handle naming the operator", FR.parse_rdap(rdap_ok, "ANTHROPIC"),
      ["216.73.216.0/22"])
check("parse_rdap refuses a range whose handle does not name the operator",
      FR.parse_rdap({**rdap_ok, "name": "AWS-CLOUDFRONT", "handle": "NET-OTHER"}, "ANTHROPIC"), [])
check("parse_rdap falls back to summarizing start-end",
      FR.parse_rdap({k: v for k, v in rdap_ok.items() if k != "cidr0_cidrs"}, "ANTHROPIC"),
      ["216.73.216.0/22"])

print("\nsessionize() contract — masked row keeps its behaviour score")
check("emit shape: verified_bot present only when masked",
      (lambda rows: [(r["agentic_score"], r.get("verified_bot")) for r in rows])([
          {"agentic_score": 0, "behaviour_score": 30, "verified_bot": "googlebot"},
          {"agentic_score": 30, "behaviour_score": 30},
      ]), [(0, "googlebot"), (30, None)])

print(f"\n{ok} ok, {fail} failed")
sys.exit(1 if fail else 0)
