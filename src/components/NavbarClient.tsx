"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shield } from "lucide-react";
import { NavLinks } from "./NavLinks";
import { BottomNav } from "./BottomNav";
import { SearchButton } from "./SearchButton";
import { precharger, lireCache, ecrireCache, CLE_PROFIL, CLE_FAVORIS, CLE_CONTEXTE } from "@/lib/cacheSession";

type UserCtx = {
  isLoggedIn: boolean;
  isAdmin: boolean;
  penaltyCredits: number;
  unreadCount: number;
};

export function NavbarClient() {
  // Repris de la mémoire s'il y est : la barre s'affiche alors dans le bon
  // état dès le premier rendu, sans attendre le réseau.
  const [ctx, setCtx] = useState<UserCtx | null>(() => lireCache<UserCtx>(CLE_CONTEXTE) ?? null);

  useEffect(() => {
    fetch("/api/user/context")
      .then(r => r.json())
      .then((data: UserCtx) => {
        setCtx(data);
        ecrireCache(CLE_CONTEXTE, data);
        // Mémorisé pour la fiche entreprise : rendue une fois pour tout le
        // monde, elle partait en état visiteur et affichait un flou d'une
        // fraction de seconde avant de se dévoiler. La barre de navigation
        // connaît l'état dès la première page visitée, donc bien avant.
        try { localStorage.setItem("workie_connecte", data.isLoggedIn ? "1" : "0"); } catch { /* sans conséquence */ }

        // Profil et favoris chargés d'avance, dès qu'on sait qui regarde.
        //
        // Ces deux pages sont des coquilles statiques : leur contenu arrive
        // après. Le préchargement n'existait qu'au survol du lien, ce qui ne
        // laisse aucune avance sur un clic rapide — d'où le squelette puis
        // l'apparition brutale des informations, alors même qu'elles étaient
        // déjà connues une seconde plus tôt.
        //
        // Deux requêtes de plus par session, en arrière-plan, contre une
        // arrivée instantanée à chaque visite : le compte est vite fait.
        if (data.isLoggedIn) {
          precharger(CLE_PROFIL, "/api/user/profile");
          precharger(CLE_FAVORIS, "/api/user/favorites");
        }
      })
      .catch(() => setCtx({ isLoggedIn: false, isAdmin: false, penaltyCredits: 0, unreadCount: 0 }));
  }, []);

  const isLoggedIn = ctx?.isLoggedIn ?? false;
  const isAdmin = ctx?.isAdmin ?? false;

  return (
    <>
      <nav style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "var(--nav-bg)",
        borderBottom: "1px solid var(--nav-border)",
        padding: "0 16px", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 8,
      }}>
        <Link href={isLoggedIn ? "/explore" : "/"} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontSize: 20, fontWeight: 900, letterSpacing: "-0.03em",
            background: "linear-gradient(135deg, #8b5cf6, #f97316)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            workie
          </span>
        </Link>

        {isLoggedIn && (
          <div className="nav-links-desktop" style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <NavLinks />
            {isAdmin && (
              <Link href="/admin" style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "5px 12px", borderRadius: 8, marginLeft: 4,
                fontSize: 12, fontWeight: 700, color: "#8b5cf6",
                textDecoration: "none",
                background: "rgba(139,92,246,0.12)",
                border: "1px solid rgba(139,92,246,0.25)",
              }}>
                <Shield size={13} aria-hidden="true" /> Admin
              </Link>
            )}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {isLoggedIn && <SearchButton />}
          {/* Cloche retirée : aucune notification n'a jamais été émise — table vide —
              et un bouton qui ne mène à rien coûte de l'attention. La page et la
              table restent en place, il suffira de rétablir cette ligne. */}
              {/* {isLoggedIn && <NavBell initialUnread={ctx?.unreadCount ?? 0} />} */}
          {!isLoggedIn && ctx !== null && (
            <Link href="/signup" style={{
              fontSize: 13, fontWeight: 700, textDecoration: "none",
              background: "linear-gradient(135deg, #8b5cf6, #f97316)",
              color: "#fff", borderRadius: 8, padding: "7px 14px",
            }}>
              S&apos;inscrire
            </Link>
          )}
        </div>
      </nav>

      {isLoggedIn && <BottomNav />}
      <div id="main-content" tabIndex={-1} style={{ outline: "none" }} />
    </>
  );
}
