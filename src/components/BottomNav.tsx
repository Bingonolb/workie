"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Trophy, TrendingUp, Flame, User, LayoutDashboard, Star, Briefcase, BarChart2, Megaphone } from "lucide-react";

const USER_LINKS = [
  { href: "/explore",   Icon: Compass,    label: "Explorer",    exact: true },
  { href: "/ranking",   Icon: Trophy,     label: "Classement",  exact: false },
  { href: "/salaires",  Icon: TrendingUp, label: "Salaires",    exact: false },
  { href: "/favorites", Icon: Flame,      label: "Favoris",     exact: false },
  { href: "/profile",   Icon: User,       label: "Profil",      exact: false },
];

const BIZ_LINKS = [
  { href: "/business/dashboard",               Icon: LayoutDashboard, label: "Dashboard",  exact: true },
  { href: "/business/dashboard/reviews",       Icon: Star,            label: "Avis",       exact: false },
  { href: "/business/dashboard/analytics",     Icon: BarChart2,       label: "Analytics",  exact: false },
  { href: "/business/dashboard/jobs",          Icon: Briefcase,       label: "Jobs",       exact: false },
  { href: "/business/dashboard/ads",           Icon: Megaphone,       label: "Publicités", exact: false },
];

export function BottomNav({ isBusiness }: { isBusiness: boolean }) {
  const pathname = usePathname();
  const links = isBusiness ? BIZ_LINKS : USER_LINKS;

  const handleClick = (href: string, active: boolean) => (e: React.MouseEvent) => {
    if (active) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <nav className="bottom-nav">
      {links.map(({ href, Icon, label, exact }) => {
        const active = exact
          ? pathname === href
          : pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={`bottom-nav-item${active ? " active" : ""}`}
            onClick={handleClick(href, active)}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 1.8} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
