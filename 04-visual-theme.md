# 04 — Tema visual + clone de referencia (Fluvia)

**Run 2 · Honeypot de Gabriel Oliveira · Negocio cripto FICTICIO (lure)**

> **ESTADO: 100% FICTICIO. NADA DE LO QUE APARECE AQUÍ ES REAL.**
> No hay dinero real, ni cripto real, ni datos reales. Este documento define la **estética** del
> lure — un negocio de cripto ficticio que debe *parecer* una landing real de "crypto fintech".
> **Regla de oro de diseño:** imitar la ESTÉTICA de la competencia real; **jamás** copiar copy
> exacto con marca registrada; **jamás** revelar que Fluvia es un honeypot.
>
> **Ficción de origen:** el fundador (no-técnico) "vibe-codeó" TODO con Claude → el sitio debe
> verse como una landing de crypto-fintech hecha con **Next.js + Tailwind + shadcn/ui**: dark neon,
> glassmorphism, gradientes, bento grids, contadores animados, microcopy con slang/emojis para
> millennials/zoomers. Errores estéticos *sutiles* (padding ligeramente roto, un gradient
> sobrecargado, un emoji fuera de lugar) son deliberados y contribuyen a la ilusión de "founder
> vibe-coding".

---

## 1. Paleta de colores exacta (dark mode fintech)

> Identidad de marca: **"Fluvia" = río** (`fluvius`). El acento es **agua**: cian/esmeralda
> (teal), con un tercer acento violeta para profundidad de gradiente. Se diferencia a propósito de
> la competencia: Lemon = amarillo/negro, Strike = naranja/ámbar, Bitso = índigo/azul, Mural =
> púrpura. **Fluvia = cian→esmeralda** (el "río de dólares").

### 1.1 Fondo y superficies (near-black, con tinte azul-verde)

| Token | Hex | Uso |
|---|---|---|
| `bg` (fondo raíz) | **`#060809`** | fondo de la página (near-black con tinte frío) |
| `surface` | **`#0B0E13`** | secciones alternas, fondo del body |
| `card` | **`#10141B`** | tarjetas, bento cells, modales |
| `elevated` | **`#161C26`** | hover de tarjetas, chips, tooltips |
| `border` | **`#1E242E`** | bordes finos (1px), divisores |
| `border-strong` | **`#2A3341`** | bordes activos / focus |

### 1.2 Texto

| Token | Hex | Uso |
|---|---|---|
| `text-primary` | **`#F5F7FA`** | headlines, body principal |
| `text-secondary` | **`#98A2B3`** | párrafos, descripciones |
| `text-muted` | **`#5B6472`** | captions, placeholders, legal |

### 1.3 Acentos (marca = "agua")

| Token | Hex | Rol |
|---|---|---|
| `accent` (emerald/teal) | **`#2DD4BF`** | acento primario de marca (el "río") |
| `accent-cyan` | **`#22D3EE`** | acento secundario (links, highlights, glow) |
| `accent-violet` | **`#8B5CF6`** | acento terciario (extremo del gradiente, hover de CTA) |

### 1.4 Semánticos (estado)

| Token | Hex | Uso |
|---|---|---|
| `success` | **`#34D399`** | saldo, "settled", checkmarks |
| `warning` | **`#FBBF24`** | "pending", avisos |
| `danger` | **`#F87171`** | errores, "failed", warnings de riesgo |
| `info` | **`#38BDF8`** | "confirming", información |

### 1.5 Gradientes (firma visual)

| Nombre | Definición | Uso |
|---|---|---|
| **Brand gradient** | `linear-gradient(135deg, #22D3EE 0%, #2DD4BF 45%, #8B5CF6 100%)` | CTA primario, headline con `bg-clip-text`, logo |
| **Hero mesh** | blobs radiales de `#22D3EE`/`#2DD4BF`/`#8B5CF6` a `opacity 0.15–0.25` sobre `#060809`, con `blur-3xl` | fondo del hero |
| **Card glow** | `radial-gradient(circle at top, rgba(45,212,191,0.12), transparent 60%)` | hover de bento cells |
| **Button shine** | `linear-gradient(180deg, rgba(255,255,255,0.15), transparent 40%)` overlay | brillo superior de CTA |

### 1.6 Glassmorphism

- `bg-white/[0.03]` + `backdrop-blur-xl` + `border-white/[0.08]` para navbar sticky, cards, modales.
- Sombras: `shadow-[0_8px_40px_rgba(45,212,191,0.08)]` (tinte esmeralda) en elementos flotantes.
- Resaltado de foco: `ring-2 ring-[#2DD4BF]/40`.

