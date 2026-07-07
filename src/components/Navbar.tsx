import Link from "next/link";
import { getUser, getIsAdmin } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
import { LogOut, Shield } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { NavLinks } from "./NavLinks";

export async function Navbar() {
  const [user, isAdmin] = await Promise.all([getUser(), getIsAdmin()]);

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 40,
      background: "var(--nav-bg)", backdropFilter: "blur(16px)",
      borderBottom: "1px solid var(--nav-border)",
      padding: "0 16px", height: 60,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 8,
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
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <NavLinks />
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

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <ThemeToggle />
        {user ? (
          <form action={signOut}>
            <button type="submit" style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "none", border: "none", cursor: "pointer",
              color: "var(--text-muted)", fontSize: 13, fontWeight: 500, padding: "6px 10px", borderRadius: 8,
            }}>
              <LogOut size={14} /> Se déconnecter
            </button>
          </form>
        ) : (
          <>
            <Link href="/login" style={{ fontSize: 14, fontWeight: 500, color: "var(--text-muted)", textDecoration: "none" }}>
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
