import { Navbar } from "@/components/Navbar";
import { NewCampaignForm } from "./NewCampaignForm";
import { getUser, createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function NewCampaignPage() {
  const [user, supabase] = await Promise.all([getUser(), createClient()]);
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("claimed_company_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.claimed_company_id) redirect("/business/dashboard");

  const { data: company } = await supabase
    .from("companies")
    .select("name, logo_url")
    .eq("id", profile.claimed_company_id)
    .maybeSingle();

  return (
    <div className="page-root">
      <Navbar />
      <NewCampaignForm
        companyName={company?.name ?? ""}
        companyLogo={company?.logo_url ?? null}
      />
    </div>
  );
}
