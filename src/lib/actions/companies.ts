"use server";

import { createClient } from "@/lib/supabase/server";
import type { Company } from "@/lib/types";
import { PAGE_SIZE } from "@/lib/constants";

function escapeLike(s: string) {
  return s.replace(/[%_\\]/g, "\\$&");
}

export async function getCompanies(filters?: {
  sector?: string;
  canton?: string;
  search?: string;
  page?: number;
  sort?: string;
}) {
  const supabase = await createClient();
  const page = Math.max(1, filters?.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const sort = filters?.sort ?? "score";
  let query = supabase.from("companies").select("*", { count: "exact" });

  if (sort === "rating") {
    query = query.order("avg_rating", { ascending: false }).order("review_count", { ascending: false }).order("name", { ascending: true });
  } else if (sort === "reviews") {
    query = query.order("review_count", { ascending: false }).order("avg_rating", { ascending: false }).order("name", { ascending: true });
  } else if (sort === "name") {
    query = query.order("name", { ascending: true });
  } else {
    query = query.order("score", { ascending: false }).order("avg_rating", { ascending: false }).order("name", { ascending: true });
  }

  // Minimum 10 employees — exclude "1-10" range
  query = query.neq("employee_range", "1-10");

  if (filters?.sector) query = query.eq("sector", filters.sector);
  if (filters?.canton) query = query.eq("canton", filters.canton);
  if (filters?.search) {
    const names = filters.search.split(",").map(s => s.trim()).filter(Boolean);
    if (names.length === 1) query = query.ilike("name", `%${escapeLike(names[0])}%`);
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
  canton?: string;
  search?: string;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("companies")
    .select("*")
    .order("score", { ascending: false })
    .order("avg_rating", { ascending: false });

  query = query.neq("employee_range", "1-10");

  if (filters?.sector) query = query.eq("sector", filters.sector);
  if (filters?.canton) query = query.eq("canton", filters.canton);
  if (filters?.search) {
    const names = filters.search.split(",").map(s => s.trim()).filter(Boolean);
    if (names.length === 1) query = query.ilike("name", `%${escapeLike(names[0])}%`);
    else if (names.length > 1) query = query.in("name", names);
  }

  const { data } = await query;
  return (data ?? []) as Company[];
}

// Lightweight — names only for autocomplete, avoids SELECT * over 200 rows
export async function getCompanyNames(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("companies").select("name").order("name");
  return (data ?? []).map((r: { name: string }) => r.name);
}

export async function getCompany(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("companies").select("*").eq("id", id).maybeSingle();
  return data as Company | null;
}
