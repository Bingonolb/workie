import { redirect } from "next/navigation";
import { getBusinessCompanyData, getIsAdmin } from "@/lib/supabase/server";

export default async function ProtectedDashboardLayout({ children }: { children: React.ReactNode }) {
  // getBusinessCompanyData is cache()-wrapped — shares the same DB result as the outer layout
  const [company, isAdmin] = await Promise.all([getBusinessCompanyData(), getIsAdmin()]);
  if (!company) redirect("/business");
  if (!isAdmin && !company.is_subscribed) redirect("/business/checkout");

  return <>{children}</>;
}
