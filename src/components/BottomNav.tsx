"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Trophy, TrendingUp, Flame, User, LayoutDashboard } from "lucide-react";

const LINKS = [
  { href: "/explore",   Icon: Compass,    label: "Explorer" },
  { href: "/ranking",   Icon: Trophy,     label: "Classement" },
  { href: "/salaires",  Icon: TrendingUp, label: "Salaires" },
  { href: "/favorites", Icon: Flame,      label: "Favoris" },
  { href: "/profile",   Icon: User,       label: "Profil" },
];

export function BottomNav({ isBusiness }: { isBusiness: boolean }) {
  const pathname = usePathname();
  const links = isBusiness
    ? [{ href: "/business/dashboard", Icon: LayoutDashboard, label: "Dashboard" }]
    : LINKS;

  return (
    <nav className="bottom-nav">
      {links.map(({ href, Icon, label }) => {
        const active = pathname === href || (href !== "/explore" && pathname.startsWith(href));
        return (
          <Link key={href} href={href} className={`bottom-nav-item${active ? " active" : ""}`}>
            <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
