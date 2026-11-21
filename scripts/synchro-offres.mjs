// Synchronisation des offres d'emploi depuis le site des employeurs.
//
//   node scripts/synchro-offres.mjs            → toutes les sources
//   node scripts/synchro-offres.mjs julius     → une source (nom partiel)
//   node scripts/synchro-offres.mjs --essai    → lit, compare, n'écrit rien
//
// Principe : on lit le flux officiel de l'outil de recrutement (ici Workday,
// via son interface publique, celle qu'utilise sa propre page carrière), on ne
// garde que la Suisse, et l'on compare avec la base :
//   - offre nouvelle  → ajoutée (titre, lieu, taux, résumé court, lien Postuler)
//   - offre modifiée  → mise à jour
//   - offre disparue  → désactivée (jamais supprimée : les statistiques restent)
// Le texte complet n'est pas recopié : un résumé de deux ou trois phrases, et
// « Postuler » mène à l'offre originale, chez l'employeur.

import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8")
  .split(/\r?\n/).filter(l => l.includes("=") && !l.startsWith("#"))
  .map(l => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim().replace(/^"|"$/g, "")]));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// ─── Sources ─────────────────────────────────────────────────────────
// Workday : https://<tenant>.<wdN>.myworkdayjobs.com/<site>
const SUISSE_WORKDAY = "187134fccb084a0ea9b4b95f23890dbe";
const SOURCES = [
  { entreprise: "Julius Baer", type: "workday", hote: "juliusbaer.wd3.myworkdayjobs.com", tenant: "juliusbaer", site: "External" },
  // Personio : flux XML public https://<compte>.jobs.personio.com/xml
  { entreprise: "Kellerhals Carrard", type: "personio", compte: "kellerhals-carrard" },
];

// ─── Personio ────────────────────────────────────────────────────────
// Tous les bureaux de ces comptes sont en Suisse ; un bureau hors de Suisse
// se reconnaîtrait à son nom et serait écarté ici.
const CANDIDATURE_SPONTANEE = /initiativ|wildcard|spontan|unsolicited|open application/i;
const HORS_SUISSE = /\b(deutschland|germany|london|paris|wien|vienna|milano|madrid|new york|singapore|hong kong|dubai)\b/i;
async function lirePersonio(s) {
  // Deux lectures : en français d'abord, puis dans la langue d'origine. Une
  // offre rédigée en allemand n'a pas de texte dans le flux français.
  const lire = async q => {
    const r = await fetch(`https://${s.compte}.jobs.personio.com/xml${q}`, { headers: { "User-Agent": "Mozilla/5.0 (compatible; WorkieSync/1.0; +https://www.workie.ch)" } });
    if (!r.ok) throw new Error(`${r.status} flux Personio`);
    return r.text();
  };
  const [xml, origine] = [await lire("?language=fr"), await lire("")];
  const champ = (bloc, nom) => (bloc.match(new RegExp(`<${nom}>([\\s\\S]*?)</${nom}>`)) ?? [])[1]?.replace(/<!\[CDATA\[|\]\]>/g, "").trim() ?? null;
  // La section qui décrit le poste (« Vos tâches », « Ihre Aufgaben »…), sinon
  // la première qui ne présente pas l'entreprise, sinon la première.
  const premierTexte = b => {
    const sections = [...b.matchAll(/<jobDescription>([\s\S]*?)<\/jobDescription>/g)].map(([, x]) => ({ nom: champ(x, "name") ?? "", html: champ(x, "value") ?? "" }));
    if (!sections.length) return "";
    const poste = sections.find(x => TACHES.test(x.nom));
    if (poste) return poste.html;
    return (sections.find(x => !presenteEntreprise(texte(x.html)[0] ?? "", s.entreprise)) ?? sections[0]).html;
  };
  const texteOrigine = new Map([...origine.matchAll(/<position>([\s\S]*?)<\/position>/g)].map(([, b]) => [champ(b, "id"), premierTexte(b)]));
  const CONTRATS = { permanent: "CDI", temporary: "CDD", intern: "Stage", trainee: "Apprentissage", freelance: "Freelance" };
  return [...xml.matchAll(/<position>([\s\S]*?)<\/position>/g)].map(([, b]) => {
    const titre = champ(b, "name").replace(/&amp;/g, "&");
    const premier = `<value>${premierTexte(b) || texteOrigine.get(champ(b, "id")) || ""}</value>`;
    const [tmin, tmax] = taux(titre);
    return {
      source_ref: champ(b, "id"),
      title: titre,
      location: champ(b, "office"),
      contract_type: CONTRATS[champ(b, "employmentType")] ?? contrat(titre, null),
      taux_min: tmin, taux_max: tmax,
      description: resume(champ(premier, "value"), s.entreprise),
      apply_url: `https://${s.compte}.jobs.personio.com/job/${champ(b, "id")}?language=fr`,
      created_at: champ(b, "createdAt") ? new Date(champ(b, "createdAt")).toISOString() : undefined,
    };
  }).filter(o => o.source_ref && !HORS_SUISSE.test(o.location ?? "") && !CANDIDATURE_SPONTANEE.test(o.title));
}

