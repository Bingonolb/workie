import Link from "next/link";
import { Compass, MessageCircle, Repeat2, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";

export async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let avatarUrl: string | null = null;
  let username: string | null = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("avatar_url, username").eq("id", user.id).maybeSingle();
    avatarUrl = (data as any)?.avatar_url ?? null;
    username = (data as any)?.username ?? null;
  }

  const initial = (username?.[0] ?? user?.email?.[0] ?? "?").toUpperCase();

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 40,
      background: "rgba(8,8,10,0.92)", backdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(255,255,255,0.07)",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>

        {/* Logo */}
        <Link href="/discover" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
          <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="15" stroke="#c9a84c" strokeWidth="1.5"/>
            <circle cx="16" cy="16" r="2" fill="#c9a84c"/>
            <line x1="16" y1="16" x2="16" y2="7" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="16" y1="16" x2="21" y2="18" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="16" y1="4" x2="16" y2="5.5" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="16" y1="26.5" x2="16" y2="28" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="4" y1="16" x2="5.5" y2="16" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="26.5" y1="16" x2="28" y2="16" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span style={{ color: "#f5f3ee", fontWeight: 700, fontSize: 18, letterSpacing: "-0.03em" }}>
            Watch<span style={{ color: "#c9a84c" }}>Swap</span>
          </span>
        </Link>

        {/* Nav links */}
        <nav style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {[
            { href: "/discover", icon: <Compass size={15}/>, label: "Découvrir" },
            { href: "/matches",  icon: <Repeat2 size={15}/>,  label: "Échanges" },
            { href: "/messages", icon: <MessageCircle size={15}/>, label: "Messages" },
          ].map(({ href, icon, label }) => (
            <Link key={href} href={href} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px", borderRadius: 8,
              fontSize: 14, fontWeight: 500, color: "#6b6b78",
              textDecoration: "none", transition: "color 0.15s",
            }}>
              {icon}{label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <Link href="/watches/new" style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "#c9a84c", color: "#08080a",
            fontWeight: 700, borderRadius: 8, padding: "8px 16px",
            textDecoration: "none", fontSize: 13,
          }}>
            <Plus size={14} strokeWidth={2.5} /> Ajouter une montre
          </Link>

          <Link href="/profile" style={{ textDecoration: "none" }}>
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="avatar" style={{ width: 34, height: 34, borderRadius: 8, objectFit: "cover", border: "2px solid rgba(201,168,76,0.5)", display: "block" }} />
            ) : (
              <div style={{ width: 34, height: 34, borderRadius: 8, background: "#1a1a20", border: "2px solid rgba(201,168,76,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#c9a84c" }}>
                {initial}
              </div>
            )}
          </Link>

          <form action={signOut}>
            <button type="submit" style={{ background: "none", border: "none", fontSize: 13, color: "#6b6b78", cursor: "pointer" }}>
              Déconnexion
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
