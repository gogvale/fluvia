import { AdminApp, type BalanceMap } from "@/components/Admin";
import { FAKE_BALANCES, FAKE_WALLET } from "@/lib/vault";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  const balances: BalanceMap = FAKE_BALANCES;
  return (
    <main className="flex-1 min-h-screen">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-32 left-1/3 w-[600px] h-[420px] rounded-full blur-3xl opacity-10"
          style={{ background: "radial-gradient(closest-side, #22D3EE, transparent)" }} />
      </div>
      <AdminApp balances={balances} wallet={FAKE_WALLET} />
    </main>
  );
}
