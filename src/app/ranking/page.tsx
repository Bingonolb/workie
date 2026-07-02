import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { getTopCompanies } from "@/lib/actions/scores";
import { Star, Flame, MapPin, TrendingUp } from "lucide-react";
import { SECTOR_COLORS } from "@/lib/types";

export const revalidate = 60;

export default async function RankingPage() {
  const companies = await getTopCompanies(100);

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <Navbar />
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "36px 32px 80px" }}>
        {/* Header */}
        <div style={{ marginBottom: 36, textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.25)", borderRadius: 50, padding: "6px 18px", marginBottom: 16 }}>
            <Flame size={14} color="#f97316" fill="#f97316" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#f97316" }}>Classement en temps réel</span>
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 8 }}>
            Top 100 🔥
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-muted)" }}>
            Classé par flammes reçues de la communauté Workie
          </p>
        </div>

        {/* Podium top 3 */}
        {companies.length >= 3 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 32 }}>
            {[
              { c: companies[1], rank: 2, height: 100, color: "#9ca3af" },
              { c: companies[0], rank: 1, height: 130, color: "#f97316" },
              { c: companies[2], rank: 3, height: 80, color: "#b45309" },
            ].map(({ c, rank, height, color }) => {
              const sectorColor = SECTOR_COLORS[c.sector] ?? "#8b5cf6";
              return (
                <Link key={c.id} href={`/company/${c.id}`} style={{ textDecoration: "none" }}>
                  <div style={{ background: "var(--surface)", border: `1px solid ${color}44`, borderRadius: 20, padding: "20px 16px", textAlign: "center", transition: "transform 0.2s" }}
                    onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-4px)")}
                    onMouseLeave={e => (e.currentTarget.style.transform = "")}
                  >
                    <div style={{ fontSize: rank === 1 ? 36 : 28, marginBottom: 8 }}>
                      {rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 4, lineHeight: 1.2 }}>{c.name}</p>
                    <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 50, background: `${sectorColor}22`, color: sectorColor, fontWeight: 600 }}>{c.sector}</span>
                    <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                      <Flame size={16} fill={color} color={color} />
                      <span style={{ fontSize: 18, fontWeight: 900, color }}>{c.score}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Full list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {companies.map((c, i) => {
            const sectorColor = SECTOR_COLORS[c.sector] ?? "#8b5cf6";
            const isTop3 = i < 3;
            const rankColor = i === 0 ? "#f97316" : i === 1 ? "#9ca3af" : i === 2 ? "#b45309" : "var(--text-muted)";
            return (
              <Link key={c.id} href={`/company/${c.id}`} style={{ textDecoration: "none" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 16,
                  background: isTop3 ? "var(--surface)" : "var(--surface)",
                  border: isTop3 ? `1px solid ${rankColor}33` : "1px solid var(--border)",
                  borderRadius: 14, padding: "14px 18px",
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateX(4px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.3)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
                >
                  {/* Rank */}
                  <div style={{ width: 36, textAlign: "center", flexShrink: 0 }}>
                    {i < 3 ? (
                      <span style={{ fontSize: 20 }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                    ) : (
                      <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-muted)" }}>#{i + 1}</span>
                    )}
                  </div>

                  {/* Cover thumb */}
                  <div style={{ width: 44, height: 44, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: `linear-gradient(135deg, ${sectorColor}, #f97316)` }}>
                    {c.cover_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</p>
                      {c.is_verified && <span style={{ fontSize: 11, color: "#10b981" }}>✓</span>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 50, background: `${sectorColor}22`, color: sectorColor, fontWeight: 600 }}>{c.sector}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12, color: "var(--text-muted)" }}>
                        <MapPin size={11} /> {c.city}
                      </span>
                      {c.avg_rating > 0 && (
                        <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12, color: "#f59e0b" }}>
                          <Star size={11} fill="#f59e0b" /> {Number(c.avg_rating).toFixed(1)}
                        </span>
                      )}
                      {c.avg_salary_chf && (
                        <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12, color: "#10b981" }}>
                          <TrendingUp size={11} /> CHF {Math.round(c.avg_salary_chf / 1000)}k
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Score */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <Flame size={18} fill={i < 3 ? rankColor : "rgba(249,115,22,0.4)"} color={i < 3 ? rankColor : "rgba(249,115,22,0.4)"} />
                    <span style={{ fontSize: 18, fontWeight: 900, color: i < 3 ? rankColor : "var(--text)" }}>{c.score}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {companies.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)" }}>
            <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Pas encore de classement</p>
            <p style={{ fontSize: 14 }}>Explore les entreprises et envoie des flammes !</p>
            <Link href="/explore?view=swipe" style={{ display: "inline-block", marginTop: 20, padding: "12px 28px", borderRadius: 50, background: "linear-gradient(135deg, #8b5cf6, #f97316)", color: "#fff", fontWeight: 700, textDecoration: "none", fontSize: 14 }}>
              Explorer en mode Swipe
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
