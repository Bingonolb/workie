import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import { CONDITION_LABELS, type Watch } from "@/lib/types";
import { WatchStatusControls } from "@/components/WatchStatusControls";

export default async function MyWatchesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: watches } = await supabase
    .from("watches")
    .select("*")
    .eq("owner_id", user!.id)
    .order("created_at", { ascending: false });

  const list = (watches ?? []) as unknown as Watch[];

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Mes montres</h1>
          <Link
            href="/watches/new"
            className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            + Ajouter
          </Link>
        </div>

        {list.length === 0 ? (
          <p className="rounded-2xl bg-white p-8 text-center text-neutral-500 shadow-sm">
            Tu n&apos;as pas encore ajouté de montre.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((w) => (
              <div key={w.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="relative h-48 w-full bg-neutral-100">
                  {w.photos?.[0] ? (
                    <Image src={w.photos[0]} alt={w.brand} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-neutral-400">
                      Pas de photo
                    </div>
                  )}
                  <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
                    {w.status === "available"
                      ? "Disponible"
                      : w.status === "paused"
                      ? "En pause"
                      : "Échangée"}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold">
                    {w.brand} {w.model}
                  </h3>
                  <p className="text-sm text-neutral-500">
                    {w.year ? `${w.year} · ` : ""}
                    {CONDITION_LABELS[w.condition]}
                  </p>
                  <WatchStatusControls watchId={w.id} status={w.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
