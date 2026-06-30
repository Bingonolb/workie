import { Navbar } from "@/components/Navbar";
import { ProfileForm } from "@/components/ProfileForm";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .maybeSingle();

  const { count: watchesCount } = await supabase
    .from("watches")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user!.id);

  const { count: matchesCount } = await supabase
    .from("matches")
    .select("id", { count: "exact", head: true })
    .or(`user_a_id.eq.${user!.id},user_b_id.eq.${user!.id}`);

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      <main className="mx-auto max-w-xl px-6 py-10">
        <h1 className="mb-6 text-2xl font-bold">Mon profil</h1>
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
            <p className="text-2xl font-bold">{watchesCount ?? 0}</p>
            <p className="text-sm text-neutral-500">Montres</p>
          </div>
          <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
            <p className="text-2xl font-bold">{matchesCount ?? 0}</p>
            <p className="text-sm text-neutral-500">Échanges</p>
          </div>
        </div>
        <ProfileForm profile={profile as Profile} email={user!.email ?? ""} />
      </main>
    </div>
  );
}
