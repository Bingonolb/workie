"use server";

import { createClient } from "@/lib/supabase/server";
import type { Company } from "@/lib/types";

export async function getCompanies(filters?: { sector?: string; city?: string; search?: string }) {
  const supabase = await createClient();
  let query = supabase.from("companies").select("*").order("review_count", { ascending: false });

  if (filters?.sector) query = query.eq("sector", filters.sector);
  if (filters?.city) query = query.eq("city", filters.city);
  if (filters?.search) query = query.ilike("name", `%${filters.search}%`);

  const { data } = await query.limit(50);
  return (data ?? []) as Company[];
}

export async function getCompany(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("companies").select("*").eq("id", id).maybeSingle();
  return data as Company | null;
}
