import Link from "next/link";
import { capturePageRead } from "@/lib/audit";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CountUp from "@/components/CountUp";
import Faq from "@/components/Faq";
import {
  Bolt,
  ArrowRight,
  Check,
  Shield,
  Key,
  Wallet,
  Clock,
  Globe,
  Code,
  Percent,
  Layers,
  Landmark,
  Sparkle,
} from "@/components/Icons";

export const dynamic = "force-dynamic";

const heroStats = [
  { value: 1.2, decimals: 1, prefix: "$", suffix: "B+", label: "settled on Fluvia" },
  { value: 48000, suffix: "+", label: "freelancers paid" },
  { value: 90, prefix: "~", suffix: "s", label: "avg settlement" },
  { value: 99.99, decimals: 2, suffix: "%", label: "uptime" },
];

const trustedBy = ["Norte Labs", "cosecha.co", "Vela Studio", "Tandil Digital", "Altamar", "loomi"];

const bento = [
  {
    icon: Landmark,
    title: "On/off-ramp, fiat ⇄ stablecoin",
    desc: "Link a local account, deposit in MX/AR/CO, and move between fiat and USDC/USDT without the correspondent-bank tax.",
    span: "md:col-span-2",
  },
  {
    icon: Layers,
    title: "Multi-chain by default",
    desc: "Ethereum, Tron, Solana and the L2s you actually use.",
    span: "",
    chips: ["ETH", "TRON", "SOL", "BASE"],
  },
  {
    icon: Bolt,
    title: "Instant settle",
    desc: "Deposits confirm in ~90 seconds. Your client's money stops sleeping in a SWIFT queue.",
    span: "",
  },
  {
    icon: Key,
    title: "Self-custody option",
    desc: "Prefer your own keys? Take the non-custodial route. Your keys, your coins.",
    span: "",
  },
  {
    icon: Shield,
    title: "Treasury, MPC + multisig",
    desc: "Operating float stays in hot wallets, everything else sweeps to cold. 2-of-3 on the big moves.",
    span: "md:col-span-2",
    extra: (
      <div className="mt-4 font-mono text-[11px] text-mute space-y-1">
        <p>hot_ops    → 0x5B8e…d6B4  <span className="text-ok">(float)</span></p>
        <p>cold_vault → 0x9D1e…B6d0  <span className="text-warn">(sweep target)</span></p>
      </div>
    ),
  },
  {
    icon: Code,
    title: "API for devs",
    desc: "One key, every rail. Rates, balances, deposit addresses, payouts.",
    span: "md:col-span-2",
    extra: (
      <pre className="mt-4 font-mono text-[11px] leading-relaxed text-river bg-night/70 border border-line rounded-lg p-3 overflow-x-auto">
{`curl -X POST https://api.fluvia.finance/v1/withdraw \\
  -H "Authorization: Bearer fl_live_..." \\
  -d '{ "amount": 250, "asset": "USDC" }'`}
      </pre>
    ),
  },
  {
    icon: Percent,
    title: "Flat, published rates",
    desc: "0.5% on-ramp · 0.1% conversions. No hidden spread, no “market-rate magic”.",
    span: "",
  },
  {
    icon: Globe,
    title: "No KYC on crypto rails",
    desc: "Light onboarding, full verification only above thresholds. USDC · USDT · XMR in, dollars out.",
    span: "",
  },
];

const steps = [
  {
    n: "01",
    title: "On-ramp",
    desc: "Link an account or send crypto to your dedicated deposit address — per asset, per chain.",
  },
  {
    n: "02",
    title: "Hold & convert",
    desc: "Real-time balances priced by live feeds. Convert between USD-pegged stablecoins at a flat rate.",
  },
  {
    n: "03",
    title: "Payout",
    desc: "Withdraw to a local bank or any wallet. Sweep jobs keep operating funds hot and the treasury cold.",
  },
  {
    n: "04",
    title: "Self-custody",
    desc: "Don't want us holding anything? Take the keys. Never a cent held that we don't have to.",
  },
];

const band = [
  { value: 390, prefix: "$", suffix: "B+", label: "stablecoin payments in 2025" },
  { value: 71, suffix: "%", label: "of LATAM B2B cross-border already on stablecoin rails" },
  { value: 13, suffix: "s", label: "Solana finality — vs. 1–5 days over SWIFT" },
  { value: 226, prefix: "$", suffix: "B", label: "B2B stablecoin settlement, +733% YoY" },
];

