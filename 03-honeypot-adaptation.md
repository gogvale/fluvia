# Adaptación del honeypot — Run 2 (lure de negocio cripto) + plan de prueba local

> **Estado:** diseño. **Autor:** subagente de diseño (Hermes). **Fecha:** 2026-09-07.
> **Origen del contexto:** skill `honeypot-ops` — `SKILL.md`, `references/honeypot-protocol.md`,
> `references/run-findings.md`, `references/attacker-census-day1.md`.
> **Reglas duras (heredadas, no negociables):** cero secretos/fondos/datos reales en el box ·
> egress bloqueado (solo DNS/NTP salen) · evidencia fuera del box · nunca revelar la identidad del lure
> (regla de "jactancia"). Run 2 es una **instancia nueva** (nuevo droplet/dominio/proveedor de ser posible):
> **NO tocar 137.184.54.123** (Run 1 sigue byte-stable). Este documento cubre solo diseño + prueba local.

---

## 0. Qué cambia de Run 1 a Run 2 (marco de la adaptación)

| Dimensión | Run 1 (Cotton Sky) | Run 2 (negocio cripto) |
|---|---|---|
| Lure | E-commerce textil WooCommerce | Negocio cripto ficticio ("OTC desk / payment processor") |
| Valor percibido | Datos de clientes / tarjetas | **Wallets, seeds, fondos** — atrae wallet-drainers, skimmers, miners, ransomware casing |
| SSH | Cowrie **accept-all** (toda password "éxito") | Cowrie **userdb realista + password entrópica** (filtro context-aware) |
| Captura creds web | mu-plugin `cs-core-helpers.php` (WP) | middleware/decorator de auth en app **Node/TS** (Next.js/Express, mismo patrón) |
| Filtro de ruido | Ninguno (mide TODO el ruido = control) | **Sí** — solo loguean actores que leen el sitio |
| Objetivo primario | Medir volumen/noise (H1, H4) | Cazar la cola (H2), re-testar H1 en segundo lure, H3 |
| Población diana | Commodity bots | shopper/mapper class + wallet-drainers + skimmers (ver `run-findings.md` → "WHO RUN 2 SHOULD OPTIMIZE FOR") |
| Control arm | — | mdrfckr, stuffer, xmlrpc, Go bots (wordlist-based, jamás aciertan la password entrópica) |

**Hipótesis que Run 2 testea (del protocolo):**
- **H2** (cola AI/targeting): el filtro entrópico ES el instrumento — cualquier login SSH "exitoso"
  es, por construcción, un actor context-aware. Se mide además la tasa de referencia al lure
  (payloads/creds que mencionan la marca, la moneda, el año de fundación).
- **H3** (pasa los anti-honeypot checks): Run 2 sube la fidelidad (quita los tells de Run 1:
  accept-all, host key default, banner). Tier 2 pass obligatorio, Tier 3 stretch.
- **H1** (lure-blind): se re-testa en un segundo vertical; el filtro separa el ruido (que se sigue
  midiendo como *failed logins*) de la señal.
- **Reproducibilidad del descubrimiento mecánico:** ¿las mismas familias descubren el box 2 con
  el mismo timing (0.1 s IP / ~1.5 h CT)?

---

## 1. Superficies de captura del lure cripto

**Ficción base (LOCKED en `01-niche-pitch.md` y `05-founder-story.md`; byte-stable tras lanzar).**
Marca: **Fluvia** (el placeholder "Aurora Vault" de esta sección queda obsoleto) — on/off-ramp de
stablecoins (USDC/USDT) para LATAM, fundada **2021** en CDMX, fundador **Diego Arévalo** (crypto-bro
no-técnico que vibe-codeó la app con Claude). El sitio acepta **USDC/USDT** y — guiño del founder a
sus raíces privacy-coin — también **Monero (XMR)**: esa mención es la pista "moneda" de la password
SSH (`Monero@2021`, §2.4). (Nombre, moneda e historia cerrados en el story bible; lo importante es la
COHERENCIA interna — un solo vertical, sin artefactos mixtos, decisión D1 del protocolo.)

Regla de oro del diseño de superficies: **cada superficie es un honeytoken de intención.** El
toque de un archivo o endpoint NO es un "404 más": es una lectura de intención (qué quiere el actor).
Por eso cada superficie tiene un `event` dedicado y un *signal tag* (señal H2 o control).

