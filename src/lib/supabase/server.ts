import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import type { Database } from "@/lib/types";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
          catch { /* Server Component — middleware handles refresh */ }
        },
      },
    }
  );
}

// Cached per-request: getUser() is called at most once per server render,
// even if Navbar + page both call it.
export const getUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});

// Single cached profile fetch — role + claimed_company_id in one query.
// Both getIsAdmin() and getBusinessCompanyId() derive from this.
const getProfile = cache(async () => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("role, claimed_company_id")
    .eq("id", user.id)
    .maybeSingle();
  return data ?? null;
});

/**
 * Niveau d'authentification de la session : « aal2 » quand le code à 6
 * chiffres a été saisi. Lu dans le jeton, sans appel réseau.
 */
export const getNiveauAal = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  return data?.currentLevel ?? null;
});

/** Le rôle seul, pour savoir s'il faut demander le code. */
export const getEstAdminSansMfa = cache(async () => {
  const profile = await getProfile();
  return profile?.role === "admin";
});

/**
 * Admin confirmé : le rôle ET la double authentification. Un mot de passe
 * volé ne suffit plus à ouvrir l'administration.
 */
export const getIsAdmin = cache(async () => {
  const [profile, niveau] = await Promise.all([getProfile(), getNiveauAal()]);
  return profile?.role === "admin" && niveau === "aal2";
});

