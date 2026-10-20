import type { CSSProperties } from "react";

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
  // Qualite 80 et non 72.
  //
  // A 72, le reencodage ajoutait son propre flou a une photo deja nette :
  // les bannieres paraissaient mediocres alors que les originaux sont en
  // 2560 pixels. Mesure sur une banniere du catalogue : 52 Ko a 1280/72,
  // 65 Ko a 1280/80, pour une image qui redevient franche.
  return `${base}?width=${w}&quality=80&resize=contain`;
}

/** Vrai quand la source sait servir la largeur qu'on lui demande. */
export function estRedimensionnable(url: string): boolean {
  return estPexels(url) || estSupabase(url);
}

/**
 * Le jeu de densites d'un fond CSS : la meme image en simple et en double
 * densite, laissant le navigateur choisir.
 *
 * Un fond CSS n'a pas de srcset. La banniere d'une fiche etait donc servie en
 * 1280 pixels a tout le monde, y compris sur un ecran de 1900 pixels a densite
 * double, ou elle etait agrandie trois fois. C'est ce qu'on voyait : une photo
 * nette a l'origine, molle a l'arrivee.
 */
export function fondDensite(url: string, largeur: number): string {
  if (!estRedimensionnable(url)) return `url(${url})`;
  const un = largeurCouverture(url, largeur);
  const deux = largeurCouverture(url, Math.min(largeur * 2, 2560));
  return `image-set(url(${un}) 1x, url(${deux}) 2x)`;
}

/**
 * Même image à la largeur voulue, quelle que soit sa provenance connue.
 *
 * Le cadrage voyage dans l'adresse (voir plus bas) : il est retiré ici, et
 * quand la bannière est zoomée, la largeur demandée augmente d'autant. Une
 * photo agrandie deux fois à l'écran doit être téléchargée deux fois plus
 * large, sans quoi le zoom la rendrait floue.
 */
export function largeurCouverture(url: string, w: number): string {
  const { src, cadrage } = lireCadrage(url);
  const largeur = Math.min(Math.round(w * cadrage.zoom), 2560);
  if (estPexels(src)) return aLaLargeur(src, largeur);
  if (estSupabase(src)) return supabaseALaLargeur(src, largeur);
  return src;
}

/* ── Cadrage de la bannière ─────────────────────────────────────────────────
 *
 * Une bannière est affichée dans des formats très différents : un bandeau
 * très allongé sur la fiche, une carte presque carrée dans la grille, une
 * carte en hauteur dans le swipe. Recadrée au centre, elle coupait souvent ce
 * qui comptait.
 *
 * Le cadrage ne modifie jamais le fichier : il dit seulement quel point de la
 * photo garder au centre, et de combien l'agrandir. L'original reste intact,
 * on peut changer d'avis autant qu'on veut, et rien n'est réencodé.
 *
 * Il est écrit à la fin de l'adresse, après un dièse :
 *   https://…/photo.webp#cadrage=40,25,1.3
 * Le navigateur n'envoie jamais ce qui suit le dièse au serveur d'images, donc
 * l'adresse reste valable telle quelle. Et le cadrage suit la bannière partout
 * où elle circule, sans toucher aux droits de lecture de la table, qui sont
 * accordés colonne par colonne.
 */
export type Cadrage = {
  /** Point gardé au centre, de 0 (bord gauche) à 100 (bord droit). */
  x: number;
  /** Point gardé au centre, de 0 (haut) à 100 (bas). */
  y: number;
  /** 1 = la photo remplit le cadre, 2 = agrandie deux fois. */
  zoom: number;
};

export const CADRAGE_NEUTRE: Cadrage = { x: 50, y: 50, zoom: 1 };
export const ZOOM_MAX = 2.5;

const borner = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function lireCadrage(url: string): { src: string; cadrage: Cadrage } {
  const [src, fragment = ""] = url.split("#");
  const m = /(?:^|&)cadrage=([\d.]+),([\d.]+),([\d.]+)/.exec(fragment);
  if (!m) return { src, cadrage: CADRAGE_NEUTRE };
  return {
    src,
    cadrage: {
      x: borner(Number(m[1]), 0, 100),
      y: borner(Number(m[2]), 0, 100),
      zoom: borner(Number(m[3]), 1, ZOOM_MAX),
    },
  };
}

export function estNeutre(c: Cadrage): boolean {
  return Math.round(c.x) === 50 && Math.round(c.y) === 50 && Math.abs(c.zoom - 1) < 0.01;
}

/** L'adresse avec son cadrage, ou sans s'il n'apporte rien. */
export function avecCadrage(url: string, c: Cadrage): string {
  const { src } = lireCadrage(url);
  if (!src || estNeutre(c)) return src;
  return `${src}#cadrage=${Math.round(c.x)},${Math.round(c.y)},${c.zoom.toFixed(2)}`;
}

/**
 * Le style à poser sur une image en `object-fit: cover`.
 *
 * `object-position` choisit ce qui reste visible, et l'agrandissement se fait
 * autour du même point : zoomer ne déplace donc pas ce qu'on a choisi.
 */
export function styleCadrage(url: string | null | undefined): CSSProperties {
  if (!url) return {};
  const { cadrage: c } = lireCadrage(url);
  if (estNeutre(c)) return {};
  const origine = `${c.x}% ${c.y}%`;
  return {
    objectPosition: origine,
    ...(c.zoom > 1 ? { transform: `scale(${c.zoom})`, transformOrigin: origine } : {}),
  };
}

/** La même chose pour une image posée en fond CSS. */
export function styleCadrageFond(url: string | null | undefined): CSSProperties {
  if (!url) return {};
  const { cadrage: c } = lireCadrage(url);
  if (estNeutre(c)) return {};
  const origine = `${c.x}% ${c.y}%`;
  return {
    backgroundPosition: origine,
    ...(c.zoom > 1 ? { transform: `scale(${c.zoom})`, transformOrigin: origine } : {}),
  };
}
