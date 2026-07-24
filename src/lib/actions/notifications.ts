"use server";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, string>;
  read: boolean;
  created_at: string;
};

export async function getNotifications(): Promise<{ notifications: Notification[]; unread: number; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { notifications: [], unread: 0 };

    const { data, error } = await supabase
      .from("notifications")
      .select("id, type, title, body, data, read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return { notifications: [], unread: 0, error: error.message };
    const notifications = (data ?? []) as Notification[];
    const unread = notifications.filter(n => !n.read).length;
    return { notifications, unread };
  } catch (e) {
    return { notifications: [], unread: 0, error: (e as Error).message };
  }
}

export const getUnreadCount = cache(async function getUnreadCount(): Promise<number> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false);
    return count ?? 0;
  } catch {
    return 0;
  }
});

export async function markAllRead(): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
  } catch { /* silent */ }
}

export async function markRead(id: string): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("id", id).eq("user_id", user.id);
  } catch { /* silent */ }
}

export async function deleteNotification(id: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { error } = await supabase.from("notifications").delete().eq("id", id).eq("user_id", user.id);
    return !error;
  } catch {
    return false;
  }
}

// Internal: fan-out notifications to all users who favorited a company
// Called from createJobOffer after insert
export async function notifyFavoriteUsers(
  companyId: string,
  companyName: string,
  jobTitle: string,
  jobId: string,
): Promise<void> {
  try {
    const admin = createAdminClient();

    // Find all users who favorited this company
    const { data: favs } = await admin
      .from("favorites")
      .select("user_id")
      .eq("company_id", companyId);

    if (!favs || favs.length === 0) return;

    // Cap fan-out to avoid serverless timeout on very popular companies
    const recipients = favs.slice(0, 500);

    const rows = recipients.map(f => ({
      user_id: f.user_id,
      type: "new_job_offer",
      title: `Nouvelle offre chez ${companyName}`,
      body: jobTitle,
      data: { company_id: companyId, job_id: jobId, company_name: companyName },
      read: false,
    }));

    // Insert in batches of 100 to stay within PostgREST payload limits
    for (let i = 0; i < rows.length; i += 100) {
      await admin.from("notifications").insert(rows.slice(i, i + 100));
    }
  } catch { /* silent — never block job creation */ }
}
