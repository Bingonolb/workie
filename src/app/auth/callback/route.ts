import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function extractGeo(request: Request) {
  const h = request.headers;
  const rawCity = h.get("x-vercel-ip-city");
  return {
    canton: h.get("x-vercel-ip-country-region") ?? null, // e.g. "GE", "VD"
    city:   rawCity ? decodeURIComponent(rawCity) : null, // Vercel URL-encodes accented chars
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
  // Returns true if this is a brand-new profile (used to decide onboarding redirect)
  async function upsertProfileGeo(userId: string, extra?: Record<string, unknown>): Promise<boolean> {
    const geoFields = geo.city ? { city: geo.city } : {};

    const { data: { user: u } } = await supabase.auth.getUser();
    const metaCanton = u?.user_metadata?.canton as string | undefined;

    // Check if the profile already exists to avoid overwriting username/role
    const { data: existing } = await supabase
      .from("profiles")
      .select("id, username")
      .eq("id", userId)
      .maybeSingle();

    if (existing) {
      // Profile exists — update city from geo, canton from metadata if present, + extra
      const cantonUpdate = metaCanton ? { canton: metaCanton } : {};
      const updates = { ...geoFields, ...cantonUpdate, ...(extra as object) };
      if (Object.keys(updates).length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await supabase.from("profiles").update(updates as any).eq("id", userId);
      }
      // Check if onboarding was seen (for existing profiles that haven't completed it)
      const { data: prof } = await supabase.from("profiles").select("has_seen_onboarding").eq("id", userId).maybeSingle();
      return prof?.has_seen_onboarding === false;
    } else {
      // New profile — use canton from user_metadata, fallback to geo
      const emailBase = u?.email?.split("@")[0]?.replace(/[^a-z0-9]/gi, "").toLowerCase() ?? "user";
      const username = (u?.user_metadata?.username as string | undefined) ?? `${emailBase}_${userId.slice(0, 6)}`;
      const fullName = (u?.user_metadata?.full_name as string | undefined) ?? null;
      const cantonField = metaCanton ? { canton: metaCanton } : {};
      await supabase.from("profiles").upsert(
        { id: userId, username, full_name: fullName, ...cantonField, ...geoFields, ...extra },
        { onConflict: "id", ignoreDuplicates: true }
      );
      return true;
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
        const isNew = await upsertProfileGeo(user.id);
        if (isNew) return NextResponse.redirect(`${origin}/explore?welcome=1`);
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
        const isNew = await upsertProfileGeo(user.id);
        if (next) return NextResponse.redirect(`${origin}${next}`);
        if (isNew) return NextResponse.redirect(`${origin}/explore?welcome=1`);
        return NextResponse.redirect(`${origin}/explore`);
      }

      return NextResponse.redirect(`${origin}/explore`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
