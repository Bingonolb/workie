import { redirect } from "next/navigation";
import { getUser, createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { ProfileClient } from "./ProfileClient";
import type { Profile, Watch as WatchType } from "@/lib/types";

export default async function ProfilePage() {
  const [user, supabase] = await Promise.all([getUser(), createClient()]);
  if (!user) redirect("/login");

  const [{ data: profile }, { data: watches }, { count: matchesCount }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("watches").select("id,brand,model,photos,status").eq("owner_id", user.id).order("created_at", { ascending: false }),
    supabase.from("matches").select("id", { count: "exact", head: true }).or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`),
  ]);

  return (
    <div style={{ minHeight: "100dvh", background: "#f4f4f4" }}>
      <Navbar />
      <main style={{ maxWidth: 860, margin: "0 auto", padding: "36px 32px 60px" }}>
        <ProfileClient
          userId={user.id}
          email={user.email ?? ""}
          initialProfile={profile as Profile | null}
          initialWatches={(watches ?? []) as unknown as (WatchType & { photos: string[] })[]}
          initialMatchesCount={matchesCount ?? 0}
        />
      </main>
    </div>
  );
}
