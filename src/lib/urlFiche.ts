/**
 * L'adresse publique d'une fiche : /entreprise/omega plutôt que
 * /company/37f4128a-…. Un nom lisible dans l'adresse aide Google et celui qui
 * lit le lien avant de cliquer.
 *
 * Sans slug connu (une donnée qui ne l'a pas sélectionné), l'ancienne adresse
 * reste valable : elle redirige en permanence vers la nouvelle.
 */
export function urlFiche(c: { id: string; slug?: string | null }): string {
  return c.slug ? `/entreprise/${c.slug}` : `/company/${c.id}`;
}

export const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
