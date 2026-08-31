"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Un texte tronqué à quelques lignes, avec « plus » à la fin de la dernière.
 *
 * ── Pourquoi à la fin, et non en dessous ────────────────────────────────────
 *
 * La première version posait « plus » sur sa propre ligne. Trois défauts d'un
 * coup : le mot avait le poids d'un paragraphe alors qu'il n'est qu'un
 * contrôle, il ressemblait à un lien resté seul, et il ajoutait une ligne à
 * certaines cartes seulement — la grille devenait irrégulière, ce qui suffit à
 * faire amateur.
 *
 * Il est donc rendu dans le flux du texte, en fin de dernière ligne, avec un
 * dégradé qui fond la fin du paragraphe derrière lui. C'est ce que font les
 * fils d'actualité, et surtout ça ne change plus la hauteur de la carte.
 *
 * ── La mesure ───────────────────────────────────────────────────────────────
 *
 * Le lien n'apparaît que si le texte déborde réellement : on mesure la hauteur
 * rendue plutôt que de compter les caractères, seule façon d'être juste quelle
 * que soit la largeur de la carte et la police effectivement chargée. La mesure
 * est refaite au redimensionnement, une grille passant de trois colonnes à une
 * seule sans que le texte change.
 */
export function DescriptionRepliable({
  texte,
  lignes = 3,
  style,
}: {
  texte: string;
  lignes?: number;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [deploye, setDeploye] = useState(false);
  const [deborde, setDeborde] = useState(false);

  const mesurer = useCallback(() => {
    const el = ref.current;
    if (!el || deploye) return;
    // Tolérance d'un pixel : les hauteurs de ligne fractionnaires font dépasser
    // scrollHeight de moins d'un pixel sur des textes qui tiennent pourtant.
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

  const basculer = (e: React.MouseEvent) => {
    // La carte entière est un lien : sans ces deux appels, lire la suite
    // ouvrirait la fiche.
    e.preventDefault();
    e.stopPropagation();
    setDeploye(d => !d);
  };

  return (
    <div style={{ position: "relative" }}>
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
        {deploye && (
          <>
            {" "}
            <button type="button" onClick={basculer} className="lien-plus">moins</button>
          </>
        )}
      </p>

      {replie && deborde && (
        // Posé par-dessus la fin de la dernière ligne, avec un dégradé qui
        // efface le texte derrière plutôt que de le couper net.
        <button type="button" onClick={basculer} className="lien-plus lien-plus-flottant">
          plus
        </button>
      )}
    </div>
  );
}
