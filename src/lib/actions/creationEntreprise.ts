"use server";

import { createHash, randomInt } from "crypto";
import { cookies, headers } from "next/headers";
import { getUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailValide } from "@/lib/domaineEntreprise";
import { sendCodeRevendication } from "@/lib/email";
import { getSecteursEnLigne } from "@/lib/secteursEnLigne";
import { cantonValide, EMPLOYEE_RANGES, LANGUES_SAISIE } from "@/lib/types";
import { creationOuverte } from "@/lib/ouverture";
import type { EtatRevendication } from "@/lib/actions/revendication";
import { langueRequete, tRequete } from "@/i18n/requete";

/**
 * Créer la fiche d'une entreprise absente de Workie.
 *
 * Même chemin que la revendication (compte, code à 6 chiffres, validation,
 * paiement), avec une différence de fond : rien n'entre dans l'annuaire avant
 * le paiement. La fiche proposée est gardée avec la demande (colonne
 * `fiche`) ; Luc la relit et l'accepte ; le webhook Stripe la crée au
 * paiement (lib/creationFiche). Une fiche à moitié validée ne peut donc jamais
 * apparaître sur le site.
 *
 * La validation est toujours manuelle : il n'existe pas de « domaine
 * officiel » à comparer pour une entreprise que l'on ne connaît pas encore.
 */

