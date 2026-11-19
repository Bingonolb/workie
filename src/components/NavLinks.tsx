"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Compass, Flame, User, Search, Layers } from "lucide-react";
import { ouvrirRecherche } from "./SearchButton";
import { Suspense } from "react";

function NavLinksInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isSwipe = pathname === "/explore" && searchParams.get("view") === "swipe";

  const LINKS = [
    { href: "/explore",            label: "Explorer",    icon: <Compass size={15} aria-hidden="true" />, active: pathname === "/explore" && !isSwipe },
    { href: "/explore?view=swipe", label: "Swipe",       icon: <Layers  size={15} aria-hidden="true" />, active: isSwipe },
    { href: "/favorites",          label: "Favoris",     icon: <Flame   size={15} aria-hidden="true" />, active: pathname.startsWith("/favorites") },
  ];
  const PROFIL = { href: "/profile", label: "Profil", icon: <User size={15} aria-hidden="true" />, active: pathname.startsWith("/profile") };
  const style = (active: boolean): React.CSSProperties => ({
    display: "flex", alignItems: "center", gap: 5,
    padding: "8px 10px", borderRadius: 8,
    fontSize: 13, fontWeight: active ? 700 : 500,
    color: active ? "var(--text)" : "var(--text-muted)",
    background: active ? "var(--surface2)" : "transparent",
    textDecoration: "none", transition: "all 0.15s",
    minWidth: 40, justifyContent: "center",
    border: "none", cursor: "pointer", fontFamily: "inherit",
  });

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
          style={style(active)}>
          {icon} <span className="nav-label">{label}</span>
        </Link>
      ))}
      <button type="button" title="Recherche" onClick={ouvrirRecherche} style={style(false)}>
        <Search size={15} aria-hidden="true" /> <span className="nav-label">Recherche</span>
      </button>
      <Link href={PROFIL.href} title={PROFIL.label} aria-current={PROFIL.active ? "page" : undefined}
        onClick={handleClick(PROFIL.href, PROFIL.active)} style={style(PROFIL.active)}>
        {PROFIL.icon} <span className="nav-label">{PROFIL.label}</span>
      </Link>
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
