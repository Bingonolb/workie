/**
 * Importer une offre d'emploi depuis son lien.
 *
 * On ne lit QUE les données structurées « JobPosting » (schema.org), le format
 * que les sites remplissent pour apparaître dans Google Jobs. Rien d'autre de
 * la page n'est récupéré : pas de menu, pas de pied de page, pas de texte
 * deviné. Si la page n'en contient pas, on le dit, sans jamais importer à
 * moitié.
 *
 * Sécurité (la requête part de nos serveurs) :
 *   - https ou http seulement, ports standards ;
 *   - le nom de domaine est résolu et toute adresse privée, locale ou réservée
 *     est refusée, à chaque redirection (au plus 3) ;
 *   - 10 secondes au plus, 3 Mo au plus ;
 *   - aucun cookie, aucune donnée envoyée.
 *
 * Ce n'est PAS un fichier d'actions serveur : seule l'action de l'espace
 * entreprise l'appelle, après vérification de l'abonnement.
 */
import { lookup } from "dns/promises";
import { isIP } from "net";

export type OffreImportee = {
  title: string;
  description: string | null;
  location: string | null;
  contract_type: string | null;
  work_mode: string | null;
  apply_url: string;
};

const DELAI_MS = 10_000;
const TAILLE_MAX = 3 * 1024 * 1024;
const REDIRECTIONS_MAX = 3;

/* ── Garde réseau ─────────────────────────────────────────────────────────── */

function ipv4Privee(ip: string): boolean {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some(n => Number.isNaN(n))) return true;
  const [a, b] = p;
  return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127)
    || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168) || (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19))
    || a >= 224;
}

function ipv6Privee(ip: string): boolean {
  const x = ip.toLowerCase();
  if (x === "::" || x === "::1") return true;
  if (x.startsWith("fc") || x.startsWith("fd") || x.startsWith("fe8") || x.startsWith("fe9")
    || x.startsWith("fea") || x.startsWith("feb") || x.startsWith("ff")) return true;
  const v4 = x.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  return v4 ? ipv4Privee(v4[1]) : false;
}

async function adresseAutorisee(url: URL): Promise<boolean> {
  if (url.protocol !== "https:" && url.protocol !== "http:") return false;
  if (url.port && url.port !== "443" && url.port !== "80") return false;
  if (url.username || url.password) return false;
  const hote = url.hostname.replace(/^\[|\]$/g, "");
  if (!hote || hote === "localhost" || hote.endsWith(".local") || hote.endsWith(".internal")) return false;
  const verifier = (ip: string) => (isIP(ip) === 6 ? !ipv6Privee(ip) : !ipv4Privee(ip));
  if (isIP(hote)) return verifier(hote);
  try {
    const adresses = await lookup(hote, { all: true });
    return adresses.length > 0 && adresses.every(a => verifier(a.address));
  } catch {
    return false;
  }
}

async function lirePage(depart: string): Promise<{ html: string; url: string } | { erreur: string }> {
  let url: URL;
  try { url = new URL(depart); } catch { return { erreur: "Ce lien n'est pas une adresse valide." }; }

  for (let saut = 0; saut <= REDIRECTIONS_MAX; saut++) {
    if (!(await adresseAutorisee(url))) return { erreur: "Ce lien ne peut pas être lu." };
    const ctrl = new AbortController();
    const minuteur = setTimeout(() => ctrl.abort(), DELAI_MS);
    let rep: Response;
    try {
      rep = await fetch(url, {
        redirect: "manual",
        signal: ctrl.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; WorkieBot/1.0; +https://www.workie.ch)",
          "Accept": "text/html,application/xhtml+xml",
          "Accept-Language": "fr-CH,fr;q=0.9,de;q=0.8,en;q=0.7",
        },
      });
    } catch {
      clearTimeout(minuteur);
      return { erreur: "La page de l'offre ne répond pas. Vérifiez le lien et réessayez." };
    }

    if (rep.status >= 300 && rep.status < 400) {
      clearTimeout(minuteur);
      const suite = rep.headers.get("location");
      if (!suite) return { erreur: "La page de l'offre ne peut pas être lue." };
      url = new URL(suite, url);
      continue;
    }
    if (!rep.ok) {
      clearTimeout(minuteur);
      if (rep.status === 404 || rep.status === 410) return { erreur: "Cette offre n'existe plus à cette adresse." };
      if ([401, 403, 429, 503].includes(rep.status)) return { erreur: "Ce site bloque la lecture automatique de ses offres. Saisissez l'offre ci-dessous : cela prend une minute." };
      return { erreur: "La page de l'offre ne peut pas être lue. Saisissez l'offre ci-dessous." };
    }

    // Lecture plafonnée : on s'arrête à 3 Mo.
    const lecteur = rep.body?.getReader();
    if (!lecteur) { clearTimeout(minuteur); return { erreur: "La page de l'offre est vide." }; }
    const morceaux: Uint8Array[] = [];
    let total = 0;
    try {
      for (;;) {
        const { done, value } = await lecteur.read();
        if (done) break;
        total += value.byteLength;
        if (total > TAILLE_MAX) { await lecteur.cancel(); break; }
        morceaux.push(value);
      }
    } catch {
      clearTimeout(minuteur);
      return { erreur: "La page de l'offre ne répond pas. Réessayez." };
    }
    clearTimeout(minuteur);
    const octets = new Uint8Array(morceaux.reduce((n, m) => n + m.byteLength, 0));
    let i = 0;
    for (const m of morceaux) { octets.set(m, i); i += m.byteLength; }
    return { html: new TextDecoder("utf-8").decode(octets), url: url.toString() };
  }
  return { erreur: "La page de l'offre redirige trop de fois." };
}

