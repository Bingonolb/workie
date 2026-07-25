"use server";

import { headers } from "next/headers";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureServerError } from "@/lib/monitoring";
import type { Review } from "@/lib/types";

// ── Column selectors ─────────────────────────────────────────────────────────

// submitter_ip and flag_reason are moderation-only fields — never sent to the frontend.
export const REVIEW_PUBLIC_COLS = [
  "id", "company_id", "user_id",
  "rating_overall", "rating_culture", "rating_management", "rating_worklife", "rating_career",
  "title", "content", "pros", "cons", "job_title", "salary_chf",
  "is_current", "is_anonymous", "employment_type", "duration_range",
  "work_mode", "would_recommend", "knew_before",
  "start_year", "end_year", "helpful_count", "created_at",
  "status", "is_verified_author",
].join(",");

// ── Read actions ────────────────────────────────────────────────────────────

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
    .select(REVIEW_PUBLIC_COLS)
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
      .select(REVIEW_PUBLIC_COLS)
      .eq("company_id", companyId)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(100);
    return (data ?? []) as unknown as Review[];
  },
  ["reviews"],
  { revalidate: 60, tags: ["reviews"] }
);

// ── Banned words (defamation, hate speech, discrimination) ───────────────────

// Patterns that signal personal attacks, hate speech, or discriminatory content.
// These flag for human review rather than auto-reject, since context matters.
const BANNED_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  // Personal name attacks: "Monsieur/Madame/M. X est un" — targets an individual
  { pattern: /\b(monsieur|madame|m\.|mme\.?)\s+\w+\s+(est\s+(un|une)|est\s+vraiment|est\s+franchement)/i, reason: "Attaque personnelle nominative détectée." },
  // Explicit slurs — Unicode-aware boundaries (?<![a-zA-ZÀ-ÿ]) replaces \b so accented chars (enculé, pédé…) are caught
  { pattern: /(?<![a-zA-ZÀ-ÿ])(connard|salope|enculé|fdp|va\s*te\s*faire|nique\s*(ta|sa)|pédé|pute|bâtard|batard|imbécile|débile|crétin|abruti|con(?:ne?)?)(?![a-zA-ZÀ-ÿ])/i, reason: "Le contenu contient des insultes. Exprime-toi de façon constructive." },
  // Discrimination: race, religion, gender, orientation — bidirectional ("boîte raciste" OR "raciste dans cette boîte")
  { pattern: /(?:\b(?:raciste|racisme|antisémite|islamophobie|homophobie|transphobie|sexiste|sexisme)\b.*\b(?:entreprise|boite|boîte|société|management|patron|rh)\b|\b(?:entreprise|boite|boîte|société|management|patron|rh)\b.*\b(?:raciste|racisme|antisémite|islamophobie|homophobie|transphobie|sexiste|sexisme)\b)/i, reason: "Mentions de discrimination détectées — avis transmis à la modération." },
  // Direct threats
  { pattern: /\b(je\s+vais|on\s+va|va)\s+(te|vous|lui)\s+(tuer|détruire|ruiner|attaquer|poursuivre)/i, reason: "Menace détectée." },
  // Publishing private information (doxxing)
  { pattern: /\b\d{2}\s?\d{3}\s?\d{2}\s?\d{2}\b|\b(\+41|0041|0)\s?[1-9]\d\s?\d{3}\s?\d{2}\s?\d{2}\b/, reason: "Numéro de téléphone détecté — ne publie pas d'informations personnelles." },
];

function checkBannedContent(content: string, pros: string, cons: string): string | null {
  const combined = [content, pros, cons].filter(Boolean).join(" ");
  for (const { pattern, reason } of BANNED_PATTERNS) {
    if (pattern.test(combined)) return reason;
  }
  return null;
}

// ── Content quality checks ───────────────────────────────────────────────────

const URL_PATTERN = /https?:\/\/|www\.|\.com|\.ch|\.net|\.org/i;
const REPEAT_CHAR_PATTERN = /(.)\1{5,}/;

function checkContentQuality(content: string, pros: string, cons: string): string | null {
  for (const [field, text] of [["avis", content], ["points positifs", pros], ["points négatifs", cons]] as const) {
    if (!text) continue;
    const letters = text.replace(/[^a-zA-ZÀ-ÿ]/g, "");
    const uppers = text.replace(/[^A-ZÀ-Ÿ]/g, "").length;
    if (letters.length > 10 && uppers / letters.length > 0.6) {
      return `Trop de majuscules dans les ${field}. Écris normalement.`;
    }
    if (URL_PATTERN.test(text)) {
      return `Les ${field} ne peuvent pas contenir de liens.`;
    }
    if (REPEAT_CHAR_PATTERN.test(text)) {
      return `Caractères répétés détectés dans les ${field}.`;
    }
  }
  const words = content.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const unique = new Set(words);
  if (words.length >= 5 && unique.size < 8) {
    return "L'avis doit contenir au moins 8 mots différents.";
  }
  if (pros && cons && pros.trim().toLowerCase() === cons.trim().toLowerCase()) {
    return "Les points positifs et négatifs ne peuvent pas être identiques.";
  }
  return null;
}

