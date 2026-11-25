import type { Langue } from "./config";

/**
 * Le nom d'une ville dans la langue de la page.
 *
 * Les fiches enregistrent le nom français (« Genève », « Bâle »). Un lecteur
 * germanophone cherche « Genf » et « Basel » : seules les villes qui ont un
 * nom différent sont listées, les autres s'écrivent pareil partout.
 */
const DE: Record<string, string> = {
  "Multi-sites": "Mehrere Standorte",
  Zurich: "Zürich", Genève: "Genf", Berne: "Bern", Bâle: "Basel", Zoug: "Zug",
  Lucerne: "Luzern", Winterthour: "Winterthur", "Saint-Gall": "St. Gallen",
  Neuchâtel: "Neuenburg", Schaffhouse: "Schaffhausen", Sion: "Sitten",
  "Saint-Moritz": "St. Moritz", Fribourg: "Freiburg", Coire: "Chur",
  Granges: "Grenchen", Brigue: "Brig", Soleure: "Solothurn", Thoune: "Thun",
  Bienne: "Biel", "Biel/Bienne": "Biel/Bienne", Delémont: "Delsberg", Sierre: "Siders",
  Morat: "Murten", Bellinzone: "Bellinzona", "Villars-sur-Glâne": "Villars-sur-Glâne",
};
const NOMS: Partial<Record<Langue, Record<string, string>>> = { de: DE };

export function nomVille(ville: string, langue: Langue): string {
  return NOMS[langue]?.[ville] ?? ville;
}
