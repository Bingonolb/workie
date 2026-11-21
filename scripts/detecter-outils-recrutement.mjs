// Détecte l'outil de recrutement derrière la page carrière de chaque entreprise.
//
//   node scripts/detecter-outils-recrutement.mjs   → scripts/outils-recrutement.json
//
// Une seule lecture de la page carrière par entreprise, 8 sites à la fois
// (jamais deux requêtes simultanées sur le même site). On cherche, dans
// l'adresse puis dans le HTML, la trace d'un outil qui publie un flux officiel.

import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8")
  .split(/\r?\n/).filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim().replace(/^"|"$/g, "")]));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// Ordre : du plus précis au plus général. Chaque motif capture l'identifiant
// du compte quand c'est possible.
const OUTILS = [
  ["workday", /([a-z0-9-]+)\.(wd\d+)\.myworkdayjobs\.com\/(?:[a-z]{2}-[A-Z]{2}\/)?([A-Za-z0-9_-]+)/],
  ["smartrecruiters", /(?:careers|jobs)\.smartrecruiters\.com\/([A-Za-z0-9_-]+)/],
  ["personio", /([a-z0-9-]+)\.jobs\.personio\.(?:com|de)/],
  ["greenhouse", /(?:boards|job-boards)(?:\.eu)?\.greenhouse\.io\/(?:embed\/job_board\?for=)?([a-z0-9_-]+)/],
  ["lever", /jobs\.(?:eu\.)?lever\.co\/([a-z0-9_-]+)/],
  ["recruitee", /([a-z0-9-]+)\.recruitee\.com/],
  ["workable", /apply\.workable\.com\/([a-z0-9_-]+)/],
  ["teamtailor", /([a-z0-9-]+)\.teamtailor\.com/],
  ["softgarden", /([a-z0-9-]+)\.career\.softgarden\.de/],
  ["successfactors", /(career\d*\.successfactors\.(?:eu|com))[^"'\s]*company=([A-Za-z0-9_]+)|(jobs\.sap\.com)|rmkcdn\.successfactors\.com/],
  ["umantis", /([a-z0-9-]+\.umantis\.com)|recruitingapp-\d+\.umantis\.com/],
  ["refline", /([a-z0-9-]+)\.refline\.ch/],
  ["prospective", /ohws\.prospective\.ch|jobs\.prospective\.ch/],
  ["rexx", /([a-z0-9-]+)\.rexx-systems\.com/],
  ["dualoo", /jobs\.dualoo\.com|dualoo\.com\/portal/],
  ["jobbase", /jobbase\.io|([a-z0-9-]+)\.jobbase\.io/],
  ["avature", /([a-z0-9-]+)\.avature\.net/],
  ["icims", /([a-z0-9-]+)\.icims\.com/],
  ["taleo", /([a-z0-9-]+)\.taleo\.net/],
  ["cornerstone", /([a-z0-9-]+)\.csod\.com/],
  ["phenom", /cdn\.phenompeople\.com|phenompeople/],
  ["jobvite", /jobs\.jobvite\.com\/([a-z0-9_-]+)/],
  ["concludis", /concludis/],
  ["onlyfy", /onlyfy\.(?:jobs|com)/],
  ["join", /join\.com\/companies\/([a-z0-9_-]+)/],
];
// Données structurées des offres (le format que Google lit) : exploitable même sans outil connu.
const JSONLD_OFFRE = /"@type"\s*:\s*"JobPosting"/;

function detecter(url, html) {
  const trouves = [];
  for (const [nom, re] of OUTILS) {
    const m = url.match(re) ?? html.match(re);
    if (m) trouves.push({ outil: nom, indice: m[0].slice(0, 120) });
  }
  return trouves;
}

async function lire(url) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 12000);
  try {
    const r = await fetch(url, { signal: ctl.signal, redirect: "follow", headers: { "User-Agent": "Mozilla/5.0 (compatible; WorkieSync/1.0; +https://www.workie.ch)", "Accept-Language": "fr-CH,fr;q=0.9,de;q=0.8,en;q=0.7" } });
    const html = r.ok ? (await r.text()).slice(0, 1_500_000) : "";
    return { statut: r.status, finale: r.url, html };
  } catch (e) { return { statut: e.name === "AbortError" ? "délai" : "erreur", finale: url, html: "" }; }
  finally { clearTimeout(t); }
}

const { data: entreprises } = await db.from("companies").select("id,name,website_url").not("website_url", "is", null).order("name");
const resultats = [];
let i = 0;
const hotesEnCours = new Set();
async function ouvrier() {
  while (i < entreprises.length) {
    const c = entreprises[i++];
    let hote; try { hote = new URL(c.website_url).host; } catch { resultats.push({ ...c, statut: "adresse invalide", outils: [] }); continue; }
    while (hotesEnCours.has(hote)) await new Promise(r => setTimeout(r, 300));
    hotesEnCours.add(hote);
    const p = await lire(c.website_url);
    hotesEnCours.delete(hote);
    const outils = detecter(p.finale + " " + c.website_url, p.html);
    resultats.push({ id: c.id, nom: c.name, url: c.website_url, finale: p.finale, statut: p.statut, outils, jsonld: JSONLD_OFFRE.test(p.html), protege: /just a moment|cf-chl|captcha/i.test(p.html.slice(0, 20000)) });
    if (resultats.length % 50 === 0) console.log(`${resultats.length}/${entreprises.length}`);
  }
}
await Promise.all(Array.from({ length: 8 }, ouvrier));
fs.writeFileSync(new URL("./outils-recrutement.json", import.meta.url), JSON.stringify(resultats, null, 1));

const parOutil = {};
for (const r of resultats) {
  const o = r.outils[0]?.outil ?? (r.jsonld ? "données structurées" : r.protege ? "protégé" : typeof r.statut === "number" && r.statut < 400 ? "inconnu" : "inaccessible");
  parOutil[o] = (parOutil[o] ?? 0) + 1;
}
console.log("\nRésultat :", Object.entries(parOutil).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(" · "));
