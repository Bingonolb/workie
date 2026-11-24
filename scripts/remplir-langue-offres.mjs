// (Re)calcule la colonne `langue` des offres (langue de l'annonce) et ne
// met à jour que celles qui changent. À relancer si la détection évolue.
// La synchro l'écrit ensuite d'elle-même.
//
//   node scripts/remplir-langue-offres.mjs
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { langueOffre } from "../src/lib/synchroOffres/regles.mjs";
const env = Object.fromEntries(fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/).filter(l => l.includes("=")).map(l => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim().replace(/^"|"$/g, "")]));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const toutes = [];
for (let de = 0; ; de += 1000) {
  const { data, error } = await db.from("job_offers").select("id,title,description,missions,langue").order("id").range(de, de + 999);
  if (error) throw error;
  toutes.push(...data);
  if (data.length < 1000) break;
}
const parLangue = { fr: [], de: [], en: [], it: [] };
for (const o of toutes) parLangue[langueOffre(o.title, o.description ?? o.missions ?? "")].push(o.id);
for (const [langue, ids] of Object.entries(parLangue)) {
  for (let i = 0; i < ids.length; i += 200) {
    const { error } = await db.from("job_offers").update({ langue }).in("id", ids.slice(i, i + 200));
    if (error) throw error;
  }
  console.log(langue, ids.length);
}
