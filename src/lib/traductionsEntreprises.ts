import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Langue } from "@/i18n/config";

/**
 * La description et le sous-secteur d'une fiche dans la langue du visiteur.
 *
 * Le français reste la source, dans `companies`. Les autres langues vivent à
 * part, dans `entreprises_traductions`, écrites fiche par fiche. Une fiche sans
 * traduction garde son texte français : jamais un champ vide.
 *
 * Toutes les traductions d'une langue tiennent en une seule lecture (quelques
 * centaines de kilo-octets), gardée en cache : appliquer la langue à une page
 * de résultats ne coûte alors aucune requête de plus.
 */

type Traduction = { description: string | null; subsector: string | null };

const lireTraductions = unstable_cache(
  async (langue: string): Promise<Record<string, Traduction>> => {
    const admin = createAdminClient();
    const carte: Record<string, Traduction> = {};
    for (let de = 0; de < 100000; de += 1000) {
      const { data, error } = await admin
        .from("entreprises_traductions" as never)
        .select("company_id, description, subsector")
        .eq("langue", langue)
        .range(de, de + 999);
      if (error) throw error;
      const lignes = (data ?? []) as unknown as ({ company_id: string } & Traduction)[];
      for (const l of lignes) carte[l.company_id] = { description: l.description, subsector: l.subsector };
      if (lignes.length < 1000) break;
    }
    return carte;
  },
  ["entreprises-traductions-v1"],
  { revalidate: 300, tags: ["companies"] },
);

/** Les fiches, avec description et sous-secteur dans la langue demandée quand ils existent. */
export async function localiserEntreprises<T extends { id: string; description?: string | null; subsector?: string | null }>(
  entreprises: T[],
  langue: Langue,
): Promise<T[]> {
  if (langue === "fr" || entreprises.length === 0) return entreprises;
  const carte = await lireTraductions(langue).catch(() => ({} as Record<string, Traduction>));
  return entreprises.map(c => {
    const t = carte[c.id];
    if (!t) return c;
    return {
      ...c,
      ...("description" in c && t.description ? { description: t.description } : {}),
      ...("subsector" in c && t.subsector ? { subsector: t.subsector } : {}),
    };
  });
}

export async function localiserEntreprise<T extends { id: string; description?: string | null; subsector?: string | null }>(
  entreprise: T | null,
  langue: Langue,
): Promise<T | null> {
  if (!entreprise) return entreprise;
  return (await localiserEntreprises([entreprise], langue))[0];
}
