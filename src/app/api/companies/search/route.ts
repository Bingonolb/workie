import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 1) return NextResponse.json({ companies: [] });

  const supabase = await createClient();

  // Fetch starts-with results first (most relevant), then contains-only results
  const [{ data: startsWith }, { data: contains }] = await Promise.all([
    supabase.from("companies").select("id, name, city, sector").ilike("name", `${q}%`).order("name").limit(6),
    supabase.from("companies").select("id, name, city, sector").ilike("name", `%${q}%`).not("name", "ilike", `${q}%`).order("name").limit(4),
  ]);

  const seen = new Set<string>();
  const results = [...(startsWith ?? []), ...(contains ?? [])].filter(c => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  }).slice(0, 8);

  return NextResponse.json({ companies: results });
}
