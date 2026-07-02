"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Review } from "@/lib/types";

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
  const is_anonymous = formData.get("is_anonymous") !== "false";

  if (!company_id || rating_overall < 1 || !content) {
    return { error: "Note globale et contenu de l'avis sont requis." };
  }

  const { error } = await supabase.from("reviews").insert({
    company_id, user_id: user.id,
    rating_overall, rating_culture, rating_management, rating_worklife, rating_career,
    title, content, pros, cons, job_title, salary_chf,
    is_current, is_anonymous,
  });

  if (error) return { error: error.message };

  revalidatePath(`/company/${company_id}`);
  return { success: true };
}

export async function voteHelpful(reviewId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Connexion requise." };

  const { error: voteErr } = await supabase.from("review_votes").insert({ user_id: user.id, review_id: reviewId });
  if (voteErr) return { error: "Déjà voté." };

  await supabase.from("reviews").update({ helpful_count: supabase.rpc("increment" as any, { row_id: reviewId }) }).eq("id", reviewId);
  return { success: true };
}
