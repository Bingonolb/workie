import { redirect } from "next/navigation";
import { getBusinessCompanyData } from "@/lib/supabase/server";

export default async function ProtectedDashboardLayout({ children }: { children: React.ReactNode }) {
  const company = await getBusinessCompanyData();
  if (!company) redirect("/business");
  // Subscription check belongs at the page level (CLAUDE.md rule) — not in a streaming layout.
  return <>{children}</>;
}
