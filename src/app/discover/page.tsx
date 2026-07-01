import { Navbar } from "@/components/Navbar";
import { SwipeDeck } from "@/components/SwipeDeck";
import { MatchesSidebar } from "@/components/MatchesSidebar";
import { DevResetButton } from "@/components/DevResetButton";
import { createClient, getUser } from "@/lib/supabase/server";
import type { Watch } from "@/lib/types";
import Link from "next/link";

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string; condition?: string }>;
}) {
  const { brand, condition } = await searchParams;
  const [user, supabase] = await Promise.all([getUser(), createClient()]);

  const [{ count: myWatchesCount }, { data: feed }] = await Promise.all([
    supabase.from("watches").select("id", { count: "exact", head: true }).eq("owner_id", user!.id),
    supabase.rpc("get_discover_feed", {
      viewer: user!.id,
      batch_size: 15,
      before_cursor: new Date().toISOString(),
      brand_filter: brand || null,
      condition_filter: condition || null,
    }),
  ]);

  return (
    <div style={{ minHeight: "100dvh", background: "#f4f4f4" }}>
      <Navbar />
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 32px 60px", display: "grid", gridTemplateColumns: "1fr 300px", gap: 32, alignItems: "start" }}>

        {/* Left — card + buttons */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {!myWatchesCount && (
            <div style={{ marginBottom: 16, width: "100%", maxWidth: 420, borderRadius: 12, padding: "12px 16px", background: "#fff8e1", border: "1px solid #ffe082", fontSize: 13, color: "#795548" }}>
              Ajoute au moins une montre pour matcher.{" "}
              <Link href="/watches/new" style={{ fontWeight: 700, color: "#e8445a", textDecoration: "none" }}>Ajouter →</Link>
            </div>
          )}
          <SwipeDeck initialWatches={(feed ?? []) as Watch[]} filters={{ brand, condition }} />
        </div>

        {/* Right sidebar */}
        <aside style={{ position: "sticky", top: 80 }}>
          <MatchesSidebar userId={user!.id} />
        </aside>
      </main>
      <DevResetButton />
    </div>
  );
}
