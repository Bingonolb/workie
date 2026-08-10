"use client";

import { useState } from "react";

/**
 * Un état local qui suit sa propriété d'origine quand celle-ci change.
 *
 * `useState(propriete)` ne lit sa valeur qu'au tout premier rendu. Sur nos
 * pages statiques, c'est un piège : la coquille s'affiche avec « aucun favori,
 * aucun boost », puis /api/user/context arrive et corrige les propriétés — mais
 * l'état interne, lui, reste figé sur la valeur initiale.
 *
 * Conséquence observée en production : après un rafraîchissement, la flamme
 * d'une entreprise pourtant enregistrée restait éteinte. L'utilisateur cliquait
 * pour l'allumer, ce qui la retirait, et le compteur partait dans une boucle
 * incompréhensible.
 *
 * L'ajustement se fait pendant le rendu, comme le recommande React, et non dans
 * un effet : la valeur corrigée est peinte du premier coup, sans état
 * intermédiaire visible.
 *
 * Une modification locale n'est jamais écrasée au passage : on ne resynchronise
 * que lorsque la propriété a réellement changé de valeur. Un clic optimiste
 * survit donc aux rendus du parent, et cède la place dès que le serveur tranche.
 */
export function useEtatSynchronise<T>(propriete: T) {
  const [valeur, setValeur] = useState<T>(propriete);
  const [precedente, setPrecedente] = useState<T>(propriete);

  if (propriete !== precedente) {
    setPrecedente(propriete);
    setValeur(propriete);
  }

  return [valeur, setValeur] as const;
}
