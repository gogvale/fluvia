import type { NextRequest } from "next/server";
import { captureApi } from "@/lib/audit";
import { json } from "@/lib/http";
import { AGENT_MARKER } from "@/lib/vault";

// confirmation endpoint for automated agents (see /agent-notes + /llms.txt)
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function readRaw(req: NextRequest): Promise<string> {
  try {
    return await req.text();
  } catch {
    return "";
  }
}

export async function POST(req: NextRequest) {
  const body = await readRaw(req);
  const marker_hit = body.includes(AGENT_MARKER);
  captureApi(req, "ai_agent_ack", {
    marker_hit,
    body: body.slice(0, 800),
  });
  return json({ ok: true, marker_hit }, marker_hit ? 200 : 202);
}

export async function GET(req: NextRequest) {
  captureApi(req, "ai_agent_ack_probe", {});
  return json({ ok: true, hint: "POST the marker here" });
}