### 1.1 Página pública (`/`, `/about`, `/pricing`, `/how-to-buy`, `/terms`)
**Qué es:** pitch del negocio, tabla de comisiones, "aceptamos USDC/USDT — y Monero, el guiño del
founder — no KYC", página About
con **año de fundación** y **nombre del fundador** (las pistas de la password entrópica viven AQUÍ),
footer `© 2021–2026`, y una página de "operador/legacy access" con una nota sutil (segunda pista).

**Qué loguear:**
- `http_access` para toda request (ts, ip, ua, método, path, referer, status).
- **Qué páginas lee y en qué orden** (¿lee About/pricing ANTES de atacar? = señal de navegación
  agentic/context-aware, el "shopper" pattern de Run 1). Los paths About/pricing/how-to-buy se
  etiquetan como `lure_content_read`.
- **Referencia al lure en payloads:** si un request lleva `?q=Fluvia`, `Host: fluvia...`, o
  credenciales con el nombre del negocio → contador `lure_reference` (discriminador H1/H2).

### 1.2 Admin panel falso (`/admin/login`, `/admin/dashboard`, `/admin/backup`, …)
**Qué es:** login de administrador, dashboard con **balance falso del vault**, botón "exportar
seed/backup", lista de usuarios, ajustes. (En Run 2 NO es WordPress: es una app **Node/TS
(Next.js)** vibe-codeada, así que el admin es un set de rutas propias — el punto de entrada que
el mapper/stuffer intentará forzar.)

**Qué loguear:**
- `auth_attempt` con **RAW password** (igual que el mu-plugin de Run 1, ver §2.1). Preservar typo
  = prueba de fidelidad. Campos: ts, ip, ua, user, raw_pass, outcome.
- `auth_success` / `auth_fail`.
- `admin_action` post-login: qué secciones visita, si pulsa "export seed", si cambia la wallet de
  retiro, si lista usuarios. (El post-login ES la cola que Run 2 quiere ver.)

### 1.3 API (`/api/v1/...`: `rates`, `balance`, `deposit`, `withdraw`, `webhooks`)
**Qué es:** API "pública" del negocio: cotizaciones, saldo, depósito, retiro, webhooks entrantes.
Es la superficie que un atacante orientado a cripto sondeará (objeto JSON = superficie de ataque).

**Qué loguear:**
- `api_call` para cada hit: ts, ip, ua, método, path, auth (token/Basic crudo), parámetros, cuerpo
  relevante (monto, `dest_address`, moneda), y **orden de consulta** (recon de API: ¿rates →
  balance → withdraw?).
- `withdraw_attempt` (ALTA señal): monto, moneda, `dest_address`, `sweep` (bool: ¿intentó vaciar
  todo el balance?). **El retiro NUNCA se ejecuta** — se loguea y devuelve `{"status":"queued"}`
  o un error plausible (ver §2.2).
- `webhook_attempt`: webhooks falsos (firma inválida, replay) = intento de abusar el endpoint.

### 1.4 Archivo seed-hint de señuelo (honeytoken)
**Qué es:** un `wallet.json` / `backup/wallet-restore.txt` alcanzable por web (p. ej. `/backup/`,
`/.wallet`, `/wallet.json` — el path que el **.env/secret scanner** de Run 1 encontró una y otra vez)
que contiene una **mnemonic BIP39 de 12 palabras FALSA** (palabras válidas, cero fondos) + un hint.
**Segunda copia** dentro del admin panel ("export backup") como bait post-login.

**Qué loguear:**
- `seed_touch` (ALTA señal): ts, ip, ua, path, cómo lo encontró (¿path traversal `%2e%2e`? ¿API?
  ¿admin export?). La mnemonic es única por actor-path → si aparece después en otro lado (no lo
  veremos, pero el *touch* + lo que hace acto seguido) delata intención.
- **Decisión de diseño:** el seed-hint revela la MNEMONIC (fake), **NO** la password SSH. Así hay
  dos discriminadores independientes: (a) SSH success = lector del sitio; (b) seed_touch = diver
  de archivos/recon. No mezclarlos.

