import { getBusinessAnalytics } from "@/lib/actions/business";
import { TrendingUp, Users, Star, ThumbsUp, Eye, BarChart2 } from "lucide-react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/Navbar";

function Bar({ pct, color, label, value }: { pct: number; color: string; label: string; value: string }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{value}</span>
      </div>
      <div style={{ height: 7, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 0.6s" }} />
      </div>
    </div>
  );
}

const SENIORITY_ORDER = ["C-Level / VP", "Directeur", "Senior / Lead", "Intermédiaire", "Junior / Stagiaire"];
const SENIORITY_COLOR: Record<string, string> = {
  "C-Level / VP":    "#ec4899",
  "Directeur":       "#f97316",
  "Senior / Lead":   "#8b5cf6",
  "Intermédiaire":   "#06b6d4",
  "Junior / Stagiaire": "#10b981",
};
const FUNCTION_COLOR = "#8b5cf6";

export default async function AnalyticsPage() {
  const data = await getBusinessAnalytics();

  if ("error" in data && data.error) {
    return (
      <div className="page-root">
        <Navbar />
        <div className="biz-page" style={{ color: "#ef4444" }}>{data.error}</div>
      </div>
    );
  }

  const {
    count, avgOverall, avgManagement, avgWorklife, avgCulture, avgCareer,
    recommendRate, avgSalary, trend, dist, workModes, empTypes,
    seniority, functions, currentVsFormer,
    viewsToday, viewsWeek, viewsMonth, viewsTotal, viewTrend,
  } = data as Awaited<ReturnType<typeof getBusinessAnalytics>> & {
    seniority: Record<string, number>;
    functions: Record<string, number>;
    currentVsFormer: { current: number; former: number };
    viewsToday: number; viewsWeek: number; viewsMonth: number; viewsTotal: number;
    viewTrend: { day: string; count: number }[];
  };

  const maxDist = Math.max(...(dist?.map((d: { count: number }) => d.count) ?? [1]), 1);
  const maxViewDay = Math.max(...(viewTrend?.map(v => v.count) ?? [1]), 1);
  const totalSeniority = Object.values(seniority ?? {}).reduce((a, b) => a + b, 0);
  const totalFunctions = Object.values(functions ?? {}).reduce((a, b) => a + b, 0);

  const categoryData = [
    { label: "Note globale", value: avgOverall, icon: "⭐", color: "#f59e0b" },
    { label: "Management", value: avgManagement, icon: "👔", color: "#8b5cf6" },
    { label: "Vie pro/perso", value: avgWorklife, icon: "⚖️", color: "#10b981" },
    { label: "Culture & ambiance", value: avgCulture, icon: "🌍", color: "#06b6d4" },
    { label: "Évolution de carrière", value: avgCareer, icon: "🚀", color: "#f97316" },
  ];

  return (
    <div className="page-root">
      <Navbar />
      <div className="biz-page" style={{ maxWidth: 1000 }}>
        <Link href="/business/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)", textDecoration: "none", marginBottom: 16 }}>
          <ArrowLeft size={14} /> Dashboard
        </Link>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.03em", color: "var(--text)", marginBottom: 6 }}>Analytics</h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Vues, réputation et profil des personnes qui interagissent avec votre fiche.</p>
        </div>

        {/* ── Section 1 : Vues de la fiche ── */}
        <div style={{ marginBottom: 10 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <Eye size={13} /> Vues de la fiche
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Aujourd'hui", value: viewsToday, color: "#10b981" },
            { label: "7 derniers jours", value: viewsWeek, color: "#8b5cf6" },
            { label: "30 derniers jours", value: viewsMonth, color: "#f97316" },
            { label: "Total (90j)", value: viewsTotal, color: "#06b6d4" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 18px" }}>
              <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginBottom: 8 }}>{label}</p>
              <p style={{ fontSize: 30, fontWeight: 900, color, letterSpacing: "-0.03em" }}>{value.toLocaleString("fr-CH")}</p>
            </div>
          ))}
        </div>

        {/* Daily view trend */}
        {viewTrend && viewTrend.length > 0 && (
          <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 24px", marginBottom: 28 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 20 }}>Vues par jour — 30 derniers jours</p>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 80 }}>
              {viewTrend.map(({ day, count: cnt }) => {
                const h = maxViewDay > 0 ? Math.max(2, (cnt / maxViewDay) * 80) : 2;
                const isToday = day === new Date().toISOString().slice(0, 10);
                return (
                  <div key={day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                    {cnt > 0 && <span style={{ fontSize: 8, color: "var(--text-muted)", lineHeight: 1 }}>{cnt}</span>}
                    <div
                      title={`${day} : ${cnt} vue${cnt !== 1 ? "s" : ""}`}
                      style={{
                        width: "100%", height: h, borderRadius: "3px 3px 0 0",
                        background: isToday ? "#10b981" : cnt > 0 ? "#8b5cf6" : "var(--border)",
                        opacity: isToday ? 1 : cnt > 0 ? 0.75 : 0.3,
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10, color: "var(--text-muted)" }}>
              <span>{viewTrend[0]?.day.slice(5).replace("-", "/")}</span>
              <span style={{ color: "#10b981", fontWeight: 700 }}>Aujourd'hui</span>
            </div>
          </div>
        )}

        {/* ── Section 2 : Profil des visiteurs ── */}
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
          <Users size={13} /> Profil des personnes qui ont laissé un avis
        </p>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 18, background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.12)", borderRadius: 10, padding: "9px 14px" }}>
          Ces données sont basées sur les <strong style={{ color: "var(--text)" }}>{count} avis</strong> reçus et les postes déclarés par les employés. Elles reflètent qui travaille ou a travaillé dans votre entreprise.
        </p>

        {count === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)", marginBottom: 28 }}>
            <p style={{ fontSize: 14 }}>Les profils apparaîtront dès les premiers avis.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
            {/* Seniority */}
            <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 24px" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 18 }}>Niveau hiérarchique</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {SENIORITY_ORDER.filter(s => (seniority ?? {})[s]).map(s => {
                  const cnt = (seniority ?? {})[s] ?? 0;
                  const pct = totalSeniority > 0 ? Math.round((cnt / totalSeniority) * 100) : 0;
                  return (
                    <Bar key={s} label={s} value={`${pct}% (${cnt})`} pct={pct} color={SENIORITY_COLOR[s] ?? "#8b5cf6"} />
                  );
                })}
              </div>
            </div>

            {/* Function */}
            <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 24px" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 18 }}>Fonction</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {Object.entries(functions ?? {})
                  .sort(([, a], [, b]) => b - a)
                  .map(([fn, cnt]) => {
                    const pct = totalFunctions > 0 ? Math.round((cnt / totalFunctions) * 100) : 0;
                    return (
                      <Bar key={fn} label={fn} value={`${pct}% (${cnt})`} pct={pct} color={FUNCTION_COLOR} />
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Employé actuel vs ancien */}
        {count > 0 && (
          <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 24px", marginBottom: 28 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>Employé actuel vs. ancien employé</p>
            <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
              {[
                { label: "Employés actuels", cnt: currentVsFormer.current, color: "#10b981" },
                { label: "Anciens employés", cnt: currentVsFormer.former, color: "#6b7280" },
              ].map(({ label, cnt, color }) => {
                const pct = count > 0 ? Math.round((cnt / count) * 100) : 0;
                return (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{label}</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color }}>{pct}%</span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>({cnt})</span>
                  </div>
                );
              })}
              {/* Visual bar */}
              <div style={{ flex: 1, minWidth: 120, height: 10, borderRadius: 50, background: "#6b7280", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${count > 0 ? Math.round((currentVsFormer.current / count) * 100) : 0}%`, background: "#10b981", borderRadius: 50 }} />
              </div>
            </div>
          </div>
        )}

        {/* ── Section 3 : Réputation ── */}
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
          <Star size={13} /> Réputation employeur
        </p>

        {/* KPI row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 20 }}>
          {[
            { icon: <Star size={18} color="#f59e0b" fill="#f59e0b" />, label: "Note globale", value: `${avgOverall}/5` },
            { icon: <Users size={18} color="#8b5cf6" />, label: "Total avis", value: String(count) },
            { icon: <ThumbsUp size={18} color="#10b981" />, label: "Recommandent", value: recommendRate !== null ? `${recommendRate}%` : "–" },
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
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 20 }}>Notes par dimension</p>
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
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 18 }}>Distribution des notes</p>
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

          {/* Work mode + contracts */}
          <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>Mode de travail</p>
            {Object.keys(workModes ?? {}).length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Pas encore de données</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                {Object.entries(workModes ?? {}).map(([mode, cnt]) => {
                  const total = Object.values(workModes ?? {}).reduce((a: number, b) => a + (b as number), 0);
                  const pct = total > 0 ? Math.round(((cnt as number) / total) * 100) : 0;
                  const modeLabel = mode === "présentiel" ? "🏢 Présentiel" : mode === "hybride" ? "🔀 Hybride" : "🏠 Remote";
                  return <Bar key={mode} label={modeLabel} value={`${pct}%`} pct={pct} color="#8b5cf6" />;
                })}
              </div>
            )}
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>Types de contrats</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {Object.entries(empTypes ?? {}).map(([type, cnt]) => (
                <span key={type} style={{ fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 50, background: "var(--surface)", border: "1px solid var(--border2)", color: "var(--text-muted)" }}>
                  {type.toUpperCase()} · {String(cnt)}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Rating trend */}
        {trend && trend.length > 1 && (
          <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 24 }}>Évolution mensuelle de la note</p>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 100 }}>
              {trend.map(({ month, avg: a }) => {
                const h = Math.max(8, (a / 5) * 100);
                const color = a >= 4 ? "#10b981" : a >= 3 ? "#f59e0b" : "#ef4444";
                return (
                  <div key={month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color }}>{a}</span>
                    <div title={`${month}: ${a}/5`} style={{ width: "100%", height: h, background: color, borderRadius: "4px 4px 0 0", opacity: 0.85 }} />
                    <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{month.slice(5)}/{month.slice(2, 4)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {count === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
            <BarChart2 size={48} style={{ opacity: 0.2, margin: "0 auto 20px" }} />
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Analytics disponibles dès les premiers avis</p>
            <p style={{ fontSize: 14 }}>Partagez votre fiche Workie en interne pour commencer à collecter des données.</p>
          </div>
        )}
      </div>
    </div>
  );
}
