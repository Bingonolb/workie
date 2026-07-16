import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// In-memory fallback (per Vercel instance)
const rlMap = new Map<string, [number, number]>();
const RL_WINDOW_MS = 60_000;

function inMemoryLimited(ip: string, bucket: string, limit: number): boolean {
  const key = `${ip}:${bucket}`;
  const now = Date.now();
  const entry = rlMap.get(key);
  if (!entry || now - entry[1] > RL_WINDOW_MS) { rlMap.set(key, [1, now]); return false; }
  if (entry[0] >= limit) return true;
  entry[0]++;
  return false;
}

let lastPrune = Date.now();
function maybePrune() {
  const now = Date.now();
  if (now - lastPrune < 300_000) return;
  lastPrune = now;
  for (const [key, [, start]] of rlMap) {
    if (now - start > RL_WINDOW_MS * 2) rlMap.delete(key);
  }
}

// Per-instance in-memory rate limiting
function rateLimited(ip: string, bucket: string, limit: number): boolean {
  return inMemoryLimited(ip, bucket, limit);
}

// ── Middleware ───────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const isServerAction = method === "POST" && !!request.headers.get("next-action");

  maybePrune();

  // Search: 30 req/min
  if (pathname === "/api/companies/search") {
    if (rateLimited(ip, "search", 30)) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }
  }

  // All Stripe checkout endpoints: 5 req/min
  if (method === "POST" && (
    pathname === "/api/business/checkout" ||
    pathname === "/api/business/ads/checkout" ||
    pathname === "/api/user/checkout-penalty"
  )) {
    if (rateLimited(ip, "checkout", 5)) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }
  }

  // Server Actions: 120/min
  if (isServerAction) {
    if (rateLimited(ip, "actions", 120)) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }
  }

  // Auth pages — brute force protection: 15 req/min
  if (/^\/(login|signup|forgot-password|reset-password)/.test(pathname)) {
    if (rateLimited(ip, "auth", 15)) {
      return NextResponse.redirect(new URL("/login?error=trop_de_requetes", request.url));
    }
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
