import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSecteursEnLigne } from "@/lib/secteursEnLigne";
import { offresSynchro } from "@/lib/ouverture";
import { CONTRATS } from "@/lib/offres";
import { unstable_cache } from "next/cache";
import { analyser, motsDe } from "@/lib/rechercheOffres";

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

export type OffreExplorer = {
  id: string; title: string; location: string | null; contract_type: string | null;
  taux_min: number | null; taux_max: number | null; langue: string | null;
  apply_url: string | null; apercu: string | null; created_at: string | null;
  // Pour l'aperçu de l'offre, le même que sur la fiche entreprise.
  description: string | null; missions: string | null; requirements: string | null; avantages: string | null;
  work_mode: string | null; experience_level: string | null; entree: string | null; langues: string[] | null; source: string | null;
  entreprise: {
    id: string; slug: string | null; name: string; logo_url: string | null; cover_url: string | null;
    cover_color: string | null; sector: string | null; subsector: string | null; city: string | null; canton: string | null;
  };
};

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
  let q = admin
    .from("offres_explorer" as "job_offers")
    .select("id, title, location, contract_type, taux_min, taux_max, langue, apply_url, description, missions, requirements, avantages, work_mode, experience_level, entree, langues, source, created_at, companies!inner(id, slug, name, logo_url, cover_url, cover_color, sector, subsector, city, canton)", { count: "exact" })
    .in("companies.sector", secteurs.length ? secteurs : enLigne);
  if (!offresSynchro) q = q.is("source", null);
  if (cantons.length) q = q.in("companies.canton", cantons);
  if (langues.length) q = q.in("langue", langues);
  // Recherche « intelligente » (« vendeur 80% anglais ») : chaque métier
  // cherché dans les quatre langues, taux, langue et contrat compris.
  const saisie = (p.get("q") ?? "").slice(0, 120);
  const recherche = saisie.trim() ? analyser(saisie, new Set(await vocabulaire())) : null;
  if (recherche) {
    for (const g of recherche.groupes) q = q.or(g.map(v => `titre_norm.ilike."*${v}*"`).join(","));
    if (recherche.taux) q = q.lte("taux_min", recherche.taux).gte("taux_max", recherche.taux);
    if (recherche.partiel) q = q.lt("taux_min", 100);
    if (recherche.langues.length) q = q.in("langue", recherche.langues);
    if (recherche.contrats.length) q = q.in("contract_type", recherche.contrats);
  }
  if (sansContrat) q = q.or(["contract_type.is.null", ...(contrats.length ? [`contract_type.in.(${contrats.join(",")})`] : [])].join(","));
  else if (contrats.length) q = q.in("contract_type", contrats);

  const { data, count, error } = await q
    // Vue offres_explorer : la plus récente de chaque entreprise d'abord,
    // puis la deuxième de chacune… Les employeurs alternent à l'écran.
    .order("rang_entreprise" as "created_at")
    .order("melange" as "created_at")
    .order("id")
    .range(page * PAR_PAGE, page * PAR_PAGE + PAR_PAGE - 1);
  if (error) return NextResponse.json({ offres: [], total: 0 }, { status: 500 });

  // Un aperçu court suffit à la carte : le texte complet reste sur l'offre.
  const court = (s: string | null) => {
    if (!s) return null;
    const t = s.replace(/\s+/g, " ").trim();
    return t.length > 220 ? `${t.slice(0, 220).replace(/\s+\S*$/, "")}…` : t;
  };
  // Champs récents (langue) et jointure : hors des types générés.
  const offres: OffreExplorer[] = ((data ?? []) as unknown as (Omit<OffreExplorer, "apercu" | "entreprise"> & { companies: OffreExplorer["entreprise"] })[])
    .map(({ companies, ...o }) => ({ ...o, apercu: court(o.description ?? o.missions), entreprise: companies }));

  return NextResponse.json({
    offres, total: count ?? offres.length, parPage: PAR_PAGE,
    // Ce que la recherche a compris, montré sous le champ.
    recherche: recherche ? { equivalences: recherche.equivalences, compris: recherche.compris } : null,
  }, {
    headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" },
  });
}
