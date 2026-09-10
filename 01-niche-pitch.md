# 01 — Nicho + Pitch + Identidad
**Run 2 · Honeypot de Gabriel Oliveira · Negocio cripto FICTICIO (lure)**

> **ESTADO: 100% FICTICIO. NADA DE LO QUE APARECE AQUÍ ES REAL.**
> No hay dinero real, ni cripto real, ni datos reales. Este documento define el *lure* — un
> negocio de cripto **ficticio** que debe *parecer* real a un crypto-bro. Es un señuelo de
> threat-intel, **nunca** un negocio funcional. Cero dinero, cero cripto, cero datos reales.

---

## 1. Problemáticas REALES del mundo cripto (2026) y sus dolores

Investigadas vía web_search (fuentes en §6). Son los dolores reales que el lure imitará:

### P1 — Remesas / pagos a freelancers LATAM con stablecoins (el más fuerte)
- **Dolor real:** la banca corresponsal sigue siendo lenta y cara en los corredores hacia
  LATAM; los contratistas *piden* cobrar en stablecoin o en moneda local de liquidación
  inmediata. El motor no es el patrón, es el *recipiente* (preferencia del receptor) y el
  *coste* (banca corresponsal cara) + la maduración de off-ramps locales regulados que
  convierten USDC/USDT a moneda local.
- **Fuente:** eco.com "Stablecoin payroll in LATAM: USDC vs USDT for contractor payouts";
  Rise "State of Crypto Payroll Report 2026".

### P2 — Payroll cripto (nóminas en stablecoins)
- **Dolor real:** pagar equipos globales/contratistas en nómina está migrando de "opción de
  nicho para empresas crypto-native" a mainstream; el mercado ya es de *stablecoin payroll*
  (no de salarios en token volátil). El stock de stablecoins supera **$315B** y el volumen de
  pagos reales en stablecoin se estimó en **~$390–400B en 2025**.
- **Fuente:** Rise "State of Crypto Payroll Report 2026"; criptolog.com "Crypto payroll in 2026".

### P3 — Gateway de pagos para comercios (y el hueco de Coinbase Commerce)
- **Dolor real:** ~8.000 comercios no-EE.UU. están por perder su checkout cripto porque
  **Coinbase Commerce deja de servir fuera de EE.UU./Singapur el 31 de marzo de 2026**. Los
  comercios necesitan alternativas de aceptación de BTC/stablecoins con liquidación no-custodial.
- **Fuente:** plisio.net "Crypto Payment Gateway 2026: The Merchant's Field Guide";
  allscale.io "Best stablecoin payment gateways 2026".

### P4 — Liquidación B2B transfronteriza (reemplazar SWIFT por stablecoins)
- **Dolor real:** **71% del volumen B2B transfronterizo en LATAM ya corre por canales de
  stablecoin** (Fireblocks, may-2025). El caso típico es una *factura de proveedor*, no una
  compra de consumidor: USDC en Solana liquida en ~13 segundos por centavos, vs. 1–5 días y
  $15–50 + spread FX por SWIFT. B2B fue **~$226B en 2025, +733% interanual**.
- **Fuente:** Fireblocks (vía clickwerxs/artoh); mintarex "B2B stablecoin settlement 2026".

### P5 — OTC desk + custodia (riesgo de contraparte y self-custody)
- **Dolor real:** un PSP que usa un OTC desk no solo quiere precio; quiere *ejecutar sin
  transferir el nocional completo por adelantado* y *saber que el desk corre limpio* (riesgo de
  contraparte). Y la decisión de seguridad más grande ocurre **antes** del firewall: *quién
  tiene las llaves*. Las pérdidas grandes recientes no fueron criptografía rota, fueron
  llaves mal custodiadas (MPC/multisig como estándar).
- **Fuente:** cryptobriefing "Crypto OTC desks in 2026"; safeheron "AlphaYield OTC desk on
  true self-custody"; cpay.world "Self-custody security 2026".

> **Síntesis del dolor transversal:** la banca corresponsal y SWIFT son lentos, caros y
> opacos; las stablecoins liquidan en minutos/segundos y barato; pero la *onboarding*, la
> *custodia* y el *on/off-ramp* siguen siendo fricción para un freelancer o comercio pequeño
> que "no entiende de tecnología". Ese hueco es donde vive el lure.

---

## 2. Nicho elegido (una línea)

