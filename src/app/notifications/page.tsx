import { getNotifications } from "@/lib/actions/notifications";
import { NotificationsClient } from "./NotificationsClient";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const { notifications, unread } = await getNotifications();

  return (
    <NotificationsClient
      initialNotifications={notifications}
      initialUnread={unread}
    />
  );
}
