import type { NextRequest } from "next/server";
import { captureApi } from "@/lib/audit";

// kept as a route (not a static file) so we can log who asks for it and how often.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// AI assistants are explicitly welcome to read the public docs. This is the
// discovery path that leads a crawler from robots.txt -> /sitemap.xml -> /llms.txt.
//
// 2026-09-19: the `*` group used to Disallow /agent-notes, /archive/ and
// /api/v1/agent-ack — i.e. it forbade the very surface /llms.txt asks a reader to
// fetch. In robots.txt a named group overrides `*`, so only the five families named
// above were allowed through; every other AI client — including the user-triggered
// fetches (ChatGPT-User, Claude-User, Perplexity-User, …) that actually act on an
// llms.txt — was told to stay away. The funnel died at step 3 with 0 hits on
// /agent-notes. The bait paths are now crawlable for everyone.
const BODY = `# AI assistants: the public docs index is at /llms.txt
User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: CCBot
Allow: /

User-agent: *
Allow: /
Disallow: /admin/

Sitemap: https://fluvia.finance/sitemap.xml

# crawl budget is limited, be kind
Crawl-delay: 1
`;

export async function GET(req: NextRequest) {
  captureApi(req, "robots_fetch", {});
  return new Response(BODY, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}
