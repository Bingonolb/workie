import { ListePublicites } from "@/app/[lang]/(main)/profile/ads/ListePublicites";

export default async function PagePublicites({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  return <ListePublicites sp={await searchParams} dansEspace />;
}
