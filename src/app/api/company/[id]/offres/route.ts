import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Clic sur le lien « Offres d'emploi » d'une fiche : 20 points au classement,
 * une fois par compte et par entreprise (clé primaire de clics_offres).
 *
 * Le navigateur envoie la requête en `keepalive` et n'attend pas la réponse :
 * le site de l'entreprise s'ouvre sans aucun délai. Un visiteur sans compte ne
 * peut pas être reconnu d'une fois à l'autre : son clic ne compte pas.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const sansCache = { headers: { "Cache-Control": "private, no-store" } };
  try {
    const { id } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ compte: false }, sansCache);

    const { data: { user } } = await (await createClient()).auth.getUser();
    if (!user) return NextResponse.json({ compte: false }, sansCache);

    // Table hors des types générés.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any;
    const { error } = await admin
      .from("clics_offres")
      .upsert({ company_id: id, user_id: user.id }, { onConflict: "company_id,user_id", ignoreDuplicates: true });
    return NextResponse.json({ compte: !error }, sansCache);
  } catch {
    return NextResponse.json({ compte: false }, sansCache);
  }
}
