import { meta } from "@/i18n/meta";
export const generateMetadata = () => meta({ titre: "pubs.metaNouvelle", indexer: false });
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { ficheGeree } from "@/lib/actions/espaceEntreprise";
import { NouvellePub } from "./NouvellePub";

export default async function NewUserAdPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const [user, sp] = await Promise.all([getUser(), searchParams]);
  if (!user) redirect("/login?next=/profile/ads/new");
  // Compte entreprise : la création se fait dans l'espace, préremplissage compris.
  if (await ficheGeree()) {
    const qs = new URLSearchParams(sp).toString();
    redirect(`/espace-entreprise/publicites/nouvelle${qs ? `?${qs}` : ""}`);
  }
  return <NouvellePub sp={sp} userId={user.id} dansEspace={false} />;
}

