"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ActionState = { error?: string } | undefined;

export async function createWatch(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu dois être connecté." };

  const brand = String(formData.get("brand") || "").trim();
  const model = String(formData.get("model") || "").trim();
  const yearRaw = String(formData.get("year") || "");
  const condition = String(formData.get("condition") || "");
  const description = String(formData.get("description") || "");
  const city = String(formData.get("city") || "");
  const country = String(formData.get("country") || "");
  const priceRaw = String(formData.get("purchase_price") || "");
  const currency = String(formData.get("currency") || "EUR");
  const hasProof = formData.get("has_proof_of_purchase") === "on";
  const hasCert = formData.get("has_certificate_authenticity") === "on";
  const hasBox = formData.get("has_box") === "on";
  const hasPapers = formData.get("has_papers") === "on";
  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);

  if (!brand || !model || !condition) {
    return { error: "Marque, modèle et état sont requis." };
  }

  const watchId = randomUUID();
  const photoUrls: string[] = [];

  for (const file of files.slice(0, 5)) {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/${watchId}-${randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("watch-photos")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) {
      return { error: `Upload photo échoué : ${uploadError.message}` };
    }
    const { data: pub } = supabase.storage.from("watch-photos").getPublicUrl(path);
    photoUrls.push(pub.publicUrl);
  }

  const { error } = await supabase.from("watches").insert({
    id: watchId,
    owner_id: user.id,
    brand,
    model,
    year: yearRaw ? Number(yearRaw) : null,
    condition,
    description: description || null,
    city: city || null,
    country: country || null,
    photos: photoUrls,
    purchase_price: priceRaw ? Number(priceRaw) : null,
    currency,
    has_proof_of_purchase: hasProof,
    has_certificate_authenticity: hasCert,
    has_box: hasBox,
    has_papers: hasPapers,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/watches/mine");
  revalidatePath("/discover");
  redirect("/watches/mine");
}

export async function updateWatchStatus(watchId: string, status: "available" | "paused" | "swapped") {
  const supabase = await createClient();
  const { error } = await supabase.from("watches").update({ status }).eq("id", watchId);
  if (!error) {
    revalidatePath("/watches/mine");
    revalidatePath("/discover");
  }
  return { error: error?.message };
}

export async function deleteWatch(watchId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("watches").delete().eq("id", watchId);
  if (!error) {
    revalidatePath("/watches/mine");
    revalidatePath("/discover");
  }
  return { error: error?.message };
}
