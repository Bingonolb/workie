import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSecteursEnLigne } from "@/lib/secteursEnLigne";
import { offresSynchro } from "@/lib/ouverture";
import { CONTRATS } from "@/lib/offres";
import { unstable_cache } from "next/cache";
import { analyser, motsDe, pertinence } from "@/lib/rechercheOffres";
import { COLONNES_OFFRE, versOffreAffichee } from "@/lib/offresAffichage";
import { localiserOffres } from "@/lib/traductionsEntreprises";
import { estOuverte } from "@/i18n/config";

/**
 * Les offres d'emploi d'Explorer, vue « Offres ».
 *
 * Mêmes filtres que la vue Entreprises (secteur, canton, langue), plus le
 * contrat. Ici, « langue » désigne la langue dans laquelle l'annonce est
 * écrite (colonne `langue`, déduite du texte à la synchro) : c'est elle qui
 * dit si l'on pourra lire l'offre, et y répondre.
 *
 * Chaque offre arrive avec son entreprise : le parti pris de Workie est de
 * choisir l'employeur autant que le poste. Seules les entreprises des
 * secteurs en ligne sont montrées, comme dans le reste d'Explorer.
 *
 * Données publiques, mises en cache deux minutes.
 */
const PAR_PAGE = 24;

/**
 * Les mots réellement présents dans les titres d'offres : la correction des
 * fautes de frappe s'appuie sur eux (« vendeue » → « vendeuse »). Lu une fois
 * toutes les dix minutes.
 */
const vocabulaire = unstable_cache(async () => {
  const admin = createAdminClient();
  const mots = new Set<string>();
  for (let de = 0; de < 20000; de += 1000) {
    const { data } = await admin.from("offres_explorer" as "job_offers").select("titre_norm").range(de, de + 999);
    for (const r of (data ?? []) as unknown as { titre_norm: string | null }[]) for (const m of motsDe(r.titre_norm ?? "")) mots.add(m);
    if ((data ?? []).length < 1000) break;
  }
  return [...mots];
}, ["vocabulaire-offres"], { revalidate: 600, tags: ["companies"] });
const LANGUES = new Set(["fr", "de", "en", "it"]);
const liste = (v: string | null) => (v ?? "").split(",").map(s => s.trim()).filter(Boolean);


export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const page = Math.max(0, Math.min(200, Number(p.get("page")) || 0));
  const enLigne = await getSecteursEnLigne();
  const secteurs = liste(p.get("sector")).filter(s => enLigne.includes(s));
  const cantons = liste(p.get("canton")).filter(c => /^[A-Z]{2}$/.test(c));
  const langues = liste(p.get("langue")).map(l => l.toLowerCase()).filter(l => LANGUES.has(l));
  // « Non précisé » : l'employeur n'a pas indiqué le contrat (colonne vide).
  const NON_PRECISE = "Non précisé";
  const tous = liste(p.get("contrat"));
  const sansContrat = tous.includes(NON_PRECISE);
  const contrats = tous.filter(c => (CONTRATS as readonly string[]).includes(c));

  const admin = createAdminClient();
  // Recherche « intelligente » (« vendeur 80% anglais ») : chaque métier
  // cherché dans les quatre langues, taux, langue et contrat compris.
  const saisie = (p.get("q") ?? "").slice(0, 120);
  const recherche = saisie.trim() ? analyser(saisie, new Set(await vocabulaire())) : null;

  // Les mêmes filtres, pour la liste légère (classement) comme pour la page.
  const construire = (colonnes: string) => {
    let q = admin
      .from("offres_explorer" as "job_offers")
      .select(colonnes, { count: "exact" })
      .in("companies.sector", secteurs.length ? secteurs : enLigne);
    if (!offresSynchro) q = q.is("source", null);
    if (cantons.length) q = q.in("companies.canton", cantons);
    if (langues.length) q = q.in("langue", langues);
    if (recherche) {
      for (const g of recherche.groupes) q = q.or(g.map(v => `titre_norm.ilike."*${v}*"`).join(","));
      if (recherche.taux) q = q.lte("taux_min", recherche.taux).gte("taux_max", recherche.taux);
      if (recherche.partiel) q = q.lt("taux_min", 100);
      if (recherche.langues.length) q = q.in("langue", recherche.langues);
      if (recherche.contrats.length) q = q.in("contract_type", recherche.contrats);
    }
    if (sansContrat) q = q.or(["contract_type.is.null", ...(contrats.length ? [`contract_type.in.(${contrats.join(",")})`] : [])].join(","));
    else if (contrats.length) q = q.in("contract_type", contrats);
    // Vue offres_explorer : la plus récente de chaque entreprise d'abord,
    // puis la deuxième de chacune… Les employeurs alternent à l'écran.
    return q.order("rang_entreprise" as "created_at").order("melange" as "created_at").order("id");
  };

  let data: unknown[] | null = null, count: number | null = null;
  if (recherche?.groupes.length) {
    // Avec un métier cherché : classement par pertinence (le mot tapé avant
    // ses équivalents), l'alternance des employeurs départageant les égalités.
    // On classe toutes les offres trouvées sur une liste légère, puis on ne
    // charge en entier que celles de la page.
    const legere: { id: string; titre_norm: string | null }[] = [];
    for (let de = 0; de < 5000; de += 1000) {
      const { data: lot, error } = await construire("id, titre_norm, companies!inner(sector)").range(de, de + 999);
      if (error) return NextResponse.json({ offres: [], total: 0 }, { status: 500 });
      legere.push(...(lot as unknown as { id: string; titre_norm: string | null }[]));
      if ((lot ?? []).length < 1000) break;
    }
    const classees = legere
      .map((o, i) => ({ id: o.id, s: pertinence(o.titre_norm ?? "", recherche), i }))
      .sort((a, b) => b.s - a.s || a.i - b.i);
    const ids = classees.slice(page * PAR_PAGE, page * PAR_PAGE + PAR_PAGE).map(o => o.id);
    count = classees.length;
    if (ids.length) {
      const { data: pageData, error } = await construire(COLONNES_OFFRE).in("id", ids);
      if (error) return NextResponse.json({ offres: [], total: 0 }, { status: 500 });
      const rang = new Map(ids.map((id, i) => [id, i]));
      data = ((pageData ?? []) as unknown as { id: string }[]).sort((a, b) => (rang.get(a.id) ?? 0) - (rang.get(b.id) ?? 0));
    } else data = [];
  } else {
    const r = await construire(COLONNES_OFFRE).range(page * PAR_PAGE, page * PAR_PAGE + PAR_PAGE - 1);
    if (r.error) return NextResponse.json({ offres: [], total: 0 }, { status: 500 });
    data = r.data; count = r.count;
  }

  const site = p.get("site");
  // « site » : la langue de la page (« langue » filtre celle des annonces).
  const offres = await localiserOffres((data ?? []).map(versOffreAffichee), estOuverte(site) ? site : "fr");

  return NextResponse.json({
    offres, total: count ?? offres.length, parPage: PAR_PAGE,
    // Ce que la recherche a compris, montré sous le champ.
    recherche: recherche ? { equivalences: recherche.equivalences, compris: recherche.compris } : null,
  }, {
    headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" },
  });
}