// ── Content similarity (Jaccard on word trigrams) ────────────────────────────

function getWordTrigrams(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-zàâäéèêëîïôùûüœ\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2);
  const trigrams = new Set<string>();
  for (let i = 0; i <= words.length - 3; i++) {
    trigrams.add(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
  }
  return trigrams;
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

const SIMILARITY_THRESHOLD = 0.45;

async function findSimilarReview(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  companyId: string,
  newContent: string
): Promise<boolean> {
  const { data: existing } = await supabase
    .from("reviews")
    .select("content, pros, cons")
    .eq("company_id", companyId)
    .eq("status", "published")
    .limit(50);

  if (!existing || existing.length === 0) return false;

  const newTrigrams = getWordTrigrams(newContent);
  if (newTrigrams.size < 3) return false;

  for (const r of existing as { content: string; pros: string | null; cons: string | null }[]) {
    const existingText = [r.content, r.pros, r.cons].filter(Boolean).join(" ");
    const existingTrigrams = getWordTrigrams(existingText);
    if (jaccardSimilarity(newTrigrams, existingTrigrams) >= SIMILARITY_THRESHOLD) {
      return true;
    }
  }
  return false;
}

// ── IP abuse detection ───────────────────────────────────────────────────────

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
  if (!pros || pros.length < 10) return { error: "Les points positifs sont requis (min. 10 caractères)." };
  if (pros.length > 2000) return { error: "Les points positifs ne peuvent pas dépasser 2000 caractères." };
  if (!cons || cons.length < 10) return { error: "Les points négatifs sont requis (min. 10 caractères)." };
  if (cons.length > 2000) return { error: "Les points négatifs ne peuvent pas dépasser 2000 caractères." };
  if (!content || content.length < 50) return { error: "L'avis doit faire au moins 50 caractères." };
  if (content.length > 5000) return { error: "L'avis ne peut pas dépasser 5000 caractères." };
  if (title && title.length > 150) return { error: "Le titre ne peut pas dépasser 150 caractères." };
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

  const bannedCheck = checkBannedContent(content, pros ?? "", cons ?? "");
  if (bannedCheck) return { error: bannedCheck };

  const qualityCheck = checkContentQuality(content, pros ?? "", cons ?? "");
  if (qualityCheck) return { error: qualityCheck };

  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("company_id", company_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) return { error: "Tu as déjà posté un avis pour cette entreprise." };

  // Per-user global rate limit: max 3 review submissions per 24h across all companies.
  // Catches multi-company bombing even when the user changes IP or uses a VPN.
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: recentCount } = await supabase
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

  // Run abuse and similarity checks in parallel using admin client (bypasses RLS)
  const admin = createAdminClient();
  const [ipAbuse, similarContent] = await Promise.all([
    submitter_ip ? isIpAbuse(admin, company_id, submitter_ip, user.id) : Promise.resolve(false),
    findSimilarReview(admin, company_id, [content, pros, cons].filter(Boolean).join(" ")),
  ]);

  let status: "published" | "flagged" = "published";
  let flag_reason: string | null = null;
  if (ipAbuse) {
    status = "flagged";
    flag_reason = "ip_abuse";
  } else if (similarContent) {
    status = "flagged";
    flag_reason = "similar_content";
  }

  const { error } = await supabase.from("reviews").insert({
    company_id, user_id: user.id,
    rating_overall, rating_culture, rating_management, rating_worklife, rating_career,
    title, content, pros, cons, job_title, salary_chf,
    is_current, is_anonymous: true,
    employment_type, duration_range, work_mode, would_recommend, knew_before,
    start_year, end_year,
    submitter_ip, is_verified_author, status, flag_reason,
  });

  if (error) {
    if (error.code === "23505") return { error: "Tu as déjà posté un avis pour cette entreprise." };
    return { error: error.message };
  }

  // Notify admin if flagged (fire-and-forget)
  if (status === "flagged") {
    void notifyAdminFlaggedReview(companyExists.name, flag_reason!, content.slice(0, 200)).catch(() => {});
  }

  revalidatePath(`/company/${company_id}`);
  revalidatePath("/profile");
  revalidatePath("/salaires");
  revalidatePath("/ranking");
  revalidateTag("companies", {});
  revalidateTag("reviews", {});
  revalidateTag("top-companies", {});
  revalidateTag("business-analytics", {});
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

  const { error: rpcErr } = await supabase.rpc("increment_helpful", { review_id: reviewId });
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
