// Synchronisation des offres d'emploi depuis le site des employeurs.
//
//   node scripts/synchro-offres.mjs              → toutes les sources actives
//   node scripts/synchro-offres.mjs julius       → une entreprise (nom partiel)
//   node scripts/synchro-offres.mjs --essai      → lit, compare, n'écrit rien
//   node scripts/synchro-offres.mjs --complet    → relit tout le détail (nouvelles règles d'aperçu)
//
// Les sources sont dans la table `sources_offres` (entreprise, outil, compte).
// Pour chacune, on lit le flux officiel de son outil de recrutement, on ne
// garde que la Suisse, et l'on compare avec la base :
//   - offre nouvelle  → ajoutée (titre, lieu, taux, contrat, aperçu du poste, lien)
//   - offre modifiée  → mise à jour
//   - offre disparue  → désactivée (jamais supprimée : les statistiques restent)
// Le texte complet n'est pas recopié : un aperçu de deux ou trois phrases sur
// le poste, et « En savoir plus » mène à l'offre originale, chez l'employeur.
//
// Modèle validé par Luc : Kellerhals Carrard (2026-11-21).

import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import zlib from "node:zlib";
import { createClient } from "@supabase/supabase-js";

// Clés : .env.local sur un poste de travail, variables d'environnement sur le
// serveur qui lance la synchronisation chaque nuit (GitHub Actions).
const fichierEnv = new URL("../.env.local", import.meta.url);
const env = fs.existsSync(fichierEnv)
  ? Object.fromEntries(fs.readFileSync(fichierEnv, "utf8")
    .split(/\r?\n/).filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim().replace(/^"|"$/g, "")]))
  : process.env;
if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) { console.error("Clés Supabase absentes (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)."); process.exit(1); }
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const AGENT = "Mozilla/5.0 (compatible; WorkieSync/1.0; +https://www.workie.ch)";
const EN_PARALLELE = 10; // entreprises traitées en même temps (chacune sur son propre site)

// ─── Outils communs ──────────────────────────────────────────────────
const pause = ms => new Promise(r => setTimeout(r, ms));
/**
 * Requête HTTP simple, comme `curl` : seulement les en-têtes qu'on écrit.
 * `fetch` de Node ajoute de lui-même des en-têtes de navigateur
 * (sec-fetch-mode: cors…) que Workday refuse d'un client serveur (429),
 * alors qu'il accepte la même demande sans eux. On s'identifie toujours
 * clairement (WorkieSync), on ne se fait passer pour rien d'autre.
 */
function requete(url, { method = "GET", headers = {}, body } = {}, redirections = 5) {
  return new Promise((resoudre, rejeter) => {
    const u = new URL(url);
    const corps = body === undefined ? undefined : Buffer.from(body);
    const req = (u.protocol === "http:" ? http : https).request(u, {
      method, timeout: 20000,
      headers: { "User-Agent": AGENT, "Accept-Encoding": "gzip, deflate, br", ...headers, ...(corps ? { "Content-Length": corps.length } : {}) },
    }, rep => {
      if (rep.statusCode >= 300 && rep.statusCode < 400 && rep.headers.location && redirections > 0) {
        rep.resume();
        return resoudre(requete(new URL(rep.headers.location, u).toString(), { method: rep.statusCode === 303 ? "GET" : method, headers, body: rep.statusCode === 303 ? undefined : body }, redirections - 1));
      }
      const enc = rep.headers["content-encoding"];
      const flux = enc === "gzip" ? rep.pipe(zlib.createGunzip()) : enc === "deflate" ? rep.pipe(zlib.createInflate()) : enc === "br" ? rep.pipe(zlib.createBrotliDecompress()) : rep;
      const morceaux = [];
      flux.on("data", m => morceaux.push(m));
      flux.on("error", rejeter);
      flux.on("end", () => {
        const txt = Buffer.concat(morceaux).toString("utf8");
        resoudre({ ok: rep.statusCode >= 200 && rep.statusCode < 300, status: rep.statusCode, text: async () => txt, json: async () => JSON.parse(txt) });
      });
    });
    req.on("timeout", () => req.destroy(new Error("délai dépassé")));
    req.on("error", rejeter);
    req.end(corps);
  });
}

