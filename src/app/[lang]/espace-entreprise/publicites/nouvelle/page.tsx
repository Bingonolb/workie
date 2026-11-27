import { getUser } from "@/lib/supabase/server";
import { NouvellePub } from "@/app/[lang]/(main)/profile/ads/new/NouvellePub";

export default async function PageNouvellePub({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const [user, sp] = await Promise.all([getUser(), searchParams]);
  if (!user) return null;
  return <NouvellePub sp={sp} userId={user.id} dansEspace />;
}