// ─── Outils ──────────────────────────────────────────────────────────
const pause = ms => new Promise(r => setTimeout(r, ms));
async function json(url, init, essais = 4) {
  for (let i = 1; ; i++) {
    const r = await fetch(url, { ...init, headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": "Mozilla/5.0 (compatible; WorkieSync/1.0; +https://www.workie.ch)", "Accept-Language": "fr-CH,fr;q=0.9,en;q=0.8", ...(init?.headers ?? {}) } });
    if (r.ok) return r.json();
    if (i >= essais || (r.status !== 429 && r.status < 500)) throw new Error(`${r.status} ${url}`);
    await pause(4000 * i);
  }
}
const texte = html => (html ?? "")
  .replace(/<\/(p|li|h\d|div)>|<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&rsquo;/g, "’").replace(/&quot;/g, '"')
  .replace(/[ \t]+/g, " ").split("\n").map(s => s.trim()).filter(Boolean);

/**
 * Résumé court : les premières phrases propres au poste. On saute le
 * paragraphe de présentation générique de l'entreprise (« At Julius Baer… »),
 * identique sur toutes les offres, et l'on s'arrête au premier intertitre.
 */
// Intertitres qui annoncent le poste lui-même, dans les langues des offres suisses.
const TACHES = /t[âa]ches|missions?|votre r[ôo]le|le poste|vos responsabilit|aufgaben|ihre rolle|ihr profil?\b.*aufgab|die stelle|your (role|challenge|tasks|responsibilities|mission)|the role|responsibilit|compiti|mansioni/i;
// Phrase d'accroche publicitaire, qui ne dit rien du travail.
const ACCROCHE = /^(wir bieten|nous (vous )?offrons|we offer)|willkommen|bienvenue|welcome|dann suchen wir sie|alors rejoignez|then join us|perfekte kombination|passion/i;
// Paragraphe de présentation de l'entreprise : déjà présenté sur sa fiche Workie.
function presenteEntreprise(l, entreprise) {
  const nom = entreprise.split(" ")[0].toLowerCase();
  const b = l.toLowerCase();
  return (b.includes(nom) && /^(at |chez |bei |join |über |about |depuis |seit |founded|fondée|gegründet)|est l[’']une? des|ist eine?r? der|is one of|est un[e]? (leader|acteur)|ist (ein|eine) (führend|internation)/.test(b))
    || /^(wir sind|nous sommes|we are) /.test(b);
}
/**
 * Aperçu du poste : la partie qui décrit le travail (tâches, rôle), jamais la
 * présentation de l'entreprise, déjà faite par sa fiche Workie. Deux ou trois
 * phrases, coupées proprement.
 */
function resume(html, entreprise) {
  const lignes = texte(html);
  const intertitre = l => l.length < 70 && (l === l.toUpperCase() || /[:?]$/.test(l) || TACHES.test(l) && l.split(" ").length <= 6);
  // 1. Après un intertitre « tâches / rôle », s'il y en a un.
  let depart = lignes.findIndex(l => intertitre(l) && TACHES.test(l));
  depart = depart >= 0 ? depart + 1 : 0;
  const out = [];
  for (let l of lignes.slice(depart)) {
    if (intertitre(l)) { if (out.length) break; else continue; }
    // Au début de l'aperçu, on retire phrase par phrase l'accroche et la
    // présentation de l'entreprise ; la suite du paragraphe est gardée.
    if (!out.length) {
      const phrases = l.split(/(?<=[.!?])\s+/);
      while (phrases.length && (presenteEntreprise(phrases[0], entreprise) || ACCROCHE.test(phrases[0]))) phrases.shift();
      l = phrases.join(" ");
      if (!l) continue;
    }
    out.push(l.replace(/^[-•·]\s*/, ""));
    if (out.join(" ").length > 300) break;
  }
  let r = out.join(" ").replace(/\s+/g, " ").trim();
  if (r.length > 420) {
    const coupe = r.slice(0, 420);
    const fin = Math.max(coupe.lastIndexOf(". "), coupe.lastIndexOf("! "));
    r = fin > 200 ? coupe.slice(0, fin + 1) : coupe.replace(/\s+\S*$/, "") + "…";
  }
  return r || null;
}
function taux(titre) {
  // « 80-100% », « 100% ou 80% », « 50% » : le plus petit et le plus grand taux cités.
  const n = [...titre.matchAll(/(\d{2,3})\s*(?=%|\s*[-–]\s*\d{2,3}\s*%)/g)].map(m => Number(m[1])).filter(x => x >= 10 && x <= 100);
  return n.length ? [Math.min(...n), Math.max(...n)] : [null, null];
}
function contrat(titre, temps) {
  const t = titre.toLowerCase();
  if (/apprenti|lehrstelle|lernende|apprentice|\bcfc\b|\befz\b/.test(t)) return "Apprentissage";
  if (/intern\b|internship|stage|stagiaire|praktik/.test(t)) return "Stage";
  if (/contract|temporary|fixed.term|befristet|\bcdd\b|limited/.test(t)) return "CDD";
  return null;
}

// ─── Workday ─────────────────────────────────────────────────────────
async function lireWorkday(s) {
  const base = `https://${s.hote}/wday/cxs/${s.tenant}/${s.site}`;
  const liste = [];
  for (let offset = 0; ; offset += 20) {
    const page = await json(`${base}/jobs`, { method: "POST", body: JSON.stringify({ appliedFacets: { Location_Country: [SUISSE_WORKDAY] }, limit: 20, offset, searchText: "" }) });
    liste.push(...page.jobPostings);
    if (page.jobPostings.length < 20 || liste.length >= page.total) break;
  }
  const offres = [];
  for (const p of liste) {
    const { jobPostingInfo: j } = await json(`${base}${p.externalPath}`);
    if (j.country?.id && j.country.id !== SUISSE_WORKDAY) continue;
    const [tmin, tmax] = taux(j.title);
    offres.push({
      source_ref: j.jobReqId ?? j.id,
      title: j.title.trim(),
      location: j.location ?? p.locationsText ?? null,
      contract_type: contrat(j.title, j.timeType),
      taux_min: tmin, taux_max: tmax,
      description: resume(j.jobDescription, s.entreprise),
      apply_url: j.externalUrl ?? `https://${s.hote}/${s.site}${p.externalPath}`,
      created_at: j.startDate ? new Date(j.startDate).toISOString() : undefined,
    });
    await pause(150);
  }
  return offres;
}

// ─── Synchronisation ─────────────────────────────────────────────────
const CHAMPS = ["title", "location", "contract_type", "taux_min", "taux_max", "description", "apply_url"];
async function synchroniser(s, essai) {
  const { data: c } = await db.from("companies").select("id,name").eq("name", s.entreprise).single();
  if (!c) throw new Error(`entreprise introuvable : ${s.entreprise}`);
  const source = s.type;
  const lues = s.type === "workday" ? await lireWorkday(s) : s.type === "personio" ? await lirePersonio(s) : [];
  const { data: existantes } = await db.from("job_offers").select("id,source_ref,is_active," + CHAMPS.join(",")).eq("company_id", c.id).eq("source", source);
  const parRef = new Map((existantes ?? []).map(o => [o.source_ref, o]));
  const maintenant = new Date().toISOString();
  const bilan = { ajoutees: [], modifiees: [], fermees: [], inchangees: 0 };

  for (const o of lues) {
    const ex = parRef.get(o.source_ref);
    parRef.delete(o.source_ref);
    if (!ex) {
      bilan.ajoutees.push(o.title);
      if (!essai) {
        const { error } = await db.from("job_offers").insert({ ...o, company_id: c.id, source, is_active: true, synced_at: maintenant });
        if (error) throw error;
      }
    } else if (!ex.is_active || CHAMPS.some(k => (ex[k] ?? null) !== (o[k] ?? null))) {
      bilan.modifiees.push(o.title);
      if (!essai) {
        const { created_at, ...maj } = o; void created_at;
        const { error } = await db.from("job_offers").update({ ...maj, is_active: true, synced_at: maintenant }).eq("id", ex.id);
        if (error) throw error;
      }
    } else bilan.inchangees++;
  }
  for (const ex of parRef.values()) {
    if (!ex.is_active) continue;
    bilan.fermees.push(ex.title);
    if (!essai) await db.from("job_offers").update({ is_active: false, synced_at: maintenant }).eq("id", ex.id);
  }
  return { entreprise: c.name, lues: lues.length, ...bilan };
}

const args = process.argv.slice(2);
const essai = args.includes("--essai");
const filtre = args.find(a => !a.startsWith("--"))?.toLowerCase();
const debut = Date.now();
for (const s of SOURCES.filter(s => !filtre || s.entreprise.toLowerCase().includes(filtre))) {
  try {
    const b = await synchroniser(s, essai);
    console.log(`\n${b.entreprise} : ${b.lues} offres en Suisse${essai ? " (essai, rien écrit)" : ""}`);
    console.log(`  + ${b.ajoutees.length} nouvelles   ~ ${b.modifiees.length} modifiées   − ${b.fermees.length} fermées   = ${b.inchangees} inchangées`);
    for (const t of b.ajoutees.slice(0, 5)) console.log(`    + ${t}`);
    for (const t of b.fermees.slice(0, 5)) console.log(`    − ${t}`);
  } catch (e) { console.error(`\n${s.entreprise} : échec, ${e.message}`); process.exitCode = 1; }
}
console.log(`\nTerminé en ${((Date.now() - debut) / 1000).toFixed(1)} s`);
