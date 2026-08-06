import { NextResponse } from "next/server";
import { createClient, getUser } from "@/lib/supabase/server";

/**
 * État propre au visiteur pour une fiche entreprise.
 *
 * Ces données ne peuvent pas être rendues avec le reste de la page : elles
 * dépendent du cookie de session, et le moindre accès à ce cookie force Next à
 * marquer la route « dynamique ». Or une route dynamique ne peut pas être
 * préchargée : le survol d'un lien ne met en cache que la coquille, et le clic
 * attend ensuite un aller-retour serveur complet. C'est ce qui rendait la
 * navigation vers une fiche sensiblement plus lente que vers /explore, qui
 * applique déjà ce partage.
 *
 * La fiche est donc rendue une fois pour tout le monde et servie depuis le
 * cache ; ce qui distingue un visiteur d'un autre est récupéré ici, après
 * affichage.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const visiteur = {
    isLoggedIn: false, isAdmin: false, penaltyCredits: 0,
    isFav: false, boosted: false, penalized: false, votedReviewIds: [] as string[],
  };
  const entetes = { "Cache-Control": "private, no-store" };

  try {
    const user = await getUser();
    if (!user) return NextResponse.json(visiteur, { headers: entetes });

    const supabase = await createClient();
    const [profil, favori, evenements, votes] = await Promise.all([
      supabase.from("profiles").select("role, penalty_credits").eq("id", user.id).maybeSingle(),
      supabase.from("favorites").select("company_id").eq("user_id", user.id).eq("company_id", id).maybeSingle(),
      supabase.from("score_events").select("event_type").eq("company_id", id).eq("user_id", user.id)
        .in("event_type", ["boost", "penalty"]),
      supabase.from("review_votes").select("review_id, reviews!inner(company_id)").eq("user_id", user.id)
        .eq("reviews.company_id", id),
    ]);

    const types = (evenements.data ?? []).map(e => e.event_type);

    return NextResponse.json({
      isLoggedIn: true,
      isAdmin: profil.data?.role === "admin",
      penaltyCredits: Number(profil.data?.penalty_credits ?? 0),
      isFav: !!favori.data,
      boosted: types.includes("boost"),
      penalized: types.includes("penalty"),
      votedReviewIds: (votes.data ?? []).map(v => v.review_id),
    }, { headers: entetes });
  } catch {
    // Une panne ici ne doit pas casser la fiche : on retombe sur l'état
    // visiteur, qui est aussi celui rendu par le serveur.
    return NextResponse.json(visiteur, { headers: entetes });
  }
}
