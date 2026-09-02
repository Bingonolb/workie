import Image from "next/image";

/*
 * Le logotype Workie, en un seul endroit.
 *
 * Il était recopié dans neuf fichiers sous la forme d'un <span> au dégradé
 * violet-orange, avec des tailles qui divergeaient déjà d'un écran à l'autre.
 *
 * Le dessin est celui fourni, tel quel, jamais reconstruit. Il est livré en
 * deux versions, encre sombre et encre claire, et non recoloré par le code :
 * un logo n'est pas un aplat qu'on peut teinter, ses valeurs sont dessinées.
 *
 * Les deux images sont posées dans le balisage et c'est la feuille de styles
 * qui montre la bonne. Le thème est porté par une classe sur <html>, donc un
 * choix fait en JavaScript arriverait après le premier rendu : le logotype
 * clignoterait à chaque chargement en passant par la mauvaise version.
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
      className={`logo-empile${className ? ` ${className}` : ""}`}
      style={{ display: "inline-flex", alignItems: "center", lineHeight: 0 }}
    >
      {/* Les règles de bascule voyagent avec le composant plutôt que dans la
          feuille globale.

          Constaté en production, et pour la troisième fois sur ce projet : le
          paquet CSS reste figé d'un déploiement à l'autre alors que le HTML se
          met bien à jour. Le balisage arrive donc avec ses deux images et sans
          les règles qui en cachent une, et le logotype s'affiche en double.
          Ici la règle ne peut plus se désynchroniser de ce qu'elle habille.

          Une position absolue plutôt qu'un simple display: none : la seconde
          image sort du flux, si bien que les deux occupent exactement la même
          place et que rien ne bouge si l'une manque. */}
      <style>{`
        .logo-empile { position: relative; }
        .logo-empile .logo-encre-sombre { position: absolute; inset: 0; opacity: 0; }
        .logo-empile .logo-encre-claire { opacity: 1; }
        html.light .logo-empile .logo-encre-sombre { opacity: 1; }
        html.light .logo-empile .logo-encre-claire { opacity: 0; }
      `}</style>
      <Image
        className="logo-encre-sombre"
        src="/workie-logo.png"
        alt="Workie"
        width={largeur}
        height={taille}
        priority
        style={{ height: taille, width: "auto" }}
      />
      <Image
        className="logo-encre-claire"
        src="/workie-logo-sombre.png"
        alt=""
        aria-hidden="true"
        width={largeur}
        height={taille}
        priority
        style={{ height: taille, width: "auto" }}
      />
    </span>
  );
}
