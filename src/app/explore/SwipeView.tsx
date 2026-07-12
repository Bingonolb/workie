"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Star, MapPin, Users, TrendingUp, X, Flame, Info, Zap, Skull } from "lucide-react";
import { toggleFavorite } from "@/lib/actions/favorites";
import { addFlame, addBoost, addPenalty } from "@/lib/actions/scores";
import { fetchSwipePage } from "@/lib/actions/companies";
import type { Company } from "@/lib/types";
import { SECTOR_COLORS } from "@/lib/types";
import { GuestModal } from "@/components/GuestModal";
import { trackAdImpression, trackAdClick } from "@/lib/actions/ads";
import type { AdCampaign } from "@/lib/actions/ads";

const SWIPE_THRESHOLD = 90;
const PREFETCH_AHEAD = 25;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function SwipeView({
  companies: initialCompanies,
  initialFavIds,
  initialFlameIds,
  isLoggedIn,
  isAdmin = false,
  isBusiness = false,
  filters,
  swipeAds = [],
}: {
  companies: Company[];
  initialFavIds: string[];
  initialFlameIds: string[];
  isLoggedIn: boolean;
  isAdmin?: boolean;
  isBusiness?: boolean;
  filters?: { sector?: string; canton?: string; search?: string };
  swipeAds?: AdCampaign[];
}) {
  const router = useRouter();

  // Shuffle on first render so order varies per session
  const [companies, setCompanies] = useState<Company[]>(() => shuffle(initialCompanies));
  const [index, setIndex] = useState(0);
  const [favIds, setFavIds] = useState<Set<string>>(new Set(initialFavIds));
  const [flameIds, setFlameIds] = useState<Set<string>>(new Set(initialFlameIds));
  const [gone, setGone] = useState<"left" | "right" | null>(null);
  const [toast, setToast] = useState<{ msg: string; color: string } | null>(null);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [exhausted, setExhausted] = useState(false);
  const [adOverlay, setAdOverlay] = useState<AdCampaign | null>(null);
  // Next index at which to show a swipe ad — randomized so the interval feels natural
  const nextAdAt = useRef(10 + Math.floor(Math.random() * 6)); // first ad between swipe 10-15
  // Track all companies seen/acted on this session to avoid re-showing them in new batches
  const actedIds = useRef<Set<string>>(new Set([...initialFavIds, ...initialFlameIds]));

  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const [drag, setDrag] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  // Mirror mutable values in refs so touch event closures don't go stale
  const goneRef = useRef(gone);
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const advanceRef = useRef<(dir: "left" | "right") => void>(() => {});
  const currentRef = useRef<typeof companies[0] | undefined>(undefined);
  goneRef.current = gone;
  const swipeCountRef = useRef(0);
  const fetchingRef = useRef(false);
  const nextOffsetRef = useRef(initialCompanies.length);

  // Show swipe ad at a randomized interval (not a fixed cadence users can predict)
  useEffect(() => {
    if (swipeAds.length === 0 || index < nextAdAt.current) return;
    const ad = swipeAds[Math.floor(Math.random() * swipeAds.length)];
    setAdOverlay(ad);
    // Schedule the next ad 10-17 swipes from now
    nextAdAt.current = index + 10 + Math.floor(Math.random() * 8);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Bug 4 fix: track impression only after the overlay is actually committed to the DOM,
  // not at trigger time (avoids counting impressions that never render)
  useEffect(() => {
    if (adOverlay) trackAdImpression(adOverlay.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adOverlay]);

  // Prefetch next batch silently, well before the user reaches the end
  useEffect(() => {
    if (exhausted || fetchingRef.current) return;
    if (index < companies.length - PREFETCH_AHEAD) return;
    fetchingRef.current = true;
    fetchSwipePage(filters, nextOffsetRef.current).then(batch => {
      fetchingRef.current = false;
      if (batch.length === 0) { setExhausted(true); return; }
      nextOffsetRef.current += batch.length;
      // Filter out companies already acted on this session
      const fresh = shuffle(batch.filter(c => !actedIds.current.has(c.id)));
      if (fresh.length > 0) setCompanies(prev => [...prev, ...fresh]);
      if (batch.length < 50) setExhausted(true);
    }).catch(() => { fetchingRef.current = false; });
  }, [index, companies.length, filters, exhausted]);

  const current = companies[index];
  const next = companies[index + 1];
  currentRef.current = current;
  const totalSeen = index;

  const showToast = (msg: string, color: string) => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 1800);
  };

  const requireLogin = useCallback(() => setShowGuestModal(true), []);

  const markActed = (id: string) => actedIds.current.add(id);

  const advance = useCallback((dir: "left" | "right") => {
    if (!current || gone) return;
    if (!isLoggedIn && swipeCountRef.current >= 1) { requireLogin(); return; }
    if (!isLoggedIn) { swipeCountRef.current += 1; }
    markActed(current.id);
    setGone(dir);
    if (dir === "right" && isLoggedIn) {
      setFavIds(prev => { const n = new Set(prev); n.add(current.id); return n; });
      toggleFavorite(current.id);
      if (!isBusiness) {
        setFlameIds(prev => { const n = new Set(prev); n.add(current.id); return n; });
        addFlame(current.id);
      }
      showToast("🔥 Enregistré !", "#f97316");
    } else if (dir === "right") {
      showToast("👀 Découverte !", "#6b7280");
    } else {
      showToast("✕ Passé", "#ef4444");
    }
    setTimeout(() => { setIndex(i => i + 1); setGone(null); setDrag(0); }, 280);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, gone, isLoggedIn, requireLogin]);
  advanceRef.current = advance;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") advance("right");
      else if (e.key === "ArrowLeft") advance("left");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [advance]);

  const handleBoost = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) { requireLogin(); return; }
    if (!current) return;
    markActed(current.id);
    addBoost(current.id);
    showToast("⚡ +100 pts !", "#8b5cf6");
  };

  const handlePenalty = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) { requireLogin(); return; }
    if (!current) return;
    markActed(current.id);
    addPenalty(current.id);
    showToast("💀 -100 pts", "#ef4444");
  };

  // Native touch handlers — React touch events are passive by default on iOS,
  // meaning e.preventDefault() is ignored and the browser hijacks the gesture
  // as a scroll. We attach manually with { passive: false } to fix this.
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (goneRef.current) return;
      const t = e.touches[0];
      dragStart.current = { x: t.clientX, y: t.clientY };
      setIsDragging(true);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!dragStart.current || goneRef.current) return;
      const t = e.touches[0];
      const dx = t.clientX - dragStart.current.x;
      const dy = t.clientY - dragStart.current.y;
      if (Math.abs(dx) > Math.abs(dy)) {
        e.preventDefault();
        // Slight resistance makes it feel more physical
        setDrag(dx * 0.92);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!dragStart.current) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - dragStart.current.x;
      const dy = t.clientY - dragStart.current.y;
      dragStart.current = null;
      setIsDragging(false);
      if (Math.abs(dx) < 12 && Math.abs(dy) < 12) {
        const c = currentRef.current;
        if (c) router.push(`/company/${c.id}`);
        setDrag(0);
        return;
      }
      if (dx * 0.92 > SWIPE_THRESHOLD) advanceRef.current("right");
      else if (dx * 0.92 < -SWIPE_THRESHOLD) advanceRef.current("left");
      else setDrag(0);
    };

    // Android Chrome fires a synthetic click ~300ms after touchend.
    // We block it on the card to prevent double-navigation on tap.
    const onClickCapture = (e: MouseEvent) => {
      // Only block if the touch already handled navigation (dragStart is null = gesture completed)
      if (!dragStart.current) e.stopPropagation();
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("click", onClickCapture, { capture: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("click", onClickCapture, { capture: true });
    };
  // Re-attach when card changes (new company) so currentRef is always fresh
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Desktop mouse handlers (pointer events work fine without passive concern)
  const onMouseDown = (e: React.MouseEvent) => {
    if (gone) return;
    dragStart.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragStart.current || gone) return;
    setDrag((e.clientX - dragStart.current.x) * 0.92);
  };
  const onMouseUp = (e: React.MouseEvent) => {
    if (!dragStart.current) return;
    const dx = (e.clientX - dragStart.current.x) * 0.92;
    const dy = e.clientY - dragStart.current.y;
    dragStart.current = null;
    setIsDragging(false);
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) { setDrag(0); return; }
    if (dx > SWIPE_THRESHOLD) advance("right");
    else if (dx < -SWIPE_THRESHOLD) advance("left");
    else setDrag(0);
  };

  if (!current) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 500, gap: 16 }}>
        <div style={{ fontSize: 52 }}>🔥</div>
        <p style={{ fontSize: 22, fontWeight: 900, color: "var(--text)" }}>Tu as tout exploré !</p>
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>{totalSeen} entreprises découvertes</p>
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <button onClick={() => { setCompanies(shuffle(companies)); setIndex(0); setGone(null); setDrag(0); actedIds.current = new Set(); }} style={{ padding: "12px 24px", borderRadius: 50, background: "linear-gradient(135deg, #8b5cf6, #f97316)", color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer" }}>
            Recommencer
          </button>
          <a href="/ranking" style={{ padding: "12px 24px", borderRadius: 50, background: "var(--surface)", color: "var(--text)", fontWeight: 700, fontSize: 14, border: "1px solid var(--border2)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Flame size={14} fill="#f97316" color="#f97316" /> Classement
          </a>
        </div>
      </div>
    );
  }

  const rotate = drag / 14;
  const overlayOpacity = Math.min(Math.abs(drag) / SWIPE_THRESHOLD, 1);
  const isRight = drag > 20;
  const isLeft = drag < -20;

  return (
    <div className="swipe-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      {/* Card stack */}
      <div style={{ position: "relative", width: "min(420px, 96vw)", height: "min(500px, 56vh)", touchAction: "pan-y" }}>
        {/* Toast — top of card, smooth slide-in */}
        {toast && (
          <div key={toast.msg} style={{
            position: "absolute", top: 20, left: "50%",
            transform: "translateX(-50%)",
            background: toast.color, color: "#fff", fontWeight: 800, fontSize: 15,
            padding: "9px 26px", borderRadius: 50, zIndex: 10,
            boxShadow: `0 6px 24px ${toast.color}88`,
            animation: "toastSlide 1.8s cubic-bezier(0.34,1.56,0.64,1) forwards",
            whiteSpace: "nowrap", pointerEvents: "none",
          }}>
            {toast.msg}
          </div>
        )}
        {next && (
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
            transform: gone ? "scale(1) translateY(0)" : "scale(0.95) translateY(12px)",
            transition: gone ? "transform 0.28s cubic-bezier(0.34,1.2,0.64,1)" : "none",
          }}>
            <SwipeCard company={next} flameIds={flameIds} overlayDir={null} overlayOpacity={0} />
          </div>
        )}
        <div
          ref={cardRef}
          style={{
            position: "absolute", inset: 0, zIndex: 1,
            transform: gone
              ? `translateX(${gone === "right" ? 650 : -650}px) rotate(${gone === "right" ? 22 : -22}deg)`
              : `translateX(${drag}px) rotate(${rotate}deg)`,
            transition: isDragging
              ? "none"
              : gone
                ? "transform 0.26s cubic-bezier(0.4, 0, 1, 1)"
                : "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
            cursor: isDragging ? "grabbing" : "grab",
            touchAction: "pan-y",
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={e => { if (dragStart.current) onMouseUp(e as React.MouseEvent); }}
        >
          <SwipeCard
            company={current}
            flameIds={flameIds}
            overlayDir={isRight ? "right" : isLeft ? "left" : null}
            overlayOpacity={overlayOpacity}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
        {isAdmin && !isBusiness && (
          <button onClick={handlePenalty} title="Pénaliser -100 pts" style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
            width: 52, height: 52, borderRadius: "50%",
            background: "var(--surface)",
            border: "2px solid rgba(239,68,68,0.5)",
            color: "#ef4444", cursor: "pointer",
            boxShadow: "0 4px 20px rgba(239,68,68,0.15)",
            transition: "all 0.18s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.12)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
          >
            <Skull size={15} />
            <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.02em" }}>-100</span>
          </button>
        )}

        <button onClick={() => advance("left")} disabled={!!gone} style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "var(--surface)",
          border: "2px solid rgba(239,68,68,0.4)",
          color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center",
          cursor: gone ? "not-allowed" : "pointer", opacity: gone ? 0.45 : 1,
          boxShadow: "0 6px 24px rgba(239,68,68,0.15)",
          transition: "all 0.18s",
        }}
          onMouseEnter={e => { if (!gone) (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.1)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
        >
          <X size={26} strokeWidth={2.5} />
        </button>

        <button onClick={() => current && router.push(`/company/${current.id}`)} disabled={!!gone} style={{
          width: 46, height: 46, borderRadius: "50%",
          background: "var(--surface)",
          border: "2px solid rgba(99,102,241,0.45)",
          color: "#818cf8", display: "flex", alignItems: "center", justifyContent: "center",
          cursor: gone ? "not-allowed" : "pointer", opacity: gone ? 0.45 : 1,
          boxShadow: "0 4px 18px rgba(99,102,241,0.15)",
          transition: "all 0.18s",
        }}
          onMouseEnter={e => { if (!gone) (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.1)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
        >
          <Info size={18} strokeWidth={2} />
        </button>

        <button onClick={() => advance("right")} disabled={!!gone} style={{
          width: 64, height: 64, borderRadius: "50%",
          background: flameIds.has(current.id)
            ? "linear-gradient(135deg, #f97316, #ea580c)"
            : "var(--surface)",
          border: flameIds.has(current.id) ? "2px solid rgba(249,115,22,0.8)" : "2px solid rgba(249,115,22,0.4)",
          color: flameIds.has(current.id) ? "#fff" : "#f97316",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: gone ? "not-allowed" : "pointer", opacity: gone ? 0.45 : 1,
          boxShadow: flameIds.has(current.id) ? "0 6px 28px rgba(249,115,22,0.5)" : "0 6px 24px rgba(249,115,22,0.15)",
          transition: "all 0.18s",
        }}
          onMouseEnter={e => { if (!gone) (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.1)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
        >
          <Flame size={26} fill={flameIds.has(current.id) ? "#fff" : "none"} strokeWidth={2} />
        </button>

        {!isBusiness && <button onClick={handleBoost} title="Booster +100 pts" style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
          width: 52, height: 52, borderRadius: "50%",
          background: "var(--surface)",
          border: "2px solid rgba(139,92,246,0.5)",
          color: "#8b5cf6", cursor: "pointer",
          boxShadow: "0 4px 20px rgba(139,92,246,0.15)",
          transition: "all 0.18s",
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.12)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
        >
          <Zap size={15} fill="#8b5cf6" />
          <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.02em" }}>+100</span>
        </button>}
      </div>

      {/* Legend — hidden on mobile */}
      <div className="swipe-legend" style={{ flexDirection: "column", alignItems: "center", gap: 6 }}>
        <div style={{ display: "flex", gap: 20, fontSize: 12, color: "var(--text-muted)" }}>
          {isAdmin && <span>💀 <span style={{ color: "#ef4444", fontWeight: 700 }}>-100</span> pénalité</span>}
          <span>✕ passer</span>
          <span>ℹ détail</span>
          <span>🔥 sauvegarder</span>
          <span>⚡ <span style={{ color: "#8b5cf6", fontWeight: 700 }}>+100</span> boost</span>
        </div>
        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
          Swipe <span style={{ color: "#f97316", fontWeight: 700 }}>🔥 droite</span> pour sauvegarder · <span style={{ color: "#ef4444", fontWeight: 700 }}>✕ gauche</span> pour passer
          {" "}&nbsp;·{" "}<kbd style={{ fontSize: 10, padding: "1px 5px", borderRadius: 4, background: "var(--surface3)", border: "1px solid var(--border2)", color: "var(--text-muted)", fontFamily: "monospace" }}>←</kbd>{" "}<kbd style={{ fontSize: 10, padding: "1px 5px", borderRadius: 4, background: "var(--surface3)", border: "1px solid var(--border2)", color: "var(--text-muted)", fontFamily: "monospace" }}>→</kbd>
        </p>
      </div>

      {showGuestModal && !isLoggedIn && <GuestModal reviewCount={companies.length} open />}

      {/* Swipe ad overlay */}
      {adOverlay && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "24px 20px",
        }}>
          <div style={{
            width: "min(400px, 94vw)", background: "var(--surface)",
            borderRadius: 24, overflow: "hidden",
            boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
          }}>
            {/* Sponsored label */}
            <div style={{ background: "var(--surface2)", padding: "8px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Sponsorisé
              </span>
              <button onClick={() => setAdOverlay(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 18, padding: "0 4px" }}>
                ✕
              </button>
            </div>
            {/* Image */}
            <div style={{ position: "relative", paddingTop: "56%", overflow: "hidden" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={adOverlay.image_url} alt={adOverlay.headline}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            {/* Content */}
            <div style={{ padding: "20px 20px 24px" }}>
              <p style={{ fontSize: 20, fontWeight: 900, color: "var(--text)", lineHeight: 1.2, marginBottom: 8 }}>
                {adOverlay.headline}
              </p>
              {adOverlay.body_text && (
                <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 16 }}>
                  {adOverlay.body_text}
                </p>
              )}
              <div style={{ display: "flex", gap: 10 }}>
                <a
                  href={adOverlay.cta_url}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  onClick={() => { trackAdClick(adOverlay.id); setAdOverlay(null); }}
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 6, padding: "13px", borderRadius: 12,
                    background: "linear-gradient(135deg, #8b5cf6, #f97316)",
                    color: "#fff", fontWeight: 700, fontSize: 15, textDecoration: "none",
                  }}
                >
                  {adOverlay.cta_label}
                </a>
                <button onClick={() => setAdOverlay(null)}
                  style={{
                    padding: "13px 16px", borderRadius: 12, border: "1px solid var(--border2)",
                    background: "transparent", color: "var(--text-muted)", fontSize: 13,
                    fontWeight: 600, cursor: "pointer",
                  }}>
                  Ignorer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes toastSlide {
          0%   { opacity: 0; transform: translateX(-50%) translateY(-12px) scale(0.85); }
          18%  { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          75%  { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-6px) scale(0.95); }
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
    <div style={{ width: "100%", height: "100%", borderRadius: 28, overflow: "hidden", background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", userSelect: "none" }}>
      <div className="img-placeholder" style={{ height: "55%", position: "relative", overflow: "hidden" }}>
        {company.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={company.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${sectorColor}, #f97316)` }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.8))" }} />

        {overlayDir === "right" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: `rgba(249,115,22,${overlayOpacity * 0.35})` }}>
            <div style={{ border: `4px solid rgba(249,115,22,${overlayOpacity})`, borderRadius: 16, padding: "10px 22px", transform: `rotate(-12deg) scale(${0.8 + overlayOpacity * 0.2})` }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: `rgba(249,115,22,${overlayOpacity})` }}>🔥 SAVE</span>
            </div>
          </div>
        )}
        {overlayDir === "left" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: `rgba(239,68,68,${overlayOpacity * 0.35})` }}>
            <div style={{ border: `4px solid rgba(239,68,68,${overlayOpacity})`, borderRadius: 16, padding: "10px 22px", transform: `rotate(12deg) scale(${0.8 + overlayOpacity * 0.2})` }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: `rgba(239,68,68,${overlayOpacity})` }}>✕ PASS</span>
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
            {company.name}{company.is_verified && (
              <svg viewBox="0 0 22 22" style={{ display: "inline", verticalAlign: "middle", marginLeft: 7, width: 20, height: 20, flexShrink: 0 }} aria-label="Entreprise vérifiée">
                <circle cx="11" cy="11" r="11" fill="#1D9BF0" />
                <path d="M9.5 15.5l-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4z" fill="#fff" />
              </svg>
            )}
          </p>
          {company.subsector && <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 3 }}>{company.subsector}</p>}
        </div>
      </div>

      <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {company.avg_rating > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ display: "flex", gap: 2 }}>
              {[1,2,3,4,5].map(n => (
                <Star key={n} size={16} fill={n <= Math.round(company.avg_rating) ? "#f59e0b" : "transparent"} color={n <= Math.round(company.avg_rating) ? "#f59e0b" : "var(--border2)"} strokeWidth={1.5} />
              ))}
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#f59e0b" }}>{Number(company.avg_rating).toFixed(1)}</span>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{company.review_count} avis</span>
          </div>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <Chip icon={<MapPin size={12} />} label={`${company.city}${company.canton ? `, ${company.canton}` : ""}`} />
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
              <span key={tag} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 50, background: "var(--surface2)", color: "var(--text-muted)" }}>#{tag}</span>
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
