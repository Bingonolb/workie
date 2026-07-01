import Link from "next/link";
import { Bell, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";
import { signOut } from "@/lib/actions/auth";

export async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let avatarUrl: string | null = null;
  let username: string | null = null;

  if (user) {
    const getProfile = unstable_cache(
      async () => {
        const { data } = await supabase.from("profiles").select("avatar_url, username").eq("id", user.id).maybeSingle();
        return data as { avatar_url: string | null; username: string | null } | null;
      },
      [`profile-${user.id}`],
      { revalidate: 60 }
    );
    const profile = await getProfile();
    avatarUrl = profile?.avatar_url ?? null;
    username = profile?.username ?? null;
  }

  const initial = (username?.[0] ?? user?.email?.[0] ?? "?").toUpperCase();

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 40,
      background: "#ffffff",
      borderBottom: "1px solid #e8e8e8",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", height: 64, display: "flex", alignItems: "center", gap: 40 }}>

        {/* Logo */}
        <Link href="/discover" style={{ textDecoration: "none", fontWeight: 800, fontSize: 20, letterSpacing: "-0.03em", color: "#111", flexShrink: 0 }}>
          Watch<span style={{ color: "#e8445a" }}>Swap</span>
        </Link>

        {/* Nav */}
        <nav style={{ display: "flex", alignItems: "center", gap: 0, flex: 1 }}>
          {[
            { href: "/discover", label: "Découvrir" },
            { href: "/matches",  label: "Mes échanges" },
            { href: "/messages", label: "Messages" },
            { href: "/profile",  label: "Profil" },
          ].map(({ href, label }) => (
            <Link key={href} href={href} style={{
              padding: "0 20px", height: 64, display: "flex", alignItems: "center",
              fontSize: 14, fontWeight: 500, color: "#555", textDecoration: "none",
              borderBottom: "2px solid transparent",
              transition: "color 0.15s",
            }}>
              {label}
            </Link>
          ))}
        </nav>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
          <Link href="/watches/new" style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "#e8445a", color: "#fff",
            fontWeight: 700, borderRadius: 8, padding: "8px 16px",
            textDecoration: "none", fontSize: 13,
          }}>
            <Plus size={14} strokeWidth={2.5} /> Ajouter
          </Link>

          <button style={{ background: "none", border: "none", cursor: "pointer", color: "#888", display: "flex", alignItems: "center" }}>
            <Bell size={20} />
          </button>

          <Link href="/profile" style={{ textDecoration: "none" }}>
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="avatar" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", display: "block" }} />
            ) : (
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "linear-gradient(135deg, #e8445a, #ff7a8a)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 700, color: "#fff",
              }}>
                {initial}
              </div>
            )}
          </Link>

          <form action={signOut}>
            <button type="submit" style={{ background: "none", border: "none", fontSize: 13, color: "#aaa", cursor: "pointer" }}>
              Déco
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
