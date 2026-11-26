"use server";

import { createHash, randomInt } from "crypto";
import { SITE_URL } from "@/lib/siteUrl";
import Stripe from "stripe";
import { activerAbonnementDepuisSession } from "@/lib/activationAbonnement";
import { cookies, headers } from "next/headers";
import { createClient, getUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { domaineOfficiel, emailDuDomaine, emailValide } from "@/lib/domaineEntreprise";
import { sendCodeRevendication, sendRevendicationAValider } from "@/lib/email";
import { ABONNEMENT, type Formule } from "@/lib/tarifs";
import { langueRequete, tRequete } from "@/i18n/requete";

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
const telephoneValide = (x: string) => /^\+?[0-9 ()./-]{9,20}$/.test(x) && x.replace(/\D/g, "").length >= 9;
const DUREE_CODE_MIN = 30;
const ESSAIS_MAX = 5;
const DEMANDES_PAR_JOUR = 5;

type Ligne = {
  id: string; company_id: string; user_id: string; prenom: string; nom: string; fonction: string; telephone?: string | null;
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
  | { etape: "refusee" }
  /** Lien de l'e-mail ouvert sans le compte de la demande : il faut s'y connecter. */
  | { etape: "connexion"; email: string; autreCompte: boolean };

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
export async function etatRevendication(companyId: string, demandeId?: string): Promise<EtatRevendication> {
  const c = UUID.test(companyId) ? await entreprise(companyId) : null;
  if (!c) return { etape: "formulaire", domaine: null };
  if (c.is_subscribed) return { etape: "deja_geree" };
  const domaine = domaineOfficiel(c.website_url);
  const user = await getUser();
  // Lien reçu par e-mail : la demande est retrouvée par son numéro, quel que
  // soit le navigateur. Le numéro est imprévisible ; il ne révèle que l'adresse
  // masquée, pour dire avec quel compte se connecter.
  if (demandeId && UUID.test(demandeId)) {
    const { data } = await table().select("*").eq("id", demandeId).eq("company_id", companyId).maybeSingle();
    const d = data as Ligne | null;
    if (d && ["code_envoye", "en_attente", "verifiee"].includes(d.statut) && d.user_id !== user?.id) {
      return { etape: "connexion", email: masquer(d.email_pro), autreCompte: !!user };
    }
  }
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
  const t = await tRequete();
  try {
    const user = await getUser();
    const companyId = String(formData.get("company_id") ?? "");
    const prenom = String(formData.get("prenom") ?? "").trim().slice(0, 80);
    const nom = String(formData.get("nom") ?? "").trim().slice(0, 80);
    const fonction = String(formData.get("fonction") ?? "").trim().slice(0, 120);
    const telephone = String(formData.get("telephone") ?? "").trim().slice(0, 30);
    const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 254);
    const motDePasse = String(formData.get("mot_de_passe") ?? "");

    if (!UUID.test(companyId)) return { error: t("revend.eFiche") };
    if (!prenom || !nom || !fonction) return { error: t("revend.eIdentite") };
    if (!telephoneValide(telephone)) return { error: t("revend.eTelephone") };
    if (!emailValide(email)) return { error: t("revend.eEmail") };
    if (!user && motDePasse.length < 8) return { error: t("revend.eMdp") };
    if (!user && motDePasse !== String(formData.get("mot_de_passe_confirmation") ?? "")) return { error: t("mdpChamp.different") };

    const c = await entreprise(companyId);
    if (!c) return { error: t("revend.eFiche") };
    if (c.is_subscribed) return { error: t("revend.eDejaGeree") };

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
      return { error: t("revend.eTrop") };
    }

    const admin = createAdminClient();
    // Un compte gère une seule fiche : une seconde revendication écraserait
    // l'accès à la première.
    if (user) {
      const { data: p } = await admin.from("profiles").select("claimed_company_id").eq("id", user.id).maybeSingle();
      if (p?.claimed_company_id && p.claimed_company_id !== companyId) {
        const { data: autre } = await admin.from("companies").select("name, is_subscribed").eq("id", p.claimed_company_id).maybeSingle();
        if (autre?.is_subscribed) {
          return { error: t("revend.eAutre", { nom: autre.name }) };
        }
      }
    }
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
          return { error: t("revend.eCompte"), compteExistant: true };
        }
        await admin.auth.admin.updateUserById(p.id, { password: motDePasse });
        userId = p.id;
      } else {
        const username = `${prenom}${nom}`.normalize("NFD").replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 24) || "entreprise";
        const { data: cree, error } = await admin.auth.admin.createUser({
          email, password: motDePasse, email_confirm: false,
          user_metadata: { full_name: `${prenom} ${nom}`, first_name: prenom, last_name: nom, username, compte_entreprise: true, langue: await langueRequete() },
        });
        if (error || !cree?.user) {
          const msg = (error?.message ?? "").toLowerCase();
          if (msg.includes("password")) return { error: t("revend.eFaible") };
          return { error: t("revend.eCreation") };
        }
        userId = cree.user.id;
      }
      compteCree = true;
    }

    await table().update({ statut: "annulee" }).eq("company_id", companyId).eq("user_id", userId)
      .in("statut", ["code_envoye", "en_attente", "verifiee"]);

    const parDomaine = emailDuDomaine(email, domaineOfficiel(c.website_url));
    const { data: rev, error } = await table().insert({
      company_id: companyId, user_id: userId, prenom, nom, fonction, telephone, email_pro: email,
      methode: parDomaine ? "domaine" : "manuel", statut: "code_envoye",
      empreinte_ip: ip, compte_cree: compteCree, langue: await langueRequete(),
    }).select("id").single();
    if (error || !rev) return { error: t("revend.eEnregistrement") };

    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    await table().update({
      code_hash: hacher(code, rev.id),
      code_expire: new Date(Date.now() + DUREE_CODE_MIN * 60_000).toISOString(),
      essais: 0,
    }).eq("id", rev.id);
    const parti = await sendCodeRevendication(email, prenom, c.name, code, await langueRequete());
    if (!parti) return { error: t("revend.eCourriel") };

    if (!user) {
      (await cookies()).set(COOKIE_REV, rev.id, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 2 * 3600 });
    }
    return { etat: { etape: "code", id: rev.id, email: masquer(email) } };
  } catch {
    return { error: t("revend.eGenerique") };
  }
}

