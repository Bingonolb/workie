"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Trophy, TrendingUp, Flame, User, LayoutDashboard, Star, Briefcase, Settings } from "lucide-react";

const USER_LINKS = [
  { href: "/explore",   Icon: Compass,    label: "Explorer",    exact: true },
  { href: "/ranking",   Icon: Trophy,     label: "Classement",  exact: false },
  { href: "/salaires",  Icon: TrendingUp, label: "Salaires",    exact: false },
  { href: "/favorites", Icon: Flame,      label: "Favoris",     exact: false },
  { href: "/profile",   Icon: User,       label: "Profil",      exact: false },
];

const BIZ_LINKS = [
  { href: "/explore",                      Icon: Compass,         label: "Explorer",  exact: true },
  { href: "/business/dashboard",           Icon: LayoutDashboard, label: "Dashboard", exact: true },
  { href: "/business/dashboard/reviews",   Icon: Star,            label: "Avis",      exact: false },
  { href: "/business/dashboard/jobs",      Icon: Briefcase,       label: "Offres",    exact: false },
  { href: "/business/dashboard/profile",   Icon: Settings,        label: "Ma fiche",  exact: false },
];

export function BottomNav({ isBusiness }: { isBusiness: boolean }) {
  const pathname = usePathname();
  const links = isBusiness ? BIZ_LINKS : USER_LINKS;

  return (
    <nav className="bottom-nav">
      {links.map(({ href, Icon, label, exact }) => {
        const active = exact
          ? pathname === href
          : pathname === href || pathname.startsWith(href + "/");
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
