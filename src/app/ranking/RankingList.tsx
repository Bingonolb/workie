"use client";

import Link from "next/link";
import { Flame, MapPin, Star, TrendingUp } from "lucide-react";
import type { Company } from "@/lib/types";
import { SECTOR_COLORS } from "@/lib/types";

export function RankingPodium({ companies }: { companies: Company[] }) {
  const order = [companies[1], companies[0], companies[2]];
  const metas = [
    { rank: 2, color: "#9ca3af", emoji: "🥈" },
    { rank: 1, color: "#f97316", emoji: "🥇" },
    { rank: 3, color: "#b45309", emoji: "🥉" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 32 }}>
      {order.map((c, idx) => {
        const { rank, color, emoji } = metas[idx];
        const sectorColor = SECTOR_COLORS[c.sector] ?? "#8b5cf6";
        return (
          <Link key={c.id} href={`/company/${c.id}`} style={{ textDecoration: "none" }}>
            <div
              style={{ background: "var(--surface)", border: `1px solid ${color}44`, borderRadius: 20, padding: "20px 16px", textAlign: "center", transition: "transform 0.2s", cursor: "pointer" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; }}
            >
              <div style={{ fontSize: rank === 1 ? 36 : 28, marginBottom: 8 }}>{emoji}</div>
              <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 6, lineHeight: 1.2 }}>{c.name}</p>
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
  );
}

export function RankingRow({ company, index }: { company: Company; index: number }) {
  const sectorColor = SECTOR_COLORS[company.sector] ?? "#8b5cf6";
  const isTop3 = index < 3;
  const rankColor = index === 0 ? "#f97316" : index === 1 ? "#9ca3af" : index === 2 ? "#b45309" : "var(--text-muted)";

  return (
    <Link href={`/company/${company.id}`} style={{ textDecoration: "none" }}>
      <div
        style={{
          display: "flex", alignItems: "center", gap: 16,
          border: isTop3 ? `1px solid ${rankColor}33` : "1px solid var(--border)",
          background: "var(--surface)", borderRadius: 14, padding: "14px 18px",
          transition: "transform 0.15s, box-shadow 0.15s", cursor: "pointer",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateX(4px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.3)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
      >
        <div style={{ width: 36, textAlign: "center", flexShrink: 0 }}>
          {isTop3
            ? <span style={{ fontSize: 20 }}>{index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}</span>
            : <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-muted)" }}>#{index + 1}</span>
          }
        </div>

        <div style={{ width: 44, height: 44, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: `linear-gradient(135deg, ${sectorColor}, #f97316)` }}>
          {company.cover_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={company.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{company.name}</p>
            {company.is_verified && <span style={{ fontSize: 11, color: "#10b981" }}>✓</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 50, background: `${sectorColor}22`, color: sectorColor, fontWeight: 600 }}>{company.sector}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12, color: "var(--text-muted)" }}><MapPin size={11} />{company.city}</span>
            {company.avg_rating > 0 && <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12, color: "#f59e0b" }}><Star size={11} fill="#f59e0b" />{Number(company.avg_rating).toFixed(1)}</span>}
            {company.avg_salary_chf && <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12, color: "#10b981" }}><TrendingUp size={11} />CHF {Math.round(company.avg_salary_chf / 1000)}k</span>}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
          <Flame size={18} fill={isTop3 ? rankColor : "rgba(249,115,22,0.4)"} color={isTop3 ? rankColor : "rgba(249,115,22,0.4)"} />
          <span style={{ fontSize: 18, fontWeight: 900, color: isTop3 ? rankColor : "var(--text)", minWidth: 28 }}>{company.score}</span>
        </div>
      </div>
    </Link>
  );
}
