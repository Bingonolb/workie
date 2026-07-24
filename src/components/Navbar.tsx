import Link from "next/link";
import { getUser, getIsAdmin, getBusinessCompanyId } from "@/lib/supabase/server";
import { Shield, LayoutDashboard } from "lucide-react";
import { NavLinks } from "./NavLinks";
import { BottomNav } from "./BottomNav";
import { SearchButton } from "./SearchButton";
import { NavBell } from "./NavBell";
import { getUnreadCount } from "@/lib/actions/notifications";

export async function Navbar() {
  const [user, isAdmin, bizCompanyId, unreadCount] = await Promise.all([
    getUser(),
    getIsAdmin(),
    getBusinessCompanyId(),
    getUnreadCount().catch(() => 0),
  ]);
  const isBusiness = !!bizCompanyId;

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

        {/* Desktop nav links */}
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
                <LayoutDashboard size={14} aria-hidden="true" /> Dashboard
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
                    <Shield size={13} aria-hidden="true" /> Admin
                  </Link>
                )}
              </>
            )}
          </div>
        )}

        {/* Right side: search + notifications */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {user && <SearchButton />}
          {user && !isBusiness && (
            <NavBell initialUnread={unreadCount} />
          )}
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

      {user && <BottomNav isBusiness={isBusiness} />}
      <div id="main-content" tabIndex={-1} style={{ outline: "none" }} />
    </>
  );
}
