# Watcher — "tell me only when something worth knowing happens"

Two halves. The **box half** reads the capture files; the **Hermes half** decides
whether to wake Gabriel. Commodity web-scanning noise is suppressed on purpose.

| File | Runs on | Role |
|---|---|---|
| `watch-summary.py <since-iso>` | the honeypot (`fluvia-rebuild`) | read-only; prints one JSON object of *significant* events newer than `<since>`, plus `pipeline_mtime` (freshness of the derived artifacts) |
| `analyze-cron.sh` | the honeypot | refreshes the classification layer — `score_creds.py` → `cred_scores.jsonl`, `sessionize.py` → `sessions.jsonl`, `extract_ja3.py` → cumulative `ja3.jsonl` (~10 s) |
| `../../local/fluvia-analyze.{service,timer}` | the honeypot | runs `analyze-cron.sh` hourly (Nice=19, CPUQuota=60%); **nothing else schedules the scorers** |
| `fluvia-watch.py` | the Hermes box | `no_agent` cron, every 6 h; SSHes in, diffs against `~/.hermes/state/fluvia-watch/state.json`, prints an alert or nothing |
| `../../local/fluvia-tcpdump.service` | the honeypot | packet capture → `/var/log/tcpdump/cap.pcap{0..9}` (10 × 25 MB) |

## Install

```bash
# box half
scp watch-summary.py analyze-cron.sh root@<lure>:/root/fluvia-deploy/scripts/
scp fluvia-analyze.service fluvia-analyze.timer root@<lure>:/tmp/
ssh root@<lure> 'chmod +x /root/fluvia-deploy/scripts/analyze-cron.sh
  install -m644 /tmp/fluvia-analyze.{service,timer} /etc/systemd/system/
  systemctl daemon-reload && systemctl enable --now fluvia-analyze.timer
  systemctl start fluvia-analyze.service'   # run once so there is data to watch
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

**The scorers are not self-starting.** They were run once by hand at deploy time
(2026-09-15 06:07) and then sat frozen for eight days while the lure kept capturing —
a stale `sessions.jsonl` is indistinguishable from a quiet lure. That is what the
timer and the `pipeline_mtime` health line exist to prevent.

## What fires

Policy v2 (2026-09-18) + the behavioural lane (2026-09-23):

- 🎉 any SSH login that **succeeded** (uncapped — it is *the* signal)
- 💻 any command typed into the Cowrie shell
- 🤖 an AI-agent lure touched (`/llms.txt`, `/agent-notes`, `/archive`, `/api/v1/agent-ack`)
- 🕸️ an AI crawler touching the lure at all, reported once per (family, path) pair —
  so the sequence *first sitemap → first llms.txt* stays visible
- 💰 the crypto-value surface probed (`/api/v1/balance`, `/withdraw`, `/webhooks`,
  `/api/v1/export-seed` — the last one is a honeytoken)
- 🧠 a web session whose **behaviour** scores ≥ 30 on `sessionize.py`'s agentic scale
  (followed the hidden agent surface, stepped the maze, touched the honeytoken, moved
  like an agent instead of a scanner). One line per session ever, keyed `ip|first`
- 🔑 a *first-ever-seen* IP, one line only if it looks like a person or a targeted
  actor (≤5 attempts, an AI-era username, or a crypto-context username)
- ⚠️ health: container down, TLS cert <15 days, no SSH access, evidence file reset,
  **classification pipeline frozen** (a derived artifact older than 6 h)

Everything else — dictionary/brute-force campaigns, repeat IPs, sinkhole hits,
crawler re-reads, the endless `GET /` crawl with rotating user-agents — is counted
into `state.suppressed` and dropped; any run that does alert closes with one
`📊 Omitido:` context line. First run after install arms silently.