async function lireUrl(url, init = {}, essais = 4) {
  for (let i = 1; ; i++) {
    let r;
    try {
      r = await requete(url, { ...init, headers: { "Accept-Language": "fr-CH,fr;q=0.9,de;q=0.8,en;q=0.7", ...(init.headers ?? {}) } });
    } catch (e) {
      if (i >= essais) throw e;
      await pause(4000 * i);
      continue;
    }
    if (r.ok) return r;
    if (i >= essais || (r.status !== 429 && r.status < 500)) throw new Error(`${r.status} ${url}`);
    await pause(4000 * i);
  }
}
const json = async (url, init) => (await lireUrl(url, { ...init, headers: { "Content-Type": "application/json", Accept: "application/json", ...(init?.headers ?? {}) } })).json();

import { lieuEnSuisse, NOMMEES, entites, texte, CANDIDATURE_SPONTANEE, titrePropre, SUISSE, TACHES, ACCROCHE, presenteEntreprise, resume, taux, contrat, offre } from "./regles-offres.mjs";

// ─── Lecteurs, un par outil ──────────────────────────────────────────
// Chacun rend la liste des offres en Suisse. `html` peut être omis quand le
// détail coûte une requête par offre : on ne le lit alors que pour les
// nouvelles offres (voir `detail`).
const SUISSE_WORKDAY = "187134fccb084a0ea9b4b95f23890dbe";
const LECTEURS = {
  // https://<compte>.jobs.personio.com/xml : flux public complet.
  async personio({ compte }, entreprise) {
    const lire = async q => (await lireUrl(`https://${compte}.jobs.personio.com/xml${q}`)).text();
    const [xml, origine] = [await lire("?language=fr"), await lire("")];
    const champ = (bloc, nom) => (bloc.match(new RegExp(`<${nom}>([\\s\\S]*?)</${nom}>`)) ?? [])[1]?.replace(/<!\[CDATA\[|\]\]>/g, "").trim() ?? null;
    const premierTexte = b => {
      const sections = [...b.matchAll(/<jobDescription>([\s\S]*?)<\/jobDescription>/g)].map(([, x]) => ({ nom: champ(x, "name") ?? "", html: champ(x, "value") ?? "" }));
      if (!sections.length) return "";
      return (sections.find(x => TACHES.test(x.nom)) ?? sections.find(x => !presenteEntreprise(texte(x.html)[0] ?? "", entreprise)) ?? sections[0]).html;
    };
    const texteOrigine = new Map([...origine.matchAll(/<position>([\s\S]*?)<\/position>/g)].map(([, b]) => [champ(b, "id"), premierTexte(b)]));
    const CONTRATS = { permanent: "permanent", temporary: "fixed-term", intern: "internship", trainee: "internship", freelance: "freelance" };
    return [...xml.matchAll(/<position>([\s\S]*?)<\/position>/g)].map(([, b]) => ({
      ref: champ(b, "id"), titre: champ(b, "name") ?? "", lieu: champ(b, "office"),
      contrat: CONTRATS[champ(b, "employmentType")], date: champ(b, "createdAt"),
      html: premierTexte(b) || texteOrigine.get(champ(b, "id")) || "",
      url: `https://${compte}.jobs.personio.com/job/${champ(b, "id")}?language=fr`,
    }));
  },

  // Workday : interface publique de la page carrière, filtre pays = Suisse.
  async workday({ hote, tenant, site }) {
    const base = `https://${hote}/wday/cxs/${tenant}/${site}`;
    // Le filtre « pays » n'a pas le même nom partout (Location_Country,
    // locationCountry, ou un filtre de lieux). On demande d'abord la liste des
    // filtres de ce site et l'on y cherche la valeur « Suisse ».
    const filtres = (await json(`${base}/jobs`, { method: "POST", body: JSON.stringify({ appliedFacets: {}, limit: 1, offset: 0, searchText: "" }) })).facets ?? [];
    let filtre = null;
    const chercher = (liste, parametre) => {
      for (const f of liste ?? []) {
        const p = f.facetParameter ?? parametre;
        if (f.id && /^(switzerland|suisse|schweiz|svizzera)$/i.test((f.descriptor ?? "").trim()) && p) { filtre ??= { [p]: [f.id] }; return; }
        chercher(f.values, p);
      }
    };
    chercher(filtres.filter(f => /country/i.test(f.facetParameter ?? "")));
    if (!filtre) chercher(filtres);
    // Sans filtre de pays (certains sites ne proposent que des villes), on
    // parcourt toutes les offres et l'on garde celles situées en Suisse ;
    // une offre « 3 Locations » est vérifiée sur son détail.
    let liste = [];
    for (let offset = 0; offset < 2000; offset += 20) {
      const page = await json(`${base}/jobs`, { method: "POST", body: JSON.stringify({ appliedFacets: filtre ?? {}, limit: 20, offset, searchText: "" }) });
      liste.push(...(page.jobPostings ?? []));
      if ((page.jobPostings ?? []).length < 20 || liste.length >= page.total) break;
      await pause(300);
    }
    if (!filtre) liste = liste.filter(p => SUISSE.test(p.locationsText ?? "") || /^\d+ (locations|standorte|lieux)/i.test(p.locationsText ?? ""));
    return liste.map(p => ({
      ref: (p.bulletFields?.[0] ?? p.externalPath).toString(), titre: p.title, lieu: p.locationsText,
      url: `https://${hote}/${site}${p.externalPath}`,
      detail: async () => {
        const { jobPostingInfo: j } = await json(`${base}${p.externalPath}`);
        const lieuxSuisses = [j.location, ...(j.additionalLocations ?? [])].filter(l => l && SUISSE.test(l));
        const suisse = j.country?.id ? j.country.id === SUISSE_WORKDAY || lieuxSuisses.length > 0 : SUISSE.test(p.locationsText ?? "") || lieuxSuisses.length > 0;
        return { html: j.jobDescription, contrat: j.timeType, date: j.startDate, url: j.externalUrl ?? undefined, suisse, lieu: lieuxSuisses[0] ?? j.location };
      },
    }));
  },

  // SmartRecruiters : API publique des annonces, filtre pays = ch.
  async smartrecruiters({ compte }) {
    const liste = [];
    for (let offset = 0; ; offset += 100) {
      const page = await json(`https://api.smartrecruiters.com/v1/companies/${compte}/postings?country=ch&limit=100&offset=${offset}`);
      liste.push(...(page.content ?? []));
      if (liste.length >= (page.totalFound ?? 0) || !(page.content ?? []).length) break;
    }
    return liste.map(p => ({
      ref: p.id, titre: p.name, lieu: p.location?.city, contrat: p.typeOfEmployment?.label, date: p.releasedDate,
      url: `https://jobs.smartrecruiters.com/${compte}/${p.id}`,
      detail: async () => {
        const d = await json(`https://api.smartrecruiters.com/v1/companies/${compte}/postings/${p.id}`);
        const s = d.jobAd?.sections ?? {};
        return { html: `${s.jobDescription?.text ?? ""}`, url: d.applyUrl ?? d.postingUrl ?? undefined };
      },
    }));
  },

  // Greenhouse : API publique du tableau d'offres, texte compris.
  async greenhouse({ compte }) {
    const d = await json(`https://boards-api.greenhouse.io/v1/boards/${compte}/jobs?content=true`);
    return (d.jobs ?? []).filter(j => SUISSE.test(j.location?.name ?? "")).map(j => ({
      ref: j.id, titre: j.title, lieu: j.location?.name, date: j.first_published ?? j.updated_at,
      html: entites(j.content ?? ""), url: j.absolute_url,
    }));
  },

  // Lever : API publique des annonces.
  async lever({ compte }) {
    // Deux serveurs : américain et européen (jobs.eu.lever.co).
    const d = await json(`https://api.lever.co/v0/postings/${compte}?mode=json`).catch(e => {
      if (/^404/.test(e.message)) return json(`https://api.eu.lever.co/v0/postings/${compte}?mode=json`);
      throw e;
    });
    return (Array.isArray(d) ? d : []).filter(j => j.country === "CH" || SUISSE.test(j.categories?.location ?? "")).map(j => ({
      ref: j.id, titre: j.text, lieu: j.categories?.location, contrat: j.categories?.commitment, date: j.createdAt,
      html: j.description ?? "", url: j.hostedUrl,
    }));
  },

  // SAP SuccessFactors (sites carrière « Career Site Builder ») : le fichier
  // /sitemal.xml est le flux d'offres publié pour Google Jobs, texte compris.
  // Une seule requête par entreprise.
  async successfactors({ site, cantons }) {
    const xml = await (await lireUrl(`${site.replace(/\/$/, "")}/sitemal.xml`)).text();
    const champ = (b, n) => (b.match(new RegExp(`<${n}>([\\s\\S]*?)</${n}>`)) ?? [])[1]?.replace(/<!\[CDATA\[|\]\]>/g, "").trim() ?? "";
    return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, b]) => {
      const lieu = champ(b, "g:location");
      return { lieu, ref: champ(b, "g:id") || champ(b, "guid"), titre: champ(b, "title").replace(/\s*\([^()]*\)\s*$/, ""), html: entites(champ(b, "description")), url: champ(b, "link") };
    }).filter(o => lieuEnSuisse(o.lieu, { cantons }));
  },

  // Recruitee : API publique des offres.
  async recruitee({ compte }) {
    const d = await json(`https://${compte}.recruitee.com/api/offers/`);
    return (d.offers ?? []).filter(o => o.country_code === "CH" || SUISSE.test(`${o.city ?? ""} ${o.location ?? ""}`)).map(o => ({
      ref: o.id, titre: o.title, lieu: o.city ?? o.location, contrat: o.employment_type_code, date: o.created_at,
      html: o.description ?? "", url: o.careers_url,
    }));
  },
};

