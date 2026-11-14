"use server";

import { randomUUID } from "crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { createClient, getUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendClaimApprovedEmail } from "@/lib/email";
import { notifyNewCompany } from "@/lib/actions/notifications";
import { cantonValide, LANGUES_SAISIE } from "@/lib/types";
import { logoAffichable } from "@/lib/logo";
import { avecCadrage, lireCadrage, CADRAGE_NEUTRE, ZOOM_MAX, variantesARechauffer, type Cadrage } from "@/lib/coverUrl";

/**
 * Le cadrage choisi dans l'éditeur, lu depuis le formulaire et borné.
 *
 * Il est rattaché à l'adresse finale de la bannière, après un éventuel
 * téléversement : sans cela, une image tout juste envoyée perdrait le cadrage
 * qu'on venait de régler sur son aperçu.
 */
function cadrageDuFormulaire(formData: FormData): Cadrage {
  const brut = String(formData.get("cover_cadrage") || "");
  const [x, y, zoom] = brut.split(",").map(Number);
  if (![x, y, zoom].every(Number.isFinite)) return CADRAGE_NEUTRE;
  return {
    x: Math.min(100, Math.max(0, x)),
    y: Math.min(100, Math.max(0, y)),
    zoom: Math.min(ZOOM_MAX, Math.max(1, zoom)),
  };
}

function banniereCadree(url: string | null, formData: FormData): string | null {
  if (!url) return null;
  return avecCadrage(lireCadrage(url).src, cadrageDuFormulaire(formData)) || null;
}

