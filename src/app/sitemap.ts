import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

export const revalidate = 3600;

// Static pages with fixed last-modified dates (only changes on deploy)
const STATIC_LAST_MOD = new Date("2026-01-01");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://www.workie.ch";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base,                   lastModified: STATIC_LAST_MOD, changeFrequency: "daily",   priority: 1.0 },
    { url: `${base}/explore`,      lastModified: STATIC_LAST_MOD, changeFrequency: "hourly",  priority: 0.9 },
    { url: `${base}/ranking`,      lastModified: STATIC_LAST_MOD, changeFrequency: "hourly",  priority: 0.8 },
    { url: `${base}/salaires`,     lastModified: STATIC_LAST_MOD, changeFrequency: "daily",   priority: 0.8 },
{ url: `${base}/cgu`,          lastModified: STATIC_LAST_MOD, changeFrequency: "yearly",  priority: 0.2 },
    { url: `${base}/confidentialite`, lastModified: STATIC_LAST_MOD, changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    // Admin client — no cookies needed, works in crawler context
    const admin = createAdminClient();

    // Pagination obligatoire : PostgREST plafonne toute requête à 1000 lignes
    // côté serveur, un .limit(5000) ne le contourne pas. Le sitemap ne listait
    // donc que 1000 des 1796 entreprises — près de 800 fiches invisibles pour
    // les moteurs de recherche.
    const PAGE = 1000;
    const companies: { id: string; review_count: number | null; created_at: string | null }[] = [];
    for (let from = 0; from < 10_000; from += PAGE) {
      const { data, error } = await admin
        .from("companies")
        .select("id, review_count, created_at")
        .order("score", { ascending: false })
        .range(from, from + PAGE - 1);
      if (error || !data || data.length === 0) break;
      companies.push(...data);
      if (data.length < PAGE) break;
    }

    const companyRoutes: MetadataRoute.Sitemap = (companies ?? []).map(c => ({
      url: `${base}/company/${c.id}`,
      lastModified: c.created_at ? new Date(c.created_at) : STATIC_LAST_MOD,
      changeFrequency: (Number(c.review_count) > 0 ? "weekly" : "monthly") as "weekly" | "monthly",
      priority: Number(c.review_count) > 5 ? 0.8 : Number(c.review_count) > 0 ? 0.6 : 0.4,
    }));

    return [...staticRoutes, ...companyRoutes];
  } catch {
    return staticRoutes;
  }
}
