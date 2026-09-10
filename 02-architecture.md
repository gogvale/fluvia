# 02 — Arquitectura técnica y activos señuelo
**Run 2 · Honeypot de Gabriel Oliveira · Negocio cripto FICTICIO (lure)**

> **ESTADO: 100% FICTICIO. NADA DE LO QUE APARECE AQUÍ ES REAL.**
> No hay dinero real, ni cripto real, ni claves privadas reales, ni seed phrases válidas,
> ni cuentas bancarias reales, ni documentos KYC reales. Todo es señuelo (*lure*) diseñado
> para que un atacante (crypto-bro, minero, wallet-drainer, skimmer, hunter) crea que está
> ante un negocio cripto genuino y mal protegido. **Jamás** se debe cargar una clave, seed o
> fondo real en este lure, y **jamás** se debe capturar un PAN/card real (los pasos de pago
> con tarjeta solo registran el intento, nunca el número — regla dura heredada del Run 1).

---

## 0. Reglas de seguridad (no negociables)

1. **Cero claves reales** en el box: ninguna seed válida, ningún keystore válido, ningún
   private key real (ni siquiera de una wallet de pruebas con valor).
2. **Cero fondos reales**: todas las direcciones son *unspent* / inexistentes on-chain.
   No se envía jamás ni un wei a ninguna de ellas.
3. **Cero PII real**: los "documentos KYC" son imágenes/PDFs generados con datos de personas
   inexistentes (nombres, números de pasaporte, fechas) — nunca datos de una persona real.
4. **Cero PAN real**: los flujos de tarjeta solo registran el *intento*, no el número.
5. **Egress bloqueado** en el box real (los intentos de los atacantes de "retirar" a un
   exchange/mezclador se loguean pero no salen).
6. Todo señuelo es **explícitamente** fake y está marcado en este documento; el honeypot
   lo expone, el observador lo registra.

---

## 1. Identidad ficticia (nota de especialización)

- **Marca ficticia:** **Fluvia** (placeholder — se puede renombrar en el story bible del Run 2).
- **Dominio ficticio:** `fluvia.finance` / `pay.fluvia.finance` (NO registrado — señuelo DNS/config).
- **Posicionamiento:** *"Crypto payments & stablecoin settlement for global merchants."*
- **Nicho base (genérico):** **Gateway de pagos cripto para comercios** — el comercio acepta
  BTC/ETH/stablecoins, Fluvia convierte y liquida en fiat o stablecoin.
- **Nota de especialización (el "wedge" que justifica el negocio):** liquidación transfronteriza
  en **stablecoins** (USDC/USDT) para **remesas y payroll** — la historia comercial es "cobramos
  en crypto en LatAm/SEA y pagamos nóminas en USDC, más rápido y barato que SWIFT". Esto es lo
  bastante genérico para que cualquier atacante lo reconozca y lo bastante específico para
  justificar el catálogo de assets (wallets multi-chain, on/off-ramp, OTC desk interno).

---

## 2. Arquitectura de referencia (dos capas: lo "claimed" vs. lo vibe-coded)

> La ficción técnica de Fluvia tiene **dos capas** que conviene no confundir:
> 1. **Arquitectura *claimed* (§2.1–§2.5):** lo que el pitch/whitepaper de Fluvia *afirma* correr
>    (multi-chain, MPC + multisig, KYC/AML, sweep de tesorería). Es copy aspiracional que el
>    founder copió/pegó — suena a equipo real.
> 2. **Stack *vibe-coded* (§2.6):** lo que el founder **realmente** desplegó con Claude — un
>    Next.js App Router en Vercel, sin colas, sin MPC real, con keys hardcodeadas.
>
> En el honeypot solo se **simula** la superficie de la capa vibe-coded (endpoints, configs,
> schemas, dashboard); no se despliega infraestructura real. **El desajuste entre lo *claimed* y
> lo *vibe-coded* ES el tell** (§2.8). El founder (Diego Arévalo) está en `05-founder-story.md`.

### 2.1 Capa blockchain (chains / L2)

