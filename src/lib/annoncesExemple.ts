import type { AnnonceApercu, CarteApercu, EntrepriseApercu } from "@/components/ApercuSwipe";

/**
 * Cinq annonces d'exemple, pour montrer aux annonceurs comment une annonce se
 * glisse entre les fiches.
 *
 * Chacune répond à une décision qu'on prend en même temps qu'un changement
 * de poste : se former, apprendre une langue, déménager, préparer un
 * entretien, ou recruter. Aucun annonceur n'est nommé.
 */
const photo = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=940`;

export const ANNONCES_EXEMPLE: AnnonceApercu[] = [
  {
    type: "annonce", id: "exemple-langue",
    titre: "L'allemand qu'il vous faut pour ce poste",
    texte: "Cours du soir à Genève et Lausanne. Niveau B2 en 6 mois.",
    cta: "Voir les cours", image: photo(4778611), ciblage: "Genève · Vaud",
  },
  {
    type: "annonce", id: "exemple-recrutement",
    titre: "12 postes de développeurs à Lausanne",
    texte: "Une équipe de 40 personnes, 2 jours de télétravail par semaine.",
    cta: "Voir les postes", image: photo(3183150), ciblage: "Vaud · Informatique",
  },
  {
    type: "annonce", id: "exemple-logement",
    titre: "Un appartement près de votre futur travail",
    texte: "Des logements à louer dans toute la Suisse romande.",
    cta: "Voir les logements", image: photo(1571460), ciblage: "Suisse romande",
  },
  {
    type: "annonce", id: "exemple-formation",
    titre: "Un master en gardant votre poste",
    texte: "Cours le soir et le samedi, à Zurich et à Lausanne.",
    cta: "Voir le programme", image: photo(267885), ciblage: "Zurich · Vaud",
  },
  {
    type: "annonce", id: "exemple-entretien",
    titre: "Votre entretien, préparé en 1 heure",
    texte: "Un coach en ligne, le jour qui vous arrange.",
    cta: "Réserver", image: photo(5905709), ciblage: "Toute la Suisse",
  },
];

/** Une entreprise, une annonce, une entreprise : cinq de chaque. */
export function melangerAvecAnnonces(entreprises: EntrepriseApercu[]): CarteApercu[] {
  const cartes: CarteApercu[] = [];
  for (let i = 0; i < ANNONCES_EXEMPLE.length; i++) {
    if (entreprises[i]) cartes.push(entreprises[i]);
    cartes.push(ANNONCES_EXEMPLE[i]);
  }
  return cartes;
}
