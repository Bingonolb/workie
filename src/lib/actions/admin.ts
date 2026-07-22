"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient, getUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendClaimApprovedEmail } from "@/lib/email";

async function requireAdmin() {
  const [user, supabase] = await Promise.all([getUser(), createClient()]);
  if (!user) throw new Error("Non authentifié");
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (data?.role !== "admin") throw new Error("Accès refusé");
  return { user, supabase };
}

export async function adminUpdateCompany(id: string, formData: FormData): Promise<{ error?: string }> {
  try {
    await requireAdmin();
    const admin = createAdminClient();

    const ALLOWED_IMG = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const EXT_MAP: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
    const MAX_IMG = 10 * 1024 * 1024;

    // Handle cover file upload (takes priority over URL field)
    let cover_url: string | null = String(formData.get("cover_url") || "") || null;
    const coverFile = formData.get("cover_file");
    if (coverFile instanceof File && coverFile.size > 0) {
      if (!ALLOWED_IMG.includes(coverFile.type)) return { error: "Format non supporté (JPG, PNG, WebP, GIF)." };
      if (coverFile.size > MAX_IMG) return { error: "Image trop lourde (max 10 MB)." };
      const ext = EXT_MAP[coverFile.type] ?? "jpg";
      const path = `covers/${id}/${randomUUID()}.${ext}`;
      const { error: upErr } = await admin.storage.from("covers").upload(path, coverFile, { contentType: coverFile.type, upsert: true });
      if (!upErr) {
        const { data: pub } = admin.storage.from("covers").getPublicUrl(path);
        cover_url = pub.publicUrl;
      }
    }

    const fields = {
      name: String(formData.get("name") || ""),
      sector: String(formData.get("sector") || ""),
      subsector: String(formData.get("subsector") || "") || null,
      city: String(formData.get("city") || ""),
      canton: String(formData.get("canton") || "") || null,
      employee_range: String(formData.get("employee_range") || ""),
      description: String(formData.get("description") || "").slice(0, 3000) || null,
      cover_url,
      logo_url: String(formData.get("logo_url") || "") || null,
      website_url: String(formData.get("website_url") || "") || null,
      linkedin_url: String(formData.get("linkedin_url") || "") || null,
      twitter_url: String(formData.get("twitter_url") || "") || null,
      instagram_url: String(formData.get("instagram_url") || "") || null,
      avg_salary_chf: formData.get("avg_salary_chf") ? (Number(formData.get("avg_salary_chf")) || null) : null,
      is_verified: formData.get("is_verified") === "true",
      tags: String(formData.get("tags") || "").split(",").map(t => t.trim()).filter(t => t.length > 0 && t.length <= 40),
    };

    const { error } = await admin.from("companies").update(fields).eq("id", id);
    if (error) return { error: error.message };

    revalidatePath(`/company/${id}`);
    revalidatePath("/explore");
    revalidatePath("/admin/companies");
    return {};
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function adminAddCompany(formData: FormData): Promise<{ error?: string }> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();

    const fields = {
      name: String(formData.get("name") || ""),
      sector: String(formData.get("sector") || ""),
      subsector: String(formData.get("subsector") || "") || null,
      city: String(formData.get("city") || ""),
      canton: String(formData.get("canton") || "") || null,
      employee_range: String(formData.get("employee_range") || "11-50"),
      description: String(formData.get("description") || "").slice(0, 3000) || null,
      cover_url: String(formData.get("cover_url") || "") || null,
      website_url: String(formData.get("website_url") || "") || null,
      logo_url: (() => {
        const explicit = String(formData.get("logo_url") || "");
        if (explicit) return explicit;
        const site = String(formData.get("website_url") || "");
        if (!site) return null;
        const domain = site.replace(/^https?:\/\/(www\.)?/, "").replace(/\/.*$/, "");
        return domain ? `https://logo.clearbit.com/${domain}` : null;
      })(),
      linkedin_url: String(formData.get("linkedin_url") || "") || null,
      twitter_url: String(formData.get("twitter_url") || "") || null,
      instagram_url: String(formData.get("instagram_url") || "") || null,
      avg_salary_chf: formData.get("avg_salary_chf") ? (Number(formData.get("avg_salary_chf")) || null) : null,
      is_verified: false,
      tags: String(formData.get("tags") || "").split(",").map(t => t.trim()).filter(t => t.length > 0 && t.length <= 40),
      avg_rating: 0, review_count: 0, score: 0,
    };

    const { error } = await supabase.from("companies").insert(fields);
    if (error) return { error: error.message };

    revalidatePath("/explore");
    revalidatePath("/admin/companies");
    return {};
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function adminDeleteCompany(id: string): Promise<{ error?: string }> {
  try {
    await requireAdmin();
    const admin = createAdminClient();
    const { error } = await admin.from("companies").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/explore");
    revalidatePath("/admin/companies");
    return {};
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function getClaims() {
  try {
    await requireAdmin();
    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from("company_claims")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return { error: error.message };

    const claims = data ?? [];

    // For each claim that has a company_id, check if it's already owned
    const companyIds = [...new Set(claims.map(c => c.company_id).filter(Boolean))] as string[];
    let ownerMap: Record<string, string> = {};

    if (companyIds.length > 0) {
      const { data: profiles } = await adminClient
        .from("profiles")
        .select("id, claimed_company_id")
        .in("claimed_company_id", companyIds);

      if (profiles && profiles.length > 0) {
        const usersRes = await adminClient.auth.admin.listUsers({ perPage: 1000 });
        const allUsers = usersRes.data?.users ?? [];
        const emailById = Object.fromEntries(allUsers.map(u => [u.id, u.email ?? ""]));
        for (const p of profiles) {
          if (p.claimed_company_id) ownerMap[p.claimed_company_id] = emailById[p.id] ?? p.id;
        }
      }
    }

    return {
      claims: claims.map(c => ({
        ...c,
        existing_owner: c.company_id ? (ownerMap[c.company_id] ?? null) : null,
      })),
    };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function approveClaim(
  claimId: string,
): Promise<{ error?: string; success?: boolean }> {
  try {
    const { user: adminUser, supabase } = await requireAdmin();
    const adminClient = createAdminClient();

    // Fetch the claim via adminClient (company_claims RLS restricts to own rows)
    const { data: claim, error: claimErr } = await adminClient
      .from("company_claims")
      .select("*")
      .eq("id", claimId)
      .maybeSingle();
    if (claimErr || !claim) return { error: "Demande introuvable." };
    if (claim.status === "approved") return { error: "Déjà approuvée." };

    const companyId: string | null = claim.company_id ?? null;
    if (!companyId) return { error: "Aucune entreprise associée à cette demande." };

    // Mark company as verified (blue badge)
    const { error: verifyErr } = await adminClient
      .from("companies")
      .update({ is_verified: true })
      .eq("id", companyId);
    if (verifyErr) return { error: `Erreur badge entreprise : ${verifyErr.message}` };

    const { error: claimUpdateErr } = await adminClient.from("company_claims").update({
      status: "approved",
      company_id: companyId,
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminUser.id,
    }).eq("id", claimId);
    if (claimUpdateErr) return { error: `Erreur mise à jour demande : ${claimUpdateErr.message}` };

    revalidatePath("/admin/claims");
    revalidatePath("/business/dashboard");
    revalidatePath(`/company/${companyId}`);

    // Notify the company owner by email
    const { data: claimData } = await adminClient
      .from("company_claims")
      .select("work_email, first_name, company_name")
      .eq("id", claimId)
      .maybeSingle();
    if (claimData) {
      await sendClaimApprovedEmail(claimData.work_email, claimData.first_name, claimData.company_name);
    }

    return { success: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function rejectClaim(claimId: string): Promise<{ error?: string; success?: boolean }> {
  try {
    const { user: adminUser } = await requireAdmin();
    const adminClient = createAdminClient();

    // Fetch claim to revoke profile access if fraudulent
    const { data: claim } = await adminClient.from("company_claims").select("company_id, user_id").eq("id", claimId).maybeSingle();

    const { error: rejectErr } = await adminClient.from("company_claims").update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminUser.id,
    }).eq("id", claimId);
    if (rejectErr) return { error: rejectErr.message };

    // Revoke profile link so user loses access
    if (claim?.user_id) {
      await adminClient.from("profiles").update({ claimed_company_id: null }).eq("id", claim.user_id);
    }

    revalidatePath("/admin/claims");
    return { success: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
