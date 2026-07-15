import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";

export default async function NotificationsLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/auth/login?next=/notifications");
  return <>{children}</>;
}
