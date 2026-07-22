import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Recovery route: clears the broken session cookies then redirects to login.
// Used when getUser() returns null but the stale cookie is still in the browser,
// which would otherwise create an infinite redirect loop between /login and /explore.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const rawNext = searchParams.get("next") ?? "/login";
  // Validate: must be a same-origin relative path to prevent open redirect
  const next = /^\/(?![/\\])/.test(rawNext) && !rawNext.toLowerCase().includes("javascript:") ? rawNext : "/login";

  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // signOut failed — proceed anyway, cookies will be cleared on next auth attempt
  }

  return NextResponse.redirect(`${origin}${next}`);
}
