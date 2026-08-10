import { NextResponse } from "next/server";
import { getFavorites } from "@/lib/actions/favorites";
import { getUser } from "@/lib/supabase/server";

/**
 * Favoris du visiteur.
 *
 * Sert la page /favorites, qui devient une coquille statique. Auparavant la
 * page entière était rendue à la demande : chaque affichage attendait la
 * validation du jeton auprès de Supabase puis la requête en base avant de
 * renvoyer le moindre octet — 250 ms mesurés, pendant lesquels l'écran ne
 * bougeait pas. La coquille part désormais du cache immédiatement et cette
 * réponse la remplit.
 *
 * Jamais mise en cache : le contenu dépend de la session, et une réponse
 * partagée montrerait les favoris de quelqu'un d'autre.
 */
export async function GET() {
  const sansCache = { "Cache-Control": "private, no-store" };

  // Sans session on répond 401, pas une liste vide. La coquille étant en
  // cache, elle peut être servie à quelqu'un dont la session a expiré : lui
  // afficher « aucun favori » lui ferait croire qu'il a tout perdu.
  const user = await getUser();
  if (!user) return NextResponse.json({ authentifie: false }, { status: 401, headers: sansCache });

  try {
    const companies = await getFavorites();
    // Identité du destinataire : le client refuse une réponse qui ne lui
    // appartient pas, quelle que soit la couche de cache traversée.
    return NextResponse.json({ compte: user.id, companies }, { headers: sansCache });
  } catch {
    return NextResponse.json({ compte: user.id, companies: [] }, { headers: sansCache });
  }
}
