"use server";

import { revalidatePath } from "next/cache";
import { createClient, getUser } from "@/lib/supabase/server";
import { addFlame } from "@/lib/actions/scores";
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
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("company_id", companyId);
    } else {
      const [{ error }] = await Promise.all([
        supabase.from("favorites").insert({ user_id: user.id, company_id: companyId }),
        addFlame(companyId),
      ]);
      if (error && error.code !== "23505") captureServerError(error, { action: "toggleFavorite", step: "insert", companyId });
    }
    revalidatePath("/profile");
    revalidatePath("/favorites");
    revalidatePath(`/company/${companyId}`);
  } catch (e) { captureServerError(e, { action: "toggleFavorite" }); }
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
      .select("companies(id, name, sector, subsector, city, canton, employee_range, avg_rating, review_count, avg_salary_chf, cover_url, cover_color, logo_url, score, is_verified, tags, description)")
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
