import { unstable_cache } from "next/cache";
import { notFound, permanentRedirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { RE_UUID } from "@/lib/urlFiche";

type Resolution = { id: string } | { vers: string } | null;

/**
 * D'un segment d'adresse à une fiche.
 *
 *   slug actuel        → la fiche ;
 *   ancien slug (fiche renommée) ou identifiant → redirection permanente vers
 *   l'adresse actuelle, pour que Google transfère le référencement ;
 *   rien               → 404.
 */
const resoudre = unstable_cache(
  async (segment: string): Promise<Resolution> => {
    // Tables et colonne hors des types générés.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any;
    if (RE_UUID.test(segment)) {
      const { data } = await admin.from("companies").select("slug").eq("id", segment).maybeSingle();
      return data?.slug ? { vers: data.slug } : null;
    }
    const { data } = await admin.from("companies").select("id").eq("slug", segment).maybeSingle();
    if (data) return { id: data.id };
    const { data: ancien } = await admin
      .from("slugs_anciens").select("companies(slug)").eq("slug", segment).maybeSingle();
    const actuel = ancien?.companies?.slug;
    return actuel ? { vers: actuel } : null;
  },
  ["resoudre-fiche"],
  { revalidate: 300, tags: ["companies"] }
);

/** L'identifiant de la fiche, ou redirige, ou 404. */
export async function idDeFiche(segment: string): Promise<string> {
  const r = await resoudre(decodeURIComponent(segment).toLowerCase()).catch(() => null);
  if (!r) notFound();
  if ("vers" in r) permanentRedirect(`/entreprise/${r.vers}`);
  return r.id;
}
