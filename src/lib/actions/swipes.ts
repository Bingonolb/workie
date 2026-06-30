"use server";

import { createClient } from "@/lib/supabase/server";
import type { Watch } from "@/lib/types";

export interface MatchResult {
  id: string;
  watch_a: Watch;
  watch_b: Watch;
}

export async function recordSwipe(
  targetWatchId: string,
  direction: "like" | "pass" | "superlike"
): Promise<{ error?: string; match?: MatchResult | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu dois être connecté." };

  const { error } = await supabase.from("swipes").insert({
    swiper_id: user.id,
    target_watch_id: targetWatchId,
    direction,
  });

  if (error) {
    // duplicate swipe (already swiped) shouldn't break the UX
    if (error.code === "23505") return { match: null };
    return { error: error.message };
  }

  if (direction === "pass") return { match: null };

  const { data: match } = await supabase
    .from("matches")
    .select(
      "id, created_at, watch_a:watches!matches_watch_a_id_fkey(*), watch_b:watches!matches_watch_b_id_fkey(*)"
    )
    .or(`watch_a_id.eq.${targetWatchId},watch_b_id.eq.${targetWatchId}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return { match: (match as unknown as MatchResult) ?? null };
}

export async function fetchMoreWatches(
  beforeCursor: string,
  filters?: { brand?: string; condition?: string }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu dois être connecté.", watches: [] as Watch[] };

  const { data, error } = await supabase.rpc("get_discover_feed", {
    viewer: user.id,
    batch_size: 15,
    before_cursor: beforeCursor,
    brand_filter: filters?.brand || null,
    condition_filter: filters?.condition || null,
  });

  if (error) return { error: error.message, watches: [] as Watch[] };
  return { watches: (data ?? []) as Watch[] };
}

export async function undoLastSwipe(targetWatchId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu dois être connecté." };

  const { error } = await supabase
    .from("swipes")
    .delete()
    .eq("swiper_id", user.id)
    .eq("target_watch_id", targetWatchId);

  return { error: error?.message };
}
