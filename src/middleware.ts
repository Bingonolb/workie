import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// ── Global rate limiting via Upstash Redis (fixed-window INCR/EXPIRE) ────────
// Falls back to per-instance in-memory when env vars are absent.
// Uses only @upstash/redis (no @upstash/ratelimit) to stay within Edge bundle limits.

let redis: { incr: (k: string) => Promise<number>; expire: (k: string, s: number) => Promise<number> } | null = null;

function getRedis() {
  if (redis) return redis;
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  // Minimal fetch-based Redis client — no external package needed in Edge
  redis = {
    async incr(key: string) {
      const res = await fetch(`${url}/incr/${encodeURIComponent(key)}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json() as { result: number };
      return json.result;
    },
    async expire(key: string, seconds: number) {
      const res = await fetch(`${url}/expire/${encodeURIComponent(key)}/${seconds}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json() as { result: number };
      return json.result;
    },
  };
  return redis;
}

// Fixed-window: one bucket per (ip, bucket, windowSlot)
async function globalLimited(ip: string, bucket: string, limit: number, windowSec: number): Promise<boolean> {
  const r = getRedis();
  if (!r) return false;
  const slot = Math.floor(Date.now() / (windowSec * 1000));
  const key  = `wk_rl:${bucket}:${ip}:${slot}`;
  try {
    const count = await r.incr(key);
    if (count === 1) await r.expire(key, windowSec * 2);
    return count > limit;
  } catch {
    return false; // fail open — don't block on Redis error
  }
}

// ── In-memory fallback (per Vercel instance) ─────────────────────────────────
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

async function rateLimited(ip: string, bucket: string, limit: number): Promise<boolean> {
  if (process.env.UPSTASH_REDIS_REST_URL) {
    return globalLimited(ip, bucket, limit, 60);
  }
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
    if (await rateLimited(ip, "search", 30)) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }
  }

  // All Stripe checkout endpoints: 5 req/min
  if (method === "POST" && (
    pathname === "/api/business/checkout" ||
    pathname === "/api/business/ads/checkout" ||
    pathname === "/api/user/checkout-penalty"
  )) {
    if (await rateLimited(ip, "checkout", 5)) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }
  }

  // Server Actions: 120/min
  if (isServerAction) {
    if (await rateLimited(ip, "actions", 120)) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }
  }

  // Auth pages — brute force protection: 15 req/min
  if (/^\/(login|signup|forgot-password|reset-password)/.test(pathname)) {
    if (await rateLimited(ip, "auth", 15)) {
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
