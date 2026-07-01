"use client";

import { useState } from "react";
import { MapPin, BadgeCheck, FileCheck, Package, ChevronUp, ChevronDown, Shield, X } from "lucide-react";
import type { Watch } from "@/lib/types";
import { CONDITION_LABELS } from "@/lib/types";

export function WatchCard({ watch, onSwipe }: { watch: Watch; onSwipe?: (dir: "like" | "pass") => void }) {
  const [showProfile, setShowProfile] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const photos = watch.photos ?? [];
  const photo = photos[photoIndex] ?? null;

  function handleTap(e: React.MouseEvent<HTMLDivElement>) {
    if (showProfile) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (photos.length > 1) {
      if (x > rect.width * 0.6) setPhotoIndex(i => Math.min(i + 1, photos.length - 1));
      else if (x < rect.width * 0.4) setPhotoIndex(i => Math.max(i - 1, 0));
    }
  }

  return (
    <div
      onClick={handleTap}
      style={{
        position: "relative",
        height: "100%",
        width: "100%",
        borderRadius: 24,
        overflow: "hidden",
        background: "#111116",
        boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      {/* Photo */}
      {photo ? (
        <img
          src={photo}
          alt={`${watch.brand} ${watch.model}`}
          draggable={false}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            pointerEvents: "none",
          }}
        />
      ) : (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#6b6b78", fontSize: 14 }}>
          Pas de photo
        </div>
      )}

      {/* Photo dots */}
      {photos.length > 1 && (
        <div style={{ position: "absolute", top: 12, left: 0, right: 0, display: "flex", gap: 4, padding: "0 16px" }}>
          {photos.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i === photoIndex ? "#fff" : "rgba(255,255,255,0.3)",
              transition: "background 0.2s",
            }} />
          ))}
        </div>
      )}

      {/* Gradient overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.3) 40%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Bottom info */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 20px 24px", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              {watch.brand}
            </p>
            <p style={{ fontSize: 15, fontWeight: 500, color: "rgba(255,255,255,0.85)", marginTop: 2 }}>
              {watch.model}{watch.year ? ` · ${watch.year}` : ""}
            </p>
            {(watch.city || watch.country) && (
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                <MapPin size={11} style={{ display: "inline" }} />
                {[watch.city, watch.country].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
          <button
            onClick={e => { e.stopPropagation(); setShowProfile(s => !s); }}
            style={{
              width: 40, height: 40, borderRadius: "50%",
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(10px)",
              border: "none", color: "#fff", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ChevronUp size={18} />
          </button>
        </div>

        {watch.purchase_price && (
          <p style={{ fontSize: 18, fontWeight: 700, color: "#c9a84c", marginTop: 8 }}>
            {new Intl.NumberFormat("fr-FR").format(watch.purchase_price)} {watch.currency}
          </p>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {watch.has_proof_of_purchase && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", borderRadius: 20, padding: "4px 10px", fontSize: 11, color: "rgba(255,255,255,0.9)" }}>
              <FileCheck size={10} /> Preuve d&apos;achat
            </span>
          )}
          {watch.has_certificate_authenticity && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", borderRadius: 20, padding: "4px 10px", fontSize: 11, color: "rgba(255,255,255,0.9)" }}>
              <BadgeCheck size={10} /> Certificat
            </span>
          )}
          {(watch.has_box || watch.has_papers) && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", borderRadius: 20, padding: "4px 10px", fontSize: 11, color: "rgba(255,255,255,0.9)" }}>
              <Package size={10} /> {watch.has_box && watch.has_papers ? "Full set" : watch.has_box ? "Boîte" : "Papiers"}
            </span>
          )}
          <span style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", borderRadius: 20, padding: "4px 10px", fontSize: 11, color: "rgba(255,255,255,0.9)" }}>
            {CONDITION_LABELS[watch.condition]}
          </span>
        </div>
      </div>

      {/* Profile sheet (slides up) */}
      {showProfile && (
        <div
          onClick={e => e.stopPropagation()}
          className="animate-slide-up"
          style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: "rgba(12,12,16,0.97)",
            backdropFilter: "blur(30px)",
            borderRadius: "20px 20px 0 0",
            padding: "20px 20px 32px",
            color: "#f5f3ee",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <p style={{ fontSize: 18, fontWeight: 700 }}>{watch.brand} {watch.model}</p>
            <button onClick={() => setShowProfile(false)} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
              <X size={16} />
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            {(
              [
                ["Marque", watch.brand],
                ["Modèle", watch.model],
                ["Année", watch.year?.toString() ?? "—"],
                ["État", CONDITION_LABELS[watch.condition]],
                watch.purchase_price ? ["Valeur", `${new Intl.NumberFormat("fr-FR").format(watch.purchase_price)} ${watch.currency}`] : null,
                (watch.city || watch.country) ? ["Lieu", [watch.city, watch.country].filter(Boolean).join(", ")] : null,
              ] as ([string, string] | null)[]
            ).filter((x): x is [string, string] => x !== null).map(([label, value]) => (
              <div key={label} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "10px 12px" }}>
                <p style={{ fontSize: 10, color: "#6b6b78", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
                <p style={{ fontSize: 13, fontWeight: 600 }}>{value}</p>
              </div>
            ))}
          </div>

          {watch.description && (
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, marginBottom: 16 }}>{watch.description}</p>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => { setShowProfile(false); onSwipe?.("pass"); }}
              style={{ flex: 1, padding: "13px", borderRadius: 50, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
            >
              Passer
            </button>
            <button
              onClick={() => { setShowProfile(false); onSwipe?.("like"); }}
              style={{ flex: 1, padding: "13px", borderRadius: 50, border: "none", background: "#c9a84c", color: "#08080a", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
            >
              Proposer un échange
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
