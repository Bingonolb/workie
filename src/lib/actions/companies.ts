"use server";

import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Company } from "@/lib/types";

function stripAccents(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function escapeLike(s: string) {
  return s.replace(/[%_\\]/g, "\\$&");
}

const SWIPE_PAGE_SIZE = 50;

// Pour le mode swipe — premier batch seulement (lazy loading ensuite)
export async function getAllCompaniesForSwipe(filters?: {
  sector?: string;
  canton?: string;
  search?: string;
}) {
  return fetchSwipePage(filters, 0);
}

// Appelé depuis le client pour charger le prochain batch
export async function fetchSwipePage(
  filters: { sector?: string; canton?: string; search?: string } | undefined,
  offset: number
) {
  const supabase = await createClient();
  let q = supabase
    .from("companies")
    .select(GRID_COLS)
    .order("profile_score", { ascending: false, nullsFirst: false })
    .order("score", { ascending: false, nullsFirst: false })
    .order("avg_rating", { ascending: false, nullsFirst: false })
    .order("name", { ascending: true })
    .range(offset, offset + SWIPE_PAGE_SIZE - 1);

  if (filters?.sector) q = q.eq("sector", filters.sector);
  if (filters?.canton) q = q.eq("canton", filters.canton);
  if (filters?.search) {
    // Le nom et le sous-secteur, chacun dans la forme saisie et dans sa forme
    // sans accents. Chercher « brasserie » ne renvoyait rien alors que huit
    // fiches le portent en sous-secteur : le champ n'etait lu par aucune
    // recherche, et tout le travail de curation y restait invisible.
    const raw = filters.search.trim();
    const stripped = escapeLike(stripAccents(raw));
    const original = escapeLike(raw);
    const motifs = stripped !== original ? [original, stripped] : [original];
    q = q.or(
      motifs
        .flatMap(m => [`name.ilike.%${m}%`, `subsector.ilike.%${m}%`])
        .join(",")
    );
  }

  const { data } = await q;
  // Une entreprise sans ville rendrait une pastille vide sur la carte : elle
  // reste ecartee.
  //
  // L'absence d'etiquettes, elle, n'ecarte plus rien. Ce filtre datait du
  // temps ou la carte du swipe les affichait ; elle montre desormais le nom,
  // le metier, la ville et la description, et aucun de ces champs n'en depend.
  // La consequence etait severe et silencieuse : nettoyer une fiche, donc lui
  // retirer ses etiquettes, la faisait disparaitre du swipe. Sur quarante
  // entreprises en Alimentation, trente-cinq etaient invisibles, precisement
  // les mieux tenues.
  return (data ?? []).filter(c => c.city?.trim()) as Company[];
}


import { GRID_PAGE_SIZE, COMPANY_PUBLIC_COLS } from "@/lib/actions/columns";

const GRID_COLS = "id,name,sector,subsector,city,canton,employee_range,avg_rating,review_count,avg_salary_chf,cover_url,cover_color,logo_url,score,is_verified,description,profile_score";

// Cached grid fetcher — no cookies(), uses adminClient, safe to cache across requests.
// All users with the same filters share one DB query per 60s instead of N.
const _fetchGridPageCached = unstable_cache(
  async (
    filters: { sector?: string; canton?: string; sort?: string; graine?: number },
    page: number
  ): Promise<{ companies: Company[]; total: number }> => {
    const admin = createAdminClient();

    // Mélange sur la totalité du catalogue, fait en base : trier côté client
    // ne mélangerait que la page déjà chargée, et il est impossible de
    // rapatrier cent mille entreprises pour les battre dans le navigateur.
    // « recent » est le nom du tri par défaut, pas un tri explicite : le
    // traiter comme tel faisait échouer la condition et les pages suivantes
    // revenaient dans l'ordre classique, alors que la première était mélangée.
    // Les deux ordres se chevauchaient — mesuré, 4 entreprises en double sur
    // 168 chargées, toutes issues du premier lot.
    const triExplicite = filters.sort && filters.sort !== "recent" ? filters.sort : undefined;

    if (!triExplicite && filters.graine !== undefined) {
      const { data } = await admin.rpc("lister_entreprises_melangees", {
        graine: filters.graine,
        secteur: filters.sector ?? null,
        canton_filtre: filters.canton ?? null,
        decalage: page * GRID_PAGE_SIZE,
        taille: GRID_PAGE_SIZE,
      });
      const lignes = (data ?? []) as unknown as (Company & { total: number })[];
      return {
        companies: lignes.map(({ total: _t, ...c }) => c) as Company[],
        total: Number(lignes[0]?.total ?? 0),
      };
    }

    let q = admin
      .from("companies")
      .select(GRID_COLS, { count: "exact" })

    if (filters.sector) q = q.eq("sector", filters.sector);
    if (filters.canton) q = q.eq("canton", filters.canton);

    switch (triExplicite) {
      case "rating":
        q = q
          .order("avg_rating",   { ascending: false, nullsFirst: false })
          .order("review_count", { ascending: false, nullsFirst: false })
          .order("name",         { ascending: true });
        break;
      case "reviews":
        q = q
          .order("review_count", { ascending: false, nullsFirst: false })
          .order("avg_rating",   { ascending: false, nullsFirst: false })
          .order("name",         { ascending: true });
        break;
      case "score":
        q = q
          .order("score",      { ascending: false, nullsFirst: false })
          .order("avg_rating", { ascending: false, nullsFirst: false })
          .order("name",       { ascending: true });
        break;
      case "name":
        q = q.order("name", { ascending: true });
        break;
      default:
        q = q
          .order("profile_score", { ascending: false, nullsFirst: false })
          .order("score",         { ascending: false, nullsFirst: false })
          .order("avg_rating",    { ascending: false, nullsFirst: false })
          .order("name",          { ascending: true });
    }

    const { data, count } = await q.range(
      page * GRID_PAGE_SIZE,
      (page + 1) * GRID_PAGE_SIZE - 1
    );

    return { companies: (data ?? []) as Company[], total: count ?? 0 };
  },
  ["grid-page"],
  { revalidate: 60, tags: ["companies"] }
);

/**
 * Une page de la grille.
 *
 * Quand aucun tri explicite n'est demandé, l'ordre est mélangé à partir d'une
 * graine. L'explorateur montrait sinon éternellement les mêmes entreprises en
 * tête, ce qui le rendait inutile : on y voyait toujours la même chose.
 *
 * La graine appartient à la session du visiteur et ne change pas tant qu'il
 * navigue — sans quoi la pagination répéterait ou sauterait des entreprises.
 * Elle est bornée à cent valeurs : assez pour que deux visites successives
 * diffèrent, assez peu pour que le cache reste partagé entre visiteurs plutôt
 * que d'être recalculé pour chacun.
 */
export async function fetchGridPage(
  filters: { sector?: string; canton?: string; sort?: string; graine?: number },
  page: number
): Promise<{ companies: Company[]; total: number }> {
  return _fetchGridPageCached(filters, page);
}

export const getCachedCompany = unstable_cache(
  async (id: string) => {
    const admin = createAdminClient();
    const { data } = await admin.from("companies").select(COMPANY_PUBLIC_COLS).eq("id", id).maybeSingle();
    return data as Company | null;
  },
  ["company"],
  { revalidate: 60, tags: ["companies"] }
);

/**
 * Offres d'emploi et entreprises voisines : deux données publiques, identiques
 * pour tous les visiteurs, qui étaient pourtant réinterrogées à chaque
 * affichage de fiche. Mesuré en production, une fiche coûtait environ 200 ms
 * là où /explore répondait en 5 ms depuis son cache.
 */
export const getCachedJobOffers = unstable_cache(
  async (companyId: string) => {
    const admin = createAdminClient();
    const { data } = await admin
      .from("job_offers")
      .select("id, title, location, contract_type, work_mode, experience_level, salary_range, apply_url, description, created_at")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    return data ?? [];
  },
  ["job-offers"],
  { revalidate: 300, tags: ["companies"] }
);

export const getCachedSimilarCompanies = unstable_cache(
  async (sector: string, excludeId: string) => {
    const admin = createAdminClient();
    const { data } = await admin
      .from("companies")
      .select("id, name, city, avg_rating, review_count, cover_url, cover_color, is_verified, sector, subsector")
      .eq("sector", sector)
      .neq("id", excludeId)
      .order("score", { ascending: false })
      .limit(4);
    return data ?? [];
  },
  ["similar-companies"],
  { revalidate: 300, tags: ["companies"] }
);
