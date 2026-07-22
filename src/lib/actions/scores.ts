"use server";

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function isBusiness(supabase: any, userId: string): Promise<boolean> {
  const { data } = await supabase.from("profiles").select("claimed_company_id").eq("id", userId).maybeSingle();
  return !!data?.claimed_company_id;
}

export async function addFlame(companyId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  if (await isBusiness(supabase, user.id)) return;

  const { data: existing } = await supabase
    .from("score_events")
    .select("id")
    .eq("company_id", companyId)
    .eq("user_id", user.id)
    .eq("event_type", "flame")
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("score_events").delete().eq("id", existing.id);
    if (error) { console.error("[addFlame] delete error:", error.message); return; }
  } else {
    const { error } = await supabase.from("score_events").insert({ company_id: companyId, user_id: user.id, event_type: "flame", points: 1 });
    if (error) { console.error("[addFlame] insert error:", error.message); return; }
  }
  revalidatePath("/explore");
  revalidatePath("/ranking");
  revalidatePath(`/company/${companyId}`);
  revalidateTag("companies", {});
  revalidateTag("top-companies", {});
}

export async function addBoost(companyId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  if (await isBusiness(supabase, user.id)) return;

  const { data: existing } = await supabase
    .from("score_events")
    .select("id")
    .eq("company_id", companyId)
    .eq("user_id", user.id)
    .eq("event_type", "boost")
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("score_events").delete().eq("id", existing.id);
    if (error) { console.error("[addBoost] delete error:", error.message); return; }
    revalidatePath("/explore");
    revalidatePath("/ranking");
    revalidatePath(`/company/${companyId}`);
    return;
  }

  const { error } = await supabase.from("score_events").insert({ company_id: companyId, user_id: user.id, event_type: "boost", points: 100 });
  if (error) { console.error("[addBoost] insert error:", error.message); return; }
  revalidatePath("/explore");
  revalidatePath("/ranking");
  revalidatePath(`/company/${companyId}`);
  revalidateTag("companies", {});
  revalidateTag("top-companies", {});
}

export async function addPenalty(companyId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase.from("profiles").select("role, penalty_credits").eq("id", user.id).maybeSingle();
  const isAdmin = profile?.role === "admin";
  const credits = Number(profile?.penalty_credits ?? 0);
  if (!isAdmin && credits <= 0) return;

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("score_events")
    .select("id")
    .eq("company_id", companyId)
    .eq("user_id", user.id)
    .eq("event_type", "penalty")
    .maybeSingle();

  if (existing) {
    // Toggle off — refund 1 credit atomically via RPC (avoids read+write race)
    await admin.from("score_events").delete().eq("id", existing.id);
    if (!isAdmin) {
      await supabase.rpc("increment_penalty_credits", { uid: user.id, amount: 1 });
    }
  } else {
    // Spend 1 credit atomically — returns false if credits were 0 (race condition guard)
    if (!isAdmin) {
      const { data: ok } = await supabase.rpc("spend_penalty_credit", { uid: user.id });
      if (!ok) return; // someone else consumed the last credit first
    }
    await admin.from("score_events").insert({ company_id: companyId, user_id: user.id, event_type: "penalty", points: -100 });
  }

  revalidatePath("/explore");
  revalidatePath("/ranking");
  revalidatePath(`/company/${companyId}`);
  revalidateTag("companies", {});
  revalidateTag("top-companies", {});
}

export async function getTopCompanies(limit = 200) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("companies")
    .select("id, name, sector, city, canton, employee_range, avg_rating, review_count, avg_salary_chf, cover_url, score, is_verified, tags")
    .neq("employee_range", "1-10")
    .order("score", { ascending: false })
    .order("avg_rating", { ascending: false })
    .order("review_count", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export const getCachedTopCompanies = unstable_cache(
  async (limit: number) => {
    const admin = createAdminClient();
    const { data } = await admin
      .from("companies")
      .select("id, name, sector, city, canton, employee_range, avg_rating, review_count, avg_salary_chf, cover_url, score, is_verified, tags")
      .neq("employee_range", "1-10")
      .order("score", { ascending: false })
      .order("avg_rating", { ascending: false })
      .order("review_count", { ascending: false })
      .limit(limit);
    return data ?? [];
  },
  ["top-companies"],
  { revalidate: 60, tags: ["top-companies"] }
);

export const getCachedReviewCount = unstable_cache(
  async () => {
    const admin = createAdminClient();
    const { count } = await admin.from("reviews").select("*", { count: "exact", head: true });
    return count ?? 0;
  },
  ["review-count"],
  { revalidate: 300, tags: ["reviews"] }
);

export async function getUserFlameIds(): Promise<string[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase.from("score_events").select("company_id").eq("user_id", user.id).eq("event_type", "flame");
  return (data ?? []).map((r: { company_id: string }) => r.company_id);
}
