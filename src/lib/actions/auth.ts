"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/email";

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
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const username = String(formData.get("username") || "").trim();
  const rawNext = String(formData.get("next") || "");
  const next = /^\/(?![/\\])/.test(rawNext) && !rawNext.toLowerCase().includes("javascript:") ? rawNext : "/explore";

  if (!email || !password || !username) {
    return { error: "Tous les champs sont requis." };
  }
  if (password.length < 6) {
    return { error: "Le mot de passe doit faire au moins 6 caractères." };
  }
  if (isDisposableEmail(email)) {
    return { error: "Les adresses email temporaires ne sont pas acceptées." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.workie.ch"}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("already been registered")) {
      return { error: "Un compte existe déjà avec cet email. Connecte-toi." };
    }
    return { error: error.message };
  }

  // Send welcome email (non-blocking)
  void sendWelcomeEmail(email, username);

  // Email confirmation required (session is null)
  if (!data.session) {
    redirect(`/signup/confirm?email=${encodeURIComponent(email)}`);
  }

  redirect(next);
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
