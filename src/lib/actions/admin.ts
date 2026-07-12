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
    await requireAdmin();
    const admin = createAdminClient();

    // Handle cover file upload (takes priority over URL field)
    let cover_url: string | null = String(formData.get("cover_url") || "") || null;
    const coverFile = formData.get("cover_file");
    if (coverFile instanceof File && coverFile.size > 0) {
      const ext = coverFile.name.split(".").pop() || "jpg";
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
  force = false,
): Promise<{ error?: string; success?: boolean; alreadyOwned?: string }> {
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
    if (!companyId) {
      // Auto-create the company from claim data (new company claim)
      const rawMsg = claim.message ?? "";
      const sectorMatch = rawMsg.match(/Secteur:\s*([^·\n]+)/);
      const cantonMatch = rawMsg.match(/Canton:\s*([^·\n]+)/);
      const cityMatch   = rawMsg.match(/Ville:\s*([^·\n]+)/);

      const website = claim.company_website
        ? (/^https?:\/\//i.test(claim.company_website) ? claim.company_website : `https://${claim.company_website}`)
        : null;

      const { data: newCo, error: createErr } = await adminClient
        .from("companies")
        .insert({
          name: claim.company_name,
          sector: sectorMatch?.[1]?.trim() || "Conseil",
          city:   cityMatch?.[1]?.trim()   || "Suisse",
          canton: cantonMatch?.[1]?.trim() || null,
          website_url:    website,
          employee_range: claim.employee_range || "11-50",
          avg_rating: 0, review_count: 0, score: 0,
          is_verified: false,
        })
        .select("id")
        .maybeSingle();

      if (createErr || !newCo) {
        return { error: `Impossible de créer l'entreprise automatiquement : ${createErr?.message ?? "Erreur inconnue"}` };
      }
      companyId = newCo.id;
    }

    // Check for existing owner
    const { data: existingOwnerProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("claimed_company_id", companyId)
      .maybeSingle();

    if (existingOwnerProfile && !force) {
      // Identify existing owner's email for the admin
      const listResult = await adminClient.auth.admin.listUsers({ perPage: 1000 });
      const users = listResult.data?.users ?? [];
      const ownerEmail = users.find((u: { id: string; email?: string }) => u.id === existingOwnerProfile.id)?.email ?? existingOwnerProfile.id;
      return {
        alreadyOwned: ownerEmail,
        error: `Cette entreprise est déjà revendiquée par ${ownerEmail}. Confirmez le transfert si vous souhaitez remplacer l'accès.`,
      };
    }

    // If forcing a transfer, revoke previous owner's access first
    if (existingOwnerProfile && force) {
      const { error: revokeErr } = await adminClient.from("profiles").update({ claimed_company_id: null }).eq("id", existingOwnerProfile.id);
      if (revokeErr) return { error: `Impossible de révoquer l'accès précédent : ${revokeErr.message}` };
    }

    // Check if the work_email already has an account
    const { data: existingUsers } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    const existing = existingUsers?.users?.find(u => u.email?.toLowerCase() === claim.work_email.toLowerCase());

    if (existing) {
      await adminClient.from("profiles").upsert({
        id: existing.id,
        claimed_company_id: companyId,
      }, { onConflict: "id" });
    } else {
      const { data: invited, error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(
        claim.work_email,
        {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/business/dashboard`,
          data: { company_id: companyId, first_name: claim.first_name, last_name: claim.last_name },
        }
      );
      if (inviteErr) return { error: `Erreur d'invitation : ${inviteErr.message}` };
      if (invited?.user) {
        await adminClient.from("profiles").upsert({
          id: invited.user.id,
          claimed_company_id: companyId,
          full_name: `${claim.first_name} ${claim.last_name}`,
        }, { onConflict: "id" });
      }
    }

    await adminClient.from("companies").update({ is_verified: true, is_subscribed: true }).eq("id", companyId);
    await adminClient.from("company_claims").update({
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
    const { user: adminUser } = await requireAdmin();
    const adminClient = createAdminClient();
    await adminClient.from("company_claims").update({
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
