import { meta } from "@/i18n/meta";
export const generateMetadata = () => meta({ titre: "pubs.metaListe", indexer: false });

import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { ficheGeree } from "@/lib/actions/espaceEntreprise";
import { ListePublicites } from "./ListePublicites";

export default async function UserAdsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const [user, sp] = await Promise.all([getUser(), searchParams]);
  if (!user) redirect("/login?next=/profile/ads");
  // Un compte qui gère une fiche voit ses campagnes dans l'espace entreprise.
  // Les paramètres suivent (retour de Stripe compris) : l'activation s'y fait.
  if (await ficheGeree()) {
    const qs = new URLSearchParams(sp).toString();
    redirect(`/espace-entreprise/publicites${qs ? `?${qs}` : ""}`);
  }
  return <ListePublicites sp={sp} dansEspace={false} />;
}
