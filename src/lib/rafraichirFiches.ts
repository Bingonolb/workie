"use client";

import { createClient } from "@/lib/supabase/client";
import type { Company } from "@/lib/types";

/**
 * Remet à jour des fiches restituées depuis la mémoire de l'onglet.
 *
 * L'Explorer et le Swipe gardent une copie de ce qu'on regardait, pour ne pas
 * tout recharger au retour. Mais cette copie gelait les fiches : un nom
 * corrigé (« Bosch Schweiz AG » devenu « Bosch ») restait affiché à l'ancien
 * tant que l'onglet vivait, alors que la fiche ouverte montrait le nouveau.
 *
 * On garde l'ordre et la position, et l'on remplace seulement le contenu des
 * fiches par leur version actuelle. Une fiche supprimée entre-temps disparaît.
 * En cas d'échec réseau, la copie reste affichée telle quelle.
 */
export async function rafraichirFiches<T extends { id?: string }>(liste: T[]): Promise<T[] | null> {
  const ids = [...new Set(liste.map(x => x.id).filter((id): id is string => typeof id === "string"))];
  if (ids.length === 0) return null;
  try {
    const supabase = createClient();
    const frais = new Map<string, Company>();
    // Par paquets : une adresse de requête trop longue serait refusée.
    for (let i = 0; i < ids.length; i += 150) {
      const { data, error } = await supabase.from("companies").select("*").in("id", ids.slice(i, i + 150));
      if (error) return null;
      for (const c of (data ?? []) as Company[]) frais.set(c.id, c);
    }
    return liste.flatMap(x => {
      if (typeof x.id !== "string") return [x]; // publicités et autres éléments
      const f = frais.get(x.id);
      return f ? [{ ...x, ...f } as T] : [];
    });
  } catch {
    return null;
  }
}
