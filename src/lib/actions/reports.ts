"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";

export type ReportTargetType = "review" | "company" | "profile";
export type ReportStatus = "pending" | "reviewed" | "dismissed";

export interface Report {
  id: string;
  created_at: string;
  reporter_id: string | null;
  target_type: ReportTargetType;
  target_id: string;
  target_label: string | null;
  category: string;
  explanation: string | null;
  status: ReportStatus;
  target_url: string | null;
}

export async function submitReport(payload: {
  targetType: ReportTargetType;
  targetId: string;
  targetLabel: string;
  category: string;
  explanation: string;
}): Promise<{ error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Vous devez être connecté pour signaler." };

  const supabase = await createClient();
  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    target_type: payload.targetType,
    target_id: payload.targetId,
    target_label: payload.targetLabel || null,
    category: payload.category,
    explanation: payload.explanation || null,
    status: "pending",
  });

  if (error) return { error: "Erreur lors de l'envoi. Veuillez réessayer." };
  return {};
}

export async function getReports(): Promise<{ reports?: Report[]; error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Non autorisé" };

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") return { error: "Accès refusé" };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };

  const rows = data as Omit<Report, "target_url">[];

  // Resolve company_id for review-type reports so admin can navigate to them
  const reviewIds = rows.filter(r => r.target_type === "review").map(r => r.target_id);
  let reviewCompanyMap: Record<string, string> = {};
  if (reviewIds.length > 0) {
    const { data: reviews } = await admin
      .from("reviews")
      .select("id, company_id")
      .in("id", reviewIds);
    if (reviews) {
      for (const rv of reviews as { id: string; company_id: string }[]) {
        reviewCompanyMap[rv.id] = rv.company_id;
      }
    }
  }

  const reports: Report[] = rows.map(r => {
    let target_url: string | null = null;
    if (r.target_type === "company") target_url = `/company/${r.target_id}`;
    else if (r.target_type === "profile") target_url = `/profile/${r.target_id}`;
    else if (r.target_type === "review" && reviewCompanyMap[r.target_id])
      target_url = `/company/${reviewCompanyMap[r.target_id]}`;
    return { ...r, target_url };
  });

  return { reports };
}

export async function updateReportStatus(
  id: string,
  status: "reviewed" | "dismissed"
): Promise<{ error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Non autorisé" };

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") return { error: "Accès refusé" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("reports")
    .update({ status })
    .eq("id", id);

  if (error) return { error: error.message };
  return {};
}
