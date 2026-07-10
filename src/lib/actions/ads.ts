"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateCPM } from "@/lib/ads/pricing";
import type { AdFormat } from "@/lib/ads/pricing";

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
  status: "pending" | "active" | "paused" | "completed" | "rejected";
  admin_note: string | null;
  impression_count: number;
  click_count: number;
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
    return { campaigns: (data ?? []) as AdCampaign[] };
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
}): Promise<AdCampaign[]> {
  try {
    const supabase = await createClient();
    const today = new Date().toISOString().slice(0, 10);
    let q = supabase
      .from("ad_campaigns")
      .select("*")
      .eq("status", "active")
      .lte("start_date", today);
    if (opts?.format) q = q.eq("format", opts.format);
    const { data } = await q.limit(10);
    return ((data ?? []) as AdCampaign[]).filter(ad => {
      if (ad.end_date && ad.end_date < today) return false;
      if (ad.spent_chf >= ad.total_budget_chf) return false;
      if (opts?.canton && ad.target_cantons.length > 0 && !ad.target_cantons.includes(opts.canton)) return false;
      if (opts?.sector && ad.target_sectors.length > 0 && !ad.target_sectors.includes(opts.sector)) return false;
      return true;
    });
  } catch { return []; }
}

// ── Mutations ──────────────────────────────────────────────────────────────────

export async function createCampaign(
  _: unknown,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
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

    const target_cantons = JSON.parse(String(formData.get("target_cantons") || "[]")) as string[];
    const target_sectors = JSON.parse(String(formData.get("target_sectors") || "[]")) as string[];
    const start_date = String(formData.get("start_date") || new Date().toISOString().slice(0, 10));
    const end_date = String(formData.get("end_date") || "") || null;
    const cpm_chf = calculateCPM(format, target_cantons, target_sectors);

    // Image: file upload or URL
    let image_url = String(formData.get("image_url") || "").trim();
    const imageFile = formData.get("image_file");
    if (imageFile instanceof File && imageFile.size > 0) {
      const ext = imageFile.name.split(".").pop() || "jpg";
      const path = `ads/${companyId}/${randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("covers").upload(path, imageFile, { contentType: imageFile.type, upsert: false });
      if (!upErr) {
        const { data: pub } = supabase.storage.from("covers").getPublicUrl(path);
        image_url = pub.publicUrl;
      }
    }
    if (!image_url) return { error: "Une image est requise (upload ou URL)." };

    const { error } = await supabase.from("ad_campaigns").insert({
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
      status: "pending",
    });

    if (error) return { error: error.message };
    revalidatePath("/business/dashboard/ads");
    return { success: true };
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
    const { error } = await admin
      .from("ad_campaigns")
      .update({ status, admin_note: note ?? null, updated_at: new Date().toISOString() })
      .eq("id", campaignId);
    if (error) return { error: error.message };
    revalidatePath("/admin/ads");
    return {};
  } catch (e) { return { error: (e as Error).message }; }
}

export async function trackAdImpression(campaignId: string): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("ad_impressions").insert({ campaign_id: campaignId, user_id: user?.id ?? null });
    await supabase.rpc("increment_ad_impression", { p_campaign_id: campaignId });
  } catch { /* silent */ }
}

export async function trackAdClick(campaignId: string): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("ad_clicks").insert({ campaign_id: campaignId, user_id: user?.id ?? null });
    await supabase.rpc("increment_ad_click", { p_campaign_id: campaignId });
  } catch { /* silent */ }
}
