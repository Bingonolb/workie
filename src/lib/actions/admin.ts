"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient, getUser } from "@/lib/supabase/server";

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
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, coverFile, { contentType: coverFile.type, upsert: true });
      if (!upErr) {
        const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
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
      avg_salary_chf: formData.get("avg_salary_chf") ? Number(formData.get("avg_salary_chf")) : null,
      is_verified: formData.get("is_verified") === "true",
      tags: String(formData.get("tags") || "").split(",").map(t => t.trim()).filter(Boolean),
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
      employee_range: String(formData.get("employee_range") || "1-10"),
      description: String(formData.get("description") || "") || null,
      cover_url: String(formData.get("cover_url") || "") || null,
      logo_url: String(formData.get("logo_url") || "") || null,
      website_url: String(formData.get("website_url") || "") || null,
      avg_salary_chf: formData.get("avg_salary_chf") ? Number(formData.get("avg_salary_chf")) : null,
      is_verified: false,
      tags: String(formData.get("tags") || "").split(",").map(t => t.trim()).filter(Boolean),
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
