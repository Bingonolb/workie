"use server";

import { revaliderPage } from "@/lib/revaliderPage";
import { createClient, getUser, getNiveauAal } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendRevendicationAcceptee, sendRevendicationRefusee } from "@/lib/email";

async function exigerAdmin() {
  const [user, supabase, niveau] = await Promise.all([getUser(), createClient(), getNiveauAal()]);
  if (!user) throw new Error("Non authentifié");
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (data?.role !== "admin") throw new Error("Accès refusé");
  if (niveau !== "aal2") throw new Error("Double authentification requise");
  return user;
}

export type DemandeAdmin = {
  id: string; statut: string; methode: string; cree_le: string;
  prenom: string; nom: string; fonction: string; telephone: string | null; email_pro: string;
  entreprise: { id: string; name: string; slug: string; website_url: string | null } | null;
  /** Création : la fiche proposée, pas encore dans l'annuaire. */
  fiche: { name: string; sector: string; city: string; canton: string; website_url: string; description: string; employee_range: string | null; langues: string[] } | null;
};

export async function listerRevendications(): Promise<{ demandes?: DemandeAdmin[]; error?: string }> {
  try {
    await exigerAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (createAdminClient().from("revendications" as any) as any)
      .select("id, statut, methode, cree_le, prenom, nom, fonction, telephone, email_pro, fiche, entreprise:companies(id, name, slug, website_url)")
      .neq("statut", "annulee")
      .order("cree_le", { ascending: false })
      .limit(200);
    if (error) return { error: "Lecture impossible." };
    return { demandes: data as DemandeAdmin[] };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function deciderRevendication(id: string, accepter: boolean, note: string): Promise<{ error?: string }> {
  try {
    await exigerAdmin();
    if (!/^[0-9a-f-]{36}$/i.test(id)) return { error: "Demande invalide." };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const revs = createAdminClient().from("revendications" as any) as any;
    const { data: r } = await revs.select("id, statut, prenom, email_pro, fiche, langue, entreprise:companies(name, slug)").eq("id", id).maybeSingle();
    if (!r || r.statut !== "en_attente") return { error: "Cette demande n'attend plus de décision." };

    await revs.update({
      statut: accepter ? "verifiee" : "refusee",
      verifiee_le: accepter ? new Date().toISOString() : null,
      note_admin: note.trim().slice(0, 300) || null,
    }).eq("id", id);

    // Revendication : lien vers la fiche. Création : lien vers le parcours, où
    // l'entreprise retrouve l'étape du paiement.
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.workie.ch";
    const nomFiche: string | undefined = r.entreprise?.name ?? r.fiche?.name;
    // Le lien mène à la version du site dans la langue du demandeur.
    const prefixe = r.langue && r.langue !== "fr" ? `/${r.langue}` : "";
    const lien = r.entreprise ? `${base}${prefixe}/revendiquer/${r.entreprise.slug}` : `${base}${prefixe}/creer-entreprise`;
    if (nomFiche && accepter) await sendRevendicationAcceptee(r.email_pro, r.prenom, nomFiche, lien, r.langue);
    else if (nomFiche) await sendRevendicationRefusee(r.email_pro, r.prenom, nomFiche, r.langue);
    revaliderPage("/admin/revendications");
    return {};
  } catch (e) {
    return { error: (e as Error).message };
  }
}
