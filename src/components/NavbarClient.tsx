"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shield } from "lucide-react";
import { NavLinks } from "./NavLinks";
import { BottomNav } from "./BottomNav";
import { SearchButton } from "./SearchButton";
import { NavBell } from "./NavBell";

type UserCtx = {
  isLoggedIn: boolean;
  isAdmin: boolean;
  penaltyCredits: number;
};

export function NavbarClient() {
  const [ctx, setCtx] = useState<UserCtx | null>(null);

  useEffect(() => {
    fetch("/api/user/context")
      .then(r => r.json())
      .then((data: UserCtx) => setCtx(data))
      .catch(() => setCtx({ isLoggedIn: false, isAdmin: false, penaltyCredits: 0 }));
  }, []);

  const isLoggedIn = ctx?.isLoggedIn ?? false;
  const isAdmin = ctx?.isAdmin ?? false;

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
        <Link href={isLoggedIn ? "/explore" : "/"} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontSize: 20, fontWeight: 900, letterSpacing: "-0.03em",
            background: "linear-gradient(135deg, #8b5cf6, #f97316)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            workie
          </span>
        </Link>

        {isLoggedIn && (
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

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {isLoggedIn && <SearchButton />}
          {isLoggedIn && <NavBell initialUnread={0} />}
          {!isLoggedIn && ctx !== null && (
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

      {isLoggedIn && <BottomNav />}
      <div id="main-content" tabIndex={-1} style={{ outline: "none" }} />
    </>
  );
}
