#!/usr/bin/env python3
"""Fluvia honeypot watcher (Run 2) — Hermes-side, no_agent cron.

Runs on the Hermes box. SSHes read-only into fluvia-rebuild, asks
`watch-summary.py` for the significant events since the last run, and prints a
short alert ONLY when there is something worth waking Gabriel for:

    C2 / sinkhole hits - SSH credential attempts - SSH commands - SSH waves
    AI-agent lure touches - crypto-value-surface probes - new attacking IPs
    health (containers, TLS cert, access, capture reset)

Empty stdout => the cron delivers nothing. Commodity web-scan noise is
suppressed on purpose. See vault Hermes/Fluvia-Honeypot.md.

State: ~/.hermes/state/fluvia-watch/state.json   (watermark, seen IPs, health)
"""
import fcntl
import json
import os
import subprocess
import sys
from datetime import datetime, timedelta, timezone

BOX = "root@68.183.29.202"
PORT = "64221"
SSH = "/usr/bin/ssh"
HOME = os.environ.get("HOME") or "/home/hermes"
KEY = os.path.join(HOME, ".ssh/id_ed25519")
REMOTE = "/root/fluvia-deploy/scripts/watch-summary.py"
STATE_DIR = os.path.join(HOME, ".hermes/state/fluvia-watch")
STATE_FILE = os.path.join(STATE_DIR, "state.json")
EPOCH = "1970-01-01T00:00:00Z"

WAVE_1H = 100          # external SSH connections in 60 min => wave
WAVE_15M = 25          # ... or 25 in 15 min => burst
CERT_WARN_DAYS = 15
CAP_C2, CAP_LOGIN, CAP_CMD, CAP_AGENT, CAP_CRYPTO, CAP_IP = 6, 6, 6, 4, 4, 8


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

    if first_run:
        # Baseline: say we are armed, then stay silent from here on.
        save_state({"watermark": newest, "seen_ips": sorted(seen_ips | attackers),
                    "health": "ok"})
        lines = ["🕷️ Fluvia (Run 2) — vigilante armado",
                 f"   evidencia: {counts.get('capture', 0)} HTTP · "
                 f"{counts.get('fakec2', 0)} sinkhole · "
                 f"{counts.get('cowrie', 0)} SSH",
                 f"   IPs atacantes conocidas: {len(attackers)}",
                 f"   ventana: {(data.get('oldest') or '?')[11:19]} → "
                 f"{(data.get('newest') or '?')[11:19]} UTC"]
        missing = data.get("containers", {}).get("missing", [])
        if missing:
            lines.append(f"   ⚠️ contenedores caídos: {', '.join(missing)}")
        days = data.get("cert_days_left")
        if days is not None:
            lines.append(f"   🔐 TLS caduca en {days} días")
        lines.append("   Silencio salvo C2, credenciales, oleada SSH, "
                     "señuelo de agente o superficie crypto.")
        out(lines)
        return

    alerts = []
    if recovered:
        alerts.append("✅ Acceso al honeypot restablecido")

    # --- C2 / sinkhole ---------------------------------------------------
    c2 = data.get("c2", [])
    if c2:
        for hit in c2[:CAP_C2]:
            preview = " ".join(hit["preview"].split())[:90]
            payload = f"«{preview}»" if preview else "(conexión sin payload)"
            alerts.append(f"🎯 Sinkhole C2: {hit['ip']} -> "
                          f"68.183.29.202:{hit['port']}  {payload}")
        if len(c2) > CAP_C2:
            alerts.append(f"   …y {len(c2) - CAP_C2} golpes más al sinkhole")

    # --- SSH -------------------------------------------------------------
    for row in data.get("ssh_logins", [])[:CAP_LOGIN]:
        kind = "ENTRÓ" if row["eventid"].endswith("success") else "falló"
        alerts.append(f"🔑 SSH {kind}: {row['user']}/{row['pass']} desde {row['ip']}")
    if len(data.get("ssh_logins", [])) > CAP_LOGIN:
        alerts.append(f"   …y {len(data['ssh_logins']) - CAP_LOGIN} intentos más")

    for row in data.get("ssh_commands", [])[:CAP_CMD]:
        alerts.append(f"💻 Comando desde {row['ip']}: «{row['input'].strip()}»")

    w1h, w15m = data.get("ssh_conns_1h", 0), data.get("ssh_conns_15m", 0)
    if w1h >= WAVE_1H or w15m >= WAVE_15M:
        top = ", ".join(f"{ip} {n}" for ip, n in
                        list(data.get("ssh_wave_top", {}).items())[:3])
        alerts.append(f"📡 Oleada SSH: {w1h} conns en la última hora "
                      f"({w15m} en 15 min)" + (f" — {top}" if top else ""))

    # --- lures -----------------------------------------------------------
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

    crypto = group(data.get("crypto_probes", []))
    if crypto:
        for (ip, path), n in crypto[:CAP_CRYPTO]:
            flag = " (HONEYTOKEN)" if "export-seed" in path else ""
            alerts.append(f"💰 Superficie crypto: {path} desde {ip} x{n}{flag}")
        if len(crypto) > CAP_CRYPTO:
            alerts.append(f"   …y {len(crypto) - CAP_CRYPTO} más")

    # --- new attacking IPs ----------------------------------------------
    new_ips = sorted(attackers - seen_ips)
    if new_ips:
        shown = ", ".join(new_ips[:CAP_IP])
        more = f" …+{len(new_ips) - CAP_IP}" if len(new_ips) > CAP_IP else ""
        alerts.append(f"🆕 IP nueva atacando ({len(new_ips)}): {shown}{more}")

    # --- health ----------------------------------------------------------
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
    state["last_run"] = now.isoformat()
    save_state(state)

    if alerts:
        out([f"🕷️ Fluvia (Run 2) — {len(alerts)} aviso(s)"] +
            [f"  {a}" for a in alerts])


if __name__ == "__main__":
    sys.exit(main())
