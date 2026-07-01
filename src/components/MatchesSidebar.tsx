import Link from "next/link";
import { ChevronRight, Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export async function MatchesSidebar({ userId }: { userId: string }) {
  const supabase = await createClient();

  const { data: matches } = await supabase
    .from("matches")
    .select("id, watch_a:watches!matches_watch_a_id_fkey(id,owner_id,brand,model,photos), watch_b:watches!matches_watch_b_id_fkey(id,owner_id,brand,model,photos)")
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(6);

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
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Matchs */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e8e8e8", padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: "#111" }}>Matchs</p>
          <Link href="/matches" style={{ fontSize: 13, color: "#e8445a", textDecoration: "none", fontWeight: 600 }}>Voir tout</Link>
        </div>

        {rows.length === 0 ? (
          <p style={{ fontSize: 13, color: "#aaa" }}>Pas encore de match. Continue à swiper !</p>
        ) : (
          <div style={{ display: "flex", gap: 10, overflowX: "auto" }} className="no-scrollbar">
            {rows.map(m => {
              const other = m.watch_a.owner_id === userId ? m.watch_b : m.watch_a;
              return (
                <Link key={m.id} href={`/messages/${m.id}`} style={{ flexShrink: 0, textDecoration: "none" }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", overflow: "hidden", border: "2.5px solid #e8445a", boxShadow: "0 0 0 2px #fff" }}>
                    {other.photos?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={other.photos[0]} alt={other.brand} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", background: "#f4f4f4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#888" }}>
                        {other.brand[0]}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Likes row */}
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderTop: "1px solid #f0f0f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Heart size={16} fill="#e8445a" color="#e8445a" />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>{likesCount ?? 0} personnes ont liké</span>
          </div>
          <ChevronRight size={16} color="#ccc" />
        </div>
      </div>

      {/* Filtres */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e8e8e8", padding: "20px" }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: "#111", marginBottom: 16 }}>Filtres</p>
        <form method="GET" action="/discover" style={{ display: "flex", flexDirection: "column" }}>
          {[
            { label: "Marque", name: "brand", defaultText: "Toutes" },
            { label: "Modèle", name: "model", defaultText: "Tous" },
            { label: "Année", name: "year", defaultText: "Toutes" },
            { label: "État", name: "condition", defaultText: "Tous" },
            { label: "Localisation", name: "location", defaultText: "Partout" },
          ].map(({ label, name, defaultText }) => (
            <div key={name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 0", borderBottom: "1px solid #f4f4f4" }}>
              <span style={{ fontSize: 14, color: "#333" }}>{label}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14, color: "#aaa" }}>{defaultText}</span>
                <ChevronRight size={14} color="#ccc" />
              </div>
            </div>
          ))}
          <button type="submit" style={{ marginTop: 16, width: "100%", padding: "10px", borderRadius: 10, border: "1px solid #e8e8e8", background: "#f8f8f8", color: "#555", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            Filtres avancés
          </button>
        </form>
      </div>
    </div>
  );
}
