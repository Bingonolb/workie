import { redirect } from "next/navigation";
import { getUser, createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { DiscoverClient } from "./DiscoverClient";
import type { Watch } from "@/lib/types";

export default async function DiscoverPage() {
  const [user, supabase] = await Promise.all([getUser(), createClient()]);
  if (!user) redirect("/login");

  const [{ data: feed }, { count: watchCount }] = await Promise.all([
    supabase.rpc("get_discover_feed", {
      viewer: user.id,
      batch_size: 15,
      before_cursor: new Date().toISOString(),
      brand_filter: null,
      condition_filter: null,
    }),
    supabase.from("watches").select("id", { count: "exact", head: true }).eq("owner_id", user.id),
  ]);

  return (
    <>
      <Navbar />
      <DiscoverClient
        userId={user.id}
        initialFeed={(feed ?? []) as Watch[]}
        hasOwnWatch={(watchCount ?? 0) > 0}
      />
    </>
  );
}