### 1.5 Wallet falsa con balance falso (honeytoken de fondos)
**Qué es:** una dirección XMR + una USDC **falsas** (formato sintácticamente correcto, derivadas de
una seed desechable que **nadie controla ni fondeará jamás**), con un balance tentador en el
dashboard y en `/api/v1/balance` (p. ej. `42.3 XMR` / `1,250.75 USDC`).

**Qué loguear:**
- `balance_query`: quién consulta el saldo y en qué secuencia.
- `withdraw_attempt` con `sweep=true` (intento de drenar el vault = la acción "robo de wallet").
- `wallet_touch`: lectura del archivo de wallet / de la key.
- **Regla dura:** las direcciones/mnemonic son 100% ficticias, marcadas internamente como decoys;
  nunca se les deposita nada real ni se usan para nada real.

### 1.6 SSH (Cowrie) — la superficie "shell"
**Qué es:** el shell falso en `:22`. **Qué loguear:** `cowrie.json` completo (login success/fail,
comandos post-login, `direct-tcpip`, descargas). En Run 2 el **login success es raro y es oro**
(ver §2.4). Los `login failed` son el **control** (el ruido commodity que Run 1 ya midió a fondo).

### Resumen de señales por superficie

| Superficie | Evento principal | Señal | Signal tag |
|---|---|---|---|
| Página pública | `http_access` + `lure_content_read` | navegación context-aware | H2 tail |
| Admin panel | `auth_attempt` (raw pass), `admin_action` | creds + post-login | H2 tail |
| API | `api_call`, `withdraw_attempt`, `webhook_attempt` | recon + robo | H2 tail |
| Seed-hint | `seed_touch` | intención de robo de seed | honeytoken |
| Wallet | `balance_query`, `wallet_touch`, `withdraw_attempt(sweep)` | intención de drenar fondos | honeytoken |
| SSH | `login failed` (control) / `login success` + comandos (señal) | filtro entrópico | H2 discriminator |

---

## 2. Instrumentación

### 2.1 Captura de credenciales web (patrón mu-plugin adaptado a app Node/TS)

**Run 1:** mu-plugin `cs-core-helpers.php` (camuflado, invisible, NO parte del lure) hookea
`wp_authenticate` → loguea `{ts, ip, ua, user, RAW pass}` a `/var/log/wp-auth.log`. Es la ÚNICA
vía de ver passwords web (HTTPS = pcap inútil; Caddy no loguea cuerpos).

**Run 2 (app Node/TS — Next.js App Router):** el mismo patrón se convierte en un
**middleware/decorador** camuflado como "request auditor / rate-limiter" (NO es parte del lure).
Intercepta (i) el route-handler `POST /admin/login`, (ii) `POST /api/v1/auth/login`, y (iii)
cualquier header `Authorization: *` en la API. Escribe JSONL a `logs/crypto-auth.log` (en prod:
`/var/log/crypto-auth.log`).

```typescript
// lib/audit.ts  (camuflado como "request auditor / rate-limiter" — NO es parte del lure)
import { appendFileSync } from "node:fs";
import type { NextRequest } from "next/server";

const AUTH_LOG = process.env.CRYPTO_AUTH_LOG ?? "logs/crypto-auth.log";

type Surface = "admin" | "api";
type Outcome = "ok" | "fail";

export function line(ev: Record<string, unknown>) {
  appendFileSync(AUTH_LOG, JSON.stringify(ev) + "\n");
}

export function clientMeta(req: NextRequest) {
  return {
    ip: req.headers.get("x-forwarded-for") ?? "127.0.0.1",
    ua: req.headers.get("user-agent") ?? "",
    method: req.method,
    path: req.nextUrl.pathname,
  };
}

export function recordAuth(opts: {
  user: string; rawPass: string; authHeader: string;
  outcome: Outcome; surface: Surface; req: NextRequest;
}) {
  // rawPass SIEMPRE sin normalizar (preserva typo)
  line({ ts: Date.now() / 1000, event: "auth_attempt", ...clientMeta(opts.req),
         user: opts.user, raw_pass: opts.rawPass,           // <-- raw, typo incluido
         auth_header: opts.authHeader,                       // <-- token/Basic crudo (API)
         outcome: opts.outcome, surface: opts.surface });
}
```

