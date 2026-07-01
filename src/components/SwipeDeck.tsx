"use client";

import { useCallback, useRef, useState } from "react";
import { motion, useAnimation, type PanInfo } from "framer-motion";
import { Heart, RotateCcw, X, Zap } from "lucide-react";
import { WatchCard } from "@/components/WatchCard";
import { MatchModal } from "@/components/MatchModal";
import { recordSwipe, undoLastSwipe, fetchMoreWatches, type MatchResult } from "@/lib/actions/swipes";
import type { Watch } from "@/lib/types";

const SWIPE_THRESHOLD = 120;

export function SwipeDeck({
  initialWatches,
  filters,
}: {
  initialWatches: Watch[];
  filters?: { brand?: string; condition?: string };
}) {
  const [deck, setDeck] = useState<Watch[]>(initialWatches);
  const [history, setHistory] = useState<Watch[]>([]);
  const [match, setMatch] = useState<MatchResult | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const exhaustedRef = useRef(false);
  const controls = useAnimation();

  const topWatch = deck[0];

  const loadMoreIfNeeded = useCallback(
    async (remainingDeck: Watch[]) => {
      if (remainingDeck.length > 3 || exhaustedRef.current || loadingMore) return;
      setLoadingMore(true);
      const cursor = remainingDeck.length
        ? remainingDeck[remainingDeck.length - 1].created_at
        : new Date().toISOString();
      const res = await fetchMoreWatches(cursor, filters);
      if (res.watches.length === 0) exhaustedRef.current = true;
      setDeck((d) => [...d, ...res.watches.filter((w) => !d.some((x) => x.id === w.id))]);
      setLoadingMore(false);
    },
    [loadingMore, filters]
  );

  const swipe = useCallback(
    async (direction: "like" | "pass" | "superlike") => {
      if (!topWatch) return;
      const swiped = topWatch;
      setDeck((d) => {
        const rest = d.slice(1);
        loadMoreIfNeeded(rest);
        return rest;
      });
      setHistory((h) => [swiped, ...h].slice(0, 10));

      const res = await recordSwipe(swiped.id, direction);
      if (res.match) setMatch(res.match);
    },
    [topWatch, loadMoreIfNeeded]
  );

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD) {
      controls.start({ x: 500, opacity: 0, rotate: 20, transition: { duration: 0.3 } }).then(() => {
        controls.set({ x: 0, opacity: 1, rotate: 0 });
        swipe("like");
      });
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      controls.start({ x: -500, opacity: 0, rotate: -20, transition: { duration: 0.3 } }).then(() => {
        controls.set({ x: 0, opacity: 1, rotate: 0 });
        swipe("pass");
      });
    } else {
      controls.start({ x: 0, rotate: 0, transition: { type: "spring", stiffness: 300, damping: 25 } });
    }
  };

  const handleButton = (direction: "like" | "pass" | "superlike") => {
    const exitX = direction === "pass" ? -500 : 500;
    controls
      .start({ x: exitX, opacity: 0, rotate: direction === "pass" ? -20 : 20, transition: { duration: 0.3 } })
      .then(() => {
        controls.set({ x: 0, opacity: 1, rotate: 0 });
        swipe(direction);
      });
  };

  const handleRewind = async () => {
    const [last, ...rest] = history;
    if (!last) return;
    setHistory(rest);
    setDeck((d) => [last, ...d]);
    await undoLastSwipe(last.id);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[520px] w-full max-w-sm">
        {deck.length === 0 ? (
          <div className="flex h-full w-full flex-col items-center justify-center rounded-3xl bg-white text-center shadow-sm">
            <p className="text-lg font-semibold text-neutral-700">
              Plus de montres à découvrir pour l&apos;instant
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              Reviens plus tard, de nouvelles montres arrivent régulièrement.
            </p>
          </div>
        ) : (
          deck
            .slice(0, 3)
            .reverse()
            .map((w, i, arr) => {
              const isTop = i === arr.length - 1;
              return (
                <motion.div
                  key={w.id}
                  className="absolute inset-0"
                  style={{ zIndex: i }}
                  animate={
                    isTop
                      ? controls
                      : { scale: 1 - (arr.length - 1 - i) * 0.04, y: (arr.length - 1 - i) * 10 }
                  }
                  drag={isTop ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={isTop ? handleDragEnd : undefined}
                  whileDrag={{ rotate: 0 }}
                >
                  <WatchCard watch={w} />
                </motion.div>
              );
            })
        )}
      </div>

      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={handleRewind}
          disabled={history.length === 0}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-gold shadow-md transition hover:scale-105 disabled:opacity-40"
        >
          <RotateCcw size={20} />
        </button>
        <button
          onClick={() => handleButton("pass")}
          disabled={!topWatch}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-neutral-400 shadow-md transition hover:scale-105 hover:text-red-500 disabled:opacity-40"
        >
          <X size={28} />
        </button>
        <button
          onClick={() => handleButton("like")}
          disabled={!topWatch}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-brand shadow-md transition hover:scale-105 disabled:opacity-40"
        >
          <Heart size={28} fill="currentColor" />
        </button>
        <button
          onClick={() => handleButton("superlike")}
          disabled={!topWatch}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-gold shadow-md transition hover:scale-105 disabled:opacity-40"
        >
          <Zap size={20} fill="currentColor" />
        </button>
      </div>
      <p className="mt-4 max-w-xs text-center text-xs text-neutral-400">
        Swipe à droite si tu es intéressé, à gauche pour passer.
      </p>

      <MatchModal match={match} onClose={() => setMatch(null)} />
    </div>
  );
}
