"use client";

import { useCallback, useRef, useState } from "react";
import { motion, useAnimation, type PanInfo } from "framer-motion";
import { Heart, RotateCcw, X, Zap } from "lucide-react";
import { WatchCard } from "@/components/WatchCard";
import { MatchModal } from "@/components/MatchModal";
import { recordSwipe, undoLastSwipe, fetchMoreWatches, type MatchResult } from "@/lib/actions/swipes";
import type { Watch } from "@/lib/types";

const SWIPE_THRESHOLD = 100;

export function SwipeDeck({ initialWatches, filters }: { initialWatches: Watch[]; filters?: { brand?: string; condition?: string } }) {
  const [deck, setDeck] = useState<Watch[]>(initialWatches);
  const [history, setHistory] = useState<Watch[]>([]);
  const [match, setMatch] = useState<MatchResult | null>(null);
  const [hint, setHint] = useState<"like" | "pass" | null>(null);
  const loadingRef = useRef(false);
  const exhaustedRef = useRef(false);
  const controls = useAnimation();

  const topWatch = deck[0];
  const nextWatch = deck[1];

  const loadMore = useCallback(async (remaining: Watch[]) => {
    if (remaining.length > 3 || exhaustedRef.current || loadingRef.current) return;
    loadingRef.current = true;
    const cursor = remaining.at(-1)?.created_at ?? new Date().toISOString();
    const res = await fetchMoreWatches(cursor, filters);
    if (res.watches.length === 0) exhaustedRef.current = true;
    setDeck(d => [...d, ...res.watches.filter(w => !d.some(x => x.id === w.id))]);
    loadingRef.current = false;
  }, [filters]);

  const swipe = useCallback(async (direction: "like" | "pass" | "superlike") => {
    if (!topWatch) return;
    const swiped = topWatch;
    setDeck(d => { const rest = d.slice(1); loadMore(rest); return rest; });
    setHistory(h => [swiped, ...h].slice(0, 10));
    setHint(null);
    const res = await recordSwipe(swiped.id, direction);
    if (res.match) setMatch(res.match);
  }, [topWatch, loadMore]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    setHint(null);
    if (info.offset.x > SWIPE_THRESHOLD) {
      controls.start({ x: 700, opacity: 0, rotate: 20, transition: { duration: 0.25 } }).then(() => {
        controls.set({ x: 0, opacity: 1, rotate: 0 });
        swipe("like");
      });
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      controls.start({ x: -700, opacity: 0, rotate: -20, transition: { duration: 0.25 } }).then(() => {
        controls.set({ x: 0, opacity: 1, rotate: 0 });
        swipe("pass");
      });
    } else {
      controls.start({ x: 0, rotate: 0, transition: { type: "spring", stiffness: 400, damping: 32 } });
    }
  };

  const handleButton = (direction: "like" | "pass" | "superlike") => {
    const x = direction === "pass" ? -700 : 700;
    controls.start({ x, opacity: 0, rotate: direction === "pass" ? -20 : 20, transition: { duration: 0.25 } })
      .then(() => { controls.set({ x: 0, opacity: 1, rotate: 0 }); swipe(direction); });
  };

  const handleRewind = async () => {
    const [last, ...rest] = history;
    if (!last) return;
    setHistory(rest);
    setDeck(d => [last, ...d]);
    await undoLastSwipe(last.id);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
      {/* Card */}
      <div style={{ position: "relative", width: "100%", maxWidth: 420, height: 580 }}>
        {deck.length === 0 ? (
          <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 20, background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", textAlign: "center", padding: 32 }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: "#111", marginBottom: 8 }}>C&apos;est tout !</p>
            <p style={{ fontSize: 14, color: "#888" }}>Reviens plus tard, de nouvelles montres arrivent régulièrement.</p>
          </div>
        ) : (
          <>
            {nextWatch && (
              <div style={{ position: "absolute", inset: 0, transform: "scale(0.95) translateY(14px)", borderRadius: 20, overflow: "hidden", pointerEvents: "none", opacity: 0.6 }}>
                <WatchCard watch={nextWatch} />
              </div>
            )}
            <motion.div
              key={topWatch.id}
              style={{ position: "absolute", inset: 0, zIndex: 10 }}
              animate={controls}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.85}
              onDrag={(_, info) => {
                if (info.offset.x > 40) setHint("like");
                else if (info.offset.x < -40) setHint("pass");
                else setHint(null);
              }}
              onDragEnd={handleDragEnd}
            >
              {hint === "like" && (
                <div style={{ position: "absolute", inset: 0, zIndex: 20, borderRadius: 20, border: "3px solid #4cde8f", display: "flex", alignItems: "flex-start", padding: 18, pointerEvents: "none" }}>
                  <span style={{ background: "#4cde8f", color: "#fff", fontWeight: 900, fontSize: 24, padding: "4px 14px", borderRadius: 6, transform: "rotate(-12deg)", boxShadow: "0 2px 8px rgba(76,222,143,0.4)" }}>LIKE</span>
                </div>
              )}
              {hint === "pass" && (
                <div style={{ position: "absolute", inset: 0, zIndex: 20, borderRadius: 20, border: "3px solid #e8445a", display: "flex", alignItems: "flex-start", justifyContent: "flex-end", padding: 18, pointerEvents: "none" }}>
                  <span style={{ background: "#e8445a", color: "#fff", fontWeight: 900, fontSize: 24, padding: "4px 14px", borderRadius: 6, transform: "rotate(12deg)", boxShadow: "0 2px 8px rgba(232,68,90,0.4)" }}>PASSER</span>
                </div>
              )}
              <WatchCard watch={topWatch} onSwipe={dir => handleButton(dir)} />
            </motion.div>
          </>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 28 }}>
        <button onClick={handleRewind} disabled={history.length === 0}
          style={{ width: 52, height: 52, borderRadius: "50%", background: "#fff", border: "1.5px solid #e8e8e8", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", color: "#f5a623", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: history.length === 0 ? 0.35 : 1, transition: "all 0.15s" }}>
          <RotateCcw size={20} />
        </button>
        <button onClick={() => handleButton("pass")} disabled={!topWatch}
          style={{ width: 64, height: 64, borderRadius: "50%", background: "#fff", border: "1.5px solid #e8e8e8", boxShadow: "0 4px 16px rgba(232,68,90,0.2)", color: "#e8445a", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: !topWatch ? 0.35 : 1, transition: "all 0.15s" }}>
          <X size={28} strokeWidth={2.5} />
        </button>
        <button onClick={() => handleButton("like")} disabled={!topWatch}
          style={{ width: 64, height: 64, borderRadius: "50%", background: "#fff", border: "1.5px solid #e8e8e8", boxShadow: "0 4px 16px rgba(76,222,143,0.25)", color: "#4cde8f", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: !topWatch ? 0.35 : 1, transition: "all 0.15s" }}>
          <Heart size={28} fill="currentColor" />
        </button>
        <button onClick={() => handleButton("superlike")} disabled={!topWatch}
          style={{ width: 52, height: 52, borderRadius: "50%", background: "#fff", border: "1.5px solid #e8e8e8", boxShadow: "0 4px 12px rgba(145,107,244,0.2)", color: "#916bf4", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: !topWatch ? 0.35 : 1, transition: "all 0.15s" }}>
          <Zap size={20} fill="currentColor" />
        </button>
      </div>

      <p style={{ marginTop: 14, fontSize: 12, color: "#aaa", textAlign: "center" }}>
        Swipe vers la droite si tu es intéressé · Swipe vers la gauche pour passer
      </p>

      <MatchModal match={match} onClose={() => setMatch(null)} />
    </div>
  );
}
