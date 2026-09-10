import Link from "next/link";
import { capturePageRead } from "@/lib/audit";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight, Shield, Key, Check } from "@/components/Icons";

export const dynamic = "force-dynamic";

const steps = [
  {
    n: "1",
    title: "On-ramp",
    time: "~5 min to set up",
    body: [
      "Create your account with an email — KYC stays light under the threshold.",
      "Link a local bank account (MX / AR / CO) or grab a dedicated deposit address per asset.",
      "Deposit fiat or send USDC/USDT/XMR straight to your address. Multi-chain: Ethereum, Tron, Solana, and the L2s.",
    ],
  },
  {
    n: "2",
    title: "Hold & convert",
    time: "real-time",
    body: [
      "Balances are live, priced by Chainlink feeds + spot aggregators.",
      "Convert between USD-pegged stablecoins at a flat, published 0.1%.",
      "No hidden spread, ever — the rate you see is the rate you get.",
    ],
  },
  {
    n: "3",
    title: "Payout",
    time: "~90s on-chain / same-day fiat",
    body: [
      "Withdraw to any wallet, or off-ramp to your local bank in minutes-to-same-day.",
      "Large operations run on MPC + multisig — hot wallets only hold operating float.",
      "Sweep jobs keep the treasury cold automatically.",
    ],
  },
  {
    n: "4",
    title: "Self-custody (optional)",
    time: "your keys, your coins",
    body: [
      "Prefer to hold your own keys? Export your recovery phrase and go non-custodial.",
      "We never hold a cent we don't have to.",
    ],
  },
];

const chains = [
  { name: "Ethereum", note: "USDC / USDT (ERC-20), final in ~12 blocks" },
  { name: "Tron", note: "USDT (TRC-20) — dominant on LATAM remittance rails" },
  { name: "Solana", note: "USDC (SPL), ~13s finality, pennies of gas" },
  { name: "Base · Arbitrum · Optimism", note: "L2s for cheap retail payments" },
  { name: "Monero", note: "XMR in — the founder's privacy-coin nod, no KYC" },
  { name: "Bitcoin (mainnet + LN)", note: "accepted for deposit, treasury reserve" },
];

export default async function HowItWorksPage() {
  await capturePageRead("/how-it-works");

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-36 pb-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl mb-16">
            <p className="eyebrow mb-3">How it works</p>
            <h1 className="font-display font-bold text-[clamp(2.2rem,5vw,4rem)] tracking-[-0.03em]">
              From invoice to <span className="text-gradient">dollars in minutes</span>
            </h1>
            <p className="mt-4 text-soft text-lg">
              The same money, minus the 1985 plumbing. Four steps between your client&rsquo;s
              payment and your bank account.
            </p>
          </div>

          {/* steps */}
          <div className="space-y-5 mb-24">
            {steps.map((s, i) => (
              <div key={s.n} className="card-base p-7 md:p-8 grid md:grid-cols-12 gap-6 items-start">
                <div className="md:col-span-2 flex md:flex-col items-center md:items-start gap-4">
                  <span className="w-14 h-14 rounded-2xl brand-gradient text-night font-display font-bold text-2xl flex items-center justify-center shadow-glow shrink-0">
                    {s.n}
                  </span>
                  <div>
                    <div className="font-display font-bold text-2xl text-ink">{s.title}</div>
                    <div className="font-mono text-[11px] text-mute mt-1 uppercase tracking-wider">{s.time}</div>
                  </div>
                </div>
                <div className="md:col-span-10 md:border-l md:border-line md:pl-8 space-y-3">
                  {s.body.map((b) => (
                    <p key={b} className="flex items-start gap-3 text-[15px] text-soft leading-relaxed">
                      <Check className="w-4 h-4 text-river mt-1 shrink-0" />
                      {b}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* chains */}
          <h2 id="chains" className="font-display font-semibold text-3xl mb-2">Supported chains</h2>
          <p className="text-soft mb-8 max-w-2xl">
            We meet you where your client already pays. Deposit addresses are generated per asset,
            per chain.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-24">
            {chains.map((c) => (
              <div key={c.name} className="card-base p-5 hover:border-line2 transition-colors">
                <h3 className="font-display font-semibold text-ink">{c.name}</h3>
                <p className="text-[13px] text-soft mt-1.5 leading-relaxed">{c.note}</p>
              </div>
            ))}
          </div>

          {/* security */}
          <div className="grid lg:grid-cols-2 gap-6 mb-10">
            <div className="card-base p-8">
              <Shield className="w-6 h-6 text-river mb-4" />
              <h2 className="font-display font-semibold text-2xl mb-3">Treasury, the way it&rsquo;s supposed to be done</h2>
              <p className="text-soft text-[15px] leading-relaxed">
                Custodial balances sit behind MPC (multi-party computation) key shares across 2–3
                parties — no single server ever holds a full key — plus Gnosis Safe 2-of-3 multisig
                for the operational wallets. Hot wallets hold only operating float; everything else
                sweeps to cold storage.
              </p>
              <div className="mt-5 font-mono text-[11px] text-mute border border-line rounded-lg p-3 bg-night/60 space-y-1">
                <p>hot_ops    · MPC share A/B/C · float only</p>
                <p>treasury   · Safe 2-of-3    · HSM / air-gapped</p>
                <p>sweep rule · &gt;$5k idle → cold vault</p>
              </div>
            </div>
            <div className="card-base p-8">
              <Key className="w-6 h-6 text-stream mb-4" />
              <h2 className="font-display font-semibold text-2xl mb-3">Self-custody, always an option</h2>
              <p className="text-soft text-[15px] leading-relaxed">
                Not your keys, not your coins — we take that seriously. On the non-custodial route
                you export your own recovery phrase and we simply never have access. Custody is a
                service you opt into, not a default.
              </p>
              <ul className="mt-5 space-y-2.5 text-sm text-soft">
                {["Export your phrase from the dashboard, anytime", "Sign your own payouts with your own keys", "Keep using Fluvia rails without the vault"].map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-stream mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="card-base p-8 flex flex-col sm:flex-row items-center justify-between gap-5 border-river/25">
            <div>
              <h3 className="font-display font-semibold text-xl">Ready to stop waiting on wires?</h3>
              <p className="text-sm text-soft mt-1">No card required · Settle in ~90s · Fees from 0.5%</p>
            </div>
            <Link href="/admin" className="btn-primary shrink-0">
              Start free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