> **Stablecoin cross-border payments & on/off-ramp para freelancers y pequeñas empresas de
> LATAM — cobra y paga en dólares digitales (USDC/USDT) en minutos, sin banco corresponsal,
> sin SWIFT, sin esperar días.**

### 2.1 Por qué este nicho y no otro
- **Máxima credibilidad documentada:** P1 + P4 son los casos de uso más citados y con datos
  más sólidos de 2026 (71% del B2B LATAM en stablecoins; $390–400B de pagos estables).
- **Crypto-bro lo reconoce al instante:** "cobrar en USDT y no esperar al banco" es la promesa
  que ya *quiere* creer; no requiere explicar nada.
- **Pequeño pero creíble:** un startup de 6–12 personas con un wedge (corredor LATAM) suena
  *real*, no a exchange gigante. Evita competir de frente con MoonPay/Transak/Strike/Reserve.
- **Mapea perfecto a una stack técnica falsificable** (ver §2.2).

### 2.2 Mapeo a stack técnica falsificable (qué superficie "real" tendría)
El negocio justifica, sin forzar nada, todos los activos señuelo del Run 2 (ver
`02-architecture.md`):

| Promesa comercial | Superficie técnica falsificable |
|---|---|
| "Recibe pagos" | `POST /api/v1/deposit-address`, wallets por activo (BTC/ETH/Tron/Solana) |
| "Convierte y liquida" | `GET /rates`, oráculo de precios, pares USDC/USDT↔fiat |
| "Paga en stablecoin" | `POST /withdraw`, `POST /payout`, jobs de sweep |
| "On/off-ramp" | flujo de fiat↔stablecoin, partner KYC (Sumsub), travel rule |
| "Self-custody / tus llaves" | seed phrase, `.env` con `WALLET_PRIVATE_KEY`, `keystore-*.json` |
| "Dashboard de tesorería" | `GET /balance`, `GET /transactions`, `GET /export` |
| "API para desarrolladores" | `api_keys` (`ob_live_*`), webhooks firmados |
| "Admin/ops" | panel admin, roles (`admin`/`ops`/`kyc`/`finance`) |

**Por qué atrae al crypto-bro objetivo:** ve "fondos" (balances), una seed "expuesta", un botón
de "withdraw instantáneo", una API con keys — y cree que puede sacar algo rápido. Todo es fake
y queda logueado por el watcher stack heredado del Run 1.

