#!/usr/bin/env node
/**
 * Cherche, pour chaque entreprise, la page d'offres d'emploi de son site
 * officiel.
 *
 * ── Pourquoi un script ──────────────────────────────────────────────────────
 *
 * La méthode fiable est celle qu'on applique à la main : ouvrir le site de
 * l'entreprise et lire *son propre* lien « Carrière ». On ne devine jamais une
 * adresse, parce qu'une adresse inventée qui répond 404 est pire que l'accueil
 * du site. Mille et douze entreprises, c'est la même opération mille fois : le
 * script la répète, il ne l'invente pas.
 *
 * Il ne modifie rien en base. Il produit un fichier de propositions, à relire
 * avant d'appliquer quoi que ce soit.
 *
 * ── Règles ──────────────────────────────────────────────────────────────────
 *
 * · Uniquement le site officiel de l'entreprise. Jamais un site d'annonces
 *   (jobup, jobs.ch, indeed, LinkedIn) : la liste NON_OFFICIELS les écarte,
 *   même si le site officiel pointe vers eux.
 * · Le français d'abord quand il existe, sinon l'allemand ou l'anglais : la
 *   Suisse alémanique n'a souvent pas de version française, et la page
 *   allemande vaut mieux que rien.
 * · On préfère ce qui mène aux postes eux-mêmes (« offres », « postes
 *   vacants », « offene Stellen ») à une page de présentation d'employeur.
 * · Toute adresse retenue est vérifiée : si elle ne répond pas 200, elle est
 *   écartée et l'entreprise reste à traiter à la main.
 *
 *   node scripts/trouver-pages-carriere.mjs            # toutes
 *   node scripts/trouver-pages-carriere.mjs --limite 50
 *   node scripts/trouver-pages-carriere.mjs --secteur "Commerce de détail"
 */

import fs from "node:fs";
import path from "node:path";

// ── Les fiches curées à la main, qu'on ne touche jamais ─────────────────────
const INTOUCHABLES = new Set([
  "Administration fédérale suisse", "État de Genève", "État de Vaud",
  "Office fédéral de la santé publique (OFSP)", "Office fédéral de la statistique (OFS)",
  "PUBLICA - Caisse fédérale de pensions", "SECO - Secrétariat d'État à l'économie",
  "Secrétariat d'État aux migrations (SEM)", "Tribunal fédéral",
  "Ville de Berne", "Ville de Genève", "Ville de Lausanne", "Ville de Zurich",
  "Anicom AG", "Agroscope", "Biofarm Genossenschaft", "Bio Suisse",
  "Demeter Suisse", "LANDI Suisse SA", "Helvetia Nostra",
]);

const NON_OFFICIELS = /(jobup|jobs\.ch|jobscout24|indeed|linkedin|glassdoor|monster|stepstone|xing|jobagent|jobcloud|ostjob|jobwinner)/i;

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";
const DELAI_MS = 12000;
const PARALLELE = 12;

const args = process.argv.slice(2);
const opt = (nom, defaut) => {
  const i = args.indexOf(nom);
  return i === -1 ? defaut : args[i + 1];
};

// ── Environnement ───────────────────────────────────────────────────────────
function lireEnv() {
  const chemin = path.join(process.cwd(), ".env.local");
  const brut = fs.readFileSync(chemin, "utf8");
  const val = cle => {
    const m = brut.match(new RegExp(`^${cle}=(.*)$`, "m"));
    return m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
  };
  return { url: val("NEXT_PUBLIC_SUPABASE_URL"), cle: val("SUPABASE_SERVICE_ROLE_KEY") };
}

async function recuperer(url, options = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), DELAI_MS);
  try {
    return await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": UA, "Accept-Language": "fr-CH,fr;q=0.9,de;q=0.8,en;q=0.7" },
      signal: ctrl.signal,
      ...options,
    });
  } finally {
    clearTimeout(t);
  }
}

/**
 * Note un lien candidat. Plus c'est haut, plus c'est proche de « la liste des
 * postes ouverts, en français, sur le site de l'entreprise ».
 */
