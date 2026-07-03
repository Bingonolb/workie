import { Navbar } from "@/components/Navbar";
import { getTopCompanies } from "@/lib/actions/scores";
import { Flame, TrendingUp, Users } from "lucide-react";
import { RankingTable } from "./RankingList";
import type { Company } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const companies = (await getTopCompanies(100)) as Company[];

  const totalFlames = companies.reduce((s, c) => s + c.score, 0);
  const avgRating = companies.filter(c => c.avg_rating > 0).reduce((s, c, _, a) => s + c.avg_rating / a.length, 0);

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      <Navbar />
      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "36px 32px 80px" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#10b981", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Mise à jour en temps réel
            </span>
          </div>
          <h1 style={{ fontSize: 34, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 4 }}>
            Classement des entreprises
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-muted)" }}>
            Score calculé sur les flammes, boosts et avis de la communauté Workie.
          </p>
        </div>

        {/* KPI strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 32 }}>
          {[
            { icon: <Users size={16} color="#8b5cf6" />, value: companies.length, label: "Entreprises classées", color: "#8b5cf6" },
            { icon: <Flame size={16} color="#f97316" />, value: totalFlames.toLocaleString("fr-CH"), label: "Flammes totales", color: "#f97316" },
            { icon: <TrendingUp size={16} color="#10b981" />, value: avgRating > 0 ? Number(avgRating).toFixed(2) : "—", label: "Note moyenne", color: "#10b981" },
          ].map(({ icon, value, label, color }) => (
            <div key={label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {icon}
              </div>
              <div>
                <p style={{ fontSize: 20, fontWeight: 900, color: "var(--text)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>{value}</p>
                <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, overflow: "hidden" }}>
          <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
              Top {companies.length} · trié par score
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
              <Flame size={12} color="#f97316" fill="#f97316" />
              Score = flammes + boosts − pénalités
            </div>
          </div>

          {companies.length === 0 ? (
            <div style={{ padding: "80px 24px", textAlign: "center", color: "var(--text-muted)" }}>
              <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Pas encore de données</p>
              <p style={{ fontSize: 13 }}>Explore les entreprises et envoie des flammes pour alimenter le classement.</p>
            </div>
          ) : (
            <RankingTable companies={companies} />
          )}
        </div>
      </main>
    </div>
  );
}
