"use client";

import { createContext, useContext, useMemo } from "react";
import type { Langue } from "./config";
import { creerTraducteur, type Messages, type Traduire } from "./traduire";
import fr from "./messages/fr.json";

/**
 * La langue et ses textes, pour les composants du navigateur.
 *
 * Posé une fois, en haut de l'application. Sans fournisseur (tests, aperçus),
 * les composants retombent sur le français : jamais une clé brute à l'écran.
 */
type Contexte = { langue: Langue; t: Traduire };

const parDefaut: Contexte = { langue: "fr", t: creerTraducteur("fr", fr) };
const ContexteLangue = createContext<Contexte>(parDefaut);

export function FournisseurLangue({ langue, messages, children }: { langue: Langue; messages: Messages; children: React.ReactNode }) {
  const valeur = useMemo(() => ({ langue, t: creerTraducteur(langue, messages, fr) }), [langue, messages]);
  return <ContexteLangue.Provider value={valeur}>{children}</ContexteLangue.Provider>;
}

/** `const t = useT(); t("menu.explorer")` */
export function useT(): Traduire {
  return useContext(ContexteLangue).t;
}

export function useLangue(): Langue {
  return useContext(ContexteLangue).langue;
}
