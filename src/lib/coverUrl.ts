/**
 * Manipulation des URL de bannière. Module volontairement neutre — ni
 * « use client » ni « use server ».
 *
 * Ces fonctions vivaient dans CoverImage.tsx, marqué « use client ». Le serveur
 * ne peut pas appeler une fonction exportée d'un module client : le rendu de la
 * fiche entreprise levait « Attempted to call largeurCouverture() from the
 * server », renvoyait une coquille vide, et les mesures de performance
 * paraissaient excellentes précisément parce que la page ne rendait rien.
 */

export function estPexels(url: string): boolean {
  return url.startsWith("https://images.pexels.com/");
}

/** Remplace la largeur dans une URL Pexels sans toucher aux autres paramètres. */
export function aLaLargeur(url: string, w: number): string {
  const h = Math.round((w * 9) / 16);
  return url.replace(/([?&])w=\d+/, `$1w=${w}`).replace(/([?&])h=\d+/, `$1h=${h}`);
}

/** Même URL à la largeur voulue. Sans effet sur les sources non-Pexels. */
export function largeurCouverture(url: string, w: number): string {
  return estPexels(url) ? aLaLargeur(url, w) : url;
}
