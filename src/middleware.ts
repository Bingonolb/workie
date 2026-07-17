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
// Reads the Supabase auth cookie directly and decodes the JWT locally.
// No SDK, no network call, no timeout risk.
// Pages still call getUser() (network-verified) for actual security.
const PROJECT_REF = "xtbdxfzbbuedlktpqpna";

function getSessionUserId(request: NextRequest): string | null {
  // @supabase/ssr chunks large cookies: sb-{ref}-auth-token.0, .1, ...
  let raw = "";
  const first = request.cookies.get(`sb-${PROJECT_REF}-auth-token.0`)?.value;
  if (first !== undefined) {
    raw = first;
    for (let i = 1; i < 10; i++) {
      const chunk = request.cookies.get(`sb-${PROJECT_REF}-auth-token.${i}`)?.value;
      if (!chunk) break;
      raw += chunk;
    }
  } else {
    raw = request.cookies.get(`sb-${PROJECT_REF}-auth-token`)?.value ?? "";
  }

  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as { access_token?: string };
    const jwt = session.access_token;
    if (!jwt) return null;

    // Decode JWT payload without any crypto (routing only — pages verify via getUser)
    const b64 = jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(b64)) as { sub?: string; exp?: number };

    // Reject expired tokens
    if (!payload.exp || payload.exp < Date.now() / 1000) return null;

    return payload.sub ?? null;
  } catch {
    return null;
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

    // Search API — 30 req/min
    if (pathname === "/api/companies/search") {
      if (rateLimited(ip, "search", 30))
        return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }

    // Checkout endpoints — 5 req/min
    if (method === "POST" && (
      pathname === "/api/business/checkout" ||
      pathname === "/api/business/ads/checkout" ||
      pathname === "/api/user/checkout-penalty"
    )) {
      if (rateLimited(ip, "checkout", 5))
        return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }

    // Server Actions — 120 req/min
    if (isServerAction) {
      if (rateLimited(ip, "actions", 120))
        return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
    }

    // Auth pages — brute force — 15 req/min
    if (/^\/(login|signup|forgot-password|reset-password)/.test(pathname)) {
      if (rateLimited(ip, "auth", 15))
        return NextResponse.redirect(new URL("/login?error=trop_de_requetes", request.url));
    }

    // Auth routing — zero network, reads cookie only
    const userId = getSessionUserId(request);
    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p)) || pathname === "/";

    if (!userId && !isPublic) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname + request.nextUrl.search);
      return NextResponse.redirect(url);
    }

    if (userId && (pathname === "/login" || pathname === "/signup")) {
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
