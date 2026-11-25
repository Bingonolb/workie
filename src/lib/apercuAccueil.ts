import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { languesDeTravail, abregeLangue } from "@/lib/langues";
import { lieuAffiche } from "@/lib/types";
import { getSecteursEnLigne } from "@/lib/secteursEnLigne";
import { localiserEntreprises } from "@/lib/traductionsEntreprises";
import type { Langue } from "@/i18n/config";

/**
 * Les dix entreprises de la pile d'accueil.
 *
 * Tirees des secteurs que Luc a repris a la main, fiche par fiche : ce sont
 * les seules dont on sait que le nom, la description et l'adresse sont justes.
 * La page d'accueil est l'endroit ou une erreur se voit le plus.
 *
 * Une par secteur d'abord, les mieux suivies, puis on complete : dix cartes de
 * la meme branche feraient croire a un site specialise.
 */
export const getApercuEntreprises = unstable_cache(
  async () => {
    const admin = createAdminClient();
    // Les catégories publiées sont celles que Luc a terminées.
    const SECTEURS_REPRIS = await getSecteursEnLigne();
    const { data } = await admin
      .from("companies")
      .select("id, slug, name, sector, subsector, city, canton, description, cover_url, website_url, employee_range, langues")
      .in("sector", SECTEURS_REPRIS)
      .not("cover_url", "is", null)
      .not("description", "is", null)
      .order("score", { ascending: false })
      .limit(600);

    type Ligne = NonNullable<typeof data>[number];
    const parSecteur = new Map<string, Ligne[]>();
    for (const c of data ?? []) {
      const liste = parSecteur.get(c.sector) ?? [];
      liste.push(c);
      parSecteur.set(c.sector, liste);
    }

    // Tour a tour dans chaque secteur, jusqu'a dix.
    const retenues: Ligne[] = [];
    for (let tour = 0; retenues.length < 10 && tour < 10; tour++) {
      for (const secteur of SECTEURS_REPRIS) {
        const c = parSecteur.get(secteur)?.[tour];
        if (c && retenues.length < 10) retenues.push(c);
      }
    }

    return retenues.map(c => {
      const saisies = (c as { langues?: string[] | null }).langues ?? [];
      const langues = saisies.length > 0
        ? saisies
        : languesDeTravail(c.canton ?? null, c.website_url ?? null, c.employee_range ?? null);
      return {
        id: c.id,
        name: c.name,
        sector: c.sector,
        subsector: c.subsector,
        lieu: lieuAffiche(c.city, c.canton),
        langues: langues.map(l => abregeLangue(l)).join(" · "),
        // De quoi refaire lieu et langues dans une autre langue (localiserApercu).
        ville: c.city as string | null, canton: c.canton as string | null, codesLangues: langues,
        description: c.description,
        cover_url: c.cover_url,
      };
    });
  },
  ["landing-apercu-v4"],
  { revalidate: 300, tags: ["companies"] }
);

/**
 * La pile d'aperçu dans la langue de la page : lieu, langues de travail,
 * description et sous-secteur. En français, rien ne change.
 */
export async function localiserApercu<T extends { id: string; description: string | null; subsector: string | null; ville: string | null; canton: string | null; codesLangues: string[]; lieu: string; langues: string }>(
  entreprises: T[],
  langue: Langue,
): Promise<T[]> {
  if (langue === "fr") return entreprises;
  const traduites = await localiserEntreprises(entreprises, langue);
  return traduites.map(e => ({
    ...e,
    lieu: lieuAffiche(e.ville, e.canton, langue),
    langues: e.codesLangues.map(l => abregeLangue(l, langue)).join(" · "),
  }));
}
