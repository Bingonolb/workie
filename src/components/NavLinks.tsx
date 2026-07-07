"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Flame, User, Trophy } from "lucide-react";

const LINKS = [
  { href: "/explore", icon: <Compass size={15} />, label: "Explorer" },
  { href: "/ranking", icon: <Trophy size={15} />, label: "Classement" },
  { href: "/favorites", icon: <Flame size={15} />, label: "Favoris" },
  { href: "/profile", icon: <User size={15} />, label: "Profil" },
] as const;

export function NavLinks() {
  const pathname = usePathname();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
      {LINKS.map(({ href, icon, label }) => {
        const active = pathname === href || (href !== "/explore" && pathname.startsWith(href));
        return (
          <Link key={href} href={href} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 14px", borderRadius: 8,
            fontSize: 14, fontWeight: active ? 700 : 500,
            color: active ? "var(--text)" : "var(--text-muted)",
            background: active ? "var(--surface2)" : "transparent",
            textDecoration: "none", transition: "all 0.15s",
          }}>
            {icon} {label}
          </Link>
        );
      })}
    </div>
  );
}
