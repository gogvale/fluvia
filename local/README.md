# Fluvia lure — local test (podman + podman-compose, rootless)

FICTIONAL crypto on/off-ramp honeypot (Run 2). Every asset is a **señuelo**: no real
money, no real crypto, no real data. Two services:

- **fluvi-web** — Flask app (lure pages + admin + API + honeytokens) with a capture
  middleware → `./evidence/capture.jsonl`
- **cowrie** — SSH honeypot with the entropic-password filter (`userdb.txt`:
  `admin`/`Monero@2021`, `operator`/`Monero@2021`; accept-all OFF)

## Prereq — install podman (needs sudo ONCE; rootless after that)

```bash
sudo apt-get update && sudo apt-get install -y podman uidmap
# podman-compose is installed user-space (no sudo):
python3 -m venv ~/.local/share/podman-compose-venv
~/.local/share/podman-compose-venv/bin/pip install -q podman-compose
ln -sf ~/.local/share/podman-compose-venv/bin/podman-compose ~/.local/bin/podman-compose
```

> Why podman and not docker: no daemon, no `docker` group, runs fully rootless.
> Why sudo is unavoidable once: Ubuntu 24.04 restricts unprivileged user namespaces
> via AppArmor (`apparmor_restrict_unprivileged_userns=1`); the `podman` apt package
> ships the AppArmor `userns` profile that permits them. A user-space podman cannot.

## Run

```bash
cd /home/hermes/honeypot-crypto-r2/local
# prep (validated on a fresh droplet 2026-09-08): container non-root user needs write+read
mkdir -p cowrie/log evidence && chmod -R 777 cowrie/log evidence && chmod 644 cowrie/userdb.txt
podman-compose up -d --build
```

> Gotchas discovered by the droplet test (2026-09-08): (1) cowrie's log dir must be
> writable by the container user (else `PermissionError: cowrie.json`); (2) `userdb.txt`
> must be world-readable (600 after scp → auth crash); (3) **userdb.txt is parsed as
> ASCII — no em-dashes/non-ASCII in it** (UnicodeDecodeError → every login rejected).
> All three are fixed in the files + `fluvia-deploy/setup.sh`.

## Verify (attacker-simulation sequence)

```bash
# 1) commodity SSH (should FAIL — the control arm)
ssh -p 2222 root@127.0.0.1        # password 123456 → rejected

# 2) context-aware SSH (should SUCCEED — the signal)
sshpass -p 'Monero@2021' ssh -p 2222 admin@127.0.0.1 'uname -a'

# 3) web admin login with a typo → raw password captured
curl -s -X POST http://127.0.0.1:8000/admin/login \
  -d 'username=admin@fluvia.finance&password=qdmni2021'

# 4) withdraw sweep → withdraw_attempt {sweep:true}
curl -s -X POST http://127.0.0.1:8000/api/v1/withdraw -d 'amount=999999&dest_address=0xdead'

# 5) seed honeytoken touch → seed_touch
curl -s http://127.0.0.1:8000/wallet.json
curl -s http://127.0.0.1:8000/backup/recovery-phrase.txt
```

Inspect:

```bash
tail -f ./evidence/capture.jsonl          # web capture events
tail -f ./cowrie/log/cowrie.json          # ssh: login.failed vs login.success
```

Expected in `capture.jsonl`: `lure_content_read`, `auth_attempt` (raw `qdmni2021` typo),
`withdraw_attempt` (`sweep:true`), `seed_touch`, `api_call`.

## Clean up

```bash
podman-compose down -v
```

## Notes
- Cowrie `etc` mount path (`/cowrie/cowrie-git/etc/userdb.txt`) — verify on first `up`.
- `postgres` (Supabase stand-in) is a future addition; fake balances are in-memory.
- The app + capture middleware was validated independently of containers (venv run).
- podman-compose quirks: `restart: unless-stopped` and `build:` work, but if the
  `build` step misbehaves under podman-compose, fall back to `podman build` + manual `podman run`.
