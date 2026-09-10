// lib/audit.ts — tiny request auditor (kept for the ops dashboard).
// Writes a JSONL trail of interesting requests to {EVIDENCE_DIR}/capture.jsonl.
// TODO: swap the file drain for a proper log service before launch.
import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { headers as nextHeaders } from "next/headers";
import type { NextRequest } from "next/server";
import { PUBLIC_PAGES } from "./vault";
import { FAKE_API_KEY, ADMIN_USERS } from "./vault";

export const EVIDENCE_DIR = process.env.EVIDENCE_DIR || "/evidence";
export const CAPTURE_LOG = join(EVIDENCE_DIR, "capture.jsonl");

let dirReady = false;
function ensureDir() {
  if (dirReady) return;
  try {
    mkdirSync(EVIDENCE_DIR, { recursive: true });
    dirReady = true;
  } catch {
    // read-only filesystem — skip writing silently
  }
}

export interface EventMeta {
  ip: string;
  ua: string;
  method: string;
  path: string;
}

export type Extra = Record<string, unknown>;

export function emit(event: string, extra: Extra = {}, meta?: Partial<EventMeta>): void {
  const rec: Record<string, unknown> = {
    ts: new Date().toISOString(),
    ip: meta?.ip ?? "127.0.0.1",
    ua: meta?.ua ?? "",
    method: meta?.method ?? "GET",
    path: meta?.path ?? "/",
    event,
    ...extra,
  };
  try {
    ensureDir();
    appendFileSync(CAPTURE_LOG, JSON.stringify(rec) + "\n");
  } catch (err) {
    console.error("[audit] write failed", err);
  }
}

function firstHeader(v: string | null): string {
  if (!v) return "";
  return v.split(",")[0].trim();
}

// meta straight from a route-handler request
export function metaFromRequest(req: NextRequest): EventMeta {
  const h = req.headers;
  let path = "/";
  try {
    path = req.nextUrl.pathname;
  } catch {
    path = new URL(req.url).pathname;
  }
  return {
    ip: firstHeader(h.get("x-forwarded-for")) || h.get("x-real-ip") || "127.0.0.1",
    ua: h.get("user-agent") ?? "",
    method: req.method,
    path,
  };
}

// meta for server-component pages (rendered per-request)
export async function pageMeta(path: string): Promise<EventMeta> {
  try {
    const h = await nextHeaders();
    return {
      ip: firstHeader(h.get("x-forwarded-for")) || h.get("x-real-ip") || "127.0.0.1",
      ua: h.get("user-agent") ?? "",
      method: "GET",
      path,
    };
  } catch {
    return { ip: "127.0.0.1", ua: "", method: "GET", path };
  }
}

// public-page read (order-of-navigation signal)
export async function capturePageRead(path: string): Promise<void> {
  if (!PUBLIC_PAGES.includes(path)) return;
  emit("lure_content_read", {}, await pageMeta(path));
}

// generic event from a server component (admin_action, etc.)
export async function capturePageEvent(event: string, extra: Extra = {}, path = "/"): Promise<void> {
  emit(event, extra, await pageMeta(path));
}

// api surface helpers -------------------------------------------------------

function decodeBasic(authHeader: string): { user: string; pass: string } | null {
  const m = /^Basic\s+(.+)$/i.exec(authHeader);
  if (!m) return null;
  try {
    const decoded = Buffer.from(m[1], "base64").toString("utf8");
    const idx = decoded.indexOf(":");
    if (idx < 0) return { user: decoded, pass: "" };
    return { user: decoded.slice(0, idx), pass: decoded.slice(idx + 1) };
  } catch {
    return null;
  }
}

// If an API request carries credentials, record them verbatim (token typos preserved).
export function maybeApiCreds(req: NextRequest, meta: EventMeta): void {
  const auth = req.headers.get("authorization") || "";
  const xkey = req.headers.get("x-api-key") || "";
  if (!auth && !xkey) return;

  let user = "";
  let password = "";
  if (auth.startsWith("Basic ")) {
    const b = decodeBasic(auth);
    if (b) {
      user = b.user;
      password = b.pass;
    }
  } else {
    // Bearer / raw token — record the whole thing raw
    const m = /^Bearer\s+(.+)$/i.exec(auth);
    password = m ? m[1] : auth;
  }
  if (!password && xkey) password = xkey;

  const ok =
    password === FAKE_API_KEY || (!!user && ADMIN_USERS[user.toLowerCase()] === password);
  emit(
    "auth_attempt",
    {
      user,
      password, // RAW, never normalized — typo preserved
      result: ok ? "ok" : "fail",
      surface: "api",
      auth_header: auth || xkey,
    },
    meta
  );
}

// shorthand used by every api route handler
export function captureApi(
  req: NextRequest,
  event: string,
  extra: Extra = {},
  opts: { creds?: boolean } = {}
): void {
  const meta = metaFromRequest(req);
  emit(event, extra, meta);
  if (opts.creds !== false) maybeApiCreds(req, meta);
}
