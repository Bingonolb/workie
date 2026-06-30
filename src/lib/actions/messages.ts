"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function sendMessage(matchId: string, content: string) {
  const trimmed = content.trim();
  if (!trimmed) return { error: "Message vide." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu dois être connecté." };

  const { error } = await supabase.from("messages").insert({
    match_id: matchId,
    sender_id: user.id,
    content: trimmed,
  });

  if (error) return { error: error.message };

  revalidatePath(`/messages/${matchId}`);
  return { error: null };
}
