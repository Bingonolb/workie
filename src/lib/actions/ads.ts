"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateCPM } from "@/lib/ads/pricing";
import type { AdFormat } from "@/lib/ads/pricing";

async function getViewerGeo(): Promise<{ canton: string | null; city: string | null }> {
  try {
    const h = await headers();
    // Vercel injects these automatically on all deployments
    const region = h.get("x-vercel-ip-country-region"); // e.g. "GE", "VD", "ZH"
    const city   = h.get("x-vercel-ip-city");           // e.g. "Geneva"
    return { canton: region ?? null, city: city ?? null };
  } catch { return { canton: null, city: null }; }
}

export type AdCampaign = {
  id: string;
  company_id: string;
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

async function requireBusiness() {
  const [user, supabase] = await Promise.all([getUser(), createClient()]);
  if (!user) throw new Error("Non authentifié");
  const { data: profile } = await supabase.from("profiles").select("claimed_company_id").eq("id", user.id).maybeSingle();
  if (!profile?.claimed_company_id) throw new Error("Aucune entreprise liée");
  return { user, supabase, companyId: profile.claimed_company_id as string };
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

export async function getAdminCampaigns(): Promise<{
  campaigns?: (AdCampaign & { company_name: string; company_logo: string | null })[]; error?: string;
}> {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("ad_campaigns")
      .select("*, companies(name, logo_url)")
      .order("created_at", { ascending: false });
    if (error) return { error: error.message };
    return {
      campaigns: (data ?? []).map((c: any) => ({
        ...c,
        company_name: c.companies?.name ?? "?",
        company_logo: c.companies?.logo_url ?? null,
      })),
    };
  } catch (e) { return { error: (e as Error).message }; }
}

export async function getActiveAds(opts?: {
  format?: AdFormat;
  canton?: string;
  sector?: string;
  limit?: number;
}): Promise<AdCampaign[]> {
  try {
    const supabase = await createClient();
    const today = new Date().toISOString().slice(0, 10);
    let q = supabase
      .from("ad_campaigns")
      .select("*")
      .eq("status", "active")
      .lte("start_date", today)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .order("spent_chf", { ascending: true }); // prioritise less-spent campaigns
    if (opts?.format) q = q.eq("format", opts.format);
    const { data } = await q.limit(50); // fetch pool, then filter + shuffle

    const pool = ((data ?? []) as unknown as AdCampaign[]).filter(ad => {
      if (ad.end_date && ad.end_date < today) return false;
      if (Number(ad.spent_chf) >= Number(ad.total_budget_chf)) return false;
      if (opts?.canton && ad.target_cantons.length > 0 && !ad.target_cantons.includes(opts.canton)) return false;
      if (opts?.sector && ad.target_sectors.length > 0 && !ad.target_sectors.includes(opts.sector)) return false;
      return true;
    });

    // Fisher-Yates shuffle for rotation
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    return pool.slice(0, opts?.limit ?? 10);
  } catch (e) { console.error("[getActiveAds] error:", e); return []; }
}

export async function getCampaignDailyStats(campaignId: string): Promise<{ day: string; impressions: number; clicks: number }[]> {
  try {
    const { supabase, companyId } = await requireBusiness();
    // Verify campaign belongs to the authenticated user's company
    const { data: campaign } = await supabase.from("ad_campaigns").select("id").eq("id", campaignId).eq("company_id", companyId).maybeSingle();
    if (!campaign) return [];
    const [impRes, clkRes] = await Promise.all([
      supabase.from("ad_impressions")
        .select("viewed_at")
        .eq("campaign_id", campaignId)
        .gte("viewed_at", new Date(Date.now() - 30 * 86400000).toISOString()),
      supabase.from("ad_clicks")
        .select("clicked_at")
        .eq("campaign_id", campaignId)
        .gte("clicked_at", new Date(Date.now() - 30 * 86400000).toISOString()),
    ]);

    const impByDay: Record<string, number> = {};
    for (const row of impRes.data ?? []) {
      const d = (row.viewed_at ?? "").slice(0, 10);
      impByDay[d] = (impByDay[d] ?? 0) + 1;
    }
    const clkByDay: Record<string, number> = {};
    for (const row of clkRes.data ?? []) {
      const d = (row.clicked_at ?? "").slice(0, 10);
      clkByDay[d] = (clkByDay[d] ?? 0) + 1;
    }

    const days: { day: string; impressions: number; clicks: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      days.push({ day: d, impressions: impByDay[d] ?? 0, clicks: clkByDay[d] ?? 0 });
    }
    return days;
  } catch (e) { console.error("[getCampaignDailyStats] error:", e); return []; }
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

    if (error) return { error: error.message };
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

// In-process rate limit for ad tracking — prevents budget exhaustion attacks.
// Key: "ip:campaign:type", Value: last_seen_ms
// Limit: 1 impression and 1 click per campaign per IP per 10 minutes.
const adRl = new Map<string, number>();
const AD_RL_WINDOW = 10 * 60_000;

function adRateLimited(ip: string, campaignId: string, type: "imp" | "clk"): boolean {
  const key = `${ip}:${campaignId}:${type}`;
  const now = Date.now();
  const last = adRl.get(key);
  if (last && now - last < AD_RL_WINDOW) return true;
  adRl.set(key, now);
  return false;
}

export async function trackAdImpression(campaignId: string): Promise<void> {
  try {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (adRateLimited(ip, campaignId, "imp")) return;

    const [supabase, geo] = await Promise.all([createClient(), getViewerGeo()]);
    const { data: { user } } = await supabase.auth.getUser();
    await Promise.all([
      supabase.from("ad_impressions").insert({
        campaign_id: campaignId,
        user_id: user?.id ?? null,
        viewer_canton: geo.canton,
        viewer_city: geo.city,
      }),
      supabase.rpc("increment_ad_impression", { p_campaign_id: campaignId }),
    ]);
  } catch (e) { console.error("[trackAdImpression] error:", e); }
}

export async function trackAdClick(campaignId: string): Promise<void> {
  try {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (adRateLimited(ip, campaignId, "clk")) return;

    const [supabase, geo] = await Promise.all([createClient(), getViewerGeo()]);
    const { data: { user } } = await supabase.auth.getUser();
    await Promise.all([
      supabase.from("ad_clicks").insert({
        campaign_id: campaignId,
        user_id: user?.id ?? null,
        viewer_canton: geo.canton,
      }),
      supabase.rpc("increment_ad_click", { p_campaign_id: campaignId }),
    ]);
  } catch (e) { console.error("[trackAdClick] error:", e); }
}

export async function getCampaignCantonStats(campaignId: string): Promise<{ canton: string; impressions: number; clicks: number }[]> {
  try {
    const { supabase, companyId } = await requireBusiness();
    // Verify campaign belongs to the authenticated user's company
    const { data: campaign } = await supabase.from("ad_campaigns").select("id").eq("id", campaignId).eq("company_id", companyId).maybeSingle();
    if (!campaign) return [];
    // Capped at 5000 rows — replace with SQL GROUP BY RPC once volume grows
    const [impRes, clkRes] = await Promise.all([
      supabase.from("ad_impressions").select("viewer_canton").eq("campaign_id", campaignId).not("viewer_canton", "is", null).limit(5000),
      supabase.from("ad_clicks").select("viewer_canton").eq("campaign_id", campaignId).not("viewer_canton", "is", null).limit(5000),
    ]);

    const impByC: Record<string, number> = {};
    for (const r of impRes.data ?? []) {
      const c = r.viewer_canton as string;
      impByC[c] = (impByC[c] ?? 0) + 1;
    }
    const clkByC: Record<string, number> = {};
    for (const r of clkRes.data ?? []) {
      const c = r.viewer_canton as string;
      clkByC[c] = (clkByC[c] ?? 0) + 1;
    }

    return Object.entries(impByC)
      .map(([canton, impressions]) => ({ canton, impressions, clicks: clkByC[canton] ?? 0 }))
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 10);
  } catch { return []; }
}
