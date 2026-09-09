"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { trackAdImpression, trackAdClick } from "@/lib/actions/ads";
import { ReportButton } from "@/components/ReportButton";
import type { PublicAdCampaign } from "@/lib/actions/ads";

// Max times a given ad can appear per session before hiding itself entirely
const FREQ_CAP = 2;

function getFreqCount(campaignId: string): number {
  try { return parseInt(sessionStorage.getItem(`ad_freq_${campaignId}`) ?? "0", 10); }
  catch { return 0; }
}

function incrementFreqCap(campaignId: string) {
  try {
    const key = `ad_freq_${campaignId}`;
    sessionStorage.setItem(key, String(getFreqCount(campaignId) + 1));
  } catch { /* */ }
}

/**
 * Retire l'annonce pour le reste de la session.
 *
 * Le plafond de fréquence sert déjà à ne plus montrer une annonce vue deux
 * fois : le signalement s'y branche plutôt que d'inventer un second mécanisme.
 * Le geste vaut donc aussi pour les autres pages, et pas seulement pour la
 * carte qu'on avait sous les yeux.
 */
function masquerPourLaSession(campaignId: string) {
  try { sessionStorage.setItem(`ad_freq_${campaignId}`, String(FREQ_CAP + 1)); }
  catch { /* */ }
}

export function AdSquareCard({ ad }: { ad: PublicAdCampaign }) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  // Le plafond de frequence est lu au premier rendu, et non dans un effet.
  //
  // Dans un effet, la carte n'existait pas au premier rendu puis apparaissait
  // juste apres, ce qui poussait vers le bas toutes les cartes suivantes de la
  // grille. La lecture peut se faire tout de suite : la page ne rend aucune
  // publicite cote serveur, donc ce composant n'est monte que dans le
  // navigateur, ou sessionStorage est disponible.
  const [visible, setVisible] = useState<boolean>(
    () => (typeof window === "undefined" ? true : getFreqCount(ad.id) < FREQ_CAP),
  );

  useEffect(() => {
    if (!visible) return;
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
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, ad.id]);

  // Plafond atteint, ou annonce signalée : la carte ne prend aucune place.
  if (!visible) return null;

  return (
    <div style={{ position: "relative", display: "flex" }}>
    <a
      ref={cardRef}
      href={ad.cta_url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      aria-label={`Publicité : ${ad.headline}`}
      onClick={() => trackAdClick(ad.id)}
      style={{
        flex: 1, minWidth: 0,
        background: "var(--surface)",
        border: "1px solid rgba(139,92,246,0.25)",
        borderRadius: 20,
        overflow: "hidden",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        textDecoration: "none",
        cursor: "pointer",
      }}
    >
      {/* Sponsored label */}
      <div style={{
        position: "absolute", top: 12, left: 12, zIndex: 2,
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        borderRadius: 50, padding: "3px 10px",
        fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.75)",
        letterSpacing: "0.06em", textTransform: "uppercase",
      }}>
        Sponsorisé
      </div>

      {/* Image */}
      <div style={{ position: "relative", paddingTop: "60%", overflow: "hidden", flexShrink: 0 }}>
        <Image
          src={ad.image_url}
          alt={ad.headline}
          fill
          sizes="(max-width: 640px) calc(50vw - 24px), 280px"
          style={{ objectFit: "cover" }}
          priority
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
        <div
          style={{
            marginTop: 4,
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "9px 16px", borderRadius: 10,
            background: "var(--brand)",
            color: "#fff", fontWeight: 700, fontSize: 13,
            alignSelf: "flex-start",
          }}
        >
          {ad.cta_label} <ExternalLink size={12} aria-hidden="true" />
        </div>
      </div>
    </a>

      {/* Le signalement, posé sur la carte sans être dedans.
          La carte est un lien : un bouton imbriqué dans un lien est du
          balisage invalide, et son clic partirait aussi vers le site de
          l'annonceur. */}
      {/* Le drapeau seul, sans pastille sombre derrière.
          Le carré noir se voyait plus que l'annonce et coupait la photo dans
          son angle. La lisibilité sur un fond clair vient d'une ombre portée
          sur le trait, qui ne dessine aucune forme. */}
      <style>{`
        .pub-signaler svg { color: #fff !important; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.55)); }
        .pub-signaler button { background: transparent !important; }
        .pub-signaler button:hover svg { color: #fca5a5 !important; }
      `}</style>
      <div className="pub-signaler" style={{ position: "absolute", top: 6, right: 6, zIndex: 3 }}>
        <ReportButton
          targetType="ad_campaign"
          targetId={ad.id}
          targetLabel={ad.headline}
          variant="icon"
          onReported={() => { masquerPourLaSession(ad.id); setVisible(false); }}
        />
      </div>
    </div>
  );
}
