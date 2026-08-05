"use server";

import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Company } from "@/lib/types";

function stripAccents(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function escapeLike(s: string) {
  return s.replace(/[%_\\]/g, "\\$&");
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
    .select(GRID_COLS)
    .order("profile_score", { ascending: false, nullsFirst: false })
    .order("score", { ascending: false, nullsFirst: false })
    .order("avg_rating", { ascending: false, nullsFirst: false })
    .order("name", { ascending: true })
    .range(offset, offset + SWIPE_PAGE_SIZE - 1);

  if (filters?.sector) q = q.eq("sector", filters.sector);
  if (filters?.canton) q = q.eq("canton", filters.canton);
  if (filters?.search) {
    const raw = filters.search.trim();
    const stripped = escapeLike(stripAccents(raw));
    const original = escapeLike(raw);
    if (stripped !== original) {
      q = q.or(`name.ilike.%${original}%,name.ilike.%${stripped}%`);
    } else {
      q = q.ilike("name", `%${original}%`);
    }
  }

  const { data } = await q;
  // Exclude companies without city or tags — they render as empty cards in the swipe
  return (data ?? []).filter(c => c.city?.trim() && (c.tags?.length ?? 0) > 0) as Company[];
}


import { GRID_PAGE_SIZE, COMPANY_PUBLIC_COLS } from "@/lib/actions/columns";

const GRID_COLS = "id,name,sector,subsector,city,canton,employee_range,avg_rating,review_count,avg_salary_chf,cover_url,cover_color,logo_url,score,is_verified,tags,description,profile_score";

// Cached grid fetcher — no cookies(), uses adminClient, safe to cache across requests.
// All users with the same filters share one DB query per 60s instead of N.
const _fetchGridPageCached = unstable_cache(
  async (
    filters: { sector?: string; canton?: string; sort?: string },
    page: number
  ): Promise<{ companies: Company[]; total: number }> => {
    const admin = createAdminClient();

    let q = admin
      .from("companies")
      .select(GRID_COLS, { count: "exact" })

    if (filters.sector) q = q.eq("sector", filters.sector);
    if (filters.canton) q = q.eq("canton", filters.canton);

    switch (filters.sort) {
      case "rating":
        q = q
          .order("avg_rating",   { ascending: false, nullsFirst: false })
          .order("review_count", { ascending: false, nullsFirst: false })
          .order("name",         { ascending: true });
        break;
      case "reviews":
        q = q
          .order("review_count", { ascending: false, nullsFirst: false })
          .order("avg_rating",   { ascending: false, nullsFirst: false })
          .order("name",         { ascending: true });
        break;
      case "score":
        q = q
          .order("score",      { ascending: false, nullsFirst: false })
          .order("avg_rating", { ascending: false, nullsFirst: false })
          .order("name",       { ascending: true });
        break;
      case "name":
        q = q.order("name", { ascending: true });
        break;
      default:
        q = q
          .order("profile_score", { ascending: false, nullsFirst: false })
          .order("score",         { ascending: false, nullsFirst: false })
          .order("avg_rating",    { ascending: false, nullsFirst: false })
          .order("name",          { ascending: true });
    }

    const { data, count } = await q.range(
      page * GRID_PAGE_SIZE,
      (page + 1) * GRID_PAGE_SIZE - 1
    );

    return { companies: (data ?? []) as Company[], total: count ?? 0 };
  },
  ["grid-page"],
  { revalidate: 60, tags: ["companies"] }
);

export async function fetchGridPage(
  filters: { sector?: string; canton?: string; sort?: string },
  page: number
): Promise<{ companies: Company[]; total: number }> {
  return _fetchGridPageCached(filters, page);
}

export const getCachedCompany = unstable_cache(
  async (id: string) => {
    const admin = createAdminClient();
    const { data } = await admin.from("companies").select(COMPANY_PUBLIC_COLS).eq("id", id).maybeSingle();
    return data as Company | null;
  },
  ["company"],
  { revalidate: 60, tags: ["companies"] }
);