const tiers = [
  {
    name: "Starter",
    price: "$0",
    period: "/mo",
    blurb: "For the first invoice.",
    features: ["USDC/USDT on-chain", "Off-ramp to local bank (MX/AR/CO)", "Email support"],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/mo",
    blurb: "For freelancers who live off invoices.",
    features: [
      "Priority settlement (~90s)",
      "Multi-chain deposit addresses",
      "Self-custody option",
      "0.75% + $0.25 payouts",
    ],
    cta: "Go Pro",
    highlight: true,
  },
  {
    name: "Business",
    price: "Custom",
    period: "",
    blurb: "For teams & exporters.",
    features: [
      "Volume pricing",
      "Full API access",
      "Dedicated treasury (MPC + multisig)",
      "Travel-rule reporting",
    ],
    cta: "Talk to us",
    highlight: false,
  },
];

const testimonials = [
  {
    quote:
      "My client in Austin pays USDC on Friday afternoon and I have pesos in my MX account before I finish dinner. It used to be Wednesday.",
    name: "Mariana G.",
    role: "freelance product designer · Buenos Aires",
    initials: "MG",
  },
  {
    quote:
      "We pay 14 contractors across 6 countries every month. Fluvia took the whole payroll operation from two days of bank work to one export.",
    name: "Tomás R.",
    role: "studio owner · Medellín",
    initials: "TR",
  },
  {
    quote:
      "I keep a bit of XMR on the side and the fact they don't ask questions on the crypto rails — that's why I switched from the big exchanges.",
    name: "Camila S.",
    role: "ops lead, remote team · CDMX",
    initials: "CS",
  },
];

const faqs: { q: string; a: string }[] = [
  {
    q: "Is Fluvia a bank?",
    a: "Nope. We're a payments rail — your money settles on-chain, not in a vault that closes at 4pm. 🏦🚫",
  },
  {
    q: "How fast do I actually get paid?",
    a: "Deposits confirm in ~90s on the chains we support. Off-ramp to a local bank is same-day in most LATAM corridors.",
  },
  {
    q: "What are the fees, really?",
    a: "Flat and published — no \"market spread\" magic. On-ramp is 0.5%, conversions 0.1%, payouts from 0.75% + $0.25. What you see is what you pay. 💸",
  },
  {
    q: "Do you hold my keys?",
    a: "Only if you want us to. Prefer your own keys? Take the non-custodial route — your keys, your coins.",
  },
  {
    q: "Which chains do you support?",
    a: "Ethereum, Tron, Solana, and the L2s you actually use. We meet you where your client already pays.",
  },
  {
    q: "Is my money safe?",
    a: "Treasury sits in MPC + multisig cold storage. Hot wallets only ever hold operating float. 🔐",
  },
  {
    q: "What do I need to start?",
    a: "An email and an invoice. KYC is light for small amounts, full verification above thresholds. That's it.",
  },
];