async function requireAdmin() {
  const [user, supabase] = await Promise.all([getUser(), createClient()]);
  if (!user) throw new Error("Non authentifié");
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (data?.role !== "admin") throw new Error("Accès refusé");
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

/**
 * Dépose la bannière envoyée et renvoie son adresse publique.
 *
 * Un problème d'image n'annule jamais l'enregistrement du texte. Auparavant un
 * format inattendu ou un envoi en échec interrompait toute l'action : la
 * saisie était perdue et il fallait tout recommencer, sans savoir pourquoi.
 * Les deux sujets restent séparés, ici comme à la création.
 *
 * Le chemin porte l'identifiant de la fiche, donc à la création cette fonction
 * n'est appelée qu'une fois la ligne insérée.
 */
async function televerserCouverture(
  admin: ReturnType<typeof createAdminClient>,
  companyId: string,
  coverFile: FormDataEntryValue | null,
  // Le logo suit exactement le même chemin que la bannière, dans son propre dossier.
  dossier: "covers" | "logos" = "covers",
): Promise<{ url?: string; avertissement?: string }> {
  const ALLOWED_IMG = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const EXT_MAP: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
  // 7 Mo, et non 10 : la requête elle-même est plafonnée à 8 Mo. Annoncer une
  // limite que la plateforme n'accorde pas produisait un échec sans message,
  // avant même d'arriver ici.
  const MAX_IMG = 7 * 1024 * 1024;

  if (!(coverFile instanceof File) || coverFile.size === 0) return {};
  if (!ALLOWED_IMG.includes(coverFile.type)) {
    return { avertissement: "Le texte est enregistré. L'image a été ignorée : format non supporté (JPG, PNG, WebP, GIF)." };
  }
  if (coverFile.size > MAX_IMG) {
    return { avertissement: "Le texte est enregistré. L'image a été ignorée : trop lourde (7 Mo maximum)." };
  }

  const ext = EXT_MAP[coverFile.type] ?? "jpg";
  const path = `${dossier}/${companyId}/${randomUUID()}.${ext}`;
  // Cache d'un an : le nom du fichier est un UUID, une image ne change donc
  // jamais à adresse égale. Avec le réglage par défaut d'une heure, le
  // navigateur redemandait chaque bannière à chaque retour sur le site.
  const { error } = await admin.storage.from("covers").upload(path, coverFile, { contentType: coverFile.type, upsert: true, cacheControl: "31536000" });
  if (error) {
    // L'échec était jusqu'ici parfaitement silencieux : l'ancienne image
    // restait en place sans que personne ne sache pourquoi.
    return { avertissement: "Le texte est enregistré. L'envoi de l'image a échoué." };
  }
  const { data: pub } = admin.storage.from("covers").getPublicUrl(path);
  // Toutes ses tailles préparées d'avance, une fois la réponse partie : le
  // premier visiteur ne paie pas la demi-seconde de redimensionnement.
  after(() => (dossier === "logos" ? rechaufferLogo(pub.publicUrl) : rechaufferBanniere(pub.publicUrl)));
  return { url: pub.publicUrl };
}

async function rechaufferLogo(url: string): Promise<void> {
  const v = logoAffichable(url);
  if (v) await fetch(v, { headers: { Accept: "image/avif,image/webp,image/*,*/*;q=0.8" } }).then(r => r.arrayBuffer()).catch(() => null);
}

async function rechaufferBanniere(url: string): Promise<void> {
  const variantes = variantesARechauffer(url);
  for (let i = 0; i < variantes.length; i += 3) {
    await Promise.all(variantes.slice(i, i + 3).map(v =>
      fetch(v, { headers: { Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8" } }).then(r => r.arrayBuffer()).catch(() => null),
    ));
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

export async function getClaims() {
  try {
    await requireAdmin();
    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from("company_claims")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return { error: error.message };

    const claims = data ?? [];

    // For each claim that has a company_id, check if it's already owned
    const companyIds = [...new Set(claims.map(c => c.company_id).filter(Boolean))] as string[];
    const ownerMap: Record<string, string> = {};

    if (companyIds.length > 0) {
      // profiles.email is kept in sync with auth.users via trigger — no Auth Admin API call needed
      const { data: profiles } = await adminClient
        .from("profiles")
        .select("id, claimed_company_id, email")
        .in("claimed_company_id", companyIds);

      for (const p of profiles ?? []) {
        if (p.claimed_company_id) {
          ownerMap[p.claimed_company_id] = p.email ?? p.id;
        }
      }
    }

    return {
      claims: claims.map(c => ({
        ...c,
        existing_owner: c.company_id ? (ownerMap[c.company_id] ?? null) : null,
      })),
    };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function approveClaim(
  claimId: string,
): Promise<{ error?: string; success?: boolean }> {
  try {
    const { user: adminUser, supabase } = await requireAdmin();
    const adminClient = createAdminClient();

    // Fetch the claim via adminClient (company_claims RLS restricts to own rows)
    const { data: claim, error: claimErr } = await adminClient
      .from("company_claims")
      .select("*")
      .eq("id", claimId)
      .maybeSingle();
    if (claimErr || !claim) return { error: "Demande introuvable." };
    if (claim.status === "approved") return { error: "Déjà approuvée." };

    const companyId: string | null = claim.company_id ?? null;
    if (!companyId) return { error: "Aucune entreprise associée à cette demande." };

    // Mark company as verified (blue badge)
    const { error: verifyErr } = await adminClient
      .from("companies")
      .update({ is_verified: true })
      .eq("id", companyId);
    if (verifyErr) return { error: `Erreur badge entreprise : ${verifyErr.message}` };

    const { error: claimUpdateErr } = await adminClient.from("company_claims").update({
      status: "approved",
      company_id: companyId,
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminUser.id,
    }).eq("id", claimId);
    if (claimUpdateErr) return { error: `Erreur mise à jour demande : ${claimUpdateErr.message}` };

    revalidatePath("/admin/claims");
    revalidatePath("/entreprise/[slug]", "page");

    // Notify the company owner by email
    const { data: claimData } = await adminClient
      .from("company_claims")
      .select("work_email, first_name, company_name")
      .eq("id", claimId)
      .maybeSingle();
    if (claimData) {
      await sendClaimApprovedEmail(claimData.work_email, claimData.first_name, claimData.company_name);
    }

    return { success: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function rejectClaim(claimId: string): Promise<{ error?: string; success?: boolean }> {
  try {
    const { user: adminUser } = await requireAdmin();
    const adminClient = createAdminClient();

    // Fetch claim to revoke profile access if fraudulent
    const { data: claim } = await adminClient.from("company_claims").select("company_id, user_id").eq("id", claimId).maybeSingle();

    const { error: rejectErr } = await adminClient.from("company_claims").update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminUser.id,
    }).eq("id", claimId);
    if (rejectErr) return { error: rejectErr.message };

    // Revoke profile link so user loses access
    if (claim?.user_id) {
      await adminClient.from("profiles").update({ claimed_company_id: null }).eq("id", claim.user_id);
    }

    revalidatePath("/admin/claims");
    return { success: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
