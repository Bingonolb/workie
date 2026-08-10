import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Recherche d'entreprises.
 *
 * Le classement est fait en base, par `rechercher_entreprises`. C'est
 * délibéré : la version précédente enchaînait quatre requêtes `ilike` puis
 * triait en JavaScript, et surtout elle retirait les accents de la saisie sans
 * les retirer de la colonne. Chercher « etat de geneve » dans une colonne
 * contenant « État de Genève » ne pouvait donc pas aboutir — le traitement
 * empêchait la correspondance au lieu de l'aider. La ponctuation n'était pas
 * traitée du tout, d'où l'échec de « JP Morgan » face à « J.P. Morgan ».
 *
 * Les deux côtés sont désormais normalisés de la même façon — minuscules, sans
 * accents, sans ponctuation — et le classement suit six paliers, du nom exact
 * à la simple ressemblance, ce qui absorbe les fautes de frappe. Deux index
 * couvrent les deux usages : préfixe et trigramme.
 */

type Resultat = {
  id: string;
  name: string;
  city: string;
  sector: string;
  logo_url: string | null;
};

// Mémoire courte partagée par les requêtes d'une même instance : une frappe au
// clavier déclenche plusieurs appels rapprochés, souvent identiques.
const cache = new Map<string, { data: Resultat[]; expire: number }>();
const DUREE_CACHE = 30_000;
const MAX_ENTREES = 500;

function purger() {
  const maintenant = Date.now();
  for (const [k, v] of cache) {
    if (v.expire < maintenant) cache.delete(k);
    if (cache.size <= MAX_ENTREES) break;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().slice(0, 100);
  if (q.length < 1) return NextResponse.json({ companies: [] });

  const cle = q.toLowerCase();
  const enCache = cache.get(cle);
  if (enCache && enCache.expire > Date.now()) {
    return NextResponse.json({ companies: enCache.data }, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("rechercher_entreprises", { terme: q, nb: 8 });

  if (error) {
    // Une recherche en échec ne doit pas casser la page : on renvoie une liste
    // vide, la barre reste utilisable.
    return NextResponse.json({ companies: [] }, { headers: { "Cache-Control": "no-store" } });
  }

  const companies: Resultat[] = (data ?? []).map(
    (r: Resultat & { rang: number; ressemblance: number }) => ({
      id: r.id, name: r.name, city: r.city, sector: r.sector, logo_url: r.logo_url,
    })
  );

  if (cache.size >= MAX_ENTREES) purger();
  cache.set(cle, { data: companies, expire: Date.now() + DUREE_CACHE });

  return NextResponse.json({ companies }, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
  });
}