> **Línea única de la paleta (entregable):**
> `#060809 #0B0E13 #10141B #1E242E #F5F7FA #98A2B3 #5B6472 #2DD4BF #22D3EE #8B5CF6 #34D399 #FBBF24 #F87171`

---

## 2. Pareja tipográfica

| Rol | Fuente | Por qué |
|---|---|---|
| **Display / headlines** | **Space Grotesk** (500/600/700) | geométrica, "techy", distintiva para `Get paid in dollars` — el look vibe-coded fintech |
| **Body / UI** | **Inter** (400/500/600) | estándar fintech, legible, neutra |
| **Mono (números/API/código)** | **JetBrains Mono** (400/500) | montos, `tx_hash`, snippets de `/api/docs`, tablas de fees |

- Escala display: `clamp(2.5rem, 6vw, 5rem)` para el H1; tracking `-0.03em` en headlines.
- Cifras grandes (contadores, montos) → **Space Grotesk** con `font-variant-numeric: tabular-nums`.
- Config Tailwind de referencia: `--font-sans: 'Inter'`, `--font-display: 'Space Grotesk'`, `--font-mono: 'JetBrains Mono'`.

---

## 3. Inventario de componentes (de arriba a abajo en la landing)

1. **Navbar (sticky glass)** — logo wordmark "Fluvia" (con el acento cian), links (`How it works`, `Pricing`, `API`, `About`), botón `Open app →` con brand gradient. Se vuelve glass al hacer scroll.
2. **Hero con gradiente mesh** — mesh de blobs radiales cian/esmeralda/violeta + grid sutil (`bg-grid`) + noise. Badge pill superior (`● Live · USDC ⇄ USDT`). **Headline gigante `Get paid in dollars.`** con la última palabra en brand gradient (`bg-clip-text`). Subhead: `Settle in minutes, for cents — no SWIFT, no bank hours.` Doble CTA (`Start free →` sólido + `View live rates` glass). Debajo, **contador animado** (count-up): `$1.2B+ settled` · `48k+ freelancers` · `~90s avg settlement`.
3. **Logo strip "Trusted by"** — fila de 5-6 logos ficticios (SVG gris, hover color) + caption `Trusted by N freelancers & teams across LATAM`.
4. **Bento grid de features** — 6-8 celdas glass de distinto tamaño (patrón bento 3-col): On/off-ramp fiat⇄stablecoin, Multi-chain (ETH/Tron/Solana/L2), Instant settle, Self-custody ("your keys, your coins"), Treasury (MPC + multisig), API para devs, KYC/AML, FX rate published. Iconos lucide con glow.
5. **Sección "How it works" (teaser)** — 4 pasos numerados (On-ramp → Hold & convert → Payout → Self-custody) con línea de conexión animada.
6. **Contadores animados (stats band)** — banda con 4 métricas count-up sobre gradiente tenue.
7. **Pricing (teaser → tabla completa en `/pricing`)** — 3 tiers con toggle monthly/annual; el tier medio destacado con borde cian + badge `Most popular`.
8. **Testimonios** — 3-6 cards glass con avatar sintético, nombre y rol ("freelancer, Buenos Aires").
9. **FAQ accordion** — shadcn `Accordion`, 6-8 preguntas.
10. **CTA final** — banda con brand gradient, headline + botón.
11. **Footer** — columnas (Product, Company, Resources, Legal), **badges `Trusted by N freelancers`**, selector de idioma, `© 2021–2026 Fluvia Finance S.A. de C.V. · CDMX`, iconos sociales, links a `/terms`, `/api/docs`, `/admin` (discreto).

**Componentes auxiliares (shadcn/ui):** `Button`, `Card`, `Badge`, `Accordion`, `Dialog`, `Table` (pricing), `Tabs` (API docs), `Toggle` (monthly/annual), `Skeleton` (carga), `Tooltip`, `Input`, `Toast`, `Progress` (barra de confirmación de depósito).

---

## 4. Estructura de páginas

| Ruta | Contenido | Nota de lure |
|---|---|---|
| **`/`** | Hero mesh + contador, logo strip, bento features, how-it-works teaser, stats, pricing teaser, testimonios, FAQ, CTA, footer | La landing principal; aquí vive el headline y el contador animado |
| **`/about`** | Historia del "río", **fundado 2021**, HQ CDMX, fundador ficticio **Diego Arévalo**, misión, valores, equipo, "small but credible" | **AQUÍ viven las pistas de la password** (año 2021, "fluvia", "river") — superficie `lure_content_read` |
| **`/pricing`** | Tabla completa de fees (freelancer/Pro/Business), fee calculator, comparativa vs banco/SWIFT, FAQ de precios | Muestra comisiones "reales" (%), credibilidad fintech |
| **`/how-it-works`** | Flujo on/off-ramp de 4 pasos, chains soportadas, tiempos de liquidación, seguridad (MPC/multisig), opción self-custody | Refuerza la promesa "settle in minutes" |
| **`/terms`** | ToS, Privacy, Compliance/KYC, travel rule, footer legal | Superficie estándar, texto legal denso |
| **`/api/docs`** | Docs de desarrolladores: endpoints (`/deposit-address`, `/rates`, `/balance`, `/withdraw`, `/webhooks`), snippets de código, API keys `fl_live_*` / `fl_test_*`, firma de webhooks | Superficie de recon para atacantes API (objeto JSON = superficie de ataque) |
| **`/admin`** | Login + dashboard (balance falso, botón "export seed/backup", lista de usuarios) | **El punto de entrada que el mapper/stuffer fuerza** — `auth_attempt` con raw password |

