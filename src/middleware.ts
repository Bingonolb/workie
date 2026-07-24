import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

// ── In-memory rate limiting (per Vercel instance) ─────────────────────────────
const rlMap = new Map<string, [number, number]>();
const RL_WINDOW_MS = 60_000;

function rateLimited(ip: string, bucket: string, limit: number): boolean {
  const key = `${ip}:${bucket}`;
  const now = Date.now();
  const entry = rlMap.get(key);
  if (!entry || now - entry[1] > RL_WINDOW_MS) {
    rlMap.set(key, [1, now]);
    return false;
  }
  if (entry[0] >= limit) return true;
  entry[0]++;
  return false;
}

let lastPrune = Date.now();
function maybePrune() {
  const now = Date.now();
  if (now - lastPrune < 300_000) return;
  lastPrune = now;
  for (const [k, [, start]] of rlMap) {
    if (now - start > RL_WINDOW_MS * 2) rlMap.delete(k);
  }
}

const PUBLIC_PATHS = [
  "/login", "/signup", "/auth",
  "/forgot-password", "/reset-password",
  "/explore", "/company", "/ranking", "/salaires", "/jobs",
  "/business", "/api",
  "/cgu", "/confidentialite",
  "/robots.txt", "/sitemap.xml", "/_next", "/favicon",
  "/onboarding",
];

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    const method = request.method;
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const isServerAction = method === "POST" && !!request.headers.get("next-action");

    maybePrune();

    // Rate limiting — early return before touching Supabase
    if (pathname === "/api/companies/search") {
      if (rateLimited(ip, "search", 30))
        return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }
    if (method === "POST" && (
      pathname === "/api/business/checkout" ||
      pathname === "/api/business/ads/checkout" ||
      pathname === "/api/user/checkout-penalty"
    )) {
      if (rateLimited(ip, "checkout", 5))
        return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }
    if (isServerAction) {
      if (rateLimited(ip, "actions", 120))
        return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }
    if (/^\/(login|signup|forgot-password|reset-password)/.test(pathname)) {
      if (rateLimited(ip, "auth", 15))
        return NextResponse.redirect(new URL("/login?error=trop_de_requetes", request.url));
    }

    // Session refresh via Supabase SSR — this is the only correct way to renew
    // the access token on mobile without the user having to log in again.
    // getUser() checks JWT expiry locally; only hits the network when the token
    // is actually expired (at most once per hour per session).
    let response = NextResponse.next({ request });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll(cookiesToSet) {
            // Forward refreshed tokens to both the request (for Server Components)
            // and the response (so the browser receives the updated cookie).
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
    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p)) || pathname === "/";

    if (!loggedIn && !isPublic) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname + request.nextUrl.search);
      return NextResponse.redirect(url);
    }

    if (loggedIn && (pathname === "/login" || pathname === "/signup")) {
      const url = request.nextUrl.clone();
      url.pathname = "/explore";
      return NextResponse.redirect(url);
    }

    // Return response (not NextResponse.next()) so refreshed cookies reach the browser
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
