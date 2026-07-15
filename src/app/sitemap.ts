import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.workie.ch";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const { data: companies } = await supabase
    .from("companies")
    .select("id, created_at")
    .order("created_at", { ascending: false });

  const companyUrls: MetadataRoute.Sitemap = (companies ?? []).map(c => ({
    url: `${BASE}/company/${c.id}`,
    lastModified: c.created_at ? new Date(c.created_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    { url: BASE, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/explore`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/ranking`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE}/salaires`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/signup`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/cgu`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/confidentialite`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    ...companyUrls,
  ];
}
