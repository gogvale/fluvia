import type { NextRequest } from "next/server";
import { captureApi } from "@/lib/audit";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const RATES = { "USDC/USD": 1.0, "USDT/USD": 1.0, "XMR/USD": 218.44, source: "chainlink" };

export async function GET(req: NextRequest) {
  captureApi(req, "api_call", { endpoint: "rates" });
  return json(RATES);
}

export async function POST(req: NextRequest) {
  captureApi(req, "api_call", { endpoint: "rates" });
  return json(RATES);
}
