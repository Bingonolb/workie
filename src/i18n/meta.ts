import type { Metadata } from "next";
import { OUVERTES, type Langue } from "./config";
import { langueDeLaPage, tServeur } from "./page";
import type { CleMessage } from "./traduire";

/**
 * Les métadonnées d'une page, dans sa langue.
 *
 * Chaque langue a son adresse (workie.ch/explore, workie.ch/de/explore) : la
 * page la déclare comme canonique, et nomme ses équivalents dans les autres
 * langues ouvertes (hreflang). Un moteur de recherche montre alors la version
 * allemande à un lecteur germanophone, sans la prendre pour un doublon.
 */
export const BASE_URL = "https://www.workie.ch";
const LOCALE_OG: Record<Langue, string> = { fr: "fr_CH", de: "de_CH", en: "en_CH", it: "it_CH" };
const OG_IMAGE = `${BASE_URL}/opengraph-image.png`;

/** L'adresse publique d'un chemin dans une langue (« /explore » → « /de/explore »). */
export function adresse(chemin: string, langue: Langue): string {
  const c = chemin === "/" ? "" : chemin;
  return langue === "fr" ? `${BASE_URL}${c}` : `${BASE_URL}/${langue}${c}`;
}

/** Canonique et équivalents dans les autres langues ouvertes. */
export function alternates(chemin: string, langue: Langue): Metadata["alternates"] {
  const languages: Record<string, string> = {};
  for (const l of OUVERTES) languages[l === "fr" ? "fr-CH" : `${l}-CH`] = adresse(chemin, l);
  languages["x-default"] = adresse(chemin, "fr");
  return { canonical: adresse(chemin, langue), languages };
}

export async function meta({ titre, description, chemin, absolu = false, indexer = true, vars }: {
  titre: CleMessage; description?: CleMessage; chemin?: string; absolu?: boolean; indexer?: boolean; vars?: Record<string, string | number>;
}): Promise<Metadata> {
  const [t, langue] = await Promise.all([tServeur(), langueDeLaPage()]);
  const title = t(titre, vars);
  const desc = description ? t(description, vars) : undefined;
  const titreComplet = absolu ? title : `${title} · Workie`;
  return {
    title: absolu ? { absolute: title } : title,
    ...(desc ? { description: desc } : {}),
    ...(indexer ? {} : { robots: { index: false, follow: false } }),
    ...(chemin && indexer ? {
      alternates: alternates(chemin, langue),
      openGraph: {
        title: titreComplet, ...(desc ? { description: desc } : {}), url: adresse(chemin, langue),
        siteName: "Workie", type: "website", locale: LOCALE_OG[langue],
        images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: titreComplet }],
      },
      twitter: { card: "summary_large_image", title: titreComplet, ...(desc ? { description: desc } : {}), images: [OG_IMAGE] },
    } : {}),
  };
}
