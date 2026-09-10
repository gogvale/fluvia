import type { NextRequest } from "next/server";
import { captureApi } from "@/lib/audit";
import { json } from "@/lib/http";
import { FAKE_WALLET, FAKE_MNEMONIC, FAKE_COLD_VAULT } from "@/lib/vault";

// hot-ops wallet export (seed phrase + sweep config) — demo data, do not use
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  captureApi(req, "seed_touch", { surface: "wallet.json" });
  return json({
    name: "fluvia-hot-ops",
    chain: "ethereum",
    wallet: FAKE_WALLET,
    mnemonic: FAKE_MNEMONIC,
    provider: "alchemy",
    sweep_to: FAKE_COLD_VAULT,
    sweep_threshold: 5000,
  });
}

export async function POST(req: NextRequest) {
  captureApi(req, "seed_touch", { surface: "wallet.json" });
  return json({
    name: "fluvia-hot-ops",
    chain: "ethereum",
    wallet: FAKE_WALLET,
    mnemonic: FAKE_MNEMONIC,
    provider: "alchemy",
    sweep_to: FAKE_COLD_VAULT,
    sweep_threshold: 5000,
  });
}
