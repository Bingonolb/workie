"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addFlame(companyId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase
    .from("score_events")
    .select("id")
    .eq("company_id", companyId)
    .eq("user_id", user.id)
    .eq("event_type", "flame")
    .maybeSingle();

  if (existing) {
    await supabase.from("score_events").delete().eq("id", existing.id);
  } else {
    await supabase.from("score_events").insert({ company_id: companyId, user_id: user.id, event_type: "flame", points: 1 });
  }
  revalidatePath("/explore");
  revalidatePath("/ranking");
}

export async function addBoost(companyId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("score_events").insert({ company_id: companyId, user_id: user.id, event_type: "boost", points: 100 });
  revalidatePath("/ranking");
}

export async function addPenalty(companyId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("score_events").insert({ company_id: companyId, user_id: user.id, event_type: "penalty", points: -100 });
  revalidatePath("/ranking");
}

export async function getTopCompanies(limit = 100) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("companies")
    .select("id, name, sector, city, employee_range, avg_rating, review_count, avg_salary_chf, cover_url, score, is_verified, tags")
    .order("score", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getUserFlameIds(): Promise<string[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase.from("score_events").select("company_id").eq("user_id", user.id).eq("event_type", "flame");
  return (data ?? []).map((r: { company_id: string }) => r.company_id);
}
