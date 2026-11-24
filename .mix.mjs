import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { langueOffre } from "./src/lib/synchroOffres/regles.mjs";
const env = Object.fromEntries(fs.readFileSync(".env.local", "utf8").split(/\r?\n/).filter(l => l.includes("=")).map(l => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim().replace(/^"|"$/g, "")]));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const DE = /[:*/]in\b|\b(efz|eba|mitarbeiter|verkäufer|leiter|fachfrau|fachmann|lehre|lernende|sachbearbeiter|berater|kauffrau|kaufmann|praktikum)/i;
const FR = /\b(cfc|afp|chef de projet|cheffe|responsable|collaborat|conseill|vendeu|apprenti|gestionnaire|employé)|(euse|rice)\b/i;
const IT = /\b(addett|responsabile|impiegat|apprendista|consulente|autista|montatore)/i;
const titreLangue = t => DE.test(t) ? "de" : IT.test(t) ? "it" : FR.test(t) ? "fr" : null;
const parEnt = new Map(); let mix = 0;
for (let de = 0; ; de += 1000) {
  const { data } = await db.from("job_offers").select("id,title,description,companies(name)").eq("is_active", true).not("description", "is", null).order("id").range(de, de + 999);
  for (const o of data) {
    if ((o.description ?? "").length < 60) continue;
    const lt = titreLangue(o.title); if (!lt) continue;
    const ld = langueOffre("", o.description);
    if (lt !== ld) { mix++; const k = o.companies?.name ?? "?"; const e = parEnt.get(k) ?? { n: 0, ex: [] }; e.n++; if (e.ex.length < 2) e.ex.push(o); parEnt.set(k, e); }
  }
  if (data.length < 1000) break;
}
console.log(`${mix} offres : titre et aperçu dans deux langues`);
for (const [k, e] of [...parEnt].sort((a, b) => b[1].n - a[1].n).slice(0, 25)) for (const o of e.ex.slice(0,1)) console.log(String(e.n).padStart(4), k.padEnd(26), "|", o.title.slice(0, 38), "|", o.description.slice(0, 70));
