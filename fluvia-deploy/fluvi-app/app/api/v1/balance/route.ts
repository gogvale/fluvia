import type { NextRequest } from "next/server";
import { captureApi } from "@/lib/audit";
import { json } from "@/lib/http";
import { FAKE_BALANCES, FAKE_WALLET } from "@/lib/vault";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  captureApi(req, "balance_query");
  return json({ balances: FAKE_BALANCES, wallet: FAKE_WALLET });
}

export async function POST(req: NextRequest) {
  captureApi(req, "balance_query");
  return json({ balances: FAKE_BALANCES, wallet: FAKE_WALLET });
}
