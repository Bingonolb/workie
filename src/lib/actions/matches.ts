"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function confirmExchange(matchId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu dois être connecté." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("identity_verified")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.identity_verified) {
    return { error: "Vérifie ton identité avant de confirmer un échange." };
  }

  const { error } = await supabase.rpc("confirm_exchange", { p_match_id: matchId });
  if (error) return { error: error.message };

  revalidatePath(`/messages/${matchId}`);
  return { error: null };
}
