"use server";

import { revalidatePath, unstable_cache } from "next/cache";
import { createClient, getUser, getBusinessCompanyData } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyFavoriteUsers } from "@/lib/actions/notifications";
import { headers } from "next/headers";

// ── Helpers ──────────────────────────────────────────────────────────────────

async function requireBusiness() {
  // Both getUser() and getBusinessCompanyData() are cache()-wrapped —
  // they share the same result as the layout/page in the same request.
  const [user, company, supabase] = await Promise.all([getUser(), getBusinessCompanyData(), createClient()]);
  if (!user) throw new Error("Non authentifié");
  if (!company) throw new Error("Aucune entreprise liée");

  // profile.role needed for admin checks — fetch only when needed below
  const profile = { claimed_company_id: company.id, role: "business" };

  return { user, supabase, company, profile };
}

// ── Getters ───────────────────────────────────────────────────────────────────

export async function getBusinessCompany() {
  try {
    const { company } = await requireBusiness();
    return { company };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function getBusinessReviews() {
  try {
    const { supabase, company } = await requireBusiness();

    const { data: reviews } = await supabase
      .from("reviews")
      .select("*, company_replies(id, content, created_at)")
      .eq("company_id", company.id)
      .order("created_at", { ascending: false });

    return { reviews: reviews ?? [] };
  } catch (e) {
    return { reviews: [], error: (e as Error).message };
  }
}

// ── Visitor profile helpers ────────────────────────────────────────────────────

function detectSeniority(title: string): string {
  const t = title.toLowerCase();
  if (/\b(ceo|cto|cfo|coo|cpo|chro|pdg|dg|président|vp|vice.pr[eé]sident|directeur.g[eé]n[eé]ral|managing.director)\b/.test(t)) return "C-Level / VP";
  if (/\b(directeur|director|head.of|chief|responsable|chef.de|associate.director)\b/.test(t)) return "Directeur";
  if (/\b(manager|lead|principal|staff|senior|confirmé|exp[eé]riment[eé]|expert|architecte|tech.lead)\b/.test(t)) return "Senior / Lead";
  if (/\b(junior|stagiaire|apprenti|alternant|d[eé]butant|intern|assistant|trainee)\b/.test(t)) return "Junior / Stagiaire";
  return "Intermédiaire";
}

function detectFunction(title: string): string {
  const t = title.toLowerCase();
  if (/\b(dev|développeur|software|engineer|ingénieur|data|it|tech|architecte|devops|sre|cloud|qa|infra|backend|frontend|fullstack)\b/.test(t)) return "Tech / IT";
  if (/\b(finance|comptable|contr[oô]leur|audit|trésor|risk|crédit|financi)\b/.test(t)) return "Finance";
  if (/\b(rh|hr|people|talent|recrutement|recruteur|hrbp|formation|paie|ressources humaines)\b/.test(t)) return "RH / People";
  if (/\b(marketing|communication|digital|brand|seo|content|social media|pr|publicité)\b/.test(t)) return "Marketing / Comm";
  if (/\b(commercial|sales|vente|business dev|account|customer|client|key account)\b/.test(t)) return "Commercial / Sales";
  if (/\b(op[eé]ration|supply|logistique|production|qualité|lean|project manager|chef de projet|programme)\b/.test(t)) return "Opérations / PM";
  if (/\b(juridique|legal|compliance|droit|avocat|notaire)\b/.test(t)) return "Juridique";
  if (/\b(consultant|conseil|consulting|strategy|stratégie|advisory)\b/.test(t)) return "Conseil / Strat.";
  return "Autre";
}

// Inner function — no auth, cacheable per company ID
// Uses admin client so cookies() is never called inside unstable_cache scope
async function fetchAnalyticsForCompany(companyId: string) {
  const supabase = createAdminClient();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString();

    const [reviewsRes, viewsRes, totalViewsRes, favsRes] = await Promise.all([
      supabase
        .from("reviews")
        .select("rating_overall, rating_culture, rating_management, rating_worklife, rating_career, would_recommend, salary_chf, employment_type, work_mode, pros, cons, created_at, job_title, is_current")
        .eq("company_id", companyId)
        .order("created_at", { ascending: true })
        .limit(5000),
      // 30d only — enough for trend chart + week/today stats; avoids loading months of rows
      supabase
        .from("company_views")
        .select("viewed_at")
        .eq("company_id", companyId)
        .gte("viewed_at", thirtyDaysAgo),
      supabase
        .from("company_views")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId)
        .gte("viewed_at", ninetyDaysAgo),
      supabase
        .from("favorites")
        .select("created_at", { count: "exact" })
        .eq("company_id", companyId),
    ]);

    const { data: reviews } = reviewsRes;

    const r = reviews ?? [];
    const count = r.length;

    const avg = (key: keyof typeof r[0]) => {
      const vals = r.map(x => Number(x[key])).filter(v => v > 0);
      return vals.length > 0 ? (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1) : "–";
    };

    const withRecommend = r.filter(x => x.would_recommend);
    const recommendRate = withRecommend.length > 0
      ? Math.round((withRecommend.filter(x => x.would_recommend === "oui").length / withRecommend.length) * 100)
      : null;

    const salaries = r.filter(x => x.salary_chf && Number(x.salary_chf) > 0).map(x => Number(x.salary_chf));
    const avgSalary = salaries.length > 0 ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length) : null;

    // Trend: rating by month (last 12 months) — fill every month so chart has no gaps
    const monthlyMap: Record<string, number[]> = {};
    r.forEach(rev => {
      const month = rev.created_at?.slice(0, 7);
      if (!month) return;
      if (!monthlyMap[month]) monthlyMap[month] = [];
      monthlyMap[month].push(Number(rev.rating_overall));
    });
    const trend: { month: string; avg: number | null }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const month = d.toISOString().slice(0, 7);
      const ratings = monthlyMap[month];
      trend.push({
        month,
        avg: ratings ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)) : null,
      });
    }

    // Rating distribution
    const dist = [1, 2, 3, 4, 5].map(n => ({
      star: n,
      count: r.filter(x => Math.round(Number(x.rating_overall)) === n).length,
    }));

    // Work mode
    const workModes: Record<string, number> = {};
    r.forEach(x => { if (x.work_mode) workModes[x.work_mode] = (workModes[x.work_mode] || 0) + 1; });

    // Employment types
    const empTypes: Record<string, number> = {};
    r.forEach(x => { if (x.employment_type) empTypes[x.employment_type] = (empTypes[x.employment_type] || 0) + 1; });

    // ── Reviewer profiles (from job_title) ──────────────────────────────────
    const seniority: Record<string, number> = {};
    const functions: Record<string, number> = {};
    const currentVsFormer = { current: 0, former: 0 };
    r.forEach(x => {
      if (x.job_title) {
        const s = detectSeniority(x.job_title);
        seniority[s] = (seniority[s] || 0) + 1;
        const f = detectFunction(x.job_title);
        functions[f] = (functions[f] || 0) + 1;
      }
      if (x.is_current) currentVsFormer.current++;
      else currentVsFormer.former++;
    });

    // ── Page view stats ──────────────────────────────────────────────────────
    const favoritesCount = favsRes.count ?? 0;
    const views = viewsRes.data ?? []; // last 30 days
    const now = Date.now();
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const weekAgo = now - 7 * 86400000;

    const viewsToday = views.filter(v => v.viewed_at && new Date(v.viewed_at) >= todayStart).length;
    const viewsWeek  = views.filter(v => v.viewed_at && new Date(v.viewed_at).getTime() >= weekAgo).length;
    const viewsMonth = views.length; // all 30d rows
    const viewsTotal = totalViewsRes.count ?? 0; // 90d count from HEAD query

    // Daily view trend — last 30 days (all rows already cover exactly 30d)
    const dailyViewMap: Record<string, number> = {};
    views.forEach(v => {
      const day = (v.viewed_at ?? "").slice(0, 10);
      dailyViewMap[day] = (dailyViewMap[day] || 0) + 1;
    });
    // Fill in all 30 days (even zeros)
    const viewTrend: { day: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * 86400000).toISOString().slice(0, 10);
      viewTrend.push({ day: d, count: dailyViewMap[d] ?? 0 });
    }

    return {
      count,
      avgOverall: avg("rating_overall"),
      avgManagement: avg("rating_management"),
      avgWorklife: avg("rating_worklife"),
      avgCulture: avg("rating_culture"),
      avgCareer: avg("rating_career"),
      recommendRate,
      avgSalary,
      trend,
      dist,
      workModes,
      empTypes,
      seniority,
      functions,
      currentVsFormer,
      viewsToday,
      viewsWeek,
      viewsMonth,
      viewsTotal,
      viewTrend,
      favoritesCount,
    };
}

