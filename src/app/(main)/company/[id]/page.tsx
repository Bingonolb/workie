import { idDeFiche } from "@/lib/resoudreFiche";

/**
 * Ancienne adresse des fiches (/company/{uuid}). Elle redirige en permanence
 * (308) vers /entreprise/{slug} : les liens déjà indexés par Google, partagés
 * ou envoyés dans des notifications continuent de marcher et transmettent leur
 * référencement à la nouvelle adresse.
 */
export const revalidate = 300;

export default async function AncienneFiche({ params }: { params: Promise<{ id: string }> }) {
  await idDeFiche((await params).id);
  return null;
}
