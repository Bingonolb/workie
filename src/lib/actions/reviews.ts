"use server";

import { headers } from "next/headers";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { createClient, getUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureServerError } from "@/lib/monitoring";
import type { Review } from "@/lib/types";

import { REVIEW_PUBLIC_COLS, REVIEW_FICHE_COLS } from "@/lib/actions/columns";

// ── Read actions ────────────────────────────────────────────────────────────

export async function getUserReviews(): Promise<(Review & { company_name: string })[]> {
  // getUser() est mis en cache pour la durée de la requête ; appeler
  // supabase.auth.getUser() directement ajoutait un aller-retour réseau vers
  // l'authentification à chaque affichage du profil, en plus de celui que la
  // page fait déjà.
  const user = await getUser();
  if (!user) return [];
  // Colonnes explicites plutôt que "*". Les droits de lecture sur reviews sont
  // par colonne — submitter_ip, flag_reason et user_id sont fermés — et
  // PostgREST refuse "*" dès qu'une colonne échappe au rôle appelant.
  //
  // Clé de service parce que le filtre porte sur user_id : PostgreSQL exige le
  // droit de lecture sur une colonne même pour filtrer dessus. L'identité vient
  // de getUser(), qui a validé le jeton — le filtre reste donc borné à
  // l'utilisateur courant.
  const { data } = await createAdminClient()
    .from("reviews")
    .select(`${REVIEW_PUBLIC_COLS}, companies(name)`)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return (data ?? []).map((r: any) => ({ ...r, company_name: r.companies?.name ?? "Entreprise inconnue" }));
}

export async function getReviews(companyId: string, limit = 100) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select(REVIEW_FICHE_COLS)
    .eq("company_id", companyId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as Review[];
}

export const getCachedReviews = unstable_cache(
  async (companyId: string) => {
    const admin = createAdminClient();
    const { data } = await admin
      .from("reviews")
      .select(REVIEW_FICHE_COLS)
      .eq("company_id", companyId)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(100);
    return (data ?? []) as unknown as Review[];
  },
  ["reviews"],
  { revalidate: 60, tags: ["reviews"] }
);

// ── Note sur les filtres de contenu ──────────────────────────────────────────
//
// Le filtrage des mots interdits, le contrôle de qualité rédactionnelle et la
// détection d'avis dupliqués ont été retirés avec le texte des avis. Ils
// portaient sur des champs que le formulaire ne collecte plus : ils
// s'exécutaient sur des chaînes vides et ne détectaient plus rien. Les
// conserver aurait entretenu l'illusion d'une protection.
//
// Ce qui protège réellement aujourd'hui : compte confirmé de plus de 24 h, un
// seul avis par entreprise et par personne, trois avis par 24 h, détection des
// publications répétées depuis une même adresse réseau, et la file de
// signalements relue à la main.
//
// Attention : de la saisie libre subsiste ailleurs — titres et textes des
// campagnes publicitaires, motifs de signalement. Elle n'a jamais été filtrée.

async function isIpAbuse(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  companyId: string,
  ip: string,
  currentUserId: string
): Promise<boolean> {
  const since48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("submitter_ip", ip)
    .neq("user_id", currentUserId)
    .gte("created_at", since48h);
  return (count ?? 0) > 0;
}

// ── Submit review ────────────────────────────────────────────────────────────

type ReviewState = { error?: string; success?: boolean } | undefined;

