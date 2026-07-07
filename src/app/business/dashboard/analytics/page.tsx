import { getBusinessAnalytics } from "@/lib/actions/business";
import { TrendingUp, Users, Star, ThumbsUp } from "lucide-react";

export default async function AnalyticsPage() {
  const data = await getBusinessAnalytics();

  if ("error" in data && data.error) {
    return <div style={{ padding: 40, color: "#ef4444" }}>{data.error}</div>;
  }

  const { count, avgOverall, avgManagement, avgWorklife, avgCulture, avgCareer, recommendRate, avgSalary, trend, dist, workModes, empTypes } = data as Awaited<ReturnType<typeof getBusinessAnalytics>>;

  const maxDist = Math.max(...(dist?.map((d: { count: number }) => d.count) ?? [1]), 1);

  const categoryData = [
    { label: "Note globale", value: avgOverall, icon: "⭐", color: "#f59e0b" },
    { label: "Management", value: avgManagement, icon: "👔", color: "#8b5cf6" },
    { label: "Vie pro/perso", value: avgWorklife, icon: "⚖️", color: "#10b981" },
    { label: "Culture & ambiance", value: avgCulture, icon: "🌍", color: "#06b6d4" },
    { label: "Évolution de carrière", value: avgCareer, icon: "🚀", color: "#f97316" },
  ];

  return (
    <div style={{ padding: "36px 40px", maxWidth: 1000 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.03em", color: "var(--text)", marginBottom: 6 }}>Analytics</h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Analyse détaillée de votre réputation employeur et des tendances de vos équipes.</p>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
        {[
          { icon: <Star size={18} color="#f59e0b" fill="#f59e0b" />, label: "Note globale", value: `${avgOverall}/5` },
          { icon: <Users size={18} color="#8b5cf6" />, label: "Total avis", value: String(count) },
          { icon: <ThumbsUp size={18} color="#10b981" />, label: "Taux de recommandation", value: recommendRate !== null ? `${recommendRate}%` : "–" },
          { icon: <TrendingUp size={18} color="#f97316" />, label: "Salaire moyen", value: avgSalary ? `${Math.round(avgSalary / 1000)}k CHF` : "–" },
        ].map(({ icon, label, value }) => (
          <div key={label} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              {icon}
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>{label}</span>
            </div>
            <p style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.03em", color: "var(--text)" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Notes by category */}
      <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px", marginBottom: 20 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 20 }}>Notes par dimension</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {categoryData.map(({ label, value, icon, color }) => {
            const num = parseFloat(String(value));
            const pct = isNaN(num) ? 0 : (num / 5) * 100;
            return (
              <div key={label}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 14, color: "var(--text)", fontWeight: 600 }}>{icon} {label}</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color }}>{isNaN(num) ? "–" : num.toFixed(1)}<span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)" }}>/5</span></span>
                </div>
                <div style={{ height: 8, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Distribution */}
        <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px" }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 18 }}>Distribution des notes</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[5, 4, 3, 2, 1].map(star => {
              const item = dist?.find((d: { star: number }) => d.star === star);
              const cnt = item?.count ?? 0;
              const pct = maxDist > 0 ? (cnt / maxDist) * 100 : 0;
              const totalPct = (count ?? 0) > 0 ? Math.round((cnt / (count ?? 1)) * 100) : 0;
              return (
                <div key={star} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", width: 20, textAlign: "right" }}>{star}★</span>
                  <div style={{ flex: 1, height: 10, background: "var(--border)", borderRadius: 5, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: "#f59e0b", borderRadius: 5 }} />
                  </div>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", width: 32, textAlign: "right" }}>{totalPct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Work mode */}
        <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px" }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 18 }}>Mode de travail déclaré</p>
          {Object.keys(workModes ?? {}).length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Pas encore de données</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {Object.entries(workModes ?? {}).map(([mode, cnt]) => {
                const total = Object.values(workModes ?? {}).reduce((a: number, b) => a + (b as number), 0);
                const pct = total > 0 ? Math.round(((cnt as number) / total) * 100) : 0;
                const modeLabel = mode === "présentiel" ? "🏢 Présentiel" : mode === "hybride" ? "🔀 Hybride" : "🏠 Remote";
                return (
                  <div key={mode}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{modeLabel}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{pct}%</span>
                    </div>
                    <div style={{ height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: "#8b5cf6", borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginTop: 24, marginBottom: 14 }}>Types de contrats</p>
          {Object.keys(empTypes ?? {}).length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Pas encore de données</p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {Object.entries(empTypes ?? {}).map(([type, cnt]) => (
                <span key={type} style={{ fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 50, background: "var(--surface)", border: "1px solid var(--border2)", color: "var(--text-muted)" }}>
                  {type.toUpperCase()} · {String(cnt)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Trend chart */}
      {trend && trend.length > 1 && (
        <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px" }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 24 }}>Évolution mensuelle de la note</p>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 100 }}>
            {trend.map(({ month, avg: a }) => {
              const h = Math.max(8, (a / 5) * 100);
              const color = a >= 4 ? "#10b981" : a >= 3 ? "#f59e0b" : "#ef4444";
              return (
                <div key={month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color }}>{a}</span>
                  <div title={`${month}: ${a}/5`} style={{ width: "100%", height: h, background: color, borderRadius: "4px 4px 0 0", opacity: 0.85, cursor: "default" }} />
                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{month.slice(5)}/{month.slice(2, 4)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {count === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
          <TrendingUp size={48} style={{ opacity: 0.2, margin: "0 auto 20px" }} />
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Analytics disponibles dès les premiers avis</p>
          <p style={{ fontSize: 14 }}>Partagez votre fiche Workie en interne pour commencer à collecter des données.</p>
        </div>
      )}
    </div>
  );
}
