# FLUVIA — local test (todo en 127.0.0.1, cero llamadas externas en runtime)

**Qué valida**: los COMPONENTES del Run 2 — lure web + captura + filtro entrópico SSH.
El Run 2 real NO usará contenedores (son un tell anti-detección) → el **camino B (venv)**
prueba los componentes exactos que correrán. El camino A (podman-compose) es opcional,
solo si quieres ver el stack en contenedores.

Después de la instalación (pulls de paquetes/imágenes, una vez), **todo corre en
127.0.0.1 y nada sale ni entra del host**: la simulación de atacante es curl/ssh a
localhost, el lure no tiene código que llame hacia afuera, Cowrie solo escucha.

---

## CAMINO B — venv (recomendado: cero sudo, prueba lo real)

```bash
cd ~/honeypot-crypto-r2/local

# 1) venv compartido (un solo pull de paquetes, ~1-2 min)
python3 -m venv venv
venv/bin/pip install -q flask cowrie

# 2) LURE WEB — terminal 1
EVIDENCE_DIR="$PWD/evidence" venv/bin/python fluvi-app/app.py
#   esperado:  * Running on http://127.0.0.1:8000

# 3) COWRIE SSH — terminal 2
mkdir -p cowrie-run && cd cowrie-run
../venv/bin/cowrie init
sed -i 's/^hostname = .*/hostname = fluvia-prod/' etc/cowrie.cfg
sed -i 's|^listen_endpoints = .*|listen_endpoints = tcp:2222:interface=127.0.0.1|' etc/cowrie.cfg
cp ../cowrie/userdb.txt etc/userdb.txt    # filtro entrópico: solo admin/operator + Monero@2021
../venv/bin/cowrie start                  # logs → cowrie-run/var/log/cowrie/cowrie.json
#   nota: auth_class = UserDB ya viene por defecto en el cfg generado (verificado 2026-09-07)
```

## SIMULACIÓN DE ATACANTE (terminal 3) — todo localhost

```bash
# --- web: toques del atacante (deben quedar en evidence/capture.jsonl) ---
curl -s -X POST http://127.0.0.1:8000/admin/login \
  -d 'username=admin@fluvia.finance&password=qdmni2021'          # typo → password cruda
curl -s -X POST http://127.0.0.1:8000/api/v1/withdraw \
  -d 'amount=999999&dest_address=0xdead'                          # sweep
curl -s http://127.0.0.1:8000/wallet.json                         # seed_touch
curl -s http://127.0.0.1:8000/backup/recovery-phrase.txt          # seed_touch

# logs web (desde ~/honeypot-crypto-r2/local/):
tail -f evidence/capture.jsonl

# --- ssh: filtro entrópico ---
ssh -p 2222 root@127.0.0.1                # password 123456 → REJECTED (control commodity)
ssh -p 2222 admin@127.0.0.1               # password Monero@2021 → shell falso (señal context-aware)
# logs ssh (desde cowrie-run/):
tail -f var/log/cowrie/cowrie.json        # login.failed vs login.success + comandos
```

**Qué debes ver** en `capture.jsonl`: eventos `auth_attempt` (con `qdmni2021` crudo),
`withdraw_attempt` con `sweep:true`, `seed_touch` ×2. En `cowrie.json`: un `login.failed`
para `123456` y un `login.success` para `Monero@2021`.

## Cleanup (camino B)

```bash
# Ctrl+C en terminal 1 y 2, luego:
cd ~/honeypot-crypto-r2/local && rm -rf venv cowrie-run
```

---

## CAMINO A — podman-compose (opcional; sudo una vez; contenedores)

```bash
# 1) runtime (sudo, una vez)
sudo apt-get update && sudo apt-get install -y podman uidmap

# 2) podman-compose (user-space)
python3 -m venv ~/.local/share/podman-compose-venv
~/.local/share/podman-compose-venv/bin/pip install -q podman-compose
ln -sf ~/.local/share/podman-compose-venv/bin/podman-compose ~/.local/bin/podman-compose

# 3) build + up (pulls de imagen aquí, una vez)
cd ~/honeypot-crypto-r2/local
podman build -t fluvi-web ./fluvi-app
podman-compose up -d
podman ps                        # fluvi-web + fluvi-cowrie
# puertos SOLO en 127.0.0.1 (ya está así en docker-compose.yml)

# simulación: mismos curls + ssh de arriba; logs en ./evidence/ y ./cowrie/log/
tail -f evidence/capture.jsonl
tail -f cowrie/log/cowrie.json

# cleanup
podman-compose down -v
```

## Notas
- El compose bindea 8000/2222 solo a 127.0.0.1 → nada externo alcanza el test.
- Si `podman-compose up` falla en el build, haz `podman build -t fluvi-web ./fluvi-app` y
  luego `podman run -d --name fluvi-web -p 127.0.0.1:8000:8000 -v $PWD/evidence:/evidence -e EVIDENCE_DIR=/evidence fluvi-web`
  (y el contenedor de cowrie con `podman run` equivalente + volumes de userdb/log).
