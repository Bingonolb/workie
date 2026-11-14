import { largeurCouverture } from "@/lib/coverUrl";

/**
 * Décide si un logo d'entreprise peut être affiché.
 *
 * Deux raisons, l'une juridique et l'autre technique.
 *
 * Juridique : le logo d'une entreprise est une marque déposée. 588 fiches en
 * affichaient un, récupéré automatiquement chez Clearbit à partir du nom de
 * domaine, sans qu'aucune autorisation n'ait été demandée. Ces valeurs ont été
 * vidées en base et la dérivation automatique retirée d'adminAddCompany.
 *
 * Technique : next/image refuse toute source dont l'hôte n'est pas déclaré dans
 * remotePatterns, et il lève à l'exécution — côté serveur, donc avant que le
 * onError du composant puisse servir de filet. Une seule URL résiduelle sur un
 * hôte non déclaré suffit à faire échouer le rendu de la fiche.
 *
 * Un logo n'est donc affiché que s'il est hébergé chez nous : téléversé depuis
 * l'administration, comme la bannière. Sans logo, les initiales s'affichent.
 */

const HOTES_AUTORISES = [".supabase.co", ".supabase.in"];

/**
 * Le logo est servi redimensionné, comme la bannière : le fichier déposé peut
 * faire 1024 pixels, il s'affiche au plus sur 128. 256 couvre les écrans à
 * densité double.
 */
export const LOGO_LARGEUR = 256;

export function logoAffichable(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const { protocol, hostname } = new URL(url);
    if (protocol !== "https:") return null;
    if (!HOTES_AUTORISES.some(h => hostname.endsWith(h))) return null;
    return largeurCouverture(url, LOGO_LARGEUR);
  } catch {
    // URL relative ou malformée : rien à afficher plutôt qu'un rendu qui casse
    return null;
  }
}
