import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSecteursEnLigne } from "@/lib/secteursEnLigne";
import { catalogueEmploi } from "@/lib/pagesEmploi";
import { urlFiche } from "@/lib/urlFiche";
import { OUVERTES } from "@/i18n/config";
import { adresse } from "@/i18n/meta";

export const revalidate = 3600;

// Static pages with fixed last-modified dates (only changes on deploy)
const STATIC_LAST_MOD = new Date("2026-01-01");

type Page = Omit<MetadataRoute.Sitemap[number], "url"> & { chemin: string };

/**
 * Une page, une entrée par langue ouverte.
 *
 * Chaque entrée nomme ses équivalents dans les autres langues (hreflang),
 * comme le fait la page elle-même : le moteur relie /explore et /de/explore
 * au lieu d'y voir deux pages concurrentes. Tant que seul le français est
 * ouvert, rien ne change : une entrée par page, sans préfixe.
 */
function enLangues(pages: Page[]): MetadataRoute.Sitemap {
  return pages.flatMap(({ chemin, ...reste }) => {
    const languages: Record<string, string> = {};
    if (OUVERTES.length > 1) {
      for (const l of OUVERTES) languages[`${l}-CH`] = adresse(chemin, l);
      languages["x-default"] = adresse(chemin, "fr");
    }
    return OUVERTES.map(l => ({
      url: adresse(chemin, l),
      ...reste,
      ...(OUVERTES.length > 1 ? { alternates: { languages } } : {}),
    }));
  });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: Page[] = [
    { chemin: "/",                lastModified: STATIC_LAST_MOD, changeFrequency: "daily",   priority: 1.0 },
    { chemin: "/explore",         lastModified: STATIC_LAST_MOD, changeFrequency: "hourly",  priority: 0.9 },
    { chemin: "/ranking",         lastModified: STATIC_LAST_MOD, changeFrequency: "hourly",  priority: 0.8 },
    { chemin: "/annonceurs",      lastModified: STATIC_LAST_MOD, changeFrequency: "monthly", priority: 0.6 },
    { chemin: "/cgu",             lastModified: STATIC_LAST_MOD, changeFrequency: "yearly",  priority: 0.2 },
    { chemin: "/confidentialite", lastModified: STATIC_LAST_MOD, changeFrequency: "yearly",  priority: 0.2 },
  ];

  try {
    // Admin client — no cookies needed, works in crawler context
    const admin = createAdminClient();
    const enLigne = await getSecteursEnLigne();

    // Pagination obligatoire : PostgREST plafonne toute requête à 1000 lignes
    // côté serveur, un .limit(5000) ne le contourne pas.
    const PAGE = 1000;
    const companies: { id: string; slug: string; review_count: number | null; created_at: string | null }[] = [];
    for (let from = 0; from < 10_000; from += PAGE) {
      const { data, error } = await admin
        .from("companies")
        .select("id, slug, review_count, created_at")
        .in("sector", enLigne)
        .order("score", { ascending: false })
        .range(from, from + PAGE - 1);
      if (error || !data || data.length === 0) break;
      companies.push(...data);
      if (data.length < PAGE) break;
    }

    const companyRoutes: Page[] = companies.map(c => ({
      chemin: urlFiche(c),
      lastModified: c.created_at ? new Date(c.created_at) : STATIC_LAST_MOD,
      changeFrequency: (Number(c.review_count) > 0 ? "weekly" : "monthly") as "weekly" | "monthly",
      priority: Number(c.review_count) > 5 ? 0.8 : Number(c.review_count) > 0 ? 0.6 : 0.4,
    }));

    // Pages par secteur et par canton : ce sont elles qui captent les
    // recherches du type « entreprises horlogerie Genève ».
    const { pages } = await catalogueEmploi();
    const emploiRoutes: Page[] = [
      { chemin: "/emploi", changeFrequency: "daily", priority: 0.8 },
      ...pages.map(p => ({
        chemin: `/emploi/${p.slug}`,
        changeFrequency: "daily" as const,
        priority: p.type === "croise" ? 0.6 : 0.7,
      })),
    ];

    return enLangues([...staticRoutes, ...emploiRoutes, ...companyRoutes]);
  } catch {
    return enLangues(staticRoutes);
  }
}
