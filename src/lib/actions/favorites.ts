"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Company } from "@/lib/types";

export async function toggleFavorite(companyId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase
    .from("favorites").select("company_id").eq("user_id", user.id).eq("company_id", companyId).maybeSingle();

  if (existing) {
    await supabase.from("favorites").delete().eq("user_id", user.id).eq("company_id", companyId);
  } else {
    await supabase.from("favorites").insert({ user_id: user.id, company_id: companyId });
  }
  revalidatePath("/profile");
  revalidatePath(`/company/${companyId}`);
}

export async function getFavorites(): Promise<Company[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("favorites")
    .select("companies(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return ((data ?? []).map((r: any) => r.companies).filter(Boolean)) as Company[];
}

export async function getUserFavoriteIds(): Promise<string[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase.from("favorites").select("company_id").eq("user_id", user.id);
  return (data ?? []).map((r: any) => r.company_id);
}