```typescript
// app/admin/login/route.ts  (captura user+pass ANTES de validar)
import { NextRequest, NextResponse } from "next/server";
import { recordAuth } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const user = body.username ?? body.email ?? "";
  const rawPass = body.password ?? "";
  // ... validar contra la userdb del lure (creds default deducibles, ver 02 §3.5) ...
  const ok = user === "admin@fluvia.finance" && rawPass === "Fluvia2021!";
  recordAuth({ user, rawPass, authHeader: req.headers.get("authorization") ?? "",
               outcome: ok ? "ok" : "fail", surface: "admin", req });
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ ok: false }, { status: 401 });
}
```

- **Fidelidad raw:** el typo se conserva (prueba de captura idéntica a la de Run 1 — `qdmin`).
- **Superficies múltiples:** en Run 1 había una sola superficie de login (wp-login + xmlrpc).
  Aquí hay dos (admin + API) y además la autenticación por token de la API → el header crudo
  también se captura (los tokens robados/adivinados son señal de intención).
- **Contador `lure_reference`:** si `user` o `rawPass` contienen la marca/moneda/año (p. ej.
  "Fluvia", "monero", "2021"), se marca → es el discriminador H2 de credenciales.

### 2.2 Log de intentos de retiro / robo de wallet

- El endpoint `POST /api/v1/withdraw` **no ejecuta nada real** (no hay fondos; en prod el egress
  ya está bloqueado). Loguea el intento completo y devuelve `{"status":"queued"}` (o un error
  plausible tipo "insufficient confirmations") para no romper la ilusión.
- **Regla de tagging:** `sweep = (amount >= balance_total * 0.95)` → marca el intento de drenar
  todo el vault (la acción "robo de wallet"). `dest_address` se loguea SIEMPRE (es el payoff del
  intel: a dónde iría el dinero).
- Mismo patrón para `deposit` (un depósito de "prueba" a una dirección falsa = actor que verifica
  que la billetera "vive") y para `balance` (recon de fondos).

```typescript
// app/api/v1/withdraw/route.ts  (ruta withdraw)
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { clientMeta, line } from "@/lib/audit";
import { FAKE_BALANCE } from "@/lib/fake_vault";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const amt = body.amount ?? 0; const cur = body.currency; const dest = body.address;
  const sweep = (amt || 0) >= (FAKE_BALANCE[cur] ?? 0) * 0.95;
  line({ ts: Date.now() / 1000, event: "withdraw_attempt", ...clientMeta(req),
         amount: amt, currency: cur, dest_address: dest, sweep });
  return NextResponse.json({ status: "queued", id: randomUUID().slice(0, 8) }); // nunca mueve nada
}
```

### 2.3 auditd / Falco post-login (capa de host, igual que Run 1)

En **producción** (droplet Run 2) se reutiliza el stack de watchers de Run 1, re-apuntado al
nuevo árbol de la app:

- **auditd** (`/etc/audit/rules.d/fluvia.rules`):
  - `-w /srv/fluvia/app -p wa -k app_write`
  - `-w /srv/fluvia/app/backup -p wa -k seed_touch`  (el seed-hint)
  - `-w /srv/fluvia/app/wallet.json -p wa -k wallet_touch`
  - `-a always,exit -S execve -k proc_exec`
  - `-a always,exit -S connect -k outbound_connect`
  - Aplicar con `augenrules --load && systemctl restart auditd`.
  - **Gotcha Run 1:** el watch `-w <dir> -p wa` NO dispara para escrituras *debajo* del dir —
    usar watches explícitos por archivo (seed/wallet) y por subdirectorio, no solo el dir raíz.
- **Falco** (`falco-modern-bpf`, reglas por defecto + 2 custom): (i) "archivo del árbol de la app
  leído/abierto por un proceso que NO es el servidor web" (webshell leyendo seed/wallet);
  (ii) "proceso spawneado por el usuario del servidor web" (RCE post-login). Logs vía
  `journalctl -u falco-modern-bpf`.
- **egress lockdown** (`nftables`, como Run 1): OUTPUT solo established/lo/DNS/NTP, resto
  `EGRESS-DROP` + log. Los intentos de C2/exfil quedan contados.

