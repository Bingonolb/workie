import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSecteursEnLigne } from "@/lib/secteursEnLigne";
import { offresSynchro } from "@/lib/ouverture";
import { CONTRATS } from "@/lib/offres";

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
const LANGUES = new Set(["fr", "de", "en", "it"]);
const liste = (v: string | null) => (v ?? "").split(",").map(s => s.trim()).filter(Boolean);

export type OffreExplorer = {
  id: string; title: string; location: string | null; contract_type: string | null;
  taux_min: number | null; taux_max: number | null; langue: string | null;
  apply_url: string | null; apercu: string | null; created_at: string | null;
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
  const contrats = liste(p.get("contrat")).filter(c => (CONTRATS as readonly string[]).includes(c));

  const admin = createAdminClient();
  let q = admin
    .from("offres_explorer" as "job_offers")
    .select("id, title, location, contract_type, taux_min, taux_max, langue, apply_url, description, missions, created_at, companies!inner(id, slug, name, logo_url, cover_url, cover_color, sector, subsector, city, canton)", { count: "exact" })
    .in("companies.sector", secteurs.length ? secteurs : enLigne);
  if (!offresSynchro) q = q.is("source", null);
  if (cantons.length) q = q.in("companies.canton", cantons);
  if (langues.length) q = q.in("langue", langues);
  if (contrats.length) q = q.in("contract_type", contrats);

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
  const offres: OffreExplorer[] = ((data ?? []) as unknown as (Omit<OffreExplorer, "apercu" | "entreprise"> & { description: string | null; missions: string | null; companies: OffreExplorer["entreprise"] })[])
    .map(({ description, missions, companies, ...o }) => ({ ...o, apercu: court(description ?? missions), entreprise: companies }));

  return NextResponse.json({ offres, total: count ?? offres.length, parPage: PAR_PAGE }, {
    headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" },
  });
}
