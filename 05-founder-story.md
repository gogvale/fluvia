# 05 — Story bible del founder (FICCIÓN)

**Run 2 · Honeypot de Gabriel Oliveira · Negocio cripto FICTICIO (lure)**

> **ESTADO: 100% FICTICIO. NADA DE LO QUE APARECE AQUÍ ES REAL.**
> Diego Arévalo no existe. Fluvia no existe. No hay dinero real, ni cripto real, ni claves
> reales, ni una suscripción real de Claude asociada a este señuelo. Este documento es el
> *story bible* que define al personaje y a la ficción técnica para que el lure sea
> internamente coherente y **deducible** (credenciales débiles, tells de vibe-coder) por un
> atacante que lea el sitio. Nada de esto debe volverse real jamás.

---

## 1. Resumen del founder (3 bullets)

- **Diego Arévalo**, fundador y "CEO" de **Fluvia** — un **crypto-bro NO técnico** (ex-ventas de
  una fintech de pagos, jamás programó en su vida) que fundó la empresa en **2021 en CDMX** y
  **vibe-codeó él solo TODA la plataforma con su suscripción de Claude** (Pro → Max) durante
  2024–2025. Cree que "shippear" es copiar el output del chat y pegarlo en Vercel.
- **Por qué Claude:** no puede (ni quiere) pagar un equipo real tras el cripto-invierno; absorbió
  el contenido de "la IA va a reemplazar a los developers" en X/Telegram y decidió que su ventaja
  era *construir sin ingenieros*. Es el arquetipo exacto del **vibe-coder 2026**: Next.js +
  TypeScript + Tailwind + shadcn/ui + framer-motion + Clerk + Supabase + Prisma + wagmi/viem +
  keys de Alchemy/Infura hardcodeadas + deploy en Vercel. Nada de NestJS/BullMQ (eso lo armaría
  un equipo de verdad; él ni sabe que existen).
- **Coherencia temporal (fundada 2021 vs. app Next.js 2024-25):** Fluvia **nació en 2021 como
  operación manual** (Telegram + spreadsheets + un OTC partner en CDMX, sin producto de software).
  El "producto" Next.js que el lure expone es un **rebuild 2024-25** que Diego hizo solo con
  Claude. El año "2021" en el About es **verdad dentro de la ficción** (es la fecha de fundación
  y la pista de la password), pero la pila técnica es 2024-25. Esta historia resuelve la
  incoherencia "fundada en 2021 pero el stack es Next.js App Router" sin forzar nada.

---

## 2. Backstory completa del founder

### 2.1 Quién es Diego Arévalo (personaje inexistente)

- **Nombre ficticio:** Diego Arévalo. (NO una persona real. Cualquier parecido es accidental.)
- **Perfil:** ~34 años, chilango (CDMX), carisma de vendedor, inglés de meeting de Zoom. Estudió
  administración/mercadotecnia; **nunca tocó código**. Pasó por ventas/ops en una fintech de
  pagos mediana (ficticia) donde aprendió el *pitch* de "pagos más rápidos y baratos que el banco"
  pero **no** la ingeniería que hay detrás.
- **Personalidad:** FOMO permanente, cree que el timing es más importante que la ejecución.
  Reutiliza contraseñas, guarda "las llaves" en un `.env` que sube a GitHub, y llama "no-custodial"
  a cualquier cosa para sonar serio. Es el perfil que *él mismo* atrae como víctima — y, en el
  lure, es la **fuente de todas las credenciales débiles y todos los tells**.

### 2.2 Por qué usa Claude (y por qué es verosímil)

- **Motivo económico:** tras el cripto-invierno 2022-23 no levanta ronda ni puede contratar un
  CTO. Un dev decente en CDMX le costaría más de lo que factura; Claude Max le sale ~$200/mes y
  "no pide equity".
- **Motivo de ego/identidad:** compró el relato de "los founders ya no necesitan developers".
  Su feed de X está lleno de "I vibe-coded a $10k MRR SaaS this weekend". Para él, la barrera de
  entrada a *construir* desapareció.
