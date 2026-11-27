import { meta } from "@/i18n/meta";
export const generateMetadata = () => meta({ titre: "pubs.metaStats", indexer: false });
import { redirect } from "next/navigation";
import { ficheGeree } from "@/lib/actions/espaceEntreprise";
import { DetailCampagne } from "./DetailCampagne";

export default async function UserCampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Compte entreprise : le détail s'ouvre dans l'espace, comme la liste.
  if (await ficheGeree()) redirect(`/espace-entreprise/publicites/${encodeURIComponent(id)}`);
  return <DetailCampagne id={id} dansEspace={false} />;
}

