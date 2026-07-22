"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const full_name = String(formData.get("full_name") || "").slice(0, 100);
  const city = String(formData.get("city") || "").slice(0, 100);
  const avatarFile = formData.get("avatar");

  let avatar_url: string | undefined;
  if (avatarFile instanceof File && avatarFile.size > 0) {
    const ALLOWED: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
    const ext = ALLOWED[avatarFile.type];
    if (!ext) return { error: "Format d'image non supporté (jpg, png, webp, gif uniquement)." };
    // Delete previous avatar files to avoid accumulation in storage
    const { data: existing } = await supabase.storage.from("avatars").list(user.id);
    if (existing && existing.length > 0) {
      await supabase.storage.from("avatars").remove(existing.map(f => `${user.id}/${f.name}`));
    }
    const path = `${user.id}/${randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, avatarFile, { contentType: avatarFile.type, upsert: true });
    if (!uploadError) {
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      avatar_url = pub.publicUrl;
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: full_name || null,
      city: city || null,
      ...(avatar_url ? { avatar_url } : {}),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/profile");
  return {};
}
