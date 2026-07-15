import { redirect } from "next/navigation";
import { getUser, createClient } from "@/lib/supabase/server";

export default async function ProtectedDashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, claimed_company_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.claimed_company_id) redirect("/business");

  const { data: company } = await supabase
    .from("companies")
    .select("is_subscribed")
    .eq("id", profile.claimed_company_id)
    .maybeSingle();

  const isAdmin = profile.role === "admin";
  if (!company?.is_subscribed && !isAdmin) redirect("/business/checkout");

  return <>{children}</>;
}
