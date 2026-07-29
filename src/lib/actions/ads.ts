"use server";

import { revalidatePath, unstable_cache } from "next/cache";
import { randomUUID } from "crypto";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateCPM } from "@/lib/ads/pricing";
import type { AdFormat } from "@/lib/ads/pricing";
import { captureServerError } from "@/lib/monitoring";

async function getViewerGeo(): Promise<{ canton: string | null; city: string | null }> {
  try {
    const h = await headers();
    // Vercel injects these automatically on all deployments
    const region = h.get("x-vercel-ip-country-region"); // e.g. "GE", "VD", "ZH"
    const city   = h.get("x-vercel-ip-city");           // e.g. "Geneva"
    return { canton: region ?? null, city: city ?? null };
  } catch { return { canton: null, city: null }; }
}

/** Returns the viewer's canton via IP geolocation (Vercel header). */
export async function getViewerCanton(): Promise<string | null> {
  const geo = await getViewerGeo();
  return geo.canton;
}

export type AdCampaign = {
  id: string;
  company_id: string | null;
  user_id?: string | null;
  format: AdFormat;
  image_url: string;
  headline: string;
  body_text: string | null;
  cta_label: string;
  cta_url: string;
  target_cantons: string[];
  target_sectors: string[];
  daily_budget_chf: number;
  total_budget_chf: number;
  spent_chf: number;
  cpm_chf: number;
  start_date: string;
  end_date: string | null;
  status: "payment_pending" | "pending" | "active" | "paused" | "completed" | "rejected";
  admin_note: string | null;
  impression_count: number;
  click_count: number;

  stripe_session_id: string | null;
  paid_at: string | null;
  created_at: string;
};

/** Fields returned by getActiveAds() — financial fields are stripped server-side */
export type PublicAdCampaign = Omit<AdCampaign, "spent_chf" | "total_budget_chf" | "daily_budget_chf" | "cpm_chf">;

async function requireBusiness() {
  const [user, supabase] = await Promise.all([getUser(), createClient()]);
  if (!user) throw new Error("Non authentifié");
  const { data: profile } = await supabase.from("profiles").select("claimed_company_id").eq("id", user.id).maybeSingle();
  if (!profile?.claimed_company_id) throw new Error("Aucune entreprise liée");
  return { user, supabase, companyId: profile.claimed_company_id as string };
}

async function requireUser() {
  const [user, supabase] = await Promise.all([getUser(), createClient()]);
  if (!user) throw new Error("Non authentifié");
  return { user, supabase };
}

async function requireAdmin() {
  const [user, supabase] = await Promise.all([getUser(), createClient()]);
  if (!user) throw new Error("Non authentifié");
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (data?.role !== "admin") throw new Error("Accès refusé");
  return { user };
}

// ── Getters ────────────────────────────────────────────────────────────────────

export async function getBusinessCampaigns(): Promise<{ campaigns?: AdCampaign[]; error?: string }> {
  try {
    const { supabase, companyId } = await requireBusiness();
    const { data, error } = await supabase
      .from("ad_campaigns")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });
    if (error) return { error: error.message };
    return { campaigns: (data ?? []) as unknown as AdCampaign[] };
  } catch (e) { return { error: (e as Error).message }; }
}

export async function getUserCampaigns(): Promise<{ campaigns?: AdCampaign[]; error?: string }> {
  try {
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase
      .from("ad_campaigns")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) return { error: error.message };
    return { campaigns: (data ?? []) as unknown as AdCampaign[] };
  } catch (e) { return { error: (e as Error).message }; }
}

export async function getUserCampaignDailyStats(campaignId: string): Promise<{ day: string; impressions: number; clicks: number }[]> {
  try {
    const { supabase, user } = await requireUser();
    // Ownership check: ensure this campaign belongs to the calling user
    const { data: owned } = await supabase.from("ad_campaigns").select("id").eq("id", campaignId).eq("user_id", user.id).maybeSingle();
    if (!owned) return [];
    const { data } = await supabase.rpc("get_campaign_daily_stats", { p_campaign_id: campaignId });
    return (data ?? []).map((r: { day: string; impressions: number; clicks: number }) => ({
      day: r.day,
      impressions: Number(r.impressions),
      clicks: Number(r.clicks),
    }));
  } catch { return []; }
}

