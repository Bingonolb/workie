"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Compass, Flame, User, TrendingUp, Layers } from "lucide-react";
import { Suspense } from "react";

function NavLinksInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isSwipe = pathname === "/explore" && searchParams.get("view") === "swipe";

  const LINKS = [
    { href: "/explore",            label: "Explorer",    icon: <Compass size={15} aria-hidden="true" />, active: pathname === "/explore" && !isSwipe },
    { href: "/explore?view=swipe", label: "Swipe",       icon: <Layers  size={15} aria-hidden="true" />, active: isSwipe },
    { href: "/favorites",          label: "Favoris",     icon: <Flame   size={15} aria-hidden="true" />, active: pathname.startsWith("/favorites") },
    { href: "/ranking",            label: "Classement",  icon: <TrendingUp size={15} aria-hidden="true" />, active: pathname.startsWith("/ranking") },
    { href: "/profile",            label: "Profil",      icon: <User    size={15} aria-hidden="true" />, active: pathname.startsWith("/profile") },
  ];

  const handleClick = (href: string, active: boolean) => (e: React.MouseEvent) => {
    if (pathname === "/explore" && (href === "/explore" || href === "/explore?view=swipe")) {
      e.preventDefault();
      const targetView = href.includes("swipe") ? "swipe" : "grid";
      window.dispatchEvent(new CustomEvent("workie:view", { detail: targetView }));
      window.history.pushState({}, "", targetView === "swipe" ? "/explore?view=swipe" : "/explore");
      if (active) window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (active) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
      {LINKS.map(({ href, icon, label, active }) => (
        <Link key={href} href={href} title={label} aria-current={active ? "page" : undefined}
          onClick={handleClick(href, active)}
          style={{
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
      ))}
    </div>
  );
}

export function NavLinks() {
  return (
    <Suspense fallback={null}>
      <NavLinksInner />
    </Suspense>
  );
}
