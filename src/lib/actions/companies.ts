"use server";

import { createClient } from "@/lib/supabase/server";
import type { Company } from "@/lib/types";

const PAGE_SIZE = 12;

export async function getCompanies(filters?: {
  sector?: string;
  city?: string;
  search?: string;
  page?: number;
}) {
  const supabase = await createClient();
  const page = Math.max(1, filters?.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("companies")
    .select("*", { count: "exact" })
    .order("avg_rating", { ascending: false })
    .order("name", { ascending: true });

  if (filters?.sector) query = query.eq("sector", filters.sector);
  if (filters?.city) query = query.eq("city", filters.city);
  if (filters?.search) query = query.ilike("name", `%${filters.search}%`);

  const { data, count } = await query.range(from, to);
  return {
    companies: (data ?? []) as Company[],
    total: count ?? 0,
    page,
    pageCount: Math.ceil((count ?? 0) / PAGE_SIZE),
  };
}

export async function getCompany(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("companies").select("*").eq("id", id).maybeSingle();
  return data as Company | null;
}
