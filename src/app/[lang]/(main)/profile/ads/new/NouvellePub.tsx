
import { redirect } from "next/navigation";
import { getUser, createClient } from "@/lib/supabase/server";
import { ficheGeree } from "@/lib/actions/espaceEntreprise";

import { NewUserCampaignForm } from "./NewUserCampaignForm";

/** Le formulaire de création, dans le profil ou dans l'espace entreprise. */
export async function NouvellePub({ sp, userId, dansEspace }: { sp: Record<string, string>; userId: string; dansEspace: boolean }) {

  // Le canton du profil ouvre le ciblage sur une valeur lisible plutôt que sur
  // un formulaire vide qui affiche « toute la Suisse ».
  const supabase = await createClient();
  const { data: profil } = await supabase
    .from("profiles").select("canton").eq("id", userId).maybeSingle();

  const formulaire = (
        <NewUserCampaignForm
          prefillHeadline={sp.headline}
          prefillFormat={sp.format as "square" | "swipe" | undefined}
          prefillCtaLabel={sp.cta_label}
          prefillCtaUrl={sp.cta_url}
          prefillImage={sp.image}
          cantonProfil={profil?.canton ?? null}
          retour={dansEspace ? "/espace-entreprise/publicites" : "/profile/ads"}
        />
  );
  return dansEspace ? formulaire : (
    <div className="page-root">
      <main className="page-main-md" style={{ paddingTop: 24, paddingBottom: 48 }}>{formulaire}</main>
    </div>
  );
}
