import Link from "next/link";
import { getUser, getIsAdmin } from "@/lib/supabase/server";
import { Shield } from "lucide-react";
import { NavLinks } from "./NavLinks";
import { BottomNav } from "./BottomNav";
import { SearchButton } from "./SearchButton";
import { getUnreadCount } from "@/lib/actions/notifications";
import { Logo } from "@/components/Logo";

export async function Navbar() {
  const [user, isAdmin, unreadCount] = await Promise.all([
    getUser(),
    getIsAdmin(),
    getUnreadCount().catch(() => 0),
  ]);

  return (
    <>
      <nav style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "var(--nav-bg)",
        borderBottom: "1px solid var(--nav-border)",
        padding: "0 16px", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 8,
      }}>
        {/* Logo */}
        <Link href={user ? "/explore" : "/"} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
          <Logo taille={20} />
        </Link>

        {/* Desktop nav links */}
        {user && (
          <div className="nav-links-desktop" style={{ display: "flex", alignItems: "center", gap: 4 }}>
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
                <Shield size={13} aria-hidden="true" /> Admin
              </Link>
            )}
          </div>
        )}

        {/* Right side: search + notifications */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {user && <SearchButton />}
          {/* Cloche retirée : aucune notification n'a jamais été émise — table vide —
              et un bouton qui ne mène à rien coûte de l'attention. La page et la
              table restent en place, il suffira de rétablir cette ligne. */}
              {/* {user && <NavBell initialUnread={unreadCount} />} */}
          {!user && (
            <Link href="/signup" style={{
              fontSize: 13, fontWeight: 700, textDecoration: "none",
              background: "linear-gradient(135deg, #8b5cf6, #f97316)",
              color: "#fff", borderRadius: 8, padding: "7px 14px",
            }}>
              S&apos;inscrire
            </Link>
          )}
        </div>
      </nav>

      {user && <BottomNav />}
      <div id="main-content" tabIndex={-1} style={{ outline: "none" }} />
    </>
  );
}
