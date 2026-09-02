/*
 * Le logotype Workie, en un seul endroit.
 *
 * Il était jusqu'ici recopié dans neuf fichiers, sous la forme d'un <span> au
 * dégradé violet-orange. Neuf copies d'une marque, c'est neuf occasions de la
 * voir diverger : la taille variait déjà d'un écran à l'autre.
 *
 * Le dégradé disparaît. Le symbole et le mot sont tracés en `currentColor`,
 * donc noirs sur fond clair, blancs sur fond sombre, et gris quand ils sont
 * posés dans un texte secondaire. C'est le parti pris de LinkedIn et de
 * Stripe : une marque sobre, et une seule couleur d'accent réservée à ce sur
 * quoi on peut cliquer. Un logo bicolore qui côtoie des boutons violets fait
 * deux emblèmes concurrents, et l'accent perd sa fonction de signal.
 */

type Props = {
  /** Hauteur du symbole en pixels. Le mot suit la même échelle. */
  taille?: number;
  /** Symbole seul, sans le mot : pour les espaces étroits. */
  symboleSeul?: boolean;
  className?: string;
};

export function Logo({ taille = 22, symboleSeul = false, className }: Props) {
  return (
    <span
      className={className}
      // Ecart mesure sur le logotype fourni : 80 unites pour un symbole de 330,
      // soit 0,24 fois sa hauteur.
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
        <span
          style={{
            fontFamily: "var(--police-logo), var(--police), sans-serif",
            // Sur le logotype fourni, la hampe du k monte a 212 unites pour un
            // symbole de 330 : le mot est donc nettement plus bas que le
            // symbole. La hampe de Poppins valant 0,73 em, le corps du texte
            // vaut 0,88 fois la hauteur du symbole. A 1,16 il depassait le
            // symbole et ecrasait le dessin.
            fontSize: taille * 0.88,
            fontWeight: 300,
            // La géométrique respire d'elle-même : l'interlettrage négatif
            // qu'on donne aux grotesques la referme et casse ses cercles.
            letterSpacing: "normal",
            lineHeight: 1,
          }}
        >
          workie
        </span>
      )}
    </span>
  );
}
