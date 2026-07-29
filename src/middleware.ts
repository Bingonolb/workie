import { createServerClient } from "@supabase/ssr";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { type NextRequest, NextResponse } from "next/server";

// Lazy init — if UPSTASH env vars are missing (e.g. Vercel plan migration), rate limiting is
// disabled rather than crashing the Edge Function for every request.
type RateLimiters = {
  search: Ratelimit; checkout: Ratelimit; actions: Ratelimit; auth: Ratelimit; export: Ratelimit;
};
let rl: RateLimiters | null = null;
try {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
  rl = {
    search:   new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, "60s"),  prefix: "rl:search",   ephemeralCache: new Map() }),
    checkout: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "60s"),   prefix: "rl:checkout", ephemeralCache: new Map() }),
    actions:  new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(120, "60s"), prefix: "rl:actions",  ephemeralCache: new Map() }),
    auth:     new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(15, "60s"),  prefix: "rl:auth",     ephemeralCache: new Map() }),
    export:   new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(2, "60s"),   prefix: "rl:export",   ephemeralCache: new Map() }),
  };
} catch {
  // Redis env vars not configured — rate limiting disabled until vars are added to Vercel
}

const PUBLIC_PATHS = [
  "/login", "/signup", "/auth",
  "/forgot-password", "/reset-password",
  "/explore", "/company", "/ranking", "/salaires", "/jobs",
  "/api",
  "/cgu", "/confidentialite", "/mentions-legales",
  "/robots.txt", "/sitemap.xml", "/_next", "/favicon",
  "/onboarding",
];

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    const method = request.method;
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
    const isServerAction = method === "POST" && !!request.headers.get("next-action");

    // Rate limiting — early return before touching Supabase (no-op if Redis not configured)
    if (rl) {
      if (pathname === "/api/companies/search") {
        const { success } = await rl.search.limit(ip);
        if (!success) return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
      }
      if (method === "POST" && pathname === "/api/user/checkout-penalty") {
        const { success } = await rl.checkout.limit(ip);
        if (!success) return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
      }
      if (isServerAction) {
        const { success } = await rl.actions.limit(ip);
        if (!success) return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
      }
      if (pathname === "/api/user/export") {
        const { success } = await rl.export.limit(ip);
        if (!success) return NextResponse.json({ error: "Trop de requêtes. Attendez 1 minute." }, { status: 429 });
      }
      if (/^\/(login|signup|forgot-password|reset-password)/.test(pathname)) {
        const { success } = await rl.auth.limit(ip);
        if (!success) return NextResponse.json({ error: "Trop de requêtes. Attendez 1 minute." }, { status: 429 });
      }
    }

    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p)) || pathname === "/";
    // Routes that redirect logged-in users elsewhere
    const isAuthRoute = pathname === "/" || pathname === "/login" || pathname === "/signup";

    // Fast path: public routes that don't need logged-in redirect → skip Supabase entirely
    // This eliminates ~100ms of auth latency for 80%+ of traffic (browse, explore, company pages)
    if (isPublic && !isAuthRoute) {
      return NextResponse.next({ request });
    }

    // Session refresh via Supabase SSR — only for protected routes + auth routes
    let response = NextResponse.next({ request });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    const loggedIn = !!user;

    if (!loggedIn && !isPublic) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname + request.nextUrl.search);
      return NextResponse.redirect(url);
    }

    if (loggedIn && isAuthRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/explore";
      return NextResponse.redirect(url);
    }

    return response;
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
