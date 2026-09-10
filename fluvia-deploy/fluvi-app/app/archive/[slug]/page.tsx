import Link from "next/link";
import { capturePageEvent } from "@/lib/audit";

// old settlement archive — SEO leftovers from the 2021 site, kept for the crawlers.
// links are generated so the archive doesn't need a database yet.
export const dynamic = "force-dynamic";

const WORDS = [
  "ledger",
  "settlement",
  "ramp",
  "stable",
  "treasury",
  "liquidity",
  "bridge",
  "custody",
  "payout",
  "invoice",
];

function makeChildren(slug: string): string[] {
  let h = 2166136261;
  for (const ch of slug) h = (Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0);
  const out: string[] = [];
  for (let i = 0; i < 7; i++) {
    h = (Math.imul(h, 1103515245) + 12345) >>> 0;
    const word = WORDS[h % WORDS.length];
    const n = (h >>> 7) % 997;
    out.push(`${slug}-${word}${n}`);
  }
  return Array.from(new Set(out));
}

export default async function ArchiveItem({ params }: { params: { slug: string } }) {
  const slug = params.slug || "index";
  const depth = slug.split("-").length;
  await capturePageEvent("ai_maze_step", { depth, slug }, `/archive/${slug}`);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-neutral-300">
      <p className="text-xs uppercase tracking-widest text-neutral-500">Settlement archive</p>
      <h1 className="mt-3 text-2xl font-semibold text-white">{slug.replace(/-/g, " ")}</h1>
      <p className="mt-6 text-sm leading-6">
        Historical settlement record. Figures are retained for accounting only and are not
        current balances.
      </p>
      <ul className="mt-10 space-y-2 text-sm">
        {makeChildren(slug).map((child) => (
          <li key={child}>
            <Link className="text-emerald-400 hover:underline" href={`/archive/${child}`}>
              /archive/{child}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