### 2.3 Alineación con `02-architecture.md`
El placeholder de marca allí es **"OrbitBridge"**. **Recomendación firme: renombrar.**
"Orbit Bridge" es el nombre de un *bridge cross-chain real* de Orbit Chain, **hackeado el
30-31 dic-2023 por ~$81–86M** (fuentes en §6). Un crypto-bro/atacante que reconozca el nombre
verá un lure incoherente ("¿un bridge hackeado haciendo de gateway de pagos?"). El nicho que
elige este documento **sí** encaja con el wedge que describe 02 ("liquidación transfronteriza
en stablecoins para remesas y payroll en LatAm"); solo hay que cambiar la marca.

---

## 3. Pitch (cara al sitio — INGLÉS)

> Copy de una página, estructura problema → solución → cómo funciona → a quién sirve.
> Tono aspiracional-fintech con slang cripto que halaga al público objetivo.

---

### Fluvia — Get paid in dollars. Settle in minutes.

**The problem.**
Cross-border money is still stuck in 1985. A freelancer in Buenos Aires waits 4–6 business
days for a client's wire to clear — minus $30–60 in correspondent-bank and FX fees. A small
exporter in Medellín invoices a US buyer and waits a week for SWIFT to "process." Your money
sits in someone else's pipeline while you watch the clock. The dollar already moves at the
speed of a block; your bank just hasn't noticed.

**The solution.**
Fluvia is the on/off-ramp that makes stablecoins boring enough to actually use. You invoice,
get paid, and settle in USDC/USDT — in minutes, for cents, with the finality of the chain and
none of the bank hours. No correspondent bank. No SWIFT queue. No 5-day "hold."

**How it works.**
1. **On-ramp.** Link your account, deposit fiat or crypto, get a dedicated deposit address for
   BTC, ETH, USDC or USDT — on Ethereum, Tron, Solana and the L2s you actually use.
2. **Hold & convert.** Your balance is real-time, priced by live feeds. Convert between
   USD-pegged stablecoins at a flat, published rate. No hidden spread.
3. **Payout.** Withdraw to a local bank or any wallet. Sweep jobs keep operating funds hot and
   the treasury cold — MPC + multisig, the way it's supposed to be done.
4. **Self-custody option.** Prefer your own keys? Take the non-custodial route. Your keys, your
   coins — we never hold a cent we don't have to.

**Who it's for.**
Freelancers and contractors in LATAM who bill clients abroad. Small exporters and importers
settling supplier invoices. Remote teams paying global contributors. Agencies that want crypto
acceptance without a whole payments department.

**Why now.**
Stablecoin payments crossed **$390B in 2025** and 71% of LATAM's cross-border B2B already moves
on stablecoin rails. The rails are ready. The on-ramp is the last mile — and that's Fluvia.

*Settle the way money should move.*

---

### 3.1 Resumen del pitch (ESPAÑOL)

**Problema:** los pagos transfronterizos hacia/desde LATAM siguen atascados en banca
corresponsal y SWIFT — un freelancer espera 4–6 días y pierde $30–60 en fees/FX.

**Solución:** Fluvia es un on/off-ramp de stablecoins (USDC/USDT) que permite cobrar, convertir
y pagar en dólares digitales en minutos y por centavos, con finalidad on-chain y sin banco
corresponsal.

**Cómo funciona:** (1) on-ramp con dirección de depósito por activo y multi-chain; (2) balance
en tiempo real + conversión entre stablecoins a tasa publicada; (3) payout a banco local o
wallet con treasury hot/cold (MPC + multisig); (4) opción no-custodial ("tus llaves, tus
monedas").

**A quién sirve:** freelancers y contratistas LATAM que facturan al exterior, pequeños
exportadores que liquidan facturas de proveedor, equipos remotos que pagan contribuidores, y
agencias que quieren aceptar cripto sin montar un departamento de pagos.

**Por qué ahora:** los pagos estables superaron $390B en 2025 y el 71% del B2B transfronterizo
LATAM ya va por rails de stablecoin. Falta la última milla (el on/off-ramp) — y eso es Fluvia.

---

## 4. Identidad (story bible seed — FICCIÓN)

| Campo | Valor (ficticio) | Nota |
|---|---|---|
| **Marca** | **Fluvia** | del latín *fluvius* ("río"): el dinero fluye como un río |
| **Dominio** | `fluvia.finance` (apex) + `app.`/`api.`/`pay.` subdominios | TLD ICANN barato y real |
| **Fundada** | 2021 (boom de remesas post-COVID) | año que aparece en el About |
| **HQ** | Ciudad de México, México | corredor remesas US→MX = el mayor del mundo |
| **Tamaño** | 6–12 personas ("small but credible") | no exchange gigante |
| **Funding** | bootstrap + pre-seed ángel (ficticio) | "somos el underdog" |
| **Fundador (ficción)** | Diego Arévalo — ex-ops de una fintech de pagos (personaje inexistente) | nombre deducible, NUNCA una persona real |
| **Público objetivo** | crypto-bro con FOMO: quiere resultados rápidos, no entiende de seguridad/custodia, reutiliza contraseñas, guarda seeds en texto plano | ver §4.1 |
| **Voz** | fintech aspiracional, inglés-first, slang cripto ("your keys, your coins", "settle in minutes") | flattera al público |

> **Nota de coherencia con Run 1 (Cotton Sky):** igual que Cotton Sky (fundada 2019, Portland,
> dueña "Elena Marsh", creds `admin`/`CottonSky2019!` deducibles del About), el story bible de
> Fluvia debe permitir **deducir** credenciales débiles desde la página: p.ej.
> `admin@fluvia.finance` / `Fluvia2021!` (año de fundación en el About). Eso se define en el
> story bible completo; aquí solo se deja la semilla.

### 4.1 Persona objetivo — el crypto-bro que "muerde"
- **Quién:** freelancer/contratista o dueño de negocio pequeño en LATAM (o un comercio de
  EE.UU./Europa que paga contratistas LATAM), 20–40 años, nativo de Telegram/Discord/X.
- **Qué quiere:** resultados rápidos. Cobrar en USDT ya, no "en 5 días hábiles". Rendimiento
  alto prometido. No leer whitepapers.
- **Qué NO entiende:** custodia, claves, seguridad. Reutiliza contraseñas, guarda la seed en un
  screenshot/cloud, clica enlaces, cree que "not your keys, not your coins" es solo un meme.
- **Por qué es el señuelo ideal:** ve balances, una seed "expuesta", un botón "withdraw" y una
  API con keys — e intenta sacar algo rápido. Todo el intento queda registrado.

### 4.2 Superficies de bait que la identidad justifica (resumen)
- Dashboard con balances y "withdraw instantáneo" (fake, nunca ejecuta).
- Seed phrase + `.env` + `keystore-*.json` con claves de relleno inválidas (imán de drainers).
- Endpoints `/deposit-address`, `/balance`, `/withdraw`, `/rates`, `/transactions`, `/export`,
  `/health`, `/webhooks` con info-leak tentador.
- Credenciales admin débiles deducibles del About.
- Documentos KYC de personas inexistentes (PII falsa, nunca real).

> La enumeración completa y técnica de estos activos vive en `02-architecture.md` (que usa el
> placeholder "OrbitBridge"; ver §2.3 para el renombre a "Fluvia").

---

## 5. Nombres propuestos (verificados) + dominio

### 5.1 Cómo se verificó
Se buscó cada nombre en web_search para descartar colisión con **exchanges/custodios/protocolos
famosos** (Bitso, Ripio, Lemon, Reserve, Airtm, Strike, MoonPay, Ramp, Transak, BVNK, Bridge,
Orbit Chain/Bridge, Cuenca, Raudal SOFOM, Fondeo.xyz, etc.). El listado final excluye todo
nombre que ya use una entidad cripto notable.

### 5.2 Shortlist (6 nombres)

| # | Nombre | Significado | Dominio sugerido | Estado de colisión (verificado) |
|---|---|---|---|---|
| 1 ⭐ | **Fluvia** | lat. *fluvius* = río; el dinero fluye | `fluvia.finance` / `fluvia.xyz` | ✅ limpio (solo el río catalán "Fluvià" y el nombre romano "Fulvia"; sin empresa cripto) |
| 2 | **Marea** | la marea — liquidez que sube/baja a demanda | `marea.finance` / `marea.xyz` | ✅ limpio (ningún exchange/wallet; solo una banda italiana de rock, irrelevante) |
| 3 | **Vertiente** | vertiente/cuenca — la pendiente por la que baja el dinero | `vertiente.capital` / `vertiente.xyz` | ✅ limpio (sin colisión encontrada) |
| 4 | **Afluente** | afluente — pagos que alimentan desde todas partes | `afluente.finance` / `afluente.xyz` | ✅ limpio (sin colisión encontrada) |
| 5 | **Raudo** | "raudo" = veloz — liquidación inmediata | `raudo.finance` / `raudo.xyz` | ✅ limpio (distinto de "Raudal SOFOM" mexicana y de `raudal.ai`) |
| 6 | **Aluvión** | aluvión — "un aluvión de pagos" = una riada de dinero | `aluvion.finance` / `aluvion.xyz` | ✅ limpio (sin colisión encontrada) |

**Nombres DESCARTADOS durante la verificación (con motivo):**

| Nombre descartado | Motivo |
|---|---|
| **OrbitBridge** (placeholder en 02) | colisiona con **Orbit Bridge**, bridge cross-chain de Orbit Chain hackeado dic-2023 (~$81–86M) — incoherente para un lure |
| **Caudal / Caudal Pay** | `caudalpay.com` y "Caudal" (fintech FinOps) ya existen |
| **Raudal** | `raudal.com.mx` (RAUDAL SOFOM regulada) y `raudal.ai` existen |
| **Fondeo** | `fondeo.xyz` (prop-trading firm cripto) y "Fondeo" (SaaS lending) existen |
| **Cuenca** | fintech mexicana real (`cuenca.com`) |
| **Riachuelo** | retailer brasileño gigante |
| **Afluenta** | fintech argentina de lending P2P real |
| **Cauce** | sigla de **CAUCE** (Coalition Against Unsolicited Commercial Email, `cauce.org`) — colisión menor pero conocida |
| **Sendly** | varias empresas de email-marketing (`sendly.now`, `trysendly.com`, etc.) |
| **Yunga** | `yunga.co` (edtech) + proximidad a "Yuno" (payments) |
| **Vira / Rampira** | proximidad fonética a "Ramp"/"Ramp Network" y a "Vira" (apps existentes) |

### 5.3 Recomendación de dominio (y por qué NO `.crypto`)
- **Top pick:** `fluvia.finance` (apex, sirve `app.`/`api.`/`pay.`). TLD ICANN real, barato
  (~$20–40/año) y *profesional* para un negocio de pagos.
- **Opción más barata:** `fluvia.xyz` (~$1–2/año, promos ~$0.99 en Porkbun/Namecheap/Spaceship).
  Ideal si prima el coste. Ambas resuelven por DNS y emiten cert LE (aparecen en CT logs).
- **Alternativas válidas (todas ICANN, todas baratas):** `.xyz`, `.io`, `.finance`, `.capital`,
  `.exchange`, `.app`. Para este lure: `.finance` (credibilidad) o `.xyz` (coste mínimo).

**Por qué DESCARTAR `.crypto`:**
1. **`.crypto` NO es un TLD ICANN.** Es un dominio de *alt-root* (Unstoppable Domains /
   Handshake), vive en una raíz blockchain paralela, no en la raíz DNS del ICANN.
2. **NO resuelve por DNS estándar.** Un navegador/resolver normal no lo resuelve sin un
   resolver especial; no hay zona DNS pública que `dig`/`nslookup` puedan consultar.
3. **NO aparece en Certificate Transparency logs.** El canal de descubrimiento de este honeypot
   depende de los CT logs (los atacantes encuentran el dominio vía `crt.sh`/escáneres CT). Un
   dominio que no emite certificado LE/DV en CT es *invisible* para ese canal → el lure no sería
   descubierto. Por eso **debe** ser un TLD ICANN real con cert LE auto-emitido (igual que
   `cottonsky.shop` en el Run 1).

> **Regla de despliegue (heredada del Run 1):** NUNCA lanzar sobre `*.duckdns.org` ni ningún
> dynamic-DNS (tell de honeypot/homelab). Registrar un dominio ICANN real barato, apuntar A/AAAA
> al droplet y dejar que Caddy emita LE → CT log → descubrimiento.

---

## 6. Fuentes (web_search, sep-2026)

- Rise — **State of Crypto Payroll Report 2026** (`riseworks.io/blog/state-of-crypto-payroll-report-2026`): $315B stablecoin supply; ~$390–400B stablecoin payments 2025; mercado = stablecoin payroll.
- eco.com — **Stablecoin payroll in LATAM: USDC vs USDT** (`eco.com/support/en/articles/15575500-...`): preferencia del receptor, coste de banca corresponsal, off-ramps regulados locales.
- plisio.net — **Crypto Payment Gateway 2026: The Merchant's Field Guide**: Coinbase Commerce deja no-EE.UU./Singapur el 31-mar-2026 (~8.000 comercios).
- allscale.io — **Best stablecoin payment gateways 2026** (NOWPayments 0.5%, Coinbase Business, Stripe stablecoin).
- Fireblocks (may-2025, vía clickwerxs.com / artoh.com) — **71% del B2B transfronterizo LATAM en stablecoins**; B2B ~$226B en 2025 (+733% YoY).
- mintarex.com — **B2B Stablecoin Settlement vs SWIFT 2026**: $6B+ mensual B2B stablecoin; liquidación <3 min; 100x reducción de coste.
- cryptobriefing.com — **Crypto OTC desks in 2026**: riesgo de contraparte, ejecutar sin pre-fundear el nocional.
- safeheron.com / cpay.world — **self-custody / MPC**: las pérdidas grandes = llaves mal custodiadas, no criptografía rota.
- dailycoin.com / crypto.news / cryptobriefing.com — **Orbit Bridge (Orbit Chain) hack dic-2023/ene-2024**: ~$81–86M (motivo del descarte de "OrbitBridge").
- Wikipedia — río **Fluvià** (Cataluña), **CAUCE** (anti-spam non-profit), **Fulvia** (nombre romano).

---

## Resumen ejecutivo (para el agente padre)

- **Nicho (una línea):** on/off-ramp + liquidación transfronteriza de stablecoins (USDC/USDT)
  para freelancers y pequeñas empresas de LATAM.
- **Nombre top:** **Fluvia** · dominio `fluvia.finance` (barato `fluvia.xyz`).
- **Renombrar** el placeholder `OrbitBridge` de `02-architecture.md` → colisiona con el bridge
  hackeado "Orbit Bridge".
- **Dominio:** TLD ICANN real (`.finance`/`.xyz`); **`.crypto` descartado** (no-ICANN, no
  resuelve, no aparece en CT logs).
