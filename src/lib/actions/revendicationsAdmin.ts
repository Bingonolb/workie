"use server";

import { revalidatePath } from "next/cache";
import { createClient, getUser, getNiveauAal } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendRevendicationAcceptee } from "@/lib/email";

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
  prenom: string; nom: string; fonction: string; email_pro: string;
  entreprise: { id: string; name: string; slug: string; website_url: string | null } | null;
};

export async function listerRevendications(): Promise<{ demandes?: DemandeAdmin[]; error?: string }> {
  try {
    await exigerAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (createAdminClient().from("revendications" as any) as any)
      .select("id, statut, methode, cree_le, prenom, nom, fonction, email_pro, entreprise:companies(id, name, slug, website_url)")
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
    const { data: r } = await revs.select("id, statut, prenom, email_pro, entreprise:companies(name, slug)").eq("id", id).maybeSingle();
    if (!r || r.statut !== "en_attente") return { error: "Cette demande n'attend plus de décision." };

    await revs.update({
      statut: accepter ? "verifiee" : "refusee",
      verifiee_le: accepter ? new Date().toISOString() : null,
      note_admin: note.trim().slice(0, 300) || null,
    }).eq("id", id);

    if (accepter && r.entreprise) {
      const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.workie.ch";
      await sendRevendicationAcceptee(r.email_pro, r.prenom, r.entreprise.name, `${base}/revendiquer/${r.entreprise.slug}`);
    }
    revalidatePath("/admin/revendications");
    return {};
  } catch (e) {
    return { error: (e as Error).message };
  }
}
