#!/usr/bin/env python3
"""Fluvia honeypot watcher (Run 2) — Hermes-side, no_agent cron.

Runs on the Hermes box. SSHes read-only into fluvia-rebuild, asks
`watch-summary.py` for the significant events since the last run, and prints a
short alert ONLY when a **human or AI/agent actually interacted with the lure**:

    ALWAYS (that is the fish):
        SSH login that SUCCEEDED (any user/pass)      -> 🎉
        commands typed into the Cowrie shell          -> 💻
        AI-agent canary touched (/llms.txt,
            /agent-notes, /archive, /agent-ack)       -> 🤖
        an AI crawler reading the lure at all
            (robots.txt / sitemap.xml / any page)     -> 🕸️
        crypto-value surface (/api/v1/balance,
            /withdraw, /webhooks, /export-seed)       -> 💰
        a web session whose BEHAVIOUR scores high
            on sessionize.py's agentic scale
            (>= AGENTIC_MIN): followed the hidden
            agent surface, stepped the maze, moved
            like an agent rather than a scanner      -> 🧠
        health (no access, container down, TLS
            expiry, evidence reset, classification
            pipeline frozen, crawler ranges absent
            or stale)                                 -> ⚠️

    SELECTIVE: a *first-ever-seen* IP gets one line, but only if it looks like a
        person or a targeted actor rather than a dictionary:
            <= 5 attempts in the window        (a poker, not a campaign), OR
            an AI-era username (claude, bot, agent, openai, codex, ...), OR
            a crypto-context username (sol, eth, solv, node, validator, ...)
        An AI/crypto name only counts for a CAMPAIGN IP (more than 5 attempts) when
        it is distinctive (a digit or `._-` in it): `bot` and `eth` are wordlist
        entries, `openai_bot_7` and `eth-node-3` are choices.

    COUNTED, NEVER SENT (commodity machine noise):
        dictionary/brute-force campaigns, repeat attempts from known IPs,
        C2/sinkhole hits, "new IP" churn that fails the selectivity test,
        commodity web crawlers. Totals land in the state file under
        `suppressed`, and any run that does alert closes with one summary line.

Policy: Gabriel 2026-09-15 ("stop sending me these messages, unless it's human
or AI interactions") + 2026-09-18 (SSH volume was still 6-7 lines per run).
See vault Hermes/Fluvia-Honeypot.md.

State: ~/.hermes/state/fluvia-watch/state.json  (override: FLUVIA_STATE_DIR)
       (watermark, seen IPs, health, suppressed counters)
Dry run without touching state:  FLUVIA_STATE_DIR=/tmp/x fluvia-watch.py
"""
import fcntl
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone

BOX = "root@68.183.29.202"
PORT = "64221"
SSH = "/usr/bin/ssh"
HOME = os.environ.get("HOME") or "/home/hermes"
KEY = os.path.join(HOME, ".ssh/id_ed25519")
REMOTE = "/root/fluvia-deploy/scripts/watch-summary.py"
STATE_DIR = os.environ.get("FLUVIA_STATE_DIR") or os.path.join(
    HOME, ".hermes/state/fluvia-watch")
STATE_FILE = os.path.join(STATE_DIR, "state.json")
WATCH_FILE = os.path.join(STATE_DIR, "watchlist.json")
EPOCH = "1970-01-01T00:00:00Z"

CERT_WARN_DAYS = 15
CAP_LOGIN, CAP_CMD, CAP_AGENT, CAP_CRYPTO, CAP_CRAWLER = 6, 6, 4, 4, 4

