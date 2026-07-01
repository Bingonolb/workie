import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { SwipeDeck } from "@/components/SwipeDeck";
import { DevResetButton } from "@/components/DevResetButton";
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
  const { data: { user } } = await supabase.auth.getUser();

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
  const brands = ((brandsData ?? []) as { brand: string }[]).map(b => b.brand);

  return (
    <div style={{ minHeight: "100dvh", background: "#08080a" }}>
      <Navbar />
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 32px", display: "grid", gridTemplateColumns: "280px 1fr 280px", gap: 32, alignItems: "start" }}>

        {/* Left sidebar — Filters */}
        <aside>
          <div style={{ background: "#111116", borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)", padding: "20px", position: "sticky", top: 80 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#6b6b78", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Filtres</p>

            <form method="GET" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: "#6b6b78", display: "block", marginBottom: 6 }}>Marque</label>
                <select name="brand" defaultValue={brand ?? ""} style={{ width: "100%", background: "#1a1a20", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#f5f3ee", fontSize: 13, padding: "8px 10px", outline: "none" }}>
                  <option value="">Toutes les marques</option>
                  {brands.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, color: "#6b6b78", display: "block", marginBottom: 6 }}>État</label>
                <select name="condition" defaultValue={condition ?? ""} style={{ width: "100%", background: "#1a1a20", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#f5f3ee", fontSize: 13, padding: "8px 10px", outline: "none" }}>
                  <option value="">Tous les états</option>
                  <option value="new">Neuf</option>
                  <option value="excellent">Excellent</option>
                  <option value="very_good">Très bon</option>
                  <option value="good">Bon</option>
                  <option value="fair">Correct</option>
                </select>
              </div>

              <button type="submit" style={{ background: "#c9a84c", color: "#08080a", fontWeight: 700, borderRadius: 8, padding: "9px", fontSize: 13, border: "none", cursor: "pointer", width: "100%" }}>
                Appliquer
              </button>
              {(brand || condition) && (
                <Link href="/discover" style={{ textAlign: "center", fontSize: 12, color: "#6b6b78", textDecoration: "none" }}>
                  Effacer les filtres
                </Link>
              )}
            </form>

            {!myWatchesCount && (
              <div style={{ marginTop: 20, padding: "12px", background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 10, fontSize: 12, color: "#c9a84c" }}>
                Ajoute une montre pour pouvoir matcher.{" "}
                <Link href="/watches/new" style={{ fontWeight: 700, textDecoration: "underline", color: "#c9a84c" }}>→</Link>
              </div>
            )}
          </div>
        </aside>

        {/* Center — Swipe deck */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <SwipeDeck initialWatches={(feed ?? []) as Watch[]} filters={{ brand, condition }} />
        </div>

        {/* Right sidebar — Matches */}
        <aside style={{ position: "sticky", top: 80 }}>
          <MatchesSidebar userId={user!.id} />
        </aside>
      </main>
      <DevResetButton />
    </div>
  );
}
