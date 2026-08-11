/**
 * Synthèse d'une question à trois réponses possibles : oui, non, ou une
 * nuance (« peut-être », « ça dépend »).
 *
 * ── Pourquoi ce fichier existe ──────────────────────────────────────────────
 *
 * Un pourcentage unique ne peut pas dire la vérité sur ces réponses, parce
 * qu'il faut choisir un dénominateur et qu'aucun choix n'est bon partout :
 *
 *  · dénominateur = les seules réponses tranchées. Chez Running, 1 « oui » et
 *    1 « peut-être » donnaient « 100 % reviendraient ». Une personne sur deux
 *    l'a dit ; annoncer 100 % est faux.
 *
 *  · dénominateur = tout le monde, les nuances comptées comme des refus. Chez
 *    KPMG, l'unique « peut-être » donnait « 0 % reviendraient ». Personne n'a
 *    dit non ; annoncer 0 % est faux aussi.
 *
 * Le défaut n'est donc pas dans le dénominateur, il est dans le fait de
 * réduire trois réponses à un nombre. La sortie ci-dessous prend la forme que
 * les données autorisent, et rien de plus :
 *
 *  · personne n'a répondu            → on n'affirme rien ;
 *  · personne n'a tranché            → « partagé », pas un pourcentage ;
 *  · trop peu de réponses            → « 1/2 », exact et non extrapolable ;
 *  · assez de réponses               → un pourcentage, dénominateur = tous
 *                                       ceux qui ont répondu.
 *
 * Dans les deux dernières formes, une nuance n'est jamais comptée comme un
 * oui, et le nombre de nuances est reporté à côté pour que le lecteur voie ce
 * que le chiffre ne dit pas.
 */

/**
 * En dessous de ce nombre de réponses, un pourcentage donne une précision
 * qu'il n'a pas : « 50 % » sur deux personnes se lit comme une tendance alors
 * que c'est une personne. On montre alors la fraction brute.
 */
export const SEUIL_POURCENTAGE = 4;

export type Synthese =
  /** Aucune réponse exploitable. */
  | { forme: "aucune" }
  /** Des réponses, mais aucune tranchée : que des nuances. */
  | { forme: "partagee"; total: number; mitiges: number }
  /** Trop peu de réponses pour un taux : la fraction brute. */
  | { forme: "fraction"; oui: number; total: number; mitiges: number }
  /** Assez de réponses : un taux, sur l'ensemble des répondants. */
  | { forme: "pourcentage"; pct: number; total: number; mitiges: number };

/**
 * @param valeurs  une entrée par avis ; `null` quand la question est restée
 *                 sans réponse (les anciens avis n'avaient pas ce champ).
 * @param oui      la valeur qui compte comme un oui franc.
 * @param non      la valeur qui compte comme un non franc. Tout le reste est
 *                 une nuance.
 */
export function synthetiser(
  valeurs: readonly (string | null | undefined)[],
  oui: string,
  non: string
): Synthese {
  let nOui = 0;
  let nNon = 0;
  let nMitiges = 0;

  for (const v of valeurs) {
    if (v === null || v === undefined || v === "") continue;
    if (v === oui) nOui++;
    else if (v === non) nNon++;
    else nMitiges++;
  }

  const total = nOui + nNon + nMitiges;

  if (total === 0) return { forme: "aucune" };
  if (nOui === 0 && nNon === 0) return { forme: "partagee", total, mitiges: nMitiges };
  if (total < SEUIL_POURCENTAGE) return { forme: "fraction", oui: nOui, total, mitiges: nMitiges };

  return { forme: "pourcentage", pct: Math.round((nOui / total) * 100), total, mitiges: nMitiges };
}

/**
 * La part de oui, entre 0 et 1, ou `null` quand la question ne se pose pas.
 * Sert à colorer l'affichage, jamais à produire le texte : une couleur peut
 * être approximative, une affirmation non.
 */
export function partDeOui(s: Synthese): number | null {
  switch (s.forme) {
    case "aucune": return null;
    case "partagee": return null;
    case "fraction": return s.oui / s.total;
    case "pourcentage": return s.pct / 100;
  }
}
