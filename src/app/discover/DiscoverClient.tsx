"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { SwipeDeck } from "@/components/SwipeDeck";
import { MatchesSidebarClient } from "@/components/MatchesSidebarClient";
import { DevResetButton } from "@/components/DevResetButton";
import type { Watch } from "@/lib/types";
import Link from "next/link";

interface Props {
  userId: string;
  initialFeed: Watch[];
  hasOwnWatch: boolean;
}

export function DiscoverClient({ userId, initialFeed, hasOwnWatch }: Props) {
  const supabase = createClient();

  // initialData = server-prefetched → renders immediately, no loading state
  const { data: feed = [] } = useQuery({
    queryKey: ["discover", userId],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_discover_feed", {
        viewer: userId,
        batch_size: 15,
        before_cursor: new Date().toISOString(),
        brand_filter: null,
        condition_filter: null,
      });
      return (data ?? []) as Watch[];
    },
    initialData: initialFeed,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div style={{ minHeight: "100dvh", background: "#f4f4f4" }}>
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 32px 60px", display: "grid", gridTemplateColumns: "1fr 300px", gap: 32, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {!hasOwnWatch && (
            <div style={{ marginBottom: 16, width: "100%", maxWidth: 420, borderRadius: 12, padding: "12px 16px", background: "#fff8e1", border: "1px solid #ffe082", fontSize: 13, color: "#795548" }}>
              Ajoute au moins une montre pour matcher.{" "}
              <Link href="/watches/new" style={{ fontWeight: 700, color: "#e8445a", textDecoration: "none" }}>Ajouter →</Link>
            </div>
          )}
          <SwipeDeck initialWatches={feed} />
        </div>
        <aside style={{ position: "sticky", top: 80 }}>
          <MatchesSidebarClient userId={userId} />
        </aside>
      </main>
      <DevResetButton />
    </div>
  );
}
