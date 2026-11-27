"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { largeurCouverture } from "@/lib/coverUrl";
import { useT } from "@/i18n/FournisseurLangue";

export type PhotoPublique = { id: string; url: string; legende: string | null };

const LARGEURS = [480, 940, 1280, 1920] as const;
const srcSet = (url: string) => LARGEURS.map(w => `${largeurCouverture(url, w)} ${w}w`).join(", ");

/**
 * « En coulisses » sur la fiche publique.
 *
 * La fiche est déjà dominée par une grande bannière : la galerie ne doit pas
 * lui faire concurrence. Elle reste donc dans une carte, comme les autres
 * blocs, avec des photos à coins arrondis et sans ombre, et n'en montre que
 * trois au plus. Sur ordinateur, une mosaïque (une grande, deux petites) ;
 * sur téléphone, une bande qu'on fait glisser du pouce. Le reste s'ouvre en
 * plein écran.
 */
export function EnCoulisses({ photos, nom }: { photos: PhotoPublique[]; nom: string }) {
  const t = useT();
  const [ouverte, setOuverte] = useState<number | null>(null);
  if (photos.length === 0) return null;

  const visibles = photos.slice(0, 3);
  const reste = photos.length - visibles.length;
  const alt = (p: PhotoPublique) => p.legende || t("coulisses.photoDe", { nom });

  return (
    <section aria-labelledby="titre-coulisses" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 20px 18px", marginBottom: 32 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
        <div>
          <h2 id="titre-coulisses" style={{ fontSize: 16, fontWeight: 750, letterSpacing: "-0.01em", color: "var(--text)" }}>{t("coulisses.titre")}</h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{t("coulisses.sousTitre", { nom })}</p>
        </div>
        {photos.length > 1 && (
          <button type="button" onClick={() => setOuverte(0)} style={{ flexShrink: 0, background: "none", border: "none", padding: "8px 0", fontSize: 13, fontWeight: 650, color: "var(--text-muted)", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>
            {t("coulisses.voirToutes", { n: photos.length })}
          </button>
        )}
      </div>

      <style>{`
        .coulisses-grille { display: grid; gap: 8px; }
        .coulisses-grille[data-n="1"] { grid-template-columns: 1fr; }
        .coulisses-grille[data-n="1"] .coulisses-tuile { aspect-ratio: 16 / 9; }
        .coulisses-grille[data-n="2"] { grid-template-columns: 1fr 1fr; }
        .coulisses-grille[data-n="2"] .coulisses-tuile { aspect-ratio: 4 / 3; }
        .coulisses-grille[data-n="3"] { grid-template-columns: 2fr 1fr; grid-template-rows: 1fr 1fr; aspect-ratio: 16 / 9; }
        .coulisses-grille[data-n="3"] .coulisses-tuile:first-child { grid-row: span 2; }
        .coulisses-tuile { position: relative; overflow: hidden; border-radius: 12px; background: var(--surface2); border: 0; padding: 0; cursor: zoom-in; min-height: 0; }
        .coulisses-tuile img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .5s cubic-bezier(.2,.7,.2,1); }
        .coulisses-tuile:hover img { transform: scale(1.03); }
        .coulisses-tuile:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }
        @media (max-width: 700px) {
          .coulisses-grille, .coulisses-grille[data-n] { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; gap: 10px; aspect-ratio: auto;
            margin: 0 -20px; padding: 0 20px; scroll-padding: 0 20px; scrollbar-width: none; }
          .coulisses-grille::-webkit-scrollbar { display: none; }
          .coulisses-grille .coulisses-tuile, .coulisses-grille[data-n] .coulisses-tuile { flex: 0 0 ${photos.length === 1 ? "100%" : "82%"}; aspect-ratio: 4 / 3; scroll-snap-align: start; grid-row: auto; }
          /* Même poids que la règle « display: flex » ci-dessus : avec la seule
             classe, la mosaïque d'ordinateur restait visible sur téléphone et
             la galerie s'affichait deux fois. */
          .coulisses-grille.coulisses-desktop { display: none; }
        }
        @media (min-width: 701px) { .coulisses-grille.coulisses-mobile { display: none; } }
        /* Sur téléphone on glisse du doigt : les flèches masqueraient la photo. */
        @media (max-width: 700px) { .visionneuse-fleche { display: none !important; } }
        @media (prefers-reduced-motion: reduce) { .coulisses-tuile img { transition: none; } }
      `}</style>

      {/* Ordinateur : trois photos au plus, en mosaïque. */}
      <div className="coulisses-grille coulisses-desktop" data-n={visibles.length}>
        {visibles.map((p, i) => (
          <button key={p.id} type="button" className="coulisses-tuile" onClick={() => setOuverte(i)} aria-label={alt(p)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={largeurCouverture(p.url, 940)} srcSet={srcSet(p.url)} sizes={i === 0 ? "(max-width: 900px) 60vw, 380px" : "(max-width: 900px) 30vw, 190px"} alt="" loading="lazy" decoding="async" />
            {i === visibles.length - 1 && reste > 0 && (
              <span aria-hidden="true" style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "rgba(10,10,14,0.5)", color: "#fff", fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>
                {t("coulisses.plus", { n: reste })}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Téléphone : toutes les photos, en bande à faire glisser. */}
      <div className="coulisses-grille coulisses-mobile" data-n={photos.length}>
        {photos.map((p, i) => (
          <button key={p.id} type="button" className="coulisses-tuile" onClick={() => setOuverte(i)} aria-label={alt(p)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={largeurCouverture(p.url, 640)} srcSet={srcSet(p.url)} sizes="82vw" alt="" loading="lazy" decoding="async" />
          </button>
        ))}
      </div>

      {ouverte !== null && <Visionneuse photos={photos} depart={ouverte} alt={alt} onFermer={() => setOuverte(null)} />}
    </section>
  );
}

/** Plein écran : flèches, clavier, glissement du doigt, Échap pour fermer. */
function Visionneuse({ photos, depart, alt, onFermer }: { photos: PhotoPublique[]; depart: number; alt: (p: PhotoPublique) => string; onFermer: () => void }) {
  const t = useT();
  const [i, setI] = useState(depart);
  const toucher = useRef<number | null>(null);
  const fermer = useRef<HTMLButtonElement>(null);
  const n = photos.length;
  const aller = useCallback((sens: number) => setI(x => (x + sens + n) % n), [n]);

  useEffect(() => {
    const avant = document.activeElement as HTMLElement | null;
    fermer.current?.focus();
    const touche = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFermer();
      else if (e.key === "ArrowRight") aller(1);
      else if (e.key === "ArrowLeft") aller(-1);
    };
    const debordement = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", touche);
    return () => {
      window.removeEventListener("keydown", touche);
      document.documentElement.style.overflow = debordement;
      avant?.focus();
    };
  }, [aller, onFermer]);

  const p = photos[i];
  const bouton: React.CSSProperties = { width: 48, height: 48, display: "grid", placeItems: "center", borderRadius: 999, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer", backdropFilter: "blur(8px)" };

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={t("coulisses.titre")} onClick={onFermer}
      onTouchStart={e => { toucher.current = e.touches[0].clientX; }}
      onTouchEnd={e => {
        if (toucher.current === null) return;
        const dx = e.changedTouches[0].clientX - toucher.current;
        toucher.current = null;
        if (Math.abs(dx) > 50) aller(dx < 0 ? 1 : -1);
      }}
      style={{ position: "fixed", inset: 0, zIndex: 10200, background: "rgba(8,8,12,0.94)", display: "grid", gridTemplateRows: "auto 1fr auto", color: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px" }}>
        <span style={{ fontSize: 13.5, fontVariantNumeric: "tabular-nums", opacity: 0.8 }}>{i + 1} / {n}</span>
        <button ref={fermer} type="button" onClick={onFermer} aria-label={t("coulisses.fermer")} style={bouton}><X size={20} aria-hidden="true" /></button>
      </div>
      <div style={{ position: "relative", display: "grid", placeItems: "center", minHeight: 0, padding: "0 16px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={p.id} src={largeurCouverture(p.url, 1920)} srcSet={srcSet(p.url)} sizes="100vw" alt={alt(p)} onClick={e => e.stopPropagation()}
          // Hauteur bornée explicitement : un pourcentage dans une rangée de
          // grille n'était pas respecté, et la photo débordait sous la légende.
          style={{ maxWidth: "min(100%, 1600px)", maxHeight: "calc(100dvh - 160px)", width: "auto", height: "auto", objectFit: "contain", borderRadius: 10, background: "rgba(255,255,255,0.04)" }} />
        {n > 1 && (
          <>
            <button type="button" onClick={e => { e.stopPropagation(); aller(-1); }} aria-label={t("coulisses.precedente")} className="visionneuse-fleche" style={{ ...bouton, position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }}><ChevronLeft size={22} aria-hidden="true" /></button>
            <button type="button" onClick={e => { e.stopPropagation(); aller(1); }} aria-label={t("coulisses.suivante")} className="visionneuse-fleche" style={{ ...bouton, position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)" }}><ChevronRight size={22} aria-hidden="true" /></button>
          </>
        )}
      </div>
      <p style={{ minHeight: 56, padding: "14px 20px 20px", textAlign: "center", fontSize: 14.5, lineHeight: 1.5, opacity: 0.9 }} onClick={e => e.stopPropagation()}>
        {p.legende ?? ""}
      </p>
    </div>,
    document.body,
  );
}
