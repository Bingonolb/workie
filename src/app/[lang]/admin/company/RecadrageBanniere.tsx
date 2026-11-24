"use client";

import { useRef, useState } from "react";
import { Move, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { CADRAGE_NEUTRE, ZOOM_MAX, estNeutre, type Cadrage } from "@/lib/coverUrl";

/**
 * Recadrer une bannière sans toucher au fichier.
 *
 * On fait glisser la photo pour choisir ce qui reste visible, et le curseur
 * l'agrandit. Rien n'est découpé ni réencodé : seul un point et un facteur
 * d'agrandissement sont enregistrés, et chaque écran du site les applique à
 * l'original. La qualité ne bouge donc pas, et l'on peut revenir en arrière à
 * tout moment.
 *
 * Deux aperçus, parce que la même bannière vit dans deux formats opposés : le
 * bandeau très allongé de la fiche, et la carte de la grille. Le bon cadrage
 * est celui qui marche dans les deux.
 */
export function RecadrageBanniere({ src, cadrage, onChange }: {
  src: string;
  cadrage: Cadrage;
  onChange: (c: Cadrage) => void;
}) {
  const cadreRef = useRef<HTMLDivElement>(null);
  const depart = useRef<{ px: number; py: number; x: number; y: number } | null>(null);
  const [glisse, setGlisse] = useState(false);

  const origine = `${cadrage.x}% ${cadrage.y}%`;
  const styleImage: React.CSSProperties = {
    position: "absolute", inset: 0, width: "100%", height: "100%",
    objectFit: "cover", objectPosition: origine,
    transform: cadrage.zoom > 1 ? `scale(${cadrage.zoom})` : undefined,
    transformOrigin: origine,
    userSelect: "none", pointerEvents: "none",
  };

  /*
   * Faire glisser la photo vers la droite montre ce qui était à gauche : le
   * point gardé au centre recule donc quand le doigt avance. Le déplacement est
   * rapporté à la taille du cadre, et ralenti quand la photo est agrandie, pour
   * que la main garde la même précision à tous les niveaux de zoom.
   */
  const surAppui = (e: React.PointerEvent) => {
    depart.current = { px: e.clientX, py: e.clientY, x: cadrage.x, y: cadrage.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setGlisse(true);
  };
  const surMouvement = (e: React.PointerEvent) => {
    const d = depart.current;
    const cadre = cadreRef.current;
    if (!d || !cadre) return;
    const { width, height } = cadre.getBoundingClientRect();
    const freinage = 1 / cadrage.zoom;
    const x = d.x - ((e.clientX - d.px) / width) * 100 * freinage;
    const y = d.y - ((e.clientY - d.py) / height) * 100 * freinage;
    onChange({ ...cadrage, x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) });
  };
  const surRelache = () => { depart.current = null; setGlisse(false); };

  const zoomer = (z: number) => onChange({ ...cadrage, zoom: Math.min(ZOOM_MAX, Math.max(1, Math.round(z * 100) / 100)) });

  // Les flèches du clavier déplacent aussi le cadrage, par pas de 2 %.
  const surTouche = (e: React.KeyboardEvent) => {
    const pas = e.shiftKey ? 10 : 2;
    const deplacer = (dx: number, dy: number) => {
      e.preventDefault();
      onChange({ ...cadrage, x: Math.min(100, Math.max(0, cadrage.x + dx)), y: Math.min(100, Math.max(0, cadrage.y + dy)) });
    };
    if (e.key === "ArrowLeft") deplacer(-pas, 0);
    if (e.key === "ArrowRight") deplacer(pas, 0);
    if (e.key === "ArrowUp") deplacer(0, -pas);
    if (e.key === "ArrowDown") deplacer(0, pas);
  };

  const bouton: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: 34, height: 34, borderRadius: 8, cursor: "pointer",
    border: "1px solid var(--border2)", background: "var(--surface2)", color: "var(--text)",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* La fiche : le bandeau le plus allongé, celui qui coupe le plus. */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
          Sur la fiche
        </p>
        <div
          ref={cadreRef}
          role="slider"
          tabIndex={0}
          aria-label="Cadrage de la bannière : faites glisser l'image, ou utilisez les flèches du clavier"
          aria-valuenow={Math.round(cadrage.x)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={`Horizontal ${Math.round(cadrage.x)} %, vertical ${Math.round(cadrage.y)} %, zoom ${cadrage.zoom.toFixed(1)}`}
          onPointerDown={surAppui}
          onPointerMove={surMouvement}
          onPointerUp={surRelache}
          onPointerCancel={surRelache}
          onKeyDown={surTouche}
          style={{
            position: "relative", width: "100%", aspectRatio: "4.2 / 1",
            borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)",
            background: "var(--surface3)", cursor: glisse ? "grabbing" : "grab",
            touchAction: "none",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" draggable={false} style={styleImage} />
          {!glisse && estNeutre(cadrage) && (
            <span style={{
              position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)",
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: 50, fontSize: 12, fontWeight: 600,
              background: "rgba(0,0,0,0.55)", color: "#fff", pointerEvents: "none",
            }}>
              <Move size={13} aria-hidden="true" /> Glissez pour cadrer
            </span>
          )}
        </div>
      </div>

      {/* La carte de la grille, pour vérifier que le cadrage tient aussi là. */}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
            Sur une carte
          </p>
          <div style={{ position: "relative", width: 200, aspectRatio: "1.9 / 1", borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)", background: "var(--surface3)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" draggable={false} style={styleImage} />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 220 }}>
          <button type="button" style={bouton} onClick={() => zoomer(cadrage.zoom - 0.1)} aria-label="Dézoomer" disabled={cadrage.zoom <= 1}>
            <ZoomOut size={15} aria-hidden="true" />
          </button>
          <input
            type="range" min={1} max={ZOOM_MAX} step={0.01}
            value={cadrage.zoom}
            onChange={e => zoomer(Number(e.target.value))}
            aria-label="Zoom de la bannière"
            style={{ flex: 1, accentColor: "var(--brand)" }}
          />
          <button type="button" style={bouton} onClick={() => zoomer(cadrage.zoom + 0.1)} aria-label="Zoomer" disabled={cadrage.zoom >= ZOOM_MAX}>
            <ZoomIn size={15} aria-hidden="true" />
          </button>
          <span style={{ fontSize: 12, color: "var(--text-muted)", width: 38, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
            ×{cadrage.zoom.toFixed(1)}
          </span>
          <button
            type="button"
            onClick={() => onChange(CADRAGE_NEUTRE)}
            disabled={estNeutre(cadrage)}
            style={{ ...bouton, width: "auto", padding: "0 10px", gap: 6, fontSize: 12, fontWeight: 600, opacity: estNeutre(cadrage) ? 0.45 : 1 }}
          >
            <RotateCcw size={13} aria-hidden="true" /> Centrer
          </button>
        </div>
      </div>
    </div>
  );
}