| Capa | Rol en el negocio | ¿Por qué? |
|---|---|---|
| **Ethereum (mainnet)** | Liquidación de comercios grandes, USDC/USDT nativo, colateral | Liquidez + estándar ERC-20 |
| **Base / Arbitrum / Optimism (L2)** | Pagos de retail, gas barato, micropagos | Coste por tx ≈ centavos |
| **Polygon (POS)** | Compatibilidad histórica, apps heredadas | Legado ecosistema |
| **Solana** | Pagos de alta frecuencia, USDC-SPL, velocidad | ~400ms finality |
| **Tron** | Remesas y USDT (dominante en Asia/LatAm) | USDT-TRC20 volumen enorme |
| **Bitcoin (mainnet + Lightning)** | Depósito especulativo / treasury, pagos LN | "aceptamos BTC" como marca |

**Nodos/lectura:** se usa un proveedor RPC (no se auto-hospedan nodos para todas las chains).

### 2.2 Wallets / custodia (hot vs cold, MPC, multisig)

- **Hot wallets** (firmado automático, en la app): `web3`-side, custodia en un proveedor MPC.
  - **MPC (Multi-Party Computation)** vía custodio (Fireblocks/BitGo/Copper): las *key shares*
    viven en 2-3 partes; ningún servidor tiene la clave completa. Política: firma automática
    solo bajo límites (`max_amount`, `allowlist de direcciones`).
  - **Multisig Gnosis Safe (Safe{Wallet})** para wallets operativas de OTC/tesorería: `2-of-3`.
- **Cold wallets** (offline, never touch internet):
  - **Cold vault** del custodio (HSM/air-gapped) para el grueso del treasury.
  - **Manual cold wallet** (hardware wallet) para BTC reserve — firmada por humanos.
- **Flujo de fondos:** cliente deposita → hot wallet → *sweep* automático periódico al vault
  frío (barrido que deja solo saldo operativo en hot). Esto es lo que el lure simula en "balances".

**Arquitectura de claves (verosímil, NUNCA implementada real en el lure):**
```
deposit hot (clave en MPC share A/B/C)  →  sweep →  cold vault (HSM air-gapped)
                                              └→  operational multisig (Safe 2-of-3) para OTC/payroll
```

### 2.3 Flujos de pago y liquidación

1. **Depósito (inbound):** la app genera una `deposit-address` por cliente/activo
   (`POST /api/v1/deposit-address`). Se monitoriza el mempool vía RPC + webhooks del proveedor.
2. **Confirmación:** se exigen N confirmaciones (ETH: 12, BTC: 2-3, Solana: ~1, Tron: 19).
3. **Conversión (opcional):** precio vía oráculo (Chainlink) + precio spot de agregador
   (CoinGecko/Kraken/Coinbase) → conversión vía un DEX/OTC partner.
4. **Liquidación a comercio (outbound):** según preferencia del merchant → **fiat** (payout a
   su banco vía rail partner) o **stablecoin** (payout on-chain).
5. **Sweep de tesorería:** job programado barre hot → vault.

### 2.4 Transferencias internacionales (stablecoins vs SWIFT)

| | **Stablecoin rail** (USDC/USDT) | **SWIFT / fiat rail** |
|---|---|---|
| Latencia | segundos–minutos | 1–5 días |
| Coste | ~gas (centavos–$1) | $15–50 + FX spread |
| Finalidad | on-chain, irrevocable | reversible (fraude/chargeback) |
| Liquidez | on/off-ramp partner | cuenta bancaria multi-moneda (EMI/bank) |
| Cumplimiento | travel rule (FATF) | KYC/AML bancario clásico |

El negocio híbrido: **recibe en stablecoin y paga en stablecoin** (corredor LatAm/SEA) o
**recibe crypto y paga fiat** (on/off-ramp). El lure expone ambos.

### 2.5 KYC/AML

- **Onboarding:** verificación de identidad vía proveedor (Sumsub / Persona / Jumio / Onfido):
  documento + selfie + liveness.
- **Screening:** sanción/PEP/adverse-media vía ComplyAdvantage / Chainalysis KYT / Elliptic /
  TRM Labs (score de riesgo de wallet de origen).
- **Travel Rule (FATF):** intercambio de info de originador/beneficiario vía protocolo (TRISA /
  proveedor tipo Notabene) para transferencias > umbral.
- **Umbrales (típicos):** KYC ligero (email+tel) hasta ~$1k; KYC completo + PoSoF (proof of source
  of funds) por encima; reporting SAR interno para montos/patrones sospechosos.

### 2.6 Stack de software REALMENTE desplegado (vibe-coded con Claude)

