"use server";

import { createClient } from "@/lib/supabase/server";
import type { Company } from "@/lib/types";
import { PAGE_SIZE } from "@/lib/constants";

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
    .order("score", { ascending: false })
    .order("avg_rating", { ascending: false })
    .order("name", { ascending: true });

  if (filters?.sector) query = query.eq("sector", filters.sector);
  if (filters?.city) query = query.eq("city", filters.city);
  if (filters?.search) {
    const names = filters.search.split(",").map(s => s.trim()).filter(Boolean);
    if (names.length === 1) query = query.ilike("name", `%${names[0]}%`);
    else if (names.length > 1) query = query.in("name", names);
  }

  const { data, count } = await query.range(from, to);
  return {
    companies: (data ?? []) as Company[],
    total: count ?? 0,
    page,
    pageCount: Math.ceil((count ?? 0) / PAGE_SIZE),
  };
}

// Pour le mode swipe — toutes les entreprises sans pagination
export async function getAllCompaniesForSwipe(filters?: {
  sector?: string;
  city?: string;
  search?: string;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("companies")
    .select("*")
    .order("score", { ascending: false })
    .order("avg_rating", { ascending: false });

  if (filters?.sector) query = query.eq("sector", filters.sector);
  if (filters?.city) query = query.eq("city", filters.city);
  if (filters?.search) {
    const names = filters.search.split(",").map(s => s.trim()).filter(Boolean);
    if (names.length === 1) query = query.ilike("name", `%${names[0]}%`);
    else if (names.length > 1) query = query.in("name", names);
  }

  const { data } = await query.limit(200);
  return (data ?? []) as Company[];
}

export async function getCompany(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("companies").select("*").eq("id", id).maybeSingle();
  return data as Company | null;
}