export async function submitReview(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tu dois être connecté pour poster un avis." };

  if (!user.email_confirmed_at) {
    return { error: "Confirme ton adresse email avant de publier un avis." };
  }

  const accountAgeMs = Date.now() - new Date(user.created_at).getTime();
  if (accountAgeMs < 24 * 60 * 60 * 1000) {
    return { error: "Ton compte doit avoir au moins 24h pour publier un avis." };
  }

  const { data: userProfile } = await supabase
    .from("profiles")
    .select("claimed_company_id, identity_verified")
    .eq("id", user.id)
    .maybeSingle();
  if (userProfile?.claimed_company_id) return { error: "Les comptes entreprise ne peuvent pas publier d'avis." };

  const company_id = String(formData.get("company_id") || "");
  const rating_overall = Number(formData.get("rating_overall") || 0);
  const rating_culture = Number(formData.get("rating_culture") || 0) || null;
  const rating_management = Number(formData.get("rating_management") || 0) || null;
  const rating_worklife = Number(formData.get("rating_worklife") || 0) || null;
  const rating_career = Number(formData.get("rating_career") || 0) || null;
  const rating_flexibility = Number(formData.get("rating_flexibility") || 0) || null;
  const rating_recognition = Number(formData.get("rating_recognition") || 0) || null;
  const rating_workload = Number(formData.get("rating_workload") || 0) || null;
  const rating_diversity = Number(formData.get("rating_diversity") || 0) || null;
  const would_return = String(formData.get("would_return") || "").trim() || null;
  // Aucun texte n'est collecté : le formulaire n'a pas de champ de saisie, la
  // fiche n'en affiche rien, et les colonnes ont été vidées en base. Les lire
  // ici revenait à interroger des champs qui n'existent pas.
  const job_title = String(formData.get("job_title") || "").trim() || null;
  const salary_raw = String(formData.get("salary_chf") || "");
  const salary_num = salary_raw ? Number(salary_raw) : null;
  const salary_chf = salary_num !== null && salary_num >= 10000 && salary_num <= 500000 ? salary_num : null;
  const is_current = formData.get("is_current") === "true";
  const employment_type = String(formData.get("employment_type") || "cdi");
  const duration_range = String(formData.get("duration_range") || "").trim() || null;
  const work_mode = String(formData.get("work_mode") || "").trim() || null;
  const would_recommend = String(formData.get("would_recommend") || "").trim() || null;
  const knew_before = String(formData.get("knew_before") || "").trim() || null;
  const start_year_raw = String(formData.get("start_year") || "").trim();
  const end_year_raw = String(formData.get("end_year") || "").trim();
  const start_year = start_year_raw ? Number(start_year_raw) : null;
  const end_year = end_year_raw ? Number(end_year_raw) : null;

  if (!company_id) return { error: "Entreprise manquante." };
  const { data: companyExists } = await supabase.from("companies").select("id, name").eq("id", company_id).maybeSingle();
  if (!companyExists) return { error: "Entreprise introuvable." };
  if (!job_title) return { error: "Le poste occupé est requis." };
  if (!duration_range) return { error: "La durée dans l'entreprise est requise." };
  if (rating_overall < 1) return { error: "La note globale est requise." };
  if (!would_recommend) return { error: "Indique si tu recommanderais cette entreprise." };
  if (job_title && job_title.length > 100) return { error: "Le poste ne peut pas dépasser 100 caractères." };

  const currentYear = new Date().getFullYear();
  if (start_year !== null) {
    if (start_year < 1950 || start_year > currentYear) {
      return { error: `L'année de début doit être entre 1950 et ${currentYear}.` };
    }
  }
  if (!is_current && end_year !== null) {
    if (end_year < 1950 || end_year > currentYear) {
      return { error: `L'année de fin doit être entre 1950 et ${currentYear}.` };
    }
    if (start_year !== null && end_year < start_year) {
      return { error: "L'année de fin doit être après l'année de début." };
    }
  }

  // Les filtres de contenu — mots interdits, qualité rédactionnelle,
  // ressemblance entre avis — portaient sur un texte qui n'est plus saisi. Ils
  // s'exécutaient donc sur des chaînes vides, sans jamais rien détecter. Les
  // garde-fous qui subsistent sont réels : compte confirmé de plus de 24 h, un
  // seul avis par entreprise, trois par jour, répétitions depuis une même
  // adresse, et la file de signalements.

  // Clé de service : ces deux gardes filtrent sur user_id, dont le droit de
  // lecture a été retiré aux rôles anon et authenticated. Avec le client
  // soumis aux RLS, la requête échouerait — et elle échouerait en silence,
  // laissant passer les doublons et la limite de 3 avis par 24 h.
  const gardes = createAdminClient();

  const { data: existing } = await gardes
    .from("reviews")
    .select("id")
    .eq("company_id", company_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) return { error: "Tu as déjà posté un avis pour cette entreprise." };

  // Per-user global rate limit: max 3 review submissions per 24h across all companies.
  // Catches multi-company bombing even when the user changes IP or uses a VPN.
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: recentCount } = await gardes
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", since24h);
  if ((recentCount ?? 0) >= 3) {
    return { error: "Tu as atteint la limite de 3 avis par 24h. Réessaie demain." };
  }

  // Capture IP for fraud tracking (stored, never shown publicly)
  const h = await headers();
  const submitter_ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  const is_verified_author = userProfile?.identity_verified === true;

  // Détection d'abus par adresse réseau. La comparaison de contenu entre avis
  // a disparu avec le texte : il n'y a plus rien à comparer.
  const admin = createAdminClient();
  const ipAbuse = submitter_ip
    ? await isIpAbuse(admin, company_id, submitter_ip, user.id)
    : false;

  let status: "published" | "flagged" = "published";
  let flag_reason: string | null = null;
  if (ipAbuse) {
    status = "flagged";
    flag_reason = "ip_abuse";
  }

  const { error } = await supabase.from("reviews").insert({
    company_id, user_id: user.id,
    rating_overall, rating_culture, rating_management, rating_worklife, rating_career,
    rating_flexibility, rating_recognition, rating_workload, rating_diversity,
    job_title, salary_chf,
    is_current, is_anonymous: true,
    employment_type, duration_range, work_mode, would_recommend, would_return, knew_before,
    start_year, end_year,
    submitter_ip, is_verified_author, status, flag_reason,
  });

  if (error) {
    if (error.code === "23505") return { error: "Tu as déjà posté un avis pour cette entreprise." };
    return { error: error.message };
  }

  // Notify admin if flagged (fire-and-forget)
  if (status === "flagged") {
    void notifyAdminFlaggedReview(companyExists.name, flag_reason!, `${job_title ?? "poste non précisé"} · note ${rating_overall}/5`).catch(() => {});
  }

  revalidatePath(`/company/${company_id}`);
  revalidatePath("/profile");
  revalidatePath("/salaires");
  revalidatePath("/ranking");
  revalidateTag("companies", {});
  revalidateTag("reviews", {});
  revalidateTag("top-companies", {});
  revalidateTag("landing-counts", {});

  // Notify business owner of new review (only for published ones)
  if (status === "published") {
    void (async () => {
      try {
        const co = await admin.from("companies").select("is_subscribed").eq("id", company_id).maybeSingle();
        if (!co?.data?.is_subscribed) return;
        const profile = await admin.from("profiles").select("id").eq("claimed_company_id", company_id).maybeSingle();
        if (!profile?.data?.id) return;
        const authUser = await admin.auth.admin.getUserById(profile.data.id);
        const email = authUser?.data?.user?.email;
        const companyName = companyExists.name;
        if (email && companyName) {
          const { sendNewReviewEmail } = await import("@/lib/email");
          await sendNewReviewEmail(email, companyName, company_id, rating_overall);
        }
      } catch { /* silent */ }
    })();
  }

  // Return success but tell the user if their review is under review
  return status === "flagged"
    ? { success: true, error: undefined }
    : { success: true };
}

