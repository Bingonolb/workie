"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useTransition } from "react";
import { Flame, Star, Users, MapPin, TrendingUp } from "lucide-react";
import { toggleFavorite } from "@/lib/actions/favorites";
import type { Company } from "@/lib/types";
import { SECTOR_COLORS } from "@/lib/types";
import { CoverImage } from "@/components/CoverImage";
import { logoAffichable } from "@/lib/logo";
import { useEtatSynchronise } from "@/lib/useEtatSynchronise";

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

function getOgCover(company: Company): string {
  return `/api/og?title=${encodeURIComponent(company.name)}&sub=${encodeURIComponent(company.sector ?? "")}`;
}

const SECTOR_DEFAULT_TAGS: Record<string, string[]> = {
  "Tech":                   ["innovation", "digital", "remote"],
  "Finance":                ["finance", "banking", "investment"],
  "Assurances":             ["assurances", "risk", "courtage"],
  "Pharma":                 ["life-sciences", "r&d", "biotech"],
  "Santé":                  ["healthcare", "médecine", "bien-être"],
  "Conseil":                ["consulting", "stratégie", "management"],
  "Industrie":              ["manufacturing", "industrie", "engineering"],
  "Automobile":             ["automotive", "mobilité", "engineering"],
  "Horlogerie":             ["luxury", "swiss-made", "savoir-faire"],
  "Commerce":               ["retail", "distribution", "vente"],
  "Alimentation":           ["food", "nutrition", "fmcg"],
  "Agriculture":            ["agriculture", "durabilité", "nature"],
  "Éducation & Recherche":  ["éducation", "recherche", "innovation"],
  "Sports & Fashion":       ["sport", "mode", "lifestyle"],
  "Transport":              ["logistique", "mobilité", "transport"],
  "Énergie":                ["énergie", "cleantech", "durabilité"],
  "Droit":                  ["legal", "compliance", "droit"],
  "Bâtiment":               ["construction", "immobilier", "ingénierie"],
  "Beauté":                 ["beauté", "cosmétiques", "bien-être"],
  "Administration publique":["service-public", "gouvernance", "suisse"],
};

function getDisplayTags(company: Company): string[] {
  const existing = (company.tags ?? []).slice(0, 3);
  if (existing.length >= 3) return existing;
  const defaults = SECTOR_DEFAULT_TAGS[company.sector] ?? ["swiss", "professionnel", "équipe"];
  return [...existing, ...defaults.filter(t => !existing.includes(t))].slice(0, 3);
}

// Neutral blur placeholder — shows instantly before the real image loads
const BLUR_DATA_URL = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMyMDIwMzAiLz48L3N2Zz4=";

export function CompanyCard({ company, isFav = false, isLoggedIn = false, priority = false, loading = "eager" }: {
  company: Company;
  isFav?: boolean;
  isLoggedIn?: boolean;
  priority?: boolean;
  loading?: "eager" | "lazy";
}) {
  const router = useRouter();
  // Suit la propriété : sur /explore, page statique, le favori n'est connu
  // qu'après l'arrivée du contexte. Figé, l'état laissait la flamme éteinte
  // sur une entreprise pourtant enregistrée.
  const [fav, setFav] = useEtatSynchronise(isFav);
  const [score, setScore] = useEtatSynchronise(Number(company.score));
  const [coverFailed, setCoverFailed] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
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
    <Link
      href={`/company/${company.id}`}
      aria-label={`Voir la fiche ${company.name}${Number(company.review_count) > 0 ? ` — ${Number(company.avg_rating).toFixed(1)}/5 (${company.review_count} avis)` : ""}`}
      style={{ textDecoration: "none", display: "block" }}
      // Next précharge les liens entrant dans la fenêtre, mais seulement quand
      // le navigateur est inactif : un clic juste après un défilement arrive
      // avant. Mesuré sur build de production — une fiche déjà préchargée
      // s'ouvre en 19 à 27 ms, une fiche qui ne l'est pas encore en 345 à 996.
      // On déclenche donc dès l'intention, au survol ou au premier contact du
      // doigt, ce qui donne quelques centaines de millisecondes d'avance.
      onPointerEnter={() => router.prefetch(`/company/${company.id}`)}
      onTouchStart={() => router.prefetch(`/company/${company.id}`)}
    >
      <div className="company-card" style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 20,
        overflow: "hidden",
        cursor: "pointer",
      }}>
        {/* Cover */}
        <div className="card-cover" style={{ height: 210, position: "relative", overflow: "hidden", background: "var(--surface2)" }}>
          <CoverImage
            src={(company.cover_url && !coverFailed) ? company.cover_url : getOgCover(company)}
            color={company.cover_color}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
            priority={priority}
          />

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
              position: "absolute", top: 11, right: 62,
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

          {/* Bottom: logo/initials + company name */}
          <div style={{ position: "absolute", bottom: 12, left: 12, right: 60, display: "flex", alignItems: "flex-end", gap: 9 }}>
            {/* Logo or initials */}
            <div style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 9, overflow: "hidden", position: "relative",
              background: logoLoaded ? "#fff" : `${sectorColor}33`,
              border: logoLoaded ? "1.5px solid rgba(255,255,255,0.25)" : `1.5px solid ${sectorColor}66`,
            }}>
              {/* Initials — hidden once logo loads */}
              {!logoLoaded && (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>
                  {getInitials(company.name)}
                </div>
              )}
              {/* Logo — seulement s'il est hébergé chez nous (voir logoAffichable) */}
              {logoAffichable(company.logo_url) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoAffichable(company.logo_url)!}
                  alt=""
                  width={38}
                  height={38}
                  loading="eager"
                  onLoad={() => setLogoLoaded(true)}
                  onError={() => setLogoLoaded(false)}
                  style={{
                    position: "absolute", inset: 0,
                    width: "100%", height: "100%",
                    objectFit: "contain", padding: 3,
                    opacity: logoLoaded ? 1 : 0,
                    transition: "opacity 0.25s ease",
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
              fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.5,
              marginBottom: 11,
              display: "-webkit-box", WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical", overflow: "hidden",
            } as React.CSSProperties}>
              {company.description}
            </p>
          )}

          {/* Location + size + salary — chaque puce n'apparaît que si la donnée
              existe réellement. La taille d'effectif n'est plus affichée tant
              qu'elle n'est pas issue d'une source vérifiable. */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
            <InfoChip icon={<MapPin size={11} aria-hidden="true" />} label={company.city} />
            {company.employee_range && (
              <InfoChip icon={<Users size={11} aria-hidden="true" />} label={company.employee_range} />
            )}
            {Number(company.avg_salary_chf) > 0 && (
              <InfoChip icon={<TrendingUp size={11} aria-hidden="true" />} label={`CHF ${(Number(company.avg_salary_chf) / 1000).toFixed(0)}k`} color="#10b981" />
            )}
          </div>

          {/* Tags — toujours affichés */}
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {getDisplayTags(company).map(tag => (
              <span key={tag} style={{
                fontSize: 10, padding: "2px 7px", borderRadius: 50,
                background: "var(--surface3)", color: "var(--text-muted)",
                fontWeight: 600,
              }}>#{tag}</span>
            ))}
          </div>
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
