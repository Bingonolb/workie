// Branche les entreprises qui recrutent avec Softgarden.
//
//   node scripts/configurer-softgarden.mjs
//
// Flux public <compte>.career.softgarden.de/jobs.feed.json ; seules les offres
// situées en Suisse sont gardées (Läderach publie aussi l'Allemagne, l'Autriche…).
// K2 Sports et Völkl (compte « elevate-oc ») n'ont aucune offre en Suisse.

import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/).filter(l => l.includes("=")).map(l => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim().replace(/^"|"$/g, "")]));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const SOURCES = [
  ["Cembra Money Bank", "cembra"],
  ["Eberhard Bau", "eberhard"],
  ["Eldora", "eldora-groupeeldora"],
  ["Läderach", "laderach"],
  ["PKZ", "pkzjobs"],
];

const { data: toutes } = await db.from("companies").select("id,name");
const lignes = [];
for (const [nom, compte] of SOURCES) {
  const c = toutes.find(x => x.name === nom);
  if (!c) { console.log(`introuvable : ${nom}`); continue; }
  lignes.push({ company_id: c.id, outil: "softgarden", params: { compte } });
}
const { error } = await db.from("sources_offres").upsert(lignes, { onConflict: "company_id" });
console.log(error?.message ?? `ok, ${lignes.length} sources`);
