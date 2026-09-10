import Link from "next/link";
import { capturePageRead } from "@/lib/audit";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Check, ArrowRight } from "@/components/Icons";

export const dynamic = "force-dynamic";

// the fee schedule (flat & published)
const feeRows = [
  { service: "On-ramp (fiat → USDC/USDT)", fee: "0.5%", note: "MX · AR · CO bank transfer, same-day" },
  { service: "Stablecoin conversion", fee: "0.1%", note: "USDC ⇄ USDT, flat and published" },
  { service: "Payout to local bank", fee: "flat", note: "published per corridor — no FX spread games" },
  { service: "Monero rail (no KYC)", fee: "0.4%", note: "XMR ⇄ USDC/USDT, the founder's nod to privacy coins" },
];

const compare = [
  { what: "Settlement time", fluvia: "~90 seconds", swift: "1–5 business days" },
  { what: "Cost per transfer", fluvia: "cents to $1", swift: "$15–50 + FX spread" },
  { what: "Finality", fluvia: "on-chain, irrevocable", swift: "reversible, hold-prone" },
  { what: "Bank hours", fluvia: "none — runs 24/7", swift: "9am–4pm, Mon–Fri" },
  { what: "Correspondent banks", fluvia: "zero", swift: "2–4 in the middle" },
];

export default async function PricingPage() {
  await capturePageRead("/pricing");

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-36">
        <section className="pb-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="max-w-2xl mb-14">
              <p className="eyebrow mb-3">Pricing</p>
              <h1 className="font-display font-bold text-[clamp(2.2rem,5vw,4rem)] tracking-[-0.03em]">
                Pricing that scales with your invoices
              </h1>
              <p className="mt-4 text-soft text-lg">
                Flat, published rates. What you see is what you pay — no &ldquo;market spread&rdquo;
                magic, no surprise deductions. 💸
              </p>
            </div>

            {/* fee schedule */}
            <h2 className="font-display font-semibold text-2xl mb-5">Fee schedule</h2>
            <div className="card-base overflow-hidden mb-20">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th className="px-6 py-4 font-medium text-mute">Service</th>
                    <th className="px-6 py-4 font-medium text-mute">Fee</th>
                    <th className="px-6 py-4 font-medium text-mute hidden md:table-cell">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {feeRows.map((r) => (
                    <tr key={r.service} className="border-b border-line last:border-0">
                      <td className="px-6 py-4 text-ink">{r.service}</td>
                      <td className="px-6 py-4 font-mono font-medium text-river tnum">{r.fee}</td>
                      <td className="px-6 py-4 text-soft text-[13px] hidden md:table-cell">{r.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* vs bank */}
            <h2 className="font-display font-semibold text-2xl mb-2">Fluvia vs. the bank pipeline</h2>
            <p className="text-soft text-sm mb-5 max-w-2xl">
              Same invoice, two very different weeks. The dollar already moves at the speed of a
              block — your bank just hasn&rsquo;t noticed.
            </p>
            <div className="card-base overflow-hidden mb-20">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th className="px-6 py-4 font-medium text-mute"></th>
                    <th className="px-6 py-4 font-medium text-river">
                      <span className="chip !border-river/30 !text-river !bg-river/[0.06] !text-[10px] mb-0 mr-2">FLUVIA</span>
                      Stablecoin rail
                    </th>
                    <th className="px-6 py-4 font-medium text-mute">SWIFT / bank wire</th>
                  </tr>
                </thead>
                <tbody>
                  {compare.map((c) => (
                    <tr key={c.what} className="border-b border-line last:border-0">
                      <td className="px-6 py-3.5 text-soft">{c.what}</td>
                      <td className="px-6 py-3.5 text-ink font-medium">{c.fluvia}</td>
                      <td className="px-6 py-3.5 text-mute">{c.swift}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* tiers */}
            <h2 className="font-display font-semibold text-2xl mb-5">Plans</h2>
            <div className="grid md:grid-cols-3 gap-5 max-w-5xl items-stretch mb-6">
              {[
                {
                  name: "Starter",
                  price: "$0",
                  blurb: "For the first invoice.",
                  feats: ["1% + $0.50 per payout", "USDC/USDT on-chain", "Off-ramp in MX/AR/CO"],
                },
                {
                  name: "Pro",
                  price: "$19",
                  blurb: "For freelancers who live off invoices.",
                  feats: ["0.75% + $0.25 payouts", "Priority settlement (~90s)", "Multi-chain wallets", "Self-custody option"],
                  hot: true,
                },
                {
                  name: "Business",
                  price: "Custom",
                  blurb: "For teams & exporters.",
                  feats: ["Volume pricing", "API access", "Dedicated treasury (MPC + multisig)", "Travel-rule reporting"],
                },
              ].map((t) => (
                <div key={t.name} className={`relative card-base p-7 flex flex-col ${t.hot ? "border-river/50 shadow-glow-strong" : ""}`}>
                  {t.hot && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-mono uppercase tracking-widest text-night brand-gradient rounded-full px-3 py-1">
                      Most popular
                    </span>
                  )}
                  <h3 className="font-display font-semibold text-xl text-ink">{t.name}</h3>
                  <p className="text-sm text-soft mt-1 mb-5">{t.blurb}</p>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="font-display font-bold text-4xl text-ink">{t.price}</span>
                    <span className="text-sm text-mute">/mo</span>
                  </div>
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {t.feats.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-soft">
                        <Check className="w-4 h-4 text-river mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/admin" className={t.hot ? "btn-primary w-full" : "btn-ghost w-full"}>
                    {t.name === "Business" ? "Talk to us" : "Start free"}
                  </Link>
                </div>
              ))}
            </div>

            <p className="text-center text-xs text-mute mt-8">
              Every tier: flat published rates, no hidden spread. Cancel anytime. 💸
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