> **Esto es lo que el founder desplegó de verdad** (ficción). NO es lo que armaría un equipo real
> (que llevaría NestJS + BullMQ + Redis + colas + secrets manager). Es el default de un
> **vibe-coder 2026** copiando output de Claude. La ausencia de colas/workers es deliberada (§2.8).

| Componente | Elección del vibe-coder | Notas |
|---|---|---|
| **Web app** | Next.js (App Router) + TypeScript | `app.fluvia.finance` — dashboard cliente + checkout |
| **Estilos / UI** | Tailwind CSS + shadcn/ui + framer-motion | "se ve premium", animaciones del dashboard |
| **Auth** | Clerk (o NextAuth) | login social en 5 min; sin 2FA real, sin rate-limit |
| **Base de datos** | Supabase / Neon (Postgres) + **Prisma** (ORM) | `prisma/schema.prisma` commiteado al repo |
| **Web3** | wagmi + viem (+ Thirdweb para algún connect) | conectar wallets sin escribir web3 a mano |
| **RPC** | **Alchemy / Infura** — keys hardcodeadas | `NEXT_PUBLIC_ALCHEMY_KEY` / `NEXT_PUBLIC_INFURA_ID` embebidas en el bundle del front |
| **Colas / workers** | **NO HAY** (nada de NestJS/BullMQ/Redis) | el "sweep" es un `// TODO: schedule the sweep` o un cron de Vercel roto |
| **Webhooks** | endpoints `POST /webhooks` a medias | `// TODO: verify signature` — sin HMAC real |
| **Infra / deploy** | **Vercel** | `git push` → Deploy; badge "Deploy on Vercel" sin quitar |
| **Secrets** | `.env` / `.env.local` commiteados al repo | keys de relleno (ver §3.8) |

**Flujo interno "real" (ficción):** el front llama directo a Supabase/Prisma y a rutas API de
Next.js (`/api/v1/...`); **no hay cola ni worker**. Lo que el pitch llama "sweep job" no existe —
es un botón del dashboard que no ejecuta nada (o un cron de Vercel que nadie programó). La
"confirmación on-chain" la simula un `setInterval` en el cliente, o directamente no se hace.

### 2.7 APIs de terceros (lo que se *claimearía* en 2026)

> **Lista *claimed*:** es el menú de proveedores que aparecería en el whitepaper/pitch de un
> negocio real (y que el founder copió en el About). En el lure **solo unos pocos están
> "conectados"** (Alchemy/Infura con keys de relleno, Supabase/Neon, Clerk) — el resto es copy
> aspiracional sin implementación. El desajuste es parte del tell (§2.8).

| Categoría | Proveedores estándar |
|---|---|
| **RPC nodes** | Alchemy, Infura, QuickNode, Ankr, Chainstack, GetBlock, dRPC |
| **Custodia / MPC** | Fireblocks, BitGo, Copper, Anchorage Digital |
| **Multisig** | Safe (Safe{Wallet}), Gnosis |
| **On-ramp / off-ramp (fiat)** | MoonPay, Transak, Ramp, Banxa, Simplex, Sardine, Onramper, Stripe (crypto onramp), Coinbase Commerce |
| **Pagos / fiat rail** | Stripe, Adyen, Wise, Plaid (banco), Airwallex |
| **Precios / oráculos** | Chainlink Price Feeds, Pyth, CoinGecko API, CoinMarketCap API, Kraken/Coinbase/Binance tickers |
| **DEX / OTC** | Uniswap (on-chain), 1inch, Wintermute/B2C2 (OTC desk), Circle (USDC mint/redeem) |
| **KYC/AML** | Sumsub, Persona, Jumio, Onfido, ComplyAdvantage, Chainalysis KYT, Elliptic, TRM Labs |
| **Travel rule** | Notabene, TRISA |
| **Emisión stablecoin** | Circle (USDC), Tether (USDT), Paxos (PYUSD) |

### 2.8 Vibe-coded tells we deliberately expose