En la **prueba local** (esta máquina, sin sudo) estos watchers de host **no se ejercitan** — se
simulan/omiten; el plan local valida la capa de app (logs JSONL) + Cowrie, que es lo que necesita
verificación inmediata. auditd/Falco se validan en el droplet (misma receta que Run 1, ya probada).

### 2.4 Cowrie SSH con el filtro de password entrópica (mecánica exacta)

**Problema que resuelve:** Run 1 usaba **accept-all** (toda password "éxito") — un tell de
honeypot Tier-1 que desengancha a actores sofisticados, y que además ensucia la señal con ruido
commodity. Run 2 quiere **quitar ruido para agarrar los peces mayores** (Gabriel).

**El filtro (3 piezas):**

1. **Las pistas viven en el sitio público.** El story bible define fragmentos-plantilla en la
   página pública: la **moneda** (Monero/XMR) en el hero, el **año de fundación** (2021) en About
   y footer, y el **nombre del operador** en la nota "legacy access". Son datos que un lector
   humano del sitio ve y combina.

2. **Una regla de derivación interna (documentada, NO publicada).** Combina las pistas en una
   cadena con entropía suficiente para NO aparecer en rockyou/secLists. Ejemplo (placeholder):
   `password = "<moneda>@<año>"` → **`Monero@2021`**. (La regla es natural: "el fundador usó la
   moneda + el año" — es el tipo de password que un humano *adivina* leyendo el sitio, y que un
   diccionario *jamás* contiene.)

3. **Cowrie con userdb realista en vez de accept-all.** `etc/userdb.txt` lista un puñado de
   cuentas plausibles cuyo password ES la cadena derivada:

   ```
   # etc/userdb.txt  (Cowrie userdb — password entrópica derivada del sitio)
   admin:x:Monero@2021        # el usuario que todo spray prueba
   operator:x:Monero@2021     # handle del "operador" (segunda pista del sitio)
   ```

   **Resultado:** todo intento con password distinta de `Monero@2021` → `login failed` (se loguea
   igual: es el **control**, el ruido commodity ya medido en Run 1). Solo `Monero@2021` → `login
   succeeded` → shell falso → comandos post-login logueados. **El login "exitoso" es, por
   construcción, un actor que leyó el sitio** (o lo encontró por otra vía — lo cual también es
   señal).

**Por qué el filtro es SOLO de password (no de username):** mantener `admin`/`root`/`operator`
como usuarios sprayables preserva el brazo de control — los bots commodity SIGUEN intentando (y
fragmentan el ruido en `login failed`), mientras la señal (login success) queda limpia. Si
además ocultáramos el username, los bots ni intentarían y perderíamos la comparación.

**Verificaciones pre-lanzamiento (obligatorias, del anti-detection de Run 1 + el filtro):**
- **Host key SSH única** (nunca la default de Cowrie): `ssh-keygen -t ed25519 -f cowrie.key` →
  `etc/cowrie.cfg` apunta a ella. **No reusar** la host key de Run 1 (independencia cross-run,
  caveat registrado en `run-findings.md`).
- **Banner + KEX = OpenSSH real** (fingerprint HASSH): servidor-side debe imitar OpenSSH, no el
  default de Cowrie (el default es un tell documentado).
- **`grep -i "monero@2021" rockyou.txt secLists/...` → vacío.** Confirmar que la password NO está
  en las listas commodity (si estuviera, el filtro se rompe). Este es un paso del plan local (§3).
- **Regla de derivación LOCKED en el story bible** antes de lanzar — es lure content → byte-stable.

**Trade-off aceptado (registrado):** Run 2 tendrá **casi cero** SSH "successes". Es POR DISEÑO:
Run 1 ya midió el ruido; Run 2 mide la cola. Un solo success context-aware en 30 días = el dato H2.

---

## 3. Plan de prueba local (paso a paso, esta semana)

### 3.0 Entorno de ESTA máquina (verificado 2026-09-07)

| Recurso | Estado | Consecuencia |
|---|---|---|
| docker | ❌ no instalado | levantar la app con **Node** directamente (no docker-compose) |
| sudo | ❌ pide password | **sin root** → puertos altos (8000/2222), sin auditd/Falco |
| php/LAMP | ❌ no instalado | app web en **Node/TS** (Express/Next.js), no PHP |
| node / npm | ✅ v22.23 / 10.9 | base para la app Node/TS |
| python3 / venv + pip | ✅ 3.11.15 / pip 24.0 | solo para **Cowrie** (es Python) |
| red a npm + PyPI | ✅ (200) | `npm install` y `pip install` funcionan |

