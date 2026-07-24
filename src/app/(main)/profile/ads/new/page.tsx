import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";

import { NewUserCampaignForm } from "./NewUserCampaignForm";

export default async function NewUserAdPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const [user, sp] = await Promise.all([getUser(), searchParams]);
  if (!user) redirect("/login?next=/profile/ads/new");

  return (
    <div className="page-root">
      <main className="page-main-md" style={{ paddingTop: 24, paddingBottom: 48 }}>
        <NewUserCampaignForm
          prefillHeadline={sp.headline}
          prefillFormat={sp.format as "square" | "swipe" | undefined}
          prefillCtaLabel={sp.cta_label}
          prefillCtaUrl={sp.cta_url}
          prefillDaily={sp.daily ? Number(sp.daily) : undefined}
          prefillImage={sp.image}
        />
      </main>
    </div>
  );
}