function noter(texte, href) {
  const t = `${texte} ${href}`.toLowerCase();
  let n = 0;

  // Des mots qui contiennent « emploi » ou « stelle » sans parler de travail.
  // Constaté à l'essai : Carl F. Bucherer proposait ses « modes d'emploi »,
  // c'est-à-dire les notices de ses montres, et GVB sa « Fachstelle
  // Brandschutz », un service de protection incendie. En allemand, -stelle
  // est un suffixe courant qui ne désigne pas un poste.
  if (/(mode.?d.emploi|modes-d.emploi|notice|manuel|emploi du temps|gebrauchsanweisung)/.test(t)) return -1;
  if (/(fachstelle|beratungsstelle|meldestelle|anlaufstelle|dienststelle|leitstelle|poststelle|tankstelle|baustelle|zahlstelle|pruefstelle|prüfstelle|schnittstelle)/.test(t)) return -1;

  // Est-ce seulement une piste d'emploi ? « stelle » doit être un mot, pas la
  // fin d'un mot composé.
  if (!/(jobs?|emplois?|carri[eè]re|karriere|stellen?|offene stellen|arbeiten bei|vacatur|recrut|rejoign|nous-rejoindre|work-with-us|talent)/.test(t)) return -1;

  // Ce qui mène aux postes eux-mêmes plutôt qu'à une page de présentation.
  if (/(offene stellen|offres d.emploi|offres-d-emploi|postes vacants|open positions|nos offres|toutes les offres|stellenangebote|stellenmarkt|vacancies)/.test(t)) n += 40;
  if (/(offre|stellen|vacan|position|postul|apply|bewerb)/.test(t)) n += 15;

  // La langue.
  if (/(\/fr\b|\/fr\/|lang=fr|[?&]l=fr|emploi|carri[eè]re|francais)/.test(t)) n += 25;
  else if (/(\/de\b|\/de\/|karriere|stelle|arbeiten)/.test(t)) n += 8;

  // Un sous-domaine dédié est presque toujours le portail de recrutement.
  if (/^https?:\/\/(jobs|job|career|careers|karriere|emplois|emploi|recruit|talent)\./.test(href)) n += 20;

  // Ce qui n'est pas une offre d'emploi.
  if (/(vêtements de travail|arbeitskleidung|workwear|jobticket|jobrad)/.test(t)) return -1;
  if (/(lehre|apprenti|ausbildung|stage|praktikum)/.test(t)) n -= 10; // utile, mais moins général

  // Ce qui parle du recrutement sans lister de poste. Constaté à l'essai :
  // Aldi renvoyait vers « Conseils pour poser une candidature » et Manor vers
  // « JobAbo », l'abonnement aux alertes. Les deux sont des pages d'emploi,
  // aucune n'est une offre.
  if (/(conseil|tipps|ratgeber|jobabo|job-abo|alerte|newsletter|abonn|s.abonner|faq|pourquoi nous|why us|notre culture|unsere kultur|candidature spontan|spontanbewerbung)/.test(t)) n -= 45;

  return n;
}

/** Le domaine enregistrable, pour comparer deux adresses. */
function domaine(url) {
  try {
    const h = new URL(url).hostname.replace(/^www\./, "");
    const p = h.split(".");
    return p.length > 2 ? p.slice(-2).join(".") : h;
  } catch { return null; }
}

function absolu(href, base) {
  try { return new URL(href, base).href; } catch { return null; }
}

/** Extrait les liens d'une page, sans dépendance externe. */
function liens(html, base) {
  const out = [];
  const re = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const href = absolu(m[1], base);
    if (!href || !/^https?:/.test(href)) continue;
    const texte = m[2].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    out.push({ href, texte });
  }
  return out;
}

/** Signale une description manifestement inutilisable. */
function descriptionSuspecte(d) {
  if (!d || d.trim().length < 40) return "trop courte ou absente";
  const t = d.toLowerCase();
  if (/(livraison gratuite|dès chf|à partir de \d+ chf|commandez|profitez|meilleur prix|-\d+%|achetez)/.test(t)) return "accroche publicitaire";
  // Allemand : mots-outils qui n'existent pas en français.
  if (/\b(und|für|mit|sie|wir|unser|unsere|bei|aus|kunden|angebot|zwischen)\b/.test(t)) return "rédigée en allemand";
  if (/\b(the|and|with|our|for|you|company)\b/.test(t) && !/\b(le|la|les|des|une|est|dans)\b/.test(t)) return "rédigée en anglais";
  return null;
}

