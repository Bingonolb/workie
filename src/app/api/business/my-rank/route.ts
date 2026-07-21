import { NextResponse } from "next/server";
import { getBusinessCompanyId } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const companyId = await getBusinessCompanyId();
  if (!companyId) return NextResponse.json(null);

  const supabase = createAdminClient();

  const { data: company } = await supabase
    .from("companies")
    .select("id, name, score, avg_rating, review_count, cover_url, is_subscribed")
    .eq("id", companyId)
    .maybeSingle();

  if (!company || !company.is_subscribed) return NextResponse.json(null);

  const myScore = Number(company.score ?? 0);

  const [{ count: above }, { count: total }] = await Promise.all([
    supabase.from("companies").select("*", { count: "exact", head: true }).gt("score", myScore),
    supabase.from("companies").select("*", { count: "exact", head: true }),
  ]);

  return NextResponse.json({
    id: company.id,
    name: company.name,
    score: myScore,
    avg_rating: Number(company.avg_rating ?? 0),
    review_count: Number(company.review_count ?? 0),
    cover_url: company.cover_url ?? null,
    rank: (above ?? 0) + 1,
    total: total ?? 0,
  });
}
