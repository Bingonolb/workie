"use client";

import { useState } from "react";

type DayStat = { day: string; impressions: number; clicks: number };

export function AdStatsChart({ stats }: { stats: DayStat[] }) {
  const [metric, setMetric] = useState<"impressions" | "clicks">("impressions");
  const [hovered, setHovered] = useState<number | null>(null);

  const values = stats.map(d => d[metric]);
  const max = Math.max(...values, 1);
  const today = new Date().toISOString().slice(0, 10);

  const formatDay = (day: string) => {
    const d = new Date(day);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  const total = values.reduce((a, b) => a + b, 0);
  const label = metric === "impressions" ? "vues" : "clics";

  return (
    <div style={{ padding: "0 20px 18px" }}>
      {/* Toggle */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
          30 derniers jours · <strong style={{ color: "var(--text)" }}>{total.toLocaleString("fr-CH")}</strong> {label}
        </p>
        <div style={{ display: "flex", gap: 4 }}>
          {(["impressions", "clicks"] as const).map(m => (
            <button key={m} onClick={() => setMetric(m)} style={{
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
      <div style={{ position: "relative", display: "flex", alignItems: "flex-end", gap: 3, height: 60 }}>
        {stats.map((d, i) => {
          const height = max > 0 ? Math.max(2, Math.round((values[i] / max) * 60)) : 2;
          const isToday = d.day === today;
          const isHovered = hovered === i;
          return (
            <div
              key={d.day}
              style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%", position: "relative", cursor: "default" }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {isHovered && values[i] > 0 && (
                <div style={{
                  position: "absolute", bottom: height + 6, left: "50%", transform: "translateX(-50%)",
                  background: "var(--text)", color: "var(--bg)", fontSize: 10, fontWeight: 700,
                  padding: "3px 7px", borderRadius: 6, whiteSpace: "nowrap", zIndex: 10, pointerEvents: "none",
                }}>
                  {formatDay(d.day)}: {values[i]}
                </div>
              )}
              <div style={{
                height,
                borderRadius: "3px 3px 0 0",
                background: isToday
                  ? "#10b981"
                  : isHovered
                  ? "#a78bfa"
                  : metric === "impressions"
                  ? "linear-gradient(to top, #8b5cf6, #c4b5fd)"
                  : "linear-gradient(to top, #f97316, #fed7aa)",
                transition: "background 0.1s",
                opacity: values[i] === 0 ? 0.2 : 1,
              }} />
            </div>
          );
        })}
      </div>

      {/* X-axis labels — only show first, mid and last */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 10, color: "var(--text-muted)" }}>
        <span>{formatDay(stats[0]?.day ?? "")}</span>
        <span>{formatDay(stats[14]?.day ?? "")}</span>
        <span>{formatDay(stats[29]?.day ?? "")}</span>
      </div>
    </div>
  );
}
