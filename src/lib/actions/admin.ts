"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getUser, getNiveauAal } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyNewCompany } from "@/lib/actions/notifications";
import { cantonValide, LANGUES_SAISIE } from "@/lib/types";
import { banniereCadree, televerserCouverture } from "@/lib/televersement";

async function requireAdmin() {
  const [user, supabase] = await Promise.all([getUser(), createClient()]);
  if (!user) throw new Error("Non authentifié");
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (data?.role !== "admin") throw new Error("Accès refusé");
  if ((await getNiveauAal()) !== "aal2") throw new Error("Double authentification requise");
  return { user, supabase };
}

export async function adminUpdateCompany(id: string, formData: FormData): Promise<{ error?: string; avertissement?: string }> {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    let cover_url: string | null = String(formData.get("cover_url") || "") || null;
    const depot = await televerserCouverture(admin, id, formData.get("cover_file"));
    if (depot.url) cover_url = depot.url;
    cover_url = banniereCadree(cover_url, formData);
    const logo = await televerserCouverture(admin, id, formData.get("logo_file"), "logos");
    const avertissement = depot.avertissement ?? logo.avertissement ?? null;

    const fields = {
      name: String(formData.get("name") || ""),
      sector: String(formData.get("sector") || ""),
      subsector: String(formData.get("subsector") || "") || null,
      city: String(formData.get("city") || ""),
      canton: String(formData.get("canton") || "").trim().toUpperCase() || null,
      // Liste vide plutot que null : « aucune langue cochee » et « pas encore
      // renseigne » se traitent pareil cote fiche, qui retombe sur la
      // deduction dans les deux cas.
      langues: String(formData.get("langues") || "")
        .split(",").map(l => l.trim().toUpperCase()).filter(l => LANGUES_SAISIE.some(x => x.code === l)),
      employee_range: String(formData.get("employee_range") || "") || null,
      description: String(formData.get("description") || "").slice(0, 3000) || null,
      cover_url,
      logo_url: logo.url ?? (String(formData.get("logo_url") || "") || null),
      website_url: String(formData.get("website_url") || "") || null,
      linkedin_url: String(formData.get("linkedin_url") || "") || null,
      twitter_url: String(formData.get("twitter_url") || "") || null,
      instagram_url: String(formData.get("instagram_url") || "") || null,
      avg_salary_chf: formData.get("avg_salary_chf") ? (Number(formData.get("avg_salary_chf")) || null) : null,
      is_verified: formData.get("is_verified") === "true",
    };
    // Le menu ne propose que des codes valides, mais une requête peut être
    // forgée sans passer par lui : le serveur ne se fie pas au formulaire.
    if (!fields.canton || !cantonValide(fields.canton)) {
      return { error: "Canton invalide : choisissez-le dans la liste." };
    }


    const { error } = await admin.from("companies").update(fields).eq("id", id);
    if (error) return { error: error.message };

    revalidatePath("/entreprise/[slug]", "page");
    revalidatePath("/explore");
    revalidatePath("/admin/companies");
    revalidateTag("companies", {});
    revalidateTag("top-companies", {});
    // Le texte est bien enregistré ; l'avertissement ne concerne que l'image.
    return avertissement ? { avertissement } : {};
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function adminAddCompany(formData: FormData): Promise<{ error?: string; avertissement?: string }> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();

    const fields = {
      name: String(formData.get("name") || ""),
      sector: String(formData.get("sector") || ""),
      subsector: String(formData.get("subsector") || "") || null,
      city: String(formData.get("city") || ""),
      canton: String(formData.get("canton") || "").trim().toUpperCase() || null,
      // Liste vide plutot que null : « aucune langue cochee » et « pas encore
      // renseigne » se traitent pareil cote fiche, qui retombe sur la
      // deduction dans les deux cas.
      langues: String(formData.get("langues") || "")
        .split(",").map(l => l.trim().toUpperCase()).filter(l => LANGUES_SAISIE.some(x => x.code === l)),
      // Pas de valeur par défaut : une taille non saisie reste inconnue plutôt
      // que d'affirmer « 11-50 » sans source.
      employee_range: String(formData.get("employee_range") || "") || null,
      description: String(formData.get("description") || "").slice(0, 3000) || null,
      cover_url: banniereCadree(String(formData.get("cover_url") || "") || null, formData),
      website_url: String(formData.get("website_url") || "") || null,
      // Aucune dérivation automatique de logo. Le logo d'une entreprise est une
      // marque déposée : l'afficher suppose une autorisation qu'on n'a pas.
      // Le champ n'est renseigné que si quelqu'un le saisit explicitement, en
      // assumant ce droit. À défaut, LogoImg affiche les initiales.
      logo_url: String(formData.get("logo_url") || "") || null,
      linkedin_url: String(formData.get("linkedin_url") || "") || null,
      twitter_url: String(formData.get("twitter_url") || "") || null,
      instagram_url: String(formData.get("instagram_url") || "") || null,
      avg_salary_chf: formData.get("avg_salary_chf") ? (Number(formData.get("avg_salary_chf")) || null) : null,
      // Le statut était forcé à faux : le champ existait dans le formulaire de
      // modification, pas dans celui de création, et une fiche créée comme
      // vérifiée ne l'était pas.
      is_verified: formData.get("is_verified") === "true",
      avg_rating: 0, review_count: 0, score: 0,
    };
    // Le menu ne propose que des codes valides, mais une requête peut être
    // forgée sans passer par lui : le serveur ne se fie pas au formulaire.
    if (!fields.canton || !cantonValide(fields.canton)) {
      return { error: "Canton invalide : choisissez-le dans la liste." };
    }


    const { data: created, error } = await supabase
      .from("companies")
      .insert(fields)
      .select("id")
      .single();
    if (error) return { error: error.message };

    // La bannière ne peut partir qu'après l'insertion : son chemin de stockage
    // porte l'identifiant de la fiche, qui n'existe pas avant.
    let avertissement: string | null = null;
    if (created?.id) {
      const depot = await televerserCouverture(supabase, created.id, formData.get("cover_file"));
      avertissement = depot.avertissement ?? null;
      const logo = await televerserCouverture(supabase, created.id, formData.get("logo_file"), "logos");
      avertissement = avertissement ?? logo.avertissement ?? null;
      if (logo.url) await supabase.from("companies").update({ logo_url: logo.url }).eq("id", created.id);
      if (depot.url) {
        const { error: majErr } = await supabase
          .from("companies")
          .update({ cover_url: banniereCadree(depot.url, formData) })
          .eq("id", created.id);
        if (majErr) avertissement = "La fiche est créée. L'image a été envoyée mais n'a pas pu y être rattachée.";
      }
    }

    // Annonce aux membres. Regroupé côté DB : ajouter plusieurs entreprises
    // d'affilée ne produit qu'une notification listant les nouveautés.
    if (created?.id) {
      await notifyNewCompany(created.id, fields.name, fields.sector, fields.city);
    }

    revalidatePath("/explore");
    revalidatePath("/admin/companies");
    revalidateTag("companies", {});
    revalidateTag("top-companies", {});
    // La fiche est créée ; l'avertissement ne concerne que l'image.
    return avertissement ? { avertissement } : {};
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/*
 * Supprimer une fiche, puis ouvrir la suivante.
 *
 * Après la suppression, le navigateur rechargeait la page de la fiche qu'on
 * venait d'effacer : elle n'existait plus, d'où une page 404, puis un retour
 * au début du panel. On perdait sa place dans la liste qu'on reprenait une
 * fiche après l'autre.
 *
 * Les voisines sont donc lues avant d'effacer, dans l'ordre du panel, et la
 * redirection se fait depuis le serveur : le navigateur passe directement à
 * la fiche suivante, sans jamais redemander celle qui n'existe plus. À la fin
 * de la liste, on recule sur la précédente ; s'il n'y en a plus du tout, on
 * revient au panel.
 */
export async function adminDeleteCompany(id: string): Promise<{ error?: string }> {
  let destination = "/admin";
  try {
    await requireAdmin();
    const admin = createAdminClient();

    const { data: voisines } = await admin.rpc("voisines_fiche", { p_id: id });
    const v = voisines?.[0];
    if (v?.next_id) destination = `/admin/company/${v.next_id}`;
    else if (v?.prev_id) destination = `/admin/company/${v.prev_id}`;

    const { error } = await admin.from("companies").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/explore");
    revalidatePath("/admin/companies");
    revalidateTag("companies", {});
    revalidateTag("top-companies", {});
    revalidateTag("landing-counts", {});
  } catch (e) {
    return { error: (e as Error).message };
  }
  // En dehors du try : redirect() fonctionne en levant une exception, que le
  // catch avalerait.
  redirect(destination);
}

// Les anciennes revendications (company_claims) sont remplacées par le parcours
// Workie Business : voir lib/actions/revendication.ts et revendicationsAdmin.ts.