- **Qué sabe (y qué no):** sabe *promptear* ("hazme un dashboard de tesorería con shadcn/ui y
  framer-motion, que se vea premium"), sabe pegar código, y sabe pulsar "Deploy" en Vercel. **No
  sabe** qué es una migración de Prisma, qué es un secret manager, qué es rate-limiting, qué es
  un RPC key leak, ni por qué `NEXT_PUBLIC_*` es público. Es exactamente por eso que el lure
  tiene los tells que tiene.

### 2.3 Justificación de coherencia: "fundada 2021" vs. "app vibe-coded 2024-25"

La regla de oro del protocolo (D1) exige **coherencia interna**: el año de fundación, la marca y
la pila técnica no pueden contradecirse ante un atacante que investiga. La solución elegida y
**justificada** es la de **"fundación 2021, rebuild 2024-25"**:

1. **2021–2023 = fase "concierge" sin software.** Fluvia operó como *manual desk*: Diego y un
   amigo movían USDC/USDT a mano por Telegram, llevaban balances en una Google Sheet, y liquidaban
   a través de un OTC partner en CDMX. Había "negocio", había unos pocos comercios/freelancers,
   pero **no había producto de software**. (Esto es realista: muchas rampas LatAm arrancaron así.)
2. **2024-25 = fase "producto" vibe-coded.** Diego descubre Claude y decide "por fin construir la
   plataforma". El resultado es la app Next.js que el lure expone. Es un **rebuild desde cero** de
   la pila operativa manual — no una migración.
3. **El año "2021" sigue siendo verdad** (fecha de fundación, aparece en About/footer y es la pista
   de la password `Fluvia2021!`). El stack 2024-25 **no contradice** esa fecha porque un founder
   no-técnico *reescribiendo su propio negocio* es una narrativa creíble en 2026. La alternativa
   ("fundada 2024") rompería la pista de la password y adelgazaría la historia; la alternativa
   ("fundada 2021 y siempre tuvo esta app") sería incoherente (Next.js App Router + `app/` no
   existían así en 2021).

> **Consecuencia práctica para el lure:** la página About dirá "Founded 2021, Mexico City" y el
> footer `© 2021–2026`. El blog/README podrá mencionar vagamente "nuestra nueva plataforma (2025)"
> para que un atacante curioso encuentre la explicación del rebuild y no un artefacto mixto.

---

## 3. Timeline de cómo "construyó" el negocio (FICCIÓN)

| Año | Hito (ficción) | Qué había realmente |
|---|---|---|
| **2021** | Funda Fluvia en CDMX. "Raise" pre-seed ángel (ficticio, ~$150k). Promete "stablecoin rails para LATAM". | Nada técnico: un grupo de Telegram, una Google Sheet de balances, un OTC partner. |
| **2022** | Pivota a remesas/payroll US→MX. Dos o tres comercios/contratistas. | Operación manual, margen fino, cero software. Cripto-invierno golpea. |
| **2023** | "Modo supervivencia". El equipo se reduce a él + 1 persona de ops. | Sigue sin producto. El pitch sobrevive, la ingeniería no existe. |
| **2024** | Descubre Claude. Empieza a "aprender" prompteando. Primera app de juguete (un dashboard). | Suscripción Claude Pro. Nace la idea de "construir la plataforma yo solo". |
| **2024-25** | **Vibe-codea el rebuild completo** de Fluvia en Next.js y lo lanza en Vercel. | Un solo repo, `.env` commiteado, keys hardcodeadas, `/admin` a medias. |
| **2025-26** | "Shippea" features pidiéndole a Claude: checkout, wallet-connect, dashboard, "withdraw". | Todo a medio terminar, TODO comments por todos lados, badge de Vercel sin quitar. |
| **2026 (presente)** | El lure está "en producción" en `fluvia.finance`. Diego cree que es "post-MVP, listo para escalar". | En realidad: la superficie perfecta para que un atacante entre. |

---

## 4. Qué le salió mal (el desastre técnico que ES el lure)

La ficción técnica: Diego cree que "deployar a Vercel = producción lista". Lo que *de verdad*
quedó mal (y que el lure **expone a propósito** como señuelo):

1. **Secretos en el repo:** `.env` y `.env.local` commiteados con `ALCHEMY_API_KEY`,
   `INFURA_PROJECT_ID`, `DATABASE_URL`, `JWT_SECRET`, `WALLET_PRIVATE_KEY` (todas de relleno).
2. **Keys en el front:** `NEXT_PUBLIC_ALCHEMY_KEY` / `NEXT_PUBLIC_INFURA_ID` embebidas en el
   bundle JS del cliente (le pidió a Claude "que el wallet-connect funcione" y así quedó).
3. **Endpoints de debug sin quitar:** `/api/debug` y `/api/health` que devuelven versión de
   Next.js, motor de DB, y fragmentos de config.
4. **Admin a medio terminar:** `/admin` con auth a medias y credenciales default deducibles
   (`admin@fluvia.finance` / `Fluvia2021!`).
5. **TODOs y código de Claude sin limpiar:** `// TODO: fix auth`, `// TODO: rate limit`,
   `// this is a placeholder, ask Claude to finish` diseminados, más source maps expuestos.
6. **Sin hardening:** `robots.txt` default de Next.js, badge "Deploy on Vercel" en el footer,
   CORS abierto, sin rate-limit, sin 2FA, sin logs de auditoría.
7. **Marketing vs. realidad:** la web promete "MPC + multisig, the way it's supposed to be done",
   pero la "custodia" real son keys en un `.env` y una seed en `wallet.json`.

> El punto de todo esto: **cada defecto es un honeytoken**. El atacante que los reconoce como
> "vibe-coder slop" y los explota queda registrado por el watcher stack (ver `03-honeypot-adaptation.md`).

---

## 5. El stack CLAIMED (default de vibe-coder 2026)

> Lo que Fluvia **dice** que corre (y lo que el repo/endpoints exponen). **NO es la arquitectura
> que armaría un equipo real** — es exactamente lo que Claude le devuelve a un no-técnico en 2026.

| Capa | Elección del vibe-coder | Por qué la eligió (ficción) |
|---|---|---|
| **Framework** | Next.js (App Router) + TypeScript | "Claude me dijo que es el default moderno" |
| **Estilos** | Tailwind CSS + shadcn/ui | "se ve como Linear/Vercel, premium" |
| **Animaciones** | framer-motion | "para que el dashboard se sienta vivo" |
| **Auth** | Clerk (o NextAuth) | "login con Google/GitHub en 5 min" |
| **DB** | Supabase / Neon (Postgres) + **Prisma** | "Prisma genera el ORM solo" |
| **Web3** | wagmi + viem (+ Thirdweb para algún NFT/connect) | "conectar wallets sin escribir web3" |
| **RPC** | **Alchemy / Infura** — keys hardcodeadas | "copié las keys del `.env` al front para que funcione" |
| **Deploy** | **Vercel** | "git push → Deploy, no pensé más" |
| **Colas/jobs** | **NO HAY** (nada de NestJS/BullMQ) | ni sabe que existen; "el sweep lo hace un cron de Vercel o nada" |

**Anti-pattern explícito (por diseño):** el stack **NO** lleva NestJS ni BullMQ. Esos son
componentes de una arquitectura *real* de payments (cola de confirmaciones, workers de sweep,
scheduler). Un no-técnico vibe-codeando no los instala — y su **ausencia** es parte del tell: el
lure *dice* "sweep jobs keep operating funds hot" (copy del pitch) pero **no hay ningún worker**
detrás; la ficción es que "el job está roto/a medias" (`// TODO: schedule the sweep`).

---

## 6. TELLS del vibe-coder que el lure expone a propósito

> Catálogo maestro de los tells. Cada uno es una **superficie de captura** (evento dedicado) y
> una **señal de intención** (qué quiere el actor). El detalle de instrumentación vive en
> `03-honeypot-adaptation.md`; el inventario de activos en `02-architecture.md`.

| # | Tell expuesto | Qué fuga / qué insinúa | Atacante que atrae | Evento de captura |
|---|---|---|---|---|
| 1 | **`.env` / `.env.local` commiteado** (keys falsas: Alchemy, Infura, Supabase, JWT, `WALLET_PRIVATE_KEY` de relleno) | "las llaves están acá, tómalas" | wallet-drainer, skimmer, secret-scanner | `seed_touch` / `env_touch` |
| 2 | **`/api/debug`** | versión de Next.js, path del árbol, fragmentos de config | hunter, mapper | `api_call` |
| 3 | **`/api/health`** | `{status, db, auth, version}` info-leak tentador | hunter, mapper | `api_call` |
| 4 | **`/admin` a medio terminar + creds default** (`admin@fluvia.finance` / `Fluvia2021!`) | panel de tesorería con "withdraw" y "export seed" | credential-stuffer, brute-force | `auth_attempt` / `auth_success` |
| 5 | **`// TODO: fix auth`** (y TODOs similares en source/source-maps expuestos) | "la seguridad está a medias, entra" | hunter, mapper | `source_map_touch` |
| 6 | **`robots.txt` default de Next.js** (o ausente) | nada se ocultó, todo es indexable/escaneable | commodity crawler, mapper | `http_access` |
| 7 | **Badge "Deploy on Vercel"** en el footer/README | "esto lo deployó un no-técnico" | hunter (confirma el perfil del founder) | `http_access` (footer) |
| 8 | **Keys hardcodeadas en el front** (`NEXT_PUBLIC_ALCHEMY_KEY`, `NEXT_PUBLIC_INFURA_ID` en el bundle JS) | "puedo robar/abusar el RPC key" | crypto-bro, minero, abuser de RPC | `bundle_touch` / `rpc_key_use` |
| 9 | **Source maps en producción** (`.js.map` sin deshabilitar en `next.config`) | código fuente completo de la app | hunter, mapper | `source_map_touch` |
| 10 | **`prisma/schema.prisma` + `supabase/config.toml` en el repo** | schema de DB, tablas, roles | hunter | `schema_touch` |

**Regla de los tells (heredada del Run 1):** los tells son **deliberados y consistentes** — todos
apuntan a la misma ficción ("un no-técnico vibe-codeó esto"). Ningún tell debe *contradecir* otro
(p.ej. no mezclar un `.env` ordenado de equipo real con un `/admin` a medias). El conjunto forma
una **única historia técnica** que un atacante sofisticado "confirma" en lugar de detectar como
artefacto.

---

## 7. Reglas duras y deducibilidad (lo que congela este story bible)

- **Credenciales deducibles del sitio:** `admin@fluvia.finance` / `Fluvia2021!` (año en About),
  `ops@fluvia.finance` / `FluviaOps123!`, `kyc@fluvia.finance` / `FluviaKyc123!`,
  `founder@fluvia.finance` / `Fluvia2021!`, `finance@fluvia.finance` / `Finance!2024`.
  (Ver `02-architecture.md` §3.5 — cuentas de la app del lure, NO del box real.)
- **La password SSH entrópica del filtro** (Cowrie) es independiente y vive en
  `03-honeypot-adaptation.md` (`Monero@2021`): **no** mezclar la password web con la SSH.
  **Nota de coherencia Monero vs. stablecoins:** aunque el negocio de Fluvia es on/off-ramp de
  stablecoins (USDC/USDT), Diego es un crypto-bro con raíces *privacy-coin* y el sitio mantiene un
  guiño a **Monero (XMR)** ("también aceptamos Monero") en el hero/About. Ese guiño es la pista
  "moneda" que hace deducible `Monero@2021` (moneda + año de fundación). Así la password SSH del
  filtro no contradice el vertical stablecoin: Monero no es el producto, es la *contraseña
  personal* del founder.
- **Zero real:** Diego, Fluvia, las claves, los balances, los KYC y la suscripción de Claude son
  ficción. Ninguna clave/seed/fondo real puede entrar al box. Egress bloqueado. Identidad de
  Fluvia **jamás** revelada (regla de "jactancia" del Run 1).
- **Byte-stable tras lanzar:** este story bible se congela antes de desplegar el lure (D1). Cualquier
  cambio de nombre/año/password rompería la deducibilidad y la comparación cross-run.
