/**
 * La forme des deux formats d'annonce, dessinée.
 *
 * Les deux formats étaient signalés par un emoji : un carré noir et un
 * téléphone. Le dessin appartenait au système d'exploitation, changeait d'un
 * appareil à l'autre, et le téléphone arrivait en couleurs. Les remplacer par
 * les mots « Carré » et « Plein écran » a réglé ça et créé un autre problème :
 * un mot nomme le format, il n'en montre pas la forme. On lisait « Carré »
 * sans voir de carré.
 *
 * Ces silhouettes disent ce que les mots ne disent pas, et ce que les emojis
 * ne disaient pas non plus : où l'annonce se pose.
 *
 * L'illustration montre le contexte. Le format carré est une tuile parmi
 * quatre, parce qu'il s'insère dans la grille d'exploration entre les fiches ;
 * le format swipe occupe tout le cadre, parce qu'il prend l'écran. C'est
 * exactement ce que raconte le texte posé dessous, montré au lieu d'être
 * décrit.
 *
 * Le glyphe est la même idée réduite à ce qui survit à douze pixels : un
 * carré, ou un rectangle debout. La proportion suffit à distinguer les deux.
 *
 * Tout est en `currentColor` sauf la surface active, qui prend la couleur de
 * marque : la silhouette suit la couleur de son texte, donc le thème clair et
 * le thème sombre sans règle supplémentaire.
 */

type Format = "square" | "swipe";

type Props = {
  format: Format;
  /** Hauteur en pixels. La largeur suit la proportion du dessin. */
  taille?: number;
  /** `glyphe` en dessous de vingt pixels : les tuiles ne s'y lisent plus. */
  variante?: "glyphe" | "illustration";
};

const LIBELLES: Record<Format, string> = {
  square: "Format carré",
  swipe: "Format plein écran",
};

export function SilhouetteFormat({ format, taille = 14, variante = "glyphe" }: Props) {
  const titre = LIBELLES[format];

  if (variante === "illustration") {
    return (
      <svg
        width={Math.round(taille * (60 / 44))}
        height={taille}
        viewBox="0 0 60 44"
        fill="none"
        role="img"
        aria-label={titre}
        style={{ display: "block", flexShrink: 0 }}
      >
        {/* Le cadre : l'écran de l'application. */}
        <rect
          x="0.9" y="0.9" width="58.2" height="42.2" rx="5"
          stroke="currentColor" strokeWidth="1.4" opacity="0.4"
        />
        {format === "square" ? (
          <>
            {/* Trois fiches entreprise, et l'annonce à leur place. */}
            <rect x="7" y="7" width="20" height="13" rx="3" fill="currentColor" opacity="0.16" />
            <rect x="33" y="7" width="20" height="13" rx="3" fill="var(--brand)" />
            <rect x="7" y="24" width="20" height="13" rx="3" fill="currentColor" opacity="0.16" />
            <rect x="33" y="24" width="20" height="13" rx="3" fill="currentColor" opacity="0.16" />
          </>
        ) : (
          <>
            {/* L'annonce prend l'écran entier : elle touche le cadre, au lieu
                de flotter dedans avec une marge qui la faisait ressembler à
                une simple pastille de couleur. Les deux barres claires lui
                rendent son titre et son bouton : sans elles, le format se
                lisait comme un aplat et non comme une carte. */}
            <rect x="3" y="3" width="54" height="38" rx="3.5" fill="var(--brand)" />
            <rect x="9" y="25" width="30" height="3.4" rx="1.7" fill="#fff" opacity="0.85" />
            <rect x="9" y="31.5" width="18" height="3.4" rx="1.7" fill="#fff" opacity="0.45" />
          </>
        )}
      </svg>
    );
  }

  return (
    <svg
      width={taille} height={taille} viewBox="0 0 16 16"
      fill="none" role="img" aria-label={titre}
      style={{ display: "block", flexShrink: 0 }}
    >
      {format === "square" ? (
        <rect x="2" y="2" width="12" height="12" rx="2.5" fill="currentColor" />
      ) : (
        <rect x="4" y="1" width="8" height="14" rx="2" fill="currentColor" />
      )}
    </svg>
  );
}
