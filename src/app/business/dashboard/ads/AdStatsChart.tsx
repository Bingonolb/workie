"use client";

import { useState } from "react";

type DayStat = { day: string; impressions: number; clicks: number };

export function AdStatsChart({ stats }: { stats: DayStat[] }) {
  const [metric, setMetric] = useState<"impressions" | "clicks">("impressions");
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const values = stats.map(d => d[metric]);
  const max = Math.max(...values, 1);
  const today = new Date().toISOString().slice(0, 10);
  const label = metric === "impressions" ? "vues" : "clics";
  const total = values.reduce((a, b) => a + b, 0);

  const formatDay = (day: string) => {
    const d = new Date(day);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  const activeDay = activeIdx !== null ? stats[activeIdx] : null;

  return (
    <div style={{ padding: "0 20px 18px" }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
            30 derniers jours · <strong style={{ color: "var(--text)" }}>{total.toLocaleString("fr-CH")}</strong> {label}
          </p>
          {activeDay && (
            <span style={{ fontSize: 12, fontWeight: 700, color: activeDay.day === today ? "#10b981" : metric === "impressions" ? "#8b5cf6" : "#f97316" }}>
              · {formatDay(activeDay.day)} : {values[activeIdx!]}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {(["impressions", "clicks"] as const).map(m => (
            <button key={m} onClick={() => { setMetric(m); setActiveIdx(null); }} style={{
              padding: "3px 10px", borderRadius: 50, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none",
              background: metric === m ? "#8b5cf6" : "var(--surface2)",
              color: metric === m ? "#fff" : "var(--text-muted)",
            }}>
              {m === "impressions" ? "Vues" : "Clics"}
            </button>
          ))}
        </div>
      </div>

      {/* Bar chart */}
      <div
        style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 60 }}
        onPointerLeave={() => setActiveIdx(null)}
      >
        {stats.map((d, i) => {
          const h = max > 0 ? Math.max(2, Math.round((values[i] / max) * 60)) : 2;
          const isToday = d.day === today;
          const isActive = activeIdx === i;
          const dimmed = activeIdx !== null && !isActive;
          return (
            <div
              key={d.day}
              onPointerEnter={() => setActiveIdx(i)}
              onClick={() => setActiveIdx(i === activeIdx ? null : i)}
              style={{
                flex: 1, height: h, borderRadius: "3px 3px 0 0", cursor: "pointer",
                background: isToday
                  ? "#10b981"
                  : metric === "impressions"
                  ? "linear-gradient(to top, #8b5cf6, #c4b5fd)"
                  : "linear-gradient(to top, #f97316, #fed7aa)",
                opacity: dimmed ? 0.3 : values[i] === 0 ? 0.2 : 1,
                outline: isActive ? `2px solid ${isToday ? "#10b981" : metric === "impressions" ? "#8b5cf6" : "#f97316"}` : "none",
                outlineOffset: 2,
              }}
            />
          );
        })}
      </div>

      {/* X-axis */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 10, color: "var(--text-muted)" }}>
        <span>{formatDay(stats[0]?.day ?? "")}</span>
        <span>{formatDay(stats[14]?.day ?? "")}</span>
        <span>{formatDay(stats[29]?.day ?? "")}</span>
      </div>
    </div>
  );
}