export async function verifierCodeRevendication(id: string, code: string): Promise<{ error?: string; etat?: EtatRevendication }> {
  const t = await tRequete();
  try {
    if (!UUID.test(id)) return { error: t("revend.eDemande") };
    const user = await getUser();
    const jar = await cookies();
    const { data } = await table().select("*").eq("id", id).maybeSingle();
    const r = data as (Ligne & { compte_cree: boolean }) | null;
    // Connecté : la demande doit être la sienne. Sans session : la demande
    // doit être celle que ce navigateur vient de lancer (cookie).
    const autorise = r && (user ? r.user_id === user.id : jar.get(COOKIE_REV)?.value === r.id);
    if (!r || !autorise || r.statut !== "code_envoye") return { error: t("revend.eDemande") };
    if (r.essais >= ESSAIS_MAX) return { error: t("revend.eEssais") };
    if (!r.code_expire || new Date(r.code_expire).getTime() < Date.now()) {
      return { error: t("revend.eExpire") };
    }
    if (!/^\d{6}$/.test(code.trim()) || hacher(code.trim(), r.id) !== r.code_hash) {
      await table().update({ essais: r.essais + 1 }).eq("id", r.id);
      return { error: t("revend.eCode") };
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
    // Création : pas encore de fiche, le nom vient de la fiche proposée.
    const fiche = (r as Ligne & { fiche?: { name?: string } | null }).fiche;
    const c = r.company_id ? await entreprise(r.company_id) : null;
    await sendRevendicationAValider(c?.name ?? fiche?.name ?? "Entreprise", `${r.prenom} ${r.nom}, ${r.fonction}${r.telephone ? `, ${r.telephone}` : ""}`, r.email_pro, !r.company_id);
    if (!r.company_id) jar.delete("workie_creation");
    return { etat: { etape: "en_attente", email: masquer(r.email_pro) } };
  } catch {
    return { error: t("revend.eGenerique") };
  }
}
/** Ouvre le paiement Stripe de l'abonnement, une fois la demande vérifiée. */
export async function lancerAbonnement(id: string, formule: Formule): Promise<{ error?: string; url?: string }> {
  const t = await tRequete();
  try {
    const user = await getUser();
    if (!user || !UUID.test(id) || !(formule in ABONNEMENT)) return { error: t("revend.eDemande") };
    if (!process.env.STRIPE_SECRET_KEY) return { error: t("revend.ePaiementIndispo") };

    const { data } = await table().select("*").eq("id", id).eq("user_id", user.id).maybeSingle();
    const r = data as (Ligne & { fiche?: { name: string } | null }) | null;
    if (!r || r.statut !== "verifiee") return { error: t("revend.eNonVerifiee") };

    // Création : la fiche n'existe pas encore, elle naîtra au paiement (webhook).
    const creation = !r.company_id && !!r.fiche;
    const c = creation
      ? { id: "", slug: "", name: r.fiche!.name, website_url: null, is_subscribed: false }
      : await entreprise(r.company_id);
    if (!c) return { error: t("revend.eFiche") };
    if (c.is_subscribed) return { error: t("revend.eDejaGeree") };

    const base = SITE_URL;
    const offre = ABONNEMENT[formule];
    const meta: Record<string, string> = creation
      ? { type: "creation_entreprise", revendication_id: r.id, user_id: user.id }
      : { type: "abonnement_entreprise", company_id: c.id, revendication_id: r.id, user_id: user.id };
    // Un seul paiement possible par demande. La page de paiement précédente,
    // si elle existe : déjà payée, on active au lieu d'encaisser une seconde
    // fois ; encore ouverte, on l'expire, pour qu'un deuxième onglet ne puisse
    // pas payer en double.
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const precedente = (r as { stripe_session?: string | null }).stripe_session;
    if (precedente) {
      const p = await stripe.checkout.sessions.retrieve(precedente).catch(() => null);
      if (p?.status === "complete") {
        await activerAbonnementDepuisSession(stripe, p);
        return { url: `${base}/espace-entreprise` };
      }
      if (p?.status === "open") await stripe.checkout.sessions.expire(p.id).catch(() => {});
    }
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      locale: (await langueRequete()) === "de" ? "de" : "fr",
      customer_email: r.email_pro,
      line_items: [{
        price_data: {
          currency: "chf",
          product_data: { name: t("stripe.aboNom", { nom: c.name }), description: t("stripe.aboDescription") },
          // ABO_PRIX_TEST (CHF) : prix encaissé à l'essai seulement, pour payer
          // un vrai abonnement de test. L'affichage garde le vrai tarif.
          unit_amount: Math.round((Number(process.env.ABO_PRIX_TEST) >= 1 ? Number(process.env.ABO_PRIX_TEST) : offre.chf) * 100),
          recurring: { interval: offre.intervalle },
        },
        quantity: 1,
      }],
      client_reference_id: creation ? r.id : c.id,
      metadata: meta,
      subscription_data: { metadata: meta },
      allow_promotion_codes: true,
      billing_address_collection: "required",
      success_url: `${base}/espace-entreprise?bienvenue=1&session={CHECKOUT_SESSION_ID}`,
      cancel_url: creation ? `${base}/creer-entreprise` : `${base}/revendiquer/${c.slug}`,
    });
    await table().update({ stripe_session: session.id }).eq("id", r.id);
    return session.url ? { url: session.url } : { error: t("revend.ePaiement") };
  } catch {
    return { error: t("revend.ePaiementReessayer") };
  }
}


