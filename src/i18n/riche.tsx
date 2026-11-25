import { Fragment, type ReactNode } from "react";

/**
 * Un texte traduit qui contient des liens ou du gras.
 *
 * La traduction garde l'ordre naturel de sa langue et marque les morceaux
 * par des balises : « voir les <mentions>mentions légales</mentions> ». Le
 * composant fournit ce que chaque balise devient (un lien, du gras). Un
 * retour à la ligne double (« \n\n ») sépare deux paragraphes.
 *
 * Aucune balise HTML n'est interprétée : seules celles fournies par l'appelant
 * existent, le reste s'affiche tel quel.
 */
export function riche(texte: string, balises: Record<string, (contenu: ReactNode) => ReactNode> = {}): ReactNode {
  const paragraphes = texte.split(/\n\n/);
  return paragraphes.map((p, i) => (
    <Fragment key={i}>
      {i > 0 && <><br /><br /></>}
      {morceaux(p, balises)}
    </Fragment>
  ));
}

function morceaux(texte: string, balises: Record<string, (contenu: ReactNode) => ReactNode>): ReactNode[] {
  const sortie: ReactNode[] = [];
  const motif = /<(\w+)>([\s\S]*?)<\/\1>/g;
  let fin = 0;
  for (const m of texte.matchAll(motif)) {
    const [entier, nom, contenu] = m;
    const debut = m.index ?? 0;
    if (debut > fin) sortie.push(texte.slice(fin, debut));
    // <b> est le gras ordinaire, disponible partout sans le redéclarer.
    const rendre = balises[nom] ?? (nom === "b" ? (x: ReactNode) => <strong>{x}</strong> : undefined);
    sortie.push(<Fragment key={debut}>{rendre ? rendre(contenu) : entier}</Fragment>);
    fin = debut + entier.length;
  }
  if (fin < texte.length) sortie.push(texte.slice(fin));
  return sortie;
}

/** Le même texte sans balises, pour les données structurées (moteurs de recherche). */
export function sansBalises(texte: string): string {
  return texte.replace(/<(\w+)>([\s\S]*?)<\/\1>/g, "$2").replace(/\n\n/g, " ");
}
