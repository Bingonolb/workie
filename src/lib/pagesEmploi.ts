import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSecteursEnLigne } from "@/lib/secteursEnLigne";

/**
 * Pages d'atterrissage SEO : /emploi, /emploi/{secteur}, /emploi/{canton},
 * /emploi/{secteur}/{canton}.
 *
 * Elles répondent aux recherches du type « entreprises horlogerie Genève ».
 * Tout est calculé à partir d'une seule lecture en cache des fiches en ligne
 * (quelques centaines de lignes) : aucune requête par page.
 *
 * Une page n'existe que si elle a du contenu : au moins MIN fiches propres au
 * canton. Google pénalise les pages quasi vides, et elles n'aident personne.
 * Les enseignes présentes dans toute la Suisse (canton « CH ») complètent une
 * page de canton, elles ne suffisent pas à la créer.
 */

export const MIN = 3;

export const CANTONS: Record<string, { nom: string; dans: string; slug: string }> = {
  ZH: { nom: "Zurich", dans: "dans le canton de Zurich", slug: "zurich" },
  BE: { nom: "Berne", dans: "dans le canton de Berne", slug: "berne" },
  LU: { nom: "Lucerne", dans: "dans le canton de Lucerne", slug: "lucerne" },
  UR: { nom: "Uri", dans: "dans le canton d'Uri", slug: "uri" },
  SZ: { nom: "Schwytz", dans: "dans le canton de Schwytz", slug: "schwytz" },
  OW: { nom: "Obwald", dans: "dans le canton d'Obwald", slug: "obwald" },
  NW: { nom: "Nidwald", dans: "dans le canton de Nidwald", slug: "nidwald" },
  GL: { nom: "Glaris", dans: "dans le canton de Glaris", slug: "glaris" },
  ZG: { nom: "Zoug", dans: "dans le canton de Zoug", slug: "zoug" },
  FR: { nom: "Fribourg", dans: "dans le canton de Fribourg", slug: "fribourg" },
  SO: { nom: "Soleure", dans: "dans le canton de Soleure", slug: "soleure" },
  BS: { nom: "Bâle-Ville", dans: "dans le canton de Bâle-Ville", slug: "bale-ville" },
  BL: { nom: "Bâle-Campagne", dans: "dans le canton de Bâle-Campagne", slug: "bale-campagne" },
  SH: { nom: "Schaffhouse", dans: "dans le canton de Schaffhouse", slug: "schaffhouse" },
  AR: { nom: "Appenzell Rhodes-Extérieures", dans: "en Appenzell Rhodes-Extérieures", slug: "appenzell-rhodes-exterieures" },
  AI: { nom: "Appenzell Rhodes-Intérieures", dans: "en Appenzell Rhodes-Intérieures", slug: "appenzell-rhodes-interieures" },
  SG: { nom: "Saint-Gall", dans: "dans le canton de Saint-Gall", slug: "saint-gall" },
  GR: { nom: "Grisons", dans: "dans le canton des Grisons", slug: "grisons" },
  AG: { nom: "Argovie", dans: "dans le canton d'Argovie", slug: "argovie" },
  TG: { nom: "Thurgovie", dans: "dans le canton de Thurgovie", slug: "thurgovie" },
  TI: { nom: "Tessin", dans: "dans le canton du Tessin", slug: "tessin" },
  VD: { nom: "Vaud", dans: "dans le canton de Vaud", slug: "vaud" },
  VS: { nom: "Valais", dans: "dans le canton du Valais", slug: "valais" },
  NE: { nom: "Neuchâtel", dans: "dans le canton de Neuchâtel", slug: "neuchatel" },
  GE: { nom: "Genève", dans: "dans le canton de Genève", slug: "geneve" },
  JU: { nom: "Jura", dans: "dans le canton du Jura", slug: "jura" },
};

export function slugifier(t: string): string {
  return t.replace(/&/g, " et ").normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export type FicheEmploi = {
  id: string; slug: string; name: string; sector: string; subsector: string | null;
  city: string; canton: string | null; cover_url: string | null; cover_color: string | null;
  is_verified: boolean | null; score: number;
};

const lireFiches = unstable_cache(
  async (): Promise<FicheEmploi[]> => {
    const enLigne = await getSecteursEnLigne();
    const { data } = await createAdminClient()
      .from("companies")
      .select("id, slug, name, sector, subsector, city, canton, cover_url, cover_color, is_verified, score")
      .in("sector", enLigne)
      .order("score", { ascending: false })
      .limit(5000);
    return ((data ?? []) as unknown as FicheEmploi[]).map(f => ({ ...f, score: Number(f.score) || 0 }));
  },
  ["pages-emploi-fiches"],
  { revalidate: 300, tags: ["companies", "secteurs-en-ligne"] }
);

export type Page =
  | { type: "secteur"; secteur: string; slug: string; fiches: FicheEmploi[] }
  | { type: "canton"; canton: string; slug: string; locales: FicheEmploi[]; nationales: FicheEmploi[] }
  | { type: "croise"; secteur: string; canton: string; slug: string; locales: FicheEmploi[]; nationales: FicheEmploi[] };

export async function catalogueEmploi() {
  const fiches = await lireFiches();
  const secteurs = new Map<string, FicheEmploi[]>();
  for (const f of fiches) secteurs.set(f.sector, [...(secteurs.get(f.sector) ?? []), f]);

  const nationales = fiches.filter(f => f.canton === "CH");
  const pages: Page[] = [];

  for (const [secteur, liste] of secteurs) {
    pages.push({ type: "secteur", secteur, slug: slugifier(secteur), fiches: liste });
  }
  for (const [code, c] of Object.entries(CANTONS)) {
    const locales = fiches.filter(f => f.canton === code);
    if (locales.length >= MIN) pages.push({ type: "canton", canton: code, slug: c.slug, locales, nationales });
    for (const [secteur, liste] of secteurs) {
      const loc = liste.filter(f => f.canton === code);
      if (loc.length >= MIN) {
        pages.push({
          type: "croise", secteur, canton: code, slug: `${slugifier(secteur)}/${c.slug}`,
          locales: loc, nationales: liste.filter(f => f.canton === "CH"),
        });
      }
    }
  }
  return { pages, total: fiches.length };
}

export async function pageEmploi(slug: string): Promise<{ page: Page; pages: Page[] } | null> {
  const { pages } = await catalogueEmploi();
  const page = pages.find(p => p.slug === slug);
  return page ? { page, pages } : null;
}

export function nombre(p: Page): number {
  return p.type === "secteur" ? p.fiches.length : p.locales.length + p.nationales.length;
}
