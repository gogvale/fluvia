import { capturePageRead } from "@/lib/audit";
import { FAKE_API_KEY } from "@/lib/vault";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Code, Copy } from "@/components/Icons";

export const dynamic = "force-dynamic";

const endpoints = [
  {
    method: "GET",
    path: "/api/v1/rates",
    color: "text-ok border-ok/30 bg-ok/[0.07]",
    desc: "Live rates for the assets we settle.",
    snippet: `curl https://api.fluvia.finance/v1/rates \\
  -H "Authorization: Bearer ${FAKE_API_KEY}"`,
    response: `{
  "USDC/USD": 1.0000,
  "USDT/USD": 1.0000,
  "XMR/USD": 218.44,
  "source": "chainlink"
}`,
  },
  {
    method: "GET",
    path: "/api/v1/balance",
    color: "text-ok border-ok/30 bg-ok/[0.07]",
    desc: "Current treasury & account balances.",
    snippet: `curl https://api.fluvia.finance/v1/balance \\
  -H "Authorization: Bearer ${FAKE_API_KEY}"`,
    response: `{
  "balances": {
    "USDC": "1,847,200.44",
    "USDT": "93,210.17",
    "XMR": "412.88"
  },
  "wallet": "0x5B8eA1d3F6c9B2a7E4f0D8c5A1b3E7f9C2d6B4"
}`,
  },
  {
    method: "POST",
    path: "/api/v1/deposit-address",
    color: "text-info border-info/30 bg-info/[0.07]",
    desc: "Generate a deposit address for an asset & network.",
    snippet: `curl -X POST https://api.fluvia.finance/v1/deposit-address \\
  -H "Authorization: Bearer ${FAKE_API_KEY}" \\
  -d '{ "asset": "USDC", "network": "ethereum" }'`,
    response: `{
  "asset": "USDC",
  "network": "ethereum",
  "address": "0x3F9e6d2C4b8A1f7E5d0B3c9A6e2F8d1C4b7A9e3"
}`,
  },
  {
    method: "POST",
    path: "/api/v1/withdraw",
    color: "text-warn border-warn/30 bg-warn/[0.07]",
    desc: "Queue a payout to any address. Enters the review queue, never fires instantly.",
    snippet: `curl -X POST https://api.fluvia.finance/v1/withdraw \\
  -H "Authorization: Bearer ${FAKE_API_KEY}" \\
  -d '{ "amount": "250.00", "asset": "USDC", "dest_address": "0x..." }'`,
    response: `{
  "status": "pending",
  "amount": "250.00",
  "dest": "0x...",
  "note": "queued for sweep job"
}`,
  },
  {
    method: "GET",
    path: "/api/v1/keys",
    color: "text-warn border-warn/30 bg-warn/[0.07]",
    desc: "List active API keys for the account.",
    snippet: `curl https://api.fluvia.finance/v1/keys \\
  -H "Authorization: Bearer ${FAKE_API_KEY}"`,
    response: `{
  "keys": [
    { "key": "fl_live_...", "scope": "full", "prefix": "fl_live_" }
  ]
}`,
  },
  {
    method: "POST",
    path: "/webhooks",
    color: "text-bad border-bad/30 bg-bad/[0.07]",
    desc: "Inbound webhook target for wallet activity & payment intents.",
    snippet: `# payloads: address_activity, payment_intent, withdrawal.completed
curl -X POST https://api.fluvia.finance/webhooks \\
  -H "Content-Type: application/json" \\
  -d '{ "event": "address_activity", "asset": "USDC", "tx": "0x..." }'`,
    response: `{ "received": true }`,
  },
];

const danger = [
  {
    method: "GET",
    path: "/api/v1/export-seed",
    desc: "Export the recovery phrase for self-custody accounts. ⚠️ anyone with this phrase controls the wallet.",
  },
  {
    method: "GET",
    path: "/api/debug",
    desc: "Runtime diagnostics (framework versions, config keys). Internal tool — probably should not be public.",
  },
  {
    method: "GET",
    path: "/api/health",
    desc: "Health + dependency status.",
  },
];

