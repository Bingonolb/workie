"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Le moteur du swipe : la pile de deux cartes et le geste, quel que soit ce
 * qu'on swipe (entreprises, offres d'emploi, publicités).
 *
 * Ce qui est ici a été corrigé un par un, et doit le rester :
 *  - un verrou synchrone (ref) empêche deux swipes rapprochés d'avancer de
 *    deux cartes ;
 *  - la carte de devant est un seul nœud réutilisé : à la relève, sa
 *    transition est coupée deux images, sinon la suivante rentrait en
 *    glissant depuis le bord ;
 *  - la carte de derrière n'est jamais recréée (même clé) : son image déjà
 *    chargée passe devant, sans clignoter ;
 *  - au doigt, les écouteurs sont posés à la main en `passive: false` (iOS
 *    ignorait preventDefault et volait le geste pour faire défiler), avec un
 *    verrou de direction décidé dès 5 px ;
 *  - le clic synthétique d'Android après un toucher est bloqué sur la carte.
 *
 * Ce qui n'est pas ici : le paquet (chargement, ordre, sauvegarde), et ce que
 * veut dire « droite » ou « gauche ». C'est à l'appelant (onDecision).
 */

export const SEUIL_SWIPE = 90;
export type Direction = "left" | "right";

export type RenduCarte = { devant: boolean; direction: Direction | null; intensite: number };