async function notifyAdminFlaggedReview(
  companyName: string,
  flagReason: string,
  excerpt: string
): Promise<void> {
  try {
    const { sendAdminFlagAlert } = await import("@/lib/email");
    await sendAdminFlagAlert(companyName, flagReason, excerpt);
  } catch { /* non-blocking */ }
}

// ── Vote helpful ─────────────────────────────────────────────────────────────

export async function voteHelpful(reviewId: string): Promise<{ error?: string; alreadyVoted?: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };
  const { data: profile } = await supabase.from("profiles").select("claimed_company_id").eq("id", user.id).maybeSingle();
  if (profile?.claimed_company_id) return { error: "Les comptes entreprise ne peuvent pas voter." };

  const { error: voteErr } = await supabase
    .from("review_votes")
    .insert({ user_id: user.id, review_id: reviewId });

  if (voteErr) {
    if (voteErr.code === "23505") return { alreadyVoted: true };
    return { error: voteErr.message };
  }

  // Par la clé de service : le droit d'exécution a été retiré à anon et
  // authenticated. La clé anon est publique, et PostgREST exposait cette
  // fonction sur /rest/v1/rpc — le compteur « utile » pouvait être gonflé
  // sans être connecté et sans passer par l'insertion dans review_votes qui
  // garantit un vote par personne. Les vérifications ci-dessus ne changent pas.
  const { error: rpcErr } = await createAdminClient().rpc("increment_helpful", { review_id: reviewId });
  if (rpcErr) {
    await supabase.from("review_votes").delete().eq("user_id", user.id).eq("review_id", reviewId);
    captureServerError(rpcErr, { action: "voteHelpful", step: "increment_helpful_rpc", reviewId });
    return { error: "Erreur serveur, veuillez réessayer." };
  }

  const { data: rev } = await supabase.from("reviews").select("company_id").eq("id", reviewId).maybeSingle();
  if (rev?.company_id) revalidatePath(`/company/${rev.company_id}`);
  revalidateTag("reviews", {});

  return {};
}

