"use client";

import { useState } from "react";
import Link from "next/link";
import { Flame, Star, TrendingUp, ChevronUp } from "lucide-react";
import type { Company } from "@/lib/types";
import { SECTOR_COLORS } from "@/lib/types";

const SECTORS = ["Tous", "Tech", "Pharma", "Finance", "Conseil", "Sports & Fashion", "Horlogerie", "Alimentation", "Industrie", "Éducation & Recherche"];

export function RankingTable({ companies }: { companies: Company[] }) {
  const [sector, setSector] = useState("Tous");
  const maxScore = companies[0]?.score ?? 1;

  const filtered = sector === "Tous" ? companies : companies.filter(c => c.sector === sector);

  return (
    <div>
      {/* Sector filter */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 28 }}>
        {SECTORS.map(s => {
          const color = s === "Tous" ? "#8b5cf6" : (SECTOR_COLORS[s] ?? "#8b5cf6");
          const active = sector === s;
          return (
            <button key={s} onClick={() => setSector(s)} style={{
              padding: "5px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600,
              border: active ? `1px solid ${color}` : "1px solid var(--border)",
              background: active ? `${color}18` : "transparent",
              color: active ? color : "var(--text-muted)",
              cursor: "pointer", transition: "all 0.15s",
            }}>
              {s}
            </button>
          );
        })}
      </div>

      {/* Table header */}
      <div style={{
        display: "grid", gridTemplateColumns: "52px 1fr 140px 80px 90px 110px",
        padding: "8px 16px", marginBottom: 4,
        borderBottom: "1px solid var(--border)",
      }}>
        {["#", "Entreprise", "Secteur", "Note", "Salaire", "Score"].map((h, i) => (
          <span key={h} style={{
            fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
            letterSpacing: "0.06em", textTransform: "uppercase",
            textAlign: i >= 3 ? "right" : "left",
          }}>{h}</span>
        ))}
      </div>

      {/* Rows */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {filtered.map((c, i) => {
          const globalRank = companies.indexOf(c);
          const sectorColor = SECTOR_COLORS[c.sector] ?? "#8b5cf6";
          const barPct = maxScore > 0 ? (c.score / maxScore) * 100 : 0;
          const isTop = globalRank < 3;

          return (
            <Link key={c.id} href={`/company/${c.id}`} style={{ textDecoration: "none" }}>
              <div
                style={{
                  display: "grid", gridTemplateColumns: "52px 1fr 140px 80px 90px 110px",
                  alignItems: "center", padding: "13px 16px",
                  borderBottom: "1px solid var(--border)",
                  transition: "background 0.12s",
                  position: "relative", overflow: "hidden",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--surface2)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                {/* Score bar background */}
                <div style={{
                  position: "absolute", left: 0, top: 0, bottom: 0,
                  width: `${barPct * 0.35}%`,
                  background: `linear-gradient(90deg, ${sectorColor}08, transparent)`,
                  pointerEvents: "none",
                }} />

                {/* Rank */}
                <span style={{
                  fontSize: isTop ? 13 : 13, fontWeight: 800,
                  color: globalRank === 0 ? "#f97316" : globalRank === 1 ? "#9ca3af" : globalRank === 2 ? "#b45309" : "var(--text-muted)",
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {globalRank === 0 ? "01" : globalRank === 1 ? "02" : globalRank === 2 ? "03" : String(globalRank + 1).padStart(2, "0")}
                </span>

                {/* Company */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: `linear-gradient(135deg, ${sectorColor}44, ${sectorColor}22)` }}>
                    {c.cover_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.name}
                      {c.is_verified && <span style={{ fontSize: 10, color: "#10b981", marginLeft: 6, fontWeight: 600 }}>VÉRIFIÉ</span>}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.city}</p>
                  </div>
                </div>

                {/* Sector */}
                <span style={{ fontSize: 11, fontWeight: 600, color: sectorColor, background: `${sectorColor}18`, border: `1px solid ${sectorColor}30`, borderRadius: 4, padding: "3px 8px", display: "inline-block", maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.sector}
                </span>

                {/* Rating */}
                <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                  {c.avg_rating > 0 ? (
                    <>
                      <Star size={11} fill="#f59e0b" color="#f59e0b" />
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b", fontVariantNumeric: "tabular-nums" }}>{Number(c.avg_rating).toFixed(1)}</span>
                    </>
                  ) : <span style={{ fontSize: 12, color: "var(--text-muted)" }}>—</span>}
                </div>

                {/* Salary */}
                <div style={{ textAlign: "right" }}>
                  {c.avg_salary_chf ? (
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#10b981", fontVariantNumeric: "tabular-nums" }}>
                      {Math.round(c.avg_salary_chf / 1000)}k
                    </span>
                  ) : <span style={{ fontSize: 12, color: "var(--text-muted)" }}>—</span>}
                </div>

                {/* Score */}
                <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "flex-end" }}>
                  {c.score > 0 && <ChevronUp size={13} color="#f97316" strokeWidth={2.5} />}
                  <Flame size={13} fill={isTop ? "#f97316" : "rgba(249,115,22,0.35)"} color={isTop ? "#f97316" : "rgba(249,115,22,0.35)"} />
                  <span style={{
                    fontSize: 15, fontWeight: 900,
                    color: isTop ? "#f97316" : "var(--text)",
                    fontVariantNumeric: "tabular-nums",
                  }}>
                    {c.score}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ padding: "48px 16px", textAlign: "center", color: "var(--text-muted)" }}>
            <p style={{ fontSize: 14 }}>Aucune entreprise dans ce secteur pour l'instant.</p>
          </div>
        )}
      </div>
    </div>
  );
}
