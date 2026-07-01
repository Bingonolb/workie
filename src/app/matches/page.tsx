import { redirect } from "next/navigation";
import { getUser, createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { MatchesClient } from "./MatchesClient";

export default async function MatchesPage() {
  const [user, supabase] = await Promise.all([getUser(), createClient()]);
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("matches")
    .select("id, created_at, watch_a:watches!matches_watch_a_id_fkey(id,owner_id,brand,model,photos), watch_b:watches!matches_watch_b_id_fkey(id,owner_id,brand,model,photos)")
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  return (
    <div style={{ minHeight: "100dvh", background: "#f4f4f4" }}>
      <Navbar />
      <main style={{ maxWidth: 680, margin: "0 auto", padding: "36px 32px 60px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111", marginBottom: 24 }}>Mes échanges</h1>
        <MatchesClient userId={user.id} initialRows={data as any ?? []} />
      </main>
    </div>
  );
}
