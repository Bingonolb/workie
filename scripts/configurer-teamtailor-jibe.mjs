// Branche les entreprises sur Teamtailor (flux RSS) et Jibe (Aon, AXA).
//
//   node scripts/configurer-teamtailor-jibe.mjs
//
// Teamtailor : seules les offres situées en Suisse (Axpo publie aussi la Pologne…).
// Jibe : le lien publié est la page de l'offre, jamais « apply_url » (connexion).

import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/).filter(l => l.includes("=")).map(l => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim().replace(/^"|"$/g, "")]));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const SOURCES = [
  ["Axpo", "teamtailor", { site: "https://careers.axpo.com" }],
  ["Badrutt's Palace Hotel", "teamtailor", { site: "https://jobs.badruttscareers.com" }],
  ["Fondation Eben-Hézer", "teamtailor", { site: "https://recrutement.eben-hezer.ch" }],
  ["MKS PAMP", "teamtailor", { site: "https://careers.mkspamp.com" }],
  ["Aon", "jibe", { site: "https://jobs.aon.com", filtre: "location=Switzerland", page: "https://jobs.aon.com/jobs" }],
  ["AXA Suisse", "jibe", { site: "https://careers.axa.com", filtre: "tags3=AXA%20Switzerland", page: "https://careers.axa.com/careers-home/jobs" }],
];

const { data: toutes } = await db.from("companies").select("id,name");
const lignes = [];
for (const [nom, outil, params] of SOURCES) {
  const c = toutes.find(x => x.name === nom);
  if (!c) { console.log(`introuvable : ${nom}`); continue; }
  lignes.push({ company_id: c.id, outil, params });
}
const { error } = await db.from("sources_offres").upsert(lignes, { onConflict: "company_id" });
console.log(error?.message ?? `ok, ${lignes.length} sources`);
