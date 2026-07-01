import Link from "next/link";
import { Plus } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { createClient, getUser } from "@/lib/supabase/server";
import { CONDITION_LABELS, type Watch } from "@/lib/types";
import { WatchStatusControls } from "@/components/WatchStatusControls";

export default async function MyWatchesPage() {
  const [user, supabase] = await Promise.all([getUser(), createClient()]);

  const { data: watches } = await supabase
    .from("watches").select("*").eq("owner_id", user!.id).order("created_at", { ascending: false });

  const list = (watches ?? []) as unknown as Watch[];

  return (
    <div style={{ minHeight: "100dvh", background: "#08080a" }}>
      <Navbar />
      <main style={{ maxWidth: 560, margin: "0 auto", padding: "24px 16px 100px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em", color: "#f5f3ee" }}>Mes montres</h1>
          <Link href="/watches/new" style={{ display: "flex", alignItems: "center", gap: 6, background: "#c9a84c", color: "#08080a", fontWeight: 700, borderRadius: 50, padding: "10px 18px", textDecoration: "none", fontSize: 13 }}>
            <Plus size={14} /> Ajouter
          </Link>
        </div>

        {list.length === 0 ? (
          <div style={{ borderRadius: 20, background: "#111116", border: "1px solid rgba(255,255,255,0.07)", padding: "48px 24px", textAlign: "center" }}>
            <p style={{ fontSize: 15, color: "#6b6b78" }}>Tu n&apos;as pas encore ajouté de montre.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {list.map(w => (
              <div key={w.id} style={{ display: "flex", gap: 14, background: "#111116", borderRadius: 18, border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
                <div style={{ width: 96, height: 96, flexShrink: 0, position: "relative" }}>
                  {w.photos?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={w.photos[0]} alt={w.brand} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "#1a1a20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#6b6b78" }}>Pas de photo</div>
                  )}
                  <div style={{ position: "absolute", top: 6, left: 6, background: w.status === "available" ? "rgba(34,197,94,0.9)" : "rgba(107,107,120,0.9)", borderRadius: 6, padding: "2px 7px", fontSize: 9, fontWeight: 700, color: "#fff" }}>
                    {w.status === "available" ? "Dispo" : w.status === "paused" ? "Pause" : "Échangée"}
                  </div>
                </div>
                <div style={{ flex: 1, padding: "14px 14px 14px 0", minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#f5f3ee", marginBottom: 2 }}>{w.brand} {w.model}</p>
                  <p style={{ fontSize: 12, color: "#6b6b78", marginBottom: 10 }}>
                    {w.year ? `${w.year} · ` : ""}{CONDITION_LABELS[w.condition]}
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
