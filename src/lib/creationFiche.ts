import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Crée dans l'annuaire la fiche proposée par une demande de création, au
 * moment du paiement (webhook Stripe). Fichier hors actions serveur : il ne
 * doit jamais être appelable depuis un navigateur.
 *
 * Idempotent : Stripe peut renvoyer le même événement ; si la demande porte
 * déjà sa fiche, on la renvoie sans en créer une seconde.
 */
export async function creerFicheDepuisDemande(revendicationId: string, userId: string): Promise<string | null> {
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const revs = admin.from("revendications" as any) as any;
  const { data: r } = await revs.select("id, user_id, company_id, fiche, statut").eq("id", revendicationId).maybeSingle();
  if (!r || r.user_id !== userId) return null;
  if (r.company_id) return r.company_id as string;
  if (!r.fiche || r.statut !== "verifiee") return null;

  const f = r.fiche as { name: string; sector: string; city: string; canton: string; website_url: string; description: string; employee_range: string | null; langues: string[] };
  const { data: c, error } = await admin.from("companies").insert({
    name: f.name, sector: f.sector, city: f.city, canton: f.canton,
    website_url: f.website_url, description: f.description,
    employee_range: f.employee_range, langues: f.langues ?? [],
    avg_rating: 0, review_count: 0, score: 0,
  } as never).select("id").single();
  if (error || !c) {
    console.error("[creation] fiche non créée:", error?.message);
    return null;
  }
  await revs.update({ company_id: c.id }).eq("id", revendicationId);
  return c.id as string;
}
