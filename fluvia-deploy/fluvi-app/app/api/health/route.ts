import type { NextRequest } from "next/server";
import { captureApi } from "@/lib/audit";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  captureApi(req, "api_call", { endpoint: "health" });
  return json({
    status: "ok",
    db: "supabase-postgres",
    auth: "clerk",
    queue: "none",
    version: "14.2.15",
  });
}

export async function POST(req: NextRequest) {
  captureApi(req, "api_call", { endpoint: "health" });
  return json({
    status: "ok",
    db: "supabase-postgres",
    auth: "clerk",
    queue: "none",
    version: "14.2.15",
  });
}
