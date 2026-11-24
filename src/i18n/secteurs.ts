import type { Langue } from "./config";

/**
 * Le nom affiché d'un secteur, dans chaque langue.
 *
 * La valeur enregistrée reste le nom français (base, adresses
 * « ?sector=Santé », filtres) : seule l'étiquette change de langue. Un lien
 * partagé fonctionne donc quelle que soit la langue de celui qui l'ouvre.
 * Un secteur absent d'une langue s'affiche en français, jamais vide.
 */
const DE: Record<string, string> = {
  "Administration publique": "Öffentliche Verwaltung",
  "Aéronautique & Spatial": "Luft- & Raumfahrt",
  "Agriculture": "Landwirtschaft",
  "Alimentation": "Lebensmittel",
  "Association": "Verbände",
  "Assurances": "Versicherungen",
  "Automobile": "Automobil",
  "Bâtiment": "Bau",
  "Beauté": "Kosmetik",
  "Biens de consommation": "Konsumgüter",
  "Chimie": "Chemie",
  "Commerce de détail": "Detailhandel",
  "Conseil": "Beratung",
  "Défense & Sécurité": "Verteidigung & Sicherheit",
  "Droit": "Recht",
  "Éducation & Recherche": "Bildung & Forschung",
  "Énergie": "Energie",
  "Finance": "Finanzen",
  "Fondation": "Stiftungen",
  "Horlogerie & Joaillerie": "Uhren & Schmuck",
  "Hôtellerie & Restauration": "Hotellerie & Gastronomie",
  "Immobilier & Gérance": "Immobilien & Verwaltung",
  "Industrie": "Industrie",
  "Ingénierie": "Ingenieurwesen",
  "Logistique & Supply Chain": "Logistik & Supply Chain",
  "Matières premières": "Rohstoffe",
  "Médias & Communication": "Medien & Kommunikation",
  "Mode & Luxe": "Mode & Luxus",
  "ONG": "NGOs",
  "Organisations internationales": "Internationale Organisationen",
  "Pharma": "Pharma",
  "Santé": "Gesundheit",
  "Sport": "Sport",
  "Tech": "Tech",
  "Télécoms": "Telekommunikation",
  "Transport": "Transport",
};

const NOMS: Partial<Record<Langue, Record<string, string>>> = { de: DE };

export function nomSecteur(secteur: string | null | undefined, langue: Langue): string {
  if (!secteur) return "";
  return NOMS[langue]?.[secteur] ?? secteur;
}
