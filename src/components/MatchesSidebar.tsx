import Link from "next/link";
import { Heart } from "lucide-react";
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
    watch_a: { id: string; owner_id: string; brand: string; model: string; photos: string[] };
    watch_b: { id: string; owner_id: string; brand: string; model: string; photos: string[] };
  };
  const rows = (matches ?? []) as unknown as Row[];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Likes counter */}
      <div style={{ background: "#111116", borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(201,168,76,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Heart size={18} color="#c9a84c" fill="#c9a84c" />
        </div>
        <div>
          <p style={{ fontSize: 22, fontWeight: 800, color: "#c9a84c", lineHeight: 1 }}>{likesCount ?? 0}</p>
          <p style={{ fontSize: 12, color: "#6b6b78", marginTop: 2 }}>likes sur tes montres</p>
        </div>
      </div>

      {/* Recent matches */}
      <div style={{ background: "#111116", borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)", padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#f5f3ee" }}>Échanges récents</p>
          <Link href="/matches" style={{ fontSize: 11, color: "#c9a84c", textDecoration: "none", fontWeight: 600 }}>Voir tout →</Link>
        </div>

        {rows.length === 0 ? (
          <p style={{ fontSize: 13, color: "#6b6b78" }}>Pas encore de match. Continue à swiper !</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {rows.map(m => {
              const other = m.watch_a.owner_id === userId ? m.watch_b : m.watch_a;
              const mine = m.watch_a.owner_id === userId ? m.watch_a : m.watch_b;
              return (
                <Link key={m.id} href={`/messages/${m.id}`} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
                  <div style={{ position: "relative", width: 44, height: 44, flexShrink: 0 }}>
                    <div style={{ position: "absolute", left: 0, top: 0, width: 34, height: 34, borderRadius: 8, overflow: "hidden", border: "1.5px solid #08080a" }}>
                      {other.photos?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={other.photos[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      ) : <div style={{ width: "100%", height: "100%", background: "#1a1a20" }} />}
                    </div>
                    <div style={{ position: "absolute", right: 0, bottom: 0, width: 34, height: 34, borderRadius: 8, overflow: "hidden", border: "1.5px solid #08080a", boxShadow: "0 0 0 1.5px rgba(201,168,76,0.4)" }}>
                      {mine.photos?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={mine.photos[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      ) : <div style={{ width: "100%", height: "100%", background: "#1a1a20" }} />}
                    </div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#f5f3ee", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {other.brand} {other.model}
                    </p>
                    <p style={{ fontSize: 11, color: "#6b6b78" }}>↔ {mine.brand} {mine.model}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
