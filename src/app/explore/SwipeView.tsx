"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Star, MapPin, Users, TrendingUp, X, Heart, Info } from "lucide-react";
import { toggleFavorite } from "@/lib/actions/favorites";
import type { Company } from "@/lib/types";
import { SECTOR_COLORS } from "@/lib/types";

const SWIPE_THRESHOLD = 90;

export function SwipeView({
  companies,
  initialFavIds,
  isLoggedIn,
}: {
  companies: Company[];
  initialFavIds: string[];
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [favIds, setFavIds] = useState<Set<string>>(new Set(initialFavIds));
  const [gone, setGone] = useState<"left" | "right" | null>(null);

  // drag state
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const [drag, setDrag] = useState(0); // px offset
  const cardRef = useRef<HTMLDivElement>(null);

  const current = companies[index];
  const next = companies[index + 1];
  const total = companies.length;

  const advance = useCallback((dir: "left" | "right") => {
    if (!current) return;
    setGone(dir);
    if (dir === "right") {
      if (!isLoggedIn) { router.push("/login"); return; }
      setFavIds(prev => {
        const next = new Set(prev);
        if (next.has(current.id)) next.delete(current.id);
        else next.add(current.id);
        return next;
      });
      toggleFavorite(current.id);
    }
    setTimeout(() => {
      setIndex(i => i + 1);
      setGone(null);
      setDrag(0);
    }, 320);
  }, [current, isLoggedIn, router]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (gone) return;
    dragStart.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragStart.current || gone) return;
    setDrag(e.clientX - dragStart.current.x);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    dragStart.current = null;

    // click detection (small movement)
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {
      if (current) router.push(`/company/${current.id}`);
      setDrag(0);
      return;
    }

    if (dx > SWIPE_THRESHOLD) advance("right");
    else if (dx < -SWIPE_THRESHOLD) advance("left");
    else setDrag(0);
  };

  if (!current) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 500, gap: 16 }}>
        <div style={{ fontSize: 48 }}>🎉</div>
        <p style={{ fontSize: 20, fontWeight: 800, color: "var(--text)" }}>Tu as tout exploré !</p>
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>{total} entreprises vues</p>
        <button
          onClick={() => { setIndex(0); setGone(null); setDrag(0); }}
          style={{
            marginTop: 8, padding: "12px 28px", borderRadius: 50,
            background: "linear-gradient(135deg, #8b5cf6, #f97316)",
            color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer",
          }}
        >
          Recommencer
        </button>
      </div>
    );
  }

  const rotate = drag / 18;
  const opacity = Math.min(Math.abs(drag) / SWIPE_THRESHOLD, 1);
  const isRight = drag > 20;
  const isLeft = drag < -20;

  const cardStyle = (isGone: boolean, isBehind: boolean): React.CSSProperties => {
    if (isBehind) return {
      position: "absolute", inset: 0,
      transform: `scale(0.95) translateY(12px)`,
      transition: "transform 0.3s",
      pointerEvents: "none",
      zIndex: 0,
    };
    if (isGone) return {
      position: "absolute", inset: 0,
      transform: `translateX(${gone === "right" ? 600 : -600}px) rotate(${gone === "right" ? 20 : -20}deg)`,
      transition: "transform 0.32s cubic-bezier(0.4,0,0.2,1)",
      zIndex: 1,
      cursor: "grab",
    };
    return {
      position: "absolute", inset: 0,
      transform: `translateX(${drag}px) rotate(${rotate}deg)`,
      transition: dragStart.current ? "none" : "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
      zIndex: 1,
      cursor: "grab",
      touchAction: "none",
    };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
      {/* Counter */}
      <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
        <span style={{ fontWeight: 700, color: "var(--text)" }}>{index + 1}</span> / {total}
      </p>

      {/* Card stack */}
      <div style={{ position: "relative", width: "min(440px, 92vw)", height: 580 }}>
        {/* Card behind */}
        {next && (
          <div style={cardStyle(false, true)}>
            <SwipeCard company={next} favIds={favIds} overlayDir={null} overlayOpacity={0} />
          </div>
        )}

        {/* Current card */}
        <div
          ref={cardRef}
          style={cardStyle(!!gone, false)}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={e => { if (dragStart.current) onPointerUp(e); }}
        >
          <SwipeCard
            company={current}
            favIds={favIds}
            overlayDir={isRight ? "right" : isLeft ? "left" : null}
            overlayOpacity={opacity}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <ActionBtn color="#ef4444" onClick={() => advance("left")} disabled={!!gone}>
          <X size={26} />
        </ActionBtn>
        <ActionBtn color="#8b5cf6" onClick={() => current && router.push(`/company/${current.id}`)} disabled={!!gone} small>
          <Info size={20} />
        </ActionBtn>
        <ActionBtn color="#f97316" onClick={() => advance("right")} disabled={!!gone}>
          <Heart size={26} fill={favIds.has(current.id) ? "#f97316" : "none"} />
        </ActionBtn>
      </div>

      <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
        Glisse à droite pour sauvegarder · à gauche pour passer · clique pour voir le détail
      </p>
    </div>
  );
}

