import Image from "next/image";

/*
 * Le logotype Workie, en un seul endroit.
 *
 * Il était recopié dans neuf fichiers sous la forme d'un <span> au dégradé
 * violet-orange, avec des tailles qui divergeaient déjà d'un écran à l'autre.
 *
 * Une seule image, jamais deux.
 *
 * J'avais posé les deux versions fournies, encre claire et encre sombre, en
 * laissant une règle CSS montrer la bonne. Deux pannes en ont découlé en
 * production : les deux logos affichés côte à côte quand la règle n'arrivait
 * pas, puis plus de logo du tout quand elle arrivait mal. Un logotype est la
 * première chose que l'on voit d'un site : il ne peut pas dépendre d'une règle
 * qui décide laquelle de deux images cacher.
 *
 * Il n'en reste donc qu'une, celle à encre claire, et le thème clair
 * l'inverse. L'inversion ne touche que les composantes de couleur, la
 * transparence est préservée, et le blanc devient exactement noir. Surtout, si
 * la règle venait à manquer, le logo resterait affiché dans sa version claire
 * au lieu de disparaître : le thème sombre est celui par défaut du site, donc
 * la panne la plus probable ne se voit même pas.
 */

type Props = {
  /** Hauteur du logotype en pixels. */
  taille?: number;
  className?: string;
};

// Rapport du fichier fourni, une fois détouré : 960 sur 248.
const RAPPORT = 960 / 248;

export function Logo({ taille = 26, className }: Props) {
  const largeur = Math.round(taille * RAPPORT);

  return (
    <span
      className={className}
      style={{ display: "inline-flex", alignItems: "center", lineHeight: 0 }}
    >
      {/* La règle voyage avec le composant plutôt que dans la feuille globale.
          Constaté trois fois sur ce projet : le paquet CSS reste figé d'un
          déploiement à l'autre alors que le HTML se met bien à jour. Ici elle
          ne peut plus se désynchroniser de ce qu'elle habille. */}
      <style>{`html.light .logo-workie { filter: invert(1); }`}</style>
      <Image
        className="logo-workie"
        src="/workie-logo-sombre.png"
        alt="Workie"
        width={largeur}
        height={taille}
        priority
        style={{ display: "block", height: taille, width: "auto" }}
      />
    </span>
  );
}
