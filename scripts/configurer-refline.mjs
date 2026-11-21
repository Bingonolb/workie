// Branche les entreprises qui recrutent avec Refline (outil suisse).
//
//   node scripts/configurer-refline.mjs
//
// Chaque compte Refline a un numéro (apply.refline.ch/<numéro>/search.html).
// Le lieu et le pays de chaque offre viennent de son bloc JobPosting.
// La police lucernoise partage le compte du canton de Lucerne : seules les
// offres de la « Luzerner Polizei » lui reviennent.
// Écartée pour l'instant : ZKB (liste chargée en JavaScript, sans flux public).

import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/).filter(l => l.includes("=")).map(l => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim().replace(/^"|"$/g, "")]));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const SOURCES = [
  ["Banque cantonale de Zoug", "254093"],
  ["Burckhardt Immobilien", "403125"],
  ["Caritas Suisse", "126757"],
  ["Careum Bildungszentrum", "581731"],
  ["Eawag", "673277"],
  ["FHNW", "655298"],
  ["Hiestand", "940351"],
  ["Institut fédéral de recherches WSL", "273855"],
  ["Pfister", "424626"],
  ["Pistor", "901734"],
  ["Police lucernoise", "891537", { exiger: "luzerner polizei|polizei luzern" }],
  ["PSI", "673278"],
  ["SIB", "499599"],
  ["Trisa", "972853"],
  ["Zweifel Pomy-Chips", "452630"],
];

const { data: toutes } = await db.from("companies").select("id,name");
const lignes = [];
for (const [nom, compte, options = {}] of SOURCES) {
  const c = toutes.find(x => x.name === nom);
  if (!c) { console.log(`introuvable : ${nom}`); continue; }
  lignes.push({ company_id: c.id, outil: "refline", params: { compte, ...options } });
}
const { error } = await db.from("sources_offres").upsert(lignes, { onConflict: "company_id" });
console.log(error?.message ?? `ok, ${lignes.length} sources`);
