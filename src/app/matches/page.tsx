import Link from "next/link";
import { MessageCircle, Repeat2 } from "lucide-react";
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
  const { data: { user } } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("matches")
    .select("id, created_at, watch_a:watches!matches_watch_a_id_fkey(id,owner_id,brand,model,photos), watch_b:watches!matches_watch_b_id_fkey(id,owner_id,brand,model,photos)")
    .or(`user_a_id.eq.${user!.id},user_b_id.eq.${user!.id}`)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as Row[];

  return (
    <div style={{ minHeight: "100dvh", background: "#f4f4f4" }}>
      <Navbar />
      <main style={{ maxWidth: 680, margin: "0 auto", padding: "36px 32px 60px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111", marginBottom: 4 }}>Mes échanges</h1>
        <p style={{ fontSize: 14, color: "#aaa", marginBottom: 28 }}>
          {rows.length > 0 ? `${rows.length} échange${rows.length > 1 ? "s" : ""} en cours` : "Aucun échange pour le moment"}
        </p>

        {rows.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #e8e8e8", padding: "60px 32px", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#fff0f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Repeat2 size={28} color="#e8445a" />
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#111", marginBottom: 8 }}>Pas encore de match</p>
            <p style={{ fontSize: 14, color: "#aaa", marginBottom: 24 }}>Swipe sur des montres qui t&apos;intéressent.</p>
            <Link href="/discover" style={{ display: "inline-block", background: "#e8445a", color: "#fff", fontWeight: 700, borderRadius: 10, padding: "12px 28px", textDecoration: "none", fontSize: 14 }}>
              Découvrir des montres
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {rows.map(m => {
              const mine = m.watch_a.owner_id === user!.id ? m.watch_a : m.watch_b;
              const theirs = m.watch_a.owner_id === user!.id ? m.watch_b : m.watch_a;
              const date = new Date(m.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
              return (
                <Link key={m.id} href={`/messages/${m.id}`} style={{ textDecoration: "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, background: "#fff", borderRadius: 16, border: "1px solid #e8e8e8", padding: "14px 18px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", transition: "box-shadow 0.15s" }}>
                    {/* Stacked photos */}
                    <div style={{ position: "relative", width: 72, height: 56, flexShrink: 0 }}>
                      <div style={{ position: "absolute", left: 0, top: 0, width: 52, height: 52, borderRadius: 12, overflow: "hidden", border: "2.5px solid #fff", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                        {theirs.photos?.[0]
                          ? <img src={theirs.photos[0]} alt={theirs.brand} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />  // eslint-disable-line @next/next/no-img-element
                          : <div style={{ width: "100%", height: "100%", background: "#f4f4f4" }} />}
                      </div>
                      <div style={{ position: "absolute", left: 22, bottom: 0, width: 52, height: 52, borderRadius: 12, overflow: "hidden", border: "2.5px solid #fff", boxShadow: "0 2px 8px rgba(232,68,90,0.2), 0 0 0 2px rgba(232,68,90,0.2)" }}>
                        {mine.photos?.[0]
                          ? <img src={mine.photos[0]} alt={mine.brand} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />  // eslint-disable-line @next/next/no-img-element
                          : <div style={{ width: "100%", height: "100%", background: "#f4f4f4" }} />}
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: "#111", marginBottom: 2 }}>
                        {theirs.brand} {theirs.model}
                      </p>
                      <p style={{ fontSize: 13, color: "#888" }}>contre {mine.brand} {mine.model}</p>
                      <p style={{ fontSize: 12, color: "#bbb", marginTop: 3 }}>{date}</p>
                    </div>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#fff0f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <MessageCircle size={16} color="#e8445a" />
                    </div>
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
