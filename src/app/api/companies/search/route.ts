import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function escapeLike(s: string) {
  return s.replace(/[%_\\]/g, "\\$&");
}

// Normalize accents for comparison: é→e, à→a, etc.
function stripAccents(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().slice(0, 100);
  if (q.length < 1) return NextResponse.json({ companies: [] });

  const supabase = await createClient();

  // Search with both the original query AND its accent-stripped version
  const qStripped = stripAccents(q);
  const safe = escapeLike(q);
  const safeStripped = escapeLike(qStripped);

  // Fetch up to 20 candidates using both variants, then rank in JS
  const queries = [
    supabase.from("companies").select("id, name, city, sector, logo_url").ilike("name", `${safe}%`).order("name").limit(6),
    supabase.from("companies").select("id, name, city, sector, logo_url").ilike("name", `%${safe}%`).not("name", "ilike", `${safe}%`).order("name").limit(6),
  ];
  // Only add stripped query if it differs (avoids duplicate requests)
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

  const final = [...startsWith.slice(0, 6), ...contains.slice(0, 4)].slice(0, 8);
  return NextResponse.json({ companies: final }, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
  });
}
