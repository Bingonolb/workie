import Link from "next/link";
import { getUser, getIsAdmin, getBusinessCompanyId } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
import { LogOut, Shield, LayoutDashboard } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { NavLinks } from "./NavLinks";
import { BottomNav } from "./BottomNav";

export async function Navbar() {
  const [user, isAdmin, bizCompanyId] = await Promise.all([getUser(), getIsAdmin(), getBusinessCompanyId()]);
  const isBusiness = !!bizCompanyId;

  return (
    <>
      <nav style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "var(--nav-bg)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--nav-border)",
        padding: "0 16px", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 8,
      }}>
        {/* Logo */}
        <Link href={isBusiness ? "/business/dashboard" : user ? "/explore" : "/"} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontSize: 20, fontWeight: 900, letterSpacing: "-0.03em",
            background: "linear-gradient(135deg, #8b5cf6, #f97316)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            workie
          </span>
          {isBusiness && (
            <span style={{ fontSize: 10, fontWeight: 800, color: "#8b5cf6", background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 6, padding: "2px 7px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              business
            </span>
          )}
        </Link>

        {/* Desktop nav links — hidden on mobile (bottom nav takes over) */}
        {user && (
          <div className="nav-links-desktop" style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {isBusiness ? (
              <Link href="/business/dashboard" style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 14px", borderRadius: 8,
                fontSize: 13, fontWeight: 700, color: "#8b5cf6",
                textDecoration: "none",
                background: "rgba(139,92,246,0.12)",
                border: "1px solid rgba(139,92,246,0.25)",
              }}>
                <LayoutDashboard size={14} /> Tableau de bord
              </Link>
            ) : (
              <>
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
              </>
            )}
          </div>
        )}

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ThemeToggle />
          {user ? (
            <form action={signOut}>
              <button type="submit" title="Se déconnecter" style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "none", border: "none", cursor: "pointer",
                color: "var(--text-muted)", fontSize: 13, fontWeight: 500, padding: "6px 8px", borderRadius: 8,
              }}>
                <LogOut size={15} />
                <span className="nav-logout-label">Se déconnecter</span>
              </button>
            </form>
          ) : (
            <>
              <Link href="/login" className="nav-login-link" style={{ fontSize: 13, fontWeight: 500, color: "var(--text-muted)", textDecoration: "none", padding: "6px 10px" }}>
                Connexion
              </Link>
              <Link href="/signup" style={{
                fontSize: 13, fontWeight: 700, textDecoration: "none",
                background: "linear-gradient(135deg, #8b5cf6, #f97316)",
                color: "#fff", borderRadius: 8, padding: "7px 14px",
              }}>
                S&apos;inscrire
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Bottom tab bar — mobile only, logged-in users */}
      {user && <BottomNav isBusiness={isBusiness} />}
    </>
  );
}
