import { metaFromRequest } from "@/lib/audit";

export const dynamic = "force-dynamic";

export default function ForgotPassword() {
  // keep the same visual shell as the admin login
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#060809] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-2xl font-bold text-[#F5F7FA]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Fluvia <span className="text-[#2DD4BF]">admin</span>
          </div>
          <p className="text-sm text-[#5B6472] mt-2">Reset your password</p>
        </div>
        <form method="POST" action="/api/admin/forgot-password"
              className="glass rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-xs text-[#98A2B3] mb-1">Work email</label>
            <input name="email" type="email" required placeholder="you@fluvia.finance"
                   className="w-full bg-[#0B0E13] border border-[#1E242E] rounded-lg px-3 py-2 text-sm text-[#F5F7FA] placeholder-[#5B6472] focus:outline-none focus:border-[#2DD4BF]" />
          </div>
          <button type="submit"
                  className="w-full bg-[#2DD4BF] text-[#060809] font-semibold text-sm rounded-lg py-2 hover:opacity-90 transition">
            Send reset link
          </button>
          <p className="text-[10px] text-[#5B6472] text-center">
            If that email has an account, a reset link is on its way.
          </p>
        </form>
        <p className="text-center mt-6 text-xs">
          <a href="/admin" className="text-[#2DD4BF]">← back to login</a>
        </p>
      </div>
    </main>
  );
}
