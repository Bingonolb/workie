import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { SwipeDeck } from "@/components/SwipeDeck";
import { FiltersSidebar } from "@/components/FiltersSidebar";
import { MatchesSidebar } from "@/components/MatchesSidebar";
import { createClient } from "@/lib/supabase/server";
import type { Watch } from "@/lib/types";

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string; condition?: string }>;
}) {
  const { brand, condition } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { count: myWatchesCount } = await supabase
    .from("watches")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user!.id);

  const { data: feed } = await supabase.rpc("get_discover_feed", {
    viewer: user!.id,
    batch_size: 15,
    before_cursor: new Date().toISOString(),
    brand_filter: brand || null,
    condition_filter: condition || null,
  });

  const { data: brandsData } = await supabase.rpc("list_distinct_brands");
  const brands = ((brandsData ?? []) as { brand: string }[]).map((b) => b.brand);

  return (
    <div className="min-h-screen bg-neutral-100">
      <Navbar />
      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-[1fr_320px]">
        <div>
          {!myWatchesCount ? (
            <div className="mb-6 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
              Ajoute au moins une montre pour pouvoir matcher avec d&apos;autres collectionneurs.{" "}
              <Link href="/watches/new" className="font-semibold underline">
                Ajouter ma première montre
              </Link>
            </div>
          ) : null}
          <SwipeDeck
            initialWatches={(feed ?? []) as Watch[]}
            filters={{ brand, condition }}
          />
        </div>
        <aside className="space-y-6">
          <FiltersSidebar brands={brands} selectedBrand={brand} selectedCondition={condition} />
          <MatchesSidebar userId={user!.id} />
        </aside>
      </main>
    </div>
  );
}