> Estos son los **tells** que el lure expone **a propósito** para confirmar la ficción ("un
> crypto-bro no-técnico vibe-codeó todo con Claude"). Cada uno es un honeytoken de intención y un
> evento de captura en el watcher stack. El catálogo maestro y la backstory del founder viven en
> `05-founder-story.md` §6; la instrumentación en `03-honeypot-adaptation.md`.

| # | Tell expuesto | Qué fuga / qué insinúa | Atacante que atrae | Evento de captura |
|---|---|---|---|---|
| 1 | `.env` / `.env.local` commiteado con keys falsas (Alchemy, Infura, Supabase, JWT, `WALLET_PRIVATE_KEY` de relleno) | "las llaves están acá, tómalas" | wallet-drainer, skimmer, secret-scanner | `seed_touch` / `env_touch` |
| 2 | `/api/debug` | versión de Next.js, path del árbol, fragmentos de config | hunter, mapper | `api_call` |
| 3 | `/api/health` | `{status, db, auth, version}` info-leak tentador | hunter, mapper | `api_call` |
| 4 | `/admin` a medio terminar + creds default (`admin@fluvia.finance` / `Fluvia2021!`) | panel de tesorería con "withdraw" y "export seed" | credential-stuffer, brute-force | `auth_attempt` / `auth_success` |
| 5 | `// TODO: fix auth` (y TODOs similares en source/source-maps expuestos) | "la seguridad está a medias, entra" | hunter, mapper | `source_map_touch` |
| 6 | `robots.txt` default de Next.js (o ausente) | nada se ocultó, todo es escaneable | commodity crawler, mapper | `http_access` |
| 7 | Badge "Deploy on Vercel" en el footer/README | "esto lo deployó un no-técnico" | hunter (confirma el perfil del founder) | `http_access` (footer) |
| 8 | Keys hardcodeadas en el front (`NEXT_PUBLIC_ALCHEMY_KEY`, `NEXT_PUBLIC_INFURA_ID` en el bundle JS) | "puedo robar/abusar el RPC key" | crypto-bro, minero, abuser de RPC | `bundle_touch` / `rpc_key_use` |
| 9 | Source maps en producción (`.js.map` sin deshabilitar en `next.config`) | código fuente completo de la app | hunter, mapper | `source_map_touch` |
| 10 | `prisma/schema.prisma` + `supabase/config.toml` en el repo | schema de DB, tablas, roles | hunter | `schema_touch` |

**Regla de coherencia de tells:** todos los tells apuntan a la misma ficción y son consistentes
entre sí. Nunca mezclar un tell de "equipo real" (p.ej. `.env` ordenado, colas configuradas) con
un tell de "vibe-coder" (p.ej. `/admin` a medias). El conjunto forma una **única historia técnica**
que un atacante sofisticado "confirma" en vez de detectar como artefacto (H3).

---

## 3. Inventario de activos FALSOS (señuelos a exponer)

> Cada elemento lleva su marcador **`[FAKE]`**. Los valores son *plausibles en formato* pero
> **inválidos en contenido** (checksums rotos, direcciones sin fondos, seeds sin validez BIP39,
> documentos de personas inexistentes). Están pensados para ser desplegados como superficie del
> lure y para que su lectura/robo quede registrado por el watcher stack del honeypot.

### 3.1 Direcciones de wallet falsas `[FAKE]`

> Formato válido (40 hex), sin checksum verificado y **sin actividad on-chain**. Marcarlas
> siempre como señuelo; no enviar nada a ninguna.

| Activo | Chain | Dirección (ficticia) | Rol |
|---|---|---|---|
| `deposit_btc` | Bitcoin | `bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh` | deposit BTC comercios |
| `deposit_eth` | Ethereum | `0x7A2b9c4E6f81D3a5C0e8F2b4d6A9c1E3f5B7d9A` | deposit ETH |
| `deposit_usdc` | Ethereum | `0x3F9e6d2C4b8A1f7E5d0B3c9A6e2F8d1C4b7A9e3` | deposit USDC (ERC-20) |
| `deposit_usdt_trc20` | Tron | `TQ9cVz6M3xKj8wN2rY5eL4pF7aG1bH0dJ6sX` | deposit USDT (TRC-20) |
| `deposit_usdc_spl` | Solana | `F7xK9dP2mQ5vR8tY3wB6nE1cJ4gH7aL0sZ2u` | deposit USDC (SPL) |
| `hot_wallet_ops` | Ethereum | `0x5B8eA1d3F6c9B2a7E4f0D8c5A1b3E7f9C2d6B4` | hot ops (sweep origen) |
| `cold_vault_btc` | Bitcoin | `bc1q9n4v8c2m7b5x1k3j6h0g4f8d2s7a5w9e3u` | cold treasury BTC |
| `cold_vault_usdc` | Ethereum | `0x9D1eC5a7B3f8E2d6A4c0F7b9E1d3A5c8f2B6d0` | cold treasury USDC |

### 3.2 Archivo seed phrase de señuelo `[FAKE]`

> Nombre de archivo tentador: `.env`, `backup.txt`, `seed.txt`, `recovery-phrase.txt`,
> `wallet-export.json`, `keystore-2024.json`, o dentro de un repo `.git/` mal expuesto.
> La frase **NO es un mnemonic BIP39 válido** (checksum roto a propósito).

```
# recovery-phrase.txt (SEÑUELO — mnemonic BIP39 inválido, checksum roto)
cliff broken canyon velvet mirror seven silver garden river
copper lantern anchor
```

Opcionalmente, una segunda variante "más creíble" en un `keystore` JSON de Ethereum
(`{"version":3,"crypto":{...}}`) con `ciphertext`/`mac` de relleno aleatorio que **no**
descifra nada (cualquier intento de `ethers.Wallet.fromEncryptedJson` falla silenciosamente
o devuelve una wallet vacía). Nunca un keystore que abra.

### 3.3 Balances falsos `[FAKE]`

> Valores que el dashboard/API devuelve para que el atacante vea "fondos". No existen on-chain.
> Usar montos grandes pero no absurdos (un treasury de $2.4M es creíble; $9.8B no).

| Wallet | Activo | Balance ficticio |
|---|---|---|
| `hot_wallet_ops` | USDC | 184,320.55 |
| `cold_vault_usdc` | USDC | 1,902,447.12 |
| `cold_vault_btc` | BTC | 3.8472 |
| `deposit_eth` | ETH | 41.2093 |
| `deposit_usdt_trc20` | USDT | 96,882.40 |
| `deposit_usdc_spl` | USDC | 27,114.09 |

### 3.4 Esquema de base de datos (transacciones / usuarios) `[FAKE]`

> PostgreSQL. El lure expone el schema vía un `.sql` en el repo o un endpoint `/api/health`
> que fuga la versión. Se siembran filas de ejemplo con datos ficticios.

```sql
-- schema.sql (SEÑUELO)
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,          -- bcrypt de contraseñas débiles señuelo
  role          TEXT NOT NULL DEFAULT 'customer',  -- 'customer' | 'admin' | 'ops' | 'kyc'
  kyc_status    TEXT NOT NULL DEFAULT 'none',      -- none|pending|approved|rejected
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE wallets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  asset       TEXT NOT NULL,             -- BTC|ETH|USDC|USDT|...
  address     TEXT NOT NULL,
  chain       TEXT NOT NULL,             -- ethereum|tron|solana|bitcoin
  kind        TEXT NOT NULL DEFAULT 'deposit',  -- deposit|hot|cold
  balance     NUMERIC(38,18) NOT NULL DEFAULT 0
);

CREATE TABLE transactions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id),
  type         TEXT NOT NULL,            -- deposit|withdrawal|conversion|payout|fee|sweep
  asset        TEXT NOT NULL,
  amount       NUMERIC(38,18) NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending', -- pending|confirming|completed|failed|rejected
  tx_hash      TEXT,                     -- hash ficticio on-chain
  from_address TEXT,
  to_address   TEXT,
  confirmations INTEGER NOT NULL DEFAULT 0,
  fee          NUMERIC(38,18) NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE api_keys (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id),
  key_prefix TEXT NOT NULL,              -- 'fl_live_...'
  scopes     TEXT[] NOT NULL DEFAULT '{}',
  revoked    BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE webhook_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,              -- deposit.confirmed|withdrawal.completed|...
  payload    JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 3.5 Usuarios admin falsos `[FAKE]`

> Credenciales débiles y adivinables (la razón de ser del lure — igual que `admin`/`CottonSky2019!`
> en el Run 1). Contraseñas deducibles del story bible. **Son cuentas de la app, no cuentas del
> sistema real.**

| Email | Rol | Password (señuelo) | Nota |
|---|---|---|---|
| `admin@fluvia.finance` | `admin` | `Fluvia2024!` | admin principal, el que todo brute-force prueba |
| `ops@fluvia.finance` | `ops` | `FluviaOps123!` | operaciones / tesorería |
| `kyc@fluvia.finance` | `kyc` | `FluviaKyc123!` | revisión KYC |
| `founder@fluvia.finance` | `admin` | `Fluvia2021!` | "fundador" (año de fundación en el About) |
| `finance@fluvia.finance` | `ops` | `Finance!2024` | contabilidad/payouts |

> **Regla:** estos usuarios viven SOLO en la DB del lure. No comparten credenciales con el box
> real (el acceso real al box sigue siendo SSH key-only + el admin WP fuerte del Run 1).

### 3.6 Endpoints de API falsos `[FAKE]`

> Base: `https://api.fluvia.finance/v1`. Auth: API key `fl_live_*` / `fl_test_*` (señuelo) o JWT.
> Cada endpoint devuelve datos fake coherentes con 3.3/3.4. Los errores están diseñados para
> fugar info tentadora (stack trace, versión, path).

| Endpoint | Método | Qué devuelve (fake) |
|---|---|---|
| `/api/v1/deposit-address` | POST | `{ "asset":"USDC", "chain":"ethereum", "address":"0x3F9e...", "expires_at":"..." }` |
| `/api/v1/balance` | GET | `{ "wallets":[...] }` con balances de 3.3 |
| `/api/v1/withdraw` | POST | acepta `{asset, amount, address}` → `{ "id":UUID, "status":"pending_review" }` (nunca ejecuta) |
| `/api/v1/rates` | GET | `{ "BTC/USD":68432.10, "ETH/USD":3521.44, "USDC/USD":1.0002, "USDT/USD":1.0001 }` |
| `/api/v1/transactions` | GET | lista de tx de 3.4 con `tx_hash` ficticios |
| `/api/v1/kyc/status` | GET | `{ "status":"pending", "provider":"sumsub" }` |
| `/api/v1/admin/users` | GET | fuga lista de usuarios (solo si auth admin débil) |
| `/webhooks` (inbound) | POST | recibe `address_activity`/`payment_intent` fake; loguea payload |
| `/webhooks/merchant` (outbound) | — | emisor fake hacia comercios |
| `/api/debug` | GET | `{ "next":"14.2.x", "node":"v20.x", "cwd":"/vercel/path0", "env_keys":["ALCHEMY_API_KEY","INFURA_PROJECT_ID","DATABASE_URL",...] }` (tell vibe-coder) |
| `/api/health` | GET | `{ "status":"ok", "db":"supabase-postgres", "auth":"clerk", "queue":"none" }` (info leak tentador; "queue":"none" delata que no hay workers) |
| `/api/v1/export` | GET | CSV "balances.csv" señuelo con las wallets de 3.1/3.3 |

Ejemplo de respuesta fake:

```json
// GET /api/v1/balance  (SEÑUELO)
{
  "user_id": "6f3a9c2e-4b7d-4a1e-9c5b-8f2d6e0a3b7c",
  "wallets": [
    { "asset": "USDC", "chain": "ethereum", "address": "0x3F9e6d2C4b8A1f7E5d0B3c9A6e2F8d1C4b7A9e3", "balance": "184320.55" },
    { "asset": "BTC",  "chain": "bitcoin",  "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", "balance": "0.0811" }
  ],
  "treasury_hint": { "cold_vault_usdc": "1902447.12", "cold_vault_btc": "3.8472" }
}
```

### 3.7 Documentos KYC falsos `[FAKE]`

> PDFs/imágenes generados (nunca personas reales). Se colocan en un bucket/endpoint "privado"
> deliberadamente expuesto (p.ej. `storage.fluvia.finance/kyc/` sin auth, o `/api/v1/kyc/files`).

| Archivo | Contenido (ficticio) |
|---|---|
| `kyc/passport-1024.jpg` | pasaporte de "Marco A. Villanueva" (no existe) |
| `kyc/id-2048.jpg` | DNI de "Lucía Fernanda Ríos" (no existe) |
| `kyc/selfie-1024.jpg` | selfie-liveness sintética |
| `kyc/proof-of-funds.pdf` | extracto bancario fake de "Fluvia Operations Ltd." |
| `kyc/company-cert.pdf` | certificado de incorporación de "Fluvia Operations Ltd." (ficción) |

### 3.8 Config de wallet falsa `[FAKE]`

> Archivos de configuración con claves/secrets *de relleno* (formato válido, valor inválido).
> Son el imán clásico de wallet-drainers y skimmers.

```bash
# .env  (SEÑUELO — ninguna de estas claves funciona; el vibe-coder lo commiteó al repo)
NODE_ENV=production
# --- DB (Supabase/Neon) ---
DATABASE_URL=postgresql://postgres.fluvia:***@db.fluvia.supabase.co:5432/postgres
SUPABASE_URL=https://fluvia.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake-service-role-key
# --- Auth (Clerk) ---
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_fake_fluvia_0000000000000000
CLERK_SECRET_KEY=sk_test_fake_fluvia_0000000000000000
# --- RPC (también hardcodeadas en el front — tell §2.8 #8) ---
ALCHEMY_API_KEY=ob_demo_1a2b3c4d5e6f7a8b9c0d1e2f   # key de relleno, no válida
INFURA_PROJECT_ID=2f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5  # id de relleno
NEXT_PUBLIC_ALCHEMY_KEY=ob_demo_1a2b3c4d5e6f7a8b9c0d1e2f
NEXT_PUBLIC_INFURA_ID=2f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5
# --- misc (aspiracional, nunca conectado de verdad — copy de tutoriales) ---
COINMARKETCAP_API_KEY=cmc_demo_0000-0000-0000-0000
MOONPAY_SECRET_KEY=moonpay_live_demo_000000000000
FIREBLOCKS_API_KEY=fb_demo_00000000-0000-0000-0000-000000000000
JWT_SECRET=fluvia_super_secret_jwt_2024
# --- clave privada de relleno (NO es una clave válida; 64 hex aleatorios) ---
WALLET_PRIVATE_KEY=0x0000000000000000000000000000000000000000000000000000000000000000
```

```json
// wallet-config.json  (SEÑUELO)
{
  "name": "fluvia-hot-ops",
  "chain": "ethereum",
  "address": "0x5B8eA1d3F6c9B2a7E4f0D8c5A1b3E7f9C2d6B4",
  "mnemonic": "cliff broken canyon velvet mirror seven silver garden river copper lantern anchor",
  "provider": "alchemy",
  "sweep_to": "0x9D1eC5a7B3f8E2d6A4c0F7b9E1d3A5c8f2B6d0",
  "sweep_threshold": 5000
}
```

> Nota: el `WALLET_PRIVATE_KEY` todo-ceros y el `mnemonic` son **deliberadamente** inválidos;
> un drainer que intente importarlos obtiene una wallet vacía/sin fondos y su intento queda
> registrado. No se debe usar nunca una clave que derive a una wallet con saldo.

---

## 4. Resumen — checklist de activos señuelo clave

1. **Direcciones de wallet falsas** (BTC/ETH/Tron/Solana, hot + cold) — §3.1
2. **Archivo seed phrase señuelo** (`recovery-phrase.txt` / `.env` / `keystore-*.json`) — §3.2
3. **Balances falsos** (dashboard/API) — §3.3
4. **Esquema DB + filas sembradas** (`schema.sql`, users/wallets/transactions) — §3.4
5. **Usuarios admin falsos** (credenciales débiles deducibles) — §3.5
6. **Endpoints API falsos** (`/deposit-address`, `/withdraw`, `/balance`, `/rates`, `/webhooks`, `/health`, `/export`) — §3.6
7. **Documentos KYC falsos** (pasaportes/DNI/PoF de personas inexistentes) — §3.7
8. **Config de wallet falsa** (`.env`, `wallet-config.json`, claves de relleno inválidas) — §3.8

---

## Anexo A — Por qué esta superficie atrae a cada perfil (mapeo a attacker-profiles P1–P8)

| Señuelo | Atacante objetivo | Qué intentará |
|---|---|---|
| `seed` / `.env` / `WALLET_PRIVATE_KEY` | wallet-drainer, skimmer | importar la clave y vaciar (falla, queda logueado) |
| Endpoints `/withdraw`, `/balance`, `/export` | drainer, hunter | extraer/retirar "fondos" |
| Credenciales admin débiles | credential-stuffer, brute-force | login admin → exfiltrar DB |
| `schema.sql` + info leak `/health` | hunter | mapear infra y escalar |
| KYC files expuestos | hunter, carding | robar PII (que es falsa) |
| `/deposit-address`, `/webhooks` | minero, crypto-bro | probar que "funciona", depositar (nunca hay fondos reales) |

> **Nota de despliegue:** todo lo anterior se expone como *superficie* del lure Run 2 y se
> monitorea con el watcher stack heredado (Caddy access log, wp-auth.log-equivalente para la app,
> Cowrie SSH, auditd, Falco, egress lockdown). Ningún señuelo debe salir del box real.
