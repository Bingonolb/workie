import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function escapeLike(s: string) {
  return s.replace(/[%_\\]/g, "\\$&");
}

function stripAccents(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// Module-level cache: survives across concurrent requests within a serverless instance.
// Key = query string, value = { data, expires }. Max 500 entries, 30s TTL.
type SearchResult = { id: string; name: string; city: string; sector: string; logo_url: string | null };
const searchCache = new Map<string, { data: SearchResult[]; expires: number }>();
const CACHE_TTL = 30_000;
const MAX_CACHE_ENTRIES = 500;

function evictExpired() {
  const now = Date.now();
  for (const [k, v] of searchCache) {
    if (v.expires < now) searchCache.delete(k);
    if (searchCache.size <= MAX_CACHE_ENTRIES) break;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().slice(0, 100);
  if (q.length < 1) return NextResponse.json({ companies: [] });

  // Check in-memory cache first
  const cacheKey = q.toLowerCase();
  const cached = searchCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json({ companies: cached.data }, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  }

  const supabase = await createClient();

  // Search with both the original query AND its accent-stripped version
  const qStripped = stripAccents(q);
  const safe = escapeLike(q);
  const safeStripped = escapeLike(qStripped);

  const queries = [
    supabase.from("companies").select("id, name, city, sector, logo_url").ilike("name", `${safe}%`).order("name").limit(6),
    supabase.from("companies").select("id, name, city, sector, logo_url").ilike("name", `%${safe}%`).not("name", "ilike", `${safe}%`).order("name").limit(6),
  ];
  if (safeStripped !== safe) {
    queries.push(
      supabase.from("companies").select("id, name, city, sector, logo_url").ilike("name", `${safeStripped}%`).order("name").limit(6),
      supabase.from("companies").select("id, name, city, sector, logo_url").ilike("name", `%${safeStripped}%`).not("name", "ilike", `${safeStripped}%`).order("name").limit(6),
    );
  }

  const results = await Promise.all(queries);
  const seen = new Set<string>();
  const startsWith: typeof results[0]["data"] = [];
  const contains:   typeof results[0]["data"] = [];

  for (const { data } of results) {
    for (const c of data ?? []) {
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      const nameNorm = stripAccents(c.name);
      if (nameNorm.startsWith(qStripped) || c.name.toLowerCase().startsWith(q.toLowerCase())) {
        startsWith.push(c);
      } else {
        contains.push(c);
      }
    }
  }

  const final = [...startsWith.slice(0, 6), ...contains.slice(0, 4)].slice(0, 8) as SearchResult[];

  // Store in module-level cache
  if (searchCache.size >= MAX_CACHE_ENTRIES) evictExpired();
  searchCache.set(cacheKey, { data: final, expires: Date.now() + CACHE_TTL });

  return NextResponse.json({ companies: final }, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
  });
}
