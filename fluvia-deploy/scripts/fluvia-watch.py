#!/usr/bin/env python3
"""Fluvia honeypot watcher (Run 2) — Hermes-side, no_agent cron.

Runs on the Hermes box. SSHes read-only into fluvia-rebuild, asks
`watch-summary.py` for the significant events since the last run, and prints a
short alert ONLY when a **human or AI/agent actually interacted with the lure**:

    KEPT (that is the fish):  SSH credential attempts (any user/pass)
                              commands typed into the Cowrie shell
                              AI-agent lure touches (/llms.txt, /agent-notes,
                                /archive, /api/v1/agent-ack)
                              crypto-value surface (/api/v1/balance, /withdraw,
                                /webhooks, /api/v1/export-seed honeytoken)
                              health (no access, container down, TLS expiry,
                                evidence reset)

    SUPPRESSED (counted into state, never sent — commodity machine noise):
                              C2/sinkhole hits on the planted ports
                              SSH connection waves / brute-force volume
                              "new attacking IP" churn
                              the first-run armed baseline

Empty stdout => the cron delivers nothing. Policy set by Gabriel 2026-09-15:
"stop sending me these messages, unless it's human or AI interactions".
See vault Hermes/Fluvia-Honeypot.md.

State: ~/.hermes/state/fluvia-watch/state.json
       (watermark, seen IPs, health, suppressed counters)
"""
import fcntl
import json
import os
import subprocess
import sys
from datetime import datetime, timezone

BOX = "root@68.183.29.202"
PORT = "64221"
SSH = "/usr/bin/ssh"
HOME = os.environ.get("HOME") or "/home/hermes"
KEY = os.path.join(HOME, ".ssh/id_ed25519")
REMOTE = "/root/fluvia-deploy/scripts/watch-summary.py"
STATE_DIR = os.path.join(HOME, ".hermes/state/fluvia-watch")
STATE_FILE = os.path.join(STATE_DIR, "state.json")
EPOCH = "1970-01-01T00:00:00Z"

CERT_WARN_DAYS = 15
CAP_LOGIN, CAP_CMD, CAP_AGENT, CAP_CRYPTO = 6, 6, 4, 4


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


def fetch(since):
    cmd = [SSH, "-i", KEY, "-p", PORT, "-o", "BatchMode=yes",
           "-o", "ConnectTimeout=12", "-o", "ServerAliveInterval=5",
           BOX, f"python3 {REMOTE} '{since}'"]
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
    data, err = fetch(since)

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
    seen_ips = set(state.get("seen_ips", []))
    attackers = set(data.get("attackers", []))
    suppressed = state.get("suppressed", {})       # cumulative, for the record
    silent_runs = int(state.get("silent_runs", 0))

    # --- commodity noise: count it, never send it -------------------------
    c2 = data.get("c2", [])
    suppressed["c2_hits"] = suppressed.get("c2_hits", 0) + len(c2)
    w1h, w15m = data.get("ssh_conns_1h", 0), data.get("ssh_conns_15m", 0)
    suppressed["ssh_conns_1h_last"] = w1h
    suppressed["ssh_conns_15m_last"] = w15m
    new_ips = sorted(attackers - seen_ips)
    suppressed["new_ips"] = suppressed.get("new_ips", 0) + len(new_ips)

    if first_run:
        # Baseline: arm silently. No message — Gabriel does not want one.
        state["watermark"] = newest
        state["seen_ips"] = sorted(seen_ips | attackers)
        state["suppressed"] = suppressed
        save_state(state)
        return

    alerts = []
    if recovered:
        alerts.append("✅ Acceso al honeypot restablecido")

    # --- SSH credential attempts (human or bot at the login prompt) -------
    logins = data.get("ssh_logins", [])
    for row in logins[:CAP_LOGIN]:
        kind = "ENTRÓ" if row["eventid"].endswith("success") else "falló"
        alerts.append(f"🔑 SSH {kind}: {row['user']}/{row['pass']} desde {row['ip']}")
    if len(logins) > CAP_LOGIN:
        alerts.append(f"   …y {len(logins) - CAP_LOGIN} intentos más")

    # --- commands typed inside the fake shell (the best tell) -------------
    for row in data.get("ssh_commands", [])[:CAP_CMD]:
        alerts.append(f"💻 Comando desde {row['ip']}: «{row['input'].strip()}»")

    # --- AI-agent lures ---------------------------------------------------
    def group(rows):
        agg = {}
        for row in rows:
            key = (row["ip"], row["path"])
            agg[key] = agg.get(key, 0) + 1
        return sorted(agg.items(), key=lambda kv: -kv[1])

    agent = group(data.get("agent_lures", []))
    if agent:
        for (ip, path), n in agent[:CAP_AGENT]:
            alerts.append(f"🤖 Señuelo de agente: {path} desde {ip} x{n}")
        if len(agent) > CAP_AGENT:
            alerts.append(f"   …y {len(agent) - CAP_AGENT} más")

    # --- crypto value surface --------------------------------------------
    crypto = group(data.get("crypto_probes", []))
    if crypto:
        for (ip, path), n in crypto[:CAP_CRYPTO]:
            flag = " (HONEYTOKEN)" if "export-seed" in path else ""
            alerts.append(f"💰 Superficie crypto: {path} desde {ip} x{n}{flag}")
        if len(crypto) > CAP_CRYPTO:
            alerts.append(f"   …y {len(crypto) - CAP_CRYPTO} más")

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

    state["watermark"] = max(newest, state.get("watermark", EPOCH))
    state["seen_ips"] = sorted(seen_ips | attackers)
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
