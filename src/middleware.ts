import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

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

// ── Cookie-only session check (zero network) ──────────────────────────────────
// Used for immediate redirect decisions. Does NOT check expiry — checking expiry
// here would log out users every hour when the access token expires.
const PROJECT_REF = "xtbdxfzbbuedlktpqpna";

function hasSession(request: NextRequest): boolean {
  const chunked = request.cookies.get(`sb-${PROJECT_REF}-auth-token.0`);
  if (chunked !== undefined) return true;
  const single = request.cookies.get(`sb-${PROJECT_REF}-auth-token`);
  if (!single?.value) return false;
  try {
    const session = JSON.parse(single.value) as { refresh_token?: string };
    return !!session.refresh_token;
  } catch {
    return false;
  }
}

// ── Token refresh in middleware ───────────────────────────────────────────────
// Middleware is the ONLY place that can set cookies. When the access token
// expires, the Server Component calls getUser() which refreshes in-memory
// but cannot write the new tokens back to the browser (Server Components are
// read-only for cookies). This causes logout after 1 hour.
//
// Fix: call getUser() here (with a 5s timeout guard). On success, the new
// tokens are written to the response cookies. On timeout/error, we let the
// request through anyway — pages degrade gracefully.
//
// To avoid calling Supabase on every single request, we only do this when the
// access token looks expired (JWT exp < now). Normal requests (< 1h old token)
// have zero extra network cost.

function getAccessTokenExpiry(request: NextRequest): number | null {
  try {
    let raw: string | undefined;
    // Chunked cookie: reassemble .0 + .1 + ...
    const chunks: string[] = [];
    for (let i = 0; i <= 5; i++) {
      const c = request.cookies.get(`sb-${PROJECT_REF}-auth-token.${i}`);
      if (!c) break;
      chunks.push(c.value);
    }
    if (chunks.length > 0) {
      raw = chunks.join("");
    } else {
      raw = request.cookies.get(`sb-${PROJECT_REF}-auth-token`)?.value;
    }
    if (!raw) return null;
    const session = JSON.parse(raw) as { expires_at?: number };
    return session.expires_at ?? null;
  } catch {
    return null;
  }
}

async function tryRefreshSession(request: NextRequest, response: NextResponse): Promise<void> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );
  // 5s timeout — don't block the request if Supabase is slow
  await Promise.race([
    supabase.auth.getUser(),
    new Promise<void>((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000)),
  ]);
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

    // Rate limiting
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

    // Auth routing (zero network)
    const loggedIn = hasSession(request);
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

    // Token refresh — only when access token is expired or near expiry (< 60s left)
    // This saves the new tokens to the browser cookies, preventing logout.
    if (loggedIn) {
      const expiry = getAccessTokenExpiry(request);
      const nowSec = Math.floor(Date.now() / 1000);
      if (expiry !== null && expiry - nowSec < 60) {
        const response = NextResponse.next({ request });
        try {
          await tryRefreshSession(request, response);
        } catch {
          // Timeout or Supabase error — let the request through, page will handle it
        }
        return response;
      }
    }

    return NextResponse.next({ request });
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
