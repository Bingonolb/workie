// Passe le nettoyage du texte (encodage réparé, caractères invisibles
// retirés) sur les offres déjà en base. La synchro le fait ensuite d'elle-même.
//
//   node scripts/nettoyer-textes-offres.mjs [--essai]
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { entites } from "../src/lib/synchroOffres/regles.mjs";
const env = Object.fromEntries(fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/).filter(l => l.includes("=")).map(l => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim().replace(/^"|"$/g, "")]));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const essai = process.argv.includes("--essai");
const CHAMPS = ["title", "description", "location", "missions", "requirements", "avantages"];
let n = 0;
for (let de = 0; ; de += 1000) {
  const { data, error } = await db.from("job_offers").select("id," + CHAMPS.join(",")).order("id").range(de, de + 999);
  if (error) throw error;
  for (const o of data) {
    const maj = {};
    for (const k of CHAMPS) if (o[k] && entites(o[k]).replace(/[ \t]+/g, " ") !== o[k].replace(/[ \t]+/g, " ")) maj[k] = entites(o[k]).replace(/[ \t]{2,}/g, " ").trim();
    if (!Object.keys(maj).length) continue;
    if (n < 6) console.log(JSON.stringify(Object.fromEntries(Object.entries(maj).map(([k, v]) => [k, `${o[k].slice(0, 50)} → ${v.slice(0, 50)}`]))));
    n++;
    if (!essai) { const { error: e } = await db.from("job_offers").update(maj).eq("id", o.id); if (e) throw e; }
  }
  if (data.length < 1000) break;
}
console.log(`${n} offres ${essai ? "à nettoyer" : "nettoyées"}`);
