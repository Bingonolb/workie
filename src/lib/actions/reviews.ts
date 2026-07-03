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

export async function getReviews(companyId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Review[];
}

type ReviewState = { error?: string; success?: boolean } | undefined;

export async function submitReview(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tu dois être connecté pour poster un avis." };

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
  const salary_chf = salary_raw ? Number(salary_raw) : null;
  const is_current = formData.get("is_current") === "true";
  const employment_type = String(formData.get("employment_type") || "cdi");
  const start_year = Number(formData.get("start_year") || 0) || null;
  const end_year = is_current ? null : (Number(formData.get("end_year") || 0) || null);

  if (!company_id || !job_title) return { error: "Le poste occupé est requis." };
  if (rating_overall < 1) return { error: "La note globale est requise." };
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
    is_current, is_anonymous: true, // always stored anonymously displayed
    employment_type, start_year, end_year,
  });

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { success: true };
}

export async function voteHelpful(reviewId: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Connexion requise." };

  const { error: voteErr } = await supabase
    .from("review_votes")
    .insert({ user_id: user.id, review_id: reviewId });

  if (voteErr) return { error: "Déjà voté." };

  await supabase.rpc("increment_helpful" as any, { review_id: reviewId });

  revalidatePath("/", "layout");
  return { success: true };
}
