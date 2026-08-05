/**
 * Retrouve le site officiel des entreprises qui n'en ont pas en base.
 *
 * Beaucoup de fiches sans URL sont de vraies entreprises connues — École
 * hôtelière de Lausanne, Oracle Switzerland, Groupe Mutuel, Clinique La
 * Prairie. Il leur manque seulement une donnée que personne n'a saisie.
 *
 * Méthode : on déduit des domaines candidats à partir du nom, on les teste,
 * et on ne retient un domaine QUE si la page renvoyée mentionne réellement
 * l'entreprise. Sans cette vérification, on rattacherait des homonymes — le
 * piège qui avait donné la description d'un centre commercial à un internat.
 *
 * Usage :
 *   node scripts/trouver-sites.mjs --essai --max=40
 *   node scripts/trouver-sites.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const ESSAI = process.argv.includes("--essai");
const MAX = Number(process.argv.find(a => a.startsWith("--max="))?.split("=")[1] ?? Infinity);
const PAUSE_MS = 250;
const TIMEOUT_MS = 8000;

function chargerEnv() {
  try {
    for (const l of readFileSync(".env.local", "utf8").split("\n")) {
      const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch { /* déjà dans l'environnement */ }
}
chargerEnv();

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } });

// ── Génération des domaines candidats ───────────────────────────────────────

const SUFFIXES_JURIDIQUES = /\b(sa|ag|gmbh|s[àa]rl|llc|ltd|inc|holding|group|groupe|international|suisse|switzerland|schweiz|svizzera|\(suisse\)|\(schweiz\))\b/gi;

function normaliser(nom) {
  return nom
    .normalize("NFD").replace(/[̀-ͯ]/g, "")   // accents
    .replace(/&/g, " et ")
    .replace(SUFFIXES_JURIDIQUES, " ")
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function candidats(nom) {
  const base = normaliser(nom);
  if (!base) return [];
  const mots = base.split(" ").filter(Boolean);
  const formes = new Set();

  formes.add(mots.join(""));            // ecolehoteliere
  formes.add(mots.join("-"));           // ecole-hoteliere
  if (mots.length > 1) formes.add(mots.slice(0, 2).join(""));
  if (mots.length > 1) formes.add(mots.slice(0, 2).join("-"));
  formes.add(mots[0]);                  // premier mot seul
  // Sigle : ehl à partir de « ecole hoteliere lausanne »
  if (mots.length >= 2) formes.add(mots.map(m => m[0]).join(""));

  const urls = [];
  for (const f of formes) {
    if (f.length < 3 || f.length > 40) continue;
    urls.push(`https://www.${f}.ch`, `https://${f}.ch`, `https://www.${f}.com`, `https://${f}.com`);
  }
  return urls;
}

// ── Vérification ────────────────────────────────────────────────────────────

/** Mots significatifs du nom, pour confirmer que la page parle bien d'elle. */
function motsCles(nom) {
  return normaliser(nom).split(" ")
    .filter(m => m.length >= 4)
    .slice(0, 4);
}

async function tester(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal, redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; workie.ch/1.0; +https://www.workie.ch)",
        "Accept": "text/html", "Accept-Language": "fr-CH,fr;q=0.9,de;q=0.8",
      },
    });
    if (!r.ok) return null;
    const html = (await r.text()).slice(0, 60_000);
    return { url: r.url, html };
  } catch { return null; }
  finally { clearTimeout(t); }
}

/**
 * Domaines en vente ou stationnés. Ils affichent le nom recherché — puisqu'ils
 * vendent précisément ce nom — et passaient donc la vérification par mots-clés.
 * Constaté sur Sygnum Bank, rattachée à une page de vente HugeDomains.
 */
const REVENDEURS = /(hugedomains|sedo\.com|afternic|dan\.com|domainmarket|parkingcrew|bodis\.com|undeveloped|namecheap|godaddy\.com\/domain)/i;

const SIGNAUX_PARKING = /(this domain (is|may be) for sale|buy this domain|domain (is )?parked|cette page est en construction|under construction|coming soon|acheter ce domaine)/i;

/**
 * Le domaine n'est retenu que si la page mentionne l'entreprise. C'est ce qui
 * évite de rattacher un homonyme — un cabinet américain à un façonnier suisse,
 * un centre commercial à un internat.
 */
function correspond(html, nom, urlFinale) {
  if (REVENDEURS.test(urlFinale)) return false;
  if (SIGNAUX_PARKING.test(html)) return false;
  // Une page trop maigre n'est pas un vrai site d'entreprise
  const texte = html.toLowerCase().replace(/<script[\s\S]*?<\/script>/g, " ")
                    .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (texte.length < 300) return false;

  const cles = motsCles(nom);
  if (cles.length === 0) return false;
  const trouves = cles.filter(c => texte.includes(c)).length;
  return trouves >= Math.min(2, cles.length);
}

// ── Traitement ──────────────────────────────────────────────────────────────

const dormir = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const { data: entreprises, error } = await db
    .from("companies").select("id, name, city")
    .is("website_url", null)
    .order("score", { ascending: false });
  if (error) { console.error(error.message); process.exit(1); }

  const aTraiter = entreprises.slice(0, MAX);
  console.log(`${entreprises.length} entreprises sans site. Traitement de ${aTraiter.length}${ESSAI ? " (SIMULATION)" : ""}.\n`);

  let trouves = 0, echecs = 0;

  for (const e of aTraiter) {
    let retenu = null;
    for (const url of candidats(e.name)) {
      const r = await tester(url);
      if (r && correspond(r.html, e.name, r.url)) { retenu = r.url; break; }
      await dormir(80);
    }

    if (retenu) {
      trouves++;
      if (!ESSAI) await db.from("companies").update({ website_url: retenu }).eq("id", e.id);
      console.log(`  ✓ ${e.name}\n      ${retenu}`);
    } else {
      echecs++;
    }
    await dormir(PAUSE_MS);
  }

  console.log(`\n──────────────────────────────`);
  console.log(`  Sites trouvés : ${trouves}`);
  console.log(`  Sans résultat : ${echecs}`);
  console.log(`──────────────────────────────`);
  if (ESSAI) console.log(`\nSimulation : rien écrit.`);
}

main().catch(e => { console.error(e); process.exit(1); });
