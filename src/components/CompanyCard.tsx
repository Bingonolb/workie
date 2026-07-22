"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useTransition } from "react";
import { Flame, Star, Users, MapPin, TrendingUp } from "lucide-react";
import { toggleFavorite } from "@/lib/actions/favorites";
import type { Company } from "@/lib/types";
import { SECTOR_COLORS } from "@/lib/types";

const SECTOR_GRADIENTS: Record<string, string> = {
  "Tech":                  "linear-gradient(135deg, #6d28d9 0%, #1e40af 100%)",
  "Finance":               "linear-gradient(135deg, #1d4ed8 0%, #0f172a 100%)",
  "Assurances":            "linear-gradient(135deg, #0284c7 0%, #1e3a5f 100%)",
  "Pharma":                "linear-gradient(135deg, #059669 0%, #0c2d20 100%)",
  "Santé":                 "linear-gradient(135deg, #10b981 0%, #064e3b 100%)",
  "Conseil":               "linear-gradient(135deg, #d97706 0%, #7c2d12 100%)",
  "Industrie":             "linear-gradient(135deg, #475569 0%, #0f172a 100%)",
  "Automobile":            "linear-gradient(135deg, #4f46e5 0%, #1e1b4b 100%)",
  "Horlogerie":            "linear-gradient(135deg, #ea580c 0%, #431407 100%)",
  "Commerce":              "linear-gradient(135deg, #9333ea 0%, #3b0764 100%)",
  "Alimentation":          "linear-gradient(135deg, #65a30d 0%, #1a2e05 100%)",
  "Agriculture":           "linear-gradient(135deg, #4d7c0f 0%, #1a2e05 100%)",
  "Éducation & Recherche": "linear-gradient(135deg, #0891b2 0%, #0c4a6e 100%)",
  "Sports & Fashion":      "linear-gradient(135deg, #db2777 0%, #500724 100%)",
  "Transport":             "linear-gradient(135deg, #0d9488 0%, #134e4a 100%)",
  "Énergie":               "linear-gradient(135deg, #ca8a04 0%, #451a03 100%)",
};

function getCoverGradient(sector: string, sectorColor: string): string {
  return SECTOR_GRADIENTS[sector] ?? `linear-gradient(135deg, ${sectorColor} 0%, #0f172a 100%)`;
}

function getInitials(name: string): string {
  const words = name.trim().replace(/[^a-zA-ZÀ-ÿ\s]/g, " ").trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <Star size={13} fill="#f59e0b" color="#f59e0b" aria-hidden="true" />
      <span style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b" }}>{Number(rating).toFixed(1)}</span>
    </span>
  );
}

