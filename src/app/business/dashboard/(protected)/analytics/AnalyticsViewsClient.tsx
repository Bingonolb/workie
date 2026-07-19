"use client";

import { useState } from "react";
import { Eye, Heart, MessageSquare } from "lucide-react";

type ViewTrendItem = { day: string; count: number };

const PERIODS = [
  { id: "today", label: "Aujourd'hui" },
  { id: "7j",    label: "7 jours" },
  { id: "30j",   label: "30 jours" },
  { id: "90j",   label: "90 jours" },
] as const;
type Period = typeof PERIODS[number]["id"];

export function AnalyticsViewsClient({
  viewsToday, viewsWeek, viewsMonth, viewsTotal,
  viewTrend, favoritesCount, reviewCount,
}: {
  viewsToday: number; viewsWeek: number; viewsMonth: number; viewsTotal: number;
  viewTrend: ViewTrendItem[]; favoritesCount: number; reviewCount: number;
}) {
  const [period, setPeriod] = useState<Period>("7j");
  const [activeDay, setActiveDay] = useState<string | null>(null);

  const viewsByPeriod: Record<Period, number> = {
    today: viewsToday,
    "7j":  viewsWeek,
    "30j": viewsMonth,
    "90j": viewsTotal,
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  const chartData = period === "today"
    ? viewTrend.slice(-1)
    : period === "7j"
    ? viewTrend.slice(-7)
    : viewTrend; // 30j or 90j — only 30 days of daily data available

  const maxDay = Math.max(...chartData.map(v => v.count), 1);
  const totalPeriodLabel = PERIODS.find(p => p.id === period)?.label ?? "";

  return (
    <div>
      {/* Period tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {PERIODS.map(p => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            style={{
              padding: "7px 18px", borderRadius: 20, border: "1px solid",
              borderColor: period === p.id ? "#8b5cf6" : "var(--border2)",
              background: period === p.id ? "rgba(139,92,246,0.12)" : "transparent",
              color: period === p.id ? "#8b5cf6" : "var(--text-muted)",
              fontWeight: period === p.id ? 700 : 400,
              fontSize: 13, cursor: "pointer", transition: "all 0.15s",
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Primary stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 20 }}>
        <div style={{ background: "var(--surface2)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 14, padding: "20px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <Eye size={15} color="#10b981" />
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Vues · {totalPeriodLabel}</span>
          </div>
          <p style={{ fontSize: 38, fontWeight: 900, color: "#10b981", letterSpacing: "-0.03em", lineHeight: 1 }}>
            {viewsByPeriod[period].toLocaleString("fr-CH")}
          </p>
        </div>

        <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <Heart size={15} color="#ec4899" />
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>En favoris</span>
          </div>
          <p style={{ fontSize: 38, fontWeight: 900, color: "#ec4899", letterSpacing: "-0.03em", lineHeight: 1 }}>{favoritesCount}</p>
        </div>

        <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <MessageSquare size={15} color="#f59e0b" />
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Avis reçus</span>
          </div>
          <p style={{ fontSize: 38, fontWeight: 900, color: "#f59e0b", letterSpacing: "-0.03em", lineHeight: 1 }}>{reviewCount}</p>
        </div>
      </div>

      {/* Bar chart */}
      {chartData.length > 1 && (
        <div
          style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 24px" }}
          onMouseLeave={() => setActiveDay(null)}
        >
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
              Vues par jour — {totalPeriodLabel}
            </p>
            {activeDay && (() => {
              const item = chartData.find(d => d.day === activeDay);
              const n = item ? Number(item.count) : 0;
              const label = activeDay.slice(5).replace("-", "/");
              return (
                <span style={{ fontSize: 13, fontWeight: 700, color: activeDay === todayStr ? "#10b981" : "#8b5cf6" }}>
                  {label} · {n} vue{n !== 1 ? "s" : ""}
                </span>
              );
            })()}
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: period === "30j" ? 3 : 6, height: 72 }}>
            {chartData.map(({ day, count: cnt }) => {
              const n = Number(cnt);
              const h = maxDay > 0 ? Math.max(2, (n / maxDay) * 72) : 2;
              const isToday = day === todayStr;
              const isActive = day === activeDay;
              return (
                <div
                  key={day}
                  onClick={() => setActiveDay(day === activeDay ? null : day)}
                  onMouseEnter={() => setActiveDay(day)}
                  style={{
                    flex: 1, minWidth: 8, height: h, borderRadius: "3px 3px 0 0",
                    background: isToday ? "#10b981" : n > 0 ? "#8b5cf6" : "var(--border)",
                    opacity: activeDay && !isActive ? 0.35 : isToday ? 1 : n > 0 ? 0.75 : 0.3,
                    cursor: "pointer",
                    transition: "opacity 0.1s",
                    outline: isActive ? `2px solid ${isToday ? "#10b981" : "#8b5cf6"}` : "none",
                    outlineOffset: 2,
                  }}
                />
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 10, color: "var(--text-muted)" }}>
            <span>{chartData[0]?.day.slice(5).replace("-", "/")}</span>
            <span style={{ color: "#10b981", fontWeight: 700 }}>Aujourd'hui</span>
          </div>
        </div>
      )}

      {/* Today: no chart, just the number */}
      {period === "today" && (
        <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>
            {viewsToday === 0
              ? "Aucune visite enregistrée aujourd'hui pour l'instant."
              : `${viewsToday} visite${viewsToday > 1 ? "s" : ""} aujourd'hui sur votre fiche entreprise.`}
          </p>
          <p style={{ fontSize: 11, color: "var(--text-muted)", opacity: 0.6 }}>Mis à jour en temps réel</p>
        </div>
      )}
    </div>
  );
}
