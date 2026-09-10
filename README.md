# Fluvia — crypto on/off-ramp lure + honeypot tooling

Working repository for the second run of a public honeypot experiment: a fictional
stablecoin on/off-ramp ("Fluvia", stablecoins for LATAM) exposed to the open internet,
with the capture layer that documents what attacks it.

The lure is a deliberately ordinary-looking Next.js app. Underneath it: a Cowrie SSH
honeypot, a fake-C2 responder, agent-facing bait pages, and a passive classification
layer (JA3/JA4 + credential scoring + session statistics).

## Layout

| Path | What it is |
|---|---|
| `01-06-*.md` | Design docs: niche, architecture, honeypot adaptation, visual theme, founder story, vibecoding-risk research |
| `lure/` | The Next.js lure app (dev tree) |
| `fluvia-deploy/` | Turnkey docker bundle: `setup.sh` provisions a fresh droplet in one command |
| `local/` | Local test harness (Flask capture middleware + Cowrie) |
| `fluvia-deploy/README-FEATURES.md` | The three deeper-signal layers and how to run them |

## Credentials

**Everything here is fake and exists to be attacked.** API keys, wallet addresses, the
recovery phrase, the admin accounts and the SSH passwords are placeholders. There are no
real credentials, tokens or secrets in this repository — no cloud keys, no DNS provider
credentials, no private keys. The operational secrets for the experiment live outside
this repository and are never committed.

## Running the bundle

```bash
scp -r fluvia-deploy root@<host>:/root/
ssh root@<host> 'cd /root/fluvia-deploy && bash setup.sh'
bash verify-features.sh     # 18-check acceptance battery
bash scripts/analyze.sh     # credential + session + TLS-fingerprint analysis
```
