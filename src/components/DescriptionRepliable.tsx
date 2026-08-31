"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Un texte tronqué à quelques lignes, avec « plus » quand il en reste.
 *
 * Agrandir la police règle la lisibilité mais coupe davantage : à taille égale
 * de carte, un texte plus grand tient sur moins de lignes. D'où ce repli, qui
 * rend la fin du texte accessible sans quitter la page.
 *
 * Le lien n'apparaît que si le texte déborde réellement. Afficher « plus » sous
 * une description de deux lignes entières promet une suite qui n'existe pas :
 * on mesure donc la hauteur réelle plutôt que de compter les caractères, seule
 * façon d'être juste quelle que soit la largeur de la carte et la police
 * effectivement chargée.
 *
 * La mesure est refaite quand la fenêtre change de taille, parce qu'une carte
 * de grille passe de trois colonnes à une seule sans que le texte change.
 */
export function DescriptionRepliable({
  texte,
  lignes = 3,
  style,
  couleurLien = "var(--text-sub)",
}: {
  texte: string;
  lignes?: number;
  style?: React.CSSProperties;
  couleurLien?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [deploye, setDeploye] = useState(false);
  const [deborde, setDeborde] = useState(false);

  const mesurer = useCallback(() => {
    const el = ref.current;
    if (!el || deploye) return;
    // Une tolérance d'un pixel : les hauteurs de ligne fractionnaires font
    // dépasser scrollHeight de moins d'un pixel sur des textes qui tiennent.
    setDeborde(el.scrollHeight > el.clientHeight + 1);
  }, [deploye]);

  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    mesurer();
  }, [texte, lignes, mesurer]);

  useEffect(() => {
    window.addEventListener("resize", mesurer);
    return () => window.removeEventListener("resize", mesurer);
  }, [mesurer]);

  const replie = !deploye;

  return (
    <div>
      <p
        ref={ref}
        style={{
          ...style,
          ...(replie
            ? {
                display: "-webkit-box",
                WebkitLineClamp: lignes,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }
            : null),
        } as React.CSSProperties}
      >
        {texte}
      </p>

      {(deborde || deploye) && (
        <button
          type="button"
          // La carte entière est un lien : sans ces deux appels, lire la suite
          // ouvrirait la fiche.
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            setDeploye(d => !d);
          }}
          style={{
            background: "none",
            border: "none",
            padding: "2px 0 0",
            cursor: "pointer",
            font: "inherit",
            fontWeight: 600,
            color: couleurLien,
          }}
          aria-expanded={deploye}
        >
          {deploye ? "moins" : "plus"}
        </button>
      )}
    </div>
  );
}
