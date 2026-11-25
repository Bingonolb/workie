"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { traducteur } from "@/i18n/serveur";
import { COOKIE_LANGUE } from "@/i18n/config";
import type { Traduire } from "@/i18n/traduire";

/** La langue de la page qui a envoyé le formulaire, sinon celle gardée en cookie. */
async function tAction(formData?: FormData): Promise<Traduire> {
  const envoyee = formData?.get("langue");
  return traducteur(typeof envoyee === "string" && envoyee ? envoyee : (await cookies()).get(COOKIE_LANGUE)?.value);
}

type ActionState = { error?: string } | undefined;

// Disposable email domains blocked to prevent bot accounts
const BLOCKED_DOMAINS = new Set([
  "mailinator.com","guerrillamail.com","guerrillamail.net","guerrillamail.org",
  "guerrillamail.de","guerrillamail.biz","guerrillamail.info","grr.la",
  "tempmail.com","temp-mail.org","temp-mail.io","throwam.com","throwaway.email",
  "yopmail.com","yopmail.fr","cool.fr.nf","jetable.fr.nf","nospam.ze.tc",
  "nomail.xl.cx","mega.zik.dj","speed.1s.fr","courriel.fr.nf","moncourrier.fr.nf",
  "dispostable.com","mailnull.com","spamgourmet.com","trashmail.com","trashmail.me",
  "trashmail.at","trashmail.io","trashmail.net","trashmail.org","discard.email",
  "fakeinbox.com","maildrop.cc","sharklasers.com","guerrillamailblock.com",
  "spam4.me","spamfree24.org","spamfree.eu","mailnesia.com","mailnull.com",
  "spamspot.com","spamthisplease.com","spamhereplease.com","trashdevil.com",
  "deadaddress.com","filzmail.com","getairmail.com","junk1.tk","spamfree24.de",
  "spamfree24.eu","spamfree24.info","spamfree24.net","spamfree24.org",
  "objectmail.com","obobbo.com","odaymail.com","oneoffemail.com","onewaymail.com",
  "10minutemail.com","10minutemail.net","20minutemail.com","emailondeck.com",
  "burnermail.io","mohmal.com","tempinbox.com","inoutmail.de","inoutmail.eu",
  "mytrashmail.com","nospamfor.us","nomail.pw","owlpic.com","supergreatmail.com",
]);

function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  return BLOCKED_DOMAINS.has(domain);
}


/**
 * Les messages de Supabase arrivent en anglais (« Auth session missing! »,
 * « Email rate limit exceeded »…) et s'affichaient tels quels. On les traduit ;
 * à défaut, un message général plutôt que du jargon.
 */
function traduire(message: string, t: Traduire): string {
  const m = message.toLowerCase();
  if (m.includes("rate limit") || m.includes("too many") || m.includes("security purposes")) return t("auth.errTropTentatives");
  if (m.includes("session missing") || m.includes("session not found") || m.includes("jwt")) return t("auth.errLienExpire");
  if (m.includes("same as") || m.includes("different from the old")) return t("auth.errMemeMotDePasse");
  if (m.includes("weak") || m.includes("pwned") || m.includes("password should")) return t("auth.errFaible");
  if (m.includes("invalid") && m.includes("email")) return t("auth.errEmailInvalide");
  if (m.includes("signup") && m.includes("disabled")) return t("auth.errFermees");
  return t("auth.errInconnue");
}

/**
 * Renvoie le lien de confirmation d'inscription.
 *
 * Supabase limite déjà les envois par adresse ; la réponse reste la même que
 * l'adresse existe ou non, pour ne rien révéler.
 */
export async function renvoyerConfirmation(email: string): Promise<{ ok: boolean }> {
  const adresse = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adresse)) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: adresse,
    options: { emailRedirectTo: RETOUR },
  });
  return { ok: !error };
}

