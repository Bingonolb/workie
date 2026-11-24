"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Compass, Search, Flame, User, Layers } from "lucide-react";
import { ouvrirRecherche } from "./SearchButton";
import { precharger, CLE_PROFIL, CLE_FAVORIS } from "@/lib/cacheSession";

function BottomNavInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isSwipeActive = pathname === "/explore" && searchParams.get("view") === "swipe";

  const USER_LINKS = [
    { href: "/explore",            Icon: Compass,    label: "Explorer",    active: pathname === "/explore" && !isSwipeActive },
    { href: "/explore?view=swipe", Icon: Layers,     label: "Swipe",       active: isSwipeActive },
    { href: "/favorites",          Icon: Flame,      label: "Favoris",     active: pathname.startsWith("/favorites") },
  ];
  const PROFIL = { href: "/profile", Icon: User, label: "Profil", active: pathname.startsWith("/profile") };

  const handleClick = (href: string, active: boolean) => (e: React.MouseEvent) => {
    // Recherche ouverte : on ne revient pas d'abord sur la page d'en dessous
    // (elle réapparaissait un instant, d'où le flash). La recherche reste
    // affichée, la nouvelle page REMPLACE son entrée d'historique, et la
    // recherche s'efface quand la page est là. Sur l'onglet en cours, fermer suffit.
    if (rechercheOuverte()) {
      e.preventDefault();
      if (active) { fermerRecherche(); return; }
      if (pathname === "/explore" && (href === "/explore" || href === "/explore?view=swipe")) {
        window.dispatchEvent(new CustomEvent("workie:view", { detail: href.includes("swipe") ? "swipe" : "grid" }));
        history.replaceState({}, "", href);
        window.dispatchEvent(new Event("workie:recherche-quitter"));
        return;
      }
      router.replace(href);
      return;
    }
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
        <button key="recherche" type="button" className="bottom-nav-item" onClick={() => { if (rechercheOuverte()) fermerRecherche(); else ouvrirRecherche(); }}
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

// La barre se retire quand le clavier est réellement ouvert, sinon elle
// saute au-dessus de lui.
//
// Le focus seul ne suffit pas : sur téléphone, le champ garde le focus après
// qu'on a rangé le clavier. La barre restait alors cachée, et le premier
// toucher ne faisait que retirer le focus. On exige donc aussi que la zone
// visible ait rétréci (visualViewport), ce qui n'arrive qu'avec un clavier.
// Suivi par événements, jamais par `body:has(:focus)` : ce sélecteur est
// réévalué à chaque changement de la page, des dizaines de fois par seconde
// pendant un swipe.
const SANS_CLAVIER = new Set(["checkbox", "radio", "range", "button", "submit", "file", "reset", "color", "image"]);
function ouvreClavier(el: Element | null) {
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return true;
  if (el instanceof HTMLInputElement) return !SANS_CLAVIER.has(el.type);
  return el instanceof HTMLElement && el.isContentEditable;
}
function useClavier() {
  useEffect(() => {
    const racine = document.documentElement;
    const vv = window.visualViewport;
    let precedent = false;
    const maj = () => {
      const retreci = vv ? window.innerHeight - vv.height * vv.scale > 120 : true;
      const ouvert = retreci && ouvreClavier(document.activeElement);
      if (ouvert !== precedent) { precedent = ouvert; racine.classList.toggle("clavier-ouvert", ouvert); }
    };
    // focusout part avant que le focus suivant soit posé : on relit au tour suivant.
    const sortie = () => setTimeout(maj, 0);
    document.addEventListener("focusin", maj);
    document.addEventListener("focusout", sortie);
    vv?.addEventListener("resize", maj);
    maj();
    return () => {
      document.removeEventListener("focusin", maj);
      document.removeEventListener("focusout", sortie);
      vv?.removeEventListener("resize", maj);
      racine.classList.remove("clavier-ouvert");
    };
  }, []);
}

const rechercheOuverte = () => document.documentElement.classList.contains("recherche-ouverte");
/** Ferme la recherche sur place (même page) : retour qui consomme son entrée d'historique. */
function fermerRecherche() {
  if (history.state?.recherche) history.back();
  else window.dispatchEvent(new Event("workie:recherche-fermer"));
}

export function BottomNav() {
  useClavier();
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
