import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { emit, metaFromRequest } from "@/lib/audit";
import { ADMIN_USERS } from "@/lib/vault";
import { json, readBody } from "@/lib/http";

// admin login — credentials are checked here
// (this file is the whole "auth layer". yes, we know. TODO: fix auth)
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL("/admin", req.url), 302);
}

export async function POST(req: NextRequest) {
  const body = await readBody(req);
  const user = String(body.email ?? body.username ?? "");
  const password = String(body.password ?? "");

  // capture the RAW credentials BEFORE validating — typos preserved on purpose
  const meta = metaFromRequest(req);
  const ok = ADMIN_USERS[user.toLowerCase()] === password;

  emit(
    "auth_attempt",
    {
      user,
      password, // raw, never normalized
      result: ok ? "ok" : "fail",
      surface: "admin",
    },
    meta
  );

  if (ok) {
    return json({ ok: true, redirect: "/admin/dashboard" });
  }
  return json({ ok: false, error: "Invalid credentials." }, 401);
}
