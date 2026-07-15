import { getBusinessAnalytics } from "@/lib/actions/business";
import { Star, ThumbsUp, Eye, BarChart2, ArrowLeft, Heart, MessageSquare, TrendingUp, Users } from "lucide-react";
import Link from "next/link";

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
  "C-Level / VP":       "#ec4899",
  "Directeur":          "#f97316",
  "Senior / Lead":      "#8b5cf6",
  "Intermédiaire":      "#06b6d4",
  "Junior / Stagiaire": "#10b981",
};

export default async function AnalyticsPage() {
  const data = await getBusinessAnalytics();

  if ("error" in data && data.error) {
    return <div className="biz-page" style={{ color: "#ef4444" }}>{data.error}</div>;
  }

  const {
    count, avgOverall, avgManagement, avgWorklife, avgCulture, avgCareer,
    recommendRate, avgSalary, trend, dist, workModes, empTypes,
    seniority, functions, currentVsFormer,
    viewsToday, viewsWeek, viewsMonth, viewsTotal, viewTrend, favoritesCount,
  } = data as Awaited<ReturnType<typeof getBusinessAnalytics>> & {
    seniority: Record<string, number>;
    functions: Record<string, number>;
    currentVsFormer: { current: number; former: number };
    viewsToday: number; viewsWeek: number; viewsMonth: number; viewsTotal: number;
    viewTrend: { day: string; count: number }[];
    favoritesCount: number;
  };

  const maxDist = Math.max(...(dist?.map((d: { count: number }) => Number(d.count)) ?? [1]), 1);
  const maxViewDay = Math.max(...(viewTrend?.map(v => Number(v.count)) ?? [1]), 1);
  const totalSeniority = Object.values(seniority ?? {}).reduce((a, b) => a + b, 0);
  const totalFunctions = Object.values(functions ?? {}).reduce((a, b) => a + b, 0);

  return (
    <div className="biz-page" style={{ maxWidth: 1000 }}>
      <Link href="/business/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)", textDecoration: "none", marginBottom: 16 }}>
        <ArrowLeft size={14} /> Dashboard
      </Link>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.03em", color: "var(--text)", marginBottom: 6 }}>Analytics</h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Vue complète de la performance et de la réputation de votre fiche.</p>
      </div>

      {/* ── Section 1 : Engagement (toujours visible) ── */}
      <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
        <Eye size={13} /> Engagement de la fiche
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Vues aujourd'hui", value: viewsToday, color: "#10b981", icon: <Eye size={16} /> },
          { label: "Vues 7 jours", value: viewsWeek, color: "#8b5cf6", icon: <Eye size={16} /> },
          { label: "Vues 30 jours", value: viewsMonth, color: "#f97316", icon: <Eye size={16} /> },
          { label: "Vues totales (90j)", value: viewsTotal, color: "#06b6d4", icon: <Eye size={16} /> },
          { label: "En favoris", value: favoritesCount, color: "#ec4899", icon: <Heart size={16} /> },
          { label: "Avis reçus", value: count, color: "#f59e0b", icon: <MessageSquare size={16} /> },
        ].map(({ label, value, color, icon }) => (
          <div key={label} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, color }}>
              {icon}
              <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>{label}</span>
            </div>
            <p style={{ fontSize: 28, fontWeight: 900, color, letterSpacing: "-0.03em" }}>{((value ?? 0) as number).toLocaleString("fr-CH")}</p>
          </div>
        ))}
      </div>

      {/* Daily view trend */}
      {viewTrend && viewTrend.length > 0 && (
        <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 24px", marginBottom: 28 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 20 }}>Vues par jour — 30 derniers jours</p>
          <div className="scroll-x" style={{ margin: "0 -4px" }}>
            <div style={{ minWidth: 560, padding: "0 4px" }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 72 }}>
                {viewTrend.map(({ day, count: cnt }) => {
                  const n = Number(cnt);
                  const h = maxViewDay > 0 ? Math.max(2, (n / maxViewDay) * 72) : 2;
                  const isToday = day === new Date().toISOString().slice(0, 10);
                  return (
                    <div key={day} style={{ flex: 1, minWidth: 12, height: h, borderRadius: "3px 3px 0 0",
                      background: isToday ? "#10b981" : n > 0 ? "#8b5cf6" : "var(--border)",
                      opacity: isToday ? 1 : n > 0 ? 0.75 : 0.3,
                    }} title={`${day} : ${n} vue${n !== 1 ? "s" : ""}`} />
                  );
                })}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10, color: "var(--text-muted)" }}>
                <span>{viewTrend[0]?.day.slice(5).replace("-", "/")}</span>
                <span style={{ color: "#10b981", fontWeight: 700 }}>Aujourd'hui</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Section 2 : Réputation ── */}
      <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
        <Star size={13} /> Réputation employeur
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { icon: <Star size={18} color="#f59e0b" fill="#f59e0b" />, label: "Note globale", value: avgOverall !== "–" ? `${avgOverall}/5` : "–" },
          { icon: <Users size={18} color="#8b5cf6" />, label: "Total avis", value: String(count) },
          { icon: <ThumbsUp size={18} color="#10b981" />, label: "Recommandent", value: recommendRate !== null ? `${recommendRate}%` : "–" },
          { icon: <TrendingUp size={18} color="#f97316" />, label: "Salaire moyen", value: Number(avgSalary) > 0 ? `${Math.round(Number(avgSalary) / 1000)}k CHF` : "–" },
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

      {Number(count) === 0 ? (
        <div style={{ background: "rgba(139,92,246,0.04)", border: "1px solid rgba(139,92,246,0.12)", borderRadius: 16, padding: "32px 24px", textAlign: "center", marginBottom: 28 }}>
          <BarChart2 size={40} style={{ opacity: 0.2, margin: "0 auto 16px" }} />
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Les données de réputation arrivent avec les premiers avis</p>
          <p style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 400, margin: "0 auto" }}>
            Partagez votre lien Workie en interne — les avis sont 100% anonymes et donnent accès aux notes par catégorie, profils des répondants, et évolution mensuelle.
          </p>
        </div>
      ) : (
        <>
          {/* Notes par catégorie */}
          <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px", marginBottom: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 20 }}>Notes par dimension</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { label: "Note globale", value: avgOverall, color: "#f59e0b" },
                { label: "Management", value: avgManagement, color: "#8b5cf6" },
                { label: "Vie pro/perso", value: avgWorklife, color: "#10b981" },
                { label: "Culture & ambiance", value: avgCulture, color: "#06b6d4" },
                { label: "Évolution de carrière", value: avgCareer, color: "#f97316" },
              ].map(({ label, value, color }) => {
                const num = parseFloat(String(value));
                const pct = isNaN(num) ? 0 : (num / 5) * 100;
                return (
                  <div key={label}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 14, color: "var(--text)", fontWeight: 600 }}>{label}</span>
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

          <div className="biz-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
            {/* Distribution */}
            <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 18 }}>Distribution des notes</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[5, 4, 3, 2, 1].map(star => {
                  const item = dist?.find((d: { star: number }) => d.star === star);
                  const cnt = Number(item?.count ?? 0);
                  const pct = maxDist > 0 ? (cnt / maxDist) * 100 : 0;
                  const totalPct = Number(count) > 0 ? Math.round((cnt / Number(count)) * 100) : 0;
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

            {/* Mode travail + contrats */}
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

          {/* ── Section 3 : Profil des répondants ── */}
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <Users size={13} /> Profil des personnes qui ont laissé un avis
          </p>
          <div className="biz-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
            <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 24px" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 18 }}>Niveau hiérarchique</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {SENIORITY_ORDER.filter(s => (seniority ?? {})[s]).map(s => {
                  const cnt = (seniority ?? {})[s] ?? 0;
                  const pct = totalSeniority > 0 ? Math.round((cnt / totalSeniority) * 100) : 0;
                  return <Bar key={s} label={s} value={`${pct}% (${cnt})`} pct={pct} color={SENIORITY_COLOR[s] ?? "#8b5cf6"} />;
                })}
              </div>
            </div>
            <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 24px" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 18 }}>Fonction</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {Object.entries(functions ?? {}).sort(([, a], [, b]) => b - a).map(([fn, cnt]) => {
                  const pct = totalFunctions > 0 ? Math.round((cnt / totalFunctions) * 100) : 0;
                  return <Bar key={fn} label={fn} value={`${pct}% (${cnt})`} pct={pct} color="#8b5cf6" />;
                })}
              </div>
            </div>
          </div>

          {/* Employé actuel vs ancien */}
          <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 24px", marginBottom: 28 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>Employé actuel vs. ancien employé</p>
            <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
              {[
                { label: "Employés actuels", cnt: currentVsFormer?.current ?? 0, color: "#10b981" },
                { label: "Anciens employés", cnt: currentVsFormer?.former ?? 0, color: "#6b7280" },
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
              <div style={{ flex: 1, minWidth: 120, height: 10, borderRadius: 50, background: "#6b7280", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${count > 0 ? Math.round(((currentVsFormer?.current ?? 0) / count) * 100) : 0}%`, background: "#10b981", borderRadius: 50 }} />
              </div>
            </div>
          </div>

          {/* Évolution mensuelle */}
          {trend && trend.length > 1 && (
            <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 24 }}>Évolution mensuelle de la note</p>
              <div className="scroll-x" style={{ margin: "0 -4px" }}>
              <div style={{ minWidth: 480, display: "flex", gap: 8, padding: "0 4px" }}>
                {(() => {
                  const MONTHS_SHORT = ["jan","fév","mar","avr","mai","jun","jul","aoû","sep","oct","nov","déc"];
                  const BAR_H = 88;
                  return trend.map(({ month, avg: a }, idx) => {
                    const [y, mo] = month.split("-");
                    const isJan = mo === "01";
                    const showYear = idx === 0 || isJan;
                    const label = showYear
                      ? `${MONTHS_SHORT[parseInt(mo) - 1]} '${y.slice(2)}`
                      : MONTHS_SHORT[parseInt(mo) - 1];
                    const h = a != null ? Math.max(4, (a / 5) * BAR_H) : 4;
                    const color = a == null ? "var(--border)" : a >= 4 ? "#10b981" : a >= 3 ? "#f59e0b" : "#ef4444";
                    return (
                      <div key={month} style={{ flex: 1, minWidth: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: 10, color, fontWeight: 700, lineHeight: "13px", minHeight: 13 }}>{a ?? "–"}</span>
                        <div style={{ width: "100%", height: BAR_H, display: "flex", alignItems: "flex-end" }}>
                          <div title={a != null ? `${label}: ${a}/5` : `${label}: aucun avis`} style={{ width: "100%", height: h, background: color, borderRadius: "4px 4px 0 0", opacity: 0.85 }} />
                        </div>
                        <span style={{ fontSize: 9, color: showYear ? "var(--text-sub)" : "var(--text-muted)", fontWeight: showYear ? 700 : 400, whiteSpace: "nowrap", marginTop: 2 }}>{label}</span>
                      </div>
                    );
                  });
                })()}
              </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
