import { listerOffres } from "@/lib/actions/espaceEntreprise";
import { GestionOffres } from "./GestionOffres";

export default async function PageOffres() {
  const offres = await listerOffres();
  // L'heure est lue côté serveur : un rendu ne doit pas dépendre de l'horloge du navigateur.
  return <GestionOffres offres={offres} maintenant={new Date().getTime()} />;
}
