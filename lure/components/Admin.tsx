"use client";

// Admin console — login + treasury dashboard.
// TODO: fix auth — right now the dashboard is open to anyone who knows the URL
// TODO: schedule the sweep job properly (vercel cron was never wired up)
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Logo, ArrowRight, Alert, Copy, Key, Refresh, Send, Wallet, Lock, Check } from "./Icons";
import { alchemyKey } from "@/lib/config";

export interface BalanceMap {
  USDC: string;
  USDT: string;
  XMR: string;
}

const balanceMeta: Record<string, { label: string; sub: string; tone: string }> = {
  USDC: { label: "USDC · Ethereum", sub: "cold vault + hot float", tone: "text-ok" },
  USDT: { label: "USDT · Tron (TRC-20)", sub: "remittance rail", tone: "text-info" },
  XMR: { label: "XMR · Monero", sub: "privacy rail — no KYC", tone: "text-deep" },
};

const activity = [
  { id: "0x9f3a…c21e", type: "Sweep → cold vault", asset: "USDC", amount: "+$212,400.00", status: "completed", time: "2m ago" },
  { id: "0x71bc…9a02", type: "Payout · invoice #INV-4412", asset: "USDT", amount: "−$4,850.00", status: "completed", time: "14m ago" },
  { id: "0x2de8…f771", type: "Deposit · client (AR)", asset: "USDC", amount: "+$8,120.50", status: "confirming", time: "31m ago" },
  { id: "xmr-tx-7f1a…", type: "Off-ramp · XMR rail", asset: "XMR", amount: "−12.40", status: "pending", time: "1h ago" },
  { id: "0x88aa…b0f3", type: "Conversion USDT→USDC", asset: "USDC", amount: "+$25,000.00", status: "completed", time: "3h ago" },
];

export function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        try {
          window.localStorage.setItem("fluvia_session", "1");
        } catch {}
        onSuccess();
      } else {
        setError(data.error || "Invalid credentials. Please try again.");
      }
    } catch {
      setError("Network error — is the server up?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="card-base p-8">
        <div className="flex justify-center mb-6">
          <span className="w-12 h-12 rounded-2xl brand-gradient flex items-center justify-center text-night">
            <Lock className="w-5 h-5" />
          </span>
        </div>
        <h1 className="font-display font-semibold text-xl text-center text-ink mb-1">
          Admin console
        </h1>
        <p className="text-center text-xs text-mute mb-7">Treasury &amp; operations</p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-mute mb-1.5" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="text"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@fluvia.finance"
              className="w-full bg-night/70 border border-line rounded-xl px-3.5 py-2.5 text-sm text-ink placeholder:text-mute/60 focus:outline-none focus:ring-2 focus:ring-river/40 focus:border-line2 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-mute mb-1.5" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-night/70 border border-line rounded-xl px-3.5 py-2.5 text-sm text-ink placeholder:text-mute/60 focus:outline-none focus:ring-2 focus:ring-river/40 focus:border-line2 transition"
            />
          </div>
          {error && (
            <p className="text-xs text-bad flex items-center gap-1.5">
              <Alert className="w-3.5 h-3.5" /> {error}
            </p>
          )}
          <button type="submit" disabled={busy} className="btn-primary w-full !py-2.5 disabled:opacity-60">
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-[11px] text-mute">
          For internal use · ops &amp; treasury only
        </p>
      </div>
    </div>
  );
}