async function traiter(entreprise) {
  const { id, name, website_url, description, sector } = entreprise;
  const base = { id, nom: name, secteur: sector, site: website_url, defaut_description: descriptionSuspecte(description) };

  if (!website_url) return { ...base, statut: "sans site" };

  let html, urlFinale;
  try {
    const r = await recuperer(website_url);
    urlFinale = r.url;
    if (!r.ok) return { ...base, statut: `site injoignable (${r.status})` };
    html = await r.text();
  } catch (e) {
    return { ...base, statut: `site injoignable (${e.name === "AbortError" ? "délai dépassé" : e.message})` };
  }

  const candidats = liens(html, urlFinale)
    .filter(l => !NON_OFFICIELS.test(l.href))
    .map(l => ({ ...l, note: noter(l.texte, l.href) }))
    .filter(l => l.note > 0)
    .sort((a, b) => b.note - a.note);

  if (candidats.length === 0) return { ...base, statut: "aucun lien carrière trouvé" };

  // On vérifie les meilleurs, dans l'ordre, et on garde le premier qui répond.
  for (const c of candidats.slice(0, 4)) {
    try {
      const r = await recuperer(c.href);
      if (r.ok) {
        // Une filiale renvoie souvent vers le portail de sa maison mère : le
        // site de Denner mène à jobs.migros.ch. La page est valide, mais elle
        // n'est pas celle de cette entreprise-là. On la propose en la
        // signalant, jamais comme acquise.
        // Retomber sur l'accueil du site n'est pas une trouvaille : Sopra
        // Steria remontait ainsi sa propre page d'accueil.
        const chemin = new URL(r.url).pathname.replace(/\/+$/, "");
        const sousDomaineEmploi = /^(jobs|job|career|careers|karriere|emplois|emploi|recruit|talent)\./.test(new URL(r.url).hostname.replace(/^www\./, ""));
        if (chemin === "" && !sousDomaineEmploi) continue;

        const memeMaison = domaine(r.url) === domaine(urlFinale);
        return {
          ...base,
          statut: memeMaison ? "trouvé" : "trouvé mais domaine différent",
          page_carriere: r.url,
          libelle: c.texte.slice(0, 60),
          note: c.note,
          ...(memeMaison ? null : { domaine_site: domaine(urlFinale), domaine_page: domaine(r.url) }),
        };
      }
    } catch { /* on essaie le suivant */ }
  }
  return { ...base, statut: "liens carrière tous injoignables", pistes: candidats.slice(0, 3).map(c => c.href) };
}

// ── Programme ───────────────────────────────────────────────────────────────
const { url: URL_SUPABASE, cle: CLE } = lireEnv();
if (!URL_SUPABASE || !CLE) {
  console.error("  Impossible de lire NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY dans .env.local");
  process.exit(1);
}

const limite = Number(opt("--limite", "0"));
const secteur = opt("--secteur", null);

let requete = `${URL_SUPABASE}/rest/v1/companies?select=id,name,sector,website_url,description&order=name.asc`;
if (secteur) requete += `&sector=eq.${encodeURIComponent(secteur)}`;
if (limite) requete += `&limit=${limite}`;

const rep = await fetch(requete, { headers: { apikey: CLE, Authorization: `Bearer ${CLE}` } });
if (!rep.ok) {
  console.error(`  Lecture des entreprises impossible : ${rep.status} ${await rep.text()}`);
  process.exit(1);
}
const toutes = await rep.json();
const aTraiter = toutes.filter(e => !INTOUCHABLES.has(e.name));
console.log(`  ${toutes.length} entreprises lues, ${toutes.length - aTraiter.length} intouchables écartées, ${aTraiter.length} à examiner.\n`);

const resultats = [];
let faits = 0;
async function ouvrier(file) {
  while (file.length) {
    const e = file.shift();
    const r = await traiter(e);
    resultats.push(r);
    faits++;
    if (faits % 25 === 0) process.stdout.write(`  ${faits}/${aTraiter.length}\r`);
  }
}
const file = [...aTraiter];
await Promise.all(Array.from({ length: PARALLELE }, () => ouvrier(file)));

resultats.sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
const sortie = path.join(process.cwd(), "scripts", "pages-carriere.json");
fs.writeFileSync(sortie, JSON.stringify(resultats, null, 2), "utf8");

const parStatut = resultats.reduce((acc, r) => ((acc[r.statut] = (acc[r.statut] ?? 0) + 1), acc), {});
console.log("\n  Résultat :");
for (const [s, n] of Object.entries(parStatut).sort((a, b) => b[1] - a[1])) console.log(`    ${String(n).padStart(5)}  ${s}`);
const suspectes = resultats.filter(r => r.defaut_description).length;
console.log(`\n    ${String(suspectes).padStart(5)}  descriptions à revoir`);
console.log(`\n  Propositions écrites dans ${path.relative(process.cwd(), sortie)}. Rien n'a été modifié en base.\n`);
