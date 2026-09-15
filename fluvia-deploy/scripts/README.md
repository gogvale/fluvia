# Watcher — "tell me only when something worth knowing happens"

Two halves. The **box half** reads the capture files; the **Hermes half** decides
whether to wake Gabriel. Commodity web-scanning noise is suppressed on purpose.

| File | Runs on | Role |
|---|---|---|
| `watch-summary.py <since-iso>` | the honeypot (`fluvia-rebuild`) | read-only; prints one JSON object of *significant* events newer than `<since>` |
| `fluvia-watch.py` | the Hermes box | `no_agent` cron, every 6 h; SSHes in, diffs against `~/.hermes/state/fluvia-watch/state.json`, prints an alert or nothing |
| `../../local/fluvia-tcpdump.service` | the honeypot | packet capture → `/var/log/tcpdump/cap.pcap{0..9}` (10 × 25 MB) |

## Install

```bash
# box half
scp watch-summary.py root@<lure>:/root/fluvia-deploy/scripts/watch-summary.py
# capture (AppArmor is in ENFORCE for usr.bin.tcpdump, so -Z root, and the dir
# must exist first — tcpdump will not create it)
ssh root@<lure> 'mkdir -p /var/log/tcpdump && chmod 0750 /var/log/tcpdump
  install -m644 /dev/stdin /etc/systemd/system/fluvia-tcpdump.service < fluvia-tcpdump.service
  systemctl daemon-reload && systemctl enable --now fluvia-tcpdump.service'

# Hermes half — script in ~/.hermes/scripts/, then:
#   cronjob action=create name="fluvia-watch (honeypot)" schedule="every 6h"
#     script=fluvia-watch.py no_agent=true deliver=origin
python3 ~/.hermes/scripts/fluvia-watch.py   # first run arms it and prints a baseline
```

## What fires

- 🎯 a real payload on a planted C2 port (`9001/8080/2535/6021`)
- 🔑 any SSH credential attempt, 💻 any command typed into Cowrie
- 📡 SSH wave: ≥100 external connections in 1 h, or ≥25 in 15 min
- 🤖 an AI-agent lure touched (`/llms.txt`, `/agent-notes`, `/archive`, `/api/v1/agent-ack`)
- 💰 the crypto-value surface probed (`/api/v1/balance`, `/withdraw`, `/webhooks`,
  `/api/v1/export-seed` — the last one is a honeytoken)
- 🆕 an attacking IP never seen before (sinkhole / SSH / lures only — not the HTTP crawl)
- ⚠️ health: container down, TLS cert <15 days, no SSH access, evidence file reset

Everything else — the endless `GET /` crawl with rotating user-agents — is counted
and dropped. First run after install prints a one-off "armed" baseline and then
stays silent.
