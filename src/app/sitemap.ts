import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://www.workie.ch";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base,              lastModified: new Date(), changeFrequency: "daily",   priority: 1.0 },
    { url: `${base}/explore`, lastModified: new Date(), changeFrequency: "hourly",  priority: 0.9 },
    { url: `${base}/ranking`, lastModified: new Date(), changeFrequency: "hourly",  priority: 0.8 },
    { url: `${base}/salaires`,lastModified: new Date(), changeFrequency: "daily",   priority: 0.8 },
    { url: `${base}/jobs`,    lastModified: new Date(), changeFrequency: "hourly",  priority: 0.7 },
  ];

  try {
    const supabase = await createClient();
    const { data: companies } = await supabase
      .from("companies")
      .select("id")
      .order("score", { ascending: false })
      .limit(5000);

    const companyRoutes: MetadataRoute.Sitemap = (companies ?? []).map(c => ({
      url: `${base}/company/${c.id}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    return [...staticRoutes, ...companyRoutes];
  } catch {
    return staticRoutes;
  }
}
