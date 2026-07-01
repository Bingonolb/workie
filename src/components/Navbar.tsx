import Link from "next/link";
import { MessageCircle, Repeat2, Watch } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";

export async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let avatarUrl: string | null = null;
  let username: string | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("avatar_url, username")
      .eq("id", user.id)
      .maybeSingle();
    avatarUrl = (data as { avatar_url: string | null; username: string | null } | null)?.avatar_url ?? null;
    username = (data as { avatar_url: string | null; username: string | null } | null)?.username ?? null;
  }

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5">

        {/* Logo */}
        <Link href="/discover" className="flex items-center gap-2 text-xl font-black tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
            <Watch size={16} strokeWidth={2.5} />
          </span>
          <span className="text-foreground">Watch<span className="text-brand">Swap</span></span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden items-center gap-7 text-sm font-medium text-neutral-500 md:flex">
          <Link href="/discover" className="transition hover:text-foreground">Découvrir</Link>
          <Link href="/matches" className="flex items-center gap-1.5 transition hover:text-foreground">
            <Repeat2 size={15} /> Échanges
          </Link>
          <Link href="/messages" className="flex items-center gap-1.5 transition hover:text-foreground">
            <MessageCircle size={15} /> Messages
          </Link>
        </nav>

        {/* Right */}
        <div className="flex items-center gap-3">
          <Link
            href="/watches/new"
            className="hidden rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark sm:block"
          >
            + Ajouter
          </Link>

          <Link href="/profile" className="flex items-center gap-2">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="avatar" className="h-9 w-9 rounded-full object-cover ring-2 ring-brand/30" />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold uppercase text-neutral-500">
                {username?.[0] ?? "?"}
              </span>
            )}
          </Link>

          <form action={signOut}>
            <button type="submit" className="hidden text-xs text-neutral-400 transition hover:text-brand md:block">
              Déco
            </button>
          </form>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="flex items-center justify-around border-t border-neutral-100 py-2 text-xs font-medium text-neutral-500 md:hidden">
        <Link href="/discover" className="flex flex-col items-center gap-0.5 hover:text-brand">
          <Watch size={18} /><span>Découvrir</span>
        </Link>
        <Link href="/matches" className="flex flex-col items-center gap-0.5 hover:text-brand">
          <Repeat2 size={18} /><span>Échanges</span>
        </Link>
        <Link href="/messages" className="flex flex-col items-center gap-0.5 hover:text-brand">
          <MessageCircle size={18} /><span>Messages</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center gap-0.5 hover:text-brand">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-[18px] w-[18px] rounded-full object-cover" />
          ) : (
            <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-neutral-200 text-[8px] font-bold">
              {username?.[0] ?? "?"}
            </span>
          )}
          <span>Profil</span>
        </Link>
      </nav>
    </header>
  );
}
