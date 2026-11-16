"use server";

import { createHash, randomInt } from "crypto";
import Stripe from "stripe";
import { getUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { domaineOfficiel, emailDuDomaine, emailValide } from "@/lib/domaineEntreprise";
import { sendCodeRevendication, sendRevendicationAValider } from "@/lib/email";
import { ABONNEMENT, type Formule } from "@/lib/tarifs";

/**
 * Revendiquer une fiche, en quatre temps :
 *   1. la personne, connectée, indique qui elle est et son adresse pro ;
 *   2. adresse du domaine officiel → code à 6 chiffres par e-mail ;
 *      sinon → validation manuelle par l'administration ;
 *   3. vérifiée, elle choisit sa formule et paie (Stripe) ;
 *   4. le webhook Stripe active l'abonnement et ouvre l'espace entreprise.
 *
 * Tout passe par la clé de service, après contrôle : la table n'accorde aucun
 * droit direct. Une même personne ne peut lancer que 5 demandes par jour, un
 * code s'essaie 5 fois au plus et expire au bout de 30 minutes.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DUREE_CODE_MIN = 30;
const ESSAIS_MAX = 5;
const DEMANDES_PAR_JOUR = 5;

type Ligne = {
  id: string; company_id: string; user_id: string; prenom: string; nom: string; fonction: string;
  email_pro: string; methode: "domaine" | "manuel"; statut: string; code_hash: string | null;
  code_expire: string | null; essais: number; cree_le: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const table = () => (createAdminClient().from("revendications" as any) as any);

function hacher(code: string, id: string): string {
  const sel = process.env.EMPREINTE_SEL ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createHash("sha256").update(`${sel}|${id}|${code}`).digest("hex");
}

function masquer(email: string): string {
  const [u, d] = email.split("@");
  return `${u.slice(0, 2)}${"•".repeat(Math.max(1, u.length - 2))}@${d}`;
}

async function entreprise(companyId: string) {
  const { data } = await createAdminClient()
    .from("companies").select("id, slug, name, website_url, is_subscribed").eq("id", companyId).maybeSingle();
  return data as { id: string; slug: string; name: string; website_url: string | null; is_subscribed: boolean | null } | null;
}

export type EtatRevendication =
  | { etape: "deja_geree" }
  | { etape: "formulaire"; domaine: string | null }
  | { etape: "code"; id: string; email: string }
  | { etape: "en_attente"; email: string }
  | { etape: "paiement"; id: string }
  | { etape: "refusee" };

/** Où en est la personne connectée pour cette entreprise. */
export async function etatRevendication(companyId: string): Promise<EtatRevendication> {
  const user = await getUser();
  const c = UUID.test(companyId) ? await entreprise(companyId) : null;
  if (!user || !c) return { etape: "formulaire", domaine: null };
  if (c.is_subscribed) return { etape: "deja_geree" };

  const { data } = await table().select("*").eq("company_id", companyId).eq("user_id", user.id)
    .order("cree_le", { ascending: false }).limit(1).maybeSingle();
  const r = data as Ligne | null;
  if (r?.statut === "code_envoye") return { etape: "code", id: r.id, email: masquer(r.email_pro) };
  if (r?.statut === "en_attente") return { etape: "en_attente", email: masquer(r.email_pro) };
  if (r?.statut === "verifiee") return { etape: "paiement", id: r.id };
  if (r?.statut === "refusee") return { etape: "refusee" };
  return { etape: "formulaire", domaine: domaineOfficiel(c.website_url) };
}

export async function demarrerRevendication(formData: FormData): Promise<{ error?: string; etat?: EtatRevendication }> {
  try {
    const user = await getUser();
    if (!user) return { error: "Connectez-vous pour continuer." };

    const companyId = String(formData.get("company_id") ?? "");
    const prenom = String(formData.get("prenom") ?? "").trim().slice(0, 80);
    const nom = String(formData.get("nom") ?? "").trim().slice(0, 80);
    const fonction = String(formData.get("fonction") ?? "").trim().slice(0, 120);
    const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 254);

    if (!UUID.test(companyId)) return { error: "Fiche introuvable." };
    if (!prenom || !nom || !fonction) return { error: "Indiquez votre prénom, votre nom et votre fonction." };
    if (!emailValide(email)) return { error: "Adresse e-mail invalide." };

    const c = await entreprise(companyId);
    if (!c) return { error: "Fiche introuvable." };
    if (c.is_subscribed) return { error: "Cette fiche est déjà gérée par l'entreprise." };

    const depuis = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { count } = await table().select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("cree_le", depuis);
    if ((count ?? 0) >= DEMANDES_PAR_JOUR) return { error: "Trop de demandes aujourd'hui. Réessayez demain." };

    // Une demande précédente non aboutie pour cette fiche est remplacée.
    await table().update({ statut: "annulee" }).eq("company_id", companyId).eq("user_id", user.id)
      .in("statut", ["code_envoye", "en_attente", "verifiee"]);

    const parDomaine = emailDuDomaine(email, domaineOfficiel(c.website_url));
    const { data: cree, error } = await table().insert({
      company_id: companyId, user_id: user.id, prenom, nom, fonction, email_pro: email,
      methode: parDomaine ? "domaine" : "manuel",
      statut: parDomaine ? "code_envoye" : "en_attente",
    }).select("id").single();
    if (error || !cree) return { error: "La demande n'a pas pu être enregistrée. Réessayez." };

    if (parDomaine) {
      const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
      await table().update({
        code_hash: hacher(code, cree.id),
        code_expire: new Date(Date.now() + DUREE_CODE_MIN * 60_000).toISOString(),
        essais: 0,
      }).eq("id", cree.id);
      const parti = await sendCodeRevendication(email, prenom, c.name, code);
      if (!parti) return { error: "Le courriel n'a pas pu partir. Vérifiez l'adresse et réessayez." };
      return { etat: { etape: "code", id: cree.id, email: masquer(email) } };
    }

    await sendRevendicationAValider(c.name, `${prenom} ${nom}, ${fonction}`, email);
    return { etat: { etape: "en_attente", email: masquer(email) } };
  } catch {
    return { error: "Une erreur est survenue. Réessayez." };
  }
}

