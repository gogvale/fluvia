import { capturePageRead } from "@/lib/audit";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

const sections = [
  {
    id: "terms",
    title: "1. Terms of Service",
    body: [
      "Fluvia Finance S.A. de C.V. ('Fluvia', 'we', 'us') operates a digital payments platform that lets users send, receive, convert and settle USDC, USDT and other supported digital assets, and off-ramp to local currency in supported corridors.",
      "By creating an account or using the platform you agree to these terms. If you are using the platform on behalf of a company, you represent that you are authorized to bind it.",
      "Fluvia is a payments technology provider, not a bank. Digital assets held on the platform are not deposits and are not insured by any government deposit insurance scheme.",
    ],
  },
  {
    id: "eligibility",
    title: "2. Eligibility & accounts",
    body: [
      "You must be at least 18 years old and resident in a supported jurisdiction to open an account.",
      "You are responsible for safeguarding your login credentials and any recovery phrase you export. Anyone in possession of your credentials or phrase can control your assets; we cannot reverse an on-chain transfer.",
      "One account per person unless you have an approved Business account.",
    ],
  },
  {
    id: "kyc",
    title: "3. KYC / AML policy",
    body: [
      "Fluvia applies a risk-tiered compliance program. Accounts below established thresholds may operate with light verification (email + phone). Above thresholds, full identity verification applies, including document review and proof-of-source-of-funds where required.",
      "Crypto-to-crypto rails (including the Monero rail) do not require document submission for personal accounts under applicable thresholds.",
      "We reserve the right to request additional information, freeze activity, or close accounts where required by law or where activity appears suspicious.",
    ],
  },
  {
    id: "privacy",
    title: "4. Privacy",
    body: [
      "We collect the minimum information needed to operate the platform: account details, transaction records, and verification documents where applicable.",
      "We do not sell personal data. Verification data is shared only with regulated compliance partners and authorities where legally required.",
      "Transaction data on public blockchains is inherently public. We cannot delete on-chain history.",
    ],
  },
  {
    id: "travel",
    title: "5. Travel rule & sanctions",
    body: [
      "Where required by the FATF travel rule, Fluvia exchanges originator and beneficiary information with counterparties for transfers above applicable thresholds.",
      "The platform is not available in sanctioned jurisdictions or to sanctioned persons. By using Fluvia you confirm you are not subject to such measures.",
    ],
  },
  {
    id: "fees",
    title: "6. Fees",
    body: [
      "Fees are flat and published on the Pricing page. Network gas is passed through at cost.",
      "We may update fees with 14 days' notice posted on the platform. Transactions initiated before an update are charged at the prior rate.",
    ],
  },
  {
    id: "liability",
    title: "7. Risk disclosure & liability",
    body: [
      "Digital asset prices and network conditions can change rapidly. Settlement finality depends on the relevant blockchain.",
      "To the maximum extent permitted by law, Fluvia is not liable for indirect or consequential losses, including losses from market movement, network congestion, or third-party failures.",
      "If a withdrawal is executed on-chain to an address you provided, it is irrevocable. Double-check every address — including the destination network.",
    ],
  },
  {
    id: "contact",
    title: "8. Contact",
    body: [
      "Fluvia Finance S.A. de C.V. — Mexico City, Mexico.",
      "Support: support@fluvia.finance",
    ],
  },
];

export default async function TermsPage() {
  await capturePageRead("/terms");

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-36 pb-24">
        <div className="mx-auto max-w-3xl px-6">
          <p className="eyebrow mb-4">Legal</p>
          <h1 className="font-display font-bold text-[clamp(2rem,4.5vw,3.4rem)] tracking-[-0.03em] mb-3">
            Terms of Service
          </h1>
          <p className="text-sm text-mute mb-12">Last updated: September 1, 2026</p>

          <div className="space-y-10">
            {sections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="font-display font-semibold text-xl mb-3">{s.title}</h2>
                <div className="space-y-3">
                  {s.body.map((p, i) => (
                    <p key={i} className="text-[15px] text-soft leading-relaxed">
                      {p}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <p className="mt-14 text-xs text-mute border-t border-line pt-6">
            © 2021–2026 Fluvia Finance S.A. de C.V. · Mexico City · All rights reserved.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
