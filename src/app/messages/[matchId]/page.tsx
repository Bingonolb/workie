import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { ChatWindow } from "@/components/ChatWindow";
import { ExchangeConfirmationBar } from "@/components/ExchangeConfirmationBar";
import { createClient } from "@/lib/supabase/server";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: match } = await supabase
    .from("matches")
    .select(
      "id, user_a_id, user_b_id, status, confirmed_by_a, confirmed_by_b, watch_a:watches!matches_watch_a_id_fkey(brand,model,photos), watch_b:watches!matches_watch_b_id_fkey(brand,model,photos), user_a:profiles!matches_user_a_id_fkey(username,avatar_url), user_b:profiles!matches_user_b_id_fkey(username,avatar_url)"
    )
    .eq("id", matchId)
    .maybeSingle();

  if (!match) notFound();

  const m = match as unknown as {
    id: string;
    user_a_id: string;
    user_b_id: string;
    status: "active" | "completed" | "cancelled";
    confirmed_by_a: boolean;
    confirmed_by_b: boolean;
    watch_a: { brand: string; model: string; photos: string[] };
    watch_b: { brand: string; model: string; photos: string[] };
    user_a: { username: string; avatar_url: string | null };
    user_b: { username: string; avatar_url: string | null };
  };

  const iAmA = m.user_a_id === user!.id;
  const otherWatch = iAmA ? m.watch_b : m.watch_a;
  const otherProfile = iAmA ? m.user_b : m.user_a;
  const myConfirmed = iAmA ? m.confirmed_by_a : m.confirmed_by_b;
  const otherConfirmed = iAmA ? m.confirmed_by_b : m.confirmed_by_a;

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("identity_verified")
    .eq("id", user!.id)
    .maybeSingle();

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("match_id", matchId)
    .order("created_at", { ascending: true });

  return (
    <div className="flex h-screen flex-col bg-neutral-50">
      <Navbar />
      <ExchangeConfirmationBar
        matchId={matchId}
        status={m.status}
        myConfirmed={myConfirmed}
        otherConfirmed={otherConfirmed}
        identityVerified={myProfile?.identity_verified ?? false}
      />
      <ChatWindow
        matchId={matchId}
        currentUserId={user!.id}
        otherUsername={otherProfile?.username ?? "Collectionneur"}
        otherAvatarUrl={otherProfile?.avatar_url}
        otherWatchLabel={`${otherWatch.brand} ${otherWatch.model}`}
        initialMessages={messages ?? []}
      />
    </div>
  );
}
