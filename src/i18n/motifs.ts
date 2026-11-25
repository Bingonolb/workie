import type { Langue } from "./config";

/**
 * Le motif d'un signalement, affiché dans la langue de la page.
 *
 * La valeur enregistrée reste le motif français : c'est ce que lit l'équipe
 * qui traite les signalements, quelle que soit la langue du visiteur.
 */
const DE: Record<string, string> = {
  "Faux avis / avis fictif": "Gefälschte oder erfundene Bewertung",
  "Contenu offensant ou haineux": "Beleidigender oder hasserfüllter Inhalt",
  "Harcèlement ou menaces": "Belästigung oder Drohungen",
  "Spam ou publicité": "Spam oder Werbung",
  "Informations incorrectes": "Falsche Informationen",
  "Conflit d'intérêts": "Interessenkonflikt",
  "Autre": "Anderes",
  "Entreprise fictive ou frauduleuse": "Fiktives oder betrügerisches Unternehmen",
  "Contenu offensant": "Beleidigender Inhalt",
  "Spam": "Spam",
  "Contenu à caractère sexuel": "Sexueller Inhalt",
  "Violence ou haine": "Gewalt oder Hass",
  "Arnaque ou publicité mensongère": "Betrug oder irreführende Werbung",
  "Contenu illégal": "Illegaler Inhalt",
  "Sans rapport avec le travail": "Kein Bezug zur Arbeit",
  "Faux profil": "Gefälschtes Profil",
  "Usurpation d'identité": "Identitätsdiebstahl",
  "Contenu inapproprié": "Unangemessener Inhalt",
};
const NOMS: Partial<Record<Langue, Record<string, string>>> = { de: DE };

export function nomMotif(motif: string, langue: Langue): string {
  return NOMS[langue]?.[motif] ?? motif;
}
