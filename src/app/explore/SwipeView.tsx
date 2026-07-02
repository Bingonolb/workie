"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Star, MapPin, Users, TrendingUp, X, Flame, Info, Zap, Skull } from "lucide-react";
import { toggleFavorite } from "@/lib/actions/favorites";
import { addFlame, addBoost, addPenalty } from "@/lib/actions/scores";
import type { Company } from "@/lib/types";
import { SECTOR_COLORS } from "@/lib/types";

const SWIPE_THRESHOLD = 90;

export function SwipeView({
  companies,
  initialFavIds,
  initialFlameIds,
  isLoggedIn,
}: {
  companies: Company[];
  initialFavIds: string[];
  initialFlameIds: string[];
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [favIds, setFavIds] = useState<Set<string>>(new Set(initialFavIds));
  const [flameIds, setFlameIds] = useState<Set<string>>(new Set(initialFlameIds));
  const [gone, setGone] = useState<"left" | "right" | null>(null);
  const [toast, setToast] = useState<{ msg: string; color: string } | null>(null);

  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const [drag, setDrag] = useState(0);

  const current = companies[index];
  const next = companies[index + 1];
  const total = companies.length;

  const showToast = (msg: string, color: string) => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 1800);
  };

  const requireLogin = () => { router.push("/login"); };

  const advance = useCallback((dir: "left" | "right") => {
    if (!current || gone) return;
    setGone(dir);
    if (dir === "right") {
      if (!isLoggedIn) { requireLogin(); return; }
      setFavIds(prev => { const n = new Set(prev); n.has(current.id) ? n.delete(current.id) : n.add(current.id); return n; });
      setFlameIds(prev => { const n = new Set(prev); n.has(current.id) ? n.delete(current.id) : n.add(current.id); return n; });
      toggleFavorite(current.id);
      addFlame(current.id);
      showToast("🔥 +1 flamme !", "#f97316");
    } else {
      showToast("⏭ Passé", "#6b7280");
    }
    setTimeout(() => { setIndex(i => i + 1); setGone(null); setDrag(0); }, 320);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, gone, isLoggedIn]);

  const handleBoost = () => {
    if (!isLoggedIn) { requireLogin(); return; }
    if (!current) return;
    addBoost(current.id);
    showToast("⚡ +100 pts !", "#8b5cf6");
  };

  const handlePenalty = () => {
    if (!isLoggedIn) { requireLogin(); return; }
    if (!current) return;
    addPenalty(current.id);
    showToast("💀 -100 pts", "#ef4444");
  };

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
        <div style={{ fontSize: 52 }}>🔥</div>
        <p style={{ fontSize: 22, fontWeight: 900, color: "var(--text)" }}>Tu as tout exploré !</p>
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>{total} entreprises vues</p>
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <button onClick={() => { setIndex(0); setGone(null); setDrag(0); }} style={{ padding: "12px 24px", borderRadius: 50, background: "linear-gradient(135deg, #8b5cf6, #f97316)", color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer" }}>
            Recommencer
          </button>
          <a href="/ranking" style={{ padding: "12px 24px", borderRadius: 50, background: "var(--surface)", color: "var(--text)", fontWeight: 700, fontSize: 14, border: "1px solid var(--border2)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Flame size={14} fill="#f97316" color="#f97316" /> Classement
          </a>
        </div>
      </div>
    );
  }

  const rotate = drag / 18;
  const overlayOpacity = Math.min(Math.abs(drag) / SWIPE_THRESHOLD, 1);
  const isRight = drag > 20;
  const isLeft = drag < -20;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 90, left: "50%", transform: "translateX(-50%)",
          background: toast.color, color: "#fff", fontWeight: 800, fontSize: 16,
          padding: "10px 28px", borderRadius: 50, zIndex: 100,
          boxShadow: `0 8px 32px ${toast.color}66`,
          animation: "fadeInOut 1.8s ease",
        }}>
          {toast.msg}
        </div>
      )}

      {/* Counter */}
      <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
        <span style={{ fontWeight: 700, color: "var(--text)" }}>{index + 1}</span> / {total}
      </p>

      {/* Card stack */}
      <div style={{ position: "relative", width: "min(440px, 92vw)", height: 590 }}>
        {next && (
          <div style={{ position: "absolute", inset: 0, transform: "scale(0.95) translateY(12px)", pointerEvents: "none", zIndex: 0 }}>
            <SwipeCard company={next} flameIds={flameIds} overlayDir={null} overlayOpacity={0} />
          </div>
        )}
        <div
          style={{
            position: "absolute", inset: 0, zIndex: 1,
            transform: gone
              ? `translateX(${gone === "right" ? 600 : -600}px) rotate(${gone === "right" ? 20 : -20}deg)`
              : `translateX(${drag}px) rotate(${rotate}deg)`,
            transition: dragStart.current ? "none" : "transform 0.32s cubic-bezier(0.4,0,0.2,1)",
            cursor: "grab", touchAction: "none",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={e => { if (dragStart.current) onPointerUp(e); }}
        >
          <SwipeCard
            company={current}
            flameIds={flameIds}
            overlayDir={isRight ? "right" : isLeft ? "left" : null}
            overlayOpacity={overlayOpacity}
          />
        </div>
      </div>

      {/* Special power buttons row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <PowerBtn color="#ef4444" onClick={handlePenalty} label="-100" icon={<Skull size={14} />} title="Pénaliser (-100 pts)" />
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <ActionBtn color="#6b7280" onClick={() => advance("left")} disabled={!!gone}><X size={24} /></ActionBtn>
          <ActionBtn color="#6366f1" onClick={() => current && router.push(`/company/${current.id}`)} disabled={!!gone} small><Info size={18} /></ActionBtn>
          <ActionBtn color="#f97316" onClick={() => advance("right")} disabled={!!gone}>
            <Flame size={24} fill={flameIds.has(current.id) ? "#f97316" : "none"} />
          </ActionBtn>
        </div>
        <PowerBtn color="#8b5cf6" onClick={handleBoost} label="+100" icon={<Zap size={14} />} title="Booster (+100 pts)" />
      </div>

      <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", lineHeight: 1.6 }}>
        Glisse à droite 🔥 pour sauvegarder · à gauche pour passer<br />
        ⚡ +100 boost · 💀 -100 pénalité · clique pour le détail
      </p>

      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateX(-50%) translateY(-8px); }
          15% { opacity: 1; transform: translateX(-50%) translateY(0); }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function SwipeCard({ company, flameIds, overlayDir, overlayOpacity }: {
  company: Company; flameIds: Set<string>;
  overlayDir: "left" | "right" | null; overlayOpacity: number;
}) {
  const sectorColor = SECTOR_COLORS[company.sector] ?? "#8b5cf6";
  const isFav = flameIds.has(company.id);

  return (
    <div style={{ width: "100%", height: "100%", borderRadius: 28, overflow: "hidden", background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)", userSelect: "none" }}>
      <div style={{ height: "55%", position: "relative", overflow: "hidden" }}>
        {company.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={company.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${sectorColor}, #f97316)` }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(13,13,19,0.1) 40%, rgba(13,13,19,0.9))" }} />

        {overlayDir === "right" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: `rgba(249,115,22,${overlayOpacity * 0.35})` }}>
            <div style={{ border: `4px solid rgba(249,115,22,${overlayOpacity})`, borderRadius: 16, padding: "10px 22px", transform: `rotate(-12deg) scale(${0.8 + overlayOpacity * 0.2})` }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: `rgba(249,115,22,${overlayOpacity})` }}>🔥 SAVE</span>
            </div>
          </div>
        )}
        {overlayDir === "left" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: `rgba(107,114,128,${overlayOpacity * 0.35})` }}>
            <div style={{ border: `4px solid rgba(107,114,128,${overlayOpacity})`, borderRadius: 16, padding: "10px 22px", transform: `rotate(12deg) scale(${0.8 + overlayOpacity * 0.2})` }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: `rgba(200,200,200,${overlayOpacity})` }}>PASS</span>
            </div>
          </div>
        )}

        <div style={{ position: "absolute", top: 16, left: 16, background: `${sectorColor}33`, border: `1px solid ${sectorColor}55`, borderRadius: 50, padding: "5px 14px", fontSize: 12, fontWeight: 700, color: sectorColor, backdropFilter: "blur(10px)" }}>
          {company.sector}
        </div>
        {isFav && (
          <div style={{ position: "absolute", top: 16, right: 16, background: "rgba(249,115,22,0.9)", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Flame size={16} fill="#fff" color="#fff" />
          </div>
        )}
        <div style={{ position: "absolute", bottom: 16, left: 20, right: 20 }}>
          <p style={{ fontSize: 26, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            {company.name}{company.is_verified && <span style={{ fontSize: 16, marginLeft: 8 }}>✓</span>}
          </p>
          {company.subsector && <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 3 }}>{company.subsector}</p>}
        </div>
      </div>

      <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {company.avg_rating > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ display: "flex", gap: 2 }}>
              {[1,2,3,4,5].map(n => (
                <Star key={n} size={16} fill={n <= Math.round(company.avg_rating) ? "#f59e0b" : "transparent"} color={n <= Math.round(company.avg_rating) ? "#f59e0b" : "#3a3a4a"} strokeWidth={1.5} />
              ))}
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#f59e0b" }}>{Number(company.avg_rating).toFixed(1)}</span>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{company.review_count} avis</span>
          </div>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <Chip icon={<MapPin size={12} />} label={`${company.city}${(company as any).canton ? `, ${(company as any).canton}` : ""}`} />
          <Chip icon={<Users size={12} />} label={`${company.employee_range} emp.`} />
          {company.avg_salary_chf && <Chip icon={<TrendingUp size={12} />} label={`CHF ${Math.round(company.avg_salary_chf / 1000)}k`} color="#10b981" />}
        </div>
        {company.description && (
          <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {company.description}
          </p>
        )}
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
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: color ?? "var(--text-muted)", background: "var(--surface2)", borderRadius: 8, padding: "4px 10px" }}>
      {icon} {label}
    </span>
  );
}

function ActionBtn({ children, color, onClick, disabled, small }: { children: React.ReactNode; color: string; onClick: () => void; disabled?: boolean; small?: boolean }) {
  const size = small ? 50 : 62;
  return (
    <button onClick={onClick} disabled={disabled} style={{ width: size, height: size, borderRadius: "50%", background: "var(--surface)", border: `2px solid ${color}55`, color, display: "flex", alignItems: "center", justifyContent: "center", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, transition: "all 0.2s", boxShadow: `0 4px 20px ${color}22` }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = `${color}22`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--surface)"; }}
    >
      {children}
    </button>
  );
}

function PowerBtn({ color, onClick, label, icon, title }: { color: string; onClick: () => void; label: string; icon: React.ReactNode; title: string }) {
  return (
    <button onClick={onClick} title={title} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "8px 14px", borderRadius: 14, background: `${color}15`, border: `1px solid ${color}44`, color, cursor: "pointer", transition: "all 0.2s" }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${color}30`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = `${color}15`; }}
    >
      {icon}
      <span style={{ fontSize: 11, fontWeight: 800 }}>{label}</span>
    </button>
  );
}
