import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Expand each letter to a regex group covering French accent variants
function toAccentRegex(q: string): string {
  const map: Record<string, string> = {
    e: "[eéèêëEÉÈÊË]",
    a: "[aàâäAÀÂÄ]",
    u: "[uùûüUÙÛÜ]",
    i: "[iîïIÎÏ]",
    o: "[oôöOÔÖ]",
    c: "[cçCÇ]",
  };
  return q.toLowerCase().split("").map(ch => {
    const group = map[ch];
    if (group) return group;
    return ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }).join("");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().slice(0, 100);
  if (q.length < 1) return NextResponse.json({ companies: [] });

  const supabase = await createClient();
  const pattern = toAccentRegex(q);

  // One query with accent-insensitive regex, then split starts-with vs contains in JS
  const { data } = await supabase
    .from("companies")
    .select("id, name, city, sector, logo_url")
    .filter("name", "~*", pattern)
    .order("name")
    .limit(10);

  const startRe = new RegExp(`^${pattern}`, "i");
  const startsWith = (data ?? []).filter(c => startRe.test(c.name));
  const contains  = (data ?? []).filter(c => !startRe.test(c.name));
  const results = [...startsWith.slice(0, 6), ...contains.slice(0, 4)].slice(0, 8);

  return NextResponse.json({ companies: results }, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
  });
}
