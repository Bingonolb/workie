import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSecteursEnLigne } from "@/lib/secteursEnLigne";
import { localiserEntreprises } from "@/lib/traductionsEntreprises";
import { estOuverte } from "@/i18n/config";

/**
 * Les fiches publiques d'une liste d'entreprises, pour les favoris d'un
 * visiteur sans compte (gardés dans son navigateur).
 *
 * Données publiques uniquement, mêmes colonnes que la grille, limitées aux
 * secteurs en ligne. Les identifiants invalides sont ignorés, 300 au plus.
 * L'ordre demandé est conservé (le plus récent favori d'abord).
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COLONNES = "id,slug,name,sector,subsector,city,canton,employee_range,avg_rating,review_count,cover_url,cover_color,logo_url,score,is_verified,description,profile_score";

export async function GET(req: Request) {
  const sansCache = { headers: { "Cache-Control": "private, no-store" } };
  try {
    const parametres = new URL(req.url).searchParams;
    const demandee = parametres.get("langue");
    const langue = estOuverte(demandee) ? demandee : "fr";
    const ids = [...new Set((new URL(req.url).searchParams.get("ids") ?? "").split(",").map(s => s.trim()).filter(s => UUID.test(s)))].slice(0, 300);
    if (!ids.length) return NextResponse.json({ companies: [] }, sansCache);
    const [enLigne, { data }] = await Promise.all([
      getSecteursEnLigne(),
      createAdminClient().from("companies").select(COLONNES).in("id", ids),
    ]);
    const parId = new Map((data ?? []).filter(c => enLigne.includes(c.sector)).map(c => [c.id, c]));
    const liste = ids.map(id => parId.get(id)).filter(<T,>(c: T | undefined): c is T => Boolean(c));
    return NextResponse.json({ companies: await localiserEntreprises(liste, langue) }, sansCache);
  } catch {
    return NextResponse.json({ companies: [] }, { status: 500, ...sansCache });
  }
}
