// Synchronisation des offres en ligne de commande (« on synchronise »).
//
//   node scripts/synchro-offres.mjs              → toutes les sources actives
//   node scripts/synchro-offres.mjs julius       → une entreprise (nom partiel)
//   node scripts/synchro-offres.mjs --essai      → lit, compare, n'écrit rien
//   node scripts/synchro-offres.mjs --complet    → relit tout le détail (nouvelles règles d'aperçu)
//
// Le moteur est dans src/lib/synchroOffres/moteur.mjs. La même passe tourne
// chaque nuit sur Vercel (src/app/api/cron/synchro-offres).

import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { synchroniserTout } from "../src/lib/synchroOffres/moteur.mjs";

const fichierEnv = new URL("../.env.local", import.meta.url);
const env = fs.existsSync(fichierEnv)
  ? Object.fromEntries(fs.readFileSync(fichierEnv, "utf8").split(/\r?\n/).filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim().replace(/^"|"$/g, "")]))
  : process.env;
if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Clés Supabase absentes (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).");
  process.exit(1);
}

const args = process.argv.slice(2);
const essai = args.includes("--essai");
const b = await synchroniserTout({
  client: createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } }),
  essai,
  complet: args.includes("--complet"),
  filtre: args.find(a => !a.startsWith("--")),
});

console.log(`\n${b.entreprises} entreprises${essai ? " (essai, rien écrit)" : ""} · ${b.offres} offres en Suisse`);
console.log(`+ ${b.ajoutees} nouvelles   ~ ${b.modifiees} modifiées   − ${b.fermees} fermées   · ${b.erreurs.length} en erreur`);
for (const r of b.details) {
  console.log(`\n  ${r.entreprise} (${r.lues}) : +${r.ajoutees.length} ~${r.modifiees} −${r.fermees.length}`);
  for (const t of r.ajoutees.slice(0, 3)) console.log(`      + ${t}`);
  for (const t of r.fermees.slice(0, 3)) console.log(`      − ${t}`);
}
for (const r of b.erreurs) console.log(`\n  ⚠ ${r.entreprise} (${r.outil}) : ${r.erreur}`);
console.log(`\nTerminé en ${b.duree} s`);
if (b.echec) process.exitCode = 1;