// ── Admin: moderation of flagged reviews ─────────────────────────────────────

async function assertAdmin(): Promise<{ error: string } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non autorisé" };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return { error: "Accès refusé" };
  return null;
}

export interface FlaggedReview {
  id: string;
  company_id: string;
  company_name: string;
  content: string;
  pros: string | null;
  cons: string | null;
  job_title: string | null;
  rating_overall: number;
  flag_reason: string;
  submitter_ip: string | null;
  created_at: string;
}

export async function getFlaggedReviews(): Promise<{ reviews?: FlaggedReview[]; error?: string }> {
  const authErr = await assertAdmin();
  if (authErr) return authErr;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("reviews")
    .select("id, company_id, content, pros, cons, job_title, rating_overall, flag_reason, submitter_ip, created_at, companies(name)")
    .eq("status", "flagged")
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };

  const reviews: FlaggedReview[] = (data ?? []).map((r: any) => ({
    id: r.id,
    company_id: r.company_id,
    company_name: r.companies?.name ?? "Entreprise inconnue",
    content: r.content,
    pros: r.pros,
    cons: r.cons,
    job_title: r.job_title,
    rating_overall: Number(r.rating_overall),
    flag_reason: r.flag_reason ?? "unknown",
    submitter_ip: r.submitter_ip,
    created_at: r.created_at,
  }));

  return { reviews };
}

export async function approveReview(reviewId: string): Promise<{ error?: string }> {
  const authErr = await assertAdmin();
  if (authErr) return authErr;

  const admin = createAdminClient();
  const { error } = await admin
    .from("reviews")
    .update({ status: "published", flag_reason: null })
    .eq("id", reviewId);
  if (error) return { error: error.message };

  revalidateTag("reviews", {});
  revalidateTag("companies", {});
  return {};
}

export async function removeFlaggedReview(reviewId: string): Promise<{ error?: string }> {
  const authErr = await assertAdmin();
  if (authErr) return authErr;

  const admin = createAdminClient();
  // Soft delete: mark as removed (preserves data for analytics and appeals)
  const { error } = await admin
    .from("reviews")
    .update({ status: "removed" })
    .eq("id", reviewId);
  if (error) return { error: error.message };

  revalidateTag("reviews", {});
  revalidateTag("companies", {});
  return {};
}
