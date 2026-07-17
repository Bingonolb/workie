"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Review } from "@/lib/types";

export async function getUserReviews(): Promise<(Review & { company_name: string })[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("reviews")
    .select("*, companies(name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return (data ?? []).map((r: any) => ({ ...r, company_name: r.companies?.name ?? "Entreprise inconnue" }));
}

export async function getReviews(companyId: string, limit = 100) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as Review[];
}

type ReviewState = { error?: string; success?: boolean } | undefined;

export async function submitReview(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tu dois être connecté pour poster un avis." };

  // Require confirmed email — prevents throwaway accounts
  if (!user.email_confirmed_at) {
    return { error: "Confirme ton adresse email avant de publier un avis." };
  }

  // Require account to be at least 24h old — reduces review bombing by fresh accounts
  const accountAgeMs = Date.now() - new Date(user.created_at).getTime();
  if (accountAgeMs < 24 * 60 * 60 * 1000) {
    return { error: "Ton compte doit avoir au moins 24h pour publier un avis." };
  }

  // Business accounts cannot post reviews
  const { data: userProfile } = await supabase.from("profiles").select("claimed_company_id").eq("id", user.id).maybeSingle();
  if (userProfile?.claimed_company_id) return { error: "Les comptes entreprise ne peuvent pas publier d'avis." };

  const company_id = String(formData.get("company_id") || "");
  const rating_overall = Number(formData.get("rating_overall") || 0);
  const rating_culture = Number(formData.get("rating_culture") || 0) || null;
  const rating_management = Number(formData.get("rating_management") || 0) || null;
  const rating_worklife = Number(formData.get("rating_worklife") || 0) || null;
  const rating_career = Number(formData.get("rating_career") || 0) || null;
  const title = String(formData.get("title") || "").trim() || null;
  const content = String(formData.get("content") || "").trim();
  const pros = String(formData.get("pros") || "").trim() || null;
  const cons = String(formData.get("cons") || "").trim() || null;
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

  // Validate company exists before any other check
  if (!company_id) return { error: "Entreprise manquante." };
  const { data: companyExists } = await supabase.from("companies").select("id").eq("id", company_id).maybeSingle();
  if (!companyExists) return { error: "Entreprise introuvable." };
  if (!job_title) return { error: "Le poste occupé est requis." };
  if (!duration_range) return { error: "La durée dans l'entreprise est requise." };
  if (rating_overall < 1) return { error: "La note globale est requise." };
  if (!would_recommend) return { error: "Indique si tu recommanderais cette entreprise." };
  if (!pros || pros.length < 10) return { error: "Les points positifs sont requis (min. 10 caractères)." };
  if (!cons || cons.length < 10) return { error: "Les points négatifs sont requis (min. 10 caractères)." };
  if (!content || content.length < 50) return { error: "L'avis doit faire au moins 50 caractères." };

  // Check if user already reviewed this company
  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("company_id", company_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) return { error: "Tu as déjà posté un avis pour cette entreprise." };

  const { error } = await supabase.from("reviews").insert({
    company_id, user_id: user.id,
    rating_overall, rating_culture, rating_management, rating_worklife, rating_career,
    title, content, pros, cons, job_title, salary_chf,
    is_current, is_anonymous: true,
    employment_type, duration_range, work_mode, would_recommend, knew_before,
  });

  if (error) {
    if (error.code === "23505") return { error: "Tu as déjà posté un avis pour cette entreprise." };
    return { error: error.message };
  }

  revalidatePath(`/company/${company_id}`);
  revalidatePath("/profile");
  revalidatePath("/salaires");
  revalidatePath("/ranking");
  return { success: true };
}

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
    if (voteErr.code === "23505") return { alreadyVoted: true }; // unique constraint violation
    return { error: voteErr.message };
  }

  const { error: rpcErr } = await supabase.rpc("increment_helpful", { review_id: reviewId });
  if (rpcErr) {
    // Rollback the vote insert to keep counts consistent.
    // If rollback also fails, delete by both columns so the unique constraint
    // doesn't permanently block the user from voting.
    await supabase.from("review_votes").delete().eq("user_id", user.id).eq("review_id", reviewId);
    console.error("[voteHelpful] increment_helpful RPC failed:", rpcErr.message);
    return { error: "Erreur serveur, veuillez réessayer." };
  }

  // Revalidate the company page so the helpful count is fresh for next visitors
  const { data: rev } = await supabase.from("reviews").select("company_id").eq("id", reviewId).maybeSingle();
  if (rev?.company_id) revalidatePath(`/company/${rev.company_id}`);

  return {};
}
