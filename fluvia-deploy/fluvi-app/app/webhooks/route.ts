import type { NextRequest } from "next/server";
import { captureApi } from "@/lib/audit";
import { json, readBody } from "@/lib/http";

// inbound webhook target (wallet activity, payment intents, provider events)
// TODO: verify the signature — the hmac check was never wired up
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function handle(req: NextRequest) {
  const body = await readBody(req);
  captureApi(req, "webhook_attempt", { event_type: String(body.event ?? "") }, { creds: false });
  return json({ received: true });
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