/* ── Extraction ───────────────────────────────────────────────────────────── */

const ENTITES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘", laquo: "«", raquo: "»", ndash: "–", hellip: "…", eacute: "é", egrave: "è", agrave: "à", ccedil: "ç", ecirc: "ê", ocirc: "ô", uuml: "ü", ouml: "ö", auml: "ä" };

function decoderEntites(t: string): string {
  return t
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&([a-z]+);/gi, (m, nom) => ENTITES[nom.toLowerCase()] ?? m);
}

/** HTML de l'offre → texte propre : paragraphes et listes conservés, aucun code. */
export function htmlVersTexte(html: string): string {
  let t = decoderEntites(html); // certaines offres encodent leur HTML deux fois
  t = t.replace(/<(script|style|iframe|noscript)[\s\S]*?<\/\1>/gi, " ");
  t = t.replace(/<br\s*\/?>/gi, "\n");
  t = t.replace(/<li[^>]*>/gi, "\n• ");
  // </li> n'ajoute rien : le <li> suivant ouvre déjà sa ligne (pas de ligne vide dans une liste).
  t = t.replace(/<\/(p|div|ul|ol|h[1-6]|section|tr)>/gi, "\n");
  t = t.replace(/<(p|div|h[1-6]|ul|ol|section|tr)[^>]*>/gi, "\n");
  t = t.replace(/<[^>]+>/g, "");
  t = decoderEntites(t);
  t = t.replace(/[ \t ]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return t;
}

type Json = Record<string, unknown>;

function trouverJobPosting(noeud: unknown): Json | null {
  if (Array.isArray(noeud)) {
    for (const n of noeud) { const r = trouverJobPosting(n); if (r) return r; }
    return null;
  }
  if (!noeud || typeof noeud !== "object") return null;
  const o = noeud as Json;
  const type = o["@type"];
  if (type === "JobPosting" || (Array.isArray(type) && type.includes("JobPosting"))) return o;
  if (o["@graph"]) return trouverJobPosting(o["@graph"]);
  return null;
}

function texte(v: unknown): string | null {
  if (typeof v === "string") return v.trim() || null;
  if (v && typeof v === "object" && "name" in (v as Json)) return texte((v as Json).name);
  return null;
}

function lieu(o: Json): string | null {
  const brut = Array.isArray(o.jobLocation) ? o.jobLocation[0] : o.jobLocation;
  const adresse = brut && typeof brut === "object" ? (brut as Json).address : null;
  const a = Array.isArray(adresse) ? adresse[0] : adresse;
  if (a && typeof a === "object") return texte((a as Json).addressLocality) ?? texte((a as Json).addressRegion);
  return typeof a === "string" ? a.trim() || null : null;
}

/** Les types de contrat de schema.org, ramenés à nos libellés. Sans certitude, rien. */
function contrat(v: unknown): string | null {
  const types = (Array.isArray(v) ? v : [v]).map(x => String(x ?? "").toUpperCase());
  if (types.includes("INTERN")) return "Stage";
  if (types.includes("CONTRACTOR")) return "Freelance";
  if (types.includes("TEMPORARY")) return "Temporaire";
  return null; // FULL_TIME ne dit pas si c'est un CDI ou un CDD : on laisse choisir.
}

function organisation(o: Json): string | null {
  const t = String(o.jobLocationType ?? "").toUpperCase();
  return t.includes("TELECOMMUTE") ? "Télétravail" : null;
}

/* ── Microdata (itemtype="schema.org/JobPosting") ─────────────────────────── */

/** Contenu d'un élément, balises imbriquées du même nom comprises. */
function contenuElement(html: string, debut: number): string | null {
  const ouverture = html.slice(debut).match(/^<([a-z0-9]+)\b[^>]*>/i);
  if (!ouverture) return null;
  const nom = ouverture[1].toLowerCase();
  if (["meta", "link", "img", "br", "input"].includes(nom)) return null;
  const re = new RegExp(`<(/?)${nom}\\b[^>]*>`, "gi");
  re.lastIndex = debut + ouverture[0].length;
  let profondeur = 1;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    profondeur += m[1] ? -1 : 1;
    if (profondeur === 0) return html.slice(debut + ouverture[0].length, m.index);
  }
  return null;
}

