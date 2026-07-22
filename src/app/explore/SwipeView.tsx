"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Star, MapPin, Users, TrendingUp, X, Flame, Info, Zap, Skull, ExternalLink } from "lucide-react";
import { toggleFavorite } from "@/lib/actions/favorites";
import { addBoost, addPenalty } from "@/lib/actions/scores";
import { fetchSwipePage } from "@/lib/actions/companies";
import type { Company } from "@/lib/types";
import { SECTOR_COLORS } from "@/lib/types";
import { GuestModal } from "@/components/GuestModal";
import { trackAdImpression, trackAdClick } from "@/lib/actions/ads";
import type { PublicAdCampaign } from "@/lib/actions/ads";

const SWIPE_THRESHOLD = 90;
const PREFETCH_AHEAD = 25;
const AD_SESSION_KEY = "workie_swipe_ad_shown";

type AdItem = { __ad: true; campaign: PublicAdCampaign };
type SwipeItem = Company | AdItem;
function isAd(item: SwipeItem | undefined): item is AdItem {
  return !!item && "__ad" in item;
}

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
  penaltyCredits: initialPenaltyCredits = 0,
  penaltySuccess = false,
  filters,
  swipeAds = [],
}: {
  companies: Company[];
  initialFavIds: string[];
  initialFlameIds: string[];
  isLoggedIn: boolean;
  isAdmin?: boolean;
  isBusiness?: boolean;
  penaltyCredits?: number;
  penaltySuccess?: boolean;
  filters?: { sector?: string; canton?: string; search?: string };
  swipeAds?: PublicAdCampaign[];
}) {
  const router = useRouter();

  // Build the initial deck: shuffle companies, then inject ONE ad card at a random position
  // (only if not already shown this browser session)
  const [companies, setCompanies] = useState<SwipeItem[]>(() => {
    const shuffled: SwipeItem[] = shuffle(initialCompanies);
    const alreadyShown = typeof window !== "undefined" && sessionStorage.getItem(AD_SESSION_KEY) === "1";
    if (swipeAds.length > 0 && !alreadyShown) {
      const pos = 5 + Math.floor(Math.random() * 8); // insert between position 5-12
      const campaign = swipeAds[Math.floor(Math.random() * swipeAds.length)];
      shuffled.splice(Math.min(pos, shuffled.length), 0, { __ad: true, campaign });
    }
    return shuffled;
  });
  const [index, setIndex] = useState(0);
  const [favIds, setFavIds] = useState<Set<string>>(new Set(initialFavIds));
  const [flameIds, setFlameIds] = useState<Set<string>>(new Set(initialFlameIds));
  const [penaltyIds, setPenaltyIds] = useState<Set<string>>(new Set());
  const [boostIds, setBoostIds] = useState<Set<string>>(new Set());
  const [penaltyCredits, setPenaltyCredits] = useState(initialPenaltyCredits);
  // true if user started the session with credits > 0 (i.e. has previously purchased)
  const hadCreditsOnMount = useRef(initialPenaltyCredits > 0);
  const [gone, setGone] = useState<"left" | "right" | null>(null);
  const [toast, setToast] = useState<{ msg: string; color: string } | null>(null);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showPenaltyUpgrade, setShowPenaltyUpgrade] = useState(false);
  const [penaltyCheckoutLoading, setPenaltyCheckoutLoading] = useState(false);
  const [penaltyCheckoutError, setPenaltyCheckoutError] = useState("");

  useEffect(() => {
    if (penaltySuccess) {
      setToast({ msg: "💀 Pass Pénalité activé ! Vous pouvez maintenant pénaliser les entreprises.", color: "#10b981" });
      // Clean the URL without reloading
      const url = new URL(window.location.href);
      url.searchParams.delete("penalty_success");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);
  const [exhausted, setExhausted] = useState(false);
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

  // Track impression when the ad card becomes the current card
  const current = companies[index];
  useEffect(() => {
    if (isAd(current)) trackAdImpression(current.campaign.id);
    else if (current) router.prefetch(`/company/${current.id}`);

    // Preload next card's cover image so it's ready before the swipe
    const nextItem = companies[index + 1];
    if (nextItem && !isAd(nextItem) && (nextItem as Company).cover_url) {
      const img = new window.Image();
      img.src = (nextItem as Company).cover_url!;
    }
    if (nextItem && isAd(nextItem) && nextItem.campaign.image_url) {
      const img = new window.Image();
      img.src = nextItem.campaign.image_url;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Prefetch next batch silently, well before the user reaches the end
  useEffect(() => {
    if (exhausted || fetchingRef.current) return;
    if (index < companies.length - PREFETCH_AHEAD) return;
    fetchingRef.current = true;
    fetchSwipePage(filters, nextOffsetRef.current).then(batch => {
      fetchingRef.current = false;
      if (batch.length === 0) { setExhausted(true); return; }
      nextOffsetRef.current += batch.length;
      const fresh = shuffle(batch.filter(c => !actedIds.current.has(c.id)));
      if (fresh.length > 0) setCompanies(prev => [...prev, ...fresh]);
      if (batch.length < 50) setExhausted(true);
    }).catch(() => { fetchingRef.current = false; });
  }, [index, companies.length, filters, exhausted]);

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

    // Ad card: swipe freely (no login gate), track click on right swipe
    if (isAd(current)) {
      sessionStorage.setItem(AD_SESSION_KEY, "1");
      if (dir === "right") {
        trackAdClick(current.campaign.id);
        window.open(current.campaign.cta_url, "_blank", "noopener,noreferrer");
      }
      setGone(dir);
      setTimeout(() => { setIndex(i => i + 1); setGone(null); setDrag(0); }, 280);
      return;
    }

    if (!isLoggedIn && swipeCountRef.current >= 1) { requireLogin(); setDrag(0); return; }
    if (!isLoggedIn) { swipeCountRef.current += 1; }
    markActed(current.id);
    setGone(dir);
    if (dir === "right" && isLoggedIn) {
      setFavIds(prev => { const n = new Set(prev); n.add((current as Company).id); return n; });
      // toggleFavorite now internally calls addFlame when saving — no separate addFlame call needed
      toggleFavorite((current as Company).id);
      if (!isBusiness) {
        setFlameIds(prev => { const n = new Set(prev); n.add((current as Company).id); return n; });
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
    if (isAd(current)) return;
    if (!isLoggedIn) { requireLogin(); return; }
    if (!current) return;
    const id = (current as Company).id;
    const toggled = boostIds.has(id);
    setBoostIds(prev => { const n = new Set(prev); toggled ? n.delete(id) : n.add(id); return n; });
    markActed(id);
    addBoost(id);
    showToast(toggled ? "⚡ Boost retiré" : "⚡ +100 pts !", "#8b5cf6");
  };

  const handlePenalty = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAd(current)) return;
    if (!isLoggedIn) { requireLogin(); return; }
    if (!current) return;
    if (!isAdmin && penaltyCredits <= 0) { setShowPenaltyUpgrade(true); return; }
    const id = (current as Company).id;
    const toggled = penaltyIds.has(id);
    setPenaltyIds(prev => { const n = new Set(prev); toggled ? n.delete(id) : n.add(id); return n; });
    if (!isAdmin) {
      const newCredits = toggled ? penaltyCredits + 1 : penaltyCredits - 1;
      setPenaltyCredits(newCredits);
      // Show recharge modal after a short delay so the toast is seen first
      if (newCredits === 0 && !toggled) {
        setTimeout(() => setShowPenaltyUpgrade(true), 1800);
      }
    }
    markActed(id);
    addPenalty(id);
    showToast(toggled ? "💀 Pénalité retirée" : "💀 -100 pts", "#ef4444");
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
        // If tap landed on a button, let the button handle it
        const target = e.target as HTMLElement;
        if (target.closest("button")) { setDrag(0); return; }
        const c = currentRef.current;
        if (c && isAd(c)) {
          trackAdClick(c.campaign.id);
          window.open(c.campaign.cta_url, "_blank", "noopener,noreferrer");
        } else if (c && !isAd(c)) {
          router.push(`/company/${c.id}`);
        }
        setDrag(0);
        return;
      }
      if (dx * 0.92 > SWIPE_THRESHOLD) advanceRef.current("right");
      else if (dx * 0.92 < -SWIPE_THRESHOLD) advanceRef.current("left");
      else setDrag(0);
    };

    // Android Chrome fires a synthetic click ~300ms after touchend.
    // We block it on the card to prevent double-navigation on tap.
    // Exception: let button clicks through so skull/boost/info/flame work.
    const onClickCapture = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("button")) return;
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
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {
      const c = currentRef.current;
      if (c && isAd(c)) {
        trackAdClick(c.campaign.id);
        window.open(c.campaign.cta_url, "_blank", "noopener,noreferrer");
      }
      setDrag(0);
      return;
    }
    if (dx > SWIPE_THRESHOLD) advance("right");
    else if (dx < -SWIPE_THRESHOLD) advance("left");
    else setDrag(0);
  };

  if (!current) {
    const realCount = companies.filter(c => !isAd(c)).length;
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 500, gap: 16 }}>
        <div style={{ fontSize: 52 }}>🔥</div>
        <p style={{ fontSize: 22, fontWeight: 900, color: "var(--text)" }}>Tu as tout exploré !</p>
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>{realCount} entreprises découvertes</p>
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <button type="button" onClick={() => { setCompanies(shuffle(companies.filter(c => !isAd(c)))); setIndex(0); setGone(null); setDrag(0); actedIds.current = new Set(); }} style={{ padding: "12px 24px", borderRadius: 50, background: "linear-gradient(135deg, #8b5cf6, #f97316)", color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer" }}>
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
            {isAd(next)
              ? <AdSwipeCard campaign={next.campaign} overlayDir={null} overlayOpacity={0} />
              : <SwipeCard company={next} flameIds={flameIds} overlayDir={null} overlayOpacity={0} />
            }
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
          {isAd(current)
            ? <AdSwipeCard campaign={current.campaign} overlayDir={isRight ? "right" : isLeft ? "left" : null} overlayOpacity={overlayOpacity} />
            : <SwipeCard company={current} flameIds={flameIds} overlayDir={isRight ? "right" : isLeft ? "left" : null} overlayOpacity={overlayOpacity} />
          }
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
        {isLoggedIn && !isBusiness && !isAd(current) && (() => {
          const unlocked = isAdmin || penaltyCredits > 0;
          const applied = !isAd(current) && penaltyIds.has((current as Company).id);
          return (
            <button type="button" onClick={handlePenalty} title={unlocked ? "Pénaliser -100 pts" : "Acheter 10 utilisations"} aria-label={unlocked ? "Pénaliser -100 pts" : "Acheter 10 utilisations"} style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
              width: 52, height: 52, borderRadius: "50%",
              background: applied ? "rgba(239,68,68,0.12)" : "var(--surface)",
              border: `2px solid ${unlocked ? (applied ? "rgba(239,68,68,0.9)" : "rgba(239,68,68,0.5)") : "rgba(107,114,128,0.3)"}`,
              color: unlocked ? "#ef4444" : "var(--text-muted)",
              cursor: "pointer",
              boxShadow: unlocked ? "0 4px 20px rgba(239,68,68,0.15)" : "none",
              transition: "all 0.18s",
              position: "relative",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.12)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
            >
              <Skull size={15} />
              <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.02em" }}>-100</span>
              {!isAdmin && penaltyCredits > 0 && (
                <span style={{ position: "absolute", top: -5, right: -5, minWidth: 16, height: 16, borderRadius: 8, background: "#ef4444", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 900, padding: "0 3px" }}>{penaltyCredits}</span>
              )}
              {!unlocked && (
                <span style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: "var(--surface2)", border: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9 }}>🔒</span>
              )}
            </button>
          );
        })()}

        <button type="button" onClick={() => advance("left")} disabled={!!gone} style={{
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

        <button type="button" onClick={() => !isAd(current) && current && router.push(`/company/${current.id}`)} disabled={!!gone || isAd(current)} style={{
          width: 48, height: 48, borderRadius: "50%",
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

        <button type="button" onClick={() => advance("right")} disabled={!!gone} style={{
          width: 64, height: 64, borderRadius: "50%",
          background: !isAd(current) && flameIds.has(current.id)
            ? "linear-gradient(135deg, #f97316, #ea580c)"
            : "var(--surface)",
          border: !isAd(current) && flameIds.has(current.id) ? "2px solid rgba(249,115,22,0.8)" : "2px solid rgba(249,115,22,0.4)",
          color: !isAd(current) && flameIds.has(current.id) ? "#fff" : "#f97316",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: gone ? "not-allowed" : "pointer", opacity: gone ? 0.45 : 1,
          boxShadow: !isAd(current) && flameIds.has(current.id) ? "0 6px 28px rgba(249,115,22,0.5)" : "0 6px 24px rgba(249,115,22,0.15)",
          transition: "all 0.18s",
        }}
          onMouseEnter={e => { if (!gone) (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.1)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
        >
          <Flame size={26} fill={!isAd(current) && flameIds.has(current.id) ? "#fff" : "none"} strokeWidth={2} />
        </button>

        {isLoggedIn && !isBusiness && !isAd(current) && (() => {
          const boosted = boostIds.has((current as Company).id);
          return (
            <button type="button" onClick={handleBoost} title={boosted ? "Retirer le boost" : "Booster +100 pts"} aria-label={boosted ? "Retirer le boost" : "Booster +100 pts"} style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
              width: 52, height: 52, borderRadius: "50%",
              background: boosted ? "rgba(139,92,246,0.12)" : "var(--surface)",
              border: `2px solid ${boosted ? "rgba(139,92,246,0.9)" : "rgba(139,92,246,0.5)"}`,
              color: "#8b5cf6", cursor: "pointer",
              boxShadow: "0 4px 20px rgba(139,92,246,0.15)",
              transition: "all 0.18s",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.12)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
            >
              <Zap size={15} fill="#8b5cf6" />
              <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.02em" }}>+100</span>
            </button>
          );
        })()}
      </div>

      {/* Legend — hidden on mobile */}
      <div className="swipe-legend" style={{ flexDirection: "column", alignItems: "center", gap: 6 }}>
        <div style={{ display: "flex", gap: 20, fontSize: 12, color: "var(--text-muted)" }}>
          {isLoggedIn && !isBusiness && <span>💀 <span style={{ color: "#ef4444", fontWeight: 700 }}>-100</span> pénalité</span>}
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

      {showGuestModal && !isLoggedIn && <GuestModal reviewCount={companies.filter(c => !isAd(c)).length} open />}

      {/* Penalty pass upgrade modal */}
      {showPenaltyUpgrade && (
        <>
          <div onClick={() => setShowPenaltyUpgrade(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", zIndex: 10010 }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 10011, width: "min(420px, 92vw)", background: "var(--surface)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 24, overflow: "hidden" }}>
            {/* Header band */}
            <div style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.12), rgba(249,115,22,0.08))", borderBottom: "1px solid rgba(239,68,68,0.15)", padding: "28px 28px 24px", textAlign: "center" }}>
              <div style={{ width: 60, height: 60, borderRadius: 18, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 26 }}>💀</div>
              <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.02em", color: "var(--text)", marginBottom: 6 }}>
                {penaltyCredits === 0 && hadCreditsOnMount.current && !isAdmin
                  ? <>Crédits épuisés <span style={{ color: "#ef4444" }}>-100 pts</span></>
                  : <>Bouton <span style={{ color: "#ef4444" }}>-100 pts</span> — pack 10 utilisations</>}
              </h2>
              <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
                {penaltyCredits === 0 && hadCreditsOnMount.current && !isAdmin
                  ? "Vous avez utilisé tous vos crédits. Rechargez pour continuer à signaler les entreprises toxiques."
                  : "Signalez les entreprises toxiques et impactez leur classement sur Workie."}
              </p>
            </div>

            {/* Body */}
            <div style={{ padding: "22px 28px 28px" }}>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 22px", display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  "10 utilisations — 1 CHF par entreprise",
                  "Impact direct sur leur score de réputation",
                  "1 pénalité max par entreprise (annulable)",
                  "Paiement sécurisé via Stripe",
                ].map(item => (
                  <li key={item} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--text)" }}>
                    <span style={{ width: 20, height: 20, borderRadius: 6, background: "rgba(16,185,129,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, color: "#10b981", fontWeight: 900 }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>

              {penaltyCheckoutError && (
                <p style={{ fontSize: 12, color: "#ef4444", textAlign: "center", marginBottom: 12, background: "rgba(239,68,68,0.06)", padding: "8px 12px", borderRadius: 8 }}>{penaltyCheckoutError}</p>
              )}

              <button
                disabled={penaltyCheckoutLoading}
                onClick={async () => {
                  setPenaltyCheckoutError("");
                  setPenaltyCheckoutLoading(true);
                  try {
                    const res = await fetch("/api/user/checkout-penalty", { method: "POST" });
                    const data = await res.json();
                    if (!res.ok || !data.url) {
                      setPenaltyCheckoutError(data.error ?? "Erreur lors de la création du paiement.");
                      return;
                    }
                    window.location.href = data.url;
                  } catch {
                    setPenaltyCheckoutError("Erreur réseau. Réessaie.");
                  } finally {
                    setPenaltyCheckoutLoading(false);
                  }
                }}
                style={{ width: "100%", padding: "15px 0", borderRadius: 12, background: penaltyCheckoutLoading ? "var(--surface2)" : "linear-gradient(135deg, #ef4444, #f97316)", color: penaltyCheckoutLoading ? "var(--text-muted)" : "#fff", border: "none", fontWeight: 800, fontSize: 15, cursor: penaltyCheckoutLoading ? "not-allowed" : "pointer", letterSpacing: "-0.01em" }}>
                {penaltyCheckoutLoading ? "Redirection vers Stripe…" : "10 utilisations · 10 CHF"}
              </button>
              <button type="button" onClick={() => setShowPenaltyUpgrade(false)} style={{ display: "block", width: "100%", background: "none", border: "none", fontSize: 13, color: "var(--text-muted)", cursor: "pointer", padding: "10px 0 0", textAlign: "center" }}>
                Pas maintenant
              </button>
            </div>
          </div>
        </>
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
      <div style={{ height: "55%", position: "relative", overflow: "hidden",
        background: company.cover_url
          ? `url(${company.cover_url}) center / cover no-repeat`
          : `linear-gradient(135deg, ${sectorColor}, #f97316)`,
      }}>
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

        <div style={{ position: "absolute", top: 16, left: 16, background: `${sectorColor}33`, border: `1px solid ${sectorColor}55`, borderRadius: 50, padding: "5px 14px", fontSize: 12, fontWeight: 700, color: sectorColor, backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}>
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
        {Number(company.avg_rating) > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ display: "flex", gap: 2 }}>
              {[1,2,3,4,5].map(n => (
                <Star key={n} size={16} fill={n <= Math.round(Number(company.avg_rating)) ? "#f59e0b" : "transparent"} color={n <= Math.round(Number(company.avg_rating)) ? "#f59e0b" : "var(--border2)"} strokeWidth={1.5} />
              ))}
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#f59e0b" }}>{Number(company.avg_rating).toFixed(1)}</span>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{company.review_count} avis</span>
          </div>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <Chip icon={<MapPin size={12} />} label={`${company.city}${company.canton ? `, ${company.canton}` : ""}`} />
          <Chip icon={<Users size={12} />} label={`${company.employee_range} emp.`} />
          {Number(company.avg_salary_chf) > 0 && <Chip icon={<TrendingUp size={12} />} label={`CHF ${Math.round(Number(company.avg_salary_chf) / 1000)}k`} color="#10b981" />}
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

function AdSwipeCard({ campaign, overlayDir, overlayOpacity }: {
  campaign: PublicAdCampaign;
  overlayDir: "left" | "right" | null;
  overlayOpacity: number;
}) {
  return (
    <div style={{ width: "100%", height: "100%", borderRadius: 28, overflow: "hidden", background: "var(--surface)", border: "2px solid rgba(139,92,246,0.5)", boxShadow: "0 20px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(139,92,246,0.15)", userSelect: "none", display: "flex", flexDirection: "column", cursor: "pointer" }}>
      {/* Image zone — same 55% as SwipeCard */}
      <div style={{ height: "55%", position: "relative", overflow: "hidden", flexShrink: 0,
        background: campaign.image_url
          ? `url(${campaign.image_url}) center / cover no-repeat`
          : "linear-gradient(135deg, #8b5cf6, #f97316)",
      }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.0) 20%, rgba(0,0,0,0.75))" }} />

        {/* Swipe overlays */}
        {overlayDir === "right" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: `rgba(139,92,246,${overlayOpacity * 0.35})` }}>
            <div style={{ border: `4px solid rgba(139,92,246,${overlayOpacity})`, borderRadius: 16, padding: "10px 22px", transform: `rotate(-12deg) scale(${0.8 + overlayOpacity * 0.2})` }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: `rgba(139,92,246,${overlayOpacity})` }}>↗ VOIR</span>
            </div>
          </div>
        )}
        {overlayDir === "left" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: `rgba(239,68,68,${overlayOpacity * 0.35})` }}>
            <div style={{ border: `4px solid rgba(239,68,68,${overlayOpacity})`, borderRadius: 16, padding: "10px 22px", transform: `rotate(12deg) scale(${0.8 + overlayOpacity * 0.2})` }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: `rgba(239,68,68,${overlayOpacity})` }}>✕ PASSER</span>
            </div>
          </div>
        )}

        {/* Sponsored badge — gradient, more visible */}
        <div style={{ position: "absolute", top: 14, left: 14, background: "linear-gradient(135deg, #8b5cf6, #f97316)", borderRadius: 50, padding: "4px 12px", display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: "0.12em" }}>⚡ Sponsorisé</span>
        </div>

        {/* Headline over image */}
        <div style={{ position: "absolute", bottom: 14, left: 18, right: 18 }}>
          <p style={{ fontSize: 26, fontWeight: 900, color: "#fff", letterSpacing: "-0.025em", lineHeight: 1.1, textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
            {campaign.headline}
          </p>
        </div>
      </div>

      {/* Content zone */}
      <div style={{ flex: 1, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10, justifyContent: "space-between" }}>
        {campaign.body_text && (
          <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {campaign.body_text}
          </p>
        )}
        {/* CTA button */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", borderRadius: 14, background: "linear-gradient(135deg, #8b5cf6, #f97316)", boxShadow: "0 4px 16px rgba(139,92,246,0.35)" }}>
          <ExternalLink size={15} color="#fff" />
          <span style={{ fontSize: 14, fontWeight: 800, color: "#fff", flex: 1, letterSpacing: "-0.01em" }}>{campaign.cta_label}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>Ouvrir →</span>
        </div>
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