/**
 * Adresse de retour du lien de confirmation. Elle porte toujours une
 * requête (« ?e=1 ») : le modèle d'e-mail y ajoute « &token_hash=… », pour
 * que le bouton mène à workie.ch et non à supabase.co (un lien vers un
 * domaine étranger à l'expéditeur envoyait le courriel en indésirables).
 */
const RETOUR = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.workie.ch"}/auth/callback?e=1`;

function suiteInscription(formData: FormData): string {
  const n = String(formData.get("next") || "");
  return /^\/(?![/\\])/.test(n) && !n.toLowerCase().includes("javascript:") && n !== "/explore"
    ? `&next=${encodeURIComponent(n)}` : "";
}

export async function signUp(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const t = await tAction(formData);
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const emailConfirm = String(formData.get("email_confirm") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const firstName = String(formData.get("first_name") || "").trim();
  const lastName = String(formData.get("last_name") || "").trim();
  const canton = String(formData.get("canton") || "").trim();
  const birthYearRaw = String(formData.get("birth_year") || "").trim();
  const birthYear = birthYearRaw ? parseInt(birthYearRaw, 10) : null;

  if (!email || !password || !firstName || !lastName) {
    return { error: t("auth.errTousChamps") };
  }
  if (email !== emailConfirm) {
    return { error: t("auth.errEmailsDifferents") };
  }
  if (!/^[A-Z]{2}$/.test(canton)) {
    return { error: t("auth.errCanton") };
  }
  const currentYear = new Date().getFullYear();
  if (!birthYear || birthYear < 1920 || birthYear > currentYear - 13) {
    return { error: t("auth.errNaissance") };
  }
  if (password.length < 8) {
    return { error: t("auth.errMotDePasse") };
  }
  if (isDisposableEmail(email)) {
    return { error: t("auth.errJetable") };
  }

  // Generate a username from first + last name
  const username = `${firstName.replace(/[^a-z0-9]/gi, "").toLowerCase()}_${lastName.replace(/[^a-z0-9]/gi, "").toLowerCase()}`.slice(0, 30);
  const fullName = `${firstName} ${lastName}`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username, full_name: fullName, first_name: firstName, last_name: lastName, canton, birth_year: birthYear },
      // Avec `next`, la confirmation ramène là où l'inscription a commencé
      // (par exemple la revendication d'une fiche) ; sinon /explore?welcome=1.
      emailRedirectTo: `${RETOUR}${suiteInscription(formData)}`,
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("already been registered")) {
      return { error: t("auth.errCompteExistant") };
    }
    return { error: traduire(error.message, t) };
  }

  // Adresse déjà inscrite et confirmée : Supabase ne renvoie pas d'erreur,
  // n'envoie aucun courriel, et rend un utilisateur sans identité. Sans ce
  // contrôle, on annonçait un lien de confirmation qui n'arriverait jamais.
  if (data.user && (data.user.identities?.length ?? 0) === 0) {
    return { error: t("auth.errCompteExistant") };
  }

  // Email confirmation required (session is null)
  if (!data.session) {
    redirect(`/signup/confirm?email=${encodeURIComponent(email)}`);
  }

  redirect("/explore");
}

export async function signIn(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const t = await tAction(formData);
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const rawNext = String(formData.get("next") || "");
  const nextDemande = /^\/(?![/\\])/.test(rawNext) && !rawNext.toLowerCase().includes("javascript:") ? rawNext : "";

  const supabase = await createClient();
  const { data: connexion, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Un compte non confirmé recevait « Email ou mot de passe incorrect ».
    // L'utilisateur cherchait alors une faute dans son mot de passe, le
    // ressaisissait, et finissait par se croire bloqué — alors que le message
    // à lui donner était tout autre : va ouvrir ta boîte mail.
    const cause = `${error.code ?? ""} ${error.message}`.toLowerCase();
    if (cause.includes("not confirmed") || cause.includes("email_not_confirmed")) {
      return { error: t("auth.errNonConfirme") };
    }
    // Toute autre cause reste volontairement indistincte : préciser laquelle
    // reviendrait à indiquer si une adresse est enregistrée chez nous.
    return { error: t("auth.errIdentifiants") };
  }

  // Sans destination demandée : une entreprise abonnée arrive dans son espace,
  // tout le monde ailleurs sur Explorer.
  let next = nextDemande;
  if (!next && connexion.user) {
    const { data: p } = await supabase.from("profiles").select("claimed_company_id").eq("id", connexion.user.id).maybeSingle();
    next = p?.claimed_company_id ? "/espace-entreprise" : "/explore";
  }
  redirect(next || "/explore");
}

