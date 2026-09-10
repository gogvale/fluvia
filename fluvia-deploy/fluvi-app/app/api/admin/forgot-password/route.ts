import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { emit, metaFromRequest } from "@/lib/audit";
import { json, readBody } from "@/lib/http";

// password reset — logs every probe so we can see which emails attackers fish for
// (founder@fluvia.finance in a probe = they read the About page)
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await readBody(req);
  const email = String(body.email ?? "");

  const meta = metaFromRequest(req);
  emit("auth_attempt", { user: email, password: "", result: "reset", surface: "forgot-password" }, meta);

  // generic response — never enumerate accounts
  return json({ ok: true, message: "If that email has an account, a reset link is on its way." });
}
