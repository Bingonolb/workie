"use server";

import { revaliderPage } from "@/lib/revaliderPage";
import { createClient, getUser, getNiveauAal } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Gestion des comptes depuis l'administration.
 *
 * Volontairement minimale, pour ne pas devenir intrusive : on voit qui est
 * inscrit, depuis quand, sa dernière connexion, son type de compte et s'il
 * est bloqué. Rien de ce qu'il consulte, ni son année de naissance, ni son
 * canton, ni son activité détaillée.
 *
 * Une seule action : bloquer ou débloquer. Pas de suppression depuis l'admin :
 * elle est irréversible, et chacun peut supprimer son propre compte.
 *
 * Garde-fous : rôle admin ET code à 6 chiffres revérifiés côté serveur à
 * chaque appel ; impossible de bloquer un compte admin ou le sien ; chaque
 * blocage est inscrit au journal avec son motif.
 */

async function exigerAdmin() {
  const [user, supabase, niveau] = await Promise.all([getUser(), createClient(), getNiveauAal()]);
  if (!user) throw new Error("Non authentifié");
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (data?.role !== "admin") throw new Error("Accès refusé");
  if (niveau !== "aal2") throw new Error("Double authentification requise");
  return user;
}

export type Utilisateur = {
  id: string;
  email: string;
  nom: string | null;
  inscrit: string;
  derniereConnexion: string | null;
  type: "Admin" | "Pro" | "Candidat";
  bloque: boolean;
  confirme: boolean;
};

export async function listerUtilisateurs(): Promise<{ utilisateurs?: Utilisateur[]; error?: string }> {
  try {
    await exigerAdmin();
    const admin = createAdminClient();
    const comptes: { id: string; email?: string; created_at: string; last_sign_in_at?: string | null; banned_until?: string | null; email_confirmed_at?: string | null }[] = [];
    for (let page = 1; page <= 50; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) return { error: "Lecture des comptes impossible." };
      comptes.push(...data.users);
      if (data.users.length < 1000) break;
    }
    const { data: profils } = await admin.from("profiles").select("id, full_name, role, claimed_company_id");
    const parId = new Map((profils ?? []).map(p => [p.id, p]));
    const maintenant = Date.now();

    const utilisateurs: Utilisateur[] = comptes.map((u): Utilisateur => {
      const p = parId.get(u.id);
      return {
        id: u.id,
        email: u.email ?? "",
        nom: p?.full_name ?? null,
        inscrit: u.created_at,
        derniereConnexion: u.last_sign_in_at ?? null,
        type: p?.role === "admin" ? "Admin" : p?.claimed_company_id ? "Pro" : "Candidat",
        bloque: !!u.banned_until && new Date(u.banned_until).getTime() > maintenant,
        confirme: !!u.email_confirmed_at,
      };
    }).sort((a, b) => b.inscrit.localeCompare(a.inscrit));

    return { utilisateurs };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function changerBlocage(cibleId: string, bloquer: boolean, motif: string): Promise<{ error?: string }> {
  try {
    const moi = await exigerAdmin();
    if (!/^[0-9a-f-]{36}$/i.test(cibleId)) return { error: "Compte invalide." };
    if (cibleId === moi.id) return { error: "Vous ne pouvez pas bloquer votre propre compte." };
    const raison = motif.trim().slice(0, 300);
    if (bloquer && raison.length < 3) return { error: "Indiquez le motif du blocage." };

    const admin = createAdminClient();
    const { data: cible } = await admin.from("profiles").select("role").eq("id", cibleId).maybeSingle();
    if (cible?.role === "admin") return { error: "Un compte admin ne peut pas être bloqué ici." };

    // Bloqué = connexion refusée et session non renouvelée. 100 ans plutôt
    // qu'une durée courte : on débloque explicitement, jamais par oubli.
    const { error } = await admin.auth.admin.updateUserById(cibleId, { ban_duration: bloquer ? "876000h" : "none" });
    if (error) return { error: "L'opération a échoué. Réessayez." };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from("journal_admin" as any) as any).insert({
      admin_id: moi.id,
      action: bloquer ? "utilisateurs.bloquer" : "utilisateurs.debloquer",
      cible: cibleId,
      details: raison ? { motif: raison } : null,
      origine: "service_role",
    });

    revaliderPage("/admin/utilisateurs");
    return {};
  } catch (e) {
    return { error: (e as Error).message };
  }
}