const getCachedAnalytics = unstable_cache(
  fetchAnalyticsForCompany,
  ["business-analytics"],
  { revalidate: 30, tags: ["business-analytics"] }
);

export async function getBusinessAnalytics() {
  try {
    const { company } = await requireBusiness();
    const data = await getCachedAnalytics(company.id);
    return { ...data, company };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function getBusinessJobs() {
  try {
    const { supabase, company } = await requireBusiness();
    const { data } = await supabase
      .from("job_offers")
      .select("*, apply_click_count, view_count")
      .eq("company_id", company.id)
      .order("created_at", { ascending: false });
    return { jobs: data ?? [], company };
  } catch (e) {
    return { jobs: [], error: (e as Error).message };
  }
}

export async function getJobCantonStats(jobId: string): Promise<{ canton: string; count: number }[]> {
  try {
    const { supabase, company } = await requireBusiness();
    const { data } = await supabase
      .from("job_apply_clicks")
      .select("viewer_canton")
      .eq("job_id", jobId)
      .eq("company_id", company.id);
    if (!data) return [];
    const map: Record<string, number> = {};
    for (const row of data) {
      const canton = row.viewer_canton ?? "–";
      map[canton] = (map[canton] ?? 0) + 1;
    }
    return Object.entries(map)
      .map(([canton, count]) => ({ canton, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  } catch {
    return [];
  }
}

export async function trackJobApplyClick(jobId: string, companyId: string): Promise<void> {
  try {
    const hdrs = await headers();
    const canton = hdrs.get("x-vercel-ip-country-region") ?? null;
    const supabase = await createClient();
    await Promise.all([
      supabase.from("job_apply_clicks").insert({ job_id: jobId, company_id: companyId, viewer_canton: canton }),
      supabase.rpc("increment_job_apply_click", { job_id: jobId }),
    ]);
  } catch { /* silent */ }
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function updateBusinessProfile(_: unknown, formData: FormData): Promise<{ error?: string; success?: boolean }> {
  try {
    const { supabase, company } = await requireBusiness();

    const safeUrl = (raw: string | null) => {
      if (!raw) return null;
      try {
        const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
        if (u.protocol !== "https:" && u.protocol !== "http:") return null;
        return u.href;
      } catch { return null; }
    };

    const fields: {
      description: string | null;
      website_url: string | null;
      linkedin_url: string | null;
      twitter_url: string | null;
      instagram_url: string | null;
      logo_url?: string | null;
      cover_url?: string;
    } = {
      description: String(formData.get("description") || "") || null,
      website_url: safeUrl(String(formData.get("website_url") || "") || null),
      linkedin_url: safeUrl(String(formData.get("linkedin_url") || "") || null),
      twitter_url: safeUrl(String(formData.get("twitter_url") || "") || null),
      instagram_url: safeUrl(String(formData.get("instagram_url") || "") || null),
    };

    const ALLOWED_IMG = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const EXT_MAP: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
    const MAX_IMG = 10 * 1024 * 1024;

    // Logo upload
    const logoFile = formData.get("logo_file");
    if (logoFile instanceof File && logoFile.size > 0) {
      if (!ALLOWED_IMG.includes(logoFile.type)) return { error: "Format logo non supporté (JPG, PNG, WebP, GIF)." };
      if (logoFile.size > MAX_IMG) return { error: "Logo trop lourd (max 10 MB)." };
      const ext = EXT_MAP[logoFile.type] ?? "jpg";
      const path = `logos/${company.id}.${ext}`;
      const { error: upErr } = await supabase.storage.from("covers").upload(path, logoFile, { contentType: logoFile.type, upsert: true });
      if (!upErr) {
        const { data: pub } = supabase.storage.from("covers").getPublicUrl(path);
        fields.logo_url = pub.publicUrl;
      }
    } else {
      // Keep existing logo from DB — never trust a hidden input from the client
      fields.logo_url = company.logo_url ?? null;
    }

    // Cover upload
    const coverFile = formData.get("cover_file");
    if (coverFile instanceof File && coverFile.size > 0) {
      if (!ALLOWED_IMG.includes(coverFile.type)) return { error: "Format cover non supporté (JPG, PNG, WebP, GIF)." };
      if (coverFile.size > MAX_IMG) return { error: "Cover trop lourde (max 10 MB)." };
      const ext = EXT_MAP[coverFile.type] ?? "jpg";
      const path = `covers/${company.id}/business.${ext}`;
      const { error: upErr } = await supabase.storage.from("covers").upload(path, coverFile, { contentType: coverFile.type, upsert: true });
      if (!upErr) {
        const { data: pub } = supabase.storage.from("covers").getPublicUrl(path);
        fields.cover_url = pub.publicUrl;
      }
    }

    const { error } = await supabase.from("companies").update(fields).eq("id", company.id);
    if (error) return { error: error.message };

    revalidatePath("/business/dashboard/profile");
    revalidatePath(`/company/${company.id}`);
    return { success: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function replyToReview(_: unknown, formData: FormData): Promise<{ error?: string; success?: boolean }> {
  try {
    const { supabase, company } = await requireBusiness();
    const review_id = String(formData.get("review_id") || "");
    if (!review_id) return { error: "Avis introuvable." };
    const content = String(formData.get("content") || "").trim();
    if (!content || content.length < 10) return { error: "Réponse trop courte (min 10 caractères)." };

    // Verify the review belongs to this company and get its author
    const { data: review } = await supabase.from("reviews").select("id, user_id").eq("id", review_id).eq("company_id", company.id).maybeSingle();
    if (!review) return { error: "Avis introuvable ou accès refusé." };

    // Upsert reply
    const { error } = await supabase.from("company_replies").upsert(
      { review_id, company_id: company.id, content, updated_at: new Date().toISOString() },
      { onConflict: "review_id" }
    );
    if (error) return { error: error.message };

    // Notify the review author (fire-and-forget — never blocks the response)
    if (review.user_id) {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const admin = createAdminClient();
      void admin.from("notifications").insert({
        user_id: review.user_id,
        type: "review_reply",
        title: `${company.name} a répondu à ton avis`,
        body: content.slice(0, 120) + (content.length > 120 ? "…" : ""),
        data: { company_id: company.id, review_id, company_name: company.name },
        read: false,
      });
    }

    revalidatePath("/business/dashboard/reviews");
    revalidatePath(`/company/${company.id}`);
    return { success: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function createJobOffer(_: unknown, formData: FormData): Promise<{ error?: string; success?: boolean }> {
  try {
    const { supabase, company } = await requireBusiness();

    const title = String(formData.get("title") || "").trim();
    if (!title) return { error: "Le titre du poste est obligatoire." };

    const rawApplyUrl = String(formData.get("apply_url") || "").trim();
    // Auto-prefix https:// if missing
    const apply_url = rawApplyUrl
      ? /^https?:\/\//i.test(rawApplyUrl) ? rawApplyUrl : `https://${rawApplyUrl}`
      : null;

    const { data: inserted, error } = await supabase.from("job_offers").insert({
      company_id: company.id,
      title,
      description:       String(formData.get("description") || "") || null,
      requirements:      String(formData.get("requirements") || "") || null,
      location:          String(formData.get("location") || "") || null,
      work_mode:         String(formData.get("work_mode") || "") || null,
      contract_type:     String(formData.get("contract_type") || "") || null,
      experience_level:  String(formData.get("experience_level") || "") || null,
      salary_range:      String(formData.get("salary_range") || "") || null,
      apply_url,
      is_active: true,
    }).select("id").single();
    if (error || !inserted) return { error: error?.message ?? "Erreur lors de la création de l'offre" };

    // Fan-out: notify users who favorited this company (fire-and-forget with error logging)
    notifyFavoriteUsers(company.id, company.name, title, inserted.id).catch((e: unknown) =>
      console.error("[createJobOffer] notifyFavoriteUsers failed:", e)
    );

    revalidatePath("/business/dashboard/jobs");
    revalidatePath("/jobs");
    return { success: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function updateJobOffer(id: string, formData: FormData): Promise<{ error?: string; success?: boolean }> {
  try {
    const { supabase, company } = await requireBusiness();

    const title = String(formData.get("title") || "").trim();
    if (!title) return { error: "Le titre du poste est obligatoire." };

    const rawApplyUrl = String(formData.get("apply_url") || "").trim();
    const apply_url = rawApplyUrl
      ? /^https?:\/\//i.test(rawApplyUrl) ? rawApplyUrl : `https://${rawApplyUrl}`
      : null;

    const { error } = await supabase.from("job_offers").update({
      title,
      description:      String(formData.get("description") || "") || null,
      requirements:     String(formData.get("requirements") || "") || null,
      location:         String(formData.get("location") || "") || null,
      work_mode:        String(formData.get("work_mode") || "") || null,
      contract_type:    String(formData.get("contract_type") || "") || null,
      experience_level: String(formData.get("experience_level") || "") || null,
      salary_range:     String(formData.get("salary_range") || "") || null,
      apply_url,
    }).eq("id", id).eq("company_id", company.id);

    if (error) return { error: error.message };
    revalidatePath("/business/dashboard/jobs");
    revalidatePath("/jobs");
    return { success: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function toggleJobOffer(id: string, is_active: boolean): Promise<{ error?: string }> {
  try {
    const { supabase, company } = await requireBusiness();
    const { error } = await supabase.from("job_offers").update({ is_active }).eq("id", id).eq("company_id", company.id);
    if (error) return { error: error.message };
    revalidatePath("/business/dashboard/jobs");
    revalidatePath("/jobs");
    return {};
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function trackCompanyView(companyId: string): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("company_views").insert({ company_id: companyId, user_id: user?.id ?? null });
  } catch { /* silent */ }
}

export async function deleteJobOffer(id: string): Promise<{ error?: string }> {
  try {
    const { supabase, company } = await requireBusiness();
    const { error } = await supabase.from("job_offers").delete().eq("id", id).eq("company_id", company.id);
    if (error) return { error: error.message };
    revalidatePath("/business/dashboard/jobs");
    revalidatePath("/jobs");
    return {};
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function submitClaim(_: unknown, formData: FormData): Promise<{ error?: string; success?: boolean }> {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const existingUser = await getUser();

    const work_email = String(formData.get("work_email") || "").trim().toLowerCase();
    const password   = String(formData.get("password") || "").trim();
    const rawZefixUrl = String(formData.get("zefix_url") || "").trim();
    const zefix_url = rawZefixUrl
      ? /^https?:\/\//i.test(rawZefixUrl) ? rawZefixUrl : `https://${rawZefixUrl}`
      : null;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(work_email)) return { error: "Adresse email invalide." };
    const banned = ["@gmail.com", "@hotmail.com", "@yahoo.com", "@outlook.com", "@icloud.com"];
    if (banned.some(d => work_email.endsWith(d))) {
      return { error: "Utilise ton email professionnel (domaine de l'entreprise)." };
    }
    if (!existingUser && password.length < 8) {
      return { error: "Le mot de passe doit contenir au moins 8 caractères." };
    }

    const rawCompanyId = String(formData.get("company_id") || "").trim();
    const companyName  = String(formData.get("company_name") || "").trim();

    // ── 1. Find or create the company ──────────────────────────────────────────
    let companyId: string | null = rawCompanyId || null;

    if (!companyId) {
      // Register flow — create a new company
      const rawWebsite = String(formData.get("company_website") || "").trim();
      const website = rawWebsite
        ? /^https?:\/\//i.test(rawWebsite) ? rawWebsite : `https://${rawWebsite}`
        : null;
      const { data: newCo, error: coErr } = await adminClient
        .from("companies")
        .insert({
          name: companyName,
          sector: String(formData.get("sector") || "Conseil"),
          city:   String(formData.get("city") || "Suisse"),
          canton: String(formData.get("canton") || "") || null,
          website_url: website,
          employee_range: String(formData.get("employee_range") || "11-50"),
          avg_rating: 0, review_count: 0, score: 0,
          is_verified: false,
        })
        .select("id")
        .maybeSingle();
      if (coErr || !newCo) return { error: `Erreur lors de la création de la fiche : ${coErr?.message ?? "inconnue"}` };
      companyId = newCo.id;
    } else {
      // Claim flow — check company isn't already owned
      const { data: owner } = await adminClient
        .from("profiles")
        .select("id")
        .eq("claimed_company_id", companyId)
        .maybeSingle();
      if (owner) return { error: "Cette entreprise est déjà gérée par un autre utilisateur sur Workie. Contactez-nous si vous pensez qu'il y a une erreur." };
    }

    // ── 2. Create / retrieve the Supabase user ─────────────────────────────────
    let userId: string;

    if (existingUser && existingUser.email?.toLowerCase() === work_email) {
      // Same email already logged in — reuse this account
      userId = existingUser.id;
    } else {
      if (password.length < 8) {
        return { error: "Le mot de passe doit contenir au moins 8 caractères." };
      }

      // Attempt creation — the admin API returns a clear error if email already exists
      // (avoids listUsers which is capped at 1000 users)
      const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
        email: work_email,
        password,
        email_confirm: true,
      });
      if (createErr) {
        const msg = createErr.message.toLowerCase();
        if (msg.includes("already") || msg.includes("registered") || (createErr as { status?: number }).status === 422) {
          return { error: "Un compte Workie existe déjà avec cet email. Connectez-vous d'abord via « Déjà un compte »." };
        }
        return { error: `Impossible de créer votre compte : ${createErr.message}` };
      }
      if (!created.user) return { error: "Impossible de créer votre compte : erreur inconnue" };
      userId = created.user.id;

      // Sign in as the NEW user — replaces any existing session in this browser
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email: work_email, password });
      if (signInErr) {
        // Non-fatal: account was created, claim will be reviewed by admin.
        // User can log in manually via /business/login.
        console.error("[submitClaim] auto sign-in failed:", signInErr.message);
      }
    }

    // ── 3. Link profile to company ─────────────────────────────────────────────
    // Only set username if profile doesn't already exist (never overwrite existing username)
    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("id, username")
      .eq("id", userId)
      .maybeSingle();
    const emailBase = work_email.split("@")[0].replace(/[^a-z0-9_]/gi, "_").toLowerCase();
    const username  = existingProfile?.username ?? `${emailBase}_${userId.slice(0, 6)}`;
    const { error: upsertErr } = await adminClient.from("profiles").upsert(
      {
        id: userId,
        username,
        claimed_company_id: companyId,
        full_name: `${String(formData.get("first_name") || "")} ${String(formData.get("last_name") || "")}`.trim() || null,
      },
      { onConflict: "id", ignoreDuplicates: false }
    );
    if (upsertErr) return { error: `Erreur lors de la création du profil : ${upsertErr.message}` };

    // ── 4. Insert claim record for admin audit ─────────────────────────────────
    const { error: claimInsertErr } = await adminClient.from("company_claims").insert({
      company_name: companyName,
      company_id:   companyId,
      company_website: String(formData.get("company_website") || "") || null,
      employee_range:  String(formData.get("employee_range") || "") || null,
      first_name: String(formData.get("first_name") || ""),
      last_name:  String(formData.get("last_name") || ""),
      job_title:  String(formData.get("job_title") || ""),
      job_level:  String(formData.get("job_level") || ""),
      work_email,
      zefix_url,
      message: String(formData.get("message") || "") || null,
      user_id: userId,
      status: "pending",
    });
    if (claimInsertErr) return { error: `Erreur lors de l'enregistrement de la demande : ${claimInsertErr.message}` };

    return { success: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
