/**
 * Écrit le site officiel d'entreprises nommément listées, après vérification.
 *
 * Différence avec trouver-sites.mjs : ici le domaine n'est pas deviné à partir
 * du nom. Il est fourni explicitement dans un fichier de correspondances, parce
 * que deviner est précisément ce qui avait rattaché rosier.ch — un rosiériste —
 * à « Rosier Automobiles ».
 *
 * Le script reste méfiant sur ce qu'on lui donne. Il refuse d'écrire si :
 *   - le domaine ne répond pas ;
 *   - la page est une page de vente ou de parking ;
 *   - la redirection sort du domaine de départ (entité rachetée : le lien
 *     mènerait alors chez le repreneur, pas chez l'entreprise de la fiche).
 *
 * Le contrôle par mots-clés du nom n'est volontairement PAS appliqué : « Apple
 * Retail Switzerland GmbH » pointe sur apple.com, dont la page d'accueil ne
 * contient ni « retail » ni « switzerland ». Ce sont les correspondances écrites
 * à la main qui portent la responsabilité du rattachement.
 *
 * Usage :
 *   node scripts/poser-sites.mjs sites/lot1.json --essai
 *   node scripts/poser-sites.mjs sites/lot1.json
 *
 * Format du fichier : { "Nom exact en base": "https://…", … }
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const ESSAI = process.argv.includes("--essai");
const FICHIER = process.argv[2];
if (!FICHIER || FICHIER.startsWith("--")) {
  console.error("Usage : node scripts/poser-sites.mjs <fichier.json> [--essai]");
  process.exit(1);
}

const TIMEOUT_MS = 12_000;
const PARALLELE = 8;

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

const REVENDEURS = /(hugedomains|sedo\.com|afternic|dan\.com|domainmarket|parkingcrew|bodis\.com|undeveloped|spaceship\.com|namecheap)/i;
const SIGNAUX_PARKING = /(domain (is|may be) for sale|buy this domain|diese website steht zum verkauf|ce domaine est à vendre|domain (is )?parked)/i;

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
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "fr-CH,fr;q=0.9,de;q=0.8,en;q=0.7",
      },
    });
    // 403/406 : blocage anti-robot. Le site existe, on l'accepte.
    if (!r.ok && ![403, 406].includes(r.status)) return { ok: false, motif: `http ${r.status}` };

    const depart = domaineDe(url), arrivee = domaineDe(r.url);
    if (depart && arrivee && depart !== arrivee) {
      return { ok: false, motif: `redirige vers ${arrivee}` };
    }
    if (REVENDEURS.test(r.url)) return { ok: false, motif: "domaine en vente" };

    if (r.ok) {
      const html = (await r.text()).slice(0, 40_000);
      if (SIGNAUX_PARKING.test(html)) return { ok: false, motif: "page de parking" };
    }
    return { ok: true, urlFinale: r.url };
  } catch (e) {
    return { ok: false, motif: e.cause?.code ?? e.name };
  } finally { clearTimeout(t); }
}

async function main() {
  const corresp = JSON.parse(readFileSync(FICHIER, "utf8"));
  const entrees = Object.entries(corresp);
  console.log(`${entrees.length} correspondances${ESSAI ? " (SIMULATION)" : ""}.\n`);

  let ecrites = 0;
  const refusees = [], absentes = [];

  for (let i = 0; i < entrees.length; i += PARALLELE) {
    const tranche = entrees.slice(i, i + PARALLELE);
    const res = await Promise.all(tranche.map(async ([nom, url]) => [nom, url, await verifier(url)]));

    for (const [nom, url, v] of res) {
      if (!v.ok) { refusees.push(`${nom} — ${url} — ${v.motif}`); continue; }
      if (ESSAI) { ecrites++; console.log(`  ✓ ${nom}\n      ${url}`); continue; }

      const { data, error } = await db.from("companies")
        .update({ website_url: url }).eq("name", nom).is("website_url", null).select("id");
      if (error) { refusees.push(`${nom} — écriture refusée : ${error.message}`); continue; }
      if (!data?.length) { absentes.push(nom); continue; }
      ecrites++;
      console.log(`  ✓ ${nom}\n      ${url}`);
    }
  }

  console.log(`\n─────────────────────────────`);
  console.log(`  Écrites  : ${ecrites}`);
  console.log(`  Refusées : ${refusees.length}`);
  console.log(`  Sans correspondance en base : ${absentes.length}`);
  console.log(`─────────────────────────────`);
  refusees.forEach(l => console.log(`  ✗ ${l}`));
  absentes.forEach(l => console.log(`  ? ${l}`));
}

main().catch(e => { console.error(e); process.exit(1); });