function SwipeCard({
  company,
  favIds,
  overlayDir,
  overlayOpacity,
}: {
  company: Company;
  favIds: Set<string>;
  overlayDir: "left" | "right" | null;
  overlayOpacity: number;
}) {
  const sectorColor = SECTOR_COLORS[company.sector] ?? "#8b5cf6";
  const isFav = favIds.has(company.id);

  return (
    <div style={{
      width: "100%", height: "100%", borderRadius: 28,
      overflow: "hidden", background: "var(--surface)",
      border: "1px solid var(--border)",
      boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      userSelect: "none",
    }}>
      {/* Cover */}
      <div style={{ height: "55%", position: "relative", overflow: "hidden" }}>
        {company.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={company.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${sectorColor}, #f97316)` }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(13,13,19,0.1) 40%, rgba(13,13,19,0.9))" }} />

        {/* Swipe overlays */}
        {overlayDir === "right" && (
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            background: `rgba(249,115,22,${overlayOpacity * 0.35})`,
            transition: "background 0.05s",
          }}>
            <div style={{
              border: `4px solid rgba(249,115,22,${overlayOpacity})`,
              borderRadius: 16, padding: "10px 22px",
              transform: `rotate(-12deg) scale(${0.8 + overlayOpacity * 0.2})`,
            }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: `rgba(249,115,22,${overlayOpacity})` }}>SAVE</span>
            </div>
          </div>
        )}
        {overlayDir === "left" && (
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            background: `rgba(239,68,68,${overlayOpacity * 0.35})`,
          }}>
            <div style={{
              border: `4px solid rgba(239,68,68,${overlayOpacity})`,
              borderRadius: 16, padding: "10px 22px",
              transform: `rotate(12deg) scale(${0.8 + overlayOpacity * 0.2})`,
            }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: `rgba(239,68,68,${overlayOpacity})` }}>PASS</span>
            </div>
          </div>
        )}

        {/* Sector badge */}
        <div style={{
          position: "absolute", top: 16, left: 16,
          background: `${sectorColor}33`, border: `1px solid ${sectorColor}55`,
          borderRadius: 50, padding: "5px 14px", fontSize: 12, fontWeight: 700,
          color: sectorColor, backdropFilter: "blur(10px)",
        }}>
          {company.sector}
        </div>

        {/* Fav indicator */}
        {isFav && (
          <div style={{ position: "absolute", top: 16, right: 16, background: "rgba(249,115,22,0.9)", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Heart size={16} fill="#fff" color="#fff" />
          </div>
        )}

        {/* Company name */}
        <div style={{ position: "absolute", bottom: 16, left: 20, right: 20 }}>
          <p style={{ fontSize: 26, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            {company.name}
            {company.is_verified && <span style={{ fontSize: 16, marginLeft: 8 }}>✓</span>}
          </p>
          {company.subsector && (
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 3 }}>{company.subsector}</p>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Rating */}
        {company.avg_rating > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ display: "flex", gap: 2 }}>
              {[1,2,3,4,5].map(n => (
                <Star key={n} size={16}
                  fill={n <= Math.round(company.avg_rating) ? "#f59e0b" : "transparent"}
                  color={n <= Math.round(company.avg_rating) ? "#f59e0b" : "#3a3a4a"}
                  strokeWidth={1.5}
                />
              ))}
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#f59e0b" }}>{Number(company.avg_rating).toFixed(1)}</span>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{company.review_count} avis</span>
          </div>
        )}

        {/* Info chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <Chip icon={<MapPin size={13} />} label={`${company.city}${company.canton ? `, ${company.canton}` : ""}`} />
          <Chip icon={<Users size={13} />} label={`${company.employee_range} emp.`} />
          {company.avg_salary_chf && (
            <Chip icon={<TrendingUp size={13} />} label={`CHF ${Math.round(company.avg_salary_chf / 1000)}k`} color="#10b981" />
          )}
        </div>

        {/* Description */}
        {company.description && (
          <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {company.description}
          </p>
        )}

        {/* Tags */}
        {company.tags?.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {company.tags.slice(0, 4).map(tag => (
              <span key={tag} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 50, background: "var(--surface3)", color: "var(--text-muted)" }}>#{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({ icon, label, color }: { icon: React.ReactNode; label: string; color?: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: color ?? "var(--text-muted)", background: "var(--surface2)", borderRadius: 8, padding: "4px 10px" }}>
      {icon} {label}
    </span>
  );
}

function ActionBtn({ children, color, onClick, disabled, small }: {
  children: React.ReactNode; color: string;
  onClick: () => void; disabled?: boolean; small?: boolean;
}) {
  const size = small ? 52 : 64;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: size, height: size, borderRadius: "50%",
        background: "var(--surface)", border: `2px solid ${color}44`,
        color, display: "flex", alignItems: "center", justifyContent: "center",
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
        transition: "all 0.2s", boxShadow: `0 4px 20px ${color}22`,
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = `${color}22`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--surface)"; }}
    >
      {children}
    </button>
  );
}
