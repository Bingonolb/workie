import type { Metadata } from "next";
import { meta } from "@/i18n/meta";
import { getNotifications } from "@/lib/actions/notifications";
import { NotificationsClient } from "./NotificationsClient";

export const dynamic = "force-dynamic";

export const generateMetadata = () => meta({ titre: "meta.notificationsTitre", indexer: false });

export default async function NotificationsPage() {
  const { notifications, unread } = await getNotifications();

  return (
    <NotificationsClient
      initialNotifications={notifications}
      initialUnread={unread}
    />
  );
}
