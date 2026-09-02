/*
 * Le logotype Workie, en un seul endroit.
 *
 * Il était recopié dans neuf fichiers sous la forme d'un <span> au dégradé
 * violet-orange. Neuf copies d'une marque, c'est neuf occasions de la voir
 * diverger : la taille variait déjà d'un écran à l'autre.
 *
 * Le mot est dessiné, pas composé. Une police du commerce appartient à sa
 * fonderie et à tous ceux qui l'achètent : n'importe qui pourrait écrire
 * « workie » à l'identique. Les six lettres sont donc tracées, et ce dessin
 * n'appartient qu'à la marque.
 *
 * Symbole et mot sont en `currentColor` : noirs sur fond clair, blancs sur
 * fond sombre, sans seconde version du fichier. Le dégradé a disparu, et le
 * violet reste réservé à ce sur quoi on peut cliquer. C'est le parti pris de
 * LinkedIn : un logo bicolore qui côtoie des boutons violets fait deux
 * emblèmes concurrents, et l'accent perd sa fonction de signal.
 */

type Props = {
  /** Hauteur du symbole en pixels. Le mot suit la même échelle. */
  taille?: number;
  /** Symbole seul, sans le mot : pour les espaces étroits. */
  symboleSeul?: boolean;
  className?: string;
};

export function Logo({ taille = 22, symboleSeul = false, className }: Props) {
  // Rapports relevés sur le logotype d'origine. Le symbole y mesure 330 pour
  // une hampe de mot à 212, et l'écart entre les deux vaut 80.
  const hauteurMot = taille * 0.642;
  const largeurMot = hauteurMot * (644 / 146);

  return (
    <span
      className={className}
      style={{ display: "inline-flex", alignItems: "center", gap: taille * 0.24, color: "inherit" }}
    >
      <svg
        viewBox="0 0 70 100"
        height={taille}
        width={taille * 0.7}
        fill="currentColor"
        aria-hidden={symboleSeul ? undefined : true}
        role={symboleSeul ? "img" : undefined}
        aria-label={symboleSeul ? "Workie" : undefined}
        style={{ flexShrink: 0, display: "block" }}
      >
        {/* Deux plans d'une fiche qui s'ouvre : celui du fond fuit vers la
            gauche, celui de devant est plus proche, plus grand et arrondi. */}
        <path d="M0 22.5 L20.4 9.3 L20.4 87.9 L0 77.9 Z" />
        <rect x="29.4" y="28.6" width="40.6" height="83.4" rx="7" transform="skewY(-22.2)" />
      </svg>

      {!symboleSeul && (
        <svg
          viewBox="0 0 644 146"
          height={hauteurMot}
          width={largeurMot}
          fill="none"
          stroke="currentColor"
          strokeWidth={17}
          strokeLinecap="butt"
          role="img"
          aria-label="workie"
          style={{ flexShrink: 0, display: "block", overflow: "visible" }}
        >
          {/* Le w monte au-dessus de la ligne d'x et se fait couper à
              l'équerre : une terminaison en bout de diagonale serait sinon
              coupée perpendiculairement au trait, et non à l'horizontale. */}
          <clipPath id="workie-hx">
            <rect x="-30" y="46" width="700" height="120" />
          </clipPath>
          <polyline
            points="-8,28 39,146 78,28 117,146 165,28"
            clipPath="url(#workie-hx)"
            strokeLinejoin="miter"
            strokeMiterlimit={12}
          />
          <circle cx="238" cy="96" r="44.2" />
          <path d="M319 146 V 74 Q 319 46 358 46" />
          {/* Bras et jambe du k partent d'un même point, pris contre la hampe,
              et gagnent tous deux 70 en abscisse. */}
          <path d="M395 0 V 146" />
          <path d="M473 46 L 403 89 L 473 146" />
          <path d="M502 46 V 146" />
          <circle cx="502" cy="18" r="12" fill="currentColor" stroke="none" />
          <path d="M627 96 A 44.2 44.2 0 1 0 620 119" />
          <path d="M539 96 H 627" />
        </svg>
      )}
    </span>
  );
}