**Conclusión:** la prueba local se monta con **Node + TypeScript (web/admin/API) + Cowrie
(via git + venv Python)**. Docker-compose queda como alternativa futura SOLO si algún día hay
docker; hoy no es la vía. El patrón local es fiel al patrón prod (misma lógica de instrumentación,
mismos archivos de log JSONL), solo que sin la capa de host (auditd/Falco/egress) que requiere root.

### 3.1 Estructura de directorios (todo bajo `~/honeypot-crypto-r2/local/`)

```
~/honeypot-crypto-r2/local/
├── app/                        # la app Node/TS (lure + admin + API) — Express + TS
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── server.ts           # bootstrap Express (puerto 8000)
│       ├── audit.ts            # middleware de captura (camuflado, escribe JSONL)
│       ├── routes_public.ts    # /, /about, /pricing, ...
│       ├── routes_admin.ts     # /admin/login, /admin/dashboard, /admin/backup
│       ├── routes_api.ts       # /api/v1/{rates,balance,deposit,withdraw,webhooks}
│       ├── fake_vault.ts       # direcciones/mnemonic FALSAS + balance falso
│       └── data/
│           ├── wallet.json     # honeytoken (mnemonic BIP39 falsa)
│           └── backup/wallet-restore.txt   # honeytoken (copia)
├── cowrie/                     # clone de Cowrie (venv Python propio)
├── logs/                       # evidencia local (JSONL)
│   ├── crypto-access.log
│   ├── crypto-auth.log
│   └── cowrie/                 # cowrie.json
├── scripts/
│   ├── run_app.sh
│   ├── run_cowrie.sh
│   └── verify.sh               # simula atacante + confirma captura
└── evidence/                   # "off-box" local: copia diaria de logs (export)
```

### 3.2 Paso 1 — deps de la app Node/TS

```bash
cd ~/honeypot-crypto-r2/local/app
npm init -y
npm install express typescript tsx @types/express @types/node
# (tsx corre TS directo sin build; 'ts-node' también sirve)
```

### 3.3 Paso 2 — levantar Cowrie (filtro entrópico) en :2222

```bash
cd ~/honeypot-crypto-r2/local
git clone https://github.com/cowrie/cowrie.git
cd cowrie
python3 -m venv cowrie-env
source cowrie-env/bin/activate
pip install -r requirements.txt
# host key única (anti-detection)
ssh-keygen -t ed25519 -f var/keys/ssh_host_ed25519_key -N ""
# userdb con la password entrópica (reemplaza el accept-all)
printf 'admin:x:Monero@2021\noperator:x:Monero@2021\n' > etc/userdb.txt
# config: puerto alto (sin root), banner OpenSSH-real, apuntar a la host key
cp etc/cowrie.cfg.dist etc/cowrie.cfg
#   -> [ssh] listen_endpoints = tcp:2222:interface=0.0.0.0
#   -> hostname / banner / ssh_host_ed25519_key -> la key generada
# arrancar en foreground (sin systemd; ver gotcha Run 1: usar twistd, no 'cowrie start -n')
bin/cowrie start          # o: bin/twistd -n cowrie   (foreground para ver logs)
```

> **Gotchas heredados de Run 1:** (1) arranque con `twistd -n cowrie`, no `cowrie start -n`;
> (2) en local sin root no se puede bindear `:22` → usar `:2222` (el filtro no depende del puerto,
> solo del userdb); (3) log JSONL en `cowrie/var/log/cowrie/cowrie.json`.

### 3.4 Paso 3 — la app Node/TS (lure + admin + API + honeytokens)

Esqueleto mínimo (el `audit.ts` de §2.1/§2.2 ya cubre la captura). En prod esto es el **Next.js
(App Router)** vibe-coded; para la prueba local se usa un **Express + TypeScript** mínimo que
reproduce la MISMA lógica de instrumentación y el mismo contrato JSONL:

