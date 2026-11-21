// Branche les entreprises qui recrutent avec rexx (portail jobs.<entreprise>.ch).
//
//   node scripts/configurer-rexx.mjs
//
// Chaque langue d'un portail rexx ne liste que ses offres : on lit le
// français et l'allemand. Le portail du groupe Frutiger est partagé : chaque
// société reçoit les offres dont l'employeur (bloc JobPosting) porte son nom.
// Écartés : Matterhorn Gotthard Bahn et WWF Suisse (pas de liste rexx lisible).

import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/).filter(l => l.includes("=")).map(l => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim().replace(/^"|"$/g, "")]));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const FRUTIGER = ["https://jobs.frutiger.com/fr", "https://jobs.frutiger.com/de"];
const SOURCES = [
  ["AMAG", ["https://jobs-retail.amag.ch/fr", "https://jobs-retail.amag.ch/de"]],
  ["Frutiger", FRUTIGER, "^frutiger"],
  ["Balmholz", FRUTIGER, "balmholz"],
  ["Balzan + Immer", FRUTIGER, "balzan"],
  ["Belloni", FRUTIGER, "belloni"],
  ["BSL Baustofflabor", FRUTIGER, "^bsl"],
  ["Diamantbohr", FRUTIGER, "diamantbohr"],
  ["e-therm", FRUTIGER, "e-therm"],
  ["Greuter", FRUTIGER, "greuter"],
  ["Moll", FRUTIGER, "^moll"],
  ["Emil Frey", ["https://jobs.emilfrey.ch/fr", "https://jobs.emilfrey.ch/de"]],
  ["Globus", ["https://jobs.globus.ch/offre-emplois.html", "https://jobs.globus.ch/stellenangebote.html"]],
  ["GVB", ["https://jobs.gvb.ch/fr", "https://jobs.gvb.ch/de"]],
  ["Helion Energy", ["https://jobs.helion.ch/fr/", "https://jobs.helion.ch/de/"]],
  ["hostettler", ["https://jobs.hostettler.com/offre-emplois.html", "https://jobs.hostettler.com/stellenangebote.html"]],
  ["Hypothekarbank Lenzburg", ["https://jobs.hbl.ch/stellenangebote.html"]],
  ["Rahn+Bodmer Co.", ["https://jobs.rahnbodmer.ch/stellenangebote.html"]],
  ["Rega", ["https://rega-jobs.ch/"]],
  ["Schellenberg Wittmer", ["https://careers.swlegal.ch/fr", "https://careers.swlegal.ch/de"]],
  ["SR Technics", ["https://www.srtechnics-jobs.com/job-offers.html"]],
  ["Swisspearl", ["https://jobs.swisspearl.com/de", "https://jobs.swisspearl.com/fr"]],
  ["Walder Wyss", ["https://jobs.walderwyss.com/job-offers.html"]],
];

const { data: toutes } = await db.from("companies").select("id,name");
const lignes = [];
for (const [nom, liste, employeur] of SOURCES) {
  const c = toutes.find(x => x.name === nom);
  if (!c) { console.log(`introuvable : ${nom}`); continue; }
  lignes.push({ company_id: c.id, outil: "rexx", params: { liste, ...(employeur ? { employeur } : {}) } });
}
const { error } = await db.from("sources_offres").upsert(lignes, { onConflict: "company_id" });
console.log(error?.message ?? `ok, ${lignes.length} sources`);
