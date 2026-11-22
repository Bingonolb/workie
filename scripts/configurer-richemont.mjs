// Sépare le portail Workday de Richemont par Maison (champ hiringOrganization).
//
//   node scripts/configurer-richemont.mjs
//
// Ce qui n'appartient à aucune Maison ayant sa fiche (sièges, ValFleurier,
// Campus, Procadrans…) reste au Groupe Richemont.
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = Object.fromEntries(fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/).filter(l => l.includes("=")).map(l => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim().replace(/^"|"$/g, "")]));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const MAISONS = "cartier|vacheron|jaeger|van cleef|ateliers horlogers de vca|piaget|panerai|roger dubuis";
const SOURCES = [
  ["Groupe Richemont", `^(?!.*(${MAISONS})).*(richemont|rlg|campus|valfleurier|db 1868|procadrans|timevall|ams|fondation haute)`],
  ["Cartier", "cartier"],
  ["Vacheron Constantin", "vacheron"],
  ["Jaeger-LeCoultre", "jaeger"],
  ["Van Cleef & Arpels", "van cleef|ateliers horlogers de vca"],
  ["Piaget", "piaget"],
  ["Panerai", "panerai"],
  ["Roger Dubuis", "roger dubuis"],
];
const { data: toutes } = await db.from("companies").select("id,name");
const lignes = [];
for (const [nom, employeur] of SOURCES) {
  const c = toutes.find(x => x.name === nom);
  if (!c) { console.log(`introuvable : ${nom}`); continue; }
  lignes.push({ company_id: c.id, outil: "workday", params: { hote: "richemont.wd3.myworkdayjobs.com", tenant: "richemont", site: "richemont", employeur }, actif: true });
}
const { error } = await db.from("sources_offres").upsert(lignes, { onConflict: "company_id" });
console.log(error?.message ?? `ok, ${lignes.length} sources`);
