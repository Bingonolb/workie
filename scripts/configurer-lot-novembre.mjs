// Sources ajoutées le 2026-11-23 (outils déjà connus, comptes repérés sur les
// pages carrière).
//
//   node scripts/configurer-lot-novembre.mjs
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = Object.fromEntries(fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/).filter(l => l.includes("=")).map(l => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim().replace(/^"|"$/g, "")]));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const SOURCES = [
  ["Erne", "prospective", { medium: "1005350", cantons: true }],
  ["Syngenta International", "smartrecruiters", { compte: "syngentagroup" }],
  // Maxon recrute aussi en Allemagne : seules les offres situées en Suisse.
  ["Maxon", "umantis", { base: "https://recruitingapp-5631.de.umantis.com" }],
  ["ÖKK Assurances", "umantis", { base: "https://jobs.oekk.ch", cantons: true }],
  // Swiss TPH publie aussi ses postes en Afrique et en Asie.
  ["Swiss TPH", "umantis", { base: "https://jobs.swisstph.ch" }],
  ["Baur au Lac", "umantis", { base: "https://career.hkeag.ch", cantons: true }],
];
const { data: toutes } = await db.from("companies").select("id,name");
const lignes = [];
for (const [nom, outil, params] of SOURCES) {
  const c = toutes.find(x => x.name === nom);
  if (!c) { console.log(`introuvable : ${nom}`); continue; }
  lignes.push({ company_id: c.id, outil, params, actif: true });
}
const { error } = await db.from("sources_offres").upsert(lignes, { onConflict: "company_id" });
console.log(error?.message ?? `ok, ${lignes.length} sources`);
