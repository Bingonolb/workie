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

/**
 * Les couvertures hebergees chez nous, a la largeur voulue.
 *
 * Les bannieres reprises a la main sont deposees dans le stockage Supabase, a
 * la taille ou elles ont ete envoyees : jusqu'a 2560 pixels, et 1,8 Mo pour
 * l'une d'elles. Elles partaient telles quelles, sur une vignette de 56 pixels
 * comme sur une carte de telephone. La page d'accueil en prechargeait dix.
 *
 * Supabase sait les redimensionner a la volee : meme fichier, adresse de
 * rendu au lieu de l'adresse brute. Mesure sur une couverture de la pile :
 * 343 Ko en original, 134 Ko a 940 pixels.
 *
 * Le service est facture au nombre d'images d'origine transformees, pas au
 * nombre d'affichages : le catalogue en compte quelques centaines, et chacune
 * n'est transformee qu'une fois par largeur avant d'etre servie depuis le
 * cache.
 */
const SUPABASE_BRUT = "/storage/v1/object/public/";
const SUPABASE_RENDU = "/storage/v1/render/image/public/";

export function estSupabase(url: string): boolean {
  return url.includes(SUPABASE_BRUT) || url.includes(SUPABASE_RENDU);
}

function supabaseALaLargeur(url: string, w: number): string {
  const base = url.split("?")[0].replace(SUPABASE_BRUT, SUPABASE_RENDU);
  return `${base}?width=${w}&quality=72&resize=contain`;
}

/** Vrai quand la source sait servir la largeur qu'on lui demande. */
export function estRedimensionnable(url: string): boolean {
  return estPexels(url) || estSupabase(url);
}

/** Même image à la largeur voulue, quelle que soit sa provenance connue. */
export function largeurCouverture(url: string, w: number): string {
  if (estPexels(url)) return aLaLargeur(url, w);
  if (estSupabase(url)) return supabaseALaLargeur(url, w);
  return url;
}