---

## 5. Clone de referencia — competidores reales (investigación sep-2026)

> Fuente: `web_search`. No pude usar `web_extract` (backend DuckDuckGo es solo-búsqueda), así que el
> análisis se basa en snippets de SERP + el hero copy publicado en cada sitio + conocimiento del
> nicho. Se citan URL y copy real para **imitar la estética**, no para reproducir texto.

### 5.1 Strike (strike.me) — *el hero "get paid in dollars"*
- **Posicionamiento:** "The world's leading digital payments platform built on Bitcoin." Movió su
  discurso a **stablecoins**: anunció depósitos/retiros USDT vía Tron (dic-2024) para AR/BR/SV/IN/
  KE/MX/NG/TG/VN. Su promesa estrella es "send money like you send a text" y "get paid in
  [bitcoin/dollars]".
- **Aesthetic:** minimalista, fintech US de altísimo pulido; blanco/negro con acento **ámbar/naranja**
  (logo de rayo). Mucho espacio en blanco, tipografía grande, copy corto y directo.
- **Lenguaje de features:** "instant", "borderless", "no hidden fees", "settle in minutes", "send
  globally". Énfasis en velocidad y finalidad, no en especulación.
- **Qué imitar de Strike:** el **registro del hero** (headline aspiracional en una línea + subhead
  de "settle in minutes for cents"), el **contador/stat de "pagos procesados"**, y el tono *tranquilo
  y confiable* (Strike no grita "moon", grita "funciona"). La promesa "get paid in dollars" de Fluvia
  es un espejo directo de este registro.

### 5.2 Lemon (lemoncash.ar / lemon.me) — *el tono fintech-zoomer LATAM*
- **Posicionamiento:** "No somos un banco, somos Lemon 🍋". Hero real: *"Tus dólares digitales
  crecen todos los días, gana cashback en tus compras e invierte en acciones."* App + VISA prepaga.
- **Aesthetic:** **amarillo/negro** brillante, juguetón, con **emojis y slang** (TikTok/IG/YouTube:
  "No somos un banco 🍋", "sin vueltas ni complicaciones"). Energía de marca millennial/zoomer
  muy alta, muy "fintech disidente de los bancos".
- **Lenguaje de features:** "dólares digitales", "crece todos los días", "cashback", "abre tu cuenta
  gratis hoy", "disponible en iOS y Android". Todo orientado a beneficio inmediato, nada técnico.