export function PileSwipe<T>({
  courant, suivant, cle, rendu, onDecision, onAvance, onTouche, boutons, toast, style,
}: {
  courant: T | undefined;
  suivant: T | undefined;
  cle: (item: T) => string;
  rendu: (item: T, r: RenduCarte) => React.ReactNode;
  /** Le swipe est décidé : enregistrer, passer… (appelé avant l'animation). */
  onDecision: (item: T, dir: Direction) => void;
  /** La carte est partie : passer à la suivante. */
  onAvance: () => void;
  /** Un toucher sans glisser : ouvrir la carte. */
  onTouche: (item: T) => void;
  /** Les boutons sous la pile, qui déclenchent le même geste. */
  boutons: (agir: (dir: Direction) => void, occupe: boolean) => React.ReactNode;
  toast?: { msg: string; color: string } | null;
  style?: React.CSSProperties;
}) {
  const [drag, setDrag] = useState(0);
  const [glisse, setGlisse] = useState(false);
  const [parti, setParti] = useState<Direction | null>(null);
  const [sautSansAnimation, setSautSansAnimation] = useState(false);
  const carteRef = useRef<HTMLDivElement>(null);
  const depart = useRef<{ x: number; y: number } | null>(null);
  const transitionRef = useRef(false);
  const minuteurs = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Dernières valeurs, lues depuis les écouteurs posés à la main et le clavier.
  // Écrites après le rendu (jamais pendant), elles portent la valeur affichée.
  const courantRef = useRef(courant);
  const partiRef = useRef(parti);
  const agirRef = useRef<(dir: Direction) => void>(() => {});
  const toucheRef = useRef(onTouche);

  const agir = useCallback((dir: Direction) => {
    if (!courant || parti || transitionRef.current) return;
    transitionRef.current = true;
    onDecision(courant, dir);
    setParti(dir);
    const t = setTimeout(() => {
      onAvance();
      setParti(null);
      setDrag(0);
      setSautSansAnimation(true);
      transitionRef.current = false;
    }, 280);
    minuteurs.current.push(t);
  }, [courant, parti, onDecision, onAvance]);

  useEffect(() => {
    courantRef.current = courant;
    partiRef.current = parti;
    agirRef.current = agir;
    toucheRef.current = onTouche;
  });

  // Les minuteurs en cours ne doivent pas survivre au composant.
  useEffect(() => () => { minuteurs.current.forEach(clearTimeout); minuteurs.current = []; }, []);

  // Relève sans animation : deux images (la première applique la position de
  // repos sans transition, la seconde rétablit la transition).
  useEffect(() => {
    if (!sautSansAnimation) return;
    let second = 0;
    const premier = requestAnimationFrame(() => { second = requestAnimationFrame(() => setSautSansAnimation(false)); });
    return () => { cancelAnimationFrame(premier); cancelAnimationFrame(second); };
  }, [sautSansAnimation]);

  // Flèches du clavier.
  useEffect(() => {
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") agirRef.current("right");
      else if (e.key === "ArrowLeft") agirRef.current("left");
    };
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, []);

  // Doigt : écouteurs natifs, non passifs (voir plus haut).
  const cleCourante = courant ? cle(courant) : null;
  useEffect(() => {
    const el = carteRef.current;
    if (!el) return;
    let verrou: "h" | "v" | null = null;

    const debut = (e: TouchEvent) => {
      if (partiRef.current) return;
      const t = e.touches[0];
      depart.current = { x: t.clientX, y: t.clientY };
      verrou = null;
      setGlisse(true);
    };
    const mouvement = (e: TouchEvent) => {
      if (!depart.current || partiRef.current) return;
      const t = e.touches[0];
      const dx = t.clientX - depart.current.x, dy = t.clientY - depart.current.y;
      if (verrou === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) verrou = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
      if (verrou === "h") { e.preventDefault(); setDrag(dx * 0.92); }
    };
    const fin = (e: TouchEvent) => {
      if (!depart.current) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - depart.current.x, dy = t.clientY - depart.current.y;
      depart.current = null;
      setGlisse(false);
      if (Math.abs(dx) < 12 && Math.abs(dy) < 12) {
        // Un toucher sur un bouton de la carte est laissé au bouton.
        if (!(e.target as HTMLElement).closest("button") && courantRef.current) toucheRef.current(courantRef.current);
        setDrag(0);
        return;
      }
      if (dx * 0.92 > SEUIL_SWIPE) agirRef.current("right");
      else if (dx * 0.92 < -SEUIL_SWIPE) agirRef.current("left");
      else setDrag(0);
    };
    const annule = () => { depart.current = null; setGlisse(false); setDrag(0); };
    // Android envoie un clic synthétique ~300 ms après le toucher : bloqué sur
    // la carte (sauf sur ses boutons), pour ne pas ouvrir deux fois.
    const clic = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest("button")) return;
      if (!depart.current) e.stopPropagation();
    };

    el.addEventListener("touchstart", debut, { passive: true });
    el.addEventListener("touchmove", mouvement, { passive: false });
    el.addEventListener("touchend", fin, { passive: true });
    el.addEventListener("touchcancel", annule, { passive: true });
    el.addEventListener("click", clic, { capture: true });
    return () => {
      el.removeEventListener("touchstart", debut);
      el.removeEventListener("touchmove", mouvement);
      el.removeEventListener("touchend", fin);
      el.removeEventListener("touchcancel", annule);
      el.removeEventListener("click", clic, { capture: true });
    };
  }, [cleCourante]);

  // Souris (ordinateur).
  const sourisBas = (e: React.MouseEvent) => {
    if (parti) return;
    depart.current = { x: e.clientX, y: e.clientY };
    setGlisse(true);
  };
  const sourisMouvement = (e: React.MouseEvent) => {
    if (!depart.current || parti) return;
    setDrag((e.clientX - depart.current.x) * 0.92);
  };
  const sourisHaut = (e: React.MouseEvent) => {
    if (!depart.current) return;
    const dx = (e.clientX - depart.current.x) * 0.92, dy = e.clientY - depart.current.y;
    depart.current = null;
    setGlisse(false);
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {
      if (!(e.target as HTMLElement).closest("button") && courant) onTouche(courant);
      setDrag(0);
      return;
    }
    if (dx > SEUIL_SWIPE) agir("right");
    else if (dx < -SEUIL_SWIPE) agir("left");
    else setDrag(0);
  };

  if (!courant) return null;

  const intensite = Math.min(Math.abs(drag) / SEUIL_SWIPE, 1);
  const direction: Direction | null = drag > 20 ? "right" : drag < -20 ? "left" : null;

  return (
    <div className="swipe-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, paddingTop: "clamp(8px, 3vh, 24px)" }}>
      <div style={{ position: "relative", width: "min(420px, 96vw)", height: "clamp(300px, calc(100svh - 340px), 490px)", touchAction: "pan-y", ...style }}>
        {toast && (
          <div key={toast.msg} className="pile-swipe-toast" style={{ background: toast.color, boxShadow: `0 6px 24px ${toast.color}88` }}>
            {toast.msg}
          </div>
        )}
        {[suivant, courant].filter((x): x is T => x !== undefined && x !== null).map(item => {
          const devant = item === courant;
          if (!devant) {
            return (
              <div key={cle(item)} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
                {rendu(item, { devant: false, direction: null, intensite: 0 })}
              </div>
            );
          }
          return (
            <div
              key={cle(item)}
              ref={carteRef}
              style={{
                position: "absolute", inset: 0, zIndex: 1,
                transform: parti
                  ? `translateX(${parti === "right" ? 650 : -650}px) rotate(${parti === "right" ? 22 : -22}deg)`
                  : `translateX(${drag}px) rotate(${drag / 14}deg)`,
                transition: glisse || sautSansAnimation
                  ? "none"
                  : parti ? "transform 0.26s cubic-bezier(0.4, 0, 1, 1)" : "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
                cursor: glisse ? "grabbing" : "pointer",
                touchAction: "pan-y",
              }}
              onMouseDown={sourisBas}
              onMouseMove={sourisMouvement}
              onMouseUp={sourisHaut}
              onMouseLeave={e => { if (depart.current) sourisHaut(e); }}
            >
              {rendu(item, { devant: true, direction, intensite })}
            </div>
          );
        })}
      </div>

      {/* `agir` lit le verrou (ref) uniquement quand on l'appelle, depuis un
          clic : jamais pendant ce rendu, qui ne fait que le transmettre. */}
      {/* eslint-disable-next-line react-hooks/refs */}
      {boutons(agir, !!parti)}

      <style>{`
        .pile-swipe-toast { position: absolute; top: 20px; left: 50%; transform: translateX(-50%); color: #fff; font-weight: 800; font-size: 15px;
          padding: 9px 26px; border-radius: 50px; z-index: 10; white-space: nowrap; pointer-events: none;
          animation: pileSwipeToast 1.8s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        @keyframes pileSwipeToast {
          0%   { opacity: 0; transform: translateX(-50%) translateY(-12px) scale(0.85); }
          18%  { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          75%  { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-6px) scale(0.95); }
        }
        @media (prefers-reduced-motion: reduce) { .pile-swipe-toast { animation-duration: .01s; } }
      `}</style>
    </div>
  );
}

/** Bandeau « SAVE » / « PASS » posé sur la carte pendant le geste. */
export function TamponSwipe({ direction, intensite, droite, gauche }: {
  direction: Direction | null; intensite: number;
  droite: { texte: string; rgb: string }; gauche: { texte: string; rgb: string };
}) {
  if (!direction) return null;
  const { texte, rgb } = direction === "right" ? droite : gauche;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: `rgba(${rgb},${intensite * 0.35})`, pointerEvents: "none" }}>
      <div style={{ border: `4px solid rgba(${rgb},${intensite})`, borderRadius: 16, padding: "10px 22px", transform: `rotate(${direction === "right" ? -12 : 12}deg) scale(${0.8 + intensite * 0.2})` }}>
        <span style={{ fontSize: 28, fontWeight: 900, color: `rgba(${rgb},${intensite})` }}>{texte}</span>
      </div>
    </div>
  );
}
