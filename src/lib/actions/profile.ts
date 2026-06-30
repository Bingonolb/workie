"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionState = { error?: string; success?: boolean } | undefined;

export async function updateProfile(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu dois être connecté." };

  const full_name = String(formData.get("full_name") || "");
  const city = String(formData.get("city") || "");
  const country = String(formData.get("country") || "");
  const bio = String(formData.get("bio") || "");
  const avatarFile = formData.get("avatar");

  let avatar_url: string | undefined;
  if (avatarFile instanceof File && avatarFile.size > 0) {
    const ext = avatarFile.name.split(".").pop() || "jpg";
    const path = `${user.id}/${randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, avatarFile, { contentType: avatarFile.type, upsert: true });
    if (uploadError) return { error: uploadError.message };
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    avatar_url = pub.publicUrl;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: full_name || null,
      city: city || null,
      country: country || null,
      bio: bio || null,
      ...(avatar_url ? { avatar_url } : {}),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  return { success: true };
}
