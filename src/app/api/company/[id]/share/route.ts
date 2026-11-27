import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { cleVisiteur } from "@/lib/empreinte";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureServerError } from "@/lib/monitoring";

/**
 * Un partage abouti, et lui seul.
 *
 * Le bouton n'appelle pas cette route quand on le clique : il l'appelle quand
 * le partage a réellement eu lieu, c'est-à-dire quand la feuille de partage du
 * système s'est fermée sur un envoi, ou quand le lien a été copié. Un clic
 * suivi d'une annulation ne compte pas, et c'est tout l'intérêt : le partage
 * vaut cinquante points au classement, soit cinq favoris.
 *
 * Garde-fou, parce que cinquante points se convoitent : un partage par
 * personne, par entreprise et par jour, avec ou sans compte (empreinte
 * anonyme du jour pour un visiteur sans compte, sans adresse IP conservée).
 * Le bouton n'envoie en plus qu'une déclaration par onglet.
 *
 * L'empreinte reste contournable en changeant de réseau. Tant que la triche
 * resterait le fait d'une poignée de gens, cela suffit ; le jour où le
 * classement vaudra de l'argent, il faudra l'adosser à un compte.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
    }

    const canal = new URL(request.url).searchParams.get("canal");
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    // La table vient d'être créée : les types générés ne la connaissent pas.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any;

    // Un partage par personne, par fiche et par jour, avec ou sans compte :
    // le compte quand il y en a un, sinon l'empreinte anonyme du jour.
    const cle = cleVisiteur(await headers(), user?.id);
    if (!cle) return NextResponse.json({ compte: false });
    if (user) {
      // L'entreprise qui partage sa propre fiche, ou l'administration, ne
      // compte pas : même règle que pour les visites.
      const { data: p } = await admin.from("profiles").select("role, claimed_company_id").eq("id", user.id).maybeSingle();
      if (p?.role === "admin" || p?.claimed_company_id === id) return NextResponse.json({ compte: false });
      const depuis = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count } = await admin
        .from("company_shares")
        .select("id", { count: "exact", head: true })
        .eq("company_id", id)
        .eq("user_id", user.id)
        .gte("partage_le", depuis);
      if ((count ?? 0) > 0) return NextResponse.json({ compte: false });
    } else {
      const depuis = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count } = await admin
        .from("company_shares")
        .select("id", { count: "exact", head: true })
        .eq("company_id", id)
        .eq("empreinte", cle)
        .gte("partage_le", depuis);
      if ((count ?? 0) > 0) return NextResponse.json({ compte: false });
    }

    const { error } = await admin.from("company_shares").insert({
      company_id: id,
      user_id: user?.id ?? null,
      empreinte: cle,
      canal: canal === "systeme" || canal === "lien" ? canal : null,
    });
    if (error) return NextResponse.json({ compte: false });

    return NextResponse.json({ compte: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (e) {
    captureServerError(e, { action: "declarerPartage" });
    return NextResponse.json({ compte: false });
  }
}