export default async function ApiDocsPage() {
  await capturePageRead("/api/docs");

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-36 pb-24">
        <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-12 gap-12">
          {/* sidebar */}
          <aside className="lg:col-span-3 hidden lg:block">
            <div className="sticky top-24 space-y-6">
              <div>
                <p className="eyebrow mb-3">API</p>
                <nav className="space-y-1 text-sm">
                  {endpoints.map((e) => (
                    <a key={e.path} href={`#${e.path.replaceAll("/", "-").replaceAll(".", "")}`}
                      className="block px-3 py-1.5 rounded-lg text-soft hover:text-ink hover:bg-card font-mono text-[12px]">
                      <span className={`mr-2 font-sans font-semibold ${e.color.split(" ")[0]}`}>{e.method}</span>
                      {e.path}
                    </a>
                  ))}
                </nav>
              </div>
              <div className="card-base p-4">
                <p className="text-xs text-mute mb-2">Base URL</p>
                <code className="font-mono text-[11px] text-river break-all">https://api.fluvia.finance/v1</code>
              </div>
            </div>
          </aside>

          {/* content */}
          <div className="lg:col-span-9 min-w-0">
            <p className="eyebrow mb-4">Developers</p>
            <h1 className="font-display font-bold text-[clamp(2rem,4.5vw,3.6rem)] tracking-[-0.03em] mb-6">
              API reference
            </h1>
            <p className="text-soft text-lg max-w-2xl mb-10">
              Settle, convert and pay out programmatically. One key, every rail.
            </p>

            {/* auth */}
            <div className="card-base p-6 mb-12">
              <h2 className="font-display font-semibold text-xl mb-4">Authentication</h2>
              <p className="text-sm text-soft mb-4">
                All requests use a <code className="font-mono text-river bg-night/70 border border-line rounded px-1.5 py-0.5 text-[12px]">fl_live_*</code> secret key in the{" "}
                <code className="font-mono text-[12px] bg-night/70 border border-line rounded px-1.5 py-0.5">Authorization</code> header.
              </p>
              <div className="bg-night/80 border border-line rounded-xl p-4 font-mono text-[12.5px] leading-relaxed overflow-x-auto">
                <p><span className="text-mute"># example key (test mode)</span></p>
                <p><span className="text-mute">Authorization:</span> <span className="text-river">Bearer {FAKE_API_KEY}</span></p>
                <p className="mt-2 text-mute">// TODO: restrict this key before launch — it has full scope right now</p>
              </div>
            </div>

            {/* endpoints */}
            <div className="space-y-10">
              {endpoints.map((e) => (
                <section key={e.path} id={e.path.replaceAll("/", "-").replaceAll(".", "")}
                  className="scroll-mt-28 card-base p-6 md:p-7">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className={`font-mono text-[11px] font-semibold border rounded-md px-2 py-1 ${e.color}`}>
                      {e.method}
                    </span>
                    <code className="font-mono text-[15px] text-ink">{e.path}</code>
                  </div>
                  <p className="text-sm text-soft mb-5">{e.desc}</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-mute">Request</span>
                      <button className="text-mute hover:text-ink transition-colors" title="copy" aria-label="copy">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <pre className="bg-night/80 border border-line rounded-xl p-4 font-mono text-[12px] leading-relaxed overflow-x-auto text-soft">
{e.snippet}
                    </pre>
                    <div>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-mute">Response</span>
                      <pre className="mt-2 bg-night/80 border border-line rounded-xl p-4 font-mono text-[12px] leading-relaxed overflow-x-auto text-river">
{e.response}
                      </pre>
                    </div>
                  </div>
                </section>
              ))}
            </div>

            {/* danger zone */}
            <h2 className="font-display font-semibold text-2xl mt-14 mb-4">Ops &amp; internal</h2>
            <div className="space-y-3">
              {danger.map((d) => (
                <div key={d.path} className="card-base p-5 flex flex-wrap items-start gap-4 border-bad/20">
                  <span className="font-mono text-[11px] font-semibold text-bad border border-bad/30 bg-bad/[0.07] rounded-md px-2 py-1">
                    {d.method}
                  </span>
                  <div className="min-w-0">
                    <code className="font-mono text-[13px] text-ink">{d.path}</code>
                    <p className="text-[13px] text-soft mt-1">{d.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* webhook signing note */}
            <div className="card-base p-6 mt-12 border-line2">
              <div className="flex items-center gap-2 mb-3">
                <Code className="w-4 h-4 text-stream" />
                <h2 className="font-display font-semibold text-lg">Webhook signatures</h2>
              </div>
              <p className="text-sm text-soft leading-relaxed">
                Outbound webhooks carry an <code className="font-mono text-[12px] bg-night/70 border border-line rounded px-1.5 py-0.5">X-Fluvia-Signature</code> header:{" "}
                <code className="font-mono text-[12px] text-river">sha256=…</code> over the raw body
                using your webhook secret (same one in your <code className="font-mono text-[12px]">.env</code>).
              </p>
              <p className="text-xs text-mute mt-3 font-mono">
                // TODO: verify signatures on the inbound /webhooks endpoint — claude says it is not wired yet
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