/**
 * Retour de paiement : Workie demande lui-même à Stripe si la session est
 * payée, au lieu d'attendre le webhook. Le client qui vient de payer entre dans
 * son espace tout de suite, même si la notification de Stripe tarde ou se perd.
 *
 * Seule la personne connectée qui a lancé le paiement peut l'activer : la
 * session doit porter son identifiant.
 */
export async function confirmerPaiement(sessionId: string): Promise<{ ok: boolean }> {
  try {
    const user = await getUser();
    if (!user || !process.env.STRIPE_SECRET_KEY) return { ok: false };
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    // Avec l'identifiant de session (retour normal de Stripe), ou sans : on
    // cherche alors parmi les paiements de la semaine celui de cette personne.
    // Un client qui a perdu l'adresse de retour n'est jamais bloqué.
    const sessions: Stripe.Checkout.Session[] = /^cs_[A-Za-z0-9_]{10,200}$/.test(sessionId)
      ? [await stripe.checkout.sessions.retrieve(sessionId)]
      : (await stripe.checkout.sessions.list({ limit: 100, created: { gte: Math.floor(Date.now() / 1000) - 7 * 86400 } })).data
          .filter(s => s.mode === "subscription" && s.status === "complete");
    for (const session of sessions) {
      if (session.metadata?.user_id !== user.id) continue;
      if (await activerAbonnementDepuisSession(stripe, session)) return { ok: true };
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
}
