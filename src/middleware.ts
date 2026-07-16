import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// ── Rate limiting ────────────────────────────────────────────────────────────
//
// Two-tier strategy:
//  1. Global (Upstash Redis) — single counter shared across all Vercel instances.
//     Activate by adding UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN to
//     Vercel env vars (free Upstash tier handles this easily).
//  2. Per-instance fallback (in-memory Map) — used when Upstash is not configured.
//     Effective limit in production = limit × number of warm instances.

// Cache of Ratelimit instances keyed by "limit:windowSec"
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rlCache = new Map<string, any>();
let redisInstance: unknown = null;
let upstashReady: boolean | null = null; // null = not yet attempted

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getUpstashLimiter(limit: number, windowSec: number): Promise<any | null> {
  if (upstashReady === false) return null;
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) { upstashReady = false; return null; }

  const cacheKey = `${limit}:${windowSec}`;
  if (rlCache.has(cacheKey)) return rlCache.get(cacheKey);

  try {
    const { Redis }     = await import("@upstash/redis");
    const { Ratelimit } = await import("@upstash/ratelimit");
    if (!redisInstance) redisInstance = new Redis({ url, token });
    const limiter = new Ratelimit({
      redis: redisInstance as InstanceType<typeof Redis>,
      limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
      prefix: "wk_rl",
    });
    rlCache.set(cacheKey, limiter);
    upstashReady = true;
    return limiter;
  } catch {
    upstashReady = false;
    return null;
  }
}

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

// Main rate-limit check: tries Upstash first, falls back to in-memory
async function rateLimited(ip: string, bucket: string, limit: number): Promise<boolean> {
  const limiter = await getUpstashLimiter(limit, 60);
  if (limiter) {
    const { success } = await limiter.limit(`${ip}:${bucket}`);
    return !success;
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
