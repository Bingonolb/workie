#!/usr/bin/env node
/**
 * Test de charge en lecture seule sur le goulot réel : la base.
 *
 * Les pages elles-mêmes sont servies depuis le cache du réseau de diffusion,
 * qui absorbe n'importe quel trafic sans jamais réveiller notre code. Ce qui
 * peut réellement céder sous la charge, c'est ce qui interroge Postgres à
 * chaque appel : le mélange de l'explorateur, la recherche, la fiche
 * entreprise.
 *
 * On mesure donc ces trois-là, en parallèle, à la concurrence demandée.
 * Aucune écriture : le test ne modifie rien et ne peut rien casser.
 *
 *   node scripts/test-de-charge.mjs               # 30 en parallèle, 300 appels
 *   node scripts/test-de-charge.mjs 60 600
 */

import fs from "node:fs";
import path from "node:path";

const PARALLELE = Number(process.argv[2] ?? 30);
const APPELS = Number(process.argv[3] ?? 300);

const brut = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
const val = c => (brut.match(new RegExp(`^${c}=(.*)$`, "m")) ?? [])[1]?.trim().replace(/^["']|["']$/g, "");
const URL_BASE = val("NEXT_PUBLIC_SUPABASE_URL");
const CLE = val("SUPABASE_SERVICE_ROLE_KEY");
if (!URL_BASE || !CLE) { console.error("  .env.local incomplet"); process.exit(1); }

const entetes = { apikey: CLE, Authorization: `Bearer ${CLE}`, "Content-Type": "application/json" };

/** Les trois requêtes que fait vraiment l'application. */
const SCENARIOS = [
  {
    nom: "explorateur (mélange + page)",
    lancer: () => fetch(`${URL_BASE}/rest/v1/rpc/lister_entreprises_melangees`, {
      method: "POST", headers: entetes,
      body: JSON.stringify({ graine: Math.floor(Math.random() * 1e6), secteur: null, canton_filtre: null, decalage: Math.floor(Math.random() * 20) * 24, taille: 24 }),
    }),
  },
  {
    nom: "recherche par nom",
    lancer: () => {
      const mots = ["nestle", "migros", "banque", "clinique", "tech", "geneve", "sa"];
      return fetch(`${URL_BASE}/rest/v1/rpc/rechercher_entreprises`, {
        method: "POST", headers: entetes,
        body: JSON.stringify({ terme: mots[Math.floor(Math.random() * mots.length)], nb: 10 }),
      });
    },
  },
  {
    nom: "classement (30 premières)",
    lancer: () => fetch(`${URL_BASE}/rest/v1/companies?select=id,name,sector,city,canton,avg_rating,review_count,score&order=score.desc&limit=30`, { headers: entetes }),
  },
];

function percentiles(v) {
  const t = [...v].sort((a, b) => a - b);
  const p = q => t[Math.min(t.length - 1, Math.floor(q * t.length))];
  return { median: p(0.5), p90: p(0.9), p99: p(0.99), max: t[t.length - 1] };
}

async function mesurer(scenario) {
  const durees = [];
  const erreurs = {};
  let restants = APPELS;

  async function ouvrier() {
    while (restants-- > 0) {
      const t0 = performance.now();
      try {
        const r = await scenario.lancer();
        await r.arrayBuffer();
        const d = performance.now() - t0;
        if (r.ok) durees.push(d);
        else erreurs[`HTTP ${r.status}`] = (erreurs[`HTTP ${r.status}`] ?? 0) + 1;
      } catch (e) {
        erreurs[e.name === "AbortError" ? "délai" : e.message.slice(0, 40)] = (erreurs[e.message?.slice(0, 40)] ?? 0) + 1;
      }
    }
  }

  const debut = performance.now();
  await Promise.all(Array.from({ length: PARALLELE }, ouvrier));
  const total = (performance.now() - debut) / 1000;

  const p = durees.length ? percentiles(durees) : null;
  console.log(`\n  ${scenario.nom}`);
  console.log(`    ${durees.length} réussis, ${Object.values(erreurs).reduce((a, b) => a + b, 0)} en échec, en ${total.toFixed(1)} s`);
  console.log(`    débit          ${(durees.length / total).toFixed(0)} requêtes/s`);
  if (p) {
    console.log(`    médiane        ${p.median.toFixed(0)} ms`);
    console.log(`    9 sur 10 sous  ${p.p90.toFixed(0)} ms`);
    console.log(`    99 sur 100     ${p.p99.toFixed(0)} ms`);
    console.log(`    pire cas       ${p.max.toFixed(0)} ms`);
  }
  for (const [e, n] of Object.entries(erreurs)) console.log(`    ⚠ ${n} × ${e}`);
}

console.log(`\n  Charge : ${PARALLELE} requêtes simultanées, ${APPELS} par scénario. Lecture seule.`);
for (const s of SCENARIOS) await mesurer(s);
console.log("");