/** Valeur d'une propriété : attribut content si présent, sinon le contenu de l'élément. */
function propriete(portee: string, nom: string): string | null {
  const m = portee.match(new RegExp(`<[a-z0-9]+\\b[^>]*\\bitemprop=["'](?:[^"']*\\s)?${nom}(?:\\s[^"']*)?["'][^>]*>`, "i"));
  if (!m || m.index === undefined) return null;
  const contenu = m[0].match(/\bcontent=["']([^"']*)["']/i);
  if (contenu) return decoderEntites(contenu[1]).trim() || null;
  const interieur = contenuElement(portee, m.index);
  return interieur === null ? null : interieur;
}

function microdataJobPosting(html: string): Json | null {
  const i = html.search(/itemtype=["']https?:\/\/schema\.org\/JobPosting["']/i);
  if (i < 0) return null;
  const debut = html.lastIndexOf("<", i);
  const portee = contenuElement(html, debut) ?? html.slice(debut, debut + 400_000);
  const titre = propriete(portee, "title");
  if (!titre) return null;
  const textePur = (v: string | null) => (v ? htmlVersTexte(v).replace(/\n+/g, " ").trim() || null : null);
  return {
    "@type": "JobPosting",
    title: textePur(titre),
    description: propriete(portee, "description"),
    employmentType: textePur(propriete(portee, "employmentType")),
    jobLocation: { address: { addressLocality:
      textePur(propriete(portee, "addressLocality"))
      // À défaut, le texte du bloc « lieu », s'il est court (sinon ce n'est pas un lieu).
      ?? (() => { const l = textePur(propriete(portee, "jobLocation")); return l && l.length <= 60 ? l : null; })(),
    } },
  };
}
export async function importerOffreDepuisLien(lien: string): Promise<{ offre?: OffreImportee; erreur?: string }> {
  const brut = lien.trim();
  if (!brut) return { erreur: "Collez le lien de l'offre." };
  const page = await lirePage(/^https?:\/\//i.test(brut) ? brut : `https://${brut}`);
  if ("erreur" in page) return { erreur: page.erreur };

  const blocs = [...page.html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  let jp: Json | null = null;
  for (const b of blocs) {
    try { jp = trouverJobPosting(JSON.parse(b[1].trim())); } catch { /* bloc illisible : on passe au suivant */ }
    if (jp) break;
  }
  // Second format standard : les propriétés posées dans la page elle-même.
  if (!jp) jp = microdataJobPosting(page.html);
  if (!jp) {
    return { erreur: "Cette offre ne peut pas être importée automatiquement : sa page ne contient pas de données lisibles. Remplissez les champs à la main." };
  }

  const titre = texte(jp.title);
  if (!titre) {
    return { erreur: "Cette offre ne peut pas être importée automatiquement : son intitulé est introuvable. Remplissez les champs à la main." };
  }
  const description = typeof jp.description === "string" ? htmlVersTexte(jp.description).slice(0, 4000) || null : null;

  return {
    offre: {
      title: decoderEntites(titre).slice(0, 120),
      description,
      location: lieu(jp)?.slice(0, 80) ?? null,
      contract_type: contrat(jp.employmentType),
      work_mode: organisation(jp),
      apply_url: page.url,
    },
  };
}
