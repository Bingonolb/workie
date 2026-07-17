"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

export async function signUp(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const emailConfirm = String(formData.get("email_confirm") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const firstName = String(formData.get("first_name") || "").trim();
  const lastName = String(formData.get("last_name") || "").trim();
  const canton = String(formData.get("canton") || "").trim();

  if (!email || !password || !firstName || !lastName) {
    return { error: "Tous les champs sont requis." };
  }
  if (email !== emailConfirm) {
    return { error: "Les deux adresses email ne correspondent pas." };
  }
  if (!canton) {
    return { error: "Sélectionne ton canton." };
  }
  if (password.length < 6) {
    return { error: "Le mot de passe doit faire au moins 6 caractères." };
  }
  if (isDisposableEmail(email)) {
    return { error: "Les adresses email temporaires ne sont pas acceptées." };
  }

  // Generate a username from first + last name
  const username = `${firstName.replace(/[^a-z0-9]/gi, "").toLowerCase()}_${lastName.replace(/[^a-z0-9]/gi, "").toLowerCase()}`.slice(0, 30);
  const fullName = `${firstName} ${lastName}`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username, full_name: fullName, first_name: firstName, last_name: lastName, canton },
      // No `next` param — callback will redirect to /onboarding for type=signup
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.workie.ch"}/auth/callback`,
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("already been registered")) {
      return { error: "Un compte existe déjà avec cet email. Connecte-toi." };
    }
    return { error: error.message };
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
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const rawNext = String(formData.get("next") || "");
  const next = /^\/(?![/\\])/.test(rawNext) && !rawNext.toLowerCase().includes("javascript:") ? rawNext : "/explore";

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Email ou mot de passe incorrect." };
  }

  redirect(next);
}

export async function forgotPassword(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = String(formData.get("email") || "").trim();
  if (!email) return { error: "Email requis." };

  const supabase = await createClient();
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.workie.ch";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${base}/auth/callback?next=/reset-password`,
  });

  if (error) return { error: error.message };
  return { error: undefined };
}

export async function resetPassword(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const password = String(formData.get("password") || "");
  if (password.length < 6) return { error: "Le mot de passe doit faire au moins 6 caractères." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  redirect("/explore");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function deleteAccount(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  // Business accounts cannot self-delete (admin must handle)
  const { data: profile } = await supabase
    .from("profiles")
    .select("claimed_company_id")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.claimed_company_id) {
    return { error: "Les comptes entreprise ne peuvent pas être supprimés automatiquement. Contactez le support." };
  }

  // Delete user data via admin client (bypasses RLS)
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  // Delete in dependency order
  await admin.from("review_votes").delete().eq("user_id", user.id);
  await admin.from("reviews").delete().eq("user_id", user.id);
  await admin.from("favorites").delete().eq("user_id", user.id);
  await admin.from("notifications").delete().eq("user_id", user.id);
  await admin.from("profiles").delete().eq("id", user.id);

  // Delete the auth user
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { error: error.message };

  // Sign out locally and redirect
  await supabase.auth.signOut();
  redirect("/");
}

export async function signInWithGoogle(formData: FormData) {
  const rawNext = String(formData.get("next") || "");
  const next = /^\/(?![/\\])/.test(rawNext) && !rawNext.toLowerCase().includes("javascript:") ? rawNext : "/explore";

  const supabase = await createClient();
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.workie.ch";
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${base}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) {
    redirect("/login?error=google");
  }

  redirect(data.url);
}
