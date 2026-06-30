import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";

interface Row {
  id: string;
  created_at: string;
  watch_a: { owner_id: string; brand: string; model: string; photos: string[] };
  watch_b: { owner_id: string; brand: string; model: string; photos: string[] };
  user_a: { username: string; avatar_url: string | null };
  user_b: { username: string; avatar_url: string | null };
}

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("matches")
    .select(
      "id, created_at, watch_a:watches!matches_watch_a_id_fkey(owner_id,brand,model,photos), watch_b:watches!matches_watch_b_id_fkey(owner_id,brand,model,photos), user_a:profiles!matches_user_a_id_fkey(username,avatar_url), user_b:profiles!matches_user_b_id_fkey(username,avatar_url)"
    )
    .or(`user_a_id.eq.${user!.id},user_b_id.eq.${user!.id}`)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as Row[];

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="mb-6 text-2xl font-bold">Messages</h1>
        {rows.length === 0 ? (
          <p className="rounded-2xl bg-white p-8 text-center text-neutral-500 shadow-sm">
            Pas encore de conversation. Matche avec quelqu&apos;un pour démarrer une discussion.
          </p>
        ) : (
          <div className="divide-y divide-neutral-100 overflow-hidden rounded-2xl bg-white shadow-sm">
            {rows.map((m) => {
              const iAmA = m.watch_a.owner_id === user!.id;
              const theirWatch = iAmA ? m.watch_b : m.watch_a;
              const theirProfile = iAmA ? m.user_b : m.user_a;
              return (
                <Link
                  key={m.id}
                  href={`/messages/${m.id}`}
                  className="flex items-center gap-4 p-4 transition hover:bg-neutral-50"
                >
                  <div className="h-12 w-12 overflow-hidden rounded-full bg-neutral-200">
                    {theirWatch.photos?.[0] && (
                      <Image src={theirWatch.photos[0]} alt={theirWatch.brand} width={48} height={48} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{theirProfile?.username ?? "Collectionneur"}</p>
                    <p className="text-sm text-neutral-500">
                      {theirWatch.brand} {theirWatch.model}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
