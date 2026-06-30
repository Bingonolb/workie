import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export async function MatchesSidebar({ userId }: { userId: string }) {
  const supabase = await createClient();

  const { data: matches } = await supabase
    .from("matches")
    .select("id, watch_a:watches!matches_watch_a_id_fkey(*), watch_b:watches!matches_watch_b_id_fkey(*)")
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(8);

  const { count: likesCount } = await supabase
    .from("swipes")
    .select("id, target_watch_id, watches!inner(owner_id)", { count: "exact", head: true })
    .eq("watches.owner_id", userId)
    .in("direction", ["like", "superlike"]);

  type Row = {
    id: string;
    watch_a: { id: string; owner_id: string; photos: string[] };
    watch_b: { id: string; owner_id: string; photos: string[] };
  };
  const rows = (matches ?? []) as unknown as Row[];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Matchs</h3>
          <Link href="/matches" className="text-xs font-medium text-brand">
            Voir tout
          </Link>
        </div>
        {rows.length === 0 ? (
          <p className="text-sm text-neutral-400">Pas encore de match. Continue à swiper !</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            {rows.map((m) => {
              const otherWatch = m.watch_a.owner_id === userId ? m.watch_b : m.watch_a;
              return (
                <Link
                  key={m.id}
                  href={`/messages/${m.id}`}
                  className="h-14 w-14 shrink-0 overflow-hidden rounded-full ring-2 ring-brand"
                >
                  {otherWatch.photos?.[0] && (
                    <Image
                      src={otherWatch.photos[0]}
                      alt="match"
                      width={56}
                      height={56}
                      className="h-full w-full object-cover"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <p className="text-2xl font-bold">{likesCount ?? 0}</p>
        <p className="text-sm text-neutral-500">personnes ont liké tes montres</p>
      </div>
    </div>
  );
}
