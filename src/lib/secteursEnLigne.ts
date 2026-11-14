import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { SECTORS } from "@/lib/types";

/**
 * Les catégories publiées.
 *
 * Luc reprend les fiches catégorie par catégorie depuis l'administration. Une
 * catégorie n'apparaît sur le site qu'une fois terminée et ajoutée à la table
 * `secteurs_en_ligne`. Le reste existe en base, reste visible dans
 * l'administration, mais aucune page publique ne le montre.
 *
 * En base, la politique de lecture de `companies` applique déjà la règle aux
 * clients ordinaires. Le client d'administration la contourne : chaque lecture
 * publique faite avec lui doit donc filtrer par cette liste.
 */
export const getSecteursEnLigne = unstable_cache(
  async (): Promise<string[]> => {
    // Table hors des types générés : lue sans typage.
    const client = createAdminClient() as unknown as {
      from: (t: string) => { select: (c: string) => PromiseLike<{ data: { secteur: string }[] | null; error: unknown }> };
    };
    const { data, error } = await client.from("secteurs_en_ligne").select("secteur");
    // Table illisible : on lève plutôt que de tout cacher, le cache garde la
    // dernière liste valide.
    if (error) throw new Error("secteurs_en_ligne illisible");
    const enLigne = new Set((data ?? []).map(r => r.secteur));
    // Dans l'ordre de la liste officielle, pour les filtres.
    return SECTORS.filter(s => enLigne.has(s));
  },
  ["secteurs-en-ligne"],
  { revalidate: 300, tags: ["companies", "secteurs-en-ligne"] }
);
