import { redirect } from "next/navigation";
import { getBusinessCompanyId, getIsAdmin, createClient } from "@/lib/supabase/server";

export default async function ProtectedDashboardLayout({ children }: { children: React.ReactNode }) {
  const [bizCompanyId, isAdmin] = await Promise.all([getBusinessCompanyId(), getIsAdmin()]);
  if (!bizCompanyId) redirect("/business");

  if (!isAdmin) {
    const supabase = await createClient();
    const { data: company } = await supabase
      .from("companies")
      .select("is_subscribed")
      .eq("id", bizCompanyId)
      .maybeSingle();
    if (!company?.is_subscribed) redirect("/business/checkout");
  }

  return <>{children}</>;
}
