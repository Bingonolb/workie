import { NextResponse } from "next/server";
import { getUser, createClient } from "@/lib/supabase/server";
import { REVIEW_PUBLIC_COLS } from "@/lib/actions/columns";
import { createAdminClient } from "@/lib/supabase/admin";

// Les lignes lues ici viennent de PostgREST avec leurs relations imbriquées.
// Les décrire vaut mieux que de les ouvrir : l'export part chez l'utilisateur,
// et une colonne ajoutée en base ne doit pas s'y glisser sans qu'on le voie.
type LigneAvisExport = {
  companies: { name: string | null } | null;
  rating_overall: number; title: string | null; content: string | null;
  pros: string | null; cons: string | null; job_title: string | null;
  employment_type: string | null; duration_range: string | null;
  is_current: boolean | null; start_year: number | null; end_year: number | null;
  would_recommend: string | null; salary_chf: number | null;
  created_at: string; status: string | null;
};
type LigneFavoriExport = { companies: { name: string | null; sector: string | null } | null; created_at: string };
type LigneVoteExport = { review_id: string; created_at: string };
type LigneNotificationExport = { type: string; read: boolean; created_at: string };
type LigneSignalementExport = { target_type: string; target_label: string | null; category: string; explanation: string | null; status: string | null; created_at: string };
type LigneCampagneExport = { headline: string; format: string; status: string; start_date: string | null; end_date: string | null; total_budget_chf: number | null; paid_at: string | null; created_at: string };
type LigneRevendicationExport = { prenom: string; nom: string; fonction: string; email_pro: string; statut: string; cree_le: string; companies: { name: string | null } | null };
type LigneClicOffreExport = { clique_le: string; companies: { name: string | null } | null };
type LigneOffreGardeeExport = { created_at: string; job_offers: { title: string | null; apply_url: string | null; companies: { name: string | null } | null } | null };
type LigneConsultationExport = { viewed_at: string; companies: { name: string | null } | null };


export const dynamic = "force-dynamic";

export async function GET() {
  const [user, supabase] = await Promise.all([getUser(), createClient()]);
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  // Fetch all personal data in parallel
  // Clé de service, filtrée sur l'identité de la session : l'export doit être
  // complet, y compris pour une entreprise d'une catégorie pas encore publiée
  // (la lecture ordinaire la masquerait et le nom manquerait).
  const admin = createAdminClient();
  const [profileRes, reviewsRes, favoritesRes, votesRes, notificationsRes, reportsRes, campagnesRes, revendicationsRes, clicsRes, offresRes, consultationsRes] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      // Colonnes explicites : les droits sur reviews sont par colonne depuis
      // la fermeture de submitter_ip et flag_reason, et "*" est alors refusé.
      // Clé de service : le filtre porte sur user_id, colonne fermée aux rôles
      // anon et authenticated. L'identité vient de la session déjà validée.
      createAdminClient().from("reviews").select(`${REVIEW_PUBLIC_COLS}, companies(name)`).eq("user_id", user.id),
      admin.from("favorites").select("created_at, companies(name, sector)").eq("user_id", user.id),
      supabase.from("review_votes").select("review_id, created_at").eq("user_id", user.id),
      supabase.from("notifications").select("*").eq("user_id", user.id),
      supabase.from("reports").select("target_type, target_label, category, explanation, status, created_at").eq("reporter_id", user.id),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (admin.from("ad_campaigns") as any).select("headline, format, status, start_date, end_date, total_budget_chf, paid_at, created_at").eq("user_id", user.id),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (admin.from("revendications" as any) as any).select("prenom, nom, fonction, email_pro, statut, cree_le, companies(name)").eq("user_id", user.id),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (admin.from("clics_offres" as any) as any).select("clique_le, companies(name)").eq("user_id", user.id),
      // Les offres gardées (signet) et l historique des fiches ouvertes : deux données
      // personnelles que l export oubliait.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (admin.from("offres_enregistrees" as any) as any).select("created_at, job_offers(title, apply_url, companies(name))").eq("user_id", user.id),
      admin.from("company_views").select("viewed_at, companies(name)").eq("user_id", user.id).order("viewed_at", { ascending: false }).limit(5000),
    ]);

  // Strip internal/sensitive columns from profile before export
  const profile = profileRes.data
    ? (({ id, role, claimed_company_id, identity_verified, identity_verified_at, ...rest }) => rest)(profileRes.data as Record<string, unknown>)
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
    reviews: ((reviewsRes.data ?? []) as unknown as LigneAvisExport[]).map((r) => ({
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
    favorites: ((favoritesRes.data ?? []) as unknown as LigneFavoriExport[]).map((f) => ({
      company: f.companies?.name,
      sector: f.companies?.sector,
      created_at: f.created_at,
    })),
    helpful_votes_cast: ((votesRes.data ?? []) as unknown as LigneVoteExport[]).map((v) => ({
      review_id: v.review_id,
      voted_at: v.created_at,
    })),
    notifications: ((notificationsRes.data ?? []) as unknown as LigneNotificationExport[]).map((n) => ({
      type: n.type,
      read: n.read,
      created_at: n.created_at,
    })),
    reports_submitted: ((reportsRes.data ?? []) as unknown as LigneSignalementExport[]).map((r) => ({
      target_type: r.target_type,
      target: r.target_label,
      category: r.category,
      explanation: r.explanation,
      status: r.status,
      created_at: r.created_at,
    })),
    ad_campaigns: ((campagnesRes.data ?? []) as LigneCampagneExport[]),
    company_management_requests: ((revendicationsRes.data ?? []) as LigneRevendicationExport[]).map(r => ({
      company: r.companies?.name, first_name: r.prenom, last_name: r.nom, job_title: r.fonction,
      work_email: r.email_pro, status: r.statut, created_at: r.cree_le,
    })),
    job_offer_clicks: ((clicsRes.data ?? []) as LigneClicOffreExport[]).map(c => ({ company: c.companies?.name, clicked_at: c.clique_le })),
    saved_job_offers: ((offresRes.data ?? []) as LigneOffreGardeeExport[]).map(o => ({ title: o.job_offers?.title, company: o.job_offers?.companies?.name, url: o.job_offers?.apply_url, saved_at: o.created_at })),
    company_pages_viewed: ((consultationsRes.data ?? []) as unknown as LigneConsultationExport[]).map(v => ({ company: v.companies?.name, viewed_at: v.viewed_at })),
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