export type FicheProposee = {
  name: string; sector: string; city: string; canton: string;
  website_url: string; description: string; employee_range: string | null; langues: string[];
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COOKIE = "workie_creation";
const DUREE_CODE_MIN = 30;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const table = () => (createAdminClient().from("revendications" as any) as any);

const sel = () => process.env.EMPREINTE_SEL ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const hacher = (code: string, id: string) => createHash("sha256").update(`${sel()}|${id}|${code}`).digest("hex");
const empreinteIp = (ip: string) => createHash("sha256").update(`${sel()}|ip|${ip}`).digest("hex").slice(0, 32);
const masquer = (email: string) => { const [u, d] = email.split("@"); return `${u.slice(0, 2)}${"•".repeat(Math.max(1, u.length - 2))}@${d}`; };
/** « Café Müller SA » et « cafe muller » se comparent pareil. */
const normaliser = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .replace(/\b(sa|ag|sarl|sàrl|gmbh|ltd|inc)\b/g, "").replace(/[^a-z0-9]+/g, " ").trim();

type Ligne = { id: string; statut: string; email_pro: string; fiche: FicheProposee | null };

function etatDe(r: Ligne | null): EtatRevendication {
  if (r?.statut === "code_envoye") return { etape: "code", id: r.id, email: masquer(r.email_pro) };
  if (r?.statut === "en_attente") return { etape: "en_attente", email: masquer(r.email_pro) };
  if (r?.statut === "verifiee") return { etape: "paiement", id: r.id };
  if (r?.statut === "refusee") return { etape: "refusee" };
  return { etape: "formulaire", domaine: null };
}

/** Où en est la personne : sa dernière demande de création encore ouverte. */
export async function etatCreation(): Promise<EtatRevendication & { nom?: string }> {
  if (!creationOuverte) return { etape: "formulaire", domaine: null };
  const user = await getUser();
  let r: Ligne | null = null;
  if (user) {
    const { data } = await table().select("id, statut, email_pro, fiche").eq("user_id", user.id).is("company_id", null)
      .neq("statut", "annulee").order("cree_le", { ascending: false }).limit(1).maybeSingle();
    r = data as Ligne | null;
  } else {
    const id = (await cookies()).get(COOKIE)?.value;
    if (id && UUID.test(id)) {
      const { data } = await table().select("id, statut, email_pro, fiche").eq("id", id).is("company_id", null).maybeSingle();
      r = (data as Ligne | null)?.statut === "code_envoye" ? (data as Ligne) : null;
    }
  }
  return { ...etatDe(r), nom: r?.fiche?.name };
}

/** Des fiches existantes au nom proche : mieux vaut revendiquer que créer un doublon. */
export async function fichesProches(nom: string): Promise<{ name: string; slug: string; city: string }[]> {
  const n = normaliser(String(nom ?? "").slice(0, 120));
  if (n.length < 3) return [];
  const enLigne = await getSecteursEnLigne();
  const { data } = await createAdminClient().from("companies").select("name, slug, city, sector")
    .ilike("name", `%${n.split(" ")[0].replace(/[%_]/g, "")}%`).limit(40);
  return (data ?? [])
    .filter(c => enLigne.includes(c.sector) && (normaliser(c.name).includes(n) || n.includes(normaliser(c.name))))
    .slice(0, 5).map(({ name, slug, city }) => ({ name, slug, city }));
}

export async function demarrerCreation(formData: FormData): Promise<{ error?: string; compteExistant?: boolean; doublons?: { name: string; slug: string; city: string }[]; etat?: EtatRevendication }> {
  try {
    if (!creationOuverte) return { error: (await tRequete())("creation.eFermee") };
    const user = await getUser();
    const t = (k: string, max: number) => String(formData.get(k) ?? "").trim().slice(0, max);

    // ── La fiche proposée ──
    const enLigne = await getSecteursEnLigne();
    let site = t("website_url", 300);
    if (site && !/^https?:\/\//i.test(site)) site = `https://${site}`;
    try { if (site) new URL(site); } catch { return { error: (await tRequete())("creation.eSite") }; }
    const taille = t("employee_range", 20);
    const fiche: FicheProposee = {
      name: t("name", 120), sector: t("sector", 80), city: t("city", 80),
      canton: t("canton", 3).toUpperCase(), website_url: site, description: t("description", 3000),
      employee_range: (EMPLOYEE_RANGES as readonly string[]).includes(taille) ? taille : null,
      langues: t("langues", 40).split(",").map(l => l.trim().toUpperCase()).filter(l => LANGUES_SAISIE.some(x => x.code === l)),
    };
    if (fiche.name.length < 2) return { error: (await tRequete())("creation.eNom") };
    if (!enLigne.includes(fiche.sector)) return { error: (await tRequete())("creation.eSecteur") };
    if (!fiche.city) return { error: (await tRequete())("creation.eVille") };
    if (!cantonValide(fiche.canton) || fiche.canton === "CH") return { error: (await tRequete())("creation.eCanton") };
    if (!fiche.website_url) return { error: (await tRequete())("creation.eSiteManquant") };
    if (fiche.description.length < 80) return { error: (await tRequete())("creation.eDescription") };

    // Doublon probable : on le dit avant de créer quoi que ce soit, sauf si la
    // personne a confirmé qu'il s'agit bien d'une autre entreprise.
    if (formData.get("confirme_nouvelle") !== "1") {
      const proches = await fichesProches(fiche.name);
      if (proches.length) return { doublons: proches };
    }

    // ── La personne ──
    const prenom = t("prenom", 80), nom = t("nom", 80), fonction = t("fonction", 120), telephone = t("telephone", 30);
    const email = t("email", 254).toLowerCase();
    const motDePasse = String(formData.get("mot_de_passe") ?? "");
    if (!prenom || !nom || !fonction) return { error: (await tRequete())("creation.eIdentite") };
    if (!(/^\+?[0-9 ()./-]{9,20}$/.test(telephone) && telephone.replace(/\D/g, "").length >= 9)) return { error: (await tRequete())("revend.eTelephone") };
    if (!emailValide(email)) return { error: (await tRequete())("creation.eEmail") };
    if (!user && motDePasse.length < 8) return { error: (await tRequete())("creation.eMdp") };
    if (!user && motDePasse !== String(formData.get("mot_de_passe_confirmation") ?? "")) return { error: (await tRequete())("mdpChamp.different") };

    // Limites sur 24 heures, partagées avec la revendication.
    const h = await headers();
    const ip = empreinteIp(h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "inconnue");
    const depuis = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const [parIp, parEmail] = await Promise.all([
      table().select("id", { count: "exact", head: true }).eq("empreinte_ip", ip).gte("cree_le", depuis),
      table().select("id", { count: "exact", head: true }).ilike("email_pro", email).gte("cree_le", depuis),
    ]);
    if ((parIp.count ?? 0) >= 10 || (parEmail.count ?? 0) >= 5) return { error: (await tRequete())("creation.eTrop") };

    const admin = createAdminClient();
    if (user) {
      const { data: p } = await admin.from("profiles").select("claimed_company_id").eq("id", user.id).maybeSingle();
      if (p?.claimed_company_id) {
        const { data: autre } = await admin.from("companies").select("name, is_subscribed").eq("id", p.claimed_company_id).maybeSingle();
        if (autre?.is_subscribed) return { error: (await tRequete())("creation.eAutre", { nom: autre.name }) };
      }
    }

    let userId = user?.id ?? null;
    let compteCree = false;
    if (!userId) {
      const { data: p } = await admin.from("profiles").select("id").ilike("email", email).maybeSingle();
      if (p?.id) {
        const { data: u } = await admin.auth.admin.getUserById(p.id);
        if (u?.user?.email_confirmed_at || !u?.user?.user_metadata?.compte_entreprise) {
          return { error: (await tRequete())("creation.eCompte"), compteExistant: true };
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
          if ((error?.message ?? "").toLowerCase().includes("password")) return { error: (await tRequete())("creation.eFaible") };
          return { error: (await tRequete())("creation.eCreation") };
        }
        userId = cree.user.id;
      }
      compteCree = true;
    }

    // Une seule création en cours par compte.
    await table().update({ statut: "annulee" }).eq("user_id", userId).is("company_id", null)
      .in("statut", ["code_envoye", "en_attente", "verifiee"]);

    const { data: rev, error } = await table().insert({
      company_id: null, fiche, user_id: userId, prenom, nom, fonction, telephone, email_pro: email,
      methode: "manuel", statut: "code_envoye", empreinte_ip: ip, compte_cree: compteCree, langue: await langueRequete(),
    }).select("id").single();
    if (error || !rev) return { error: (await tRequete())("creation.eEnregistrement") };

    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    await table().update({
      code_hash: hacher(code, rev.id), code_expire: new Date(Date.now() + DUREE_CODE_MIN * 60_000).toISOString(), essais: 0,
    }).eq("id", rev.id);
    if (!(await sendCodeRevendication(email, prenom, fiche.name, code, await langueRequete()))) {
      return { error: (await tRequete())("creation.eCourriel") };
    }
    // Sans session : la vérification du code reconnaît la demande par ce cookie
    // (même nom que la revendication, lu par verifierCodeRevendication).
    if (!user) (await cookies()).set("workie_revendication", rev.id, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 2 * 3600 });
    if (!user) (await cookies()).set(COOKIE, rev.id, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 2 * 3600 });
    return { etat: { etape: "code", id: rev.id, email: masquer(email) } };
  } catch {
    return { error: (await tRequete())("creation.eGenerique") };
  }
}
