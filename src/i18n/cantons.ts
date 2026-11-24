import type { Langue } from "./config";

/**
 * Le nom d'un canton dans chaque langue, à partir de son code (« GE »). Les
 * codes restent ceux enregistrés partout (base, adresses « ?canton=GE ») ;
 * seul le nom affiché change. Un canton absent d'une langue garde le nom
 * français fourni par l'appelant.
 */
const DE: Record<string, string> = {
  AG: "Aargau", AI: "Appenzell Innerrhoden", AR: "Appenzell Ausserrhoden", BE: "Bern",
  BL: "Basel-Landschaft", BS: "Basel-Stadt", FR: "Freiburg", GE: "Genf", GL: "Glarus",
  GR: "Graubünden", JU: "Jura", LU: "Luzern", NE: "Neuenburg", NW: "Nidwalden",
  OW: "Obwalden", SG: "St. Gallen", SH: "Schaffhausen", SO: "Solothurn", SZ: "Schwyz",
  TG: "Thurgau", TI: "Tessin", UR: "Uri", VD: "Waadt", VS: "Wallis", ZG: "Zug", ZH: "Zürich",
  CH: "Ganze Schweiz", FL: "Liechtenstein",
};
const NOMS: Partial<Record<Langue, Record<string, string>>> = { de: DE };

export function nomCanton(code: string, langue: Langue, nomFrancais: string): string {
  return NOMS[langue]?.[code] ?? nomFrancais;
}
