import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// In-memory rate limiter (Edge runtime — warm within a Vercel region)
// Key: "ip:bucket", Value: [count, window_start_ms]
const rl = new Map<string, [number, number]>();
const RL_WINDOW = 60_000; // 1 minute

function rateLimited(ip: string, bucket: string, limit: number): boolean {
  const key = `${ip}:${bucket}`;
  const now = Date.now();
  const entry = rl.get(key);
  if (!entry || now - entry[1] > RL_WINDOW) {
    rl.set(key, [1, now]);
    return false;
  }
  if (entry[0] >= limit) return true;
  entry[0]++;
  return false;
}

// Periodically prune stale entries to avoid unbounded memory growth
let lastPrune = Date.now();
function maybePrune() {
  const now = Date.now();
  if (now - lastPrune < 300_000) return; // prune every 5 min
  lastPrune = now;
  for (const [key, [, start]] of rl) {
    if (now - start > RL_WINDOW * 2) rl.delete(key);
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const isServerAction = request.method === "POST" && !!request.headers.get("next-action");

  maybePrune();

  // ── API routes ──────────────────────────────────────────────────────────────

  // Search: 30 req/min
  if (pathname === "/api/companies/search") {
    if (rateLimited(ip, "search", 30)) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }
  }

  // Stripe checkout: 5 req/min (prevent checkout session spam)
  if (pathname === "/api/business/checkout" && method === "POST") {
    if (rateLimited(ip, "checkout", 5)) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }
  }

  // ── Server Actions (POST with Next-Action header) ───────────────────────────
  // General SA guard: 120/min — bots hit this well before legit users
  if (isServerAction) {
    if (rateLimited(ip, "actions", 120)) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }
  }

  // ── Auth pages — brute force protection ────────────────────────────────────
  // /login, /signup, /forgot-password, /reset-password: 15 req/min
  if (/^\/(login|signup|forgot-password|reset-password)/.test(pathname)) {
    if (rateLimited(ip, "auth", 15)) {
      return NextResponse.redirect(new URL("/login?error=trop_de_requetes", request.url));
    }
  }

  const response = await updateSession(request);
  // Expose pathname to server layouts (used to bypass subscription gate on /ads)
  response.headers.set("x-pathname", pathname);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