// ─── Synchronisation d'une entreprise ────────────────────────────────
const CHAMPS = ["title", "location", "contract_type", "taux_min", "taux_max", "apply_url"];
async function synchroniser(src, essai) {
  const { company_id, outil, params } = src;
  const entreprise = src.companies.name;
  const lecteur = LECTEURS[outil];
  if (!lecteur) throw new Error(`outil non pris en charge : ${outil}`);

  const brutes = (await lecteur(params, entreprise)).filter(o => o.ref && o.titre && !CANDIDATURE_SPONTANEE.test(o.titre));
  const { data: existantes } = await db.from("job_offers").select("id,source_ref,is_active,description," + CHAMPS.join(",")).eq("company_id", company_id).eq("source", outil);
  const parRef = new Map((existantes ?? []).map(o => [o.source_ref, o]));
  const actives = (existantes ?? []).filter(o => o.is_active).length;

  // Garde-fou : un flux qui revient soudain vide alors qu'il portait plusieurs
  // offres est plus souvent cassé que réellement vidé. On ne ferme rien.
  if (brutes.length === 0 && actives >= 3) throw new Error(`flux vide alors que ${actives} offres sont en ligne : rien n'est fermé, à vérifier`);

  const maintenant = new Date().toISOString();
  const bilan = { lues: 0, ajoutees: [], modifiees: [], fermees: [], inchangees: 0 };
  for (const b of brutes) {
    const ex = parRef.get(String(b.ref));
    // Le détail (texte, date) ne se lit que pour une offre nouvelle ou dont
    // le titre a changé : d'un jour à l'autre, l'essentiel ne bouge pas.
    let detailLu = !b.detail;
    if (b.detail && (complet || !ex || ex.title !== titrePropre(b.titre) || !ex.description)) {
      const d = await b.detail();
      if (d.suisse === false) continue;
      Object.assign(b, Object.fromEntries(Object.entries(d).filter(([, v]) => v !== undefined)));
      detailLu = true;
      await pause(150);
    }
    // Ville de repli quand le lieu de l'offre est illisible (pas « Multi-sites »).
    const ville = /multi/i.test(src.companies.city ?? "") ? null : src.companies.city;
    // Flux qui ne donne que le pays (« CH ») : pour une entreprise présente
    // seulement en Suisse, sa ville est la bonne réponse ; pour un groupe
    // présent partout (Avolta), mieux vaut aucun lieu qu'un lieu faux.
    if (/^\s*CH\s*$/.test(b.lieu ?? "") && params.cantons && ville) b.lieu = ville;
    const o = offre(b, entreprise, ville);
    // Détail non relu : ce qu'il avait apporté (lien exact, contrat) reste
    // celui déjà en base, sinon l'offre paraîtrait modifiée à chaque passage.
    if (!detailLu && ex) { o.apply_url = ex.apply_url; o.contract_type = ex.contract_type ?? o.contract_type; }
    bilan.lues++;
    parRef.delete(o.source_ref);
    if (!ex) {
      bilan.ajoutees.push(o.title);
      if (!essai) {
        const { error } = await db.from("job_offers").insert({ ...o, company_id, source: outil, is_active: true, synced_at: maintenant });
        if (error) throw new Error(`insertion « ${o.title} » : ${error.message}`);
      }
      continue;
    }
    const descriptionChange = o.description !== undefined && (ex.description ?? null) !== (o.description ?? null);
    if (!ex.is_active || descriptionChange || CHAMPS.some(k => (ex[k] ?? null) !== (o[k] ?? null))) {
      bilan.modifiees.push(o.title);
      if (!essai) {
        const { created_at, description, ...maj } = o; void created_at;
        const champs = { ...maj, ...(description !== undefined ? { description } : {}), is_active: true, synced_at: maintenant };
        const { error } = await db.from("job_offers").update(champs).eq("id", ex.id);
        if (error) throw new Error(`mise à jour « ${o.title} » : ${error.message}`);
      }
    } else bilan.inchangees++;
  }
  for (const ex of parRef.values()) {
    if (!ex.is_active) continue;
    bilan.fermees.push(ex.title);
    if (!essai) await db.from("job_offers").update({ is_active: false, synced_at: maintenant }).eq("id", ex.id);
  }
  return { entreprise, outil, ...bilan };
}

