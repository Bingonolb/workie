"use server";

import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

  const sort = filters?.sort ?? "recent";
  let query = supabase.from("companies").select("*", { count: "exact" });

  if (sort === "rating") {
    query = query.order("avg_rating", { ascending: false }).order("review_count", { ascending: false }).order("name", { ascending: true });
  } else if (sort === "reviews") {
    query = query.order("review_count", { ascending: false }).order("avg_rating", { ascending: false }).order("name", { ascending: true });
  } else if (sort === "name") {
    query = query.order("name", { ascending: true });
  } else if (sort === "score") {
    query = query.order("score", { ascending: false }).order("avg_rating", { ascending: false }).order("name", { ascending: true });
  } else {
    // default: profils les plus complets en premier, puis score communautaire
    query = query
      .order("profile_score", { ascending: false, nullsFirst: false })
      .order("score", { ascending: false, nullsFirst: false })
      .order("name", { ascending: true });
  }

  // Minimum 10 employees — exclude "1-10" range
  query = query.neq("employee_range", "1-10");

  if (filters?.sector) query = query.eq("sector", filters.sector);
  if (filters?.canton) query = query.eq("canton", filters.canton);
  if (filters?.search) {
    query = query.ilike("name", `%${escapeLike(filters.search.trim())}%`);
  }

  const { data, count } = await query.range(from, to);
  return {
    companies: (data ?? []) as Company[],
    total: count ?? 0,
    page,
    pageCount: Math.ceil((count ?? 0) / PAGE_SIZE),
  };
}

const SWIPE_PAGE_SIZE = 50;

// Pour le mode swipe — premier batch seulement (lazy loading ensuite)
export async function getAllCompaniesForSwipe(filters?: {
  sector?: string;
  canton?: string;
  search?: string;
}) {
  return fetchSwipePage(filters, 0);
}

// Appelé depuis le client pour charger le prochain batch
export async function fetchSwipePage(
  filters: { sector?: string; canton?: string; search?: string } | undefined,
  offset: number
) {
  const supabase = await createClient();
  let q = supabase
    .from("companies")
    .select("*")
    .order("profile_score", { ascending: false, nullsFirst: false })
    .order("score", { ascending: false, nullsFirst: false })
    .order("avg_rating", { ascending: false, nullsFirst: false })
    .order("name", { ascending: true })
    .neq("employee_range", "1-10")
    .range(offset, offset + SWIPE_PAGE_SIZE - 1);

  if (filters?.sector) q = q.eq("sector", filters.sector);
  if (filters?.canton) q = q.eq("canton", filters.canton);
  if (filters?.search) {
    q = q.ilike("name", `%${escapeLike(filters.search.trim())}%`);
  }

  const { data } = await q;
  // Exclude companies without city or tags — they render as empty cards in the swipe
  return (data ?? []).filter(c => c.city?.trim() && (c.tags?.length ?? 0) > 0) as Company[];
}


const GRID_COLS = "id,name,sector,subsector,city,canton,employee_range,avg_rating,review_count,avg_salary_chf,cover_url,logo_url,score,is_verified,tags,description,profile_score";

// Cached 60s — revalidateTag("companies") is called after mutations
// Uses admin client — cookies() must not be called inside unstable_cache
export const getAllCompaniesForGrid = unstable_cache(
  async (): Promise<Company[]> => {
    const supabase = createAdminClient();
    const PAGE = 1000;
    const results: Company[] = [];
    let offset = 0;
    while (true) {
      const { data } = await supabase
        .from("companies")
        .select(GRID_COLS)
        .neq("employee_range", "1-10")
        .order("profile_score", { ascending: false, nullsFirst: false })
        .order("score", { ascending: false, nullsFirst: false })
        .order("name", { ascending: true })
        .range(offset, offset + PAGE - 1);
      const rows = (data ?? []) as Company[];
      results.push(...rows);
      if (rows.length < PAGE) break;
      offset += PAGE;
    }
    return results;
  },
  ["companies-grid"],
  { revalidate: 60, tags: ["companies"] }
);

export async function getCompany(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("companies").select("*").eq("id", id).maybeSingle();
  return data as Company | null;
}

export const getCachedCompany = unstable_cache(
  async (id: string) => {
    const admin = createAdminClient();
    const { data } = await admin.from("companies").select("*").eq("id", id).maybeSingle();
    return data as Company | null;
  },
  ["company"],
  { revalidate: 60, tags: ["companies"] }
);
