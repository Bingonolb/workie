"use client";

import { useState } from "react";

const MONTHS_SHORT = ["jan","fév","mar","avr","mai","jun","jul","aoû","sep","oct","nov","déc"];
const BAR_H = 88;

type TrendItem = { month: string; avg: number | null };

export function AnalyticsTrendChart({ trend }: { trend: TrendItem[] }) {
  const [activeMonth, setActiveMonth] = useState<string | null>(null);

  const activeItem = activeMonth ? trend.find(t => t.month === activeMonth) : null;

  return (
    <div
      style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px" }}
      onPointerLeave={() => setActiveMonth(null)}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 24, minHeight: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Évolution mensuelle de la note</p>
        {activeItem ? (() => {
          const [y, mo] = activeItem.month.split("-");
          const label = `${MONTHS_SHORT[parseInt(mo) - 1]} '${y.slice(2)}`;
          const color = activeItem.avg == null ? "var(--text-muted)" : activeItem.avg >= 4 ? "#10b981" : activeItem.avg >= 3 ? "#f59e0b" : "#ef4444";
          return (
            <span style={{ fontSize: 13, fontWeight: 700, color }}>
              {label} · {activeItem.avg != null ? `${activeItem.avg}/5` : "aucun avis"}
            </span>
          );
        })() : (
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>touche une barre</span>
        )}
      </div>

      <div className="scroll-x" style={{ margin: "0 -4px" }}>
        <div style={{ minWidth: 480, display: "flex", gap: 8, padding: "0 4px" }}>
          {trend.map(({ month, avg: a }, idx) => {
            const [y, mo] = month.split("-");
            const isJan = mo === "01";
            const showYear = idx === 0 || isJan;
            const barLabel = showYear
              ? `${MONTHS_SHORT[parseInt(mo) - 1]} '${y.slice(2)}`
              : MONTHS_SHORT[parseInt(mo) - 1];
            const h = a != null ? Math.max(4, (a / 5) * BAR_H) : 4;
            const color = a == null ? "var(--border)" : a >= 4 ? "#10b981" : a >= 3 ? "#f59e0b" : "#ef4444";
            const isActive = month === activeMonth;
            const dimmed = activeMonth !== null && !isActive;
            return (
              <div
                key={month}
                onPointerEnter={() => setActiveMonth(month)}
                onClick={() => setActiveMonth(month === activeMonth ? null : month)}
                style={{ flex: 1, minWidth: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}
              >
                <span style={{ fontSize: 10, color, fontWeight: 700, lineHeight: "13px", minHeight: 13, opacity: dimmed ? 0.3 : 1 }}>
                  {a ?? "–"}
                </span>
                <div style={{ width: "100%", height: BAR_H, display: "flex", alignItems: "flex-end" }}>
                  <div style={{
                    width: "100%", height: h, background: color,
                    borderRadius: "4px 4px 0 0",
                    opacity: dimmed ? 0.25 : 0.85,
                    outline: isActive ? `2px solid ${color}` : "none",
                    outlineOffset: 2,
                  }} />
                </div>
                <span style={{
                  fontSize: 9, whiteSpace: "nowrap", marginTop: 2,
                  color: showYear ? "var(--text-sub)" : "var(--text-muted)",
                  fontWeight: showYear ? 700 : 400,
                  opacity: dimmed ? 0.4 : 1,
                }}>
                  {barLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
