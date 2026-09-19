import { NextResponse } from "next/server";
import { getUser, createClient } from "@/lib/supabase/server";
import { getUserFavoriteIds } from "@/lib/actions/favorites";
import { createAdminClient } from "@/lib/supabase/admin";

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
    const admin = createAdminClient();
    if (!user) {
      return NextResponse.json({ authentifie: false }, { status: 401, headers: sansCache });
    }

    const [{ data: profile }, favIds, { count: adsActives }, { count: adsTotal }, { data: vues }, { data: toutesVues }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      getUserFavoriteIds().catch(() => [] as string[]),
      // Compte seul, sans ramener les lignes : la tuile n'affiche qu'un nombre.
      supabase.from("ad_campaigns")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "active"),
      // Toutes campagnes confondues : la tuile de régie ne s'affiche que pour
      // quelqu'un qui en a déjà créé une. Un « 0 campagne » permanent sur le
      // profil de tout le monde est une publicité déguisée en statistique.
      supabase.from("ad_campaigns")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      // Les dernières fiches ouvertes, pour reprendre où l'on en était.
      //
      // Lecture par le client d'administration, et non par celui de
      // l'utilisateur : company_views n'accorde pas la lecture à la personne
      // qui a fait la visite. Le filtre sur son identifiant est donc le seul
      // rempart, et il est posé ici même, juste en dessous. Sans cela la liste
      // revenait vide et la tuile affichait zéro pour quelqu'un qui a consulté
      // cent soixante-seize entreprises.
      admin.from("company_views")
        .select("company_id, viewed_at, companies(id, name, city, subsector, cover_url, cover_color, is_verified)")
        .eq("user_id", user.id)
        .order("viewed_at", { ascending: false })
        .limit(200),
      // Le nombre total d'entreprises distinctes consultées, qui ne se déduit
      // pas des deux cents dernières lignes.
      admin.from("company_views").select("company_id").eq("user_id", user.id),
    ]);

    // Une entreprise ne se répète pas : on garde sa visite la plus récente.
    type LigneVue = {
      company_id: string;
      companies: { id: string; name: string; city: string; subsector: string | null; cover_url: string | null; cover_color: string | null; is_verified: boolean | null } | null;
    };
    const vuesUniques: NonNullable<LigneVue["companies"]>[] = [];
    const dejaVue = new Set<string>();
    for (const ligne of ((vues ?? []) as unknown as LigneVue[])) {
      if (!ligne.companies || dejaVue.has(ligne.company_id)) continue;
      dejaVue.add(ligne.company_id);
      vuesUniques.push(ligne.companies);
      if (vuesUniques.length === 8) break;
    }

    return NextResponse.json({
      authentifie: true,
      // Identité du destinataire. Le client refuse d'afficher une réponse
      // qui ne lui appartient pas — voir cacheSession.
      compte: user.id,
      email: user.email ?? "",
      creeLe: user.created_at ?? null,
      profile: profile ?? null,
      recentes: vuesUniques,
      vuesTotal: new Set(((toutesVues ?? []) as { company_id: string }[]).map(v => v.company_id)).size,
      favCount: favIds.length,
      adsActives: adsActives ?? 0,
      adsTotal: adsTotal ?? 0,
    }, { headers: sansCache });
  } catch {
    return NextResponse.json({ authentifie: false }, { status: 500, headers: sansCache });
  }
}
