"use server";

import { createClient, getUser } from "@/lib/supabase/server";
import { captureServerError } from "@/lib/monitoring";
import { RE_UUID } from "@/lib/urlFiche";

/**
 * Offres d'emploi gardées (signet). Privé : rien ici ne touche au classement,
 * contrairement à la flamme d'une entreprise.
 *
 * Deux intentions explicites plutôt qu'une bascule : appelée sur un état déjà
 * atteint, une bascule produit l'inverse de l'effet voulu (voir CLAUDE.md,
 * « Une bascule n'est jamais un ajout »). Les deux sont idempotentes.
 *
 * La table n'est pas dans les types générés : accès sans typage, encadré ici.
 */
type Table = {
  upsert: (v: object | object[], o: object) => { select: (c: string) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }> } & PromiseLike<{ error: { message: string } | null }>;
  delete: () => { eq: (c: string, v: string) => { eq: (c: string, v: string) => PromiseLike<{ error: { message: string } | null }> } };
};
async function table() {
  const supabase = await createClient();
  return { supabase, t: (supabase as unknown as { from: (n: string) => Table }).from("offres_enregistrees") };
}

export async function enregistrerOffre(offreId: string): Promise<boolean> {
  if (!RE_UUID.test(offreId)) return false;
  try {
    const user = await getUser();
    if (!user) return false;
    const { t } = await table();
    const { error } = await t.upsert({ user_id: user.id, job_offer_id: offreId }, { onConflict: "user_id,job_offer_id", ignoreDuplicates: true });
    if (error) { captureServerError(error, { action: "enregistrerOffre", offreId }); return false; }
    return true;
  } catch (e) { captureServerError(e, { action: "enregistrerOffre" }); return false; }
}

export async function retirerOffre(offreId: string): Promise<boolean> {
  if (!RE_UUID.test(offreId)) return false;
  try {
    const user = await getUser();
    if (!user) return false;
    const { t } = await table();
    const { error } = await t.delete().eq("user_id", user.id).eq("job_offer_id", offreId);
    if (error) { captureServerError(error, { action: "retirerOffre", offreId }); return false; }
    return true;
  } catch (e) { captureServerError(e, { action: "retirerOffre" }); return false; }
}

/**
 * Les offres gardées dans le navigateur avant d'avoir un compte rejoignent le
 * compte à la connexion. Sans doublon, en ignorant les identifiants invalides
 * et les offres disparues (la clé étrangère les refuse).
 */
export async function importerOffresAppareil(ids: string[]): Promise<{ ajoutees: number }> {
  try {
    const propres = [...new Set((Array.isArray(ids) ? ids : []).filter(x => typeof x === "string" && RE_UUID.test(x)))].slice(0, 300);
    if (!propres.length) return { ajoutees: 0 };
    const user = await getUser();
    if (!user) return { ajoutees: 0 };
    const { supabase, t } = await table();
    // Seulement les offres qui existent : une offre effacée entre-temps ferait
    // échouer tout le lot sur la clé étrangère.
    const { data: existantes } = await supabase.from("job_offers").select("id").in("id", propres);
    const valides = (existantes ?? []).map(o => o.id);
    if (!valides.length) return { ajoutees: 0 };
    const { data, error } = await t
      .upsert(valides.map(job_offer_id => ({ user_id: user.id, job_offer_id })), { onConflict: "user_id,job_offer_id", ignoreDuplicates: true })
      .select("job_offer_id");
    if (error) { captureServerError(error, { action: "importerOffresAppareil" }); return { ajoutees: 0 }; }
    return { ajoutees: data?.length ?? 0 };
  } catch (e) { captureServerError(e, { action: "importerOffresAppareil" }); return { ajoutees: 0 }; }
}
