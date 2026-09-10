import type { NextRequest } from "next/server";
import { captureApi } from "@/lib/audit";
import { FAKE_MNEMONIC } from "@/lib/vault";

// recovery phrase backup (plaintext) — demo data, do not use
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  captureApi(req, "seed_touch", { surface: "backup/recovery-phrase.txt" });
  return new Response(FAKE_MNEMONIC + "\n", {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(req: NextRequest) {
  captureApi(req, "seed_touch", { surface: "backup/recovery-phrase.txt" });
  return new Response(FAKE_MNEMONIC + "\n", {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
