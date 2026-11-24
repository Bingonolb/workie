import { NextResponse } from "next/server";
import { createClient, getUser } from "@/lib/supabase/server";
import { offresParIds } from "@/lib/offresAffichage";

/**
 * Offres enregistrées (signet) du compte connecté : leurs identifiants, pour
 * allumer les signets partout, et les offres elles-mêmes, pour les favoris.
 * Les offres clôturées depuis restent dans la liste, marquées comme telles.
 *
 * Données personnelles : jamais mises en cache, et la réponse déclare son
 * destinataire (`compte`), revérifié côté navigateur (voir cacheSession).
 * Sans session : 401, pas une liste vide, qui ferait croire à une perte.
 */
export async function GET() {
  const sansCache = { "Cache-Control": "private, no-store" };
  const user = await getUser();
  if (!user) return NextResponse.json({ authentifie: false }, { status: 401, headers: sansCache });

  try {
    // Lecture sous l'identité du compte : la politique de la table ne rend
    // que ses propres lignes, quelle que soit la requête.
    const supabase = await createClient();
    const { data, error } = await (supabase as unknown as {
      from: (t: string) => { select: (c: string) => { eq: (c: string, v: string) => { order: (c: string, o: object) => PromiseLike<{ data: { job_offer_id: string }[] | null; error: unknown }> } } };
    }).from("offres_enregistrees").select("job_offer_id").eq("user_id", user.id).order("created_at", { ascending: false });
    if (error) throw error;
    const ids = (data ?? []).map(r => r.job_offer_id);
    return NextResponse.json({ compte: user.id, ids, offres: await offresParIds(ids) }, { headers: sansCache });
  } catch {
    // Échec de lecture : signalé comme tel, jamais comme « aucune offre ».
    return NextResponse.json({ compte: user.id, erreur: true }, { status: 500, headers: sansCache });
  }
}
