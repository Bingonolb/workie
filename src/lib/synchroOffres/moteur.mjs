// Moteur de synchronisation des offres d'emploi.
//
// Lit le flux officiel de l'outil de recrutement de chaque entreprise (table
// sources_offres), ne garde que la Suisse, et compare avec la base :
//   - offre nouvelle  → ajoutée (titre, lieu, taux, contrat, aperçu du poste, lien)
//   - offre modifiée  → mise à jour
//   - offre disparue  → désactivée (jamais supprimée : les statistiques restent)
// Le texte complet n'est pas recopié : un aperçu de deux ou trois phrases sur
// le poste, et « En savoir plus » mène à l'offre originale, chez l'employeur.
//
// Deux portes d'entrée, un seul moteur :
//   - scripts/synchro-offres.mjs : en ligne de commande (« on synchronise ») ;
//   - src/app/api/cron/synchro-offres : chaque nuit, lancé par Vercel.
//
// Modèle validé par Luc : Kellerhals Carrard (2026-11-21).

import http from "node:http";
import https from "node:https";
import zlib from "node:zlib";
import { phrasesCommunes, lieuEnSuisse, NOMMEES, entites, texte, CANDIDATURE_SPONTANEE, titrePropre, SUISSE, TACHES, ACCROCHE, presenteEntreprise, resume, taux, contrat, offre } from "./regles.mjs";

// Base et options de la passe en cours (une passe à la fois par processus).
let db;
let complet = false;

const AGENT = "Mozilla/5.0 (compatible; WorkieSync/1.0; +https://www.workie.ch)";
const EN_PARALLELE = 10; // entreprises traitées en même temps (chacune sur son propre site)

