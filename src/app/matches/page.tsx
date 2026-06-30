import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";

interface Row {
  id: string;
  created_at: string;
  watch_a: { id: string; owner_id: string; brand: string; model: string; photos: string[] };
  watch_b: { id: string; owner_id: string; brand: string; model: string; photos: string[] };
}

export default async function MatchesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("matches")
    .select(
      "id, created_at, watch_a:watches!matches_watch_a_id_fkey(id,owner_id,brand,model,photos), watch_b:watches!matches_watch_b_id_fkey(id,owner_id,brand,model,photos)"
    )
    .or(`user_a_id.eq.${user!.id},user_b_id.eq.${user!.id}`)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as Row[];

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="mb-6 text-2xl font-bold">Mes échanges</h1>
        {rows.length === 0 ? (
          <p className="rounded-2xl bg-white p-8 text-center text-neutral-500 shadow-sm">
            Aucun échange pour le moment. Va swiper sur{" "}
            <Link href="/discover" className="font-medium text-brand">
              Découvrir
            </Link>
            .
          </p>
        ) : (
          <div className="space-y-3">
            {rows.map((m) => {
              const mine = m.watch_a.owner_id === user!.id ? m.watch_a : m.watch_b;
              const theirs = m.watch_a.owner_id === user!.id ? m.watch_b : m.watch_a;
              return (
                <Link
                  key={m.id}
                  href={`/messages/${m.id}`}
                  className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex -space-x-3">
                    <div className="h-14 w-14 overflow-hidden rounded-full border-2 border-white ring-1 ring-neutral-200">
                      {theirs.photos?.[0] && (
                        <Image src={theirs.photos[0]} alt={theirs.brand} width={56} height={56} className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="h-14 w-14 overflow-hidden rounded-full border-2 border-white ring-1 ring-neutral-200">
                      {mine.photos?.[0] && (
                        <Image src={mine.photos[0]} alt={mine.brand} width={56} height={56} className="h-full w-full object-cover" />
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold">
                      {theirs.brand} {theirs.model} ↔ {mine.brand} {mine.model}
                    </p>
                    <p className="text-sm text-neutral-500">
                      Matché le {new Date(m.created_at).toLocaleDateString("fr-FR")}
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