// ─── Lancement ───────────────────────────────────────────────────────
const args = process.argv.slice(2);
const essai = args.includes("--essai");
// --complet : relit le détail de toutes les offres (après un changement des règles d'aperçu).
const complet = args.includes("--complet");
const filtre = args.find(a => !a.startsWith("--"))?.toLowerCase();
const debut = Date.now();

const { data: sources, error } = await db.from("sources_offres").select("company_id,outil,params,companies(name,city)").eq("actif", true);
if (error) { console.error(error.message); process.exit(1); }
const choisies = sources.filter(s => !filtre || s.companies.name.toLowerCase().includes(filtre));

const resultats = [];
let i = 0;
// Plusieurs entreprises peuvent partager le même serveur (Workday regroupe
// ses clients sur wd1, wd3, wd5…). Sur un serveur partagé, une seule
// entreprise à la fois : dix requêtes simultanées y valent un refus (429).
const serveur = s => s.outil === "workday" ? s.params.hote.split(".").slice(1).join(".") : `${s.outil}:${JSON.stringify(s.params)}`;
const occupes = new Set();
await Promise.all(Array.from({ length: Math.min(EN_PARALLELE, choisies.length) }, async () => {
  while (i < choisies.length) {
    // La prochaine entreprise dont le serveur est libre.
    let k = choisies.findIndex((s, j) => j >= i && !occupes.has(serveur(s)));
    if (k < 0) { await pause(200); continue; }
    [choisies[i], choisies[k]] = [choisies[k], choisies[i]];
    const s = choisies[i++];
    occupes.add(serveur(s));
    try {
      const b = await synchroniser(s, essai);
      resultats.push(b);
      if (!essai) await db.from("sources_offres").update({ derniere_synchro: new Date().toISOString(), dernier_bilan: { lues: b.lues, ajoutees: b.ajoutees.length, modifiees: b.modifiees.length, fermees: b.fermees.length }, derniere_erreur: null }).eq("company_id", s.company_id);
    } catch (e) {
      resultats.push({ entreprise: s.companies.name, outil: s.outil, erreur: e.message });
      if (!essai) await db.from("sources_offres").update({ derniere_synchro: new Date().toISOString(), derniere_erreur: e.message.slice(0, 500) }).eq("company_id", s.company_id);
    } finally { occupes.delete(serveur(s)); }
  }
}));

