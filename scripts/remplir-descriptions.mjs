/**
 * Remplit les descriptions d'entreprise depuis leur propre site officiel.
 *
 * Principe : on ne rédige rien. On récupère la balise <meta name="description">
 * du site de l'entreprise — donc son propre texte — et on l'enregistre avec
 * l'URL comme source, vérifiable par n'importe qui.
 *
 * Ce que le script REFUSE d'enregistrer (voir estExploitable) : les textes trop
 * courts, les slogans marketing sans information, les bandeaux cookies et les
 * pages d'erreur. Mieux vaut laisser une fiche vide qu'un texte creux — c'est
 * précisément ce qui avait pourri la base auparavant.
 *
 * Usage :
 *   node scripts/remplir-descriptions.mjs            # traite tout
 *   node scripts/remplir-descriptions.mjs --essai    # simulation, n'écrit rien
 *   node scripts/remplir-descriptions.mjs --max=50   # limite le nombre traité
 *
 * Variables requises (déjà présentes dans .env.local) :
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

// ── Configuration ───────────────────────────────────────────────────────────
const ESSAI = process.argv.includes("--essai");
const MAX = Number(process.argv.find(a => a.startsWith("--max="))?.split("=")[1] ?? Infinity);
const PAUSE_MS = 400;          // politesse : on n'inonde aucun serveur
const TIMEOUT_MS = 12_000;
const LONGUEUR_MIN = 60;
const LONGUEUR_MAX = 600;

// Charge .env.local sans dépendance externe
function chargerEnv() {
  try {
    for (const ligne of readFileSync(".env.local", "utf8").split("\n")) {
      const m = ligne.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch { /* variables déjà dans l'environnement */ }
}
chargerEnv();

const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const CLE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_SUPABASE || !CLE_SERVICE) {
  console.error("NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquante.");
  process.exit(1);
}
const db = createClient(URL_SUPABASE, CLE_SERVICE, { auth: { persistSession: false } });

// ── Extraction ──────────────────────────────────────────────────────────────

function decoderEntites(s) {
  return s
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0*39;/g, "'")
    .replace(/&#x27;/gi, "'").replace(/&#x2F;/gi, "/").replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/&eacute;/g, "é")
    .replace(/&egrave;/g, "è").replace(/&agrave;/g, "à").replace(/&uuml;/g, "ü")
    .replace(/&ouml;/g, "ö").replace(/&auml;/g, "ä").replace(/\s+/g, " ")
    .trim();
}

function extraireDescription(html) {
  // og:description d'abord : souvent mieux rédigée que la meta classique
  const motifs = [
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i,
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i,
  ];
  for (const motif of motifs) {
    const m = html.match(motif);
    if (m?.[1]) {
      const t = decoderEntites(m[1]);
      if (t.length >= LONGUEUR_MIN) return t;
    }
  }
  return null;
}

// Rejette ce qui n'apprend rien au lecteur. Une fiche vide vaut mieux.
const REJETS = [
  /^(accueil|home|willkommen|welcome|startseite)\b/i,
  /cookie|consent|javascript|navigateur|browser/i,
  /\b(404|not found|page introuvable|erreur|error)\b/i,
  /(jetzt|shop now|acheter|kaufen|bestelle|commandez)\b.*(!|✔|→)/i,
  /^[^.]{0,40}$/,                       // slogan sans phrase
];

function estExploitable(texte) {
  if (!texte) return false;
  if (texte.length < LONGUEUR_MIN || texte.length > LONGUEUR_MAX) return false;
  if (REJETS.some(r => r.test(texte))) return false;
  // Au moins trois mots de plus de 4 lettres : filtre les suites de mots-clés
  const motsUtiles = texte.split(/\s+/).filter(m => m.replace(/[^\p{L}]/gu, "").length > 4);
  return motsUtiles.length >= 3;
}

// Domaine enregistrable, pour comparer avant/après redirection
function domaineDe(url) {
  try {
    const h = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    return h.split(".").slice(-2).join(".");
  } catch { return null; }
}

