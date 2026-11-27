import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { cleVisiteur } from "@/lib/empreinte";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCachedJobOffers } from "@/lib/actions/companies";

/**
 * Toutes les offres d'une entreprise, pour le panneau « Voir les N offres ».
 *
 * La fiche n'envoie que les premières offres dans sa page : Coop en a près de
 * deux mille, ce qui alourdissait chaque visite d'un mégaoctet. Le reste n'est
 * chargé qu'à l'ouverture du panneau. Données publiques, mises en cache.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ offres: [] }, { status: 400 });
  const offres = await getCachedJobOffers(id).catch(() => []);
  return NextResponse.json({ offres }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
}

/**
 * Clic vers le site de l'entreprise (lien « Offres d'emploi » ou « Postuler »).
 *
 * Deux comptes distincts :
 *  - le tableau de bord (clics_site) : toute personne, avec ou sans compte,
 *    au plus une fois par fiche et par jour (compte ou empreinte anonyme du
 *    jour, sans adresse IP conservée) ;
 *  - le classement (clics_offres, 20 points) : une fois par compte, à vie.
 *    Un visiteur sans compte n'y entre pas : il ne peut pas être reconnu
 *    d'un jour à l'autre, et ces points se convoitent.
 * L'entreprise elle-même et l'administration ne comptent nulle part, et les
 * robots (aperçus de lien, moteurs) non plus.
 *
 * Le navigateur envoie la requête en `keepalive` et n'attend pas la réponse :
 * le site de l'entreprise s'ouvre sans aucun délai.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const sansCache = { headers: { "Cache-Control": "private, no-store" } };
  try {
    const { id } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ compte: false }, sansCache);

    const [{ data: { user } }, h] = await Promise.all([(await createClient()).auth.getUser(), headers()]);
    const cle = cleVisiteur(h, user?.id);
    if (!cle) return NextResponse.json({ compte: false }, sansCache);

    // Tables hors des types générés.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any;
    if (user) {
      const { data: p } = await admin.from("profiles").select("role, claimed_company_id").eq("id", user.id).maybeSingle();
      if (p?.role === "admin" || p?.claimed_company_id === id) return NextResponse.json({ compte: false }, sansCache);
    }

    const depuis = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await admin.from("clics_site").select("id", { count: "exact", head: true })
      .eq("company_id", id).eq("empreinte", cle).gte("clique_le", depuis);
    if ((count ?? 0) === 0) {
      await admin.from("clics_site").insert({ company_id: id, empreinte: cle, user_id: user?.id ?? null });
    }

    if (user) {
      await admin.from("clics_offres")
        .upsert({ company_id: id, user_id: user.id }, { onConflict: "company_id,user_id", ignoreDuplicates: true });
    }
    return NextResponse.json({ compte: (count ?? 0) === 0 }, sansCache);
  } catch {
    return NextResponse.json({ compte: false }, sansCache);
  }
}
