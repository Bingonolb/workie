import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { isLoggedIn: false, isAdmin: false, favIds: [], flameIds: [], penaltyCredits: 0 },
        { headers: { "Cache-Control": "private, no-store" } }
      );
    }

    const [favRes, flameRes, profileRes] = await Promise.all([
      supabase.from("favorites").select("company_id").eq("user_id", user.id),
      supabase.from("score_events").select("company_id").eq("user_id", user.id).eq("event_type", "flame"),
      supabase.from("profiles").select("role, penalty_credits").eq("id", user.id).maybeSingle(),
    ]);

    return NextResponse.json(
      {
        isLoggedIn: true,
        isAdmin: profileRes.data?.role === "admin",
        favIds: (favRes.data ?? []).map(r => r.company_id),
        flameIds: (flameRes.data ?? []).map(r => r.company_id),
        penaltyCredits: Number(profileRes.data?.penalty_credits ?? 0),
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch {
    return NextResponse.json(
      { isLoggedIn: false, isAdmin: false, favIds: [], flameIds: [], penaltyCredits: 0 },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  }
}
