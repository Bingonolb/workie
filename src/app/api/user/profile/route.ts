import { NextResponse } from "next/server";
import { getUser, createClient } from "@/lib/supabase/server";
import { getUserReviews } from "@/lib/actions/reviews";
import { getUserFavoriteIds } from "@/lib/actions/favorites";

/**
 * Tout ce qu'affiche /profile, en une seule réponse.
 *
 * La page était rendue à la demande : validation du jeton auprès de Supabase,
 * puis profil, avis et favoris, avant le premier octet — 965 ms à froid,
 * 300 à 400 ms ensuite. Elle devient une coquille statique et récupère ces
 * données ici, en un aller-retour plutôt qu'un par section.
 *
 * Les trois requêtes partent ensemble : elles ne dépendent que de l'identité
 * de l'utilisateur, déjà connue. Les enchaîner triplerait l'attente pour rien.
 */
export async function GET() {
  const sansCache = { "Cache-Control": "private, no-store" };

  try {
    const [user, supabase] = await Promise.all([getUser(), createClient()]);
    if (!user) {
      return NextResponse.json({ authentifie: false }, { status: 401, headers: sansCache });
    }

    const [{ data: profile }, reviews, favIds, { count: adsActives }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      getUserReviews().catch(() => []),
      getUserFavoriteIds().catch(() => [] as string[]),
      // Compte seul, sans ramener les lignes : la tuile n'affiche qu'un nombre.
      supabase.from("ad_campaigns")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "active"),
    ]);

    return NextResponse.json({
      authentifie: true,
      email: user.email ?? "",
      creeLe: user.created_at ?? null,
      profile: profile ?? null,
      reviews,
      favCount: favIds.length,
      adsActives: adsActives ?? 0,
    }, { headers: sansCache });
  } catch {
    return NextResponse.json({ authentifie: false }, { status: 500, headers: sansCache });
  }
}
