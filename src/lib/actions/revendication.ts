"use server";

import { createHash, randomInt } from "crypto";
import Stripe from "stripe";
import { cookies, headers } from "next/headers";
import { createClient, getUser } from "@/lib/supabase/server";
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

const COOKIE_REV = "workie_revendication";
const DEMANDES_PAR_IP = 10;
const DEMANDES_PAR_EMAIL = 5;

function empreinteIp(ip: string): string {
  const sel = process.env.EMPREINTE_SEL ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createHash("sha256").update(`${sel}|ip|${ip}`).digest("hex").slice(0, 32);
}

async function revendicationDuCookie(companyId: string): Promise<Ligne | null> {
  const id = (await cookies()).get(COOKIE_REV)?.value;
  if (!id || !UUID.test(id)) return null;
  const { data } = await table().select("*").eq("id", id).eq("company_id", companyId).maybeSingle();
  return (data as Ligne | null) ?? null;
}

function etatDe(r: Ligne | null, domaine: string | null): EtatRevendication {
  if (r?.statut === "code_envoye") return { etape: "code", id: r.id, email: masquer(r.email_pro) };
  if (r?.statut === "en_attente") return { etape: "en_attente", email: masquer(r.email_pro) };
  if (r?.statut === "verifiee") return { etape: "paiement", id: r.id };
  if (r?.statut === "refusee") return { etape: "refusee" };
  return { etape: "formulaire", domaine };
}

/** Où en est la personne (connectée, ou repérée par sa demande en cours). */
export async function etatRevendication(companyId: string): Promise<EtatRevendication> {
  const c = UUID.test(companyId) ? await entreprise(companyId) : null;
  if (!c) return { etape: "formulaire", domaine: null };
  if (c.is_subscribed) return { etape: "deja_geree" };
  const domaine = domaineOfficiel(c.website_url);
  const user = await getUser();
  if (!user) {
    const r = await revendicationDuCookie(companyId);
    return r?.statut === "code_envoye" ? etatDe(r, domaine) : { etape: "formulaire", domaine };
  }
  const { data } = await table().select("*").eq("company_id", companyId).eq("user_id", user.id)
    .order("cree_le", { ascending: false }).limit(1).maybeSingle();
  return etatDe(data as Ligne | null, domaine);
}

/**
 * Parcours Workie Business : un seul formulaire.
 *
 * Sans compte, la personne donne aussi un mot de passe : le compte est créé,
 * non confirmé, et le même code à 6 chiffres confirmera à la fois l'adresse
 * et le lien avec l'entreprise. Le code part toujours : une adresse non
 * prouvée ne peut jamais gérer une fiche. Adresse du domaine officiel →
 * validée au code ; sinon → validée au code PUIS par l'administration.
 */
