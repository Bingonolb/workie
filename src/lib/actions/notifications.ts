"use server";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type NotifiedCompany = {
  id: string;
  name: string;
  sector: string | null;
  city: string | null;
};

export type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  // `new_companies` stores { companies: NotifiedCompany[] }; older types store flat strings.
  data: Record<string, string> & { companies?: NotifiedCompany[] };
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

// notifyNewCompany et notifyFavoriteUsers vivent dans lib/notificationsInternes.ts :
// exportées d'ici, elles étaient appelables par n'importe qui (envoi de fausses
// notifications à tous les membres).
