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

// Cached per-request: isAdmin check shared across Navbar + any page that needs it.
export const getIsAdmin = cache(async () => {
  const user = await getUser();
  if (!user) return false;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return data?.role === "admin";
});

// Cached per-request: returns claimed_company_id if user is a business account.
export const getBusinessCompanyId = cache(async (): Promise<string | null> => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("claimed_company_id").eq("id", user.id).maybeSingle();
  return data?.claimed_company_id ?? null;
});

// Cached per-request: full company row for the logged-in business user.
// Shared across layout → protected layout → page → actions — only 1 DB round trip per request.
export const getBusinessCompanyData = cache(async () => {
  const companyId = await getBusinessCompanyId();
  if (!companyId) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("companies")
    .select("id, name, is_verified, is_subscribed, logo_url, cover_url, website_url, linkedin_url, twitter_url, instagram_url, description, sector, city, canton, employee_range, tags, score, avg_rating, review_count, stripe_subscription_id, subscription_ends_at, subscription_cancel_at_period_end")
    .eq("id", companyId)
    .maybeSingle();
  return data ?? null;
});
