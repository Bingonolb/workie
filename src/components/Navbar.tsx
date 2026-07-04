import Link from "next/link";
import { getUser, createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
import { Flame, Compass, User, LogOut, Trophy, Shield } from "lucide-react";

export async function Navbar() {
  const [user, supabase] = await Promise.all([getUser(), createClient()]);

  let isAdmin = false;
  if (user) {
    const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    isAdmin = data?.role === "admin";
  }

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 40,
      background: "rgba(13,13,19,0.85)", backdropFilter: "blur(16px)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      padding: "0 32px", height: 60,
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <Link href={user ? "/explore" : "/"} style={{ textDecoration: "none" }}>
        <span style={{
          fontSize: 22, fontWeight: 900, letterSpacing: "-0.03em",
          background: "linear-gradient(135deg, #8b5cf6, #f97316)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          workie
        </span>
      </Link>

      {user && (
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {[
            { href: "/explore", icon: <Compass size={15} />, label: "Explorer" },
            { href: "/ranking", icon: <Trophy size={15} />, label: "Classement" },
            { href: "/favorites", icon: <Flame size={15} />, label: "Favoris" },
            { href: "/profile", icon: <User size={15} />, label: "Profil" },
          ].map(({ href, icon, label }) => (
            <Link key={href} href={href} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px", borderRadius: 8,
              fontSize: 14, fontWeight: 500, color: "rgba(240,240,248,0.65)",
              textDecoration: "none",
            }}>
              {icon} {label}
            </Link>
          ))}

          {isAdmin && (
            <Link href="/admin" style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "5px 12px", borderRadius: 8, marginLeft: 4,
              fontSize: 12, fontWeight: 700, color: "#8b5cf6",
              textDecoration: "none",
              background: "rgba(139,92,246,0.12)",
              border: "1px solid rgba(139,92,246,0.25)",
            }}>
              <Shield size={13} /> Admin
            </Link>
          )}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {user ? (
          <form action={signOut}>
            <button type="submit" style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(240,240,248,0.4)", fontSize: 13, fontWeight: 500, padding: "6px 10px", borderRadius: 8,
            }}>
              <LogOut size={14} /> Se déconnecter
            </button>
          </form>
        ) : (
          <>
            <Link href="/login" style={{ fontSize: 14, fontWeight: 500, color: "rgba(240,240,248,0.55)", textDecoration: "none" }}>
              Connexion
            </Link>
            <Link href="/signup" style={{
              fontSize: 13, fontWeight: 700, textDecoration: "none",
              background: "linear-gradient(135deg, #8b5cf6, #f97316)",
              color: "#fff", borderRadius: 8, padding: "8px 16px",
            }}>
              S&apos;inscrire
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
