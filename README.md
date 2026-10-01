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

## Use it, fork it, run your own

This was built to be reused. Everything needed to stand up your own lure is here: the fake
app, the Cowrie layer, the fake-C2 responder, the bait pages, the classification scripts and
the operator timers. Read `01-06-*.md` first — the design docs explain what each piece is for
and what the experiment is trying to answer — then `fluvia-deploy/README-FEATURES.md` for the
signal layers, then `setup.sh` if you want the whole thing on a fresh box.

Three rules come with it, and they are not decoration.

- **Only ever point it at yourself.** A lure logs whoever attacks it; it never attacks back.
- **Keep the egress lock on.** The box must not become a launchpad. The sinkhole answers
  traffic that was already attacking you — that is the entire licence for answering it.
- **No third-party personal data in your writeups.** Addresses of the people who knock stay
  in your private notes; publish behaviour and the class of infrastructure instead.

Bug reports, better detectors and pull requests are welcome. If you run your own version I
would like to hear what walked in.

## Licence

MIT for the tooling and the lure. The design docs and the fictional brand assets are part of
this repository and covered by the same licence.
