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
  reporter_email: string | null;
  reporter_name: string | null;
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

  const rows = data as Omit<Report, "target_url" | "reporter_email" | "reporter_name">[];

  // Batch-resolve reporter info (email from auth, name from profiles)
  const reporterIds = [...new Set(rows.map(r => r.reporter_id).filter(Boolean))] as string[];
  const reporterEmailMap: Record<string, string> = {};
  const reporterNameMap: Record<string, string> = {};

  await Promise.all([
    // Emails via auth admin API
    ...reporterIds.map(async id => {
      try {
        const { data: u } = await admin.auth.admin.getUserById(id);
        if (u?.user?.email) reporterEmailMap[id] = u.user.email;
      } catch { /* ignore */ }
    }),
    // Names via profiles table
    (async () => {
      if (reporterIds.length === 0) return;
      const { data: profiles } = await admin
        .from("profiles")
        .select("id, full_name")
        .in("id", reporterIds);
      if (profiles) {
        for (const p of profiles as { id: string; full_name: string | null }[]) {
          if (p.full_name) reporterNameMap[p.id] = p.full_name;
        }
      }
    })(),
  ]);

  // Resolve company_id for review-type reports so admin can navigate to them
  const reviewIds = rows.filter(r => r.target_type === "review").map(r => r.target_id);
  const reviewCompanyMap: Record<string, string> = {};
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
    return {
      ...r,
      target_url,
      reporter_email: r.reporter_id ? (reporterEmailMap[r.reporter_id] ?? null) : null,
      reporter_name:  r.reporter_id ? (reporterNameMap[r.reporter_id] ?? null) : null,
    };
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

export async function deleteReportedContent(
  reportId: string,
  targetType: ReportTargetType,
  targetId: string,
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

  if (targetType === "review") {
    const { error } = await admin.from("reviews").delete().eq("id", targetId);
    if (error) return { error: error.message };
  } else if (targetType === "company") {
    // Mark company as hidden rather than hard-delete (too destructive)
    const { error } = await admin.from("companies").update({ is_verified: false }).eq("id", targetId);
    if (error) return { error: error.message };
  } else if (targetType === "profile") {
    const { error } = await admin.auth.admin.deleteUser(targetId);
    if (error) return { error: error.message };
  } else {
    return { error: "Type de cible non supporté." };
  }

  // Mark the report as reviewed after deleting content
  await admin.from("reports").update({ status: "reviewed" }).eq("id", reportId);

  return {};
}
