"use client";

import { useT } from "@/i18n/FournisseurLangue";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Compass, Flame, User, Search, Layers, Building2 } from "lucide-react";
import { ouvrirRecherche } from "./SearchButton";
import { Suspense } from "react";

function NavLinksInner({ entreprise = false }: { entreprise?: boolean }) {
  const t = useT();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isSwipe = pathname === "/explore" && searchParams.get("view") === "swipe";

  const LINKS = [
    { href: "/explore",            label: t("menu.explorer"), icon: <Compass size={15} aria-hidden="true" />, active: pathname === "/explore" && !isSwipe },
    { href: "/explore?view=swipe", label: t("menu.swipe"), icon: <Layers  size={15} aria-hidden="true" />, active: isSwipe },
    { href: "/favorites",          label: t("menu.favoris"), icon: <Flame   size={15} aria-hidden="true" />, active: pathname.startsWith("/favorites") },
  ];
  // Pour un compte entreprise, l'espace entreprise prend la place du profil :
  // c'est là qu'il travaille. Le profil passe dans la pastille de droite.
  const sansLangue = pathname.replace(/^\/de(?=\/|$)/, "") || "/";
  const PROFIL = entreprise
    ? { href: "/espace-entreprise", label: t("menu.entreprise"), icon: <Building2 size={15} aria-hidden="true" />, active: sansLangue.startsWith("/espace-entreprise") }
    : { href: "/profile", label: t("menu.profil"), icon: <User size={15} aria-hidden="true" />, active: sansLangue.startsWith("/profile") };
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
      <button type="button" title={t("menu.recherche")} onClick={ouvrirRecherche} style={style(false)}>
        <Search size={15} aria-hidden="true" /> <span className="nav-label">{t("menu.recherche")}</span>
      </button>
      <Link href={PROFIL.href} title={PROFIL.label} aria-current={PROFIL.active ? "page" : undefined}
        onClick={handleClick(PROFIL.href, PROFIL.active)} style={style(PROFIL.active)}>
        {PROFIL.icon} <span className="nav-label">{PROFIL.label}</span>
      </Link>
    </div>
  );
}

export function NavLinks({ entreprise = false }: { entreprise?: boolean }) {
  return (
    <Suspense fallback={null}>
      <NavLinksInner entreprise={entreprise} />
    </Suspense>
  );
}
