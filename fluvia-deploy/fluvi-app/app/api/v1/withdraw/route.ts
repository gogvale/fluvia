import type { NextRequest } from "next/server";
import { captureApi } from "@/lib/audit";
import { json, readBody } from "@/lib/http";
import { isSweepAmount } from "@/lib/vault";

// Withdraw endpoint — queues into the review/sweep pipeline. Never fires instantly.
// TODO: schedule the sweep — nothing actually moves funds yet, returns "pending".
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function handle(req: NextRequest) {
  const body = await readBody(req);
  const amount = String(body.amount ?? "");
  const dest = String(body.dest_address ?? body.to ?? body.address ?? "");
  const currency = String(body.currency ?? body.asset ?? "");
  const sweep = isSweepAmount(amount);

  captureApi(
    req,
    "withdraw_attempt",
    {
      amount,
      dest_address: dest,
      sweep,
      ...(currency ? { currency } : {}),
    },
    { creds: false }
  );

  // never executes — returns a fake "pending" state
  return json({
    status: "pending",
    amount,
    dest,
    note: "queued for sweep job",
  });
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
