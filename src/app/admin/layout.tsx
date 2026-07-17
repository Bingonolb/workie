import { redirect } from "next/navigation";
import { getUser, getIsAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Central admin guard — all /admin/* routes inherit this.
// Individual pages may still fetch their own data but don't need to repeat the auth check.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, isAdmin] = await Promise.all([getUser(), getIsAdmin()]);
  if (!user) redirect("/api/auth/signout?next=/login");
  if (!isAdmin) redirect("/explore");
  return <>{children}</>;
}
