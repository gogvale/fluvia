import Link from "next/link";
import { Logo } from "./Icons";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Pricing", href: "/pricing" },
      { label: "How it works", href: "/how-it-works" },
      { label: "Developer API", href: "/api/docs" },
      { label: "Admin", href: "/admin" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Careers", href: "/about#team" },
      { label: "Contact", href: "mailto:support@fluvia.finance" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "FAQ", href: "/#faq" },
      { label: "Supported chains", href: "/how-it-works#chains" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/terms#privacy" },
      { label: "KYC & AML", href: "/terms#kyc" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5">
              <Logo className="w-7 h-7" />
              <span className="font-display font-bold text-lg text-ink">
                Fluvia<span className="text-gradient">.</span>
              </span>
            </div>
            <p className="mt-4 text-sm text-soft max-w-xs leading-relaxed">
              Money that flows like a river. The on/off-ramp for the stablecoin economy.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-river/30 bg-river/[0.06] px-3.5 py-1.5 text-xs font-medium text-river">
              <span className="w-1.5 h-1.5 rounded-full bg-ok animate-pulse-dot" />
              Trusted by 48,000+ freelancers
            </div>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-line bg-card px-3.5 py-1.5 text-xs text-soft">
              We accept USDC · USDT · Monero (XMR) — no KYC
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-mute mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-soft hover:text-ink transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-line flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-mute">
            © 2021–2026 Fluvia Finance S.A. de C.V. · Mexico City ·{" "}
            <span className="text-mute/70">get paid in dollars</span>
          </p>
          <div className="flex items-center gap-5">
            <span className="text-xs text-mute">English</span>
            <a
              href="https://vercel.com/new?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-mute hover:text-soft inline-flex items-center gap-1.5"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
                <path d="M12 1 23 21H1L12 1z" />
              </svg>
              Deploy on Vercel
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
