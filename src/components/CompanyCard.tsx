"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Flame, Star, Users, MapPin, TrendingUp } from "lucide-react";
import { toggleFavorite } from "@/lib/actions/favorites";
import type { Company } from "@/lib/types";
import { SECTOR_COLORS } from "@/lib/types";

const GRADIENT_FALLBACKS = [
  "linear-gradient(135deg, #8b5cf6, #3b82f6)",
  "linear-gradient(135deg, #f97316, #ec4899)",
  "linear-gradient(135deg, #10b981, #3b82f6)",
  "linear-gradient(135deg, #ec4899, #8b5cf6)",
  "linear-gradient(135deg, #f59e0b, #ef4444)",
  "linear-gradient(135deg, #06b6d4, #8b5cf6)",
];

function getGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return GRADIENT_FALLBACKS[Math.abs(hash) % GRADIENT_FALLBACKS.length];
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <Star size={13} fill="#f59e0b" color="#f59e0b" />
      <span style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b" }}>{Number(rating).toFixed(1)}</span>
    </span>
  );
}

export function CompanyCard({ company, isFav = false, isLoggedIn = false, isBusiness = false }: {
  company: Company;
  isFav?: boolean;
  isLoggedIn?: boolean;
  isBusiness?: boolean;
}) {
  const [fav, setFav] = useState(isFav);
  const [pending, startTransition] = useTransition();
  const sectorColor = SECTOR_COLORS[company.sector] ?? "#8b5cf6";

  const handleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isLoggedIn) { window.location.href = "/login"; return; }
    const prev = fav;
    setFav(f => !f);
    startTransition(async () => {
      try {
        await toggleFavorite(company.id);
      } catch {
        setFav(prev);
      }
    });
  };

  return (
    <Link href={`/company/${company.id}`} style={{ textDecoration: "none", display: "block" }}>
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 20,
        overflow: "hidden",
        transition: "transform 0.2s, box-shadow 0.2s",
        cursor: "pointer",
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 40px rgba(0,0,0,0.4)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = ""; }}
      >
        {/* Cover */}
        <div style={{ height: 140, position: "relative", overflow: "hidden" }}>
          {company.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={company.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", background: getGradient(company.name) }} />
          )}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.75))" }} />

          {/* Sector badge */}
          <div style={{
            position: "absolute", top: 12, left: 12,
            background: `${sectorColor}22`, border: `1px solid ${sectorColor}44`,
            borderRadius: 50, padding: "4px 10px", fontSize: 11, fontWeight: 600,
            color: sectorColor, backdropFilter: "blur(8px)",
          }}>
            {company.sector}
          </div>

          {/* Flame / Favorite — hidden for business users */}
          {!isBusiness && (
            <button
              onClick={handleFav}
              disabled={pending}
              style={{
                position: "absolute", top: 10, right: 10,
                width: 36, height: 36, borderRadius: "50%",
                background: fav ? "rgba(249,115,22,0.9)" : "rgba(13,13,19,0.7)",
                border: "1px solid rgba(255,255,255,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", backdropFilter: "blur(8px)",
                transition: "all 0.2s",
              }}
            >
              <Flame size={16} fill={fav ? "#fff" : "none"} color={fav ? "#fff" : "rgba(255,255,255,0.6)"} />
            </button>
          )}

          {/* Company name over cover */}
          <div style={{ position: "absolute", bottom: 10, left: 14, right: 50 }}>
            <p style={{ fontSize: 15, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.2, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>
              {company.name}
              {company.is_verified && (
                <svg viewBox="0 0 22 22" style={{ display: "inline", verticalAlign: "middle", marginLeft: 5, width: 16, height: 16, flexShrink: 0 }} aria-label="Entreprise vérifiée">
                  <circle cx="11" cy="11" r="11" fill="#1D9BF0" />
                  <path d="M9.5 15.5l-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4z" fill="#fff" />
                </svg>
              )}
            </p>
            {company.subsector && (
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{company.subsector}</p>
            )}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "14px 16px 16px" }}>
          {/* Stats row */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            {company.avg_rating > 0 && <StarDisplay rating={company.avg_rating} />}
            {company.review_count > 0 && (
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{company.review_count} avis</span>
            )}
            {company.score > 0 && (
              <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "#f97316" }}>
                <Flame size={12} fill="#f97316" color="#f97316" /> {company.score}
              </span>
            )}
          </div>

          {company.description && (
            <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.55, marginBottom: 12, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>
              {company.description}
            </p>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
            <InfoChip icon={<MapPin size={12} />} label={company.city} />
            <InfoChip icon={<Users size={12} />} label={company.employee_range + " emp."} />
            {company.avg_salary_chf && (
              <InfoChip icon={<TrendingUp size={12} />} label={`CHF ${(company.avg_salary_chf / 1000).toFixed(0)}k`} color="#10b981" />
            )}
          </div>

          {/* Tags */}
          {company.tags?.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {company.tags.slice(0, 3).map(tag => (
                <span key={tag} style={{
                  fontSize: 11, padding: "3px 8px", borderRadius: 50,
                  background: "var(--surface3)", color: "var(--text-muted)",
                }}>#{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function InfoChip({ icon, label, color }: { icon: React.ReactNode; label: string; color?: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 12, color: color ?? "var(--text-muted)",
    }}>
      {icon} {label}
    </span>
  );
}
