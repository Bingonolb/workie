import { redirect } from "next/navigation";
import { getIsAdmin } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { AdminAdsClient } from "./AdminAdsClient";

export default async function AdminAdsPage() {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) redirect("/");

  return (
    <div className="page-root">
      <Navbar />
      <AdminAdsClient />
    </div>
  );
}
