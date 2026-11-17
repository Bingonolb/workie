import { Fragment, type ReactNode } from "react";

/**
 * Gras et italique dans le texte d'une offre : **gras**, *italique*.
 *
 * Volontairement minimal. On construit des éléments React, jamais du HTML :
 * un texte saisi par une entreprise ne peut donc rien injecter dans la page.
 * Une marque non refermée reste affichée telle quelle.
 */
export function texteRiche(ligne: string): ReactNode {
  const morceaux: ReactNode[] = [];
  // Trois étoiles d'abord (gras + italique), puis deux, puis une.
  const motif = /\*\*\*(?!\s)(.+?)(?<!\s)\*\*\*|\*\*(?!\s)(.+?)(?<!\s)\*\*|\*(?!\s)(.+?)(?<!\s)\*/g;
  const gras: React.CSSProperties = { color: "var(--text)", fontWeight: 700 };
  let dernier = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = motif.exec(ligne))) {
    if (m.index > dernier) morceaux.push(ligne.slice(dernier, m.index));
    morceaux.push(
      m[1] !== undefined ? <strong key={k++} style={gras}><em>{texteRiche(m[1])}</em></strong>
      : m[2] !== undefined ? <strong key={k++} style={gras}>{texteRiche(m[2])}</strong>
      : <em key={k++}>{texteRiche(m[3])}</em>);
    dernier = m.index + m[0].length;
  }
  if (dernier < ligne.length) morceaux.push(ligne.slice(dernier));
  return morceaux.length === 1 ? morceaux[0] : <Fragment>{morceaux}</Fragment>;
}

/** Plusieurs lignes : retours à la ligne gardés. */
export function lignesRiches(texte: string): ReactNode {
  return texte.split("\n").map((l, i) => <Fragment key={i}>{i > 0 && <br />}{texteRiche(l)}</Fragment>);
}