```typescript
// src/server.ts
import express from "express";
import { auditMiddleware } from "./audit";
import { routesPublic } from "./routes_public";
import { routesAdmin } from "./routes_admin";
import { routesApi } from "./routes_api";
// fake_vault.ts define FAKE_BALANCE, FAKE_MNEMONIC (12 palabras BIP39 falsas),
// FAKE_USDC_ADDR, FAKE_XMR_ADDR (formato correcto, cero fondos).

const app = express();
app.use(express.json());
app.use(auditMiddleware);   // http_access a crypto-access.log (camuflado)
app.use(routesPublic);
app.use(routesAdmin);
app.use(routesApi);
app.listen(8000, "127.0.0.1");
```

- **Público:** `/` (hero "aceptamos USDC/USDT — y Monero, el guiño del founder — no KYC"), `/about`
  (fundado 2021 + fundador Diego Arévalo), `/pricing`, `/how-to-buy`, `/terms`, footer `© 2021–2026`.
- **Admin:** `/admin/login` (captura raw pass via `audit.recordAuth`), `/admin/dashboard`
  (balance falso + botón "export seed"), `/admin/backup` (sirve la mnemonic falsa = honeytoken).
- **API:** `/api/v1/rates`, `/balance` (`balance_query`), `/deposit`, `/withdraw`
  (`withdraw_attempt` + `sweep`), `/webhooks` (`webhook_attempt`).
- **Honeytokens accesibles por web:** `/wallet.json` y `/backup/wallet-restore.txt` (los dos con
  la mnemonic falsa; su lectura dispara `seed_touch`/`wallet_touch`).
- **Access log:** middleware `http_access` que loguea toda request a `crypto-access.log`
  (equivalente al Caddy access log de Run 1, pero a nivel app).

Arrancar:

```bash
cd ~/honeypot-crypto-r2/local/app
npx tsx src/server.ts
# (o compilar: npx tsc && node dist/server.js)
```

### 3.5 Paso 4 — verificación de que la instrumentación captura

`scripts/verify.sh` simula **dos atacantes** (control + context-aware) y **tres acciones de
intención**, y luego comprueba que cada evento quedó en su log. Éxito = cada `grep` devuelve ≥1.

```bash
#!/usr/bin/env bash
set -e
B=http://127.0.0.1:8000
S=127.0.0.1:2222

echo "== A) Atacante commodity SSH (control): root/123456 -> debe FALLAR y loguearse =="
sshpass -p 123456 ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
      -p 2222 root@127.0.0.1 exit 2>/dev/null || true

echo "== B) Atacante context-aware SSH (señal): admin/Monero@2021 -> debe TENER ÉXITO =="
# esperado: login succeeded + prompt del shell falso
sshpass -p 'Monero@2021' ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
      -p 2222 admin@127.0.0.1 'uname -a' 2>/dev/null || true

echo "== C) Credenciales web: POST /admin/login con typo -> raw pass capturado =="
curl -s -X POST "$B/admin/login" -d 'username=admin&password=qdxn' -o /dev/null

echo "== D) Robo de wallet: POST /api/v1/withdraw (sweep) -> withdraw_attempt + sweep=true =="
curl -s -X POST "$B/api/v1/withdraw" -H 'Content-Type: application/json' \
     -d '{"amount":999999,"currency":"XMR","address":"4fakeXMRaddr000000000000000000000000000000"}' -o /dev/null

echo "== E) Touch del seed-hint: GET /wallet.json -> seed_touch =="
curl -s "$B/wallet.json" -o /dev/null

echo
echo "== VERIFICACIÓN =="
grep -q '"event":"auth_attempt"'          logs/crypto-auth.log && echo "OK  creds web capturadas (raw pass)"
grep -q '"event":"withdraw_attempt"'      logs/crypto-access.log && echo "OK  withdraw capturado"
grep -q '"sweep":true'                    logs/crypto-access.log && echo "OK  sweep detectado"
grep -q '"event":"seed_touch"'            logs/crypto-access.log && echo "OK  seed_touch capturado"
grep -q 'login failed'                    cowrie/var/log/cowrie/cowrie.json && echo "OK  SSH fail (control) capturado"
grep -q '"event":"cowrie.login.success"'  cowrie/var/log/cowrie/cowrie.json && echo "OK  SSH success (señal) capturado"
```

