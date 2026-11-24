import { createAdminClient } from "@/lib/supabase/admin";
import type { OffreAffichee } from "@/lib/offresTypes";

/**
 * Une offre telle qu'elle s'affiche (carte d'Explorer, favoris, aperçu) : une
 * seule définition des colonnes lues et de leur mise en forme, partagée par
 * toutes les routes qui montrent des offres.
 */
export const COLONNES_OFFRE = "id, title, location, contract_type, taux_min, taux_max, langue, apply_url, description, missions, requirements, avantages, work_mode, experience_level, entree, langues, source, created_at, is_active, expires_at, companies!inner(id, slug, name, logo_url, cover_url, cover_color, sector, subsector, city, canton)";

/** Un aperçu court suffit à la carte : le texte complet reste dans l'aperçu de l'offre. */
function court(s: string | null): string | null {
  if (!s) return null;
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > 220 ? `${t.slice(0, 220).replace(/\s+\S*$/, "")}…` : t;
}

type Ligne = Omit<OffreAffichee, "apercu" | "entreprise" | "cloturee"> & {
  is_active?: boolean | null; expires_at?: string | null; companies: OffreAffichee["entreprise"];
};

export function versOffreAffichee(ligne: unknown): OffreAffichee {
  const { companies, is_active, expires_at, ...o } = ligne as Ligne;
  // Fermée par la synchro, ou expirée : elle reste visible dans les favoris,
  // grisée, plutôt que de disparaître sans explication.
  const cloturee = is_active === false || (!!expires_at && new Date(expires_at) <= new Date());
  return { ...o, apercu: court(o.description ?? o.missions), entreprise: companies, cloturee };
}

/**
 * Les offres demandées, dans l'ordre demandé, clôturées comprises (pour les
 * favoris). Les identifiants inconnus sont simplement absents du résultat.
 */
export async function offresParIds(ids: string[]): Promise<OffreAffichee[]> {
  if (!ids.length) return [];
  const { data } = await createAdminClient().from("job_offers").select(COLONNES_OFFRE).in("id", ids);
  const rang = new Map(ids.map((id, i) => [id, i]));
  return (data ?? []).map(versOffreAffichee).sort((a, b) => (rang.get(a.id) ?? 0) - (rang.get(b.id) ?? 0));
}
