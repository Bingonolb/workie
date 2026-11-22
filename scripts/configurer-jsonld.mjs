// Branche les sites carrière « maison » qui publient leurs offres au format
// JobPosting (repérés par scripts/sonder-jsonld.mjs).
//
//   node scripts/configurer-jsonld.mjs
//
// `motif` : le chemin des liens d'offre sur la page de liste. Chaque page
// d'offre est lue pour son bloc JobPosting ; sans bloc, le lien est ignoré.

import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/).filter(l => l.includes("=")).map(l => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim().replace(/^"|"$/g, "")]));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const SOURCES = [
  ["Banque cantonale de Saint-Gall (SGKB)", "https://www.sgkb.ch/de/ueber-uns/karriere/stellenangebote", "/stellenangebote/\\d+-"],
  ["Banque cantonale de Thurgovie (TKB)", "https://www.tkb.ch/ueber-uns/karriere/stellenangebote", "/stellenangebote/.+"],
  ["Banque Migros", "https://jobs.migros.ch/fr/nos-entreprises/banque-migros/postes-vacants", "/job/"],
  ["Denner", "https://jobs.migros.ch/fr/nos-entreprises/denner-sa/postes-vacants", "/job/"],
  ["Elsa", "https://jobs.migros.ch/fr/nos-entreprises/elsa-group/postes-vacants", "/job/"],
  ["Migros", "https://jobs.migros.ch/fr/nos-entreprises/groupe-migros/postes-vacants", "/job/"],
  ["CSS Assurance", "https://jobs.css.ch/?lang=fr", "/(emplois-vacantes|offene-stellen|posti-vacanti)/.+/[0-9a-f-]{36}"],
  ["Crédit Agricole (CACEIS)", "https://groupecreditagricole.jobs/fr/nos-offres/localisations/176/", "/nos-offres-emploi/\\d"],
  ["CSEM", "https://www.csem.ch/fr/emplois/", "/emplois/\\d+"],
  ["Helvetic Airways", "https://career.helvetic.com/", "vacanc"],
  ["Implement Consulting Group", "https://implementconsultinggroup.com/join-us/jobs?location=Zurich", "/job/[0-9a-f-]{36}"],
  ["Mandarin Oriental Genève", "https://careers.mandarinoriental.com/jobs/search?page=1&query=geneva", "/jobs/.+geneva"],
  ["Moser Vernet & Cie", "https://www.moservernet.ch/offres-demploi/", "/jobs/"],
  ["Munich Re", "https://careers.munichre.com/en/search-jobs?alrpm=2658434", "/job/(zurich|geneva|basel|bern)"],
  ["Orell Füssli", "https://karriere.orellfuessli.ch/de/offene-stellen", "/offene-stellen/.+"],
  ["Rugenbräu", "https://www.rugenbraeu.ch/de/offene-stellen/", "/stellenangebote/"],
  ["SRG SSR", "https://jobs.srgssr.ch/", "/offene-stellen/.+/"],
  ["Touring Club Suisse (TCS)", "https://www.tcs.ch/fr/le-tcs/emplois-carriere/offres-emploi/", "/emplois-carriere/job/"],
  ["True Wealth", "https://www.truewealth.ch/fr/emplois", "/jobs"],
];

const { data: toutes } = await db.from("companies").select("id,name");
const lignes = [];
for (const [nom, liste, motif] of SOURCES) {
  const c = toutes.find(x => x.name === nom);
  if (!c) { console.log(`introuvable : ${nom}`); continue; }
  lignes.push({ company_id: c.id, outil: "jsonld", params: { liste, motif } });
}
const { error } = await db.from("sources_offres").upsert(lignes, { onConflict: "company_id" });
console.log(error?.message ?? `ok, ${lignes.length} sources`);
