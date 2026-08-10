import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { isLoggedIn: false, isAdmin: false, favIds: [], flameIds: [], boostIds: [], penaltyIds: [], penaltyCredits: 0, unreadCount: 0 },
        { headers: { "Cache-Control": "private, no-store" } }
      );
    }

    const [favRes, flameRes, profileRes, unreadRes] = await Promise.all([
      supabase.from("favorites").select("company_id").eq("user_id", user.id),
      // Les trois types de geste sont lus d'un coup. Seules les flammes
      // remontaient auparavant : l'explorateur et le swipe redémarraient donc
      // avec un boost et une pénalité vides, l'utilisateur voyait un bouton
      // éteint alors que son geste était bien enregistré, recliquait, et
      // l'annulait sans le vouloir.
      supabase.from("score_events").select("company_id, event_type").eq("user_id", user.id).in("event_type", ["flame", "boost", "penalty"]),
      supabase.from("profiles").select("role, penalty_credits").eq("id", user.id).maybeSingle(),
      supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("read", false),
    ]);

    return NextResponse.json(
      {
        isLoggedIn: true,
        compte: user.id,
        isAdmin: profileRes.data?.role === "admin",
        favIds: (favRes.data ?? []).map(r => r.company_id),
        flameIds:   (flameRes.data ?? []).filter(r => r.event_type === "flame").map(r => r.company_id),
        boostIds:   (flameRes.data ?? []).filter(r => r.event_type === "boost").map(r => r.company_id),
        penaltyIds: (flameRes.data ?? []).filter(r => r.event_type === "penalty").map(r => r.company_id),
        penaltyCredits: Number(profileRes.data?.penalty_credits ?? 0),
        unreadCount: unreadRes.count ?? 0,
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch {
    return NextResponse.json(
      { isLoggedIn: false, isAdmin: false, favIds: [], flameIds: [], boostIds: [], penaltyIds: [], penaltyCredits: 0, unreadCount: 0 },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  }
}