// ─── Outils communs ──────────────────────────────────────────────────
const pause = ms => new Promise(r => setTimeout(r, ms));
// Texte d'un fragment HTML : balises retirées, codes décodés, espaces resserrées.
const propreHtml = s => entites((s ?? "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
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


// ─── Lecteurs, un par outil ──────────────────────────────────────────
// Chacun rend la liste des offres en Suisse. `html` peut être omis quand le
// détail coûte une requête par offre : on ne le lit alors que pour les
// nouvelles offres (voir `detail`).
const DETAILS_WORKDAY = new Map();
const SUISSE_WORKDAY ="187134fccb084a0ea9b4b95f23890dbe";
const LECTEURS = {
  // Phenom : la recherche publique que la page carrière interroge elle-même
  // (/widgets, « refineSearch »), filtrée sur la Suisse quand le site a un
  // filtre de pays. Le texte vient de la page de l'offre, qui est aussi le lien.
  // `toutSuisse` : site d'une entreprise seulement suisse (Sunrise), sans filtre.
  // `employeur` : motif de l'entité qui recrute (Allianz Suisse parmi Allianz).
  async phenom({ hote, chemin, langue, pays = "global", filtre, toutSuisse, employeur }) {
    const motif = employeur ? new RegExp(employeur, "i") : null;
    const liste = [];
    for (let de = 0; de < 3000; de += 50) {
      const r = await json(`https://${hote}/widgets`, { method: "POST", body: JSON.stringify({ lang: langue, deviceType: "desktop", country: pays, pageName: "search-results", ddoKey: "refineSearch", sortBy: "", subsearch: "", from: de, jobs: true, counts: true, all_fields: [], size: 50, clearAll: false, jdsource: "facets", isSliderEnable: false, pageId: "page20", siteType: "external", keywords: "", global: true, selected_fields: filtre ?? {}, locationData: {} }) });
      const lot = r.refineSearch?.data?.jobs ?? [];
      liste.push(...lot);
      if (lot.length < 50 || liste.length >= (r.refineSearch?.totalHits ?? 0)) break;
      await pause(300);
    }
    return liste
      .filter(o => filtre || toutSuisse || SUISSE.test(`${o.country ?? ""} ${o.cityStateCountry ?? ""}`))
      .filter(o => !motif || motif.test(o.employingEntity ?? ""))
      .map(o => {
        const url = `https://${hote}/${chemin}/job/${o.jobSeqNo}`;
        return {
          ref: String(o.jobSeqNo), titre: o.title, lieu: o.city, contrat: o.type, date: o.postedDate, url,
          detail: async () => {
            const page = await (await lireUrl(url)).text();
            const ddo = page.match(/phApp\.ddo\s*=\s*(\{[\s\S]*?\});\s*phApp/)?.[1];
            let html = "";
            try { html = JSON.parse(ddo).jobDetail?.data?.job?.description ?? ""; } catch { /* page sans détail lisible */ }
            return { html };
          },
        };
      });
  },

  // Cornerstone (csod.com) : la page carrière publique porte le jeton
  // anonyme que son propre moteur de recherche utilise ; on fait la même
  // recherche qu'elle. Lien = la page de l'offre, jamais le formulaire.
  async cornerstone({ compte, site = 1 }) {
    const page = await (await lireUrl(`https://${compte}.csod.com/ux/ats/careersite/${site}/home?c=${compte}`)).text();
    const jeton = page.match(/"token":"([^"]+)/)?.[1], nuage = page.match(/"cloud":"([^"]+)/)?.[1];
    const cultureId = Number(page.match(/"cultureID":(\d+)/)?.[1] ?? 1), cultureName = page.match(/"cultureName":"([^"]+)/)?.[1] ?? "en-US";
    if (!jeton || !nuage) throw new Error("Cornerstone : jeton introuvable");
    const offres = [];
    for (let n = 1; n < 40; n++) {
      const r = await json(`${nuage}rec-job-search/external/jobs`, { method: "POST", headers: { Authorization: `Bearer ${jeton}` }, body: JSON.stringify({ careerSiteId: site, careerSitePageId: site, pageNumber: n, pageSize: 50, cultureId, cultureName, searchText: "", states: [], countryCodes: [], cities: [], placeID: "", radius: null, postingsWithinDays: null, customFieldCheckboxKeys: [], customFieldDropdowns: [], customFieldRadios: [] }) });
      const lot = r.data?.requisitions ?? [];
      offres.push(...lot);
      if (lot.length < 50 || offres.length >= (r.data?.totalCount ?? 0)) break;
      await pause(300);
    }
    return offres
      .map(o => ({ o, l: (o.locations ?? []).find(l => !l.country || /^ch$/i.test(l.country)) }))
      .filter(({ o, l }) => l && ((o.locations ?? []).some(x => /^ch$/i.test(x.country ?? "")) || lieuEnSuisse(`${l.city}, ${l.state ?? ""}`, { cantons: true })))
      .map(({ o, l }) => ({
        // Texte à plat : la rubrique d'ouverture (« Votre mission ») et un
        // avertissement administratif en tête sont retirés.
        ref: String(o.requisitionId), titre: o.displayJobTitle, lieu: l.city,
        html: (o.externalDescription ?? "")
          .replace(/^\s*Information importante au préalable[\s\S]*?formation dans le métier suivant\s*:\s*[\s\S]*?\b(?:CFC|AFP)\s+/i, "")
          .replace(/^\s*Information importante au préalable[\s\S]*?(?=Votre mission|Ihre Mission|Your mission)/i, "")
          .replace(/^\s*(Mission du poste|Votre mission|Ihre Mission|Your mission|Vos missions|Ihre Aufgaben|Mission)\s*:?\s*(?=\p{Lu})/iu, ""),
        url: `https://${compte}.csod.com/ux/ats/careersite/${site}/home/requisition/${o.requisitionId}?c=${compte}`,
      }));
  },

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
  // `employeur` : pour un portail de groupe (Richemont), le motif du nom de
  // l'employeur (hiringOrganization) à garder ; les détails sont mis en
  // mémoire pour que chaque Maison ne relise pas les offres des autres.
  async workday({ hote, tenant, site, employeur }) {
    const motifEmployeur = employeur ? new RegExp(employeur, "i") : null;
    const base = `https://${hote}/wday/cxs/${tenant}/${site}`;
    // Le filtre « pays » n'a pas le même nom partout (Location_Country,
    // locationCountry, ou un filtre de lieux). On demande d'abord la liste des
    // filtres de ce site et l'on y cherche la valeur « Suisse ».
    const filtres = (await json(`${base}/jobs`, { method: "POST", body: JSON.stringify({ appliedFacets: {}, limit: 1, offset: 0, searchText: "" }) })).facets ?? [];
    // Toutes les valeurs « Suisse », même imbriquées (Richemont range le pays
    // sous locationMainGroup) ; un paramètre de pays passe avant les autres.
    const candidats = [];
    const chercher = (liste, parametre) => {
      for (const f of liste ?? []) {
        const p = f.facetParameter ?? parametre;
        if (f.id && /^(switzerland|suisse|schweiz|svizzera)$/i.test((f.descriptor ?? "").trim()) && p) candidats.push({ [p]: [f.id] });
        chercher(f.values, p);
      }
    };
    chercher(filtres);
    const filtre = candidats.find(c => /country/i.test(Object.keys(c)[0])) ?? candidats[0] ?? null;
    // Sans filtre de pays (certains sites ne proposent que des villes), on
    // parcourt toutes les offres et l'on garde celles situées en Suisse ;
    // une offre « 3 Locations » est vérifiée sur son détail.
    // Workday ne donne le total qu'à la première page (0 ensuite) : on le garde.
    let liste = [], total = Infinity;
    for (let offset = 0; offset < 2000; offset += 20) {
      const page = await json(`${base}/jobs`, { method: "POST", body: JSON.stringify({ appliedFacets: filtre ?? {}, limit: 20, offset, searchText: "" }) });
      liste.push(...(page.jobPostings ?? []));
      if (offset === 0 && page.total) total = page.total;
      if ((page.jobPostings ?? []).length < 20 || liste.length >= total) break;
      await pause(300);
    }
    if (!filtre) liste = liste.filter(p => SUISSE.test(p.locationsText ?? "") || /^\d+ (locations|standorte|lieux)/i.test(p.locationsText ?? ""));
    return liste.map(p => ({
      ref: (p.bulletFields?.[0] ?? p.externalPath).toString(), titre: p.title, lieu: p.locationsText,
      url: `https://${hote}/${site}${p.externalPath}`,
      detail: async () => {
        const cle = `${base}${p.externalPath}`;
        if (!DETAILS_WORKDAY.has(cle)) DETAILS_WORKDAY.set(cle, json(cle));
        const { jobPostingInfo: j, hiringOrganization: h } = await DETAILS_WORKDAY.get(cle);
        if (motifEmployeur && !motifEmployeur.test((h?.name ?? "").replace(/^C\d+\s+/, ""))) return { suisse: false };
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
        // L'offre elle-même, jamais le formulaire : `applyUrl` et le paramètre
        // « oga » mènent droit au formulaire de candidature en un clic.
        const page = (d.postingUrl ?? "").replace(/\?.*$/, "");
        return { html: `${s.jobDescription?.text ?? ""}`, url: page || undefined };
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

  // Prospective (outil suisse) : interface publique du « career center » que la
  // page carrière de l'entreprise charge elle-même. Les groupes (Coop, fenaco)
  // publient toutes leurs sociétés dans un même flux : `attribut` désigne le
  // champ « entreprise », `garder` / `exclure` les sociétés à prendre ou non.
  // `attributPays` : chez certains (Bühler), le champ « pays » donne le pays du
  // siège pour toutes les offres ; le vrai pays est dans un filtre du site.
  async prospective({ medium, attribut, garder, exclure, cantons, attributPays }) {
    const jobs = [];
    for (let offset = 0; offset < 5000; offset += 100) {
      const page = await json(`https://ohws.prospective.ch/public/v1/medium/${medium}/jobs?lang=fr&offset=${offset}&limit=100`);
      jobs.push(...(page.jobs ?? []));
      if ((page.jobs ?? []).length < 100 || jobs.length >= page.total) break;
      await pause(300);
    }
    const societes = j => (attribut ? j.attributes?.[attribut] ?? [] : []);
    return jobs
      .filter(j => !garder || societes(j).some(s => garder.includes(s)))
      .filter(j => !exclure || !societes(j).some(s => exclure.includes(s)))
      // Pays donné : il doit être la Suisse. Pays absent : accepté pour une
      // entreprise présente seulement en Suisse, sinon la ville doit être suisse.
      .filter(j => {
        if (attributPays) return (j.attributes?.[attributPays] ?? []).some(p => /^(suisse|schweiz|switzerland|svizzera)$/i.test(p));
        const z = j.szas ?? {};
        const pays = z["sza_location.country"];
        if (pays) return /schweiz|suisse|switzerland|svizzera/i.test(pays);
        return cantons || SUISSE.test(z["sza_location.city"] ?? z["sza_workplace.city"] ?? "");
      })
      // Journée découverte, stage d'essai : pas des offres d'emploi.
      // Le titre ne le dit pas toujours (« Detailhandelsfachfrau:mann » chez
      // Coop) : on regarde aussi les filtres de l'offre.
      .filter(j => !/schnupper|journée (découverte|d.essai)|stage d.orientation|giornata|stage d.observation/i.test(
        [j.szas?.sza_title || j.title, ...Object.values(j.attributes ?? {}).flat()].join(" | ").replace(/keine schnupperlehre/gi, "")))
      .map(j => {
        const z = j.szas ?? {};
        const min = Number(z["sza_pensum.min"]), max = Number(z["sza_pensum.max"]);
        return {
          ref: j.id, titre: z.sza_title || j.title, lieu: z["sza_location.city"] || z["sza_workplace.city"] || (attributPays ? null : (j.attributes?.["20"] ?? [])[0]),
          // Type de contrat et filtres de l'offre : chez Coop, « Apprentissage »
          // ou « Lehrstelle » n'apparaissent que dans les filtres.
          contrat: [z.sza_employment_type, ...Object.values(j.attributes ?? {}).flat()].filter(v => v && !/keine (lehrstelle|schnupperlehre)/i.test(v)).join(" "), date: j.start_date,
          // La rubrique « tâches » est l'aperçu idéal ; à défaut, la description courte.
          html: z.sza_tasks || z.sza_short_description || z.sza_introduction || "",
          url: j.links?.directlink ?? z.sza_apply_link,
          taux: min >= 10 && max <= 100 && max >= min ? [min, max] : undefined,
        };
      });
  },

  // Umantis (Abacus) : la page publique /Jobs/All liste toutes les offres,
  // avec des champs étiquetés (lieu, taux, type de contrat). Le détail d'une
  // offre est souvent repris sur le site du client, différent d'un client à
  // l'autre : on n'y lit que le bloc « JobPosting » quand il existe.
  //
  // Deux mises en page selon le client : liste à champs étiquetés
  // (« Art : unbefristet ») ou ligne à segments séparés par « | »
  // (« Befristung: Unbefristet | Basel »). La liste est paginée (10 par page).
  // `garder` : pour un compte partagé (Tschuggen Collection), le nom de la
  // société en tête de ligne qui désigne l'entreprise.
  //
  // `siteClient` : chez certains clients (Atupri, Energie 360°), l'offre
  // Umantis renvoie vers la page générale de leur site. Leur page carrière a
  // une page par offre, au même numéro (« …-1119 », « /1001-… ») : on y mène
  // directement, et l'aperçu est lu sur cette page. Sans page à ce numéro,
  // l'offre n'est pas publiée (un lien doit ouvrir l'offre elle-même).
  async umantis({ base, cantons, garder, siteClient }) {
    const propre = s => entites((s ?? "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
    const pagesClient = new Map();
    if (siteClient) {
      const h = await (await lireUrl(siteClient)).text();
      // Tous les nombres de l'adresse, pas le premier : dans
      // « /arbeiten-bei-energie-360/jobs/1001-technikerin/ », c'est 1001.
      for (const m of h.matchAll(/href="([^"#]+)"/g)) {
        for (const n of m[1].matchAll(/(?<=^|[-/])(\d{3,6})(?=[-/]|\/?$)/g)) {
          if (!pagesClient.has(n[1])) pagesClient.set(n[1], new URL(entites(m[1]), siteClient).href);
        }
      }
    }
    let html = await (await lireUrl(`${base}/Jobs/All`)).text();
    const pages = [html];
    // Page suivante : lien « ?tc…=p2 » dans la page, ou, dans la nouvelle
    // navigation, construit à partir du tableau et de son jeton de recherche.
    const vus = new Set();
    for (let p = 2; p <= 40; p++) {
      let suite = html.match(new RegExp(`href="(\\?tc\\d+=p${p}[^"]*)"`))?.[1];
      if (!suite) {
        const table = html.match(/connectortable_(\d+)/)?.[1];
        const jeton = html.match(/search_token(?:&quot;|")\s*:\s*(?:&quot;|")(\d+)/)?.[1];
        const total = Number(html.match(/(\d+)\s*(?:Treffer|résultats|results|Stellen|offres)/i)?.[1] ?? 0);
        if (!table || !jeton || (total && (p - 1) * 10 >= total)) break;
        suite = `?tc${table}=p${p}&_search_token${table}=${jeton}`;
      }
      await pause(400);
      html = await (await lireUrl(`${base}/Jobs/All${entites(suite).replace(/#.*$/, "")}`)).text();
      // Page déjà vue (la navigation renvoie la dernière page) : fin.
      const premier = html.match(/\/Vacancies\/(\d+)\/Description/)?.[1];
      if (!premier || vus.has(premier)) break;
      vus.add(premier);
      pages.push(html);
    }
    const lignes = pages.flatMap(h => h.split(/<tr class="(?:table-as-list__contentrow|tableaslist_contentrow)/).slice(1));
    const offres = [];
    for (const l of lignes) {
      const lien = l.match(/href="(\/Vacancies\/(\d+)\/Description\/\d+)"[^>]*>([\s\S]*?)<\/a>/);
      if (!lien) continue;
      const champs = {};
      // Mise en page 1 : étiquette + valeur.
      for (const m of l.matchAll(/id="column_label_\d+">([^<]*)<\/span>[\s\S]*?<span class="column-value"[^>]*>([\s\S]*?)<\/span>/g)) {
        champs[propre(m[1]).toLowerCase()] = propre(m[2]);
      }
      // Mise en page 2 : segments « | Étiquette: valeur » ou « | valeur ».
      const segments = [...l.matchAll(/<span class="tableaslist_(?:text|subtitle)[^"]*">([\s\S]*?)<\/span>/g)].map(m => propre(m[1]).replace(/^\|\s*/, "")).filter(Boolean);
      const societe = segments[0] ?? propre(l.match(/aria-label="([^"]+)"[^>]*>\s*<span class="visually-hidden"/)?.[1]);
      const libres = [];
      for (const s of segments.slice(1)) {
        if (/Jetzt bewerben|Postuler|Apply|online seit|en ligne depuis/i.test(s) || s === propre(lien[3])) continue;
        // « Étiquette: valeur » : deux-points suivis d'une espace, sinon
        // « Produktmanager:in » serait pris pour une étiquette.
        const kv = s.match(/^([^:]{2,30}):\s+(.+)$/);
        if (kv) champs[kv[1].toLowerCase()] = kv[2]; else libres.push(s);
      }
      const valeur = re => Object.entries(champs).find(([k]) => re.test(k))?.[1];
      // Lieu non étiqueté : le segment libre qui ressemble à une ville.
      if (!valeur(/ort|lieu|location|standort|luogo/)) {
        // Seulement une ville reconnue : un segment comme « Banking » n'est pas un lieu.
        const ville = libres.find(s => s.length < 40 && s !== societe && (SUISSE.test(s) || lieuEnSuisse(s)));
        if (ville) champs.ort = ville;
      }
      // Compte partagé : seulement les offres de la société (ou de la station) voulue.
      if (garder && !garder.some(g => [societe ?? "", ...Object.values(champs)].some(v => v.toLowerCase().includes(g.toLowerCase())))) continue;
      const lieuListe = valeur(/^(arbeits)?ort$|^ort|lieu|location|standort|arbeitsort|luogo/);
      const listeSuisse = Boolean(lieuListe && (lieuEnSuisse(lieuListe) || SUISSE.test(lieuListe)));
      const pensum = valeur(/pensum|taux|beschäftigung|arbeitspensum|grado/);
      const n = [...(pensum ?? "").matchAll(/\d{2,3}/g)].map(x => Number(x[0])).filter(x => x >= 10 && x <= 100);
      offres.push({
        ref: lien[2], titre: entites(lien[3].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim(),
        lieu: lieuListe,
        contrat: valeur(/^art$|anstellung|contrat|vertrag|type|befrist/),
        taux: n.length ? [Math.min(...n), Math.max(...n)] : undefined,
        url: siteClient ? pagesClient.get(lien[2]) : `${base}${lien[1]}`,
        detail: async () => {
          const adresse = siteClient ? pagesClient.get(lien[2]) : `${base}${lien[1]}`;
          const page = await (await lireUrl(adresse)).text();
          // Page de l'offre sur le site du client : son contenu principal.
          if (siteClient) {
            const corps = page.replace(/<(script|style|nav|header|footer|aside)[\s\S]*?<\/\1>/gi, "");
            const debut = corps.search(/<h1[\s>]/i);
            return { html: (debut >= 0 ? corps.slice(debut) : corps).replace(/<h1[\s\S]*?<\/h1>/i, "") };
          }
          for (const m of page.matchAll(/<script[^>]*ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
            try {
              const o = JSON.parse(m[1]);
              if (o["@type"] === "JobPosting") return { html: o.description ?? "", date: o.datePosted };
            } catch { /* bloc illisible : on passe */ }
          }
          // Page restée chez Umantis : on lit son contenu (les règles d'aperçu
          // y trouvent la rubrique des tâches). Redirigée vers le site du
          // client, sa mise en page est inconnue : pas d'aperçu.
          // (Les pages Umantis portent souvent la marque du client, sans le mot
          // « umantis » : c'est le lien vers l'offre qui les reconnaît.)
          if (!/\/Vacancies\//.test(page)) return { html: "" };
          const corps = page.replace(/<(script|style|nav|header|footer)[\s\S]*?<\/\1>/gi, "");
          const debut = corps.search(/<h1[\s>]/i);
          const contenu = debut >= 0 ? corps.slice(debut) : corps;
          // Lieu écrit sur la page : « Arbeitsort: Bern », « Lieu de travail : Genève ».
          const lieu = texte(contenu).map(l => l.match(/^(?:arbeitsort|standort|einsatzort|lieu de travail|lieu|workplace|location|place of work|luogo di lavoro)\s*:\s*(.{2,60})$/i)?.[1]).find(Boolean);
          // Entreprise internationale sans lieu dans la liste : c'est la page
          // qui tranche ; sans lieu suisse reconnu, l'offre est écartée.
          const suisse = cantons || listeSuisse ? undefined : Boolean(lieu && (lieuEnSuisse(lieu) || SUISSE.test(lieu)));
          return { html: contenu.replace(/<h1[\s\S]*?<\/h1>/i, ""), ...(lieu ? { lieu } : {}), ...(suisse === false ? { suisse } : {}) };
        },
      });
    }
    // Entreprise présente seulement en Suisse : toutes ses offres. Sinon, une
    // offre au lieu étranger est écartée ici ; sans lieu, la page tranchera.
    return offres
      // Pas de page propre à l'offre chez le client : pas de lien direct, pas de publication.
      .filter(o => o.url)
      .filter(o => cantons || !o.lieu || lieuEnSuisse(o.lieu) || SUISSE.test(o.lieu));
  },

  // Refline (outil suisse) : la liste publique du compte, puis, pour chaque
  // offre, son bloc « JobPosting » (lieu exact, type de contrat, texte).
  // `exiger` : pour un compte partagé (le canton de Lucerne publie toutes ses
  // administrations), un motif que l'employeur ou le texte doit contenir.
  async refline({ compte, exiger, hote = "apply.refline.ch" }) {
    const motif = exiger ? new RegExp(exiger, "i") : null;
    const html = await (await lireUrl(`https://${hote}/${compte}/search.html?form.buttons.listAll=1&lang=fr`)).text();
    const liens = [...new Set([...html.matchAll(new RegExp(`/${compte}/(\\d+)/pub/(\\d+)/index\\.html`, "g"))].map(m => m[0]))];
    return liens.map(chemin => {
      const ref = chemin.split("/")[2];
      // Titre lu dans la liste (le lien qui pointe vers l'offre).
      const titre = propreHtml(html.match(new RegExp(`href="[^"]*${chemin.replace(/[.]/g, "\\.")}"[^>]*>([\\s\\S]*?)</a>`))?.[1] ?? "");
      return {
        ref, titre: titre || ref, url: `https://apply.refline.ch${chemin}`,
        detail: async () => {
          const page = await (await lireUrl(`https://apply.refline.ch${chemin}`)).text();
          for (const m of page.matchAll(/<script[^>]*ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
            let o; try { o = JSON.parse(m[1]); } catch { continue; }
            if (o["@type"] !== "JobPosting") continue;
            const a = o.jobLocation?.address ?? (Array.isArray(o.jobLocation) ? o.jobLocation[0]?.address : undefined) ?? {};
            // Offre d'une autre administration du même compte : écartée.
            if (motif && !motif.test(`${o.hiringOrganization?.name ?? ""} ${o.title ?? ""} ${o.description ?? ""}`)) return { suisse: false };
            return {
              titre: o.title, html: o.description ?? "", date: o.datePosted,
              contrat: [].concat(o.employmentType ?? []).join(" "),
              lieu: a.addressLocality,
              suisse: !a.addressCountry || /^(CH|CHE|switzerland|schweiz|suisse)$/i.test(a.addressCountry),
            };
          }
          return { html: "" };
        },
      };
    });
  },

  // rexx : portail carrière de l'entreprise (jobs.<entreprise>.ch). La page de
  // liste renvoie vers des offres « …-j908.html », chacune avec son bloc
  // JobPosting, dont la rubrique « responsibilities » (les tâches).
  // `employeur` : pour un portail de groupe (Frutiger), le motif du nom de
  // l'employeur à garder.
  // `liste` : une adresse ou plusieurs (chaque langue du portail ne liste
  // que ses propres offres : jobs.frutiger.com/fr en a 11, /de 25).
  async rexx({ liste, employeur }) {
    const motif = employeur ? new RegExp(employeur, "i") : null;
    // Lien et texte du lien (le titre), une entrée par offre (par numéro).
    const titres = new Map();
    for (const adresse of [].concat(liste)) {
      const html = await (await lireUrl(adresse)).text();
      const origine = new URL(adresse).origin;
      for (const m of html.matchAll(/<a[^>]*href="([^"]*-j(\d+)\.html)[^"]*"[^>]*>([\s\S]*?)<\/a>/g)) {
        const url = new URL(m[1], adresse).href.replace(/\?.*$/, "");
        const t = propreHtml(m[3]);
        if (!url.startsWith(origine)) continue;
        const prec = titres.get(m[2]);
        if (!prec || t.length > prec.titre.length) titres.set(m[2], { url, titre: t });
      }
      await pause(300);
    }
    return [...titres.entries()].map(([ref, { url, titre }]) => ({
      ref, titre: titre || url.split("/").pop().replace(/-[a-z]{2}-j\d+\.html$/, "").replace(/-/g, " "), url,
      detail: async () => {
        const page = await (await lireUrl(url)).text();
        for (const m of page.matchAll(/<script[^>]*ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
          let o; try { o = [].concat(JSON.parse(m[1])).find(x => x?.["@type"] === "JobPosting"); } catch { continue; }
          if (!o) continue;
          if (motif && !motif.test(o.hiringOrganization?.name ?? "")) return { suisse: false };
          const lieux = [].concat(o.jobLocation ?? []).map(l => l?.address ?? {});
          const a = lieux.find(x => /^(CH|CHE|switzerland|schweiz|suisse)$/i.test(x.addressCountry ?? "")) ?? lieux[0] ?? {};
          return {
            titre: o.title, date: o.datePosted, contrat: [].concat(o.employmentType ?? []).join(" "),
            // Les tâches d'abord : c'est l'aperçu voulu ; à défaut, la description.
            // Puis la description : quand la rubrique des tâches ne contient
            // que des avantages (apprentissages AMAG), l'aperçu passe au texte.
            html: [o.responsibilities, o.description].filter(Boolean).join("<p></p>"),
            lieu: a.addressLocality,
            suisse: !a.addressCountry || /^(CH|CHE|switzerland|schweiz|suisse)$/i.test(a.addressCountry),
          };
        }
        return { suisse: false }; // page sans offre lisible : on ne publie rien plutôt qu'un titre vide
      },
    }));
  },

  // Softgarden : flux public jobs.feed.json (offres complètes au format
  // JobPosting, lien direct vers chaque offre). `employeur` : pour un compte
  // partagé (K2 Sports et Völkl), le motif du nom de l'employeur.
  async softgarden({ compte, employeur }) {
    const motif = employeur ? new RegExp(employeur, "i") : null;
    const flux = await json(`https://${compte}.career.softgarden.de/jobs.feed.json`);
    return (flux.dataFeedElement ?? []).map(e => e.item ?? e)
      .filter(o => o?.["@type"] === "JobPosting")
      .filter(o => !motif || motif.test(`${o.hiringOrganization?.name ?? ""} ${o.identifier?.name ?? ""}`))
      .map(o => ({ o, a: [].concat(o.jobLocation ?? []).map(l => l?.address ?? {}).find(x => /^(CH|CHE|schweiz|switzerland|suisse|svizzera)$/i.test(x.addressCountry ?? "")) }))
      .filter(({ a }) => a)
      .map(({ o, a }) => ({
        ref: o.identifier?.value ?? o.url, titre: o.title, lieu: a.addressLocality,
        contrat: [].concat(o.employmentType ?? []).join(" "), date: o.datePosted,
        html: o.description ?? "", url: o.url,
      }));
  },

  // Site carrière « maison » qui publie ses offres au format JobPosting (le
  // format lu par Google). On lit la page carrière, on suit les liens qui
  // mènent à des offres (`motif` : le chemin de ces liens), et chaque page
  // d'offre donne son bloc JobPosting. Le lien publié est la page de l'offre.
  async jsonld({ liste, motif }) {
    const re = new RegExp(motif ?? "job|stelle|offre|emploi|vacanc|position|poste|annonce|ausschreibung|lavoro", "i");
    const offres = new Map();
    for (const adresse of [].concat(liste)) {
      const html = await (await lireUrl(adresse)).text();
      const origine = new URL(adresse).origin;
      for (const m of html.matchAll(/<a[^>]*href="([^"#]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
        // Identifiant de session (« ;jsessionid=… ») retiré : il change à chaque
        // visite, l'offre aurait paru nouvelle chaque nuit et le lien expirerait.
        let url; try { url = new URL(entites(m[1]).replace(/;jsessionid=[^?#/]*/i, ""), adresse).href; } catch { continue; }
        if (!url.startsWith(origine) || url === adresse || !re.test(new URL(url).pathname)) continue;
        if (/\.(pdf|jpg|png|svg)$|login|register|alert|abo|newsletter|initiativ|spontan|datenschutz|privacy|cookie/i.test(url)) continue;
        const titre = propreHtml(m[2]);
        if (!offres.has(url) || titre.length > offres.get(url).length) offres.set(url, titre);
      }
      // Liste au format RSS (Avature…) : chaque <item> donne son titre et son lien.
      for (const [, item] of html.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
        const lien = (item.match(/<link>([^<]+)<\/link>/) ?? [])[1]?.trim();
        if (!lien || !re.test(lien)) continue;
        const titre = propreHtml((item.match(/<title>([\s\S]*?)<\/title>/) ?? [])[1]?.replace(/<!\[CDATA\[|\]\]>/g, "") ?? "");
        offres.set(new URL(entites(lien), adresse).href, titre);
      }
      await pause(300);
    }
    return [...offres.entries()].map(([url, titre]) => ({
      ref: new URL(url).pathname.replace(/\/$/, "").slice(-120), titre: titre || "offre", url,
      detail: async () => {
        const page = await (await lireUrl(url)).text();
        for (const m of page.matchAll(/<script[^>]*ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
          let o; try { o = JSON.parse(m[1].trim()); } catch { continue; }
          const jp = [].concat(o, o?.["@graph"] ?? []).flat().find(x => x && [].concat(x["@type"]).includes("JobPosting"));
          if (!jp) continue;
          const lieux = [].concat(jp.jobLocation ?? []).map(l => l?.address ?? {});
          const pays = a => a.addressCountry?.name ?? a.addressCountry ?? "";
          const a = lieux.find(x => /^(CH|CHE|switzerland|schweiz|suisse|svizzera)$/i.test(pays(x))) ?? lieux[0] ?? {};
          return {
            titre: jp.title, date: jp.datePosted, contrat: [].concat(jp.employmentType ?? []).join(" "),
            html: [jp.responsibilities, jp.description].filter(Boolean).join("<p></p>"),
            lieu: a.addressLocality, suisse: !pays(a) || /^(CH|CHE|switzerland|schweiz|suisse|svizzera)$/i.test(pays(a)),
          };
        }
        // Pas de bloc JobPosting : ce n'est pas une page d'offre (ou on ne sait pas la lire).
        return { suisse: false };
      },
    }));
  },

  // Teamtailor : flux RSS public <site>/jobs.rss, avec lieux et pays.
  async teamtailor({ site }) {
    const xml = await (await lireUrl(`${site.replace(/\/$/, "")}/jobs.rss`)).text();
    const champ = (b, n) => entites((b.match(new RegExp(`<${n}>([\\s\\S]*?)</${n}>`)) ?? [])[1]?.replace(/<!\[CDATA\[|\]\]>/g, "").trim() ?? "");
    return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, b]) => {
      const lieux = [...b.matchAll(/<tt:location>([\s\S]*?)<\/tt:location>/g)].map(([, l]) => ({ ville: champ(l, "tt:city") || champ(l, "tt:name"), pays: champ(l, "tt:country") }));
      const suisse = lieux.find(l => /^(switzerland|schweiz|suisse|svizzera|ch)$/i.test(l.pays));
      return suisse ? { ref: champ(b, "guid"), titre: champ(b, "title"), lieu: suisse.ville, contrat: champ(b, "tt:role"), date: champ(b, "pubDate"), html: champ(b, "description"), url: champ(b, "link") } : null;
    }).filter(Boolean);
  },

  // Jibe (sites carrière d'Aon, d'AXA…) : interface publique /api/jobs.
  // Son champ « apply_url » mène à un formulaire de connexion : jamais
  // publié. Le lien est la page de l'offre, `${page}/${slug}`.
  async jibe({ site, filtre, page }) {
    const jobs = [];
    for (let n = 1; n <= 20; n++) {
      const r = await json(`${site}/api/jobs?${filtre}&limit=100&page=${n}`);
      jobs.push(...(r.jobs ?? []).map(j => j.data));
      if ((r.jobs ?? []).length < 100) break;
      await pause(400);
    }
    return jobs.filter(d => d.country_code === "CH" || /switzerland|schweiz|suisse/i.test(d.country ?? "")).map(d => ({
      ref: d.req_id ?? d.slug, titre: d.title, lieu: d.city, contrat: [d.employment_type, ...(d.tags2 ?? [])].filter(Boolean).join(" "),
      date: d.posted_date, html: [d.responsibilities, d.description].filter(Boolean).join("<p></p>"),
      url: `${page}/${d.slug}${d.language ? `?lang=${d.language}` : ""}`,
    }));
  },

  // Recruitee : API publique des offres.
  async recruitee({ compte }) {
    // Compte (« neho ») ou domaine propre au client (« careers.neho.ch »).
    const d = await json(`https://${compte.includes(".") ? compte : `${compte}.recruitee.com`}/api/offers/`);
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

  // Certains flux listent la même offre deux fois (une par lieu ou par
  // langue) : une référence, une offre.
  const vues = new Set();
  const brutes = (await lecteur(params, entreprise))
    .filter(o => o.ref && o.titre && !CANDIDATURE_SPONTANEE.test(o.titre))
    .filter(o => !vues.has(String(o.ref)) && vues.add(String(o.ref)));
  // Lecture par pages : la base rend au plus 1000 lignes à la fois, et Coop a
  // plus de deux mille offres. Sans cela, les offres au-delà de la millième
  // paraissaient nouvelles à chaque passage.
  const existantes = [];
  for (let de = 0; ; de += 1000) {
    const { data, error } = await db.from("job_offers").select("id,source_ref,is_active,description," + CHAMPS.join(","))
      .eq("company_id", company_id).eq("source", outil).order("id").range(de, de + 999);
    if (error) throw new Error(`lecture des offres existantes : ${error.message}`);
    existantes.push(...data);
    if (data.length < 1000) break;
  }
  const parRef = new Map((existantes ?? []).map(o => [o.source_ref, o]));
  const actives = (existantes ?? []).filter(o => o.is_active).length;

  // Garde-fou : un flux qui revient soudain vide alors qu'il portait plusieurs
  // offres est plus souvent cassé que réellement vidé. On ne ferme rien.
  if (brutes.length === 0 && actives >= 3) throw new Error(`flux vide alors que ${actives} offres sont en ligne : rien n'est fermé, à vérifier`);

  const maintenant = new Date().toISOString();
  const bilan = { lues: 0, ajoutees: [], modifiees: [], fermees: [], inchangees: 0 };

  // 1. Lecture des pages d'offre utiles. Le détail (texte, date) ne se lit que
  // pour une offre nouvelle ou dont le titre a changé : d'un jour à l'autre,
  // l'essentiel ne bouge pas.
  for (const b of brutes) {
    const ex = parRef.get(String(b.ref));
    b._detailLu = !b.detail;
    if (b.detail && (complet || !ex || ex.title !== titrePropre(b.titre) || !ex.description)) {
      const d = await b.detail();
      if (d.suisse === false) { b._ecartee = true; continue; }
      Object.assign(b, Object.fromEntries(Object.entries(d).filter(([, v]) => v !== undefined)));
      b._detailLu = true;
      await pause(150);
    }
  }

  // 2. Phrases communes de l'entreprise (avantages, slogans, présentation),
  // calculées quand assez de textes sont lus, et gardées pour les passes où
  // seules quelques offres nouvelles le sont.
  const avecTexte = brutes.filter(b => !b._ecartee && b.html).map(b => ({ html: b.html, titre: b.titre }));
  let communes;
  if (avecTexte.length >= 8) {
    communes = phrasesCommunes(avecTexte);
    if (!essai) await db.from("sources_offres").update({ phrases_communes: [...communes] }).eq("company_id", company_id);
  } else {
    communes = new Set(src.phrases_communes ?? []);
  }

  for (const b of brutes) {
    if (b._ecartee) continue;
    const ex = parRef.get(String(b.ref));
    const detailLu = b._detailLu;
    // Ville de repli quand le lieu de l'offre est illisible (pas « Multi-sites »).
    const ville = /multi/i.test(src.companies.city ?? "") ? null : src.companies.city;
    // Flux qui ne donne que le pays (« CH ») : pour une entreprise présente
    // seulement en Suisse, sa ville est la bonne réponse ; pour un groupe
    // présent partout (Avolta), mieux vaut aucun lieu qu'un lieu faux.
    if (/^\s*CH\s*$/.test(b.lieu ?? "") && params.cantons && ville) b.lieu = ville;
    const o = offre(b, entreprise, ville, communes);
    // Détail non relu : ce qu'il avait apporté (lien exact, contrat) reste
    // celui déjà en base, sinon l'offre paraîtrait modifiée à chaque passage.
    // Pour les outils dont la page d'offre apporte le lieu exact, le titre
    // officiel, le taux ou le contrat (Workday, rexx, Refline, Umantis…),
    // une passe sans relecture garde tout ce que la page avait apporté. Sans
    // cela, la nuit remplaçait le lieu lu sur la page par celui, plus pauvre,
    // de la liste : les données se dégradaient à chaque passe.
    if (!detailLu && ex) for (const k of CHAMPS) o[k] = ex[k];
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
      if (process.env.SYNCHRO_DEBUG && bilan.modifiees.length < 3) {
        console.log(`[diff] ${entreprise} · ${o.title}`, JSON.stringify(Object.fromEntries([...CHAMPS, "description"].filter(k => o[k] !== undefined && (ex[k] ?? null) !== (o[k] ?? null)).map(k => [k, [ex[k], o[k]]]))).slice(0, 400));
      }
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


// ─── Passe complète ──────────────────────────────────────────────────
/**
 * Synchronise toutes les sources actives (ou celles dont le nom contient
 * `filtre`). Les entreprises synchronisées il y a le plus longtemps passent en
 * premier ; passé `budgetMs`, aucune nouvelle entreprise n'est commencée et la
 * passe suivante reprend là. Rend un bilan lisible.
 *
 * @param {{ client: any, essai?: boolean, complet?: boolean, filtre?: string, budgetMs?: number, journal?: (ligne: string) => void }} options
 */
export async function synchroniserTout({ client, essai = false, complet: relireTout = false, filtre, budgetMs = Infinity, journal = () => {} }) {
  db = client;
  complet = relireTout;
  const debut = Date.now();
  const { data: sources, error } = await db.from("sources_offres")
    .select("company_id,outil,params,derniere_synchro,phrases_communes,companies(name,city)")
    .eq("actif", true)
    .order("derniere_synchro", { ascending: true, nullsFirst: true });
  if (error) throw new Error(error.message);
  // Plusieurs noms possibles, séparés par « | ».
  const noms = (filtre ?? "").toLowerCase().split("|").map(x => x.trim()).filter(Boolean);
  const choisies = sources.filter(s => !noms.length || noms.some(n => s.companies.name.toLowerCase().includes(n)));

  const resultats = [];
  let i = 0;
  let reportees = 0;
  // Plusieurs entreprises peuvent partager le même serveur (Workday regroupe
  // ses clients sur wd1, wd3, wd5…). Sur un serveur partagé, une seule
  // entreprise à la fois : dix requêtes simultanées y valent un refus (429).
  const serveur = s => s.outil === "workday" ? s.params.hote.split(".").slice(1).join(".") : `${s.outil}:${JSON.stringify(s.params)}`;
  const occupes = new Set();
  await Promise.all(Array.from({ length: Math.min(EN_PARALLELE, choisies.length) }, async () => {
    while (i < choisies.length) {
      if (Date.now() - debut > budgetMs) { reportees = Math.max(reportees, choisies.length - i); break; }
      const k = choisies.findIndex((s, j) => j >= i && !occupes.has(serveur(s)));
      if (k < 0) { await pause(200); continue; }
      [choisies[i], choisies[k]] = [choisies[k], choisies[i]];
      const s = choisies[i++];
      occupes.add(serveur(s));
      try {
        const b = await synchroniser(s, essai);
        resultats.push(b);
        journal(`${b.entreprise} : +${b.ajoutees.length} ~${b.modifiees.length} −${b.fermees.length}`);
        if (!essai) await db.from("sources_offres").update({ derniere_synchro: new Date().toISOString(), dernier_bilan: { lues: b.lues, ajoutees: b.ajoutees.length, modifiees: b.modifiees.length, fermees: b.fermees.length }, derniere_erreur: null }).eq("company_id", s.company_id);
      } catch (e) {
        resultats.push({ entreprise: s.companies.name, outil: s.outil, erreur: e.message });
        journal(`⚠ ${s.companies.name} : ${e.message}`);
        if (!essai) await db.from("sources_offres").update({ derniere_synchro: new Date().toISOString(), derniere_erreur: e.message.slice(0, 500) }).eq("company_id", s.company_id);
      } finally { occupes.delete(serveur(s)); }
    }
  }));

  const erreurs = resultats.filter(r => r.erreur);
  const total = k => resultats.reduce((n, r) => n + (r[k]?.length ?? 0), 0);
  return {
    entreprises: resultats.length,
    reportees,
    offres: resultats.reduce((n, r) => n + (r.lues ?? 0), 0),
    ajoutees: total("ajoutees"), modifiees: total("modifiees"), fermees: total("fermees"),
    erreurs: erreurs.map(r => ({ entreprise: r.entreprise, outil: r.outil, erreur: r.erreur })),
    details: resultats.filter(r => !r.erreur && (r.ajoutees.length || r.modifiees.length || r.fermees.length))
      .sort((a, b) => a.entreprise.localeCompare(b.entreprise))
      .map(r => ({ entreprise: r.entreprise, lues: r.lues, ajoutees: r.ajoutees, modifiees: r.modifiees.length, fermees: r.fermees })),
    duree: Math.round((Date.now() - debut) / 1000),
    // Quelques sites en panne une nuit, c'est normal : ils sont notés dans
    // sources_offres et repris la nuit suivante. Au-delà d'un cinquième en
    // erreur, c'est notre côté qui cloche.
    echec: erreurs.length > Math.max(2, resultats.length / 5),
  };
}

// Lecteurs exposés pour les essais (scripts, tests).
export { LECTEURS };
