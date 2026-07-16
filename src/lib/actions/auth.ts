"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ActionState = { error?: string } | undefined;

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
