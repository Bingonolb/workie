"use client";

import { useState, useTransition } from "react";
import { ThumbsUp } from "lucide-react";
import { voteHelpful } from "@/lib/actions/reviews";

export function HelpfulButton({ reviewId, initialCount }: { reviewId: string; initialCount: number }) {
  const [count, setCount] = useState(Number(initialCount)); // PostgREST returns NUMERIC as string
  const [voted, setVoted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    if (voted || isPending) return;
    const prev = count;
    setCount(c => c + 1);
    setVoted(true);
    startTransition(async () => {
      try {
        const result = await voteHelpful(reviewId);
        if (result?.error || result?.alreadyVoted) {
          setCount(prev);
          setVoted(result?.alreadyVoted ?? false);
        }
      } catch {
        setCount(prev);
        setVoted(false);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "5px 12px", borderRadius: 8,
        background: voted ? "rgba(139,92,246,0.08)" : "var(--surface2)",
        border: `1px solid ${voted ? "rgba(139,92,246,0.35)" : "var(--border2)"}`,
        color: voted ? "#8b5cf6" : "var(--text-muted)",
        fontSize: 12, fontWeight: 600,
        cursor: voted || isPending ? "default" : "pointer",
        opacity: isPending ? 0.6 : 1,
        transition: "all 0.15s",
      }}
    >
      <ThumbsUp size={13} fill={voted ? "#8b5cf6" : "none"} />
      {isPending ? "..." : "Utile"}
      {count > 0 && (
        <span style={{ color: "#8b5cf6", fontWeight: 700 }}>{count}</span>
      )}
    </button>
  );
}