export async function getUserCampaignCantonStats(campaignId: string): Promise<{ canton: string; impressions: number; clicks: number }[]> {
  try {
    const { supabase, user } = await requireUser();
    const { data: owned } = await supabase.from("ad_campaigns").select("id").eq("id", campaignId).eq("user_id", user.id).maybeSingle();
    if (!owned) return [];
    const { data } = await supabase.rpc("get_campaign_canton_stats", { p_campaign_id: campaignId });
    return (data ?? []).map((r: { canton: string; impressions: number; clicks: number }) => ({
      canton: r.canton,
      impressions: Number(r.impressions),
      clicks: Number(r.clicks),
    }));
  } catch { return []; }
}

export async function createUserCampaign(
  _: unknown,
  formData: FormData,
): Promise<{ error?: string; campaignId?: string }> {
  try {
    const { supabase, user } = await requireUser();

    const format = String(formData.get("format") || "") as AdFormat;
    if (!["square", "swipe"].includes(format)) return { error: "Format invalide." };

    const headline = String(formData.get("headline") || "").trim();
    if (!headline) return { error: "Le titre est requis." };

    const rawCta = String(formData.get("cta_url") || "").trim();
    if (!rawCta) return { error: "L'URL de destination est requise." };
    const cta_url = /^https?:\/\//i.test(rawCta) ? rawCta : `https://${rawCta}`;

    const daily_budget_chf = Number(formData.get("daily_budget_chf") || 0);
    if (daily_budget_chf < 5) return { error: "Budget journalier minimum : CHF 5." };

    const total_budget_chf = Number(formData.get("total_budget_chf") || 0);
    if (total_budget_chf < daily_budget_chf) return { error: "Budget total doit être ≥ budget journalier." };

    let target_cantons: string[] = [];
    let target_sectors: string[] = [];
    try { target_cantons = JSON.parse(String(formData.get("target_cantons") || "[]")); } catch { target_cantons = []; }
    try { target_sectors = JSON.parse(String(formData.get("target_sectors") || "[]")); } catch { target_sectors = []; }
    const start_date = String(formData.get("start_date") || new Date().toISOString().slice(0, 10));
    const end_date = String(formData.get("end_date") || "") || null;
    if (end_date && end_date <= start_date) return { error: "La date de fin doit être après la date de début." };
    const cpm_chf = calculateCPM(format, target_cantons, target_sectors);

    let image_url = String(formData.get("image_url") || "").trim();
    const imageFile = formData.get("image_file");
    if (imageFile instanceof File && imageFile.size > 0) {
      const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      const MAX_BYTES = 10 * 1024 * 1024;
      if (!ALLOWED_TYPES.includes(imageFile.type)) return { error: "Format non supporté. Utilisez JPG, PNG, WebP ou GIF." };
      if (imageFile.size > MAX_BYTES) return { error: "Image trop lourde (max 10 MB)." };
      const EXT_MAP: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
      const ext = EXT_MAP[imageFile.type] ?? "jpg";
      const path = `ads/user_${user.id}/${randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("covers").upload(path, imageFile, { contentType: imageFile.type, upsert: false });
      if (!upErr) {
        const { data: pub } = supabase.storage.from("covers").getPublicUrl(path);
        image_url = pub.publicUrl;
      }
    }
    if (!image_url) return { error: "Une image est requise (upload ou URL)." };

    const { data: inserted, error } = await supabase.from("ad_campaigns").insert({
      user_id: user.id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      company_id: null as any,
      format,
      image_url,
      headline,
      body_text: String(formData.get("body_text") || "") || null,
      cta_label: String(formData.get("cta_label") || "En savoir plus").trim() || "En savoir plus",
      cta_url,
      target_cantons,
      target_sectors,
      daily_budget_chf,
      total_budget_chf,
      cpm_chf,
      start_date,
      end_date,
      status: "payment_pending",
    }).select("id").single();

    if (error || !inserted) return { error: error?.message ?? "Erreur lors de la création de la campagne" };
    revalidatePath("/profile/ads");
    return { campaignId: inserted.id };
  } catch (e) { return { error: (e as Error).message }; }
}

export async function getAdminCampaigns(): Promise<{
  campaigns?: (AdCampaign & { company_name: string; company_logo: string | null })[]; error?: string;
}> {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("ad_campaigns")
      .select("*, companies(name, logo_url), profiles(full_name, username)")
      .order("created_at", { ascending: false });
    if (error) return { error: error.message };
    return {
      campaigns: (data ?? []).map((c: any) => ({
        ...c,
        company_name: c.companies?.name ?? c.profiles?.full_name ?? c.profiles?.username ?? "Profil utilisateur",
        company_logo: c.companies?.logo_url ?? null,
      })),
    };
  } catch (e) { return { error: (e as Error).message }; }
}

// Cached raw ad pool — uses adminClient (no cookies), shared across all requests.
// Financial fields stripped in getActiveAds() after cache hit.
const _getAdPoolCached = unstable_cache(
  async (format: AdFormat | undefined, today: string): Promise<AdCampaign[]> => {
    const admin = createAdminClient();
    let q = admin
      .from("ad_campaigns")
      .select("id, company_id, user_id, format, headline, body_text, image_url, cta_label, cta_url, target_cantons, target_sectors, status, start_date, end_date, impression_count, click_count, created_at, spent_chf, total_budget_chf")
      .eq("status", "active")
      .lte("start_date", today)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .order("spent_chf", { ascending: true });
    if (format) q = (q as typeof q).eq("format", format);
    const { data } = await (q as typeof q).limit(50);
    return (data ?? []) as unknown as AdCampaign[];
  },
  ["active-ads"],
  { revalidate: 30, tags: ["ad-campaigns"] }
);

export async function getActiveAds(opts?: {
  format?: AdFormat;
  canton?: string;
  sector?: string;
  limit?: number;
}): Promise<PublicAdCampaign[]> {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const rawPool = await _getAdPoolCached(opts?.format, today);

    const pool = rawPool.filter(ad => {
      if (ad.end_date && ad.end_date < today) return false;
      if (Number(ad.spent_chf) >= Number(ad.total_budget_chf)) return false;
      if (opts?.canton && ad.target_cantons.length > 0 && !ad.target_cantons.includes(opts.canton)) return false;
      if (opts?.sector && ad.target_sectors.length > 0 && !ad.target_sectors.includes(opts.sector)) return false;
      return true;
    });

    // Fisher-Yates shuffle for fair rotation (each caller gets a different order)
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    return pool.slice(0, opts?.limit ?? 10).map(({ spent_chf: _s, total_budget_chf: _t, daily_budget_chf: _d, cpm_chf: _c, ...rest }) => rest as PublicAdCampaign);
  } catch (e) { captureServerError(e, { action: "getActiveAds" }); return []; }
}

export async function getCampaignDailyStats(campaignId: string): Promise<{ day: string; impressions: number; clicks: number }[]> {
  try {
    const { supabase, companyId } = await requireBusiness();
    // Ownership check: ensure this campaign belongs to the calling business
    const { data: owned } = await supabase.from("ad_campaigns").select("id").eq("id", campaignId).eq("company_id", companyId).maybeSingle();
    if (!owned) return [];
    const { data } = await supabase.rpc("get_campaign_daily_stats", { p_campaign_id: campaignId });
    return (data ?? []).map((r: { day: string; impressions: number; clicks: number }) => ({
      day: r.day,
      impressions: Number(r.impressions),
      clicks: Number(r.clicks),
    }));
  } catch (e) { captureServerError(e, { action: "getCampaignDailyStats" }); return []; }
}

export async function getUserCampaignById(id: string): Promise<AdCampaign | null> {
  try {
    const { supabase, user } = await requireUser();
    const { data } = await supabase
      .from("ad_campaigns")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    return (data as unknown as AdCampaign) ?? null;
  } catch { return null; }
}

export async function getBusinessCampaignById(id: string): Promise<AdCampaign | null> {
  try {
    const { supabase, companyId } = await requireBusiness();
    const { data } = await supabase
      .from("ad_campaigns")
      .select("*")
      .eq("id", id)
      .eq("company_id", companyId)
      .maybeSingle();
    return (data as unknown as AdCampaign) ?? null;
  } catch { return null; }
}

export async function pauseUserCampaign(id: string): Promise<{ error?: string }> {
  try {
    const { supabase, user } = await requireUser();
    const { error } = await supabase
      .from("ad_campaigns")
      .update({ status: "paused" })
      .eq("id", id)
      .eq("user_id", user.id)
      .in("status", ["active", "pending"]);
    if (error) return { error: error.message };
    revalidatePath("/profile/ads");
    return {};
  } catch (e) { return { error: (e as Error).message }; }
}

export async function pauseBusinessCampaign(id: string): Promise<{ error?: string }> {
  try {
    const { supabase, companyId } = await requireBusiness();
    const { error } = await supabase
      .from("ad_campaigns")
      .update({ status: "paused" })
      .eq("id", id)
      .eq("company_id", companyId)
      .in("status", ["active", "pending"]);
    if (error) return { error: error.message };
    revalidatePath("/business/dashboard/ads");
    return {};
  } catch (e) { return { error: (e as Error).message }; }
}

// ── Mutations ──────────────────────────────────────────────────────────────────

export async function createCampaign(
  _: unknown,
  formData: FormData,
): Promise<{ error?: string; campaignId?: string }> {
  try {
    const { supabase, companyId } = await requireBusiness();

    const format = String(formData.get("format") || "") as AdFormat;
    if (!["square", "swipe"].includes(format)) return { error: "Format invalide." };

    const headline = String(formData.get("headline") || "").trim();
    if (!headline) return { error: "Le titre est requis." };

    const rawCta = String(formData.get("cta_url") || "").trim();
    if (!rawCta) return { error: "L'URL de destination est requise." };
    const cta_url = /^https?:\/\//i.test(rawCta) ? rawCta : `https://${rawCta}`;

    const daily_budget_chf = Number(formData.get("daily_budget_chf") || 0);
    if (daily_budget_chf < 5) return { error: "Budget journalier minimum : CHF 5." };

    const total_budget_chf = Number(formData.get("total_budget_chf") || 0);
    if (total_budget_chf < daily_budget_chf) return { error: "Budget total doit être ≥ budget journalier." };

    let target_cantons: string[] = [];
    let target_sectors: string[] = [];
    try { target_cantons = JSON.parse(String(formData.get("target_cantons") || "[]")); } catch { target_cantons = []; }
    try { target_sectors = JSON.parse(String(formData.get("target_sectors") || "[]")); } catch { target_sectors = []; }
    const start_date = String(formData.get("start_date") || new Date().toISOString().slice(0, 10));
    const end_date = String(formData.get("end_date") || "") || null;
    if (end_date && end_date <= start_date) return { error: "La date de fin doit être après la date de début." };
    const cpm_chf = calculateCPM(format, target_cantons, target_sectors);

    // Image: file upload or URL
    let image_url = String(formData.get("image_url") || "").trim();
    const imageFile = formData.get("image_file");
    if (imageFile instanceof File && imageFile.size > 0) {
      const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
      if (!ALLOWED_TYPES.includes(imageFile.type)) return { error: "Format non supporté. Utilisez JPG, PNG, WebP ou GIF." };
      if (imageFile.size > MAX_BYTES) return { error: "Image trop lourde (max 10 MB)." };
      const EXT_MAP: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
      const ext = EXT_MAP[imageFile.type] ?? "jpg";
      const path = `ads/${companyId}/${randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("covers").upload(path, imageFile, { contentType: imageFile.type, upsert: false });
      if (!upErr) {
        const { data: pub } = supabase.storage.from("covers").getPublicUrl(path);
        image_url = pub.publicUrl;
      }
    }
    if (!image_url) return { error: "Une image est requise (upload ou URL)." };

    const { data: inserted, error } = await supabase.from("ad_campaigns").insert({
      company_id: companyId,
      format,
      image_url,
      headline,
      body_text: String(formData.get("body_text") || "") || null,
      cta_label: String(formData.get("cta_label") || "En savoir plus").trim() || "En savoir plus",
      cta_url,
      target_cantons,
      target_sectors,
      daily_budget_chf,
      total_budget_chf,
      cpm_chf,
      start_date,
      end_date,
      status: "payment_pending",
    }).select("id").single();

    if (error || !inserted) return { error: error?.message ?? "Erreur lors de la création de la campagne" };
    revalidatePath("/business/dashboard/ads");
    return { campaignId: inserted.id };
  } catch (e) { return { error: (e as Error).message }; }
}

export async function adminSetCampaignStatus(
  campaignId: string,
  status: "active" | "paused" | "rejected",
  note?: string,
): Promise<{ error?: string }> {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    // Block activating an unpaid campaign
    if (status === "active") {
      const { data: camp } = await admin.from("ad_campaigns").select("status").eq("id", campaignId).maybeSingle();
      if (camp?.status === "payment_pending") return { error: "Cette campagne n'a pas encore été payée." };
    }
    const { error } = await admin
      .from("ad_campaigns")
      .update({ status, admin_note: note ?? null })
      .eq("id", campaignId);
    if (error) return { error: error.message };
    revalidatePath("/admin/ads");
    revalidatePath("/business/dashboard/ads");
    revalidatePath("/explore");
    return {};
  } catch (e) { return { error: (e as Error).message }; }
}

const AD_RL_WINDOW_MIN = 10;

export async function trackAdImpression(campaignId: string): Promise<void> {
  try {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

    const [supabase, geo] = await Promise.all([createClient(), getViewerGeo()]);
    const { data: { user } } = await supabase.auth.getUser();

    // DB-level rate limit: 1 impression per IP per campaign per 10 min
    if (ip) {
      const since = new Date(Date.now() - AD_RL_WINDOW_MIN * 60_000).toISOString();
      const { count } = await supabase
        .from("ad_impressions")
        .select("id", { count: "exact", head: true })
        .eq("campaign_id", campaignId)
        .eq("viewer_ip", ip)
        .gte("viewed_at", since);
      if ((count ?? 0) > 0) return;
    }

    const { error: insErr } = await supabase.from("ad_impressions").insert({
      campaign_id: campaignId,
      user_id: user?.id ?? null,
      viewer_canton: geo.canton,
      viewer_city: geo.city,
      viewer_ip: ip,
    });
    // 23505 = unique_violation (DB-level dedup for logged-in users)
    if (insErr && (insErr as { code?: string }).code !== "23505") {
      captureServerError(insErr, { action: "trackAdImpression", step: "insert", campaignId });
    }
    if (!insErr) {
      await supabase.rpc("increment_ad_impression", { p_campaign_id: campaignId });
    }
  } catch (e) { captureServerError(e, { action: "trackAdImpression" }); }
}

export async function trackAdClick(campaignId: string): Promise<void> {
  try {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

    const [supabase, geo] = await Promise.all([createClient(), getViewerGeo()]);
    const { data: { user } } = await supabase.auth.getUser();

    // DB-level rate limit: 1 click per IP per campaign per 10 min
    if (ip) {
      const since = new Date(Date.now() - AD_RL_WINDOW_MIN * 60_000).toISOString();
      const { count } = await supabase
        .from("ad_clicks")
        .select("id", { count: "exact", head: true })
        .eq("campaign_id", campaignId)
        .eq("viewer_ip", ip)
        .gte("clicked_at", since);
      if ((count ?? 0) > 0) return;
    }

    const { error: clkErr } = await supabase.from("ad_clicks").insert({
      campaign_id: campaignId,
      user_id: user?.id ?? null,
      viewer_canton: geo.canton,
      viewer_ip: ip,
    });
    if (!clkErr) {
      await supabase.rpc("increment_ad_click", { p_campaign_id: campaignId });
    }
  } catch (e) { captureServerError(e, { action: "trackAdClick" }); }
}

export async function getCampaignCantonStats(campaignId: string): Promise<{ canton: string; impressions: number; clicks: number }[]> {
  try {
    const { supabase, companyId } = await requireBusiness();
    const { data: owned } = await supabase.from("ad_campaigns").select("id").eq("id", campaignId).eq("company_id", companyId).maybeSingle();
    if (!owned) return [];
    const { data } = await supabase.rpc("get_campaign_canton_stats", { p_campaign_id: campaignId });
    return (data ?? []).map((r: { canton: string; impressions: number; clicks: number }) => ({
      canton: r.canton,
      impressions: Number(r.impressions),
      clicks: Number(r.clicks),
    }));
  } catch { return []; }
}
