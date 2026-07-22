"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Flame, User, Trophy, TrendingUp } from "lucide-react";

const LINKS = [
  { href: "/explore", icon: <Compass size={16} aria-hidden="true" />, label: "Explorer" },
  { href: "/ranking", icon: <Trophy size={16} aria-hidden="true" />, label: "Classement" },
  { href: "/salaires", icon: <TrendingUp size={16} aria-hidden="true" />, label: "Salaires" },
  { href: "/favorites", icon: <Flame size={16} aria-hidden="true" />, label: "Favoris" },
  { href: "/profile", icon: <User size={16} aria-hidden="true" />, label: "Profil" },
] as const;

export function NavLinks() {
  const pathname = usePathname();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
      {LINKS.map(({ href, icon, label }) => {
        const active = pathname === href || (href !== "/explore" && pathname.startsWith(href));
        return (
          <Link key={href} href={href} title={label} aria-current={active ? "page" : undefined} style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "8px 10px", borderRadius: 8,
            fontSize: 13, fontWeight: active ? 700 : 500,
            color: active ? "var(--text)" : "var(--text-muted)",
            background: active ? "var(--surface2)" : "transparent",
            textDecoration: "none", transition: "all 0.15s",
            minWidth: 40, justifyContent: "center",
          }}>
            {icon} <span className="nav-label">{label}</span>
          </Link>
        );
      })}
    </div>
  );
}
