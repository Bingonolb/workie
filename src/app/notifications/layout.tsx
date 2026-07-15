import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";

export default async function NotificationsLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/auth/login?next=/notifications");
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