# Behavioural lane (evidence/sessions.jsonl, sessionize.py). The score is built
# from what a session DID: reading the lure (5/page), fetching the hidden agent
# surface /llms.txt (20), stepping the maze (5), confirming the marker (40),
# touching the honeytoken (15), attempting a withdraw (10). 30 is the point where
# a session has done something a commodity crawler does not; commodity sessions
# sit at 5-15. One line per session ever (keyed ip|first), so a session that keeps
# growing is not repeated.
AGENTIC_MIN = 30
CAP_AGENTIC = 4
PIPELINE_STALE_H = 6          # hourly fluvia-analyze timer; 6 h late = something broke
RANGES_STALE_DAYS = 45        # state/crawler_ranges.json; the verified-crawler filter
                              # is only as good as this file, so its age is a health item

# --- what counts as "interesting" for a first-ever-seen IP --------------------
POKE_ATTEMPTS = 5            # <= this many tries = someone poking, not a campaign
AI_USERS = {"claude", "claudeai", "anthropic", "openai", "gpt", "gpt4", "chatgpt",
            "bot", "ai", "aiuser", "agent", "aiagent", "assistant", "copilot",
            "codex", "llm", "ollama", "langchain", "autogpt", "agentgpt",
            "n8n", "flowise", "langflow", "dify", "crewai", "devin",
            # Added 2026-09-27: measured in run 2 (vault Fluvia-Honeypot.md). These four
            # were landing in the credentials 15-16 sep and the list did not cover them,
            # so a *chosen* variant (`openclaw_7`) would never have fired. The bare names
            # stay commodity: for a campaign IP distinctive_name() still silences them
            # into suppressed.ai_name_in_wordlist.
            "openclaw", "clawdbot", "cursor", "hummingbot"}
AI_USER_PREFIX = ("claude", "openai", "anthropic", "chatgpt", "gpt-", "llm-",
                  "ai-", "agent-", "ai_", "agent_",
                  "openclaw", "clawdbot", "cursor", "hummingbot")
AI_USER_RE = re.compile(r"^(sol|solana|solv|eth|ethereum|eth-?docker|node|nodejs|"
                        r"validator|raydium|tron|btc|bitcoin|xmr|monero|matic|"
                        r"polkadot|avax|usdc|usdt|stake|staking|wallet|metamask|"
                        r"phantom|binance|coinbase|kraken|crypto|chain|miner)"
                        r"(([0-9]+)|([._-][a-z0-9._-]{1,30}))?$")


def interesting_user(user):
    u = (user or "").strip().lower()
    if not u:
        return ""
    if u in AI_USERS or any(u.startswith(p) for p in AI_USER_PREFIX):
        return "nombre de la era IA"
    if AI_USER_RE.match(u):
        return "contexto crypto"
    return ""


def distinctive_name(user):
    """A *campaign* IP (more attempts than a poker) only keeps its AI/crypto-name line
    if the username carries a digit or a separator — i.e. someone chose it.

    Added 2026-09-23: the bare name `bot` (20 attempts from 203.0.113.69) fired as
    'nombre de la era IA'. `bot`, `ai`, `gpt`, `chatgpt`, `admin` are wordlist entries;
    reading them is not evidence of an AI actor. `openai_bot_7` or `claude-codex` is.
    """
    return bool(re.search(r"[0-9._-]", (user or "").strip()))


def load_state():
    try:
        with open(STATE_FILE) as fh:
            return json.load(fh)
    except Exception:
        return {}


def save_state(state):
    os.makedirs(STATE_DIR, exist_ok=True)
    tmp = STATE_FILE + ".tmp"
    with open(tmp, "w") as fh:
        json.dump(state, fh)
    os.replace(tmp, STATE_FILE)


def load_watchlist():
    """IPs that must re-alert on every return visit, whatever they do.

    Added 2026-09-25: `seen_ips` announces an IP exactly once, so an actor worth
    following (e.g. an unknown automation that read the honeytoken end to end and
    is not Gabriel) would go permanently silent after its first run. This file
    overrides that dedupe: any fresh row from a listed IP — web, sinkhole, SSH,
    scored creds — is reported with what it touched.

      203.0.113.148 203.0.113.2  UA-rotating API walker that read the honeytoken.

    Shape: [{"ip": "x.x.x.x", "why": "why we care"}]
    """
    try:
        with open(WATCH_FILE) as fh:
            raw = json.load(fh)
    except Exception:
        return {}
    out = {}
    for item in raw if isinstance(raw, list) else []:
        if isinstance(item, str):
            out[item] = ""
        elif isinstance(item, dict) and item.get("ip"):
            out[item["ip"]] = item.get("why") or ""
    return out