export default async function HomePage() {
  await capturePageRead("/");

  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* ---------- HERO ---------- */}
        <section className="relative overflow-hidden">
          {/* mesh gradient blobs */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full blur-3xl opacity-25"
              style={{ background: "radial-gradient(closest-side, #22D3EE, transparent)" }} />
            <div className="absolute top-20 -left-40 w-[500px] h-[500px] rounded-full blur-3xl opacity-20"
              style={{ background: "radial-gradient(closest-side, #2DD4BF, transparent)" }} />
            <div className="absolute top-40 -right-40 w-[520px] h-[520px] rounded-full blur-3xl opacity-20"
              style={{ background: "radial-gradient(closest-side, #8B5CF6, transparent)" }} />
            <div className="absolute inset-0 bg-noise" />
          </div>

          <div className="mx-auto max-w-7xl px-6 pt-40 pb-16 text-center">
            <div className="animate-fade-up inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium text-soft mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-ok animate-pulse-dot" />
              Live — USDC ⇄ USDT, on-chain and instant
            </div>

            <h1 className="animate-fade-up [animation-delay:80ms] font-display font-bold tracking-[-0.03em] leading-[1.02] text-[clamp(2.6rem,6.5vw,5.2rem)]">
              Get paid in dollars.
              <span className="block text-gradient">Settle in minutes.</span>
            </h1>

            <p className="animate-fade-up [animation-delay:160ms] mx-auto mt-6 max-w-2xl text-lg text-soft leading-relaxed">
              Fluvia is the on/off-ramp that turns your invoices into dollars in minutes. No SWIFT,
              no correspondent bank, no 5-day &ldquo;hold.&rdquo; ⚡
            </p>

            <div className="animate-fade-up [animation-delay:240ms] mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/admin" className="btn-primary text-base !px-7 !py-3.5">
                Start free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/api/v1/rates" className="btn-ghost text-base !px-7 !py-3.5">
                View live rates
              </Link>
            </div>
            <p className="animate-fade-up [animation-delay:300ms] mt-5 text-xs text-mute">
              No card required · Settle in ~90s · Fees from 0.5%
            </p>

            {/* volume counters */}
            <div className="animate-fade-up [animation-delay:380ms] mt-14 grid grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden rounded-2xl border border-line bg-line">
              {heroStats.map((s) => (
                <div key={s.label} className="bg-card/90 px-6 py-7">
                  <div className="font-display font-bold text-3xl md:text-4xl text-ink">
                    <CountUp
                      value={s.value}
                      decimals={s.decimals ?? 0}
                      prefix={s.prefix ?? ""}
                      suffix={s.suffix ?? ""}
                    />
                  </div>
                  <div className="mt-1.5 text-xs text-mute">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- TRUSTED BY ---------- */}
        <section className="border-y border-line bg-surface/60 py-8">
          <div className="mx-auto max-w-7xl px-6">
            <p className="text-center text-xs uppercase tracking-[0.2em] text-mute mb-6">
              Trusted by 48,000+ freelancers &amp; teams across LATAM
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
              {trustedBy.map((t) => (
                <span
                  key={t}
                  className="font-display font-semibold text-lg text-mute/80 hover:text-soft transition-colors cursor-default"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- BENTO FEATURES ---------- */}
        <section id="features" className="py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="max-w-2xl mb-12">
              <p className="eyebrow mb-3">The platform</p>
              <h2 className="font-display font-bold text-4xl md:text-5xl tracking-tight">
                Your money shouldn&rsquo;t wait for bank hours 🌊
              </h2>
              <p className="mt-4 text-soft text-lg">
                The dollar already moves at the speed of a block. Fluvia is the last mile.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {bento.map((cell) => {
                const Icon = cell.icon;
                return (
                  <div
                    key={cell.title}
                    className={`group relative card-base p-6 overflow-hidden transition-all duration-300 hover:border-line2 hover:-translate-y-0.5 hover:shadow-glow ${cell.span}`}
                  >
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                      style={{
                        background:
                          "radial-gradient(circle at top, rgba(45,212,191,0.10), transparent 60%)",
                      }}
                    />
                    <div className="relative">
                      <div className="w-11 h-11 rounded-xl bg-river/10 border border-river/20 flex items-center justify-center text-river mb-4">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-display font-semibold text-lg text-ink mb-1.5">
                        {cell.title}
                      </h3>
                      <p className="text-sm text-soft leading-relaxed">{cell.desc}</p>
                      {cell.chips && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {cell.chips.map((c) => (
                            <span key={c} className="chip !text-[10px] !px-2 !py-0.5 font-mono">
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                      {cell.extra}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ---------- HOW IT WORKS TEASER ---------- */}
        <section id="how" className="py-24 bg-surface border-y border-line">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="eyebrow mb-3">How it works</p>
              <h2 className="font-display font-bold text-4xl md:text-5xl tracking-tight">
                From invoice to dollars in four steps
              </h2>
            </div>
            <div className="grid md:grid-cols-4 gap-4 relative">
              <div className="hidden md:block absolute top-[52px] left-[12%] right-[12%] h-px bg-gradient-to-r from-stream via-river to-deep opacity-40" />
              {steps.map((s) => (
                <div key={s.n} className="card-base p-6 relative bg-card/80">
                  <div className="w-11 h-11 rounded-full brand-gradient text-night font-display font-bold flex items-center justify-center mb-4 shadow-glow">
                    {s.n.slice(1)}
                  </div>
                  <h3 className="font-display font-semibold text-lg text-ink mb-1.5">{s.title}</h3>
                  <p className="text-sm text-soft leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link href="/how-it-works" className="btn-ghost">
                See the full flow <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ---------- STATS BAND ---------- */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="relative overflow-hidden rounded-3xl border border-line px-8 py-14">
              <div className="absolute inset-0 -z-0 opacity-40"
                style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.10), rgba(45,212,191,0.05) 45%, rgba(139,92,246,0.10))" }} />
              <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
                {band.map((s) => (
                  <div key={s.label}>
                    <div className="font-display font-bold text-4xl md:text-5xl text-gradient tnum">
                      <CountUp value={s.value} prefix={s.prefix ?? ""} suffix={s.suffix ?? ""} />
                    </div>
                    <p className="mt-2 text-xs md:text-sm text-soft max-w-[220px] mx-auto">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
              <p className="relative mt-10 text-center text-xs text-mute">
                Stablecoin payments crossed <span className="text-soft">$390B in 2025</span> — the
                rails are ready. The on-ramp is the last mile.
              </p>
            </div>
          </div>
        </section>

        {/* ---------- PRICING TEASER ---------- */}
        <section id="pricing" className="py-24 bg-surface border-y border-line">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="eyebrow mb-3">Pricing</p>
              <h2 className="font-display font-bold text-4xl md:text-5xl tracking-tight">
                Pricing that scales with your invoices
              </h2>
              <p className="mt-4 text-soft">
                Every tier: flat published rates, no hidden spread. Cancel anytime.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto items-stretch">
              {tiers.map((t) => (
                <div
                  key={t.name}
                  className={`relative card-base p-7 flex flex-col ${
                    t.highlight ? "border-river/50 shadow-glow-strong" : ""
                  }`}
                >
                  {t.highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-mono uppercase tracking-widest text-night brand-gradient rounded-full px-3 py-1">
                      Most popular
                    </span>
                  )}
                  <h3 className="font-display font-semibold text-xl text-ink">{t.name}</h3>
                  <p className="text-sm text-soft mt-1 mb-5">{t.blurb}</p>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="font-display font-bold text-4xl text-ink">{t.price}</span>
                    <span className="text-sm text-mute">{t.period}</span>
                  </div>
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {t.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-soft">
                        <Check className="w-4 h-4 text-river mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/admin"
                    className={t.highlight ? "btn-primary w-full" : "btn-ghost w-full"}
                  >
                    {t.cta}
                  </Link>
                </div>
              ))}
            </div>
            <p className="text-center mt-10">
              <Link href="/pricing" className="text-sm text-river hover:text-stream inline-flex items-center gap-1.5">
                Full fee schedule &amp; calculator <ArrowRight className="w-4 h-4" />
              </Link>
            </p>
          </div>
        </section>

        {/* ---------- TESTIMONIALS ---------- */}
        <section className="py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="eyebrow mb-3">Wall of love</p>
              <h2 className="font-display font-bold text-4xl md:text-5xl tracking-tight">
                Freelancers don&rsquo;t wait for wires
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {testimonials.map((t) => (
                <figure key={t.name} className="card-base p-7 flex flex-col">
                  <Sparkle className="w-4 h-4 text-warn mb-4" />
                  <blockquote className="text-[15px] text-soft leading-relaxed flex-1">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full brand-gradient text-night font-display font-bold flex items-center justify-center text-sm">
                      {t.initials}
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-ink">{t.name}</div>
                      <div className="text-xs text-mute">{t.role}</div>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- FAQ ---------- */}
        <section id="faq" className="py-24 bg-surface border-y border-line">
          <div className="mx-auto max-w-3xl px-6">
            <div className="text-center mb-12">
              <p className="eyebrow mb-3">FAQ</p>
              <h2 className="font-display font-bold text-4xl md:text-5xl tracking-tight">
                Questions, answered
              </h2>
            </div>
            <Faq items={faqs} />
          </div>
        </section>

        {/* ---------- CTA ---------- */}
        <section className="py-24">
          <div className="mx-auto max-w-5xl px-6">
            <div className="relative overflow-hidden rounded-3xl border border-line px-8 py-16 text-center">
              <div className="absolute inset-0 opacity-25"
                style={{ background: "linear-gradient(135deg, #22D3EE, #2DD4BF 45%, #8B5CF6)" }} />
              <div className="absolute inset-0 bg-noise" />
              <div className="relative">
                <Wallet className="w-9 h-9 mx-auto text-ink mb-5" />
                <h2 className="font-display font-bold text-4xl md:text-5xl tracking-tight text-ink">
                  Settle the way money should move.
                </h2>
                <p className="mt-4 text-ink/80 max-w-xl mx-auto">
                  Join 48,000+ freelancers who stopped watching the clock on cross-border payments.
                </p>
                <div className="mt-9 flex flex-col sm:flex-row justify-center gap-3">
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 rounded-xl bg-night text-ink px-7 py-3.5 text-base font-semibold hover:bg-elevated transition-colors"
                  >
                    Start free <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/about"
                    className="inline-flex items-center justify-center gap-2 rounded-xl glass px-7 py-3.5 text-base font-semibold text-ink hover:bg-white/[0.07] transition-colors"
                  >
                    Read our story
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
