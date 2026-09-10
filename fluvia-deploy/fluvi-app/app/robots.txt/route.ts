import type { NextRequest } from "next/server";
import { captureApi } from "@/lib/audit";

// kept as a route (not a static file) so we can log who asks for it and how often.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BODY = `User-agent: *
Allow: /
Disallow: /agent-notes
Disallow: /archive/
Disallow: /api/v1/agent-ack
Disallow: /admin/

# crawl budget is limited, be kind
Crawl-delay: 1
`;

export async function GET(req: NextRequest) {
  captureApi(req, "robots_fetch", {});
  return new Response(BODY, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}
