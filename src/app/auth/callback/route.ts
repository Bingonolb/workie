import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function extractGeo(request: Request) {
  const h = request.headers;
  return {
    canton: h.get("x-vercel-ip-country-region") ?? null, // e.g. "GE", "VD"
    city:   h.get("x-vercel-ip-city") ?? null,
    country: h.get("x-vercel-ip-country") ?? null,
  };
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const rawNext = searchParams.get("next") ?? "";
  const next = /^\/(?![/\\])/.test(rawNext) && !rawNext.toLowerCase().includes("javascript:") ? rawNext : "";

  const supabase = await createClient();

  const geo = extractGeo(request);

  // Helper: upsert profile with geo data.
  // On INSERT: generates a username from the user's email to satisfy NOT NULL.
  // On UPDATE (conflict on id): preserves existing username via ignoreDuplicates=false
  // but the WITH CHECK on the UPDATE RLS policy blocks role changes server-side.
  async function upsertProfileGeo(userId: string, extra?: Record<string, unknown>) {
    const geoFields = geo.canton ? {
      canton: geo.canton,
      city: geo.city ?? undefined,
    } : {};

    // Check if the profile already exists to avoid overwriting username/role
    const { data: existing } = await supabase
      .from("profiles")
      .select("id, username")
      .eq("id", userId)
      .maybeSingle();

    if (existing) {
      // Profile exists — only update geo + extra (never touch username)
      const updates = { ...geoFields, ...extra };
      if (Object.keys(updates).length > 0) {
        await supabase.from("profiles").update(updates).eq("id", userId);
      }
    } else {
      // New profile — generate username from email
      const { data: { user: u } } = await supabase.auth.getUser();
      const emailBase = u?.email?.split("@")[0]?.replace(/[^a-z0-9_]/gi, "_").toLowerCase() ?? "user";
      const username = `${emailBase}_${userId.slice(0, 6)}`;
      await supabase.from("profiles").upsert(
        { id: userId, username, ...geoFields, ...extra },
        { onConflict: "id", ignoreDuplicates: true }
      );
    }
  }

  // Handle Supabase invite / magic-link (token_hash flow)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "invite" | "email" | "recovery" | "signup" | "magiclink",
    });

    if (!error) {
      // Password reset flow
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/reset-password`);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const companyIdFromMeta = user.user_metadata?.company_id as string | undefined;
        if (companyIdFromMeta) {
          await upsertProfileGeo(user.id, {
            claimed_company_id: companyIdFromMeta,
            full_name: (user.user_metadata?.full_name as string | undefined)
              ?? (`${(user.user_metadata?.first_name as string | undefined) ?? ""} ${(user.user_metadata?.last_name as string | undefined) ?? ""}`.trim() || null),
          });
          return NextResponse.redirect(`${origin}/business/checkout`);
        }
        await upsertProfileGeo(user.id);
      }
      if (next) return NextResponse.redirect(`${origin}${next}`);
      return NextResponse.redirect(`${origin}/explore`);
    }
    return NextResponse.redirect(`${origin}/login?error=invite`);
  }

  // Handle OAuth / email code flow
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const companyIdFromMeta = user.user_metadata?.company_id as string | undefined;
        if (companyIdFromMeta) {
          await upsertProfileGeo(user.id, {
            claimed_company_id: companyIdFromMeta,
            full_name: (user.user_metadata?.full_name as string | undefined)
              ?? (`${(user.user_metadata?.first_name as string | undefined) ?? ""} ${(user.user_metadata?.last_name as string | undefined) ?? ""}`.trim() || null),
          });
          return NextResponse.redirect(`${origin}/business/checkout`);
        }
        await upsertProfileGeo(user.id);
      }

      if (next) return NextResponse.redirect(`${origin}${next}`);

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("claimed_company_id")
          .eq("id", user.id)
          .maybeSingle();
        if (profile?.claimed_company_id) {
          return NextResponse.redirect(`${origin}/business/checkout`);
        }
      }

      return NextResponse.redirect(`${origin}/explore`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
