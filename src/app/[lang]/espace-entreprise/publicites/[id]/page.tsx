import { DetailCampagne } from "@/app/[lang]/(main)/profile/ads/[id]/DetailCampagne";

export default async function PageDetailPub({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DetailCampagne id={id} dansEspace />;
}
