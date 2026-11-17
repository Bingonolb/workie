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
  const motif = /\*\*(.+?)\*\*|\*(?!\s)(.+?)(?<!\s)\*/g;
  let dernier = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = motif.exec(ligne))) {
    if (m.index > dernier) morceaux.push(ligne.slice(dernier, m.index));
    morceaux.push(m[1] !== undefined
      ? <strong key={k++} style={{ color: "var(--text)", fontWeight: 700 }}>{texteRiche(m[1])}</strong>
      : <em key={k++}>{m[2]}</em>);
    dernier = m.index + m[0].length;
  }
  if (dernier < ligne.length) morceaux.push(ligne.slice(dernier));
  return morceaux.length === 1 ? morceaux[0] : <Fragment>{morceaux}</Fragment>;
}

/** Plusieurs lignes : retours à la ligne gardés. */
export function lignesRiches(texte: string): ReactNode {
  return texte.split("\n").map((l, i) => <Fragment key={i}>{i > 0 && <br />}{texteRiche(l)}</Fragment>);
}
