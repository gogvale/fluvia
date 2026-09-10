import { capturePageEvent } from "@/lib/audit";
import { FAKE_BALANCES, FAKE_WALLET } from "@/lib/vault";
import { DashboardPanel, type BalanceMap } from "@/components/Admin";

// TODO: fix auth on this page — anyone who knows the URL can open it
// TODO: schedule the sweep — the cron job was never actually created in vercel
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await capturePageEvent("admin_action", { surface: "dashboard" }, "/admin/dashboard");
  const balances: BalanceMap = FAKE_BALANCES;

  return (
    <main className="flex-1 min-h-screen">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-32 left-1/3 w-[600px] h-[420px] rounded-full blur-3xl opacity-10"
          style={{ background: "radial-gradient(closest-side, #2DD4BF, transparent)" }} />
      </div>
      <div className="mx-auto max-w-6xl px-6 pt-14 pb-20">
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="font-display font-bold text-xl text-ink">Dashboard</div>
            <div className="text-[11px] text-mute mt-1">
              founder@fluvia.finance · admin · Mexico City
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="chip !text-[10px] !text-ok !border-ok/30">session: active</span>
            <a href="/" className="text-xs text-mute hover:text-soft">← back to site</a>
          </div>
        </div>
        <DashboardPanel balances={balances} wallet={FAKE_WALLET} />
        <p className="mt-8 font-mono text-[10.5px] text-mute/60 leading-relaxed">
          {/* TODO: fix auth */}
          {/* TODO: schedule the sweep */}
          // TODO: fix auth — this dashboard has no server-side guard
          <br />
          // TODO: schedule the sweep — “sweep jobs keep operating funds hot” but nothing runs it yet
        </p>
      </div>
    </main>
  );
}
