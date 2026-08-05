/**
 * Vérifie que chaque website_url en base est joignable ET appartient bien à
 * l'entreprise à laquelle il est rattaché.
 *
 * Motif : trouver-sites.mjs déduit des domaines à partir du nom. Il a rattaché
 * rosier.ch à « Rosier Automobiles » — c'est un rosiériste — et raeberag.ch à
 * « Räber AG Landbau » — c'est un magasin de meubles. Le contrôle par mots-clés
 * ne suffit pas quand le nom lui-même est le piège.
 *
 * Ce script ne corrige rien : il liste ce qui est douteux, pour décision.
 *
 * Usage : node scripts/verifier-sites.mjs [--max=N]
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const MAX = Number(process.argv.find(a => a.startsWith("--max="))?.split("=")[1] ?? Infinity);
const TIMEOUT_MS = 10_000;
const PAUSE_MS = 120;

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

const SUFFIXES = /\b(sa|ag|gmbh|s[àa]rl|llc|ltd|inc|holding|group|groupe|international|suisse|switzerland|schweiz|svizzera)\b/gi;

function motsCles(nom) {
  return nom.normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(SUFFIXES, " ").replace(/[^a-zA-Z0-9\s]/g, " ")
    .toLowerCase().split(/\s+/).filter(m => m.length >= 4);
}

function domaineDe(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase().split(".").slice(-2).join(".");
  } catch { return null; }
}

async function verifier(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal, redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "text/html", "Accept-Language": "fr-CH,fr;q=0.9,de;q=0.8",
      },
    });
    if (!r.ok) return { statut: "http_" + r.status };
    const html = (await r.text()).slice(0, 80_000);
    const titre = (html.match(/<title[^>]*>([^<]{0,120})/i)?.[1] ?? "").trim();
    return { statut: "ok", urlFinale: r.url, html, titre };
  } catch (e) {
    return { statut: e.name === "AbortError" ? "timeout" : "injoignable" };
  } finally { clearTimeout(t); }
}

const dormir = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const { data, error } = await db.from("companies")
    .select("id, name, website_url, description_source")
    .not("website_url", "is", null).order("name");
  if (error) { console.error(error.message); process.exit(1); }

  const aTraiter = data.slice(0, MAX);
  console.log(`${aTraiter.length} sites à vérifier.\n`);

  const morts = [], douteux = [], redirections = [];

  for (const e of aTraiter) {
    const r = await verifier(e.website_url);

    if (r.statut !== "ok") {
      morts.push(`${e.name}  [${r.statut}]  ${e.website_url}`);
      await dormir(PAUSE_MS);
      continue;
    }

    const depart = domaineDe(e.website_url);
    const arrivee = domaineDe(r.urlFinale);
    if (depart !== arrivee) redirections.push(`${e.name}  ${depart} → ${arrivee}  « ${r.titre} »`);

    // La page doit mentionner l'entreprise : sinon le domaine est un homonyme.
    const texte = r.html.toLowerCase().replace(/<[^>]+>/g, " ");
    const cles = motsCles(e.name);
    const trouves = cles.filter(c => texte.includes(c)).length;
    if (cles.length > 0 && trouves === 0) {
      douteux.push(`${e.name}  ${e.website_url}  « ${r.titre} »`);
    }

    await dormir(PAUSE_MS);
  }

  const bloc = (titre, lignes) => {
    console.log(`\n── ${titre} (${lignes.length}) ──`);
    lignes.forEach(l => console.log("  " + l));
  };
  bloc("INJOIGNABLES", morts);
  bloc("AUCUNE MENTION DE L'ENTREPRISE — homonyme probable", douteux);
  bloc("REDIRECTIONS HORS DOMAINE — fusion ou rachat", redirections);
}

main().catch(e => { console.error(e); process.exit(1); });
