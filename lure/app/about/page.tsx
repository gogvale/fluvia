import Link from "next/link";
import { capturePageRead } from "@/lib/audit";
import { FOUNDED, FOUNDER, HQ } from "@/lib/vault";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight, Shield, Key, Bolt } from "@/components/Icons";

export const dynamic = "force-dynamic";

const timeline = [
  {
    year: "2021",
    title: "Founded in Mexico City",
    body: "Fluvia starts as a two-person desk — Telegram, a shared spreadsheet of balances, and one patient OTC partner. The pitch was simple: dollars shouldn't take a week to cross a border.",
  },
  {
    year: "2022–2023",
    title: "The crypto winter",
    body: "No round, no big team — just Diego and one ops person keeping the desks running while everyone else left the industry. The rails kept moving.",
  },
  {
    year: "2024",
    title: "Building the real platform",
    body: "Diego sits down and rebuilds the whole manual operation as software. The result is the platform you're using today — built by a founder who still answers support tickets himself.",
  },
  {
    year: "Today",
    title: "The last mile",
    body: "48,000+ freelancers and small teams settle on Fluvia every month. Still small, still independent, still in Mexico City. The river keeps flowing.",
  },
];

const values = [
  {
    icon: Bolt,
    title: "Settle in minutes",
    body: "Speed isn't a feature, it's the whole point. If a block can finalize in seconds, so can your paycheck.",
  },
  {
    icon: Key,
    title: "Your keys, your coins",
    body: "Custody is opt-in. The non-custodial route is a first-class product, not a checkbox.",
  },
  {
    icon: Shield,
    title: "Small but serious",
    body: "Treasury in MPC + multisig cold storage. No leverage, no yield-chasing, no games with client funds.",
  },
];

export default async function AboutPage() {
  await capturePageRead("/about");

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="relative overflow-hidden pt-40 pb-20">
          <div className="absolute inset-0 -z-10">
            <div className="absolute -top-32 right-0 w-[560px] h-[420px] rounded-full blur-3xl opacity-15"
              style={{ background: "radial-gradient(closest-side, #2DD4BF, transparent)" }} />
            <div className="absolute top-10 -left-40 w-[480px] h-[480px] rounded-full blur-3xl opacity-15"
              style={{ background: "radial-gradient(closest-side, #8B5CF6, transparent)" }} />
          </div>
          <div className="mx-auto max-w-7xl px-6">
            <p className="eyebrow mb-4">About Fluvia</p>
            <h1 className="font-display font-bold text-[clamp(2.2rem,5vw,4.2rem)] leading-[1.05] tracking-[-0.03em] max-w-4xl">
              We&rsquo;re the last mile between{" "}
              <span className="text-gradient">the dollar</span> and the people who earn it.
            </h1>
            <div className="mt-8 grid md:grid-cols-3 gap-6 max-w-4xl">
              <div className="card-base p-6">
                <div className="font-display font-bold text-3xl text-river tnum">{FOUNDED}</div>
                <div className="text-sm text-soft mt-1">Founded, Mexico City</div>
              </div>
              <div className="card-base p-6">
                <div className="font-display font-bold text-3xl text-stream tnum">48k+</div>
                <div className="text-sm text-soft mt-1">Freelancers &amp; teams served</div>
              </div>
              <div className="card-base p-6">
                <div className="font-display font-bold text-3xl text-deep tnum">6–12</div>
                <div className="text-sm text-soft mt-1">People. Small by design.</div>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-24">
          <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-5 gap-12">
            <div className="lg:col-span-3">
              <h2 className="font-display font-semibold text-2xl mb-5">The story of the river</h2>
              <div className="space-y-4 text-soft leading-relaxed">
                <p>
                  Fluvia was founded in <strong className="text-ink">{FOUNDED}</strong> by{" "}
                  <strong className="text-ink">{FOUNDER}</strong>, an ex-payments ops lead who got
                  tired of watching cross-border money sit in someone else&rsquo;s pipeline. He spent
                  years inside a payments company watching freelancers wait 4–6 business days for a
                  wire — minus $30–60 in correspondent-bank and FX fees — and decided the dollar
                  should move like the internet does.
                </p>
                <p>
                  The name comes from <em>fluvius</em>, the Latin word for river. Money should flow,
                  not crawl. After the cripto-invierno of 2022–23 thinned the industry out, Diego
                  rebuilt the whole operation himself — the platform you&rsquo;re reading this on is
                  that rebuild. No giant engineering org, no venture-fueled burn. Just a small team
                  in {HQ} shipping the last mile of the stablecoin economy.
                </p>
                <p>
                  And yes — ask Diego about the Monero rabbit hole sometime. He keeps a soft spot
                  for the privacy rails, which is why Fluvia still accepts XMR alongside USDC and
                  USDT. 🌊
                </p>
              </div>

              <div className="mt-10 grid sm:grid-cols-3 gap-4">
                {values.map((v) => {
                  const Icon = v.icon;
                  return (
                    <div key={v.title} className="card-base p-5">
                      <Icon className="w-5 h-5 text-river mb-3" />
                      <h3 className="font-display font-semibold text-[15px] mb-1.5">{v.title}</h3>
                      <p className="text-[13px] text-soft leading-relaxed">{v.body}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="card-base p-6 mb-5">
                <h3 className="font-display font-semibold text-lg mb-4">Our path so far</h3>
                <div className="relative pl-5 space-y-6 border-l border-line">
                  {timeline.map((t) => (
                    <div key={t.year} className="relative">
                      <span className="absolute -left-[26px] top-1.5 w-2.5 h-2.5 rounded-full bg-river ring-4 ring-river/15" />
                      <div className="font-mono text-[11px] text-river uppercase tracking-wider">
                        {t.year}
                      </div>
                      <h4 className="font-semibold text-[15px] text-ink mt-1">{t.title}</h4>
                      <p className="text-[13px] text-soft mt-1 leading-relaxed">{t.body}</p>
                    </div>
                  ))}
                </div>
              </div>
              <blockquote className="card-base p-6 border-river/25">
                <p className="text-soft italic leading-relaxed">
                  &ldquo;I didn&rsquo;t build Fluvia because I love technology. I built it because I
                  watched too many people get paid two weeks late for work they already finished. The
                  tech is just the excuse.&rdquo;
                </p>
                <footer className="mt-4 text-sm text-ink font-medium">
                  — {FOUNDER}, founder &amp; CEO
                </footer>
              </blockquote>
              <div className="mt-5 card-base p-6" id="team">
                <h3 className="font-display font-semibold text-lg mb-4">The team</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full brand-gradient text-night font-display font-bold flex items-center justify-center text-sm">DA</span>
                    <div>
                      <div className="text-sm font-semibold text-ink">{FOUNDER}</div>
                      <div className="text-xs text-mute">Founder &amp; CEO — ex-payments ops, never wrote code before 2024</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-elevated border border-line2 text-soft font-display font-bold flex items-center justify-center text-sm">LR</span>
                    <div>
                      <div className="text-sm font-semibold text-ink">Lucía Rentería</div>
                      <div className="text-xs text-mute">Ops &amp; treasury — the one who actually reconciles the sheets</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-7xl px-6 mt-16 flex flex-col sm:flex-row items-center justify-between gap-4 card-base p-7">
            <div>
              <h3 className="font-display font-semibold text-xl">Want in on the river?</h3>
              <p className="text-sm text-soft mt-1">Get paid in dollars. Settle in minutes.</p>
            </div>
            <Link href="/admin" className="btn-primary shrink-0">
              Start free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