export async function verifierCodeRevendication(id: string, code: string): Promise<{ error?: string; etat?: EtatRevendication }> {
  try {
    const user = await getUser();
    if (!user || !UUID.test(id)) return { error: "Demande introuvable." };
    const { data } = await table().select("*").eq("id", id).eq("user_id", user.id).maybeSingle();
    const r = data as Ligne | null;
    if (!r || r.statut !== "code_envoye") return { error: "Demande introuvable." };
    if (r.essais >= ESSAIS_MAX) return { error: "Trop d'essais. Recommencez la demande pour recevoir un nouveau code." };
    if (!r.code_expire || new Date(r.code_expire).getTime() < Date.now()) {
      return { error: "Ce code a expiré. Recommencez la demande pour en recevoir un nouveau." };
    }
    if (!/^\d{6}$/.test(code.trim()) || hacher(code.trim(), r.id) !== r.code_hash) {
      await table().update({ essais: r.essais + 1 }).eq("id", r.id);
      return { error: "Code incorrect." };
    }
    await table().update({ statut: "verifiee", verifiee_le: new Date().toISOString(), code_hash: null }).eq("id", r.id);
    return { etat: { etape: "paiement", id: r.id } };
  } catch {
    return { error: "Une erreur est survenue. Réessayez." };
  }
}

/** Ouvre le paiement Stripe de l'abonnement, une fois la demande vérifiée. */
export async function lancerAbonnement(id: string, formule: Formule): Promise<{ error?: string; url?: string }> {
  try {
    const user = await getUser();
    if (!user || !UUID.test(id) || !(formule in ABONNEMENT)) return { error: "Demande introuvable." };
    if (!process.env.STRIPE_SECRET_KEY) return { error: "Le paiement n'est pas disponible pour le moment." };

    const { data } = await table().select("*").eq("id", id).eq("user_id", user.id).maybeSingle();
    const r = data as Ligne | null;
    if (!r || r.statut !== "verifiee") return { error: "Cette demande n'est pas encore vérifiée." };
    const c = await entreprise(r.company_id);
    if (!c) return { error: "Fiche introuvable." };
    if (c.is_subscribed) return { error: "Cette fiche est déjà gérée par l'entreprise." };

    const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.workie.ch";
    const offre = ABONNEMENT[formule];
    const meta = { type: "abonnement_entreprise", company_id: c.id, revendication_id: r.id, user_id: user.id };
    const session = await new Stripe(process.env.STRIPE_SECRET_KEY).checkout.sessions.create({
      mode: "subscription",
      customer_email: r.email_pro,
      line_items: [{
        price_data: {
          currency: "chf",
          product_data: { name: `Workie Entreprise : ${c.name}`, description: "Gestion de la fiche et statistiques de fréquentation" },
          unit_amount: offre.chf * 100,
          recurring: { interval: offre.intervalle },
        },
        quantity: 1,
      }],
      client_reference_id: c.id,
      metadata: meta,
      subscription_data: { metadata: meta },
      allow_promotion_codes: true,
      billing_address_collection: "required",
      success_url: `${base}/espace-entreprise?bienvenue=1`,
      cancel_url: `${base}/revendiquer/${c.slug}`,
    });
    return session.url ? { url: session.url } : { error: "Le paiement n'a pas pu démarrer." };
  } catch {
    return { error: "Le paiement n'a pas pu démarrer. Réessayez." };
  }
}