export async function forgotPassword(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const t = await tAction(formData);
  const email = String(formData.get("email") || "").trim();
  if (!email) return { error: t("auth.errEmailRequis") };

  const supabase = await createClient();
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.workie.ch";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${base}/auth/callback?next=/reset-password`,
  });

  if (error) return { error: traduire(error.message, t) };
  return { error: undefined };
}

export async function resetPassword(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const t = await tAction(formData);
  const password = String(formData.get("password") || "");
  if (password.length < 8) return { error: t("auth.errMotDePasse") };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: traduire(error.message, t) };

  redirect("/explore");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function deleteAccount(): Promise<{ error?: string }> {
  const t = await tAction();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: t("auth.errNonAuthentifie") };

  // Business accounts cannot self-delete (admin must handle)
  const { data: profile } = await supabase
    .from("profiles")
    .select("claimed_company_id")
    .eq("id", user.id)
    .maybeSingle();
  // Delete user data via admin client (bypasses RLS)
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  if (profile?.claimed_company_id) {
    const { data: c } = await admin.from("companies").select("name, is_subscribed").eq("id", profile.claimed_company_id).maybeSingle();
    if (c?.is_subscribed) {
      return { error: t("auth.errAbonnement", { nom: c.name }) };
    }
  }

  // Une campagne payée encore en cours serait perdue avec le compte.
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const { count: campagnesEnCours } = await admin.from("ad_campaigns").select("id", { count: "exact", head: true })
    .eq("user_id", user.id).in("status", ["active", "paused"]).gte("end_date", aujourdhui);
  if ((campagnesEnCours ?? 0) > 0) {
    return { error: t("auth.errCampagne") };
  }

  // La photo de profil est publique : elle part avec le compte.
  const { data: fichiers } = await admin.storage.from("avatars").list(user.id);
  if (fichiers?.length) await admin.storage.from("avatars").remove(fichiers.map(f => `${user.id}/${f.name}`));

  // Anonymize reviews: disconnect from user but keep the content for the community.
  // The FK on reviews.user_id is ON DELETE SET NULL, so we only need to null it out here.
  // submitter_ip is also scrubbed at deletion time (personal data, no longer needed).
  await admin
    .from("reviews")
    .update({ user_id: null, submitter_ip: null })
    .eq("user_id", user.id);

  // Personal data with no community value — hard delete
  await admin.from("review_votes").delete().eq("user_id", user.id);
  await admin.from("score_events").delete().eq("user_id", user.id);
  await admin.from("favorites").delete().eq("user_id", user.id);
  await admin.from("reports").delete().eq("reporter_id", user.id);
  await admin.from("notifications").delete().eq("user_id", user.id);
  await admin.from("profiles").delete().eq("id", user.id);

  // Delete the auth user
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { error: t("auth.errSuppression") };

  // Sign out locally and redirect
  await supabase.auth.signOut();
  redirect("/");
}

export async function signInWithGoogle(formData: FormData) {
  const rawNext = String(formData.get("next") || "");
  const next = /^\/(?![/\\])/.test(rawNext) && !rawNext.toLowerCase().includes("javascript:") ? rawNext : "";

  const supabase = await createClient();
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.workie.ch";
  // Sans destination demandée, le rappel décide : accueil des nouveaux
  // comptes (?welcome=1), espace entreprise, ou Explorer.
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${base}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`,
    },
  });

  if (error || !data.url) {
    redirect("/login?error=google");
  }

  redirect(data.url);
}
