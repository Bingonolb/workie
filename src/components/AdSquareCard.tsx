"use client";

import { useEffect, useRef } from "react";
import { ExternalLink } from "lucide-react";
import { trackAdImpression, trackAdClick } from "@/lib/actions/ads";
import type { AdCampaign } from "@/lib/actions/ads";

const FREQ_CAP = 3; // max impressions per campaign per session

function hasHitFreqCap(campaignId: string): boolean {
  try {
    const key = `ad_freq_${campaignId}`;
    const count = parseInt(sessionStorage.getItem(key) ?? "0", 10);
    return count >= FREQ_CAP;
  } catch { return false; }
}

function incrementFreqCap(campaignId: string) {
  try {
    const key = `ad_freq_${campaignId}`;
    const count = parseInt(sessionStorage.getItem(key) ?? "0", 10);
    sessionStorage.setItem(key, String(count + 1));
  } catch { /* */ }
}

export function AdSquareCard({ ad }: { ad: AdCampaign }) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasHitFreqCap(ad.id)) return;
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          incrementFreqCap(ad.id);
          trackAdImpression(ad.id);
        }
      },
      { threshold: 0.5 } // at least 50% visible before counting
    );
    observer.observe(el);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ad.id]);

  return (
    <div ref={cardRef} style={{
      background: "var(--surface)",
      border: "1px solid rgba(139,92,246,0.25)",
      borderRadius: 20,
      overflow: "hidden",
      position: "relative",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Sponsored label */}
      <div style={{
        position: "absolute", top: 12, left: 12, zIndex: 2,
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
        borderRadius: 50, padding: "3px 10px",
        fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.75)",
        letterSpacing: "0.06em", textTransform: "uppercase",
      }}>
        Sponsorisé
      </div>

      {/* Image */}
      <div style={{ position: "relative", paddingTop: "60%", overflow: "hidden", flexShrink: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ad.image_url}
          alt={ad.headline}
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover",
          }}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.7))",
        }} />
      </div>

      {/* Content */}
      <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", lineHeight: 1.25 }}>
          {ad.headline}
        </p>
        {ad.body_text && (
          <p style={{
            fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {ad.body_text}
          </p>
        )}
        <a
          href={ad.cta_url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={() => trackAdClick(ad.id)}
          style={{
            marginTop: 4,
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "9px 16px", borderRadius: 10,
            background: "linear-gradient(135deg, #8b5cf6, #f97316)",
            color: "#fff", fontWeight: 700, fontSize: 13,
            textDecoration: "none", alignSelf: "flex-start",
          }}
        >
          {ad.cta_label} <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}
