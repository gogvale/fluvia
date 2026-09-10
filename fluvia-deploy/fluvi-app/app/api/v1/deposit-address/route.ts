import type { NextRequest } from "next/server";
import { captureApi } from "@/lib/audit";
import { json } from "@/lib/http";
import { FAKE_WALLET } from "@/lib/vault";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  captureApi(req, "api_call", { endpoint: "deposit-address" });
  return json({ asset: "USDC", network: "ethereum", address: FAKE_WALLET });
}

export async function POST(req: NextRequest) {
  captureApi(req, "api_call", { endpoint: "deposit-address" });
  return json({ asset: "USDC", network: "ethereum", address: FAKE_WALLET });
}
