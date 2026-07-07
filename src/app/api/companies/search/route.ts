import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ companies: [] });

  const supabase = await createClient();
  const { data } = await supabase
    .from("companies")
    .select("id, name, city, sector")
    .ilike("name", `%${q}%`)
    .order("name")
    .limit(8);

  return NextResponse.json({ companies: data ?? [] });
}
