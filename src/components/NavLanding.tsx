"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";
import { useT } from "@/i18n/FournisseurLangue";

/**
 * Le menu des pages publiques (accueil, pages pour les entreprises). Le
 * choix de langue est en bas, dans le pied de page, comme sur la plupart des
 * sites.
 */
export function NavLanding() {
  const t = useT();
  return (
    <nav className="landing-nav" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, background: "var(--bg)", zIndex: 100 }}>
      <Link href="/" aria-label={t("menu.accueil")}><Logo taille={30} /></Link>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <ThemeToggle />
        <Link href="/login" className="nav-login-link" style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid var(--border2)", fontWeight: 600, fontSize: 14, color: "var(--text-muted)", textDecoration: "none" }}>
          {t("menu.connexion")}
        </Link>
        <Link href="/signup" style={{ padding: "9px 18px", borderRadius: 8, fontWeight: 650, fontSize: 14, textDecoration: "none", background: "var(--brand)", color: "#fff" }}>
          {t("menu.inscrire")}
        </Link>
      </div>
    </nav>
  );
}