def fetch(since, watch=()):
    cmd = [SSH, "-i", KEY, "-p", PORT, "-o", "BatchMode=yes",
           "-o", "ConnectTimeout=12", "-o", "ServerAliveInterval=5",
           BOX, f"python3 {REMOTE} '{since}' '{','.join(sorted(watch))}'"]
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=150)
    except subprocess.TimeoutExpired:
        return None, "timeout tras 150 s"
    if res.returncode != 0:
        return None, (res.stderr or res.stdout or "ssh fallo").strip().splitlines()[-1][:160]
    try:
        return json.loads(res.stdout.strip().splitlines()[-1]), None
    except Exception:
        return None, "respuesta no parseable"


def out(lines):
    if lines:
        print("\n".join(lines))


def group(rows, *keys):
    agg = {}
    for row in rows:
        key = tuple(row.get(k) for k in keys)
        agg[key] = agg.get(key, 0) + 1
    return sorted(agg.items(), key=lambda kv: -kv[1])


def main():
    os.makedirs(STATE_DIR, exist_ok=True)
    lock = open(os.path.join(STATE_DIR, "lock"), "w")
    try:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        return  # a previous run is still going

    state = load_state()
    first_run = not state
    since = state.get("watermark", EPOCH)
    watch = load_watchlist()
    data, err = fetch(since, watch)

    now = datetime.now(timezone.utc)
    if data is None:
        was = state.get("health", "ok")
        streak = int(state.get("down_streak", 0)) + 1
        state["health"] = "down"
        state["down_streak"] = streak
        save_state(state)
        if was == "ok" or streak % 4 == 0:
            out([f"⚠️ Fluvia: sin acceso al honeypot ({err})",
                 f"   ({streak}ª comprobación seguida sin poder leer la caja)"])
        return

    recovered = state.get("health") == "down"
    state["health"] = "ok"
    state["down_streak"] = 0

    counts = data.get("counts", {})
    newest = data.get("newest") or since
    known_ips = set(state.get("seen_ips", []))
    attackers = set(data.get("attackers", []))
    suppressed = state.get("suppressed", {})       # cumulative, for the record
    silent_runs = int(state.get("silent_runs", 0))

    # --- commodity noise: count it, never send it -------------------------
    c2 = data.get("c2", [])
    suppressed["c2_hits"] = suppressed.get("c2_hits", 0) + len(c2)
    w1h, w15m = data.get("ssh_conns_1h", 0), data.get("ssh_conns_15m", 0)
    suppressed["ssh_conns_1h_last"] = w1h
    suppressed["ssh_conns_15m_last"] = w15m
    new_ips = sorted(attackers - known_ips)
    suppressed["new_ips"] = suppressed.get("new_ips", 0) + len(new_ips)

    if first_run:
        # Baseline: arm silently. No message — Gabriel does not want one.
        state["watermark"] = newest
        state["seen_ips"] = sorted(known_ips | attackers)
        state["suppressed"] = suppressed
        save_state(state)
        return

    alerts = []
    if recovered:
        alerts.append("✅ Acceso al honeypot restablecido")

    # --- SSH: successes always, first-ever pokes selectively --------------
    logins = data.get("ssh_logins", [])
    per_ip = {}
    order = []
    for row in logins:
        ip = row.get("ip")
        if ip not in per_ip:
            per_ip[ip] = []
            order.append(ip)
        per_ip[ip].append(row)

    for row in logins:
        if row.get("eventid", "").endswith("success"):
            alerts.append(f"🎉 SSH ENTRÓ: {row['user']}/{row['pass']} desde {row['ip']}"
                          f"  ({row.get('ts', '')[:19]}Z)")

    fresh_new = []
    for ip in order:
        row = per_ip[ip][0]
        if ip in known_ips:
            continue
        why = interesting_user(row.get("user"))
        if len(per_ip[ip]) <= POKE_ATTEMPTS:
            why = why or "pocos intentos (no es diccionario)"
        else:
            suppressed["dict_ips"] = suppressed.get("dict_ips", 0) + 1
            # a wordlist name (`bot`, `ai`, `chatgpt`) is not a signal; a chosen one is
            if why and not distinctive_name(row.get("user")):
                suppressed["ai_name_in_wordlist"] = suppressed.get("ai_name_in_wordlist", 0) + 1
                why = ""
        if why:
            fresh_new.append((row, why, len(per_ip[ip])))

    fresh_new.sort(key=lambda t: t[0].get("ts", ""))
    for row, why, n in fresh_new[:CAP_LOGIN]:
        extra = f" — {why}" if why else ""
        alerts.append(f"🔑 Login nuevo desde {row['ip']}: {row['user']}/{row['pass']}"
                      f"  (1º de {n}){extra}")
    if len(fresh_new) > CAP_LOGIN:
        alerts.append(f"   …y {len(fresh_new) - CAP_LOGIN} IP nuevas más de interés")

    # --- commands typed inside the fake shell (the best tell) -------------
    for row in data.get("ssh_commands", [])[:CAP_CMD]:
        alerts.append(f"💻 Comando desde {row['ip']}: «{row['input'].strip()}»")

    # --- AI-agent canaries ------------------------------------------------
    agent = group(data.get("agent_lures", []), "ip", "path")
    if agent:
        for (ip, path), n in agent[:CAP_AGENT]:
            alerts.append(f"🤖 SEÑUELO DE AGENTE: {path} desde {ip} x{n}")
        if len(agent) > CAP_AGENT:
            alerts.append(f"   …y {len(agent) - CAP_AGENT} más")

    # --- AI crawlers reading the lure (near miss) -------------------------
    # Report only (family, path) pairs never seen before, so a crawler that keeps
    # re-reading robots.txt every 6 h is counted rather than repeated. A brand-new
    # family, or a known one reaching a new route, is news.
    seen_crawlers = set(tuple(p) for p in state.get("seen_crawler_paths", []))
    fresh_crawler = {}
    for row in data.get("ai_crawlers", []):
        ua = (row.get("ua") or "").lower()
        fam = "desconocido"
        for tag in ("gptbot", "oai-searchbot", "chatgpt-user", "claudebot", "claude",
                    "anthropic", "perplexity", "ccbot", "google-extended",
                    "meta-externalagent", "bytespider", "duckassistbot",
                    "mistralai", "cohere", "youbot"):
            if tag in ua:
                fam = tag
                break
        pair = (fam, row.get("path") or "/")
        if pair not in seen_crawlers:
            fresh_crawler.setdefault(fam, set()).add(pair[1])
        seen_crawlers.add(pair)
        suppressed["ai_crawler_hits"] = suppressed.get("ai_crawler_hits", 0) + 1

    for fam, paths in sorted(fresh_crawler.items())[:CAP_CRAWLER]:
        shown = ", ".join(sorted(paths)[:3])
        more = f" (+{len(paths) - 3} más)" if len(paths) > 3 else ""
        alerts.append(f"🕸️ Crawler IA nuevo en el señuelo: {fam} -> {shown}{more}")
    state["seen_crawler_paths"] = sorted([list(p) for p in seen_crawlers])

    # --- crypto value surface --------------------------------------------
    crypto = group(data.get("crypto_probes", []), "ip", "path")
    if crypto:
        for (ip, path), n in crypto[:CAP_CRYPTO]:
            flag = " (HONEYTOKEN)" if "export-seed" in (path or "") else ""
            alerts.append(f"💰 Superficie crypto: {path} desde {ip} x{n}{flag}")
        if len(crypto) > CAP_CRYPTO:
            alerts.append(f"   …y {len(crypto) - CAP_CRYPTO} más")

    # --- behavioural sessions: did anything move like an agent? -----------
    # evidence/sessions.jsonl is rebuilt hourly from the web capture; each row is
    # one (ip, user-agent) session scored 0-100 on HOW it moved (timing, path
    # order, whether it followed the hidden surface). This is the lane that answers
    # the honeypot's actual question, so it is worth a line when it fires.
    seen_sessions = set(state.get("seen_sessions", []))
    agentic_new = []

    # Verified crawlers, counted and never sent (added 2026-09-27). sessionize.py
    # masks them at the source and watch-summary.py already keeps them out of
    # `agentic_sessions`; this loop is the second belt, so an older summary on the
    # box cannot resurrect the false positive (2026-09-27: Googlebot smartphone
    # session scored exactly 30 from /, /how-it-works, /terms over 34 h).
    for row in data.get("verified_bot_sessions") or []:
        suppressed["verified_bot_sessions"] = suppressed.get("verified_bot_sessions", 0) + 1

    for row in data.get("agentic_sessions", []):
        score = row.get("score") or 0
        if row.get("verified_bot") or row.get("bot"):
            suppressed["verified_bot_sessions"] = suppressed.get("verified_bot_sessions", 0) + 1
            continue
        if score < AGENTIC_MIN:
            suppressed["agentic_below_min"] = suppressed.get("agentic_below_min", 0) + 1
            continue
        if not row.get("ip"):
            continue
        key = f"{row['ip']}|{row.get('first')}"
        if key in seen_sessions:
            continue
        agentic_new.append((key, row))
    agentic_new.sort(key=lambda t: -(t[1].get("score") or 0))
    for key, row in agentic_new[:CAP_AGENTIC]:
        paths = [p for p in (row.get("paths") or []) if p]
        shown = ", ".join(paths[:3])
        more = f" +{len(paths) - 3}" if len(paths) > 3 else ""
        gap = row.get("gap_median")
        ua = (row.get("ua") or "").strip()
        alerts.append(f"🧠 Sesión agéntica score {row['score']}: {row['ip']} — "
                      f"{row.get('events')} eventos, {row.get('distinct_paths')} rutas, "
                      f"gap {gap}s · {row.get('kinds') or {}}")
        alerts.append(f"     {shown}{more}" + (f" · UA: {ua[:50]}" if ua else ""))
        seen_sessions.add(key)
    if len(agentic_new) > CAP_AGENTIC:
        alerts.append(f"   …y {len(agentic_new) - CAP_AGENTIC} sesión(es) agéntica(s) más")
    state["seen_sessions"] = sorted(seen_sessions)[-3000:]

    # --- watchlist: actors we chose to follow, never silenced by seen_ips --
    # (same idea as the honeytoken: the interesting thing is the *return*, and the
    # one-line-per-IP dedupe would swallow it.)
    hits = [row for row in (data.get("watch_hits") or [])
            if row.get("ip") in watch]
    if hits:
        per: dict = {}
        for row in hits:
            per.setdefault(row["ip"], []).append(row)
        for ip, rows in sorted(per.items(), key=lambda kv: kv[1][0].get("ts") or ""):
            seen_what, lanes = [], []
            for row in rows:
                tag = row.get("path") or row.get("event") or "?"
                if tag and tag not in seen_what:
                    seen_what.append(tag)
                if row.get("lane") and row["lane"] not in lanes:
                    lanes.append(row["lane"])
            desc = f"🐟 VIGILADO {ip} volvió a actuar: {len(rows)} evento(s)"
            if lanes:
                desc += f" [{', '.join(lanes)}]"
            alerts.append(desc)
            shown = ", ".join(seen_what[:6])
            if len(seen_what) > 6:
                shown += f" +{len(seen_what) - 6}"
            alerts.append(f"     {shown or '(sin detalle)'}"
                          + (f" — {watch[ip]}" if watch.get(ip) else ""))

    # --- health (operational: a dead lure catches nothing) ----------------
    missing = data.get("containers", {}).get("missing", [])
    if missing and set(missing) != set(state.get("missing", [])):
        alerts.append(f"⚠️ Contenedores caídos: {', '.join(missing)}")
    state["missing"] = missing

    days = data.get("cert_days_left")
    if days is not None and days < CERT_WARN_DAYS and state.get("cert_warned") != now.date().isoformat():
        alerts.append(f"🔐 Certificado TLS caduca en {days} días "
                      f"(renovar: egress.sh --allow-acme, luego sin el flag)")
        state["cert_warned"] = now.date().isoformat()

    if newest and state.get("watermark") and newest < state["watermark"]:
        alerts.append(f"⚠️ La evidencia retrocedió ({state['watermark']} → {newest}): "
                      f"rotación o reinicio de la captura")

    # the classifiers are a systemd timer on the lure; when it dies the lure looks
    # quiet instead of broken. Warn once a day while it stays stale.
    pipe = data.get("pipeline_mtime") or {}
    stale = []
    for name, stamp in sorted(pipe.items()):
        if not stamp:
            continue
        try:
            age = (now - datetime.fromisoformat(
                stamp.replace("Z", "+00:00"))).total_seconds() / 3600
        except ValueError:
            continue
        if age > PIPELINE_STALE_H:
            stale.append(f"{name} {age:.0f} h")
    if stale and state.get("pipeline_stale_warned") != now.date().isoformat():
        alerts.append(f"⚠️ Clasificación congelada: {', '.join(stale)} sin actualizar "
                      f"(revisar fluvia-analyze.timer en la caja)")
        state["pipeline_stale_warned"] = now.date().isoformat()

    # the verified-crawler exclusion is only as good as its ranges file: absent or
    # stale silently restores the old false positive (a polite crawler scoring as an
    # agent), so say so once a day instead of degrading quietly.
    cr = data.get("crawler_ranges") or {}
    age = cr.get("age_days")
    if (not cr.get("present")) or (age is None) or (age > RANGES_STALE_DAYS):
        if state.get("ranges_warned") != now.date().isoformat():
            why = ("ausente" if not cr.get("present")
                   else f"de {age} días" if age is not None else "sin fecha")
            alerts.append(f"⚠️ Rangos de crawlers {why}: la verificación de bots está "
                          f"desactivada o desactualizada "
                          f"(refrescar: ~/.hermes/scripts/fluvia-crawler-ranges.py)")
            state["ranges_warned"] = now.date().isoformat()
    else:
        state.pop("ranges_warned", None)

    # --- one line of context: how much noise was withheld this run --------
    if alerts:
        ips = len(per_ip)
        noise = f"📊 Omitido: {len(logins)} intentos de login de {ips} IPs"
        if fresh_new and len(fresh_new) < ips:
            noise += f", otras {ips - len(fresh_new)} IPs"
        if c2:
            noise += f", {len(c2)} toques al sinkhole"
        if w1h:
            noise += f", {w1h} conexiones SSH en 1 h"
        if suppressed.get("verified_bot_sessions"):
            noise += f", {suppressed['verified_bot_sessions']} sesión(es) de crawler verificado"
        alerts.append(noise)

    state["watermark"] = max(newest, state.get("watermark", EPOCH))
    state["seen_ips"] = sorted(known_ips | attackers)
    state["suppressed"] = suppressed
    state["last_run"] = now.isoformat()
    state["last_counts"] = counts
    state["silent_runs"] = silent_runs + (0 if alerts else 1)
    save_state(state)

    if alerts:
        out([f"🕷️ Fluvia (Run 2) — {len(alerts)} aviso(s)"] +
            [f"  {a}" for a in alerts])


if __name__ == "__main__":
    sys.exit(main())
