import { NextResponse } from "next/server";
import { getUser, createClient } from "@/lib/supabase/server";
import { REVIEW_PUBLIC_COLS } from "@/lib/actions/columns";

export const dynamic = "force-dynamic";

export async function GET() {
  const [user, supabase] = await Promise.all([getUser(), createClient()]);
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  // Fetch all personal data in parallel
  const [profileRes, reviewsRes, favoritesRes, votesRes, notificationsRes, reportsRes] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      // Colonnes explicites : les droits sur reviews sont par colonne depuis
      // la fermeture de submitter_ip et flag_reason, et "*" est alors refusé.
      supabase.from("reviews").select(`${REVIEW_PUBLIC_COLS}, companies(name)`).eq("user_id", user.id),
      supabase.from("favorites").select("*, companies(name, sector)").eq("user_id", user.id),
      supabase.from("review_votes").select("review_id, created_at").eq("user_id", user.id),
      supabase.from("notifications").select("*").eq("user_id", user.id),
      supabase.from("reports").select("review_id, reason, created_at").eq("reporter_id", user.id),
    ]);

  // Strip internal/sensitive columns from profile before export
  const profile = profileRes.data
    ? (({ id, role, claimed_company_id, identity_verified, identity_verified_at, ...rest }) => rest)(profileRes.data as any)
    : null;

  const payload = {
    export_date: new Date().toISOString(),
    account: {
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      provider: user.app_metadata?.provider ?? "email",
    },
    profile,
    reviews: (reviewsRes.data ?? []).map((r: any) => ({
      company: r.companies?.name,
      rating_overall: r.rating_overall,
      title: r.title,
      content: r.content,
      pros: r.pros,
      cons: r.cons,
      job_title: r.job_title,
      employment_type: r.employment_type,
      duration_range: r.duration_range,
      is_current: r.is_current,
      start_year: r.start_year,
      end_year: r.end_year,
      would_recommend: r.would_recommend,
      salary_chf: r.salary_chf,
      created_at: r.created_at,
      status: r.status,
    })),
    favorites: (favoritesRes.data ?? []).map((f: any) => ({
      company: f.companies?.name,
      sector: f.companies?.sector,
      created_at: f.created_at,
    })),
    helpful_votes_cast: (votesRes.data ?? []).map((v: any) => ({
      review_id: v.review_id,
      voted_at: v.created_at,
    })),
    notifications: (notificationsRes.data ?? []).map((n: any) => ({
      type: n.type,
      read: n.read,
      created_at: n.created_at,
    })),
    reports_submitted: (reportsRes.data ?? []).map((r: any) => ({
      review_id: r.review_id,
      reason: r.reason,
      created_at: r.created_at,
    })),
  };

  const filename = `workie-export-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      // Prevent caching of personal data exports
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Pragma": "no-cache",
    },
  });
}
