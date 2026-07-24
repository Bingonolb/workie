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
  rank: number | null;
  total: number;
  ranked_count: number;
};

type LoadState = "loading" | "none" | RankData;

export function MyRankBanner() {
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    fetch("/api/business/my-rank")
      .then(r => r.json())
      .then(d => setState(d ?? "none"))
      .catch(() => setState("none"));
  }, []);

  if (state === "none") return null;

  if (state === "loading") {
    return (
      <div style={{
        height: 76, borderRadius: 18, marginBottom: 24,
        background: "var(--surface2)", border: "1px solid var(--border)",
        animation: "pulse 1.5s ease-in-out infinite",
      }}>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
      </div>
    );
  }

  const data = state;

  return (
    <>
      <style>{`
        .my-rank-banner {
          display: flex;
          align-items: center;
          gap: 14px;
          background: linear-gradient(135deg, rgba(139,92,246,0.08), rgba(249,115,22,0.06));
          border: 1.5px solid rgba(139,92,246,0.35);
          border-radius: 18px;
          padding: 16px 18px;
          margin-bottom: 24px;
          text-decoration: none;
        }
        .my-rank-banner:hover { border-color: rgba(139,92,246,0.55); }
        .my-rank-info { flex: 1; min-width: 0; }
        .my-rank-label { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #8b5cf6; margin-bottom: 2px; }
        .my-rank-name { font-size: 14px; font-weight: 800; color: var(--text); letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .my-rank-meta { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
        .my-rank-badge { flex-shrink: 0; text-align: right; }
        .my-rank-number {
          font-size: 36px; font-weight: 900; letter-spacing: -0.04em;
          background: linear-gradient(135deg, #8b5cf6, #f97316);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          line-height: 1; font-variant-numeric: tabular-nums;
        }
        .my-rank-sub { font-size: 10px; color: var(--text-muted); font-weight: 600; margin-top: 2px; }
        .my-rank-unclassed { font-size: 13px; font-weight: 800; color: var(--text-muted); line-height: 1.3; }
        .my-rank-unclassed-sub { font-size: 10px; color: var(--text-muted); font-weight: 500; margin-top: 3px; max-width: 120px; text-align: right; line-height: 1.4; }
        @media (max-width: 400px) {
          .my-rank-banner { padding: 12px 14px; gap: 10px; }
          .my-rank-number { font-size: 28px; }
          .my-rank-logo { width: 38px !important; height: 38px !important; }
        }
      `}</style>

      <Link href={`/company/${data.id}`} className="my-rank-banner">
        {/* Logo */}
        <div className="my-rank-logo" style={{
          width: 44, height: 44, borderRadius: 11, overflow: "hidden", flexShrink: 0,
          background: "linear-gradient(135deg, rgba(139,92,246,0.25), rgba(249,115,22,0.15))",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {data.cover_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={data.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <Trophy size={20} color="#8b5cf6" aria-hidden="true" />}
        </div>

        {/* Info */}
        <div className="my-rank-info">
          <p className="my-rank-label">Votre position</p>
          <p className="my-rank-name">{data.name}</p>
          <p className="my-rank-meta">
            {data.avg_rating > 0
              ? `★ ${data.avg_rating.toFixed(1)} · ${data.review_count} avis · Score ${data.score}`
              : `Score ${data.score}`}
          </p>
        </div>

        {/* Badge */}
        <div className="my-rank-badge">
          {data.rank !== null ? (
            <>
              <p className="my-rank-number">#{data.rank.toLocaleString("fr-CH")}</p>
              <p className="my-rank-sub">sur {data.total.toLocaleString("fr-CH")} entreprises</p>
            </>
          ) : (
            <>
              <p className="my-rank-unclassed">Non classée</p>
              <p className="my-rank-unclassed-sub">Obtenez des avis pour entrer dans le classement</p>
            </>
          )}
        </div>
      </Link>
    </>
  );
}
