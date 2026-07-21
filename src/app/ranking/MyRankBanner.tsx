"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";

type RankData = {
  id: string;
  name: string;
  score: number;
  avg_rating: number;
  review_count: number;
  cover_url: string | null;
  rank: number;
  total: number;
} | null;

export function MyRankBanner() {
  const [data, setData] = useState<RankData>(undefined as unknown as RankData);

  useEffect(() => {
    fetch("/api/business/my-rank")
      .then(r => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  // undefined = loading (don't render anything yet), null = not a business account
  if (!data) return null;

  return (
    <Link href={`/company/${data.id}`} style={{ textDecoration: "none", display: "block", marginBottom: 24 }}>
      <div style={{
        background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(249,115,22,0.06))",
        border: "1.5px solid rgba(139,92,246,0.35)",
        borderRadius: 18,
        padding: "18px 20px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        flexWrap: "wrap",
      }}>
        {/* Logo */}
        <div style={{
          width: 48, height: 48, borderRadius: 12, overflow: "hidden", flexShrink: 0,
          background: "linear-gradient(135deg, rgba(139,92,246,0.25), rgba(249,115,22,0.15))",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {data.cover_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={data.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <Trophy size={22} color="#8b5cf6" />}
        </div>

        {/* Label + name */}
        <div style={{ flex: 1, minWidth: 140 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8b5cf6", marginBottom: 3 }}>
            Votre position dans le classement
          </p>
          <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.01em" }}>
            {data.name}
          </p>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            {data.avg_rating > 0
              ? `★ ${data.avg_rating.toFixed(1)} · ${data.review_count} avis · Score ${data.score}`
              : `Score ${data.score}`}
          </p>
        </div>

        {/* Rank badge */}
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <p style={{
            fontSize: 38, fontWeight: 900, letterSpacing: "-0.04em",
            background: "linear-gradient(135deg, #8b5cf6, #f97316)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            lineHeight: 1, fontVariantNumeric: "tabular-nums",
          }}>
            #{data.rank.toLocaleString("fr-CH")}
          </p>
          <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginTop: 3 }}>
            sur {data.total.toLocaleString("fr-CH")} entreprises
          </p>
        </div>
      </div>
    </Link>
  );
}