/**
 * Renvoie { html, redirigeAilleurs }.
 *
 * La vérification de domaine n'est pas cosmétique : lors du test, Froriep AG a
 * reçu la description de MLL Legal, son site redirigeant vers le cabinet avec
 * lequel il a fusionné. Sans ce garde-fou, une entreprise absorbée hérite du
 * texte de celle qui l'a rachetée — donc une description fausse.
 */
async function recuperer(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        // Format conventionnel d'un robot qui s'identifie honnêtement
        "User-Agent": "Mozilla/5.0 (compatible; workie.ch/1.0; +https://www.workie.ch)",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "fr-CH,fr;q=0.9,de;q=0.8,en;q=0.7",
      },
    });
    if (!r.ok) return { html: null, redirigeAilleurs: false };
    const depart = domaineDe(url);
    const arrivee = domaineDe(r.url);
    if (depart && arrivee && depart !== arrivee) {
      return { html: null, redirigeAilleurs: true, versDomaine: arrivee };
    }
    return { html: await r.text(), redirigeAilleurs: false };
  } catch {
    return { html: null, redirigeAilleurs: false };
  } finally {
    clearTimeout(t);
  }
}

// ── Traitement ──────────────────────────────────────────────────────────────

const dormir = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const { data: entreprises, error } = await db
    .from("companies")
    .select("id, name, website_url")
    .is("description", null)
    .not("website_url", "is", null)
    .order("score", { ascending: false });

  if (error) { console.error("Lecture impossible :", error.message); process.exit(1); }

  const aTraiter = entreprises.slice(0, MAX);
  console.log(`${entreprises.length} entreprises sans description avec un site.`);
  console.log(`Traitement de ${aTraiter.length}${ESSAI ? " (SIMULATION, aucune écriture)" : ""}.\n`);

  let ecrites = 0, rejetees = 0, injoignables = 0, redirections = 0;

  for (const [i, e] of aTraiter.entries()) {
    const { html, redirigeAilleurs, versDomaine } = await recuperer(e.website_url);

    if (redirigeAilleurs) {
      redirections++;
      console.log(`  ⇢ ${e.name} — redirige vers ${versDomaine}, entité probablement fusionnée : ignorée`);
      await dormir(PAUSE_MS);
      continue;
    }
    if (!html) {
      injoignables++;
      console.log(`  ✗ ${e.name} — site injoignable`);
      await dormir(PAUSE_MS);
      continue;
    }

    const texte = extraireDescription(html);
    if (!estExploitable(texte)) {
      rejetees++;
      console.log(`  – ${e.name} — texte non exploitable, fiche laissée vide`);
      await dormir(PAUSE_MS);
      continue;
    }

    if (!ESSAI) {
      const { error: err } = await db
        .from("companies")
        .update({ description: texte, description_source: e.website_url })
        .eq("id", e.id);
      if (err) { console.log(`  ! ${e.name} — écriture refusée : ${err.message}`); await dormir(PAUSE_MS); continue; }
    }

    ecrites++;
    console.log(`  ✓ ${e.name}\n      ${texte.slice(0, 110)}${texte.length > 110 ? "…" : ""}`);

    if ((i + 1) % 25 === 0) console.log(`\n  … ${i + 1}/${aTraiter.length}\n`);
    await dormir(PAUSE_MS);
  }

  console.log(`\n─────────────────────────────────────────`);
  console.log(`  Écrites          : ${ecrites}`);
  console.log(`  Non exploitables : ${rejetees}   (fiche laissée vide, volontairement)`);
  console.log(`  Redirections     : ${redirections}   (entité fusionnée — à vérifier à la main)`);
  console.log(`  Injoignables     : ${injoignables}`);
  console.log(`─────────────────────────────────────────`);
  if (ESSAI) console.log(`\nSimulation : rien n'a été écrit. Relance sans --essai pour appliquer.`);
}

main().catch(e => { console.error(e); process.exit(1); });
