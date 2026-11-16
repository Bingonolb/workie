"use server";

import Stripe from "stripe";
import { revalidatePath, revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { getUser, getNiveauAal } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { LANGUES_SAISIE, EMPLOYEE_RANGES } from "@/lib/types";
import { banniereCadree, televerserCouverture } from "@/lib/televersement";

/**
 * Espace entreprise. Chaque action relit en base, côté serveur, le lien entre
 * le compte et l'entreprise ET l'abonnement actif : rien ne vient du
 * navigateur. Une entreprise ne touche qu'à sa fiche, et seulement aux champs
 * listés ici ; le nom, le secteur et le lieu restent à l'administration.
 * Chaque modification est inscrite au journal (déclencheur en base).
 */

export type FicheGeree = {
  id: string; slug: string; name: string; sector: string; city: string; canton: string | null;
  description: string | null; website_url: string | null; cover_url: string | null; cover_color: string | null;
  logo_url: string | null; langues: string[] | null; employee_range: string | null;
  subscription_ends_at: string | null; subscription_cancel_at_period_end: boolean | null;
  stripe_customer_id: string | null;
};

const COLONNES = "id, slug, name, sector, city, canton, description, website_url, cover_url, cover_color, logo_url, langues, employee_range, is_subscribed, subscription_ends_at, subscription_cancel_at_period_end, stripe_customer_id";

const COOKIE_VUE_ADMIN = "workie_vue_entreprise";

/** Vrai si la session est celle de l'admin, code à 6 chiffres compris. */
async function estAdminConfirme(userId: string): Promise<boolean> {
  const [{ data }, niveau] = await Promise.all([
    createAdminClient().from("profiles").select("role").eq("id", userId).maybeSingle(),
    getNiveauAal(),
  ]);
  return data?.role === "admin" && niveau === "aal2";
}

/**
 * L'entreprise gérée par la personne connectée, si son abonnement est actif.
 *
 * Vue admin : l'administrateur (rôle + code à 6 chiffres, revérifiés à chaque
 * requête) peut ouvrir l'espace de n'importe quelle fiche, abonnée ou non,
 * pour voir exactement ce que voit l'entreprise. Le cookie ne fait que
 * désigner la fiche ; il n'accorde rien à qui n'est pas admin.
 */
export async function ficheGeree(): Promise<(FicheGeree & { vueAdmin?: boolean }) | null> {
  const user = await getUser();
  if (!user) return null;
  const admin = createAdminClient();

  const vue = (await cookies()).get(COOKIE_VUE_ADMIN)?.value;
  if (vue && /^[0-9a-f-]{36}$/i.test(vue) && await estAdminConfirme(user.id)) {
    const { data } = await admin.from("companies").select(COLONNES).eq("id", vue).maybeSingle();
    if (data) return { ...(data as unknown as FicheGeree), vueAdmin: true };
  }

  const { data: p } = await admin.from("profiles").select("claimed_company_id").eq("id", user.id).maybeSingle();
  if (!p?.claimed_company_id) return null;
  const { data } = await admin.from("companies").select(COLONNES).eq("id", p.claimed_company_id).maybeSingle();
  const c = data as (FicheGeree & { is_subscribed: boolean | null }) | null;
  if (!c?.is_subscribed) return null;
  return c;
}

/** Admin : ouvrir l'espace entreprise d'une fiche, tel que l'entreprise le voit. */
export async function entrerVueEntreprise(companyId: string): Promise<{ error?: string }> {
  const user = await getUser();
  if (!user || !/^[0-9a-f-]{36}$/i.test(companyId) || !(await estAdminConfirme(user.id))) return { error: "Accès refusé." };
  (await cookies()).set(COOKIE_VUE_ADMIN, companyId, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 4 * 3600 });
  return {};
}

export async function quitterVueEntreprise(): Promise<void> {
  (await cookies()).delete(COOKIE_VUE_ADMIN);
}
export type Stats = {
  visites: number; visites_avant: number; favoris_total: number; favoris_nouveaux: number;
  clics_offres: number; par_jour: { jour: string; visites: number }[];
  cantons: { canton: string; n: number }[]; rang_secteur: number; total_secteur: number;
};

export async function statsFiche(jours: 7 | 30 | 90 = 30): Promise<Stats | null> {
  const c = await ficheGeree();
  if (!c) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (createAdminClient() as any).rpc("stats_entreprise", { p_company: c.id, p_jours: jours });
  if (!data) return null;
  const s = data as Stats;
  return { ...s, par_jour: s.par_jour ?? [], cantons: s.cantons ?? [] };
}

export async function modifierFiche(formData: FormData): Promise<{ error?: string; avertissement?: string }> {
  try {
    const c = await ficheGeree();
    if (!c) return { error: "Accès refusé : aucune entreprise active liée à ce compte." };
    const admin = createAdminClient();

    let site = String(formData.get("website_url") || "").trim() || null;
    if (site && !/^https?:\/\//i.test(site)) site = `https://${site}`;
    if (site) { try { new URL(site); } catch { return { error: "Le lien carrière n'est pas une adresse valide." }; } }

    const taille = String(formData.get("employee_range") || "");
    const champs: Record<string, unknown> = {
      description: String(formData.get("description") || "").trim().slice(0, 3000) || null,
      website_url: site,
      langues: String(formData.get("langues") || "").split(",").map(l => l.trim().toUpperCase())
        .filter(l => LANGUES_SAISIE.some(x => x.code === l)),
      employee_range: (EMPLOYEE_RANGES as readonly string[]).includes(taille) ? taille : c.employee_range,
    };

    const depot = await televerserCouverture(admin, c.id, formData.get("cover_file"));
    const coverActuel = String(formData.get("cover_url") || "") || null;
    // On n'accepte qu'une bannière déjà à nous ou tout juste déposée.
    const nu = (u: string | null) => (u ?? "").split("#")[0].split("?")[0];
    const coverSur = !coverActuel ? null : nu(coverActuel) === nu(c.cover_url) ? coverActuel : c.cover_url;
    champs.cover_url = banniereCadree(depot.url ?? coverSur, formData);

    const logo = await televerserCouverture(admin, c.id, formData.get("logo_file"), "logos");
    const logoGarde = String(formData.get("logo_url") || "");
    champs.logo_url = logo.url ?? (logoGarde && logoGarde === c.logo_url ? logoGarde : null);

    const { error } = await admin.from("companies").update(champs as never).eq("id", c.id);
    if (error) return { error: "L'enregistrement a échoué. Réessayez." };

    revalidatePath("/entreprise/[slug]", "page");
    revalidatePath("/espace-entreprise");
    revalidateTag("companies", {});
    const avertissement = depot.avertissement ?? logo.avertissement;
    return avertissement ? { avertissement } : {};
  } catch {
    return { error: "Une erreur est survenue. Réessayez." };
  }
}

/** Portail Stripe : factures, carte, changement de formule, résiliation. */
export async function ouvrirPortailAbonnement(): Promise<{ error?: string; url?: string }> {
  try {
    const c = await ficheGeree();
    if (!c?.stripe_customer_id) return { error: "Abonnement introuvable." };
    if (!process.env.STRIPE_SECRET_KEY) return { error: "Le portail n'est pas disponible pour le moment." };
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.workie.ch";
    const s = await new Stripe(process.env.STRIPE_SECRET_KEY).billingPortal.sessions.create({
      customer: c.stripe_customer_id,
      return_url: `${base}/espace-entreprise/abonnement`,
    });
    return { url: s.url };
  } catch {
    return { error: "Le portail d'abonnement n'a pas pu s'ouvrir. Réessayez." };
  }
}
