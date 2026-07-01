"use client";

import { useState } from "react";
import { MapPin, BadgeCheck, FileCheck, Package, Info, X } from "lucide-react";
import type { Watch } from "@/lib/types";
import { CONDITION_LABELS } from "@/lib/types";

export function WatchCard({ watch, onSwipe }: { watch: Watch; onSwipe?: (dir: "like" | "pass") => void }) {
  const [showDetail, setShowDetail] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const photos = watch.photos ?? [];
  const photo = photos[photoIndex] ?? null;

  function handleTap(e: React.MouseEvent<HTMLDivElement>) {
    if (showDetail) return;
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
        borderRadius: 20,
        overflow: "hidden",
        background: "#1a1a1a",
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        cursor: "grab",
        userSelect: "none",
      }}
    >
      {/* Photo */}
      {photo ? (
        <img
          src={photo}
          alt={`${watch.brand} ${watch.model}`}
          draggable={false}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }}
        />
      ) : (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#888", fontSize: 14 }}>
          Pas de photo
        </div>
      )}

      {/* Photo progress dots */}
      {photos.length > 1 && (
        <div style={{ position: "absolute", top: 12, left: 12, right: 12, display: "flex", gap: 4 }}>
          {photos.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i === photoIndex ? "#fff" : "rgba(255,255,255,0.4)" }} />
          ))}
        </div>
      )}

      {/* Gradient */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.2) 45%, transparent 70%)", pointerEvents: "none" }} />

      {/* Info button */}
      <button
        onClick={e => { e.stopPropagation(); setShowDetail(s => !s); }}
        style={{
          position: "absolute", bottom: 80, right: 16,
          width: 36, height: 36, borderRadius: "50%",
          background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)",
          border: "1.5px solid rgba(255,255,255,0.4)",
          color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <Info size={16} />
      </button>

      {/* Bottom info */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 20px 20px", color: "#fff", pointerEvents: "none" }}>
        <p style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 4 }}>
          {watch.brand} {watch.model}
        </p>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", marginBottom: 8 }}>
          {watch.year ? `${watch.year} · ` : ""}{CONDITION_LABELS[watch.condition]}
        </p>
        {(watch.city || watch.country) && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)",
            borderRadius: 20, padding: "4px 10px", fontSize: 12,
          }}>
            <MapPin size={11} /> {[watch.city, watch.country].filter(Boolean).join(", ")}
          </span>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
          {watch.has_proof_of_purchase && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.15)", borderRadius: 20, padding: "3px 9px", fontSize: 11 }}>
              <FileCheck size={10} /> Preuve d&apos;achat
            </span>
          )}
          {watch.has_certificate_authenticity && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.15)", borderRadius: 20, padding: "3px 9px", fontSize: 11 }}>
              <BadgeCheck size={10} /> Certificat
            </span>
          )}
          {(watch.has_box || watch.has_papers) && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.15)", borderRadius: 20, padding: "3px 9px", fontSize: 11 }}>
              <Package size={10} /> {watch.has_box && watch.has_papers ? "Full set" : watch.has_box ? "Boîte" : "Papiers"}
            </span>
          )}
        </div>
        {watch.purchase_price && (
          <p style={{ fontSize: 20, fontWeight: 800, color: "#f5a623", marginTop: 6 }}>
            {new Intl.NumberFormat("fr-FR").format(watch.purchase_price)} {watch.currency}
          </p>
        )}
      </div>

      {/* Detail sheet */}
      {showDetail && (
        <div
          onClick={e => e.stopPropagation()}
          className="animate-slide-up"
          style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: "rgba(10,10,10,0.96)", backdropFilter: "blur(24px)",
            borderRadius: "18px 18px 0 0",
            padding: "20px 20px 28px", color: "#fff",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <p style={{ fontSize: 17, fontWeight: 700 }}>{watch.brand} {watch.model}</p>
            <button onClick={() => setShowDetail(false)} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
              <X size={14} />
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
            {([
              ["Marque", watch.brand],
              ["Modèle", watch.model],
              ["Année", watch.year?.toString() ?? "—"],
              ["État", CONDITION_LABELS[watch.condition]],
              watch.purchase_price ? ["Valeur estimée", `${new Intl.NumberFormat("fr-FR").format(watch.purchase_price)} ${watch.currency}`] : null,
              (watch.city || watch.country) ? ["Lieu", [watch.city, watch.country].filter(Boolean).join(", ")] : null,
            ] as ([string, string] | null)[])
              .filter((x): x is [string, string] => x !== null)
              .map(([label, value]) => (
                <div key={label} style={{ background: "rgba(255,255,255,0.07)", borderRadius: 10, padding: "9px 11px" }}>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>{value}</p>
                </div>
              ))
            }
          </div>
          {watch.description && (
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, marginBottom: 16 }}>{watch.description}</p>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { setShowDetail(false); onSwipe?.("pass"); }}
              style={{ flex: 1, padding: "12px", borderRadius: 50, border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
              Passer
            </button>
            <button onClick={() => { setShowDetail(false); onSwipe?.("like"); }}
              style={{ flex: 1, padding: "12px", borderRadius: 50, border: "none", background: "#e8445a", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              Proposer un échange
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
