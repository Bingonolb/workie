"use client";

import { useState } from "react";
import Link from "next/link";
import { Flame, Star, TrendingUp, Zap, Search } from "lucide-react";
import type { Company } from "@/lib/types";
import { SECTOR_COLORS } from "@/lib/types";

const SECTORS = ["Tous", "Tech", "Finance", "Assurances", "Pharma", "Santé", "Conseil", "Industrie", "Automobile", "Horlogerie", "Commerce", "Alimentation", "Agriculture", "Éducation & Recherche", "Sports & Fashion", "Transport", "Énergie"];

const MEDALS = ["🥇", "🥈", "🥉"];

export function RankingTable({ companies }: { companies: Company[] }) {
  const [sector, setSector] = useState("Tous");
  const [search, setSearch] = useState("");
  const maxScore = Math.max(...companies.map(c => Number(c.score ?? 0)), 1);

  const q = search.trim().toLowerCase();
  const filtered = companies
    .filter(c => sector === "Tous" || c.sector === sector)
    .filter(c => !q || c.name.toLowerCase().includes(q) || c.city?.toLowerCase().includes(q));
  const globalRankMap = new Map(companies.map((c, i) => [c.id, i]));
  const isFiltered = sector !== "Tous" || q.length > 0;

  return (
    <div>
      {/* Search */}
      <div style={{ padding: "0 20px 16px" }}>
        <div style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Chercher une entreprise ou une ville"
            placeholder="Chercher une entreprise ou une ville..."
            style={{
              width: "100%", background: "var(--surface2)", border: "1px solid var(--border2)",
              borderRadius: 10, padding: "9px 12px 9px 34px", fontSize: 16, color: "var(--text)",
              outline: "none", boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* Sector filter */}
      <div className="ranking-sectors" style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: "0 20px 20px" }}>
        {SECTORS.map(s => {
          const color = s === "Tous" ? "#8b5cf6" : (SECTOR_COLORS[s] ?? "#8b5cf6");
          const active = sector === s;
          return (
            <button key={s} type="button" onClick={() => setSector(s)} aria-pressed={active} style={{
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
      <div className="ranking-header">
        {[
          { label: "#", cls: "" },
          { label: "Entreprise", cls: "" },
          { label: "Secteur", cls: "ranking-col-sector" },
          { label: "Note · Avis", cls: "ranking-col-note" },
          { label: "Score avis", cls: "ranking-col-score-avis" },
          { label: "Score total", cls: "" },
        ].map(({ label, cls }, i) => (
          <span key={label} className={cls} style={{
            fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
            letterSpacing: "0.06em", textTransform: "uppercase",
            textAlign: i >= 3 ? "right" : "left",
          }}>{label}</span>
        ))}
      </div>

      {/* Rows */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {filtered.map((c, filteredIdx) => {
          const globalRank = globalRankMap.get(c.id) ?? 0;
          const displayRank = isFiltered ? filteredIdx : globalRank;
          const sectorColor = SECTOR_COLORS[c.sector] ?? "#8b5cf6";
          const score = Number(c.score ?? 0);
          const avgRating = Number(c.avg_rating ?? 0);
          const reviewCount = Number(c.review_count ?? 0);
          const barPct = maxScore > 0 ? Math.min((score / maxScore) * 100, 100) : 0;
          const isTop3 = displayRank < 3;

          const ratingPts = avgRating > 0 && reviewCount > 0
            ? Math.round(avgRating * 20 * Math.log(reviewCount + 1))
            : 0;
          const communityPts = Math.max(0, score - ratingPts);

          return (
            <Link key={c.id} href={`/company/${c.id}`} className="ranking-row"
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--surface2)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                {/* Score bar bg */}
                <div style={{
                  position: "absolute", left: 0, top: 0, bottom: 0,
                  width: `${barPct * 0.4}%`,
                  background: `linear-gradient(90deg, ${sectorColor}0a, transparent)`,
                  pointerEvents: "none",
                }} />

                {/* Rank */}
                <span style={{
                  fontSize: 14, fontWeight: 900,
                  color: displayRank === 0 ? "#f97316" : displayRank === 1 ? "#9ca3af" : displayRank === 2 ? "#b45309" : "var(--text-muted)",
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {displayRank < 3 ? MEDALS[displayRank] : String(displayRank + 1).padStart(2, "0")}
                </span>

                {/* Company */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, overflow: "hidden",
                    flexShrink: 0, background: `linear-gradient(135deg, ${sectorColor}44, ${sectorColor}22)`,
                  }}>
                    {c.cover_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.cover_url} alt="" style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{
                      fontSize: 14, fontWeight: 700, color: "var(--text)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {c.name}
                      {c.is_verified && (
                        <svg viewBox="0 0 22 22" style={{ display: "inline", verticalAlign: "middle", marginLeft: 5, width: 14, height: 14, flexShrink: 0 }} aria-label="Entreprise vérifiée">
                          <circle cx="11" cy="11" r="11" fill="#1D9BF0" />
                          <path d="M9.5 15.5l-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4z" fill="#fff" />
                        </svg>
                      )}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.city}</p>
                  </div>
                </div>

                {/* Sector */}
                <span className="ranking-col-sector" style={{
                  fontSize: 11, fontWeight: 600, color: sectorColor,
                  background: `${sectorColor}18`, border: `1px solid ${sectorColor}30`,
                  borderRadius: 4, padding: "3px 8px",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  display: "inline-block", maxWidth: 120,
                }}>
                  {c.sector}
                </span>

                {/* Note · Avis */}
                <div className="ranking-col-note" style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "flex-end" }}>
                  {avgRating > 0 ? (
                    <>
                      <Star size={11} fill="#f59e0b" color="#f59e0b" aria-hidden="true" />
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b", fontVariantNumeric: "tabular-nums" }}>
                        {avgRating.toFixed(1)}
                      </span>
                      {reviewCount > 0 && (
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>· {reviewCount}</span>
                      )}
                    </>
                  ) : (
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>—</span>
                  )}
                </div>

                {/* Score avis */}
                <div className="ranking-col-score-avis" style={{ textAlign: "right" }}>
                  {ratingPts > 0 ? (
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b", fontVariantNumeric: "tabular-nums" }}>
                      +{ratingPts}
                    </span>
                  ) : (
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>—</span>
                  )}
                  {communityPts !== 0 && (
                    <span style={{
                      marginLeft: 6, fontSize: 11, fontWeight: 600,
                      color: communityPts > 0 ? "#8b5cf6" : "#ef4444",
                      fontVariantNumeric: "tabular-nums",
                    }}>
                      {communityPts > 0 ? `+${communityPts}` : communityPts}
                      {communityPts > 0
                        ? <Zap size={9} style={{ marginLeft: 2, verticalAlign: "middle" }} color="#8b5cf6" aria-hidden="true" />
                        : <Flame size={9} style={{ marginLeft: 2, verticalAlign: "middle" }} color="#ef4444" aria-hidden="true" />}
                    </span>
                  )}
                </div>

                {/* Score total */}
                <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                  <TrendingUp size={12} color={isTop3 ? "#f97316" : "var(--text-muted)"} />
                  <span style={{
                    fontSize: 16, fontWeight: 900,
                    color: isTop3 ? "#f97316" : score > 0 ? "var(--text)" : "var(--text-muted)",
                    fontVariantNumeric: "tabular-nums",
                  }}>
                    {score}
                  </span>
                </div>
            </Link>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ padding: "48px 16px", textAlign: "center", color: "var(--text-muted)" }}>
            <p style={{ fontSize: 14 }}>Aucune entreprise dans ce secteur pour l&apos;instant.</p>
          </div>
        )}
      </div>
    </div>
  );
}
