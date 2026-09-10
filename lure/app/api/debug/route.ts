import type { NextRequest } from "next/server";
import { captureApi } from "@/lib/audit";
import { json } from "@/lib/http";

// debug/diagnostics endpoint — TODO: remove before going to production
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  captureApi(req, "api_call", { endpoint: "debug" });
  return json({
    app: "fluvia",
    env: "production",
    debug: true,
    next: "14.2.x",
    node: process.version,
    runtime: "nodejs",
    db: "supabase-postgres",
    queue: "none",
    jwt_secret: "fluvia_super_secret_jwt_2024",
    env_keys: [
      "ALCHEMY_API_KEY",
      "INFURA_PROJECT_ID",
      "DATABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
      "CLERK_SECRET_KEY",
      "JWT_SECRET",
      "WALLET_PRIVATE_KEY",
      "NEXT_PUBLIC_ALCHEMY_KEY",
      "NEXT_PUBLIC_INFURA_ID",
    ],
  });
}
