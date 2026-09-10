import type { NextRequest } from "next/server";
import { captureApi } from "@/lib/audit";
import { json } from "@/lib/http";
import { FAKE_API_KEY } from "@/lib/vault";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  captureApi(req, "api_call", { endpoint: "keys" });
  return json({ keys: [{ key: FAKE_API_KEY, scope: "full", prefix: "fl_live_" }] });
}

export async function POST(req: NextRequest) {
  captureApi(req, "api_call", { endpoint: "keys" });
  return json({ keys: [{ key: FAKE_API_KEY, scope: "full", prefix: "fl_live_" }] });
}
