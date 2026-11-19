"use server";

import { createClient, getUser } from "@/lib/supabase/server";
import { poserFlamme, retirerFlamme } from "@/lib/actions/scores";
import { captureServerError } from "@/lib/monitoring";
import type { Company } from "@/lib/types";

export async function toggleFavorite(companyId: string): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: existing } = await supabase
      .from("favorites").select("company_id").eq("user_id", user.id).eq("company_id", companyId).maybeSingle();

    if (existing) {
      // La flamme suit le favori. Elle restait auparavant en place au retrait,
      // ce qui laissait des flammes orphelines gonflant le score d'entreprises
      // que l'utilisateur avait pourtant retirées.
      await Promise.all([
        supabase.from("favorites").delete().eq("user_id", user.id).eq("company_id", companyId),
        retirerFlamme(companyId),
      ]);
    } else {
      const [{ error }] = await Promise.all([
        supabase.from("favorites").insert({ user_id: user.id, company_id: companyId }),
        poserFlamme(companyId),
      ]);
      if (error && error.code !== "23505") captureServerError(error, { action: "toggleFavorite", step: "insert", companyId });
    }
    // Profil et favoris lisent leurs données à la demande (routes privées) :
    // rien à vider, et surtout pas les fiches, communes à tous les visiteurs.
  } catch (e) { captureServerError(e, { action: "toggleFavorite" }); }
}

/**
 * Les favoris gardés dans le navigateur avant d'avoir un compte rejoignent le
 * compte, à la première connexion. Sans doublon (clé primaire), en ignorant
 * les identifiants invalides ou les entreprises disparues.
 *
 * Pas de flamme ici : un visiteur pourrait sinon fabriquer des centaines de
 * points de classement depuis un navigateur, puis les encaisser en créant un
 * compte. Les flammes se gagnent par des gestes faits en étant connecté.
 */
export async function importerFavorisInvite(ids: string[]): Promise<{ ajoutes: number }> {
  try {
    const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const propres = [...new Set((Array.isArray(ids) ? ids : []).filter(x => typeof x === "string" && UUID.test(x)))].slice(0, 300);
    if (!propres.length) return { ajoutes: 0 };
    const [user, supabase] = await Promise.all([getUser(), createClient()]);
    if (!user) return { ajoutes: 0 };
    // Seulement les entreprises qui existent et sont visibles.
    const { data: existantes } = await supabase.from("companies").select("id").in("id", propres);
    const valides = (existantes ?? []).map(c => c.id);
    if (!valides.length) return { ajoutes: 0 };
    const { data, error } = await supabase.from("favorites")
      .upsert(valides.map(company_id => ({ user_id: user.id, company_id })), { onConflict: "user_id,company_id", ignoreDuplicates: true })
      .select("company_id");
    if (error) { captureServerError(error, { action: "importerFavorisInvite" }); return { ajoutes: 0 }; }
    return { ajoutes: data?.length ?? 0 };
  } catch (e) { captureServerError(e, { action: "importerFavorisInvite" }); return { ajoutes: 0 }; }
}

export async function getFavorites(): Promise<Company[]> {
  try {
    // getUser() est mis en cache pour la durée de la requête, contrairement à
    // supabase.auth.getUser() appelé directement : la page des favoris
    // vérifiait ainsi l'identité deux fois, soit un aller-retour réseau de
    // trop avant même de lire les données.
    const [user, supabase] = await Promise.all([getUser(), createClient()]);
    if (!user) return [];

    const { data } = await supabase
      .from("favorites")
      .select("companies(id, slug, name, sector, subsector, city, canton, employee_range, avg_rating, review_count, avg_salary_chf, cover_url, cover_color, logo_url, score, is_verified, description)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((data ?? []).map((r: any) => r.companies).filter(Boolean)) as Company[];
  } catch (e) { captureServerError(e, { action: "getFavorites" }); return []; }
}

export async function getUserFavoriteIds(): Promise<string[]> {
  try {
    const [user, supabase] = await Promise.all([getUser(), createClient()]);
    if (!user) return [];
    const { data } = await supabase.from("favorites").select("company_id").eq("user_id", user.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((r: any) => r.company_id);
  } catch (e) { captureServerError(e, { action: "getUserFavoriteIds" }); return []; }
}
