import { revalidatePath } from "next/cache";
import { OUVERTES } from "@/i18n/config";

/**
 * Invalide une page dans toutes les langues ouvertes.
 *
 * Les pages vivent sous /<langue>/… (le middleware y sert chaque adresse) :
 * `revalidatePath("/explore")` ne toucherait plus aucune version en cache.
 *
 *  - un modèle avec son type (« /entreprise/[slug] », "page") : toutes les
 *    pages de ce modèle, toutes langues ;
 *  - un chemin concret (« /explore », « /company/123 ») : sa version dans
 *    chaque langue.
 */
export function revaliderPage(chemin: string, type?: "page" | "layout"): void {
  const suite = chemin === "/" ? "" : chemin;
  if (type) { revalidatePath(`/[lang]${suite}`, type); return; }
  for (const lang of OUVERTES) revalidatePath(`/${lang}${suite}`);
}
