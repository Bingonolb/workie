import { redirect } from "next/navigation";
import { getUser, createClient } from "@/lib/supabase/server";

import { NewUserCampaignForm } from "./NewUserCampaignForm";

export default async function NewUserAdPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const [user, sp] = await Promise.all([getUser(), searchParams]);
  if (!user) redirect("/login?next=/profile/ads/new");

  // Le canton du profil ouvre le ciblage sur une valeur lisible plutôt que sur
  // un formulaire vide qui affiche « toute la Suisse ».
  const supabase = await createClient();
  const { data: profil } = await supabase
    .from("profiles").select("canton").eq("id", user.id).maybeSingle();

  return (
    <div className="page-root">
      <main className="page-main-md" style={{ paddingTop: 24, paddingBottom: 48 }}>
        <NewUserCampaignForm
          prefillHeadline={sp.headline}
          prefillFormat={sp.format as "square" | "swipe" | undefined}
          prefillCtaLabel={sp.cta_label}
          prefillCtaUrl={sp.cta_url}
          prefillImage={sp.image}
          cantonProfil={profil?.canton ?? null}
        />
      </main>
    </div>
  );
}