**Criterios de aceptación (todo debe dar OK):**
1. La password commodity (`123456`) → `login failed` en `cowrie.json` (control vivo).
2. `admin`/`Monero@2021` → `cowrie.login.success` + comandos (`uname -a`) logueados (señal).
3. El typo `qdxn` aparece literal en `crypto-auth.log` (fidelidad raw).
4. El withdraw con `amount=999999` → `withdraw_attempt` con `sweep:true` y `dest_address`.
5. El `GET /wallet.json` → `seed_touch`.

### 3.6 Paso 5 — sanity del filtro entrópico (que la password NO esté en listas commodity)

```bash
# si no hay rockyou/secLists local, descargar una lista representativa:
#   curl -sL https://github.com/danielmiessler/SecLists/raw/master/Passwords/Common-Credentials/10-million-password-list-top-100000.txt -o /tmp/top100k.txt
grep -i 'monero@2021' /tmp/top100k.txt && echo "PELIGRO: en lista commodity" || echo "OK: ausente de top-100k"
```

> Si Gabriel cambia la password final, re-correr este grep. El filtro se rompe si la cadena
> derivada aparece en las listas que los sprays commodity usan de verdad.

### 3.7 Paso 6 — evidencia "off-box" (patrón local)

En local no hay droplet que comprometer, pero se reproduce el patrón de export para validarlo:

```bash
mkdir -p evidence/$(date +%F)
cp logs/*.log evidence/$(date +%F)/
cp cowrie/var/log/cowrie/cowrie.json evidence/$(date +%F)/
# (en prod: el cron diario de Run 1 exporta a ~/honeypot-evidence/<date>/ — mismo mecanismo)
```

### 3.8 Qué NO se valida en local (y dónde sí)

| Capa | Local (Node + venv Cowrie) | Producción (droplet Run 2) |
|---|---|---|
| App web/admin/API + logs JSONL | ✅ esta semana | ✅ mismo código, Next.js en Vercel (o `node dist/server.js` + Caddy/nginx) |
| Cowrie + filtro entrópico | ✅ `:2222` | ✅ `:22`, banner/host-key OpenSSH-real |
| auditd / Falco | ❌ (sin root) | ✅ receta Run 1 re-apuntada (§2.3) |
| egress lockdown (nftables) | ❌ (sin root) | ✅ `egress.nft` de Run 1 |
| Export diario de evidencia | ✅ patrón simulado | ✅ cron diario |

---

## 4. Decisión D1 equivalente (Run 2) — qué congelar en el story bible

Para no repetir el error de artefactos mixtos, Gabriel cierra ANTES de construir:
- **Nombre del negocio** (**Fluvia**), **moneda estrella** (USDC/USDT, con guiño a Monero como
  pista de la password SSH), **año de fundación** (2021), **nombre/handle del fundador/operador**
  (Diego Arévalo).
- **Regla de derivación de la password** + **cadena final** (locked `Monero@2021`), y el
  **userdb** (`admin` + `operator`).
- **Mnemonic/direcciones falsas** (BIP39 válido, cero fondos) + **paths de los honeytokens**
  (`/wallet.json`, `/backup/`).
- **Subdominios** si los hay (staging/api/dashboard) — solo los que apoyen la historia (D2).
- **Independencia cross-run:** dominio/proveedor/registrar/fingerprint distintos de Run 1 (caveat
  registrado en `run-findings.md`).

## 5. Checklist de lanzamiento (resumen de este doc)

- [ ] Story bible congelado (nombre, moneda, año, fundador, password derivada, userdb, honeytokens).
- [ ] Password derivada verificada como AUSENTE de listas commodity (grep §3.6).
- [ ] App Node/TS + middleware de captura (auth/withdraw/seed/wallet) funcionando (verificación §3.5).
- [ ] Cowrie con userdb realista + host key única + banner OpenSSH-real (anti-detection Run 1).
- [ ] auditd/Falco/egress re-apuntados al árbol de la app (§2.3) en el droplet.
- [ ] Export diario de evidencia activo.
- [ ] Cero datos reales en el box (auditoría previa a lanzar, como Run 1).
- [ ] Byte-stable a partir del lanzamiento (ningún cambio de lure por 30 días).
