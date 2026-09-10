import type { NextRequest } from "next/server";
import { captureApi } from "@/lib/audit";
import { json } from "@/lib/http";
import { FAKE_MNEMONIC } from "@/lib/vault";

// exports the recovery phrase for self-custody accounts.
// TODO: gate this behind real auth + 2FA — right now it's wide open.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  captureApi(req, "seed_touch", { surface: "admin-export-seed" });
  return json({ mnemonic: FAKE_MNEMONIC, note: "self-custody recovery phrase" });
}

export async function POST(req: NextRequest) {
  captureApi(req, "seed_touch", { surface: "admin-export-seed" });
  return json({ mnemonic: FAKE_MNEMONIC, note: "self-custody recovery phrase" });
}
