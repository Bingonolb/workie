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
    // Count companies strictly above our score (only meaningful if score > 0)
    supabase.from("companies").select("*", { count: "exact", head: true }).gt("score", myScore),
    supabase.from("companies").select("*", { count: "exact", head: true }),
  ]);

  // If score = 0, rank is not meaningful (many companies tied at 0)
  const rank = myScore > 0 ? (above ?? 0) + 1 : null;

  return NextResponse.json({
    id: company.id,
    name: company.name,
    score: myScore,
    avg_rating: Number(company.avg_rating ?? 0),
    review_count: Number(company.review_count ?? 0),
    cover_url: company.cover_url ?? null,
    rank,
    total: total ?? 0,
    ranked_count: above ?? 0, // companies with score > 0 (to show "X entreprises vous devancent")
  });
}