export async function demarrerRevendication(formData: FormData): Promise<{ error?: string; compteExistant?: boolean; etat?: EtatRevendication }> {
  try {
    const user = await getUser();
    const companyId = String(formData.get("company_id") ?? "");
    const prenom = String(formData.get("prenom") ?? "").trim().slice(0, 80);
    const nom = String(formData.get("nom") ?? "").trim().slice(0, 80);
    const fonction = String(formData.get("fonction") ?? "").trim().slice(0, 120);
    const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 254);
    const motDePasse = String(formData.get("mot_de_passe") ?? "");

    if (!UUID.test(companyId)) return { error: "Fiche introuvable." };
    if (!prenom || !nom || !fonction) return { error: "Indiquez votre prénom, votre nom et votre fonction." };
    if (!emailValide(email)) return { error: "Adresse e-mail invalide." };
    if (!user && motDePasse.length < 8) return { error: "Choisissez un mot de passe d'au moins 8 caractères." };

    const c = await entreprise(companyId);
    if (!c) return { error: "Fiche introuvable." };
    if (c.is_subscribed) return { error: "Cette fiche est déjà gérée par l'entreprise." };

    // Limites : par adresse IP, par e-mail et par compte, sur 24 heures.
    const h = await headers();
    const ip = empreinteIp(h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "inconnue");
    const depuis = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const [parIp, parEmail, parCompte] = await Promise.all([
      table().select("id", { count: "exact", head: true }).eq("empreinte_ip", ip).gte("cree_le", depuis),
      table().select("id", { count: "exact", head: true }).ilike("email_pro", email).gte("cree_le", depuis),
      user ? table().select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("cree_le", depuis) : Promise.resolve({ count: 0 }),
    ]);
    if ((parIp.count ?? 0) >= DEMANDES_PAR_IP || (parEmail.count ?? 0) >= DEMANDES_PAR_EMAIL || (parCompte.count ?? 0) >= DEMANDES_PAR_JOUR) {
      return { error: "Trop de demandes aujourd'hui. Réessayez demain." };
    }

    const admin = createAdminClient();
    let userId = user?.id ?? null;
    let compteCree = false;
    if (!userId) {
      // Une adresse déjà inscrite et confirmée doit se connecter, pas se
      // réinscrire. Un compte resté non confirmé lors d'une tentative
      // précédente est repris.
      const { data: p } = await admin.from("profiles").select("id").ilike("email", email).maybeSingle();
      if (p?.id) {
        const { data: u } = await admin.auth.admin.getUserById(p.id);
        if (u?.user?.email_confirmed_at || !u?.user?.user_metadata?.compte_entreprise) {
          return { error: "Un compte Workie existe déjà avec cette adresse. Connectez-vous pour continuer.", compteExistant: true };
        }
        await admin.auth.admin.updateUserById(p.id, { password: motDePasse });
        userId = p.id;
      } else {
        const username = `${prenom}${nom}`.normalize("NFD").replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 24) || "entreprise";
        const { data: cree, error } = await admin.auth.admin.createUser({
          email, password: motDePasse, email_confirm: false,
          user_metadata: { full_name: `${prenom} ${nom}`, first_name: prenom, last_name: nom, username, compte_entreprise: true },
        });
        if (error || !cree?.user) {
          const msg = (error?.message ?? "").toLowerCase();
          if (msg.includes("password")) return { error: "Ce mot de passe est trop faible ou trop courant. Choisissez-en un autre." };
          return { error: "Le compte n'a pas pu être créé. Réessayez." };
        }
        userId = cree.user.id;
      }
      compteCree = true;
    }

    await table().update({ statut: "annulee" }).eq("company_id", companyId).eq("user_id", userId)
      .in("statut", ["code_envoye", "en_attente", "verifiee"]);

    const parDomaine = emailDuDomaine(email, domaineOfficiel(c.website_url));
    const { data: rev, error } = await table().insert({
      company_id: companyId, user_id: userId, prenom, nom, fonction, email_pro: email,
      methode: parDomaine ? "domaine" : "manuel", statut: "code_envoye",
      empreinte_ip: ip, compte_cree: compteCree,
    }).select("id").single();
    if (error || !rev) return { error: "La demande n'a pas pu être enregistrée. Réessayez." };

    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    await table().update({
      code_hash: hacher(code, rev.id),
      code_expire: new Date(Date.now() + DUREE_CODE_MIN * 60_000).toISOString(),
      essais: 0,
    }).eq("id", rev.id);
    const parti = await sendCodeRevendication(email, prenom, c.name, code);
    if (!parti) return { error: "Le courriel n'a pas pu partir. Vérifiez l'adresse et réessayez." };

    if (!user) {
      (await cookies()).set(COOKIE_REV, rev.id, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 2 * 3600 });
    }
    return { etat: { etape: "code", id: rev.id, email: masquer(email) } };
  } catch {
    return { error: "Une erreur est survenue. Réessayez." };
  }
}

export async function verifierCodeRevendication(id: string, code: string): Promise<{ error?: string; etat?: EtatRevendication }> {
  try {
    if (!UUID.test(id)) return { error: "Demande introuvable." };
    const user = await getUser();
    const jar = await cookies();
    const { data } = await table().select("*").eq("id", id).maybeSingle();
    const r = data as (Ligne & { compte_cree: boolean }) | null;
    // Connecté : la demande doit être la sienne. Sans session : la demande
    // doit être celle que ce navigateur vient de lancer (cookie).
    const autorise = r && (user ? r.user_id === user.id : jar.get(COOKIE_REV)?.value === r.id);
    if (!r || !autorise || r.statut !== "code_envoye") return { error: "Demande introuvable." };
    if (r.essais >= ESSAIS_MAX) return { error: "Trop d'essais. Refaites la demande pour recevoir un nouveau code." };
    if (!r.code_expire || new Date(r.code_expire).getTime() < Date.now()) {
      return { error: "Ce code a expiré. Refaites la demande pour en recevoir un nouveau." };
    }
    if (!/^\d{6}$/.test(code.trim()) || hacher(code.trim(), r.id) !== r.code_hash) {
      await table().update({ essais: r.essais + 1 }).eq("id", r.id);
      return { error: "Code incorrect." };
    }

    // Le code prouve l'adresse : le compte créé dans ce parcours est confirmé
    // et la session ouverte, sans second e-mail.
    if (!user && r.compte_cree) {
      const admin = createAdminClient();
      await admin.auth.admin.updateUserById(r.user_id, { email_confirm: true });
      const { data: lien } = await admin.auth.admin.generateLink({ type: "magiclink", email: r.email_pro });
      const jeton = lien?.properties?.hashed_token;
      if (jeton) await (await createClient()).auth.verifyOtp({ type: "magiclink", token_hash: jeton });
    }
    jar.delete(COOKIE_REV);

    if (r.methode === "domaine") {
      await table().update({ statut: "verifiee", verifiee_le: new Date().toISOString(), code_hash: null }).eq("id", r.id);
      return { etat: { etape: "paiement", id: r.id } };
    }
    await table().update({ statut: "en_attente", code_hash: null }).eq("id", r.id);
    const c = await entreprise(r.company_id);
    await sendRevendicationAValider(c?.name ?? "Entreprise", `${r.prenom} ${r.nom}, ${r.fonction}`, r.email_pro);
    return { etat: { etape: "en_attente", email: masquer(r.email_pro) } };
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