export function CompanyCard({ company, isFav = false, isLoggedIn = false, isBusiness = false, priority = false }: {
  company: Company;
  isFav?: boolean;
  isLoggedIn?: boolean;
  isBusiness?: boolean;
  priority?: boolean;
}) {
  const [fav, setFav] = useState(isFav);
  const [score, setScore] = useState(Number(company.score));
  const [pending, startTransition] = useTransition();
  const sectorColor = SECTOR_COLORS[company.sector] ?? "#8b5cf6";

  const handleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isLoggedIn) { window.location.href = "/login"; return; }
    const prev = fav;
    const prevScore = score;
    const next = !fav;
    setFav(next);
    if (next) setScore(s => s + 1);
    else setScore(s => Math.max(0, s - 1));
    startTransition(async () => {
      try { await toggleFavorite(company.id); }
      catch { setFav(prev); setScore(prevScore); }
    });
  };

  return (
    <Link href={`/company/${company.id}`} aria-label={`Voir la fiche ${company.name}${Number(company.review_count) > 0 ? ` — ${Number(company.avg_rating).toFixed(1)}/5 (${company.review_count} avis)` : ""}`} style={{ textDecoration: "none", display: "block" }}>
      <div className="company-card" style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 20,
        overflow: "hidden",
        cursor: "pointer",
      }}>
        {/* Cover */}
        <div className="card-cover img-placeholder" style={{ height: 148, position: "relative", overflow: "hidden" }}>
          {company.cover_url ? (
            <Image
              src={company.cover_url}
              alt=""
              fill
              sizes="(max-width: 640px) calc(50vw - 24px), 280px"
              style={{ objectFit: "cover" }}
              priority={priority}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", background: getCoverGradient(company.sector, sectorColor) }} />
          )}

          {/* Gradient overlay */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, transparent 35%, rgba(0,0,0,0.6) 75%, rgba(0,0,0,0.82) 100%)" }} />

          {/* Sector badge */}
          <div style={{
            position: "absolute", top: 11, left: 11,
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
            borderRadius: 50, padding: "3px 9px", fontSize: 10, fontWeight: 700,
            color: "#fff", letterSpacing: "0.04em", textTransform: "uppercase",
            border: "1px solid rgba(255,255,255,0.12)",
          }}>
            {company.sector}
          </div>

          {/* Score badge on cover */}
          {score > 0 && (
            <div style={{
              position: "absolute", top: 11, right: isBusiness ? 11 : 62,
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
              borderRadius: 50, padding: "3px 8px",
              display: "flex", alignItems: "center", gap: 4,
              border: "1px solid rgba(249,115,22,0.35)",
            }}>
              <Flame size={11} fill="#f97316" color="#f97316" aria-hidden="true" />
              <span style={{ fontSize: 11, fontWeight: 800, color: "#f97316" }}>{score}</span>
            </div>
          )}

          {/* Flame / Favorite */}
          {!isBusiness && (
            <button
              type="button"
              onClick={handleFav}
              disabled={pending}
              aria-pressed={fav}
              aria-label={fav ? `Retirer ${company.name} des favoris` : `Ajouter ${company.name} aux favoris`}
              style={{
                position: "absolute", top: 8, right: 8,
                width: 40, height: 40, borderRadius: "50%",
                background: fav ? "rgba(249,115,22,0.88)" : "rgba(13,13,19,0.55)",
                border: fav ? "1px solid rgba(249,115,22,0.5)" : "1px solid rgba(255,255,255,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "all 0.18s",
              }}
            >
              <Flame size={15} fill={fav ? "#fff" : "none"} color={fav ? "#fff" : "rgba(255,255,255,0.7)"} aria-hidden="true" />
            </button>
          )}

          {/* Bottom: logo/initials + company name */}
          <div style={{ position: "absolute", bottom: 12, left: 12, right: isBusiness ? 12 : 60, display: "flex", alignItems: "flex-end", gap: 9 }}>
            {/* Logo or initials */}
            <div style={{ flexShrink: 0, position: "relative", width: 38, height: 38 }}>
              {/* Initials always rendered as fallback */}
              <div style={{
                width: 38, height: 38, borderRadius: 9,
                background: `${sectorColor}33`,
                border: `1.5px solid ${sectorColor}66`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 900, color: "#fff",
                letterSpacing: "-0.02em",
              }}>
                {getInitials(company.name)}
              </div>
              {/* Logo overlaid on top if available — opacity:0 prevents "?" broken-image flash */}
              {company.logo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={company.logo_url}
                  alt=""
                  width={38}
                  height={38}
                  loading="lazy"
                  onLoad={(e) => { (e.target as HTMLImageElement).style.opacity = "1"; }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  style={{
                    position: "absolute", inset: 0,
                    borderRadius: 9, objectFit: "contain", background: "#fff",
                    border: "1.5px solid rgba(255,255,255,0.25)",
                    opacity: 0, transition: "opacity 0.1s",
                  }}
                />
              )}
            </div>

            <div style={{ minWidth: 0 }}>
              <p className="card-company-name" style={{
                fontSize: 14, fontWeight: 800, color: "#fff",
                letterSpacing: "-0.02em", lineHeight: 1.2,
                display: "-webkit-box", WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical", overflow: "hidden",
              } as React.CSSProperties}>
                {company.name}
                {company.is_verified && (
                  <svg viewBox="0 0 22 22" style={{ display: "inline", verticalAlign: "middle", marginLeft: 5, width: 15, height: 15, flexShrink: 0 }} aria-label="Entreprise vérifiée">
                    <circle cx="11" cy="11" r="11" fill="#1D9BF0" />
                    <path d="M9.5 15.5l-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4z" fill="#fff" />
                  </svg>
                )}
              </p>
              {company.subsector && (
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 1 }}>{company.subsector}</p>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "12px 14px 14px" }}>
          {/* Rating row */}
          {(Number(company.avg_rating) > 0 || Number(company.review_count) > 0) && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              {Number(company.avg_rating) > 0 && <StarDisplay rating={Number(company.avg_rating)} />}
              {Number(company.review_count) > 0 && (
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {company.review_count} avis
                </span>
              )}
            </div>
          )}

          {/* Description */}
          {company.description && (
            <p style={{
              fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.55,
              marginBottom: 11,
              display: "-webkit-box", WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical", overflow: "hidden",
            } as React.CSSProperties}>
              {company.description}
            </p>
          )}

          {/* Location + size + salary */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: company.tags?.length > 0 ? 10 : 0 }}>
            <InfoChip icon={<MapPin size={11} aria-hidden="true" />} label={company.city} />
            <InfoChip icon={<Users size={11} aria-hidden="true" />} label={company.employee_range} />
            {Number(company.avg_salary_chf) > 0 && (
              <InfoChip icon={<TrendingUp size={11} aria-hidden="true" />} label={`CHF ${(Number(company.avg_salary_chf) / 1000).toFixed(0)}k`} color="#10b981" />
            )}
          </div>

          {/* Tags */}
          {company.tags?.length > 0 && (
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {company.tags.slice(0, 3).map(tag => (
                <span key={tag} style={{
                  fontSize: 10, padding: "2px 7px", borderRadius: 50,
                  background: "var(--surface3)", color: "var(--text-muted)",
                  fontWeight: 600,
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
      display: "inline-flex", alignItems: "center", gap: 3,
      fontSize: 11.5, color: color ?? "var(--text-muted)",
    }}>
      {icon} {label}
    </span>
  );
}
