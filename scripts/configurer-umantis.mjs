// Branche les entreprises qui recrutent avec Umantis (Abacus).
//
//   node scripts/configurer-umantis.mjs
//
// `cantons: true` : entreprise présente seulement en Suisse, toutes ses offres
// sont gardées. Sinon (groupe international), une offre n'est gardée que si
// son lieu est reconnu comme suisse.
// Les hôtels de la Tschuggen Collection partagent un compte : chacun reçoit
// les offres de sa station.
// Écartés : Gruner (aucun lieu publié, bureaux en Allemagne et en Autriche),
// Maxon et Marti (liste vide ou hors Umantis).

import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/).filter(l => l.includes("=")).map(l => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim().replace(/^"|"$/g, "")]));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const SOURCES = [
  ["Atupri", "recruitingapp-2699", { cantons: true }],
  ["Banque Cantonale de Bâle (BKB)", "recruitingapp-2839", { cantons: true }],
  ["Banque cantonale des Grisons (GKB)", "recruitingapp-2607", { cantons: true }],
  ["Basler & Hofmann", "recruitingapp-2852", {}],
  ["Bürgenstock Resort", "recruitingapp-2850", { cantons: true }],
  ["Carlton Hotel St. Moritz", "recruitingapp-2904", { cantons: true, garder: ["St. Moritz"] }],
  ["Hotel Eden Roc", "recruitingapp-2904", { cantons: true, garder: ["Ascona"] }],
  ["Tschuggen Grand Hotel", "recruitingapp-2904", { cantons: true, garder: ["Arosa"] }],
  ["CMSA", "recruitingapp-2890", { cantons: true }],
  ["Energie 360°", "recruitingapp-2785", { cantons: true }],
  ["J. Safra Sarasin", "jsafrasarasin", {}],
  ["KPMG", "recruitingapp-2791", { cantons: true }],
  ["Paraplegiker-Zentrum Nottwil", "recruitingapp-2782", { cantons: true }],
  ["Police neuchâteloise", "recruitingapp-2702", { cantons: true }],
  ["Ricola", "recruitingapp-2747", { cantons: true }],
  ["V-Zug", "recruitingapp-2727", { cantons: true }],
];

const { data: toutes } = await db.from("companies").select("id,name");
const lignes = [];
for (const [nom, hote, options] of SOURCES) {
  const c = toutes.find(x => x.name === nom);
  if (!c) { console.log(`introuvable : ${nom}`); continue; }
  lignes.push({ company_id: c.id, outil: "umantis", params: { base: `https://${hote}.umantis.com`, ...options } });
}
const { error } = await db.from("sources_offres").upsert(lignes, { onConflict: "company_id" });
console.log(error?.message ?? `ok, ${lignes.length} sources`);
