// Branche les sites carrière Phenom (recherche publique /widgets).
//
//   node scripts/configurer-phenom.mjs
//
// DHL n'a pas de filtre de pays (7 900 offres dans le monde) : pas branché.
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = Object.fromEntries(fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/).filter(l => l.includes("=")).map(l => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim().replace(/^"|"$/g, "")]));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const CH = { country: ["Switzerland"] };
const SOURCES = [
  ["Givaudan", { hote: "careers.givaudan.com", chemin: "global/fr", langue: "fr_global", filtre: CH }],
  ["Sunrise", { hote: "careers.sunrise.ch", chemin: "de/de", langue: "de_de", pays: "de", toutSuisse: true }],
  ["Allianz Suisse", { hote: "careers.allianz.com", chemin: "ch/fr", langue: "fr_ch", pays: "ch", filtre: CH, employeur: "Allianz Suisse" }],
  ["Boston Consulting Group (BCG)", { hote: "careers.bcg.com", chemin: "global/en", langue: "en_global", filtre: CH }],
];
const { data: toutes } = await db.from("companies").select("id,name");
const lignes = [];
for (const [nom, params] of SOURCES) {
  const c = toutes.find(x => x.name === nom);
  if (!c) { console.log(`introuvable : ${nom}`); continue; }
  lignes.push({ company_id: c.id, outil: "phenom", params, actif: true });
}
const { error } = await db.from("sources_offres").upsert(lignes, { onConflict: "company_id" });
console.log(error?.message ?? `ok, ${lignes.length} sources`);
