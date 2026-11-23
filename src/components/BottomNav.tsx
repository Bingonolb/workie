"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Compass, Search, Flame, User, Layers } from "lucide-react";
import { ouvrirRecherche } from "./SearchButton";
import { precharger, CLE_PROFIL, CLE_FAVORIS } from "@/lib/cacheSession";

function BottomNavInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isSwipeActive = pathname === "/explore" && searchParams.get("view") === "swipe";

  const USER_LINKS = [
    { href: "/explore",            Icon: Compass,    label: "Explorer",    active: pathname === "/explore" && !isSwipeActive },
    { href: "/explore?view=swipe", Icon: Layers,     label: "Swipe",       active: isSwipeActive },
    { href: "/favorites",          Icon: Flame,      label: "Favoris",     active: pathname.startsWith("/favorites") },
  ];
  const PROFIL = { href: "/profile", Icon: User, label: "Profil", active: pathname.startsWith("/profile") };

  const handleClick = (href: string, active: boolean) => (e: React.MouseEvent) => {
    // La recherche ouverte se ferme d'abord : le bouton mène là où il dit.
    const rechercheOuverte = !!document.querySelector(".recherche-globale");
    if (rechercheOuverte) window.dispatchEvent(new Event("workie:recherche-fermer"));
    if (rechercheOuverte && active) { e.preventDefault(); return; }
    if (pathname === "/explore" && (href === "/explore" || href === "/explore?view=swipe")) {
      e.preventDefault();
      const targetView = href.includes("swipe") ? "swipe" : "grid";
      const isSameView = active;
      const targetUrl = targetView === "swipe" ? "/explore?view=swipe" : "/explore";
      if (isSameView) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      window.dispatchEvent(new CustomEvent("workie:view", { detail: targetView }));
      window.history.pushState({}, "", targetUrl);
      return;
    }
    if (active) { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }
  };

  const prechargerCible = (href: string) => {
    if (href === "/profile") precharger(CLE_PROFIL, "/api/user/profile");
    else if (href === "/favorites") precharger(CLE_FAVORIS, "/api/user/favorites");
  };

  return (
    <nav className="bottom-nav">
      {[...USER_LINKS, null, PROFIL].map((l) => l === null ? (
        <button key="recherche" type="button" className="bottom-nav-item" onClick={() => document.querySelector(".recherche-globale") ? window.dispatchEvent(new Event("workie:recherche-fermer")) : ouvrirRecherche()}
          style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", color: "inherit" }}>
          <Search size={22} strokeWidth={1.8} aria-hidden="true" />
          <span>Recherche</span>
        </button>
      ) : (({ href, Icon, label, active }) => (
        <Link
          key={href}
          href={href}
          className={`bottom-nav-item${active ? " active" : ""}`}
          onClick={handleClick(href, active)}
          // Le contenu part au survol, ou au premier contact du doigt sur
          // mobile. Le temps que le doigt se lève et que la page s'affiche, la
          // réponse est déjà là — la page n'a plus rien à attendre.
          onPointerEnter={() => prechargerCible(href)}
          onTouchStart={() => prechargerCible(href)}
          aria-current={active ? "page" : undefined}
        >
          <Icon size={22} strokeWidth={active ? 2.5 : 1.8} aria-hidden="true" />
          <span>{label}</span>
        </Link>
      ))(l))}
    </nav>
  );
}

export function BottomNav() {
  return (
    <Suspense fallback={
      <nav className="bottom-nav" aria-hidden="true">
        {[Compass, Layers, Flame, Search, User].map((Icon, i) => (
          <span key={i} className="bottom-nav-item" style={{ opacity: 0.4 }}>
            <Icon size={22} strokeWidth={1.8} />
          </span>
        ))}
      </nav>
    }>
      <BottomNavInner />
    </Suspense>
  );
}
