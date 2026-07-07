"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient, getUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const [user, supabase] = await Promise.all([getUser(), createClient()]);
  if (!user) throw new Error("Non authentifié");
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (data?.role !== "admin") throw new Error("Accès refusé");
  return { user, supabase };
}

export async function adminUpdateCompany(id: string, formData: FormData): Promise<{ error?: string }> {
  try {
    const { supabase } = await requireAdmin();

    // Handle cover file upload (takes priority over URL field)
    let cover_url: string | null = String(formData.get("cover_url") || "") || null;
    const coverFile = formData.get("cover_file");
    if (coverFile instanceof File && coverFile.size > 0) {
      const ext = coverFile.name.split(".").pop() || "jpg";
      const path = `covers/${id}/${randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("covers").upload(path, coverFile, { contentType: coverFile.type, upsert: true });
      if (!upErr) {
        const { data: pub } = supabase.storage.from("covers").getPublicUrl(path);
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
      description: String(formData.get("description") || "") || null,
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

    const { error } = await supabase.from("companies").update(fields).eq("id", id);
    if (error) return { error: error.message };

    revalidatePath("/", "layout"); // bust tout le cache Next.js
    return {};
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function adminAddCompany(formData: FormData): Promise<{ error?: string }> {
  try {
    const { supabase } = await requireAdmin();

    const fields = {
      name: String(formData.get("name") || ""),
      sector: String(formData.get("sector") || ""),
      subsector: String(formData.get("subsector") || "") || null,
      city: String(formData.get("city") || ""),
      canton: String(formData.get("canton") || "") || null,
      employee_range: String(formData.get("employee_range") || "11-50"),
      description: String(formData.get("description") || "") || null,
      cover_url: String(formData.get("cover_url") || "") || null,
      logo_url: String(formData.get("logo_url") || "") || null,
      website_url: String(formData.get("website_url") || "") || null,
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

    revalidatePath("/", "layout");
    return {};
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function adminDeleteCompany(id: string): Promise<{ error?: string }> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from("companies").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/", "layout");
    return {};
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function getClaims() {
  try {
    const { supabase } = await requireAdmin();
    const { data, error } = await supabase
      .from("company_claims")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return { error: error.message };
    return { claims: data ?? [] };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function approveClaim(claimId: string): Promise<{ error?: string; success?: boolean }> {
  try {
    const { user: adminUser, supabase } = await requireAdmin();
    const adminClient = createAdminClient();

    // Fetch the claim
    const { data: claim, error: claimErr } = await supabase
      .from("company_claims")
      .select("*")
      .eq("id", claimId)
      .maybeSingle();
    if (claimErr || !claim) return { error: "Demande introuvable." };
    if (claim.status === "approved") return { error: "Déjà approuvée." };

    // Find matching company — by company_id if set, otherwise by name
    let companyId: string | null = claim.company_id ?? null;
    if (!companyId) {
      const { data: co } = await supabase
        .from("companies")
        .select("id")
        .ilike("name", claim.company_name)
        .maybeSingle();
      companyId = co?.id ?? null;
    }
    if (!companyId) return { error: `Aucune entreprise trouvée pour "${claim.company_name}". Créez-la d'abord dans le panel admin.` };

    // Check if the work_email already has an account
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existing = existingUsers?.users?.find(u => u.email?.toLowerCase() === claim.work_email.toLowerCase());

    if (existing) {
      // User already exists — just link the company to their profile
      await adminClient.from("profiles").upsert({
        id: existing.id,
        claimed_company_id: companyId,
      }, { onConflict: "id" });
    } else {
      // Invite the user — they'll receive a setup email with magic link
      const { data: invited, error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(
        claim.work_email,
        {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/business/dashboard`,
          data: { company_id: companyId, first_name: claim.first_name, last_name: claim.last_name },
        }
      );
      if (inviteErr) return { error: `Erreur d'invitation : ${inviteErr.message}` };

      // Pre-create their profile with the company link
      if (invited?.user) {
        await adminClient.from("profiles").upsert({
          id: invited.user.id,
          claimed_company_id: companyId,
          full_name: `${claim.first_name} ${claim.last_name}`,
        }, { onConflict: "id" });
      }
    }

    // Mark company as verified + subscribed
    await supabase.from("companies").update({ is_verified: true, is_subscribed: true }).eq("id", companyId);

    // Update claim status
    await supabase.from("company_claims").update({
      status: "approved",
      company_id: companyId,
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminUser.id,
    }).eq("id", claimId);

    revalidatePath("/admin/claims");
    return { success: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function rejectClaim(claimId: string): Promise<{ error?: string; success?: boolean }> {
  try {
    const { user: adminUser, supabase } = await requireAdmin();
    await supabase.from("company_claims").update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminUser.id,
    }).eq("id", claimId);
    revalidatePath("/admin/claims");
    return { success: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
