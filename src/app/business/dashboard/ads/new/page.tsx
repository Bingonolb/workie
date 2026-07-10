import { Navbar } from "@/components/Navbar";
import { NewCampaignForm } from "./NewCampaignForm";
import { getUser, createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function NewCampaignPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const [user, supabase, sp] = await Promise.all([getUser(), createClient(), searchParams]);
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

  // Pre-fill values when duplicating a campaign
  const prefill = sp.dup ? {
    headline: sp.headline ?? "",
    format: (sp.format as "square" | "swipe") ?? "square",
    ctaLabel: sp.cta_label ?? "En savoir plus",
    ctaUrl: sp.cta_url ?? "",
    dailyBudget: sp.daily ? Number(sp.daily) : 20,
    imageUrl: sp.image ?? "",
  } : undefined;

  return (
    <div className="page-root">
      <Navbar />
      <NewCampaignForm
        companyName={company?.name ?? ""}
        companyLogo={company?.logo_url ?? null}
        prefill={prefill}
      />
    </div>
  );
}
