/**
 * Contrôle que chaque bannière est une vraie photo et non un substitut.
 *
 * Pexels ne renvoie pas d'erreur quand une photo a été retirée de son
 * catalogue : il répond 200 avec une petite image PNG de remplacement. Une
 * vérification par code de statut ne voit donc rien. C'est ce qui est arrivé à
 * Porsche Suisse — 15 Ko de PNG là où la photo d'origine en pesait 200 en JPEG.
 *
 * Deux signaux, croisés :
 *   - le type renvoyé est image/png alors que l'URL demande un .jpeg ;
 *   - le poids est dérisoire pour la largeur demandée.
 *
 * Usage :
 *   node scripts/verifier-images.mjs          # liste les fiches à refaire
 *   node scripts/verifier-images.mjs --corriger  # les marque pour réattribution
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const CORRIGER = process.argv.includes("--corriger");
const PARALLELE = 12;
const POIDS_MIN = 25_000; // octets, à 1280 px de large

function chargerEnv() {
  try {
    for (const l of readFileSync(".env.local", "utf8").split("\n")) {
      const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch { /* déjà dans l'environnement */ }
}
chargerEnv();

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } });

async function controler(url) {
  // On demande la largeur du hero : c'est la plus lourde réellement servie,
  // donc celle où l'écart entre une vraie photo et un substitut est le plus net.
  const cible = url.replace(/([?&])w=\d+/, "$1w=1280").replace(/([?&])h=\d+/, "$1h=720");
  try {
    const r = await fetch(cible, { headers: { "User-Agent": "Mozilla/5.0 (compatible; workie.ch/1.0)" } });
    if (!r.ok) return { ok: false, motif: `http ${r.status}` };
    const type = r.headers.get("content-type") ?? "";
    const buf = await r.arrayBuffer();
    const poids = buf.byteLength;

    if (/\.jpe?g/i.test(url) && type.includes("png")) {
      return { ok: false, motif: `substitut PNG (${Math.round(poids / 1024)} Ko)` };
    }
    if (poids < POIDS_MIN) {
      return { ok: false, motif: `trop léger : ${Math.round(poids / 1024)} Ko` };
    }
    return { ok: true, poids };
  } catch (e) {
    return { ok: false, motif: e.cause?.code ?? e.name };
  }
}

async function main() {
  // PostgREST plafonne à 1000 lignes : on pagine, sinon le contrôle laisserait
  // silencieusement de côté les dernières fiches.
  const fiches = [];
  for (let de = 0; ; de += 500) {
    const { data, error } = await db.from("companies")
      .select("id, name, cover_url").not("cover_url", "is", null)
      .order("name").range(de, de + 499);
    if (error) { console.error(error.message); process.exit(1); }
    fiches.push(...data);
    if (data.length < 500) break;
  }
  console.log(`${fiches.length} bannières à contrôler.\n`);

  const mauvaises = [];
  for (let i = 0; i < fiches.length; i += PARALLELE) {
    const lot = fiches.slice(i, i + PARALLELE);
    const res = await Promise.all(lot.map(async f => [f, await controler(f.cover_url)]));
    for (const [f, v] of res) {
      if (!v.ok) { mauvaises.push({ ...f, motif: v.motif }); console.log(`  ✗ ${f.name} — ${v.motif}`); }
    }
    if ((i + PARALLELE) % 200 === 0) console.log(`  … ${i + PARALLELE}/${fiches.length}`);
  }

  console.log(`\n─────────────────────────────`);
  console.log(`  Contrôlées : ${fiches.length}`);
  console.log(`  À refaire  : ${mauvaises.length}`);
  console.log(`─────────────────────────────`);

  if (CORRIGER && mauvaises.length > 0) {
    // On vide la bannière : images-pexels.mjs la réattribuera au passage
    // suivant, en repartant du terme de recherche déjà enregistré.
    for (const m of mauvaises) {
      await db.from("companies").update({ cover_url: null, cover_source: null }).eq("id", m.id);
    }
    console.log(`\n${mauvaises.length} bannières vidées — relancer images-pexels.mjs.`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
