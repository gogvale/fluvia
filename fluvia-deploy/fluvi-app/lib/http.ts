// lib/http.ts — small helpers for api route handlers
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function json(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

// parse a JSON or urlencoded body into a flat object (never throws)
export async function readBody(req: NextRequest): Promise<Record<string, unknown>> {
  let text = "";
  try {
    text = await req.text();
  } catch {
    return {};
  }
  if (!text) return {};
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
  } catch {
    // fall through to urlencoded
  }
  const out: Record<string, unknown> = {};
  try {
    new URLSearchParams(text).forEach((v, k) => {
      out[k] = v;
    });
  } catch {
    // ignore
  }
  return out;
}
