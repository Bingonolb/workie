"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Compass, Trophy, Flame, User, LayoutDashboard, Star, Briefcase, BarChart2, Megaphone, Layers } from "lucide-react";

const BIZ_LINKS = [
  { href: "/business/dashboard",           Icon: LayoutDashboard, label: "Dashboard" },
  { href: "/business/dashboard/reviews",   Icon: Star,            label: "Avis" },
  { href: "/business/dashboard/analytics", Icon: BarChart2,       label: "Analytics" },
  { href: "/business/dashboard/jobs",      Icon: Briefcase,       label: "Jobs" },
  { href: "/business/dashboard/ads",       Icon: Megaphone,       label: "Publicités" },
];

function BottomNavInner({ isBusiness }: { isBusiness: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isSwipeActive = pathname === "/explore" && searchParams.get("view") === "swipe";

  if (isBusiness) {
    return (
      <nav className="bottom-nav">
        {BIZ_LINKS.map(({ href, Icon, label }) => {
          const active = pathname === href || (href !== "/business/dashboard" && pathname.startsWith(href));
          return (
            <Link key={href} href={href} className={`bottom-nav-item${active ? " active" : ""}`} aria-current={active ? "page" : undefined}>
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  const USER_LINKS = [
    { href: "/explore",            Icon: Compass, label: "Explorer",   active: pathname === "/explore" && !isSwipeActive },
    { href: "/explore?view=swipe", Icon: Layers,  label: "Swipe",      active: isSwipeActive },
    { href: "/favorites",          Icon: Flame,   label: "Favoris",    active: pathname.startsWith("/favorites") },
    { href: "/ranking",            Icon: Trophy,  label: "Classement", active: pathname.startsWith("/ranking") },
    { href: "/profile",            Icon: User,    label: "Profil",     active: pathname.startsWith("/profile") },
  ];

  const handleClick = (active: boolean) => (e: React.MouseEvent) => {
    if (active) { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }
  };

  return (
    <nav className="bottom-nav">
      {USER_LINKS.map(({ href, Icon, label, active }) => (
        <Link
          key={href}
          href={href}
          className={`bottom-nav-item${active ? " active" : ""}`}
          onClick={handleClick(active)}
          aria-current={active ? "page" : undefined}
        >
          <Icon size={22} strokeWidth={active ? 2.5 : 1.8} aria-hidden="true" />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}

export function BottomNav({ isBusiness }: { isBusiness: boolean }) {
  return (
    <Suspense fallback={
      <nav className="bottom-nav" aria-hidden="true">
        {[Compass, Layers, Flame, Trophy, User].map((Icon, i) => (
          <span key={i} className="bottom-nav-item" style={{ opacity: 0.4 }}>
            <Icon size={22} strokeWidth={1.8} />
          </span>
        ))}
      </nav>
    }>
      <BottomNavInner isBusiness={isBusiness} />
    </Suspense>
  );
}
