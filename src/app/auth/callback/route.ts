import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "";
  const next = /^\/(?![/\\])/.test(rawNext) && !rawNext.toLowerCase().includes("javascript:") ? rawNext : "";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      // If user was invited with company metadata, ensure profile is linked
      if (user) {
        const companyIdFromMeta = user.user_metadata?.company_id as string | undefined;
        if (companyIdFromMeta) {
          await supabase.from("profiles").upsert({
            id: user.id,
            claimed_company_id: companyIdFromMeta,
            full_name: (user.user_metadata?.full_name as string | undefined) ?? (`${(user.user_metadata?.first_name as string | undefined) ?? ""} ${(user.user_metadata?.last_name as string | undefined) ?? ""}`.trim() || null),
          }, { onConflict: "id" });
          return NextResponse.redirect(`${origin}/business/dashboard`);
        }
      }

      // If a specific next was requested, honour it
      if (next) return NextResponse.redirect(`${origin}${next}`);

      // Otherwise check role to decide where to send the user
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("claimed_company_id")
          .eq("id", user.id)
          .maybeSingle();

        if (profile?.claimed_company_id) {
          return NextResponse.redirect(`${origin}/business/dashboard`);
        }
      }

      return NextResponse.redirect(`${origin}/explore`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
