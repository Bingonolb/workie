import { cookies } from "next/headers";
import { COOKIE_LANGUE, estOuverte, type Langue } from "./config";
import { traducteur } from "./serveur";
import type { Traduire } from "./traduire";

/**
 * Le traducteur d'une action serveur ou d'une route d'API.
 *
 * `next/root-params` n'y est pas disponible : on prend la langue envoyée par
 * la page quand elle est fournie, sinon celle gardée dans le cookie.
 */
export async function tRequete(envoyee?: unknown): Promise<Traduire> {
  return traducteur(typeof envoyee === "string" && envoyee ? envoyee : (await cookies()).get(COOKIE_LANGUE)?.value);
}

/** La langue gardée dans le cookie du visiteur, si elle est ouverte ; « fr » à défaut. */
export async function langueRequete(): Promise<Langue> {
  const l = (await cookies()).get(COOKIE_LANGUE)?.value;
  return estOuverte(l) ? l : "fr";
}
