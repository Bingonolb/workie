import Link from "next/link";
import { Heart, MessageCircle, Repeat2, User as UserIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let avatarUrl: string | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    avatarUrl = (data as { avatar_url: string | null } | null)?.avatar_url ?? null;
  }

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/discover" className="text-xl font-black tracking-tight">
          <span className="text-brand">Watch</span>Swap
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-neutral-600 md:flex">
          <Link href="/discover" className="hover:text-neutral-900">
            Découvrir
          </Link>
          <Link href="/matches" className="flex items-center gap-1.5 hover:text-neutral-900">
            <Repeat2 size={16} /> Mes échanges
          </Link>
          <Link href="/messages" className="flex items-center gap-1.5 hover:text-neutral-900">
            <MessageCircle size={16} /> Messages
          </Link>
          <Link href="/profile" className="hover:text-neutral-900">
            Profil
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/watches/new"
            className="hidden rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark sm:block"
          >
            + Ajouter une montre
          </Link>
          <Link href="/matches" className="text-neutral-500 hover:text-brand md:hidden">
            <Heart size={20} />
          </Link>
          <Link href="/profile">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt="avatar"
                className="h-9 w-9 rounded-full object-cover ring-2 ring-neutral-200"
              />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-200 text-neutral-500">
                <UserIcon size={18} />
              </span>
            )}
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="text-xs font-medium text-neutral-400 hover:text-brand"
            >
              Déconnexion
            </button>
          </form>
        </div>
      </div>
      <nav className="flex items-center justify-around border-t border-neutral-100 py-2 text-xs font-medium text-neutral-600 md:hidden">
        <Link href="/discover">Découvrir</Link>
        <Link href="/matches">Échanges</Link>
        <Link href="/messages">Messages</Link>
        <Link href="/watches/mine">Mes montres</Link>
      </nav>
    </header>
  );
}