- **Qué imitar de Lemon:** el **tono anti-banco** ("no somos un banco" → en Fluvia: "your money
  shouldn't wait for bank hours"), el uso de **emojis en el microcopy** (⚡💸🌊), y el framing de
  "dólares digitales" como producto de consumo. Es la referencia principal de *voz*.

### 5.3 Mural Pay (muralpay.com) — *el competidor directo de nicho*
- **Posicionamiento:** "Global Accounts. Realtime Payments. One API." — infraestructura de
  stablecoins para cuentas/wallets/pagos; público explícito **freelancers y PyMEs** que cobran del
  exterior. Su blog cubre exactamente el wedge de Fluvia: "how to get paid in USDC", "stablecoin
  payroll for Mexican businesses", "best payment platforms for freelancers".
- **Aesthetic:** clean fintech/API-first, púrpura/azul, orientado a devs y a finanzas; mucho
  "enterprise-grade", "launch in weeks", "one API".
- **Lenguaje de features:** "instant global payments in 40+ currencies", "launch accounts, wallets,
  and payments in weeks", "stablecoin advantage", "transform financial operations".
- **Qué imitar de Mural:** el **vocabulario de wedge** (freelancer → cobra del exterior → stablecoin
  → banco local), la sección de **API/docs como prueba de seriedad**, y el "Global Accounts.
  Realtime Payments." como eslogan estructural. Mural valida que "freelancer + stablecoin + LATAM"
  es un nicho *real y creíble*.

### 5.4 Referencias secundarias (mención)
- **Bitso (bitso.com):** "Invest in crypto, bitcoin, ethereum, and global stocks…" — líder LATAM,
  acento índigo/azul, tono de exchange. Referencia para la **tabla de fees/on-ramp**.
- **Airtm:** "your digital dollar account" — el otro jugador de "dólar digital para freelancers";
  referencia para el **framing de cuenta en dólares**.

> **Síntesis del clone:** registro de hero = **Strike**; voz/tono zoomer = **Lemon**; nicho y
> credibilidad API = **Mural Pay**. Estética cromática propia (cian/esmeralda "río") para no
> solaparse con ninguno.

---

## 6. Microcopy de ejemplo (inglés)

### 6.1 Hero
- Eyebrow badge: `● Live — USDC ⇄ USDT, on-chain and instant`
- H1: `Get paid in dollars.`
- H1 (variante con gradient): `Get paid in **dollars**.`
- Subhead: `Fluvia is the on/off-ramp that turns your invoices into dollars in minutes. No SWIFT, no correspondent bank, no 5-day "hold."`
- CTA primario: `Start free →` · CTA secundario: `View live rates`
- Microcopy bajo CTA: `No card required · Settle in ~90s · Fees from 0.5%`
- Contador: `$1.2B+ settled` · `48,000+ freelancers paid` · `~90s avg settlement` · `99.99% uptime`

### 6.2 Pricing
- Sección: `Pricing that scales with your invoices`
- Tier **Starter** (`$0/mo`): `For the first invoice.` — `1% + $0.50 per payout · USDC/USDT on-chain · Local bank off-ramp in MX/AR/CO`
- Tier **Pro** (`$19/mo` — `Most popular`): `For freelancers who live off invoices.` — `0.75% + $0.25 · Priority settlement · Multi-chain wallets · Self-custody option`
- Tier **Business** (`Custom`): `For teams & exporters.` — `Volume pricing · API access · Dedicated treasury (MPC + multisig) · Travel-rule reporting`
- Toggle: `Monthly` / `Annual (save 20%)`
- Trust line: `Every tier: flat published rates, no hidden spread. Cancel anytime.`

### 6.3 FAQ
- `Is Fluvia a bank?` → `Nope. We're a payments rail — your money settles on-chain, not in a vault that closes at 4pm. 🏦🚫`
- `How fast do I actually get paid?` → `Deposits confirm in ~90s on the chains we support. Off-ramp to a local bank is same-day in most LATAM corridors.`
- `What are the fees, really?` → `Flat and published — no "market spread" magic. Starter is 1% + $0.50. What you see is what you pay. 💸`
- `Do you hold my keys?` → `Only if you want us to. Prefer your own keys? Take the non-custodial route — your keys, your coins.`
- `Which chains do you support?` → `Ethereum, Tron, Solana, and the L2s you actually use. We meet you where your client already pays.`
- `Is my money safe?` → `Treasury sits in MPC + multisig cold storage. Hot wallets only ever hold operating float. 🔐`
- `What do I need to start?` → `An email and an invoice. KYC is light for small amounts, full verification above thresholds. That's it.`

### 6.4 Detalles de tono (reglas)
- Emojis: ⚡ (velocidad), 💸 (dinero), 🌊 (río/marca), 🔐 (custodia), 🏦🚫 (anti-banco). Usar con moderación — 1-2 por bloque, no saturar.
- Frases-gancho reutilizables: `settle in minutes`, `your keys, your coins`, `the dollar already moves at the speed of a block`, `money that flows like a river`.
- Voz: inglés-first, segunda persona, verbos de acción, cero jerga bancaria.

---

## 7. Resumen ejecutivo (para el agente padre)

- **Paleta (una línea):** `#060809 #0B0E13 #10141B #1E242E #F5F7FA #98A2B3 #5B6472 #2DD4BF #22D3EE #8B5CF6 #34D399 #FBBF24 #F87171`
- **Acento de marca:** cian/esmeralda ("el río") + violeta de profundidad; fondo near-black `#060809`.
- **Tipografía:** Space Grotesk (display) + Inter (body) + JetBrains Mono (números/código).
- **3 competidores analizados:** **Strike** (hero "get paid in dollars"), **Lemon** (tono fintech-zoomer LATAM, emojis, "no somos un banco"), **Mural Pay** (nicho freelancer+stablecoin+API). Secundarios: Bitso, Airtm.
- **Componentes clave:** hero mesh + headline gigante + contador animado, bento grid glass, pricing 3-tiers, FAQ accordion, CTA gradient, footer "Trusted by N freelancers".
- **Páginas:** `/`, `/about`, `/pricing`, `/how-it-works`, `/terms`, `/api/docs`, `/admin` (el admin es el punto de entrada del brute-force → superficie `auth_attempt`).