export function WithdrawBox() {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USDC");
  const [dest, setDest] = useState("");
  const [result, setResult] = useState<null | Record<string, unknown>>(null);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setResult(null);
    try {
      const res = await fetch("/api/v1/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, currency, dest_address: dest }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setErr("request failed");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {["USDC", "USDT", "XMR"].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCurrency(c)}
            className={`rounded-lg border px-2 py-1.5 text-xs font-mono transition ${
              currency === c
                ? "border-river/60 bg-river/10 text-river"
                : "border-line text-soft hover:border-line2"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount (or all / max)"
        className="w-full bg-night/70 border border-line rounded-xl px-3.5 py-2.5 text-sm font-mono text-ink placeholder:text-mute/60 focus:outline-none focus:ring-2 focus:ring-river/40"
      />
      <div className="flex gap-2">
        {["all", "max", "50%"].map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setAmount(q)}
            className="chip !py-1 hover:border-line2 hover:text-ink transition-colors"
          >
            {q}
          </button>
        ))}
      </div>
      <input
        value={dest}
        onChange={(e) => setDest(e.target.value)}
        placeholder="Destination address (any chain)"
        className="w-full bg-night/70 border border-line rounded-xl px-3.5 py-2.5 text-sm font-mono text-ink placeholder:text-mute/60 focus:outline-none focus:ring-2 focus:ring-river/40"
      />
      <button type="submit" className="btn-primary w-full !py-2.5">
        <Send className="w-4 h-4" /> Queue withdrawal
      </button>
      {result && (
        <pre className="font-mono text-[11px] leading-relaxed text-river bg-night/70 border border-line rounded-lg p-3 overflow-x-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
      {err && <p className="text-xs text-bad">{err}</p>}
    </form>
  );
}

export function DashboardPanel({
  balances,
  wallet,
}: {
  balances: BalanceMap;
  wallet: string;
}) {
  const [seedOpen, setSeedOpen] = useState(false);
  const [seed, setSeed] = useState("");
  const [seedBusy, setSeedBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function exportSeed() {
    setSeedBusy(true);
    try {
      const res = await fetch("/api/v1/export-seed");
      const data = await res.json();
      setSeed(data.mnemonic ?? "");
      setSeedOpen(true);
    } catch {
      setSeed("error fetching seed");
      setSeedOpen(true);
    } finally {
      setSeedBusy(false);
    }
  }

  function copySeed() {
    if (!seed) return;
    navigator.clipboard?.writeText(seed).catch(() => {});
    setCopied(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-6">
      {/* balances */}
      <div className="grid md:grid-cols-3 gap-4">
        {(Object.keys(balances) as Array<keyof BalanceMap>).map((asset) => {
          const meta = balanceMeta[asset];
          return (
            <div key={asset} className="card-base p-6 relative overflow-hidden group">
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ background: "radial-gradient(circle at top, rgba(45,212,191,0.08), transparent 60%)" }}
              />
              <div className="text-xs text-mute font-medium">{meta.label}</div>
              <div className={`mt-2 font-display font-bold text-[26px] tnum ${meta.tone}`}>
                {asset === "XMR" ? balances[asset] : `$${balances[asset]}`}
              </div>
              <div className="text-[11px] text-mute mt-0.5">{meta.sub}</div>
              <div className="mt-3 flex items-center gap-1.5 text-[10px] font-mono text-ok">
                <Refresh className="w-3 h-3" /> live · just now
              </div>
            </div>
          );
        })}
      </div>

      {/* hot wallet */}
      <div className="card-base p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-mute mb-1">Hot ops wallet</div>
          <code className="font-mono text-[13px] text-ink break-all">{wallet}</code>
        </div>
        <span className="chip !border-ok/30 !text-ok !bg-ok/[0.06] !text-[10px]">float only</span>
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        {/* withdraw */}
        <div className="lg:col-span-2 card-base p-6">
          <h3 className="font-display font-semibold text-lg mb-1 flex items-center gap-2">
            <Send className="w-4 h-4 text-river" /> Quick withdrawal
          </h3>
          <p className="text-[12px] text-mute mb-4">
            Enters the review queue — swept by the ops job.
          </p>
          <WithdrawBox />
        </div>

        {/* seed export */}
        <div className="lg:col-span-3 card-base p-6 border-bad/20">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-display font-semibold text-lg flex items-center gap-2">
              <Key className="w-4 h-4 text-warn" /> Wallet seed
            </h3>
            <span className="chip !border-bad/30 !text-bad !bg-bad/[0.06] !text-[10px]">sensitive</span>
          </div>
          <p className="text-[12px] text-soft leading-relaxed mb-4">
            Recovery phrase for the hot ops wallet (self-custody export). Anyone with this phrase
            controls the funds — keep it offline. 🔐
          </p>
          <button
            onClick={exportSeed}
            disabled={seedBusy}
            className="btn !bg-bad/10 !text-bad border border-bad/30 hover:bg-bad/20 !py-2.5 disabled:opacity-60"
          >
            <Key className="w-4 h-4" />
            {seedBusy ? "Exporting…" : "Export wallet seed"}
          </button>
          <div className="mt-4 font-mono text-[10.5px] text-mute space-y-0.5">
            <p>// TODO: fix auth — dashboard is reachable without a session</p>
            <p>// TODO: schedule the sweep job (check every 5 min → cold vault)</p>
          </div>
        </div>
      </div>

      {/* seed reveal */}
      {seedOpen && (
        <div className="card-base p-6 border-warn/40">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-display font-semibold text-base flex items-center gap-2">
              <Alert className="w-4 h-4 text-warn" /> Recovery phrase (12 words)
            </h4>
            <button onClick={copySeed} className="chip hover:text-ink transition-colors">
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-ok" /> copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" /> copy
                </>
              )}
            </button>
          </div>
          <div className="bg-night/80 border border-warn/20 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {seed.split(" ").filter(Boolean).map((w, i) => (
              <span key={i} className="font-mono text-[13px] text-ink">
                <span className="text-mute mr-1.5">{i + 1}.</span>
                {w}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-warn/80 mt-3">
            ⚠️ Never share this phrase. Anyone who has it can empty the wallet.
          </p>
        </div>
      )}

      {/* activity */}
      <div className="card-base overflow-hidden">
        <div className="px-6 py-4 border-b border-line flex items-center justify-between">
          <h3 className="font-display font-semibold text-lg">Recent activity</h3>
          <span className="chip !text-[10px]">synced · 4s ago</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-mute border-b border-line">
                <th className="px-6 py-3 font-medium">Tx</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Asset</th>
                <th className="px-6 py-3 font-medium text-right">Amount</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {activity.map((t) => (
                <tr key={t.id} className="border-b border-line/60 last:border-0">
                  <td className="px-6 py-3 font-mono text-[12px] text-mute">{t.id}</td>
                  <td className="px-6 py-3 text-soft">{t.type}</td>
                  <td className="px-6 py-3 font-mono text-[12px] text-soft">{t.asset}</td>
                  <td className={`px-6 py-3 font-mono text-[12px] tnum text-right ${t.amount.startsWith("+") ? "text-ok" : "text-ink"}`}>
                    {t.amount}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${
                        t.status === "completed"
                          ? "text-ok"
                          : t.status === "confirming"
                          ? "text-info"
                          : "text-warn"
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* rpc status (config keys are baked into the client build — todo: server-side envs) */}
      <div className="card-base p-4 flex items-center justify-between">
        <span className="text-[11px] text-mute font-mono">rpc.alchemy.com · {alchemyKey.slice(0, 14)}…</span>
        <span className="chip !border-ok/30 !text-ok !bg-ok/[0.06] !text-[10px]">connected</span>
      </div>

      {/* nav */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Link href="/" className="text-xs text-mute hover:text-soft inline-flex items-center gap-1.5">
          ← back to site
        </Link>
        <Link href="/api/docs" className="text-xs text-river hover:text-stream inline-flex items-center gap-1.5">
          API docs <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

export function AdminApp({ balances, wallet }: { balances: BalanceMap; wallet: string }) {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem("fluvia_session") === "1") setAuthed(true);
    } catch {}
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-6 pt-14 pb-20">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <Logo className="w-8 h-8" />
          <div>
            <div className="font-display font-bold text-xl text-ink leading-none">
              Fluvia <span className="text-mute font-sans font-normal text-sm">/ ops console</span>
            </div>
            <div className="text-[11px] text-mute mt-1">Treasury · settlements · rails</div>
          </div>
        </div>
        <span className="chip !text-[10px]">
          <Wallet className="w-3 h-3" /> v1.0.0 · prod
        </span>
      </div>
      {authed ? (
        <DashboardPanel balances={balances} wallet={wallet} />
      ) : (
        <AdminLogin onSuccess={() => setAuthed(true)} />
      )}
    </div>
  );
}
