"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/server";
import { notifyFavoriteUsers } from "@/lib/actions/notifications";
import { headers } from "next/headers";

// ── Helpers ──────────────────────────────────────────────────────────────────

async function requireBusiness() {
  const [user, supabase] = await Promise.all([getUser(), createClient()]);
  if (!user) throw new Error("Non authentifié");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, claimed_company_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.claimed_company_id) throw new Error("Aucune entreprise liée");

  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", profile.claimed_company_id)
    .maybeSingle();

  if (!company) throw new Error("Entreprise introuvable");

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

export async function getBusinessAnalytics() {
  try {
    const { supabase, company } = await requireBusiness();

    const [reviewsRes, viewsRes, favsRes] = await Promise.all([
      supabase
        .from("reviews")
        .select("rating_overall, rating_culture, rating_management, rating_worklife, rating_career, would_recommend, salary_chf, employment_type, work_mode, pros, cons, created_at, job_title, is_current")
        .eq("company_id", company.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("company_views")
        .select("viewed_at")
        .eq("company_id", company.id)
        .gte("viewed_at", new Date(Date.now() - 90 * 86400000).toISOString()),
      supabase
        .from("favorites")
        .select("created_at", { count: "exact" })
        .eq("company_id", company.id),
    ]);

    const { data: reviews } = reviewsRes;

    const r = reviews ?? [];
    const count = r.length;

    const avg = (key: keyof typeof r[0]) => {
      const vals = r.map(x => Number(x[key])).filter(v => v > 0);
      return vals.length > 0 ? (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1) : "–";
    };

    const recommendRate = count > 0
      ? Math.round((r.filter(x => x.would_recommend === "oui").length / count) * 100)
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
    const views = viewsRes.data ?? [];
    const now = Date.now();
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const weekAgo = now - 7 * 86400000;
    const monthAgo = now - 30 * 86400000;

    const viewsToday   = views.filter(v => v.viewed_at && new Date(v.viewed_at) >= todayStart).length;
    const viewsWeek    = views.filter(v => v.viewed_at && new Date(v.viewed_at).getTime() >= weekAgo).length;
    const viewsMonth   = views.filter(v => v.viewed_at && new Date(v.viewed_at).getTime() >= monthAgo).length;
    const viewsTotal   = views.length; // window: last 90 days (matches the DB query above)

    // Daily view trend — last 30 days
    const dailyViewMap: Record<string, number> = {};
    views.filter(v => v.viewed_at && new Date(v.viewed_at).getTime() >= monthAgo).forEach(v => {
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
      company,
    };
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
      website_url: String(formData.get("website_url") || "") || null,
      linkedin_url: String(formData.get("linkedin_url") || "") || null,
      twitter_url: String(formData.get("twitter_url") || "") || null,
      instagram_url: String(formData.get("instagram_url") || "") || null,
    };

    // Logo upload
    const logoFile = formData.get("logo_file");
    if (logoFile instanceof File && logoFile.size > 0) {
      const ext = logoFile.name.split(".").pop() || "jpg";
      const path = `logos/${company.id}.${ext}`;
      const { error: upErr } = await supabase.storage.from("covers").upload(path, logoFile, { contentType: logoFile.type, upsert: true });
      if (!upErr) {
        const { data: pub } = supabase.storage.from("covers").getPublicUrl(path);
        fields.logo_url = pub.publicUrl;
      }
    } else {
      fields.logo_url = String(formData.get("logo_url") || "") || null;
    }

    // Cover upload
    const coverFile = formData.get("cover_file");
    if (coverFile instanceof File && coverFile.size > 0) {
      const ext = coverFile.name.split(".").pop() || "jpg";
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

    // Verify the review belongs to this company
    const { data: review } = await supabase.from("reviews").select("id").eq("id", review_id).eq("company_id", company.id).maybeSingle();
    if (!review) return { error: "Avis introuvable ou accès refusé." };

    // Upsert reply
    const { error } = await supabase.from("company_replies").upsert(
      { review_id, company_id: company.id, content, updated_at: new Date().toISOString() },
      { onConflict: "review_id" }
    );
    if (error) return { error: error.message };

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
    if (error) return { error: error.message };

    // Fan-out: notify users who favorited this company
    notifyFavoriteUsers(company.id, company.name, title, inserted.id);

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
    const user = await getUser();

    const work_email = String(formData.get("work_email") || "").trim().toLowerCase();
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

    const rawCompanyId = String(formData.get("company_id") || "").trim();
    const companyName  = String(formData.get("company_name") || "").trim();

    // Prevent duplicate claims: match by email+company_id when known, else email+company_name
    const dupBase = supabase.from("company_claims").select("id").eq("work_email", work_email);
    const dupQuery = rawCompanyId
      ? dupBase.eq("company_id", rawCompanyId)
      : dupBase.ilike("company_name", companyName);
    const { data: existing } = await dupQuery.maybeSingle();
    if (existing) return { error: "Une demande a déjà été soumise pour cet email et cette entreprise. Notre équipe reviendra vers vous sous 48h ouvrées." };

    const { error } = await supabase.from("company_claims").insert({
      company_name: companyName,
      company_id: rawCompanyId || null,
      company_website: String(formData.get("company_website") || "") || null,
      employee_range: String(formData.get("employee_range") || "") || null,
      first_name: String(formData.get("first_name") || ""),
      last_name: String(formData.get("last_name") || ""),
      job_title: String(formData.get("job_title") || ""),
      job_level: String(formData.get("job_level") || ""),
      work_email,
      zefix_url,
      message: String(formData.get("message") || "") || null,
      user_id: user?.id ?? null,
    });

    if (error) return { error: error.message };
    return { success: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
