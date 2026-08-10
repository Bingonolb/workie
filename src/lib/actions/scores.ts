"use server";

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureServerError } from "@/lib/monitoring";
import { refusDeContribution } from "@/lib/actions/compteVerifie";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function isBusiness(supabase: any, userId: string): Promise<boolean> {
  const { data } = await supabase.from("profiles").select("claimed_company_id").eq("id", userId).maybeSingle();
  return !!data?.claimed_company_id;
}

/**
 * Pose ou retire la flamme d'une entreprise.
 *
 * `pose` explicite l'intention, et ce n'est pas un détail : la fonction était
 * auparavant une bascule, et toggleFavorite l'appelait pour *ajouter* une
 * flamme. Si l'entreprise en portait déjà une, l'enregistrement du favori la
 * supprimait donc — le score baissait au lieu de monter, et la flamme
 * disparaissait de l'interface au rafraîchissement. Constaté en base : 34
 * favoris sans flamme et 12 flammes sans favori pour un seul compte.
 *
 * Une bascule ne doit jamais être appelée à la place d'un ajout. Les deux
 * intentions sont désormais distinctes et l'appelant choisit.
 */
async function ecrireFlamme(companyId: string, pose: boolean): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    // Un compte tout juste créé ne doit pas pouvoir déplacer une entreprise
    // dans le classement — c'est le levier de la fabrication de réputation.
    if (!user || refusDeContribution(user)) return;
    if (await isBusiness(supabase, user.id)) return;

    const { data: existante } = await supabase
      .from("score_events").select("id")
      .eq("company_id", companyId).eq("user_id", user.id).eq("event_type", "flame")
      .maybeSingle();

    if (pose && !existante) {
      const { error } = await supabase.from("score_events").insert({ company_id: companyId, user_id: user.id, event_type: "flame", points: 1 });
      if (error) { captureServerError(error, { action: "poserFlamme", companyId }); return; }
    } else if (!pose && existante) {
      const { error } = await supabase.from("score_events").delete().eq("id", existante.id);
      if (error) { captureServerError(error, { action: "retirerFlamme", companyId }); return; }
    } else {
      return; // déjà dans l'état voulu : rien à faire, et surtout rien à inverser
    }

    // Le classement doit refléter le geste immédiatement.
    revalidatePath("/explore");
    revalidatePath("/ranking");
    revalidatePath(`/company/${companyId}`);
    revalidateTag("companies", {});
    revalidateTag("top-companies", {});
  } catch (e) { captureServerError(e, { action: "ecrireFlamme", companyId }); }
}

export async function poserFlamme(companyId: string): Promise<void> {
  return ecrireFlamme(companyId, true);
}

export async function retirerFlamme(companyId: string): Promise<void> {
  return ecrireFlamme(companyId, false);
}

export async function addBoost(companyId: string): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || refusDeContribution(user)) return;
    if (await isBusiness(supabase, user.id)) return;

    const { data: existing } = await supabase
      .from("score_events").select("id")
      .eq("company_id", companyId).eq("user_id", user.id).eq("event_type", "boost")
      .maybeSingle();

    if (existing) {
      const { error } = await supabase.from("score_events").delete().eq("id", existing.id);
      if (error) { captureServerError(error, { action: "addBoost", step: "delete" }); return; }
      revalidatePath("/explore");
      revalidatePath("/ranking");
      revalidatePath(`/company/${companyId}`);
      return;
    }

    const { error } = await supabase.from("score_events").insert({ company_id: companyId, user_id: user.id, event_type: "boost", points: 100 });
    if (error) { captureServerError(error, { action: "addBoost", step: "insert" }); return; }
    revalidatePath("/explore");
    revalidatePath("/ranking");
    revalidatePath(`/company/${companyId}`);
    revalidateTag("companies", {});
    revalidateTag("top-companies", {});
  } catch (e) { captureServerError(e, { action: "addBoost" }); }
}

export async function addPenalty(companyId: string): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || refusDeContribution(user)) return;

    const { data: profile } = await supabase.from("profiles").select("role, penalty_credits").eq("id", user.id).maybeSingle();
    const isAdmin = profile?.role === "admin";
    const credits = Number(profile?.penalty_credits ?? 0);
    if (!isAdmin && credits <= 0) return;

    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("score_events").select("id")
      .eq("company_id", companyId).eq("user_id", user.id).eq("event_type", "penalty")
      .maybeSingle();

    if (existing) {
      await admin.from("score_events").delete().eq("id", existing.id);
      if (!isAdmin) await supabase.rpc("increment_penalty_credits", { uid: user.id, amount: 1 });
    } else {
      if (!isAdmin) {
        const { data: ok } = await supabase.rpc("spend_penalty_credit", { uid: user.id });
        if (!ok) return;
      }
      await admin.from("score_events").insert({ company_id: companyId, user_id: user.id, event_type: "penalty", points: -100 });
    }

    revalidatePath("/explore");
    revalidatePath("/ranking");
    revalidatePath(`/company/${companyId}`);
    revalidateTag("companies", {});
    revalidateTag("top-companies", {});
  } catch (e) { captureServerError(e, { action: "addPenalty" }); }
}

export async function getTopCompanies(limit = 200) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("companies")
    .select("id, name, sector, city, canton, employee_range, avg_rating, review_count, avg_salary_chf, cover_url, score, is_verified, tags")
    .order("score", { ascending: false })
    .order("avg_rating", { ascending: false })
    .order("review_count", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export const getCachedTopCompanies = unstable_cache(
  async (limit: number) => {
    const admin = createAdminClient();
    const { data } = await admin
      .from("companies")
      .select("id, name, sector, city, canton, employee_range, avg_rating, review_count, avg_salary_chf, cover_url, score, is_verified, tags")
      .order("score", { ascending: false })
      .order("avg_rating", { ascending: false })
      .order("review_count", { ascending: false })
      .limit(limit);
    return data ?? [];
  },
  ["top-companies"],
  { revalidate: 60, tags: ["top-companies"] }
);

export const getCachedReviewCount = unstable_cache(
  async () => {
    const admin = createAdminClient();
    const { count } = await admin.from("reviews").select("*", { count: "exact", head: true });
    return count ?? 0;
  },
  ["review-count"],
  { revalidate: 300, tags: ["reviews"] }
);

export async function getUserFlameIds(): Promise<string[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase.from("score_events").select("company_id").eq("user_id", user.id).eq("event_type", "flame");
  return (data ?? []).map((r: { company_id: string }) => r.company_id);
}
