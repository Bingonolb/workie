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

// ── Zero-network session detection ────────────────────────────────────────────
// @supabase/ssr v0.12+ stores cookies as "base64-<base64url_encoded_json>".
// Older reads expect raw JSON — we handle both formats.
const PROJECT_REF = "xtbdxfzbbuedlktpqpna";
const BASE64_COOKIE_PREFIX = "base64-";

function decodeSupabaseCookie(value: string): string {
  if (!value.startsWith(BASE64_COOKIE_PREFIX)) return value;
  const b64 = value.slice(BASE64_COOKIE_PREFIX.length)
    .replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  // atob is available in Edge runtime (Web API)
  return atob(padded);
}

function hasSession(request: NextRequest): boolean {
  // Chunked cookies (.0, .1, …): presence of .0 means a session exists
  const chunked = request.cookies.get(`sb-${PROJECT_REF}-auth-token.0`);
  if (chunked !== undefined) return true;

  const single = request.cookies.get(`sb-${PROJECT_REF}-auth-token`);
  if (!single?.value) return false;
  try {
    const raw = decodeSupabaseCookie(single.value);
    const session = JSON.parse(raw) as { refresh_token?: string };
    return !!session.refresh_token;
  } catch {
    return false;
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

    return NextResponse.next();
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
