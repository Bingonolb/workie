/*
 * Le logotype Workie, en un seul endroit.
 *
 * Il etait recopie dans neuf fichiers sous la forme d'un <span> au degrade
 * violet-orange, avec des tailles qui divergeaient deja d'un ecran a l'autre.
 *
 * Le trace est un vectoriel, obtenu par vectorisation du dessin fourni. Le
 * fichier d'origine etait une image matricielle, c'est-a-dire une grille de
 * pixels : reduite a vingt-huit pixels de haut dans la barre de navigation,
 * elle perdait la nettete de ses traits fins et paraissait floue sur les
 * ecrans denses. Un vectoriel decrit des courbes, donc il est net a toutes les
 * tailles et pese moins.
 *
 * Une seule image, jamais deux. J'avais pose les deux versions fournies en
 * laissant une regle CSS montrer la bonne : deux pannes en ont decoule en
 * production, les deux logos cote a cote puis plus de logo du tout. Un
 * logotype ne peut pas dependre d'une regle chargee de cacher une image sur
 * deux. Il n'en reste qu'une, a encre claire, et le theme clair l'inverse.
 * Si la regle venait a manquer, le logo resterait affiche : le theme sombre
 * etant celui par defaut, la panne la plus probable ne se verrait meme pas.
 */

type Props = {
  /** Hauteur du logotype en pixels. */
  taille?: number;
  className?: string;
};

// Rapport du trace vectoriel, marge comprise.
const RAPPORT = 5168 / 1384;

export function Logo({ taille = 26, className }: Props) {
  const largeur = Math.round(taille * RAPPORT);

  return (
    <span
      className={className}
      style={{ display: "inline-flex", alignItems: "center", lineHeight: 0 }}
    >
      {/* La regle voyage avec le composant plutot que dans la feuille globale.
          Constate trois fois sur ce projet : le paquet CSS reste fige d'un
          deploiement a l'autre alors que le HTML se met bien a jour. Ici elle
          ne peut plus se desynchroniser de ce qu'elle habille. */}
      <style>{`html.light .logo-workie { filter: invert(1); }`}</style>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="logo-workie"
        src="/workie-logo.svg"
        alt="Workie"
        width={largeur}
        height={taille}
        style={{ display: "block", height: taille, width: "auto" }}
      />
    </span>
  );
}
