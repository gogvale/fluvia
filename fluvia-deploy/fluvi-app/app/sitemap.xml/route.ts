import type { NextRequest } from "next/server";
import { captureApi } from "@/lib/audit";

// /sitemap.xml — kept as a route (not a static file) so crawler interest is logged.
// Served after the old static file went missing and crawlers kept 404ing on it.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PAGES: Array<[string, string]> = [
  ["/", "1.0"],
  ["/how-it-works", "0.8"],
  ["/pricing", "0.8"],
  ["/about", "0.6"],
  ["/api/docs", "0.6"],
  ["/llms.txt", "0.5"],
];

function body(): string {
  const today = new Date().toISOString().slice(0, 10);
  const urls = PAGES.map(
    ([path, priority]) =>
      `  <url>\n    <loc>https://fluvia.finance${path}</loc>\n` +
      `    <lastmod>${today}</lastmod>\n    <priority>${priority}</priority>\n  </url>`,
  ).join("\n");
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${urls}\n</urlset>\n`
  );
}

export async function GET(req: NextRequest) {
  captureApi(req, "sitemap_fetch", {});
  return new Response(body(), {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