// Bilan lisible : les entreprises qui ont bougé d'abord, puis les erreurs.
const bouge = resultats.filter(r => !r.erreur && (r.ajoutees.length || r.modifiees.length || r.fermees.length));
const erreurs = resultats.filter(r => r.erreur);
const total = k => resultats.reduce((n, r) => n + (r[k]?.length ?? 0), 0);
console.log(`\n${resultats.length} entreprises${essai ? " (essai, rien écrit)" : ""} · ${resultats.reduce((n, r) => n + (r.lues ?? 0), 0)} offres en Suisse`);
console.log(`+ ${total("ajoutees")} nouvelles   ~ ${total("modifiees")} modifiées   − ${total("fermees")} fermées   · ${erreurs.length} en erreur`);
for (const r of bouge.sort((a, b) => a.entreprise.localeCompare(b.entreprise))) {
  console.log(`\n  ${r.entreprise} (${r.lues}) : +${r.ajoutees.length} ~${r.modifiees.length} −${r.fermees.length}`);
  for (const t of r.ajoutees.slice(0, 3)) console.log(`      + ${t}`);
  for (const t of r.fermees.slice(0, 3)) console.log(`      − ${t}`);
}
for (const r of erreurs) console.log(`\n  ⚠ ${r.entreprise} (${r.outil}) : ${r.erreur}`);
console.log(`\nTerminé en ${((Date.now() - debut) / 1000).toFixed(1)} s`);
// Quelques sites en panne une nuit, c'est normal : ils sont notés dans
// sources_offres et repris la nuit suivante. Au-delà d'un cinquième en
// erreur, c'est notre côté qui cloche : la tâche s'affiche en échec.
if (erreurs.length > Math.max(2, resultats.length / 5)) process.exitCode = 1;
