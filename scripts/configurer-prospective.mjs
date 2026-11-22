// Branche les entreprises qui recrutent avec Prospective (outil suisse).
//
//   node scripts/configurer-prospective.mjs
//
// Les groupes (Coop, fenaco) publient toutes leurs sociétés dans un même flux.
// Une société du flux qui a sa propre fiche Workie (Fust, Interdiscount…)
// reçoit ses offres ; le reste du groupe va à la fiche du parent. Les fiches
// protégées (Anicom, LANDI…) ne reçoivent rien.

import fs from "node:fs";
import https from "node:https";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/).filter(l => l.includes("=")).map(l => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim().replace(/^"|"$/g, "")]));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const AGENT = "Mozilla/5.0 (compatible; WorkieSync/1.0; +https://www.workie.ch)";
const lire = u => new Promise((ok, ko) => https.get(u, { headers: { "User-Agent": AGENT } }, r => { let s = ""; r.on("data", d => s += d); r.on("end", () => ok(JSON.parse(s))); }).on("error", ko));

const PROTEGEES = ["Administration fédérale suisse", "Anicom AG", "LANDI Suisse SA", "Agroscope", "Biofarm Genossenschaft", "Bio Suisse", "Demeter Suisse", "Helvetia Nostra"];
const { data: toutes } = await db.from("companies").select("id,name");
const sansForme = n => n.toLowerCase().replace(/\s+(ag|sa|gmbh|genossenschaft)$/, "").trim();
const trouver = n => toutes.find(c => c.name.toLowerCase() === n.toLowerCase()) ?? toutes.find(c => sansForme(c.name) === sansForme(n));

// Noms du flux qui désignent une fiche Workie sous un autre nom.
const ALIAS = { "Ramseier Suisse AG": "Ramseier", "Provins": "Provins Valais" };
// Sociétés du flux à n'attribuer à personne : elles ont leur propre flux
// (Transgourmet, Volg), ou ce sont des coopératives LANDI indépendantes dont
// la fiche est protégée.
const AILLEURS = n => /^(transgourmet|volg$)/i.test(n) || /^landi\b/i.test(n);

// Les comptes propres d'abord : une entreprise qui a son propre flux le garde.
const PROPRES = [["Banque Cantonale Bernoise (BCBE)", "1509"], ["Banque cantonale de Lucerne (LUKB)", "660"], ["Bühler", "1008005"], ["Halter", "1005677"], ["HSLU", "1005622"], ["KPT Krankenkasse", "1007102"], ["Université de Zurich (UZH)", "1002007"], ["Volg", "1006840"], ["ZHAW", "1002929"], ["Transgourmet", "1003623"], ["KPMG", "1693"]];
const lignes = [];
for (const [nom, medium] of PROPRES) {
  const c = trouver(nom);
  if (!c) { console.log(`  introuvable : ${nom}`); continue; }
  // Bühler recrute dans le monde entier : le pays réel est dans son filtre
  // « Localisation » (attribut 20). Les autres ne recrutent qu'en Suisse.
  lignes.push({ company_id: c.id, outil: "prospective", params: c.name === "Bühler" ? { medium, attributPays: "20" } : { medium, cantons: true } });
}
for (const [medium, attribut, parent] of [["1000103", "70", "Coop"], ["1001859", "30", "fenaco"]]) {
  const a = (await lire(`https://ohws.prospective.ch/public/v1/medium/${medium}/attributes?lang=fr&returnValuesAsArray=1`)).attributes.find(x => x.id === attribut);
  const parSociete = new Map();
  const nulle = [];
  for (const nom of Object.values(a.values)) {
    if (AILLEURS(nom)) { nulle.push(nom); continue; }
    const c = trouver(ALIAS[nom] ?? nom);
    if (!c || c.name === parent) continue;
    if (!parSociete.has(c.id)) parSociete.set(c.id, { c, noms: [] });
    parSociete.get(c.id).noms.push(nom);
  }
  const exclues = [...nulle, ...[...parSociete.values()].flatMap(p => p.noms)];
  for (const { c, noms } of parSociete.values()) {
    if (PROTEGEES.includes(c.name)) { console.log(`  protégée, rien : ${c.name}`); continue; }
    if (lignes.some(l => l.company_id === c.id)) continue; // a déjà son propre flux
    lignes.push({ company_id: c.id, outil: "prospective", params: { medium, attribut, garder: noms, cantons: true } });
    console.log(`  ${c.name} ← ${noms.join(", ")}`);
  }
  lignes.push({ company_id: trouver(parent).id, outil: "prospective", params: { medium, attribut, exclure: exclues, cantons: true } });
  console.log(`${parent} ← le reste du groupe (${exclues.length} sociétés écartées : propre fiche, propre flux ou protégées)`);
}
const { error } = await db.from("sources_offres").upsert(lignes, { onConflict: "company_id" });
console.log(error?.message ?? `ok, ${lignes.length} sources`);
